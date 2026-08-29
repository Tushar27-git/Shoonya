from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from .engine import simulation_engine
from .venues import venue_manager
from .ground_truth import ground_truth
from ..models.domain import Venue

router = APIRouter(tags=["Simulation & Venue Network"])

class TickRequest(BaseModel):
    delta_minutes: int = 15

class OccupancyUpdateRequest(BaseModel):
    delta_occupants: int

@router.post("/simulation/tick")
async def advance_simulation_tick(payload: TickRequest = Body(default_factory=TickRequest)):
    """
    Advances the discrete disaster simulation by delta_minutes,
    updating flood levels, generating noisy reports, and checking venue threats.
    """
    return await simulation_engine.tick(payload.delta_minutes)

@router.post("/simulation/reset")
async def reset_simulation():
    """
    Resets the disaster simulation to T = 0 initial state.
    """
    simulation_engine.reset()
    return {"status": "RESET", "sim_time_minutes": 0}

@router.get("/simulation/state")
async def get_simulation_state():
    """
    Returns current simulation time, tick index, total reports generated,
    and benchmark ground truth metrics.
    """
    return {
        "sim_time_minutes": ground_truth.sim_time_minutes,
        "tick_count": simulation_engine.tick_count,
        "total_generated_reports": simulation_engine.total_generated_reports,
        "ground_truth_summary": {
            "ward_flood_depths": ground_truth.ward_flood_depths,
            "true_trapped_victims": ground_truth.true_victims,
            "true_road_statuses": {k: v.value for k, v in ground_truth.true_roads.items()}
        }
    }

@router.get("/venues", response_model=List[Venue])
async def list_all_venues():
    """
    Returns all monitored venues (hospitals, shelters, relief centers).
    """
    return venue_manager.list_venues()

@router.get("/venues/{venue_id}", response_model=Venue)
async def get_venue_details(venue_id: str):
    """
    Returns detailed operational status and surge metrics for a specific venue.
    """
    v = venue_manager.get_venue(venue_id)
    if not v:
        raise HTTPException(status_code=404, detail=f"Venue {venue_id} not found")
    return v

@router.post("/venues/{venue_id}/occupancy", response_model=Venue)
async def update_venue_occupancy(venue_id: str, payload: OccupancyUpdateRequest):
    """
    Updates casualty or evacuee intake for a venue.
    """
    try:
        return venue_manager.update_occupancy(venue_id, payload.delta_occupants)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Venue {venue_id} not found")
