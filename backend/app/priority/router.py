from fastapi import APIRouter, Body
from typing import List, Optional, Dict
from ..models.domain import Incident
from .engine import priority_engine

router = APIRouter(prefix="/priority", tags=["Priority Engine"])

class WeightAdjustmentRequest(Dict[str, float]):
    pass

@router.post("/recalculate", response_model=List[Incident])
async def recalculate_priorities(
    weights: Optional[Dict[str, float]] = Body(None, description="Optional override weights {w1, w2, w3, w4, w5}")
):
    """
    Recalculates priority rankings dynamically based on slider adjustments.
    """
    from ..clustering.engine import clustering_engine
    active_incidents = clustering_engine.get_all_incidents()
    ranked = priority_engine.rank_incidents(active_incidents, override_weights=weights)
    return ranked
