import pytest
import math
from fastapi.testclient import TestClient
from app.main import app
from app.models.domain import Incident, LocationInfo, VictimEstimate
from app.models.enums import (
    LocationPrecision,
    HazardType,
    MicroEnvironmentTag,
    VulnerabilityTag,
)
from app.priority.engine import PriorityEngine
from app.config import settings

client = TestClient(app)

def test_confidence_modifier_invariant():
    """
    Verify the critical load-bearing property:
    M(c_i) = c_min + (1 - c_min) * c_i with c_min = 0.4
    
    At c_i = 0: M(0) = 0.4
    At c_i = 0.5: M(0.5) = 0.7
    At c_i = 1.0: M(1.0) = 1.0
    """
    assert PriorityEngine.compute_confidence_modifier(0.0) == 0.4
    assert PriorityEngine.compute_confidence_modifier(0.5) == 0.7
    assert PriorityEngine.compute_confidence_modifier(1.0) == 1.0

def test_base_urgency_and_final_priority():
    """
    Verify exact Base Urgency formula:
    U_i = w1*S_i + w2*V_i + w3*log(1+N_i) + w4*R_i + w5*A_i
    P_i = U_i * M(c_i)
    """
    loc = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07", precision=LocationPrecision.HIGH)
    inc = Incident(
        incident_id="INC-URG-01",
        location=loc,
        zone_id="WARD-07",
        category=HazardType.FLOOD,
        micro_environment=MicroEnvironmentTag.ROOFTOP_STRANDED,
        victim_estimate=VictimEstimate(min_victims=8, max_victims=8, best_guess=8),
        vulnerability_tags=[VulnerabilityTag.CHILDREN],
        confidence_score=0.60
    )

    inc_eval = PriorityEngine.evaluate_incident_priority(inc)
    factors = inc_eval.priority_factors

    # Verify factors
    assert factors.severity_score > 0.5
    assert factors.vulnerability_score == 0.40 # Children tag
    assert math.isclose(factors.victim_count_term, math.log(1.0 + 8.0), rel_tol=1e-3)
    assert factors.confidence_modifier == 0.4 + (0.6 * 0.60) # 0.76

    # Verify final priority = base_urgency * confidence_modifier
    assert math.isclose(inc_eval.priority_score, inc_eval.urgency_score * 0.76, rel_tol=1e-3)

def test_critical_low_confidence_outranks_trivial_high_confidence():
    """
    Verify the fundamental SHOONYA principle:
    Low-confidence critical incidents CANNOT disappear or be pushed below
    trivial high-confidence incidents.
    """
    loc = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07")

    # Incident A: Severe emergency, 20 children trapped, ZERO confidence (c = 0.0)
    inc_a = Incident(
        incident_id="INC-CRITICAL-UNVERIFIED",
        location=loc,
        zone_id="WARD-07",
        category=HazardType.FLOOD,
        micro_environment=MicroEnvironmentTag.ROOFTOP_STRANDED,
        victim_estimate=VictimEstimate(min_victims=20, max_victims=20, best_guess=20),
        vulnerability_tags=[VulnerabilityTag.CHILDREN],
        confidence_score=0.0 # Zero confidence
    )

    # Incident B: Trivial puddle, 0 victims, 100% confidence (c = 1.0)
    inc_b = Incident(
        incident_id="INC-TRIVIAL-VERIFIED",
        location=loc,
        zone_id="WARD-01",
        category=HazardType.FLOOD,
        micro_environment=MicroEnvironmentTag.NONE,
        victim_estimate=VictimEstimate(min_victims=0, max_victims=0, best_guess=0),
        vulnerability_tags=[],
        confidence_score=1.0 # 100% confidence
    )

    ranked = PriorityEngine.rank_incidents([inc_b, inc_a])
    # The severe incident MUST rank #1 despite c = 0.0 because M(0) = 0.4 preserves 40% urgency
    assert ranked[0].incident_id == "INC-CRITICAL-UNVERIFIED"
    assert ranked[0].priority_score > ranked[1].priority_score

def test_dynamic_slider_weight_adjustments():
    """Verify dynamic weight recalculation via API endpoint."""
    res = client.post("/priority/recalculate", json={
        "w1": 0.50, # Heavily boost severity
        "w2": 0.10,
        "w3": 0.10,
        "w4": 0.15,
        "w5": 0.15
    })
    assert res.status_code == 200
    assert isinstance(res.json(), list)
