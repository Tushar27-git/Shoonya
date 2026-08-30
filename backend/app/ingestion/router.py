import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.models.domain import RawReport, LocationInfo
from app.models.enums import SourceChannel, LocationPrecision, HazardType, MicroEnvironmentTag

from app.core.queue import queue
from app.saathi.router import get_role_level

router = APIRouter(prefix="/reports", tags=["Ingestion"])

GAZETTEER_FILE = Path(__file__).resolve().parent.parent / "data" / "gazetteer.json"
GAZETTEER_DATA: List[Dict[str, Any]] = []
if GAZETTEER_FILE.exists():
    with open(GAZETTEER_FILE, "r", encoding="utf-8") as f:
        try:
            GAZETTEER_DATA = json.load(f)
        except Exception:
            pass

ZONE_STATUS_TRACKER: Dict[str, str] = {
    w.get("id", ""): "LIVE"
    for w in GAZETTEER_DATA
}
if "W01" not in ZONE_STATUS_TRACKER:
    ZONE_STATUS_TRACKER["W01"] = "LIVE"
if "W04" not in ZONE_STATUS_TRACKER:
    ZONE_STATUS_TRACKER["W04"] = "DARK"

SMS_CODE_MAP: Dict[str, Dict[str, Any]] = {
    "911": {
        "category": HazardType.FLOOD,
        "micro_environment": MicroEnvironmentTag.ROOFTOP_STRANDED,
        "urgency_default": 0.95
    },
    "912": {
        "category": HazardType.FLOOD,
        "micro_environment": MicroEnvironmentTag.DROWNING_RISK,
        "urgency_default": 1.00
    },
    "811": {
        "category": HazardType.BUILDING_COLLAPSE,
        "micro_environment": MicroEnvironmentTag.DEBRIS_TRAPPED,
        "urgency_default": 0.90
    },
    "812": {
        "category": HazardType.BUILDING_COLLAPSE,
        "micro_environment": MicroEnvironmentTag.CRUSH_INJURY,
        "urgency_default": 0.95
    }
}

class SMSCodePayload(BaseModel):
    code: str
    sender_id: str
    location_hint: str

class VagueLocationReportPayload(BaseModel):
    raw_text: str
    sender_id: str
    channel: SourceChannel = SourceChannel.SMS
    landmark_hint: Optional[str] = None

def resolve_vague_location(landmark_hint: Optional[str]) -> LocationInfo:
    if not landmark_hint:
        return LocationInfo(lat=26.14, lng=91.77, precision=LocationPrecision.LOW)
    hint_lower = landmark_hint.lower()
    for ward in GAZETTEER_DATA:
        if hint_lower in ward.get("name", "").lower():
            coords = ward.get("coordinates", {"lat": 26.14, "lon": 91.77})
            return LocationInfo(lat=coords.get("lat", 26.14), lng=coords.get("lon", 91.77), precision=LocationPrecision.LOW)
    return LocationInfo(lat=26.14, lng=91.77, precision=LocationPrecision.LOW)

@router.post("", status_code=status.HTTP_201_CREATED)
async def ingest_report(report: RawReport):
    report.reporter_role_level = get_role_level(report.source_id)
    await queue.enqueue(report)
    depth = await queue.get_queue_depth()
    return {
        "status": "QUEUED",
        "queue_depth": depth,
        "report_id": report.report_id
    }

@router.post("/sms-code", status_code=status.HTTP_201_CREATED)
async def ingest_sms_code(payload: SMSCodePayload):
    if payload.code not in SMS_CODE_MAP:
        raise HTTPException(status_code=400, detail=f"Unknown SMS emergency code: {payload.code}")
    mapping = SMS_CODE_MAP[payload.code]
    loc = resolve_vague_location(payload.location_hint)
    depth = await queue.get_queue_depth()
    report_id = f"SMS-{payload.code}-{depth + 1}"
    
    report = RawReport(
        report_id=report_id,
        raw_text=f"CODE_{payload.code}: {payload.location_hint}",
        source_channel=SourceChannel.SMS,
        source_id=payload.sender_id,
        reporter_role_level=get_role_level(payload.sender_id)
    )
    await queue.enqueue(report)
    new_depth = await queue.get_queue_depth()
    
    return {
        "status": "RESOLVED_AND_QUEUED",
        "report_id": report_id,
        "category": mapping["category"],
        "micro_environment": mapping["micro_environment"],
        "urgency_default": mapping["urgency_default"],
        "location_precision": loc.precision,
        "queue_depth": new_depth
    }

@router.post("/vague", status_code=status.HTTP_201_CREATED)
async def ingest_vague_report(payload: VagueLocationReportPayload):
    loc = resolve_vague_location(payload.landmark_hint)
    depth = await queue.get_queue_depth()
    report_id = f"REP-VAGUE-{depth + 1}"
    
    report = RawReport(
        report_id=report_id,
        raw_text=payload.raw_text,
        source_channel=payload.channel,
        source_id=payload.sender_id,
        reporter_role_level=get_role_level(payload.sender_id)
    )
    await queue.enqueue(report)
    new_depth = await queue.get_queue_depth()
    
    return {
        "status": "QUEUED",
        "report_id": report_id,
        "location_precision": loc.precision,
        "queue_depth": new_depth
    }

@router.get("/zone-status/{ward_id}")
async def get_zone_status(ward_id: str):
    if ward_id not in ZONE_STATUS_TRACKER:
        raise HTTPException(status_code=404, detail="Ward not found in gazetteer")
    return {"ward_id": ward_id, "channel_status": ZONE_STATUS_TRACKER[ward_id]}

@router.get("/queue/depth")
async def get_queue_depth():
    depth = await queue.get_queue_depth()
    return {"queue_depth": depth}
