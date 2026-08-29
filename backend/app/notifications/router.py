from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query

from ..models.domain import (
    ReverseSOSRequest,
    BroadcastRequest,
    NotificationRecord,
    NotificationSummaryResponse
)
from ..models.enums import AdvisoryType
from .engine import notification_engine
from .templates import ADVISORY_TEMPLATES

router = APIRouter(prefix="/notifications", tags=["Reverse SOS & Notifications"])

@router.post("/reverse-sos", response_model=List[NotificationRecord], status_code=status.HTTP_201_CREATED)
async def send_reverse_sos(req: ReverseSOSRequest):
    """
    Sends targeted Reverse SOS updates to citizens and callers associated with an incident.
    Requires mandatory commander rationale.
    """
    if not req.operator_rationale or len(req.operator_rationale.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Mandatory operator_rationale required to trigger outbound civilian communication."
        )
    return notification_engine.send_reverse_sos(req)

@router.post("/broadcast", response_model=List[NotificationRecord], status_code=status.HTTP_201_CREATED)
async def send_geofenced_broadcast(req: BroadcastRequest):
    """
    Triggers regional emergency alert broadcasts across geofenced ward/coordinates.
    Requires mandatory commander rationale.
    """
    if not req.operator_rationale or len(req.operator_rationale.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Mandatory operator_rationale required for regional public broadcast."
        )
    return notification_engine.send_geofenced_broadcast(req)

@router.get("/summary", response_model=NotificationSummaryResponse)
async def get_notification_summary():
    """Returns aggregate delivery stats and active civilian advisories."""
    return notification_engine.get_summary()

@router.get("/history", response_model=List[NotificationRecord])
async def get_notification_history(limit: int = Query(50, ge=1, le=200)):
    """Returns recent notification delivery history."""
    return notification_engine.get_history(limit=limit)

@router.get("/templates")
async def get_advisory_templates():
    """Returns multi-lingual micro-guidance templates (EN, HI, HINGLISH)."""
    return {k.value: v for k, v in ADVISORY_TEMPLATES.items()}
