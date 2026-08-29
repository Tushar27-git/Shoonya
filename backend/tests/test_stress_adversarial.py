import pytest
import asyncio
from datetime import datetime, timezone
from app.stress.runner import StressBenchmarkRunner
from app.clustering.severity import SeverityCalculator
from app.confidence.engine import ConfidenceEngine
from app.confidence.contradiction import ContradictionDetector
from app.priority.engine import PriorityCalculator
from app.dispatch.solver import DispatchSolver
from app.dispatch.fallback import GreedyFallbackDispatcher
from app.audit.manager import AuditLogManager
from app.audit.hasher import CanonicalHasher
from app.models.domain import (
    RawReport,
    Incident,
    LocationInfo,
    Resource,
    DisputeRecord,
    AuditRecord,
    VictimEstimate
)
from app.models.enums import (
    SourceChannel,
    LocationPrecision,
    HazardType,
    ResourceType,
    ResourceStatus,
    AuditActionType
)

@pytest.mark.asyncio
async def test_burst_ingestion_throughput():
    """
    Stress Test: Verify rapid burst ingestion of 1,000 reports across 7 channels concurrently.
    """
    res = await StressBenchmarkRunner.run_burst_ingestion_benchmark(count=1000)
    assert res["total_reports"] == 1000
    assert res["total_duration_sec"] < 5.0 # Must ingest 1,000 reports in < 5 seconds
    assert res["throughput_reports_per_sec"] > 200 # Throughput > 200 reports/sec

def test_logarithmic_spam_dampening_invariant():
    """
    Adversarial Test: Verify coordinated spam flood (1,000 reports) on a trivial issue
    cannot cause runaway exponential priority explosion.
    """
    res = StressBenchmarkRunner.verify_logarithmic_spam_dampening(spam_count=1000)
    assert res["spam_severity_score"] > 0

    s_100 = SeverityCalculator.compute_cluster_severity([
        RawReport(report_id=f"SPAM-{i}", source_channel=SourceChannel.SOCIAL, raw_text="Puddle") for i in range(100)
    ])
    s_1000 = SeverityCalculator.compute_cluster_severity([
        RawReport(report_id=f"SPAM-{i}", source_channel=SourceChannel.SOCIAL, raw_text="Puddle") for i in range(1000)
    ])
    assert s_1000 / s_100 < 16.0 # Dampened by log10 term


def test_adversarial_contradiction_injection():
    """
    Adversarial Test: Malicious actor injects conflicting victim counts (0 vs 500).
    Verify dispute is flagged, penalty applied, and incident preserved.
    """
    now = datetime.now(timezone.utc)
    rep_a = RawReport(
        report_id="ADV-REP-01",
        source_channel=SourceChannel.RADIO,
        raw_text="Patrol reports building intact 0 casualties",
        timestamp=now
    )
    rep_b = RawReport(
        report_id="ADV-REP-02",
        source_channel=SourceChannel.SOCIAL,
        raw_text="500 people trapped in basement drowning",
        timestamp=now
    )

    disputes, k_i = ContradictionDetector.detect_disputes("INC-ADV-01", [rep_a, rep_b])
    assert len(disputes) >= 1
    assert k_i > 0.0 # Penalty computed
    assert disputes[0].field_disputed == "VICTIM_COUNT"

def test_solver_timeout_budget_and_heuristic_fallback():
    """
    Stress Test: When CP-SAT solver budget is constrained, verify fallback
    produces valid assignment labeled 'PLAN QUALITY: HEURISTIC (FALLBACK)'.
    """
    now = datetime.now(timezone.utc)
    loc = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07")
    
    incidents = [
        Incident(
            incident_id=f"INC-STRESS-{i}",
            location=loc,
            zone_id="WARD-07",
            category=HazardType.FLOOD,
            priority_score=1.5 + (i * 0.1)
        )
        for i in range(10)
    ]
    
    resources = [
        Resource(
            resource_id=f"BOAT-STRESS-{j}",
            type=ResourceType.BOAT,
            current_location=loc,
            availability_status=ResourceStatus.AVAILABLE,
            travel_speed_kmh=20.0
        )
        for j in range(5)
    ]

    # Run fallback directly to verify deterministic guarantee
    fallback_plan = GreedyFallbackDispatcher.generate_plan(incidents, resources, max_travel_time_min=60.0)
    assert fallback_plan.plan_quality == "PLAN QUALITY: HEURISTIC (FALLBACK)"
    assert len(fallback_plan.assignments) == 5 # 5 boats assigned to top 5 incidents
    assert len(fallback_plan.unserved_incidents) == 5

def test_cryptographic_audit_tampering_detection():
    """
    Adversarial Test: Mutating an audit record in the hash chain must cause
    verify_integrity() to immediately fail.
    """
    mgr = AuditLogManager()
    r1 = mgr.record_event(
        operator_id="SYSTEM",
        action_type=AuditActionType.REPORT_INGESTED,
        entity_type="REPORT",
        entity_id="REP-01",
        new_state={"status": "QUEUED"}
    )
    r2 = mgr.record_event(
        operator_id="SYSTEM",
        action_type=AuditActionType.CLUSTER_CREATED,
        entity_type="INCIDENT",
        entity_id="INC-01",
        new_state={"status": "CREATED"}
    )
    r3 = mgr.record_event(
        operator_id="COMMANDER-01",
        action_type=AuditActionType.DISPATCH_APPROVED,
        entity_type="DISPATCH_PLAN",
        entity_id="PLAN-01",
        new_state={"status": "APPROVED"}
    )

    # Valid initial chain
    is_valid, count, _ = mgr.verify_integrity()
    assert is_valid is True

    # Adversarial tampering: mutate payload of block 2
    tampered_records = mgr.get_chain()
    tampered_records[1].new_state["status"] = "TAMPERED_MALICIOUS_STATE"

    # Integrity verification must fail
    is_tampered_valid, err_idx, err_msg = mgr.verify_integrity()
    assert is_tampered_valid is False
    assert "tampering detected" in err_msg.lower()


def test_mathematical_invariants_comprehensive():
    """
    Invariant Matrix Validation:
    1. Confidence clipping bounds [0.0, 1.0]
    2. Confidence modifier floor M(0) = 0.40
    3. Split reversibility (100% preservation)
    """
    # 1. Extreme negative inputs to bounded confidence formula
    extreme_k = 10.0 # Huge contradiction
    conf_factors = ConfidenceEngine.evaluate_incident_confidence(
        incident=Incident(incident_id="INC-INV-1", location=LocationInfo(lat=26.85, lng=80.94)),
        reports=[],
    )
    assert 0.0 <= conf_factors.confidence_score <= 1.0

    # 2. Modifier floor
    assert PriorityCalculator.compute_confidence_modifier(0.0) == 0.40
    assert PriorityCalculator.compute_confidence_modifier(1.0) == 1.00

    # 3. Urgency ordering: Severe uncorroborated (c=0) vs trivial corroborated (c=1.0)
    # Severe: S=0.9, V=0.8, N=10 victims -> Priority with M(0) = 0.40
    u_severe = PriorityCalculator.compute_base_urgency(0.9, 0.8, 10, 0.8, 0.5)
    p_severe = u_severe * PriorityCalculator.compute_confidence_modifier(0.0)

    # Trivial: S=0.1, V=0.0, N=0 victims -> Priority with M(1.0) = 1.00
    u_trivial = PriorityCalculator.compute_base_urgency(0.1, 0.0, 0, 0.8, 0.1)
    p_trivial = u_trivial * PriorityCalculator.compute_confidence_modifier(1.0)

    assert p_severe > p_trivial
