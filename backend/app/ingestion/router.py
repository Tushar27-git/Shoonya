import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.models.domain import RawReport, Location, LocationInfo, SMS_CODE_MAP
from app.models.enums import ReportChannel, ObservationModality, LocationPrecision

router = APIRouter(prefix="/reports", tags=["Ingestion"])

DURABLE_INGESTION_QUEUE: List[Dict[str, Any]] = []

GAZETTEER_FILE = Path(__file__).resolve().parent.parent / "data" / "gazetteer.json"
WARDS_LIST: List[Dict[str, Any]] = []

if GAZETTEER_FILE.exists():
    try:
        with open(GAZETTEER_FILE, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
            if isinstance(raw_data, list):
                WARDS_LIST = raw_data
            elif isinstance(raw_data, dict):
                WARDS_LIST = raw_data.get("wards", [])
    except Exception:
        WARDS_LIST = []

ZONE_STATUS_TRACKER: Dict[str, str] = {}
for w in WARDS_LIST:
    if isinstance(w, dict):
        w_id = w.get("ward_id") or w.get("id")
        if w_id:
            ZONE_STATUS_TRACKER[str(w_id)] = w.get("telecom_status", "LIVE")

if "W01" not in ZONE_STATUS_TRACKER:
    ZONE_STATUS_TRACKER["W01"] = "LIVE"
if "W04" not in ZONE_STATUS_TRACKER:
    ZONE_STATUS_TRACKER["W04"] = "DARK"

class SMSCodePayload(BaseModel):
    code: str
    sender_id: str
    location_hint: str

class VagueLocationReportPayload(BaseModel):
    raw_text: str
    sender_id: str
    channel: ReportChannel = ReportChannel.SMS
    landmark_hint: Optional[str] = None

def resolve_vague_location(landmark_hint: Optional[str]) -> Location:
    if not landmark_hint:
        return Location(lat=26.14, lng=91.77, precision=LocationPrecision.LOW)
    hint_lower = landmark_hint.lower()
    for ward in WARDS_LIST:
        if isinstance(ward, dict):
            name = ward.get("name", "")
            if hint_lower in name.lower():
                coords = ward.get("coordinates") or [26.14, 91.77]
                return Location(lat=coords[0], lng=coords[1], precision=LocationPrecision.LOW)
    return Location(lat=26.14, lng=91.77, precision=LocationPrecision.LOW)

@router.post("", status_code=status.HTTP_201_CREATED)
async def ingest_report(report: RawReport):
    item = {
        "report_id": report.report_id,
        "raw_text": report.raw_evidence_text,
        "channel": report.channel,
        "source_id": report.source_id,
        "timestamp": report.timestamp.isoformat(),
        "type": "STANDARD"
    }
    DURABLE_INGESTION_QUEUE.append(item)
    return {"status": "QUEUED", "queue_depth": len(DURABLE_INGESTION_QUEUE), "report_id": report.report_id}

@router.post("/sms-code", status_code=status.HTTP_201_CREATED)
async def ingest_sms_code(payload: SMSCodePayload):
    if payload.code not in SMS_CODE_MAP:
        raise HTTPException(status_code=400, detail=f"Unknown SMS emergency code: {payload.code}")
    mapping = SMS_CODE_MAP[payload.code]
    loc = resolve_vague_location(payload.location_hint)
    report_id = f"SMS-{payload.code}-{len(DURABLE_INGESTION_QUEUE) + 1}"
    item = {
        "report_id": report_id,
        "raw_text": f"CODE_{payload.code}: {payload.location_hint}",
        "channel": ReportChannel.SMS_CODE,
        "source_id": payload.sender_id,
        "location": loc.model_dump(),
        "category": mapping["category"],
        "micro_environment": mapping["micro_environment"],
        "urgency_default": mapping["urgency_default"],
        "timestamp": datetime.utcnow().isoformat(),
        "type": "DEGRADED_SMS"
    }
    DURABLE_INGESTION_QUEUE.append(item)
    return {
        "status": "RESOLVED_AND_QUEUED",
        "report_id": report_id,
        "category": mapping["category"],
        "micro_environment": mapping["micro_environment"],
        "urgency_default": mapping["urgency_default"],
        "location_precision": loc.precision,
        "queue_depth": len(DURABLE_INGESTION_QUEUE)
    }

@router.post("/vague", status_code=status.HTTP_201_CREATED)
async def ingest_vague_report(payload: VagueLocationReportPayload):
    loc = resolve_vague_location(payload.landmark_hint)
    report_id = f"REP-VAGUE-{len(DURABLE_INGESTION_QUEUE) + 1}"
    item = {
        "report_id": report_id,
        "raw_text": payload.raw_text,
        "channel": payload.channel,
        "source_id": payload.sender_id,
        "location": loc.model_dump(),
        "timestamp": datetime.utcnow().isoformat(),
        "type": "VAGUE_LOCATION"
    }
    DURABLE_INGESTION_QUEUE.append(item)
    return {"status": "QUEUED", "report_id": report_id, "location_precision": loc.precision, "queue_depth": len(DURABLE_INGESTION_QUEUE)}

@router.get("/zone-status/{ward_id}")
async def get_zone_status(ward_id: str):
    if ward_id not in ZONE_STATUS_TRACKER:
        raise HTTPException(status_code=404, detail="Ward not found in gazetteer")
    return {"ward_id": ward_id, "channel_status": ZONE_STATUS_TRACKER[ward_id]}

@router.get("/queue/depth")
async def get_queue_depth():
    return {"queue_depth": len(DURABLE_INGESTION_QUEUE)}
