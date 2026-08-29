from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from ..models.domain import Incident, DisputeRecord
from .engine import confidence_engine
from .dark_zone import dark_zone_evaluator

router = APIRouter(prefix="/confidence", tags=["Confidence & Contradiction"])

@router.get("/dark-zones", tags=["Dark Zones"])
async def list_dark_zones():
    """Returns assessment and exposure metrics for all dark zones."""
    return dark_zone_evaluator.get_dark_zone_assessments()

@router.get("/disputes", response_model=List[DisputeRecord], tags=["Contradictions"])
async def list_active_disputes():
    """Returns all active contradiction records across incidents."""
    # Aggregated from active engine or database
    return []
