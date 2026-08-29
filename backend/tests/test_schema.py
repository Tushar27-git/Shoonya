import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app, raw_reports_store, incidents_store
from app.models.enums import (
    IncidentStatus,
    LocationPrecision,
    SourceChannel,
    MicroEnvironmentTag,
    VulnerabilityTag,
    HazardType,
    VenueType,
    VenueStatus,
    ResourceType,
    ResourceStatus,
    RoadStatus,
    MergeReviewState,
    PlanQuality,
)
from app.models.domain import (
    Coordinates,
    LocationInfo,
    VictimEstimate,
    ConfidenceFactors,
    PriorityFactors,
    RawReport,
    Incident,
    Venue,
    Resource,
    RoadSegment,
    AuditRecord,
    ReportIngestRequest,
    DispatchApproveRequest,
    AssignmentDetail,
)
from app.config import settings

client = TestClient(app)

def test_config_invariants():
    """Verify load-bearing mathematical constants in settings."""
    assert settings.CONFIDENCE_MIN_FLOOR == 0.4
    assert settings.WEIGHT_SEVERITY == 0.35
    assert settings.WEIGHT_VULNERABILITY == 0.25
    assert settings.WEIGHT_VICTIM_COUNT == 0.20
    assert settings.WEIGHT_RECENCY == 0.10
    assert settings.WEIGHT_ACCESSIBILITY == 0.10
    assert settings.MERGE_THRESHOLD_AUTO == 0.85
    assert settings.MERGE_THRESHOLD_REVIEW == 0.55
    assert 3.0 <= settings.SOLVER_TIMEOUT_SECONDS <= 5.0

def test_victim_estimate_validator():
    """Verify bounds enforcement on victim estimates."""
    ve = VictimEstimate(min_victims=5, max_victims=10, best_guess=8)
    assert ve.min_victims == 5
    assert ve.max_victims == 10
    assert ve.best_guess == 8

    # When min > max, max is automatically corrected to min
    ve2 = VictimEstimate(min_victims=12, max_victims=4, best_guess=12)
    assert ve2.min_victims == 12
    assert ve2.max_victims == 12
    assert ve2.best_guess == 12

def test_coordinates_validation():
    """Verify geo-coordinate bounds."""
    c = Coordinates(lat=26.8467, lng=80.9462)
    assert c.lat == 26.8467
    assert c.lng == 80.9462

    with pytest.raises(Exception):
        Coordinates(lat=95.0, lng=80.0)

    with pytest.raises(Exception):
        Coordinates(lat=25.0, lng=190.0)

def test_incident_canonical_schema():
    """Verify full Incident model creation with all mandatory load-bearing fields."""
    loc = LocationInfo(lat=26.85, lng=80.95, address="Ward 07 Govt School", precision=LocationPrecision.HIGH)
    inc = Incident(
        incident_id="INC-014",
        status=IncidentStatus.REPORTED,
        location=loc,
        zone_id="WARD-07",
        category=HazardType.FLOOD,
        micro_environment=MicroEnvironmentTag.ROOFTOP_STRANDED,
        victim_estimate=VictimEstimate(min_victims=6, max_victims=10, best_guess=8),
        vulnerability_tags=[VulnerabilityTag.CHILDREN],
        priority_score=0.74,
        urgency_score=0.88,
        confidence_score=0.61,
        confidence_floor=0.4,
        dispute_flag=True,
    )
    assert inc.incident_id == "INC-014"
    assert inc.confidence_floor == 0.4
    assert inc.micro_environment == MicroEnvironmentTag.ROOFTOP_STRANDED
    assert inc.dispute_flag is True

def test_health_endpoint():
    """Verify /health returns load-bearing invariant metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["invariants"]["confidence_floor_c_min"] == 0.4

def test_telemetry_endpoint():
    """Verify /telemetry telemetry strip structure."""
    response = client.get("/telemetry")
    assert response.status_code == 200
    data = response.json()
    assert "queue_depth" in data
    assert "active_incidents" in data
    assert "disputed_incidents" in data
    assert "solver_status" in data

def test_report_ingestion_api():
    """Verify /reports endpoint receives, normalizes, and queues reports."""
    initial_len = len(raw_reports_store)
    payload = {
        "source_channel": "SMS",
        "raw_text": "Paani 2nd floor tak aa gaya. 6 log hain.",
        "language": "hi",
        "location_text": "Near old primary school",
        "lat": 26.852,
        "lng": 80.948,
    }
    response = client.post("/reports", json=payload)
    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "QUEUED"
    assert data["report_id"].startswith("REP-")
    assert len(raw_reports_store) == initial_len + 1

def test_human_approval_gate():
    """Verify /dispatch/approve enforces server-side human approval payload."""
    assignment = {
        "incident_id": "INC-014",
        "resource_id": "BOAT-03",
        "estimated_travel_time_min": 14.5,
        "served_fraction": 1.0,
        "reason": "Nearest flood-capable vessel"
    }
    valid_payload = {
        "plan_id": "PLAN-TEST01",
        "approver_id": "OFFICER-SHARMA-04",
        "approver_role": "DUTY_INCIDENT_COMMANDER",
        "approved_assignments": [assignment],
        "notes": "Approved for immediate deployment"
    }
    res = client.post("/dispatch/approve", json=valid_payload)
    assert res.status_code == 200
    assert res.json()["status"] == "APPROVED"

    # Missing approver_id must fail validation
    invalid_payload = {
        "plan_id": "PLAN-TEST02",
        "approver_id": "",
        "approver_role": "COMMANDER",
        "approved_assignments": []
    }
    res_invalid = client.post("/dispatch/approve", json=invalid_payload)
    assert res_invalid.status_code == 400

def test_copilot_schema_validation():
    """Verify /copilot/query response conforms to the mandatory schema."""
    query_payload = {
        "officer_id": "OFFICER-01",
        "question": "What is the status of Ward 07?",
        "focus_zone_id": "WARD-07"
    }
    res = client.post("/copilot/query", json=query_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["certainty"] in ["KNOWN", "DISPUTED", "UNKNOWN", "RECOMMENDED"]
    assert "evidence_refs" in data
