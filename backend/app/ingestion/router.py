import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from ..models.domain import (
    ReportIngestRequest,
    ReportIngestResponse,
    RawReport,
    LocationInfo,
)
from ..models.enums import LocationPrecision
from ..core.queue import queue
from .processor import LocationResolver, zone_tracker

router = APIRouter(prefix="/ingestion", tags=["Ingestion"])

@router.post("/reports", response_model=ReportIngestResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_report_endpoint(payload: ReportIngestRequest):
    """
    Multi-channel report ingestion endpoint.
    Normalizes location, records zone activity, pushes to durable queue,
    and returns queue receipt.
    """
    report_id = f"REP-{uuid.uuid4().hex[:8].upper()}"
    ts = payload.timestamp or datetime.now(timezone.utc)

    # Resolve location without inventing fake precision
    resolved_loc, zone_id = LocationResolver.resolve(
        raw_text=payload.raw_text,
        location_text=payload.location_text,
        lat=payload.lat,
        lng=payload.lng,
    )

    # Record zone activity timestamp
    zone_tracker.record_activity(zone_id, ts)

    raw_report = RawReport(
        report_id=report_id,
        source_channel=payload.source_channel,
        raw_text=payload.raw_text,
        language=payload.language or "en",
        timestamp=ts,
        location_text=payload.location_text,
        resolved_location=resolved_loc,
        location_precision=resolved_loc.precision,
        source_id=payload.source_id,
    )

    # Push to durable queue
    await queue.push(raw_report)
    current_depth = await queue.get_queue_depth()

    return ReportIngestResponse(
        report_id=report_id,
        status="QUEUED",
        queue_position=current_depth,
        received_at=ts,
    )

@router.get("/queue", tags=["Ingestion"])
async def get_queue_status():
    """Returns queue depth and performance metrics."""
    metrics = await queue.get_metrics()
    return metrics

@router.get("/zones", tags=["Ingestion", "Dark Zones"])
async def get_zone_states():
    """Returns live vs dark sensing status for all district zones."""
    return zone_tracker.get_all_zone_states()
