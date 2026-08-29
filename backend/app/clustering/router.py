from fastapi import APIRouter, HTTPException
from typing import List
from ..models.domain import Incident, MergeReviewRequest
from ..models.enums import MergeReviewState
from .engine import clustering_engine

router = APIRouter(prefix="/clustering", tags=["Clustering & Deduplication"])

@router.get("/incidents", response_model=List[Incident])
async def list_clustered_incidents():
    """Returns all clustered incidents."""
    return clustering_engine.get_all_incidents()

@router.post("/incidents", response_model=Incident)
async def create_or_add_incident(incident: Incident):
    """Adds or updates an incident cluster."""
    return clustering_engine.add_incident(incident)

@router.post("/split/{incident_id}", response_model=List[Incident])
async def split_clustered_incident(incident_id: str):
    """
    Reverses an incident merge: splits an incident cluster back into its
    constituent single-report incidents without losing any raw evidence.
    """
    results = clustering_engine.split_incident(incident_id)
    if not results:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found or cannot be split")
    return results

