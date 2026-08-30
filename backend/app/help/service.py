import uuid
from typing import Dict, List, Any
from datetime import datetime, timedelta
from .models import PublicAssistanceRequest, EmergencyContact
from app.amplify.cards import redact_pii
from app.ingestion.router import ingest_sms_code
from app.models.domain import RawReport
from app.models.enums import SourceChannel, LocationPrecision

HELP_REQUEST_STORE: Dict[str, PublicAssistanceRequest] = {}
EMERGENCY_CONTACTS: List[EmergencyContact] = [
    EmergencyContact(contact_id="112", name="National Emergency (112)", phone="112", type="GOVERNMENT", verification_status="VERIFIED", escalation_priority=1),
    EmergencyContact(contact_id="108", name="Ambulance (108)", phone="108", type="MEDICAL", verification_status="VERIFIED", escalation_priority=2),
    EmergencyContact(contact_id="SH03-CTRL", name="SH03 Control Room", phone="011-234-567", type="SHELTER", verification_status="VERIFIED", escalation_priority=3),
    EmergencyContact(contact_id="NGO-A-HQ", name="NGO Partner A", phone="999-888-777", type="NGO", verification_status="VERIFIED", escalation_priority=4)
]

def create_request(payload: dict) -> PublicAssistanceRequest:
    req_id = f"REQ-{uuid.uuid4().hex[:6].upper()}"
    cat = payload.get("category", "OTHER")
    
    escalate = cat in ["IMMEDIATE_DANGER", "MEDICAL", "TRAPPED_FLOODED", "FIRE_COLLAPSE"]
    
    req = PublicAssistanceRequest(
        request_id=req_id,
        category=cat,
        location_precision=payload.get("location_precision", "LOW"),
        location_string=payload.get("location_string", ""),
        people_count=payload.get("people_count", 1),
        vulnerability_tags=payload.get("vulnerability_tags", []),
        emergency_escalation_recommended=escalate
    )
    
    HELP_REQUEST_STORE[req_id] = req
    
    # Forward to existing ingestion pipeline
    report = RawReport(
        report_id=f"RPT-{req_id}",
        source=SourceChannel.WEB,
        raw_text=f"Help Request: {cat}, {req.people_count} people. {req.location_string}",
        location=(0.0, 0.0), # Ignored for LOW
        location_precision=LocationPrecision.LOW,
        sender_id="CITIZEN_ANON",
        timestamp=datetime.utcnow()
    )
    
    # Assuming ingest_sms or a direct method to ingest
    # We just create it here for demo
    
    return req

def get_public_directory(category=None, region=None) -> List[dict]:
    res = [c for c in EMERGENCY_CONTACTS if c.active]
    res.sort(key=lambda x: x.escalation_priority)
    return redact_for_public([c.model_dump() for c in res])

def get_nearby_help(ward_id=None) -> List[dict]:
    # Mock nearby
    nearby = [
        {"name": "SH03 Shelter", "type": "SHELTER", "last_verified": datetime.utcnow() - timedelta(hours=4)},
        {"name": "NGO-A Base", "type": "NGO", "last_verified": datetime.utcnow() - timedelta(hours=1)}
    ]
    
    for n in nearby:
        if (datetime.utcnow() - n["last_verified"]).total_seconds() > 3 * 3600:
            n["uncertainty_flag"] = "Uncertain, verify before travel"
            
    return redact_for_public(nearby)

def get_guidance(category: str) -> dict:
    guidance = {
        "TRAPPED_FLOODED": "Move to highest visible ground. Conserve battery. Signal with bright cloth.",
        "MEDICAL": "Do not move spine if injured. Apply pressure to bleeding.",
        "FIRE_COLLAPSE": "Evacuate immediately. Stay low to avoid smoke."
    }
    return {"category": category, "instruction": guidance.get(category, "Follow official updates and stay safe.")}

def get_public_alerts() -> List[dict]:
    from app.amplify.router import CARD_STORE
    # Only return approved cards
    cards = [c for c in CARD_STORE.values() if c.status == "APPROVED"]
    return redact_for_public([c.model_dump() for c in cards])

def redact_for_public(entity: Any) -> Any:
    return redact_pii(entity)
