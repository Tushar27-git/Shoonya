import pytest
from app.confidence.engine import (
    ConfidenceEngine,
    DisputeDetector,
    DarkZoneEngine,
    CoverageVsTrustMatrix
)

def test_confidence_bounds():
    engine = ConfidenceEngine(baseline=0.2, w_source=0.4, w_geo=0.15, w_temporal=0.15, w_visual=0.2, w_contradiction=0.35)
    
    # Test perfect confidence
    conf_high = engine.calculate_confidence(
        independent_sources=5, supporting_reports=10, geo_consistency=1.0,
        temporal_recency=1.0, visual_verified=True, contradiction_penalty=0.0
    )
    assert 0.0 <= conf_high <= 1.0
    
    # Test heavily contradicted, low-source confidence
    conf_low = engine.calculate_confidence(
        independent_sources=1, supporting_reports=100, geo_consistency=0.5,
        temporal_recency=0.5, visual_verified=False, contradiction_penalty=1.0
    )
    assert 0.0 <= conf_low <= 1.0
    assert conf_low < conf_high

def test_dispute_flag_activation():
    detector = DisputeDetector()
    reports = [
        {"victims": 2, "raw_text": "2 victims seen"},
        {"victims": 10, "raw_text": "10 victims seen"}
    ]
    is_disputed, claims = detector.evaluate_reports(reports)
    assert is_disputed is True
    assert len(claims) == 2

    reports_safe = [
        {"victims": 2, "raw_text": "2 victims seen"},
        {"victims": 3, "raw_text": "3 victims seen"}
    ]
    is_disputed, claims = detector.evaluate_reports(reports_safe)
    assert is_disputed is False

def test_dark_zone_classification():
    engine = DarkZoneEngine()
    
    # High population, DARK telecom, 24 hours silence, 0 reports
    is_dark, status, risk = engine.evaluate_silence_risk(
        population_density=20000.0,
        telecom_status="DARK",
        hours_since_last_report=24.0,
        report_count=0,
        hazard_exposure_factor=1.2
    )
    assert is_dark is True
    assert status == "NO DATA - UNKNOWN STATUS"
    
    # Same but with reports
    is_dark2, status2, risk2 = engine.evaluate_silence_risk(
        population_density=20000.0,
        telecom_status="DARK",
        hours_since_last_report=24.0,
        report_count=5,
        hazard_exposure_factor=1.2
    )
    assert is_dark2 is False

def test_coverage_trust_matrix():
    matrix = CoverageVsTrustMatrix()
    
    # High volume, low trust (many disputed reports, few independent sources)
    # total_reports=100, independent=5, disputed=80
    res_noisy = matrix.compute_zone_metrics(total_reports=100, independent_sources=5, disputed_count=80)
    assert res_noisy["quadrant"] == "NOISY_AND_UNVERIFIED"
    assert res_noisy["coverage"] >= 0.5
    assert res_noisy["trust"] < 0.5
    
    # Low volume, unknown trust (very few reports)
    res_sparse = matrix.compute_zone_metrics(total_reports=1, independent_sources=1, disputed_count=0)
    assert res_sparse["quadrant"] == "SILENT_AND_UNINVESTIGATED"
