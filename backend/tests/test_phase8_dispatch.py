import pytest
from app.dispatch.router import HeuristicDispatcher

def test_constrained_scenario_priority_assignment():
    incidents = [
        {"incident_id": "I-LOW", "priority_score": 10.0, "category": "FLOOD", "route_segment_id": "R1"},
        {"incident_id": "I-HIGH", "priority_score": 90.0, "category": "FLOOD", "route_segment_id": "R1"},
    ]
    resources = [
        {"resource_id": "RES-BOAT-1", "type": "BOAT", "available": True}
    ]
    
    # 2 incidents but only 1 resource.
    res = HeuristicDispatcher.generate_plan(incidents, resources, [], [])
    
    # The high priority incident should get the resource
    assert len(res["assignments"]) == 1
    assert res["assignments"][0]["incident_id"] == "I-HIGH"
    assert res["assignments"][0]["resource_id"] == "RES-BOAT-1"
    assert res["plan_quality"] == "PLAN QUALITY: HEURISTIC"

def test_closed_road_avoidance():
    incidents = [
        {"incident_id": "I-HIGH", "priority_score": 90.0, "category": "FLOOD", "route_segment_id": "R-CLOSED"},
        {"incident_id": "I-LOW", "priority_score": 10.0, "category": "FLOOD", "route_segment_id": "R-OPEN"},
    ]
    resources = [
        {"resource_id": "RES-BOAT-1", "type": "BOAT", "available": True}
    ]
    
    # Even though I-HIGH is high priority, it's blocked by a closed road
    res = HeuristicDispatcher.generate_plan(incidents, resources, closed_road_segments=["R-CLOSED"], disputed_road_segments=[])
    
    # The low priority incident gets the resource because it's reachable
    assert len(res["assignments"]) == 1
    assert res["assignments"][0]["incident_id"] == "I-LOW"
    assert res["assignments"][0]["resource_id"] == "RES-BOAT-1"
    assert res["plan_quality"] == "PLAN QUALITY: HEURISTIC"

def test_disputed_road_penalty():
    incidents = [
        {"incident_id": "I-DISPUTED", "priority_score": 50.0, "category": "COLLAPSE", "route_segment_id": "R-DISP"},
    ]
    resources = [
        {"resource_id": "RES-EXC-1", "type": "EXCAVATOR", "available": True}
    ]
    
    res = HeuristicDispatcher.generate_plan(incidents, resources, closed_road_segments=[], disputed_road_segments=["R-DISP"])
    
    assert len(res["assignments"]) == 1
    assert res["assignments"][0]["incident_id"] == "I-DISPUTED"
    # ETA should be penalized (base 15 + penalty 30 = 45)
    assert res["assignments"][0]["eta_minutes"] == 45
    assert res["plan_quality"] == "PLAN QUALITY: HEURISTIC"
