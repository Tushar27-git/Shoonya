import pytest
from app.priority.engine import PriorityEngine

def test_confidence_floor():
    engine = PriorityEngine()
    # M(0) = c_min = 0.4
    mod = engine.confidence_modifier(0.0)
    assert mod == 0.4

    # M(1) = 1.0
    mod2 = engine.confidence_modifier(1.0)
    assert mod2 == 1.0

def test_ranking_starvation_prevention():
    engine = PriorityEngine()
    
    # 1. High severity, zero confidence (unverified collapse)
    inc_high_sev = {
        "id": "INC-1",
        "severity": 1.0,           # Critical collapse
        "vulnerability": 1.0,      # High vulnerability
        "victim_count": 50,        # 50 victims
        "recency": 1.0,            # Very recent
        "accessibility_risk": 1.0, # Roads blocked
        "confidence": 0.0,         # UNVERIFIED
        "independent_source_count": 1
    }
    
    # 2. Low severity, full confidence (verified minor puddle)
    inc_low_sev = {
        "id": "INC-2",
        "severity": 0.1,           # Minor puddle
        "vulnerability": 0.0,      # No vulnerability
        "victim_count": 0,         # 0 victims
        "recency": 1.0,            # Very recent
        "accessibility_risk": 0.0, # Roads clear
        "confidence": 1.0,         # VERIFIED
        "independent_source_count": 5
    }
    
    ranked = engine.rank_incidents([inc_low_sev, inc_high_sev])
    
    # Assert that the high severity incident OUTRANKS the low severity one
    # even though it has ZERO confidence. This proves the 0.4 floor works.
    assert ranked[0]["id"] == "INC-1"
    assert ranked[1]["id"] == "INC-2"
    
    # Verify reason string format
    reason = ranked[0]["priority_reason"]
    assert "Assigned priority" in reason
    assert "Severity evaluated at 1.0" in reason
    assert "50 potential victims" in reason

def test_dynamic_weights():
    engine = PriorityEngine()
    
    inc1 = {
        "id": "1",
        "severity": 1.0,
        "vulnerability": 0.0,
        "victim_count": 0,
        "recency": 0.0,
        "accessibility_risk": 0.0,
        "confidence": 1.0,
        "independent_source_count": 1
    }
    inc2 = {
        "id": "2",
        "severity": 0.0,
        "vulnerability": 1.0,
        "victim_count": 0,
        "recency": 0.0,
        "accessibility_risk": 0.0,
        "confidence": 1.0,
        "independent_source_count": 1
    }
    
    # With default weights (w1=0.35, w2=0.25), inc1 (high severity) > inc2 (high vulnerability)
    ranked_default = engine.rank_incidents([inc1, inc2])
    assert ranked_default[0]["id"] == "1"
    
    # With override weights favoring vulnerability
    ranked_override = engine.rank_incidents(
        [inc1, inc2],
        override_weights={"w1": 0.1, "w2": 0.9}
    )
    assert ranked_override[0]["id"] == "2"
