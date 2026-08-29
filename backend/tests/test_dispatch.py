import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.domain import (
    Incident,
    Resource,
    LocationInfo,
    VictimEstimate,
    WhatIfRequest,
)
from app.models.enums import (
    ResourceType,
    ResourceStatus,
    HazardType,
    MicroEnvironmentTag,
    VulnerabilityTag,
    PlanQuality,
)
from app.dispatch.solver import MILPDispatcher
from app.dispatch.fallback import GreedyFallbackDispatcher
from app.dispatch.feasibility import FeasibilityChecker
from app.dispatch.what_if import WhatIfEngine
from app.dispatch.router import active_resources

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_resources():
    """Populate active resources registry for tests."""
    active_resources.clear()
    loc_station = LocationInfo(lat=26.8500, lng=80.9400, ward_id="WARD-07")
    loc_depot = LocationInfo(lat=26.8400, lng=80.9300, ward_id="WARD-04")

    active_resources.extend([
        Resource(resource_id="BOAT-01", type=ResourceType.BOAT, current_location=loc_station, availability_status=ResourceStatus.AVAILABLE),
        Resource(resource_id="BOAT-02", type=ResourceType.BOAT, current_location=loc_station, availability_status=ResourceStatus.AVAILABLE),
        Resource(resource_id="EXCAVATOR-01", type=ResourceType.EXCAVATOR, current_location=loc_depot, availability_status=ResourceStatus.AVAILABLE),
        Resource(resource_id="AMBULANCE-01", type=ResourceType.AMBULANCE, current_location=loc_station, availability_status=ResourceStatus.AVAILABLE),
    ])

def test_feasibility_capability_matrix():
    """Verify resource-to-incident operational capability matching."""
    loc = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07")
    
    inc_flood = Incident(incident_id="INC-F", location=loc, category=HazardType.FLOOD, micro_environment=MicroEnvironmentTag.ROOFTOP_STRANDED)
    inc_collapse = Incident(incident_id="INC-C", location=loc, category=HazardType.BUILDING_COLLAPSE, micro_environment=MicroEnvironmentTag.DEBRIS_TRAPPED)

    res_boat = Resource(resource_id="B-1", type=ResourceType.BOAT, current_location=loc, availability_status=ResourceStatus.AVAILABLE)
    res_excavator = Resource(resource_id="E-1", type=ResourceType.EXCAVATOR, current_location=loc, availability_status=ResourceStatus.AVAILABLE)

    # Boat is feasible for flood, not collapse
    assert FeasibilityChecker.is_feasible(res_boat, inc_flood) is True
    assert FeasibilityChecker.is_feasible(res_boat, inc_collapse) is False

    # Excavator is feasible for collapse, not flood
    assert FeasibilityChecker.is_feasible(res_excavator, inc_collapse) is True
    assert FeasibilityChecker.is_feasible(res_excavator, inc_flood) is False

def test_milp_solver_optimality():
    """Verify CP-SAT solver finds mathematically optimal assignment plan."""
    loc_school = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07")
    loc_market = LocationInfo(lat=26.8410, lng=80.9320, ward_id="WARD-04")

    inc1 = Incident(
        incident_id="INC-HIGH",
        location=loc_school,
        category=HazardType.FLOOD,
        micro_environment=MicroEnvironmentTag.ROOFTOP_STRANDED,
        priority_score=1.85,
        victim_estimate=VictimEstimate(min_victims=10, max_victims=10, best_guess=10)
    )
    inc2 = Incident(
        incident_id="INC-COLLAPSE",
        location=loc_market,
        category=HazardType.BUILDING_COLLAPSE,
        micro_environment=MicroEnvironmentTag.DEBRIS_TRAPPED,
        priority_score=1.40,
        victim_estimate=VictimEstimate(min_victims=4, max_victims=4, best_guess=4)
    )
    inc3 = Incident(
        incident_id="INC-LOW",
        location=loc_school,
        category=HazardType.FLOOD,
        micro_environment=MicroEnvironmentTag.ROOFTOP_STRANDED,
        priority_score=0.45,
        victim_estimate=VictimEstimate(min_victims=1, max_victims=1, best_guess=1)
    )

    # Solve with available resources (2 boats, 1 excavator)
    plan = MILPDispatcher.solve(
        incidents=[inc1, inc2, inc3],
        resources=active_resources,
        budget_seconds=3.0
    )

    assert plan.plan_quality == PlanQuality.OPTIMAL
    assert plan.solver_status == "OPTIMAL"
    assert len(plan.assignments) == 3 # All 3 served
    assert plan.objective_value > 3.0 # sum of priorities

    # Verify boat assigned to high priority flood and excavator to collapse
    assigned_map = {a.incident_id: a.resource_id for a in plan.assignments}
    assert assigned_map["INC-COLLAPSE"] == "EXCAVATOR-01"
    assert assigned_map["INC-HIGH"] in ["BOAT-01", "BOAT-02"]

def test_greedy_fallback_heuristic():
    """Verify fallback sequence when solver budget is exceeded or fallback is forced."""
    loc_school = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07")
    inc = Incident(
        incident_id="INC-FALLBACK-01",
        location=loc_school,
        category=HazardType.FLOOD,
        micro_environment=MicroEnvironmentTag.ROOFTOP_STRANDED,
        priority_score=1.5
    )

    plan = MILPDispatcher.solve(
        incidents=[inc],
        resources=active_resources,
        force_fallback=True
    )

    assert plan.plan_quality == PlanQuality.HEURISTIC_FALLBACK
    assert plan.solver_status == "HEURISTIC_FALLBACK"
    assert len(plan.assignments) == 1
    assert "Greedy heuristic" in plan.assignments[0].reason

def test_travel_time_cutoff_constraint():
    """Verify resources beyond max travel time (e.g. 60 min) are not assigned."""
    loc_near = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07")
    loc_far = LocationInfo(lat=28.5000, lng=82.0000, ward_id="WARD-FAR") # ~200km away

    inc = Incident(incident_id="INC-NEAR", location=loc_near, category=HazardType.FLOOD, micro_environment=MicroEnvironmentTag.ROOFTOP_STRANDED, priority_score=1.0)
    res_far = Resource(resource_id="BOAT-FAR", type=ResourceType.BOAT, current_location=loc_far, availability_status=ResourceStatus.AVAILABLE)

    plan = MILPDispatcher.solve(
        incidents=[inc],
        resources=[res_far],
        max_travel_time_min=60.0
    )

    # The far boat should NOT be assigned because travel time exceeds 60 min
    assert len(plan.assignments) == 0
    assert "INC-NEAR" in plan.unserved_incidents

def test_what_if_scenario_simulation():
    """Verify what-if analysis on resource breakdown."""
    loc_school = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07")
    inc1 = Incident(incident_id="INC-01", location=loc_school, category=HazardType.FLOOD, micro_environment=MicroEnvironmentTag.ROOFTOP_STRANDED, priority_score=1.8)
    inc2 = Incident(incident_id="INC-02", location=loc_school, category=HazardType.FLOOD, micro_environment=MicroEnvironmentTag.ROOFTOP_STRANDED, priority_score=1.2)

    # Baseline with 2 boats serves both incidents.
    # What-if with BOAT-01 offline leaves only 1 boat.
    request = WhatIfRequest(unavailable_resources=["BOAT-01", "BOAT-02"])
    result = WhatIfEngine.evaluate_what_if([inc1, inc2], active_resources, request)

    assert "what_if_plan" in result
    assert "impact_analysis" in result
    assert result["impact_analysis"]["unserved_count_delta"] >= 1
