from fastapi import APIRouter, Body, BackgroundTasks, Header, HTTPException
from pydantic import BaseModel
import asyncio
import httpx
from .generator import generator
from .ground_truth import ground_truth
from .scenario import generator as scenario_generator
from app.simulation.service import simulation_engine

router = APIRouter(tags=["Simulation & Venue Network"])

@router.post("/simulation/start")
async def start_simulation():
    simulation_engine.start()
    return {"status": simulation_engine.status}

@router.post("/simulation/reset")
async def reset_simulation():
    simulation_engine.reset()
    return {"status": simulation_engine.status}

@router.get("/simulation/status")
async def get_simulation_status():
    return {
        "status": simulation_engine.status,
        "elapsed_seconds": simulation_engine.elapsed_seconds,
        "seed": simulation_engine.seed
    }

@router.post("/simulation/reveal-ground-truth")
async def reveal_ground_truth():
    return ground_truth.get_ground_truth()

class TickRequest(BaseModel):
    delta_minutes: int = 15

class OccupancyUpdateRequest(BaseModel):
    delta_occupants: int

@router.get("/simulation/scenario")
async def get_simulation_scenario():
    """
    Returns the deterministic 24-hour generated scenario.
    """
    return generator.generate_scenario()

@router.post("/simulation/tick")
async def advance_simulation_tick(payload: TickRequest = Body(default_factory=TickRequest)):
    """
    Advances the discrete disaster simulation by delta_minutes,
    updating flood levels, generating noisy reports, and checking venue threats.
    """
    # simulation_engine is removed
    return {"status": "DEPRECATED"}

from ..clustering.engine import clustering_engine
from ..amplify.router import CARD_STORE
from ..audit.approval_gate import approval_gate

@router.post("/simulation/reset")
async def reset_simulation():
    """
    Resets the disaster simulation to T = 0 initial state.
    """
    ground_truth.reset()
    clustering_engine.reset()
    CARD_STORE.clear()
    global FEED_STATUS
    FEED_STATUS = "IDLE"
    return {"status": "RESET", "sim_time_minutes": 0}

@router.get("/simulation/state")
async def get_simulation_state():
    """
    Returns current simulation time, tick index, total reports generated,
    and benchmark ground truth metrics.
    """
    return {
        "sim_time_minutes": ground_truth.sim_time_minutes,
        "tick_count": 0,
        "total_generated_reports": 0,
        "ground_truth_summary": {
            "ward_flood_depths": ground_truth.ward_flood_depths,
            "true_trapped_victims": ground_truth.true_victims,
            "true_road_statuses": {k: v.value for k, v in ground_truth.true_roads.items()}
        }
    }

FEED_STATUS = "IDLE"

async def run_perception_feed_task():
    global FEED_STATUS
    FEED_STATUS = "RUNNING"
    # Use 8000 as default port assuming local dev
    base_url = "http://127.0.0.1:8000/reports"
    
    scenario_data = scenario_generator.generate()
    feed = scenario_data["perception_feed"]
    
    async with httpx.AsyncClient() as client:
        start_time = asyncio.get_event_loop().time()
        for report in feed:
            # We want to compress the 50s delays into roughly a 60-90s window
            target_time = start_time + report["relative_time_sec"] * (60.0 / 50.0) # Scaling if needed
            now = asyncio.get_event_loop().time()
            if target_time > now:
                await asyncio.sleep(target_time - now)
            
            endpoint = report["endpoint"]
            payload = report["payload"]
            
            try:
                url = f"{base_url}{endpoint}"
                await client.post(url, json=payload)
            except Exception as e:
                print(f"Error submitting report to {endpoint}: {e}")
    FEED_STATUS = "COMPLETE"

@router.post("/simulation/run-legacy")
async def run_simulation_legacy(background_tasks: BackgroundTasks):
    """
    Replays the full perception feed through the real pipeline at accelerated speed.
    """
    background_tasks.add_task(run_perception_feed_task)
    return {"status": "STARTED", "message": "Simulation replay started in background"}

@router.get("/simulation/ground-truth")
async def get_simulation_ground_truth(x_demo_mode: str = Header(None)):
    """
    Returns the ground truth state. Locked behind a demo-only flag.
    """
    if x_demo_mode != "true":
        raise HTTPException(status_code=403, detail="Demo mode header required")
    
    scenario_data = scenario_generator.generate()
    return scenario_data["ground_truth"]
