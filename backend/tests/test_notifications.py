import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.models.domain import (
    Incident,
    LocationInfo,
    Coordinates,
    VictimEstimate,
    ReverseSOSRequest,
    BroadcastRequest
)
from app.models.enums import (
    IncidentStatus,
    HazardType,
    MicroEnvironmentTag,
    NotificationChannel,
    NotificationStatus,
    AdvisoryType,
    AuditActionType
)
from app.clustering.engine import cluster_engine
from app.audit.manager import audit_manager
from app.notifications.templates import AdvisoryTemplateEngine, ADVISORY_TEMPLATES
from app.notifications.engine import notification_engine, NotificationEngine

client = TestClient(app)

def test_multilingual_template_rendering():
    """
    Verify multi-lingual template engine renders accurate micro-guidance in
    English, Hindi Devanagari, and Hinglish.
    """
    # 1. Boat Inbound Template
    rendered = AdvisoryTemplateEngine.render_advisory(
        advisory_type=AdvisoryType.BOAT_INBOUND,
        location_str="Bandra East Ward 12",
        resource_id="BOAT-RESCUE-07",
        eta_min=12
    )
    assert "BOAT-RESCUE-07" in rendered["EN"]
    assert "12 minutes" in rendered["EN"]
    assert "BOAT-RESCUE-07" in rendered["HI"]
    assert "12 मिनट" in rendered["HI"]
    assert "BOAT-RESCUE-07" in rendered["HINGLISH"]
    assert "12 mins" in rendered["HINGLISH"]

    # 2. Water Contamination Warning
    contam = AdvisoryTemplateEngine.render_advisory(
        advisory_type=AdvisoryType.WATER_CONTAMINATION,
        location_str="Kurla West",
        shelter_str="Municipal Camp #3"
    )
    assert "DO NOT DRINK" in contam["EN"]
    assert "दूषित" in contam["HI"]
    assert "contaminate" in contam["HINGLISH"]

def test_reverse_sos_targeting_and_audit_logging():
    """
    Verify Reverse SOS creates targeted outbound records for an incident cluster
    and immutably records the event in the SHA-256 audit log.
    """
    now = datetime.now(timezone.utc)
    inc = Incident(
        incident_id="INC-NOTIF-01",
        category=HazardType.FLOOD,
        micro_environment=MicroEnvironmentTag.ROOFTOP_STRANDED,
        location=LocationInfo(raw_text="Near Kalina Bridge", ward="WARD-12", lat=19.07, lng=72.87),
        victim_estimate=VictimEstimate(min_victims=4, max_victims=6, best_guess=5),
        created_at=now,
        updated_at=now
    )
    cluster_engine.add_incident(inc)


    req = ReverseSOSRequest(
        incident_id="INC-NOTIF-01",
        advisory_type=AdvisoryType.BOAT_INBOUND,
        channels=[NotificationChannel.SMS, NotificationChannel.VOICE_IVR],
        target_radius_km=1.0,
        eta_min=10,
        resource_id="BOAT-01",
        commander_id="COMMANDER-ALPHA",
        operator_rationale="Boat en-route to rooftop stranded victims, advising signal deployment."
    )

    records = notification_engine.send_reverse_sos(req)
    assert len(records) == 2
    assert records[0].channel == NotificationChannel.SMS
    assert records[0].status == NotificationStatus.DELIVERED
    assert "BOAT-01" in records[0].message_text_en
    assert records[1].channel == NotificationChannel.VOICE_IVR

    # Verify cryptographic audit log entry
    audit_chain = audit_manager.get_chain()
    latest_audit = audit_chain[-1]
    assert latest_audit.action_type == AuditActionType.REVERSE_SOS_SENT
    assert latest_audit.operator_id == "COMMANDER-ALPHA"
    assert latest_audit.operator_rationale == "Boat en-route to rooftop stranded victims, advising signal deployment."

def test_geofenced_broadcast_radius_and_channels():
    """
    Verify geofenced broadcast estimates affected ward population and dispatches
    multi-channel cell broadcast, SMS, and radio messages.
    """
    req = BroadcastRequest(
        ward="WARD-09-DHARAVI",
        radius_km=2.0,
        advisory_type=AdvisoryType.FLOOD_RISING,
        channels=[NotificationChannel.CELL_BROADCAST, NotificationChannel.RADIO],
        commander_id="COMMANDER-BETA",
        operator_rationale="Monsoon surge breach upstream, warning entire ward."
    )

    records = notification_engine.send_geofenced_broadcast(req)
    assert len(records) == 2
    assert records[0].channel == NotificationChannel.CELL_BROADCAST
    assert records[0].target_recipient_count > 10000 # Population ~ pi * 4 * 1200
    assert records[1].channel == NotificationChannel.RADIO

def test_mandatory_operator_rationale_enforcement():
    """
    Verify API strictly rejects Reverse SOS and public broadcasts without mandatory rationale.
    """
    # Empty rationale on Reverse SOS
    resp1 = client.post("/notifications/reverse-sos", json={
        "incident_id": "INC-01",
        "advisory_type": "BOAT_INBOUND",
        "channels": ["SMS"],
        "operator_rationale": "  "
    })
    assert resp1.status_code == 422

    # Empty rationale on public Broadcast
    resp2 = client.post("/notifications/broadcast", json={
        "ward": "WARD-12",
        "radius_km": 1.0,
        "advisory_type": "FLOOD_RISING",
        "channels": ["CELL_BROADCAST"],
        "operator_rationale": ""
    })
    assert resp2.status_code == 422

def test_notifications_api_endpoints():
    """
    Verify full suite of notification API endpoints: reverse-sos, broadcast,
    summary, history, templates.
    """
    # 1. Reverse SOS via API
    resp_sos = client.post("/notifications/reverse-sos", json={
        "incident_id": "INC-API-TEST",
        "advisory_type": "EVACUATION_ORDER",
        "channels": ["SMS", "WEB_PUSH"],
        "target_radius_km": 1.5,
        "commander_id": "CHIEF-EOC",
        "operator_rationale": "Mandatory evacuation ordered due to dam water release."
    })
    assert resp_sos.status_code == 201
    sos_data = resp_sos.json()
    assert len(sos_data) == 2
    assert sos_data[0]["status"] == "DELIVERED"

    # 2. Get Summary
    resp_sum = client.get("/notifications/summary")
    assert resp_sum.status_code == 200
    summary = resp_sum.json()
    assert summary["total_broadcasts_sent"] >= 2
    assert summary["total_recipients_reached"] > 0
    assert "SMS" in summary["channels_breakdown"]

    # 3. Get History
    resp_hist = client.get("/notifications/history?limit=10")
    assert resp_hist.status_code == 200
    history = resp_hist.json()
    assert len(history) >= 2

    # 4. Get Templates
    resp_tmpl = client.get("/notifications/templates")
    assert resp_tmpl.status_code == 200
    templates = resp_tmpl.json()
    assert "FLOOD_RISING" in templates
    assert "HI" in templates["FLOOD_RISING"]
