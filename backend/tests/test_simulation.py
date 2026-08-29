import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.simulation.ground_truth import GroundTruthWorld, ground_truth
from app.simulation.venues import VenueManager, venue_manager
from app.simulation.engine import DisasterSimulationEngine, simulation_engine

client = TestClient(app)

def test_ground_truth_isolation_and_advancement():
    """
    Verify ground truth tracks objective reality and advances correctly.
    """
    gt = GroundTruthWorld()
    assert gt.sim_time_minutes == 0
    assert gt.ward_flood_depths["WARD-07"] == 2.6
    
    # Advance time by 30 minutes
    gt.advance_time(30)
    assert gt.sim_time_minutes == 30
    assert gt.ward_flood_depths["WARD-07"] > 2.6 # Water level rising

    # Reset
    gt.reset()
    assert gt.sim_time_minutes == 0
    assert gt.ward_flood_depths["WARD-07"] == 2.6

@pytest.mark.asyncio
async def test_discrete_simulation_engine_tick():
    """
    Verify discrete-event tick generates multi-channel synthetic reports and updates queue.
    """
    sim = DisasterSimulationEngine()
    sim.reset()
    
    tick_result = await sim.tick(delta_minutes=15)
    assert tick_result["tick_index"] == 1
    assert tick_result["sim_time_minutes"] == 15
    assert tick_result["reports_generated"] >= 2
    assert tick_result["total_reports"] >= 2
    assert "WARD-07" in tick_result["ground_truth_flood_depths"]

def test_venue_network_and_surge_status():
    """
    Verify venue capacity tracking and surge transitions.
    """
    vm = VenueManager()
    hosp = vm.get_venue("VEN-HOSP-01")
    assert hosp is not None
    assert hosp.capacity_total == 250
    assert hosp.capacity_current == 210

    # 210/250 = 84% -> NORMAL
    assert vm.evaluate_surge_status(hosp) == "NORMAL"

    # Increase occupancy to 220 (88% -> NEAR_CAPACITY)
    vm.update_occupancy("VEN-HOSP-01", 10)
    assert vm.evaluate_surge_status(hosp) == "NEAR_CAPACITY"

    # Increase occupancy to 255 (102% -> OVER_CAPACITY)
    vm.update_occupancy("VEN-HOSP-01", 35)
    assert vm.evaluate_surge_status(hosp) == "OVER_CAPACITY"

def test_venue_flood_threat_advisory():
    """
    Verify flood threat alert is triggered when water depth around shelter reaches critical threshold.
    """
    vm = VenueManager()
    shelter = vm.get_venue("VEN-SHELTER-01")
    assert shelter is not None

    # Water depth 0.5m -> No threat
    threat_mild = vm.check_flood_threat(shelter, ward_water_depth_meters=0.5)
    assert threat_mild is None

    # Water depth 1.8m -> Critical flood threat alert
    threat_crit = vm.check_flood_threat(shelter, ward_water_depth_meters=1.8)
    assert threat_crit is not None
    assert "URGENT" in threat_crit

def test_simulation_and_venue_api_endpoints():
    """
    Verify FastAPI endpoints for simulation ticks and venue listings.
    """
    # 1. Tick simulation
    res_tick = client.post("/simulation/tick", json={"delta_minutes": 15})
    assert res_tick.status_code == 200
    data_tick = res_tick.json()
    assert "tick_index" in data_tick
    assert data_tick["sim_time_minutes"] > 0

    # 2. Get state
    res_state = client.get("/simulation/state")
    assert res_state.status_code == 200
    data_state = res_state.json()
    assert "ground_truth_summary" in data_state

    # 3. Reset simulation
    res_reset = client.post("/simulation/reset")
    assert res_reset.status_code == 200
    assert res_reset.json()["status"] == "RESET"

    # 4. List venues
    res_venues = client.get("/venues")
    assert res_venues.status_code == 200
    venues = res_venues.json()
    assert len(venues) >= 3
    assert any(v["venue_id"] == "VEN-HOSP-01" for v in venues)
