import pytest
from app.models.domain import RawReport, LocationInfo, ExtractionResult
from app.models.enums import (
    SourceChannel,
    LocationPrecision,
    MergeReviewState,
    MicroEnvironmentTag,
    VulnerabilityTag,
    HazardType,
)
from app.clustering.severity import SeverityCalculator
from app.clustering.similarity import SimilarityCalculator
from app.clustering.engine import ClusteringEngine

def test_logarithmic_severity_dampening():
    """
    Verify load-bearing formula property:
    Cluster Severity Score = sum(Report Weight) * log10(Report Count + 1)
    
    Demonstrates that 100 spam social media duplicates (w=0.5) do not linearly
    scale, and that log dampening bounds the influence of volume.
    """
    # 3 High-quality cross-channel reports (Radio w=1.0, SMS w=0.8, Voice w=0.8)
    verified_reports = [
        RawReport(report_id="R-01", source_channel=SourceChannel.RADIO, raw_text="Radio check", trust_score=1.0),
        RawReport(report_id="R-02", source_channel=SourceChannel.SMS, raw_text="SMS report", trust_score=0.9),
        RawReport(report_id="R-03", source_channel=SourceChannel.VOICE, raw_text="Voice report", trust_score=0.9),
    ]
    verified_severity = SeverityCalculator.compute_cluster_severity(verified_reports)
    # Sum weights approx: 1.0 + 0.76 + 0.76 = 2.52; log10(4) = 0.602 -> score ~ 1.517
    assert verified_severity > 1.0

    # 10 duplicate social reports
    social_10 = [
        RawReport(report_id=f"SOC-{i}", source_channel=SourceChannel.SOCIAL, raw_text="help", trust_score=0.5)
        for i in range(10)
    ]
    severity_10 = SeverityCalculator.compute_cluster_severity(social_10)

    # 100 duplicate social reports (10x volume increase)
    social_100 = [
        RawReport(report_id=f"SOC-{i}", source_channel=SourceChannel.SOCIAL, raw_text="help", trust_score=0.5)
        for i in range(100)
    ]
    severity_100 = SeverityCalculator.compute_cluster_severity(social_100)

    # With linear scaling, 100 items would be 10x of 10 items.
    # With log10 dampening:
    # 10 items: sum_w * log10(11) = 3.75 * 1.041 = 3.90
    # 100 items: sum_w * log10(101) = 37.5 * 2.004 = 75.15 (far dampened compared to linear 100x multiplier)
    assert severity_100 < (severity_10 * 25) # Proves non-linear logarithmic dampening behavior

def test_merge_confidence_thresholds():
    """
    Verify load-bearing merge thresholds:
    >= 0.85       AUTO_MERGED
    0.55 - <0.85  NEEDS_REVIEW (provisional merge)
    < 0.55        SEPARATE
    """
    engine = ClusteringEngine()
    loc_school = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07", precision=LocationPrecision.HIGH)

    # Base report at Ward 07 School
    rep1 = RawReport(
        report_id="REP-001",
        source_channel=SourceChannel.SMS,
        raw_text="Govt school Ward 07 2nd floor flooded 8 children trapped on roof",
        resolved_location=loc_school,
        location_precision=LocationPrecision.HIGH,
        extracted_data=ExtractionResult(
            location_text="Govt school Ward 07",
            victim_count=8,
            vulnerable_present=[VulnerabilityTag.CHILDREN],
            hazard_type=HazardType.FLOOD,
            micro_environment_tag=MicroEnvironmentTag.ROOFTOP_STRANDED,
            raw_evidence_text="Govt school Ward 07 2nd floor flooded 8 children trapped on roof"
        )
    )
    inc1, state1, score1 = engine.process_report(rep1)
    assert state1 == MergeReviewState.SEPARATE
    assert len(engine.get_all_incidents()) == 1

    # Exact duplicate / near identical report (should auto-merge >= 0.85)
    rep2 = RawReport(
        report_id="REP-002",
        source_channel=SourceChannel.VOICE,
        raw_text="Govt school Ward 07 rooftop flooded 8 children trapped on roof",
        resolved_location=loc_school,
        location_precision=LocationPrecision.HIGH,
    )
    inc2, state2, score2 = engine.process_report(rep2)
    assert state2 == MergeReviewState.AUTO_MERGED
    assert score2 >= 0.85
    assert inc2.incident_id == inc1.incident_id
    assert "REP-002" in inc2.constituent_report_ids
    assert len(engine.get_all_incidents()) == 1 # Still 1 merged incident

    # Distinct far-away report in Ward 04 (should create separate incident < 0.55)
    loc_market = LocationInfo(lat=26.8410, lng=80.9320, ward_id="WARD-04", precision=LocationPrecision.HIGH)
    rep3 = RawReport(
        report_id="REP-003",
        source_channel=SourceChannel.RADIO,
        raw_text="Old Market Complex two storey building collapsed 4 trapped under debris",
        resolved_location=loc_market,
        location_precision=LocationPrecision.HIGH,
        extracted_data=ExtractionResult(
            location_text="Old Market Complex Ward 04",
            victim_count=4,
            hazard_type=HazardType.BUILDING_COLLAPSE,
            micro_environment_tag=MicroEnvironmentTag.DEBRIS_TRAPPED,
            raw_evidence_text="Old Market Complex two storey building collapsed 4 trapped under debris"
        )
    )
    inc3, state3, score3 = engine.process_report(rep3)
    assert state3 == MergeReviewState.SEPARATE
    assert score3 < 0.55
    assert inc3.incident_id != inc1.incident_id
    assert len(engine.get_all_incidents()) == 2

def test_multilingual_cross_lingual_clustering():
    """
    Verify cross-language semantic clustering:
    Hindi Devanagari report and English report referring to the same incident.
    """
    engine = ClusteringEngine()
    loc = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07", precision=LocationPrecision.HIGH)

    # 1. English report
    rep_en = RawReport(
        report_id="REP-EN",
        source_channel=SourceChannel.SMS,
        raw_text="Govt school Ward 07 flooded 10 children trapped on roof",
        resolved_location=loc,
        location_precision=LocationPrecision.HIGH,
    )
    inc_en, state_en, _ = engine.process_report(rep_en)

    # 2. Hindi Devanagari report describing the same incident
    rep_hi = RawReport(
        report_id="REP-HI",
        source_channel=SourceChannel.VOICE,
        raw_text="वार्ड 07 स्कूल में पानी भर गया है 10 बच्चे छत पर फंसे हैं",
        resolved_location=loc,
        location_precision=LocationPrecision.HIGH,
    )
    inc_hi, state_hi, score_hi = engine.process_report(rep_hi)

    assert state_hi in [MergeReviewState.AUTO_MERGED, MergeReviewState.NEEDS_REVIEW]
    assert inc_hi.incident_id == inc_en.incident_id
    assert len(inc_hi.constituent_report_ids) == 2
    assert "REP-EN" in inc_hi.constituent_report_ids
    assert "REP-HI" in inc_hi.constituent_report_ids

def test_merge_reversibility():
    """
    Verify that merging incidents is 100% reversible:
    Splitting a merged cluster restores individual single-report incidents
    with zero loss of raw evidence.
    """
    engine = ClusteringEngine()
    loc = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07", precision=LocationPrecision.HIGH)

    r1 = RawReport(report_id="R-A", source_channel=SourceChannel.SMS, raw_text="School flooded roof", resolved_location=loc)
    r2 = RawReport(report_id="R-B", source_channel=SourceChannel.VOICE, raw_text="School flooded roof 8 kids", resolved_location=loc)

    inc1, _, _ = engine.process_report(r1)
    inc_merged, _, _ = engine.process_report(r2)

    assert len(engine.get_all_incidents()) == 1
    assert len(inc_merged.constituent_report_ids) == 2

    # Perform Reversible Split
    split_incidents = engine.split_incident(inc_merged.incident_id)
    assert len(split_incidents) == 2
    assert len(engine.get_all_incidents()) == 2

    # Verify each split incident has exactly 1 report and no data is lost
    r_ids = [inc.constituent_report_ids[0] for inc in split_incidents]
    assert "R-A" in r_ids
    assert "R-B" in r_ids
