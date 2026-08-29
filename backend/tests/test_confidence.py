import pytest
from datetime import datetime, timezone, timedelta
from app.models.domain import (
    Incident,
    RawReport,
    LocationInfo,
    ExtractionResult,
    VisualEvidenceMetadata,
    VictimEstimate,
)
from app.models.enums import (
    SourceChannel,
    LocationPrecision,
    HazardType,
    MicroEnvironmentTag,
    VulnerabilityTag,
    TelecomStatus,
)
from app.confidence.engine import ConfidenceEngine
from app.confidence.factors import FactorEvaluator
from app.confidence.contradiction import ContradictionDetector
from app.confidence.dark_zone import DarkZoneEvaluator
from app.ingestion.processor import zone_tracker

def test_bounded_confidence_clipping_and_invariants():
    """
    Verify bounded confidence formula invariants:
    C_i = clip(b + w_s*S_i + w_g*G_i + w_t*T_i + w_v*V_i - w_c*K_i, 0, 1)
    """
    loc = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07", precision=LocationPrecision.HIGH)
    inc = Incident(
        incident_id="INC-CONF-01",
        location=loc,
        zone_id="WARD-07",
    )

    # 1. Optimal corroboration across 3 channels + recent timestamp
    now = datetime.now(timezone.utc)
    reports = [
        RawReport(report_id="R1", source_channel=SourceChannel.RADIO, raw_text="Clear radio report", timestamp=now, resolved_location=loc),
        RawReport(report_id="R2", source_channel=SourceChannel.SMS, raw_text="Clear SMS report", timestamp=now, resolved_location=loc),
        RawReport(report_id="R3", source_channel=SourceChannel.VOICE, raw_text="Clear voice report", timestamp=now, resolved_location=loc),
    ]

    inc_eval = ConfidenceEngine.evaluate_incident_confidence(inc, reports, current_time=now)
    assert 0.70 <= inc_eval.confidence_score <= 1.0
    assert inc_eval.dispute_flag is False
    assert inc_eval.confidence_factors.contradiction_penalty == 0.0

def test_cross_channel_corroboration_advantage():
    """
    Verify cross-channel corroboration gives materially higher confidence
    than repeated single-channel duplicates.
    """
    now = datetime.now(timezone.utc)
    loc = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07", precision=LocationPrecision.HIGH)

    # 3 Reports all from same channel (SMS)
    single_channel_reps = [
        RawReport(report_id=f"SMS-{i}", source_channel=SourceChannel.SMS, raw_text=f"SMS update {i}", timestamp=now, resolved_location=loc)
        for i in range(3)
    ]
    s_single = FactorEvaluator.evaluate_source_corroboration(single_channel_reps)

    # 3 Reports from 3 distinct independent channels (Radio, SMS, Voice)
    multi_channel_reps = [
        RawReport(report_id="M-1", source_channel=SourceChannel.RADIO, raw_text="Radio", timestamp=now, resolved_location=loc),
        RawReport(report_id="M-2", source_channel=SourceChannel.SMS, raw_text="SMS", timestamp=now, resolved_location=loc),
        RawReport(report_id="M-3", source_channel=SourceChannel.VOICE, raw_text="Voice", timestamp=now, resolved_location=loc),
    ]
    s_multi = FactorEvaluator.evaluate_source_corroboration(multi_channel_reps)

    # Cross-channel corroboration must be materially higher
    assert s_multi > s_single
    assert s_multi >= 1.0
    assert s_single <= 0.55

def test_contradiction_detection_and_penalty():
    """
    Verify dispute detection:
    - Sets dispute_flag = True
    - Captures both Claim A and Claim B without averaging them
    - Applies contradiction penalty K_i reducing confidence
    """
    loc = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07", precision=LocationPrecision.HIGH)
    now = datetime.now(timezone.utc)

    # Report A: 6 victims
    rep_a = RawReport(
        report_id="REP-A",
        source_channel=SourceChannel.SMS,
        raw_text="School flooded 6 kids on 2nd floor roof",
        timestamp=now,
        resolved_location=loc,
        extracted_data=ExtractionResult(victim_count=6, raw_evidence_text="School flooded 6 kids on 2nd floor roof")
    )
    # Report B: 18 victims (severe conflict)
    rep_b = RawReport(
        report_id="REP-B",
        source_channel=SourceChannel.RADIO,
        raw_text="School flooded 18 students trapped on roof",
        timestamp=now,
        resolved_location=loc,
        extracted_data=ExtractionResult(victim_count=18, raw_evidence_text="School flooded 18 students trapped on roof")
    )

    inc = Incident(incident_id="INC-DISP-01", location=loc, zone_id="WARD-07")
    inc_eval = ConfidenceEngine.evaluate_incident_confidence(inc, [rep_a, rep_b], current_time=now)

    assert inc_eval.dispute_flag is True
    assert len(inc_eval.disputes) >= 1
    disp = inc_eval.disputes[0]
    assert disp.field_disputed == "VICTIM_COUNT"
    assert "6" in disp.claim_a_text
    assert "18" in disp.claim_b_text
    assert disp.resolved is False
    # Contradiction penalty K_i applied
    assert inc_eval.confidence_factors.contradiction_penalty > 0.0

def test_dark_zone_evaluation_and_honesty():
    """
    Verify dark-zone evaluation:
    - Never rendered as safe
    - Silence >= 45 min triggers NO DATA — UNKNOWN STATUS
    - Differentiates high-population dark zone from low-population dark zone
    """
    now = datetime.now(timezone.utc)

    # Simulate telecom blackout on high-population Ward 09 (pop 8600)
    zone_tracker.record_activity("WARD-09", now - timedelta(minutes=60))
    zone_tracker.set_telecom_status("WARD-09", TelecomStatus.DARK)

    # Simulate silence on low-population Ward 08 (pop 3100)
    zone_tracker.record_activity("WARD-08", now - timedelta(minutes=60))

    assessments = DarkZoneEvaluator.get_dark_zone_assessments(now)
    w9 = next(z for z in assessments if z["zone_id"] == "WARD-09")
    w8 = next(z for z in assessments if z["zone_id"] == "WARD-08")

    assert w9["is_dark"] is True
    assert w9["ui_display_status"] == "NO DATA — UNKNOWN STATUS"
    assert w9["risk_tier"] == "CRITICAL_INFORMATION_GAP"

    assert w8["is_dark"] is True
    assert w8["ui_display_status"] == "NO DATA — UNKNOWN STATUS"
    assert w8["risk_tier"] == "MODERATE_INFORMATION_GAP"

def test_async_visual_evidence_fusion():
    """
    Verify asynchronous visual evidence arrival elevates confidence
    without blocking initial triage.
    """
    loc = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07", precision=LocationPrecision.HIGH)
    now = datetime.now(timezone.utc)
    reports = [
        RawReport(report_id="R-1", source_channel=SourceChannel.SMS, raw_text="School flooded", timestamp=now, resolved_location=loc)
    ]

    inc = Incident(incident_id="INC-ASYNC-01", location=loc, zone_id="WARD-07", visual_evidence=None)

    # Step 1: Initial triage without imagery
    inc_initial = ConfidenceEngine.evaluate_incident_confidence(inc, reports, current_time=now)
    conf_initial = inc_initial.confidence_score
    assert inc_initial.confidence_factors.visual_evidence is None

    # Step 2: Satellite imagery arrives asynchronously
    sat_evidence = VisualEvidenceMetadata(
        image_id="SAT-IMG-001",
        sensor_type="SENTINEL-2_OPTICAL",
        capture_time=now,
        flood_detected=True,
        inundated_area_pct=74.5,
        visual_confidence=0.88,
    )
    inc.visual_evidence = sat_evidence

    # Step 3: Recompute confidence
    inc_upgraded = ConfidenceEngine.evaluate_incident_confidence(inc, reports, current_time=now)
    assert inc_upgraded.confidence_factors.visual_evidence == 0.88
    assert inc_upgraded.confidence_score > conf_initial
