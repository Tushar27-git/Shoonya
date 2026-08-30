import pytest
from datetime import datetime, timedelta
from app.models.domain import WeakSignal
from app.models.enums import SignalType
from app.clustering.weak_signals import WeakSignalCorrelator, EmergingRiskZone

@pytest.fixture
def correlator():
    return WeakSignalCorrelator()

def test_emerging_risk_zone_trigger(correlator):
    now = datetime.utcnow()
    # 3 independent signals
    s1 = WeakSignal(signal_id="S1", signal_type=SignalType.TREMOR_FELT, location=(26.0, 91.0), timestamp=now, source_report_id="R1")
    s2 = WeakSignal(signal_id="S2", signal_type=SignalType.CRACK_OBSERVED, location=(26.001, 91.001), timestamp=now, source_report_id="R2")
    s3 = WeakSignal(signal_id="S3", signal_type=SignalType.WATER_LEVEL_RISING, location=(26.0, 91.001), timestamp=now, source_report_id="R3")
    
    correlator.ingest_signal(s1)
    correlator.ingest_signal(s2)
    correlator.ingest_signal(s3)
    
    result = correlator.evaluate_structure("EMB_1", "Embankment 1", (26.0, 91.0))
    assert result is not None
    assert isinstance(result, EmergingRiskZone)
    assert result.confidence > 0.0
    assert "3" in result.reason

def test_single_weak_signal_no_trigger(correlator):
    now = datetime.utcnow()
    s1 = WeakSignal(signal_id="S1", signal_type=SignalType.TREMOR_FELT, location=(26.0, 91.0), timestamp=now, source_report_id="R1")
    correlator.ingest_signal(s1)
    
    result = correlator.evaluate_structure("EMB_1", "Embankment 1", (26.0, 91.0))
    assert result is None

def test_correlated_sources_no_trigger(correlator):
    now = datetime.utcnow()
    # 3 signals but from the SAME source report (correlated)
    s1 = WeakSignal(signal_id="S1", signal_type=SignalType.TREMOR_FELT, location=(26.0, 91.0), timestamp=now, source_report_id="R1")
    s2 = WeakSignal(signal_id="S2", signal_type=SignalType.CRACK_OBSERVED, location=(26.001, 91.001), timestamp=now, source_report_id="R1")
    s3 = WeakSignal(signal_id="S3", signal_type=SignalType.WATER_LEVEL_RISING, location=(26.0, 91.001), timestamp=now, source_report_id="R1")
    
    correlator.ingest_signal(s1)
    correlator.ingest_signal(s2)
    correlator.ingest_signal(s3)
    
    result = correlator.evaluate_structure("EMB_1", "Embankment 1", (26.0, 91.0))
    assert result is None
