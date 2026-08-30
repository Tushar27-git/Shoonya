import pytest
from app.nlp.extractor import parse_report_text
from app.models.enums import IncidentCategory, MicroEnvironment, SignalType

def test_benchmark_multilingual_flood():
    text = "Yahan paani second floor tak aa gaya hai, 6 log hain aur ek pregnant woman bhi hai"
    result = parse_report_text(text)
    
    assert result["category"] == IncidentCategory.FLOOD
    assert result["micro_environment"] == MicroEnvironment.ROOFTOP_STRANDED
    assert result["victim_estimate"]["value"] == 6
    assert result["victim_estimate"]["range_low"] == 5
    assert result["victim_estimate"]["range_high"] == 8
    assert "pregnant" in result["vulnerable_present"]
    assert result["is_weak_signal_only"] is False

def test_benchmark_shelter_utility():
    text = "Relief camp mein no power aur medicine spoiling"
    result = parse_report_text(text)
    
    assert result["category"] == IncidentCategory.SHELTER_UTILITY_FAILURE
    assert result["shelter_status"] is not None
    assert result["shelter_status"]["power_status"] is False
    assert result["shelter_status"]["medicine_cold_chain_status"] is False
    assert result["shelter_status"]["water_status"] == "SAFE"

def test_benchmark_weak_signal():
    text = "bridge creaking strange noise"
    result = parse_report_text(text)
    
    assert result["weak_signal_type"] == SignalType.UNUSUAL_SOUND
    assert result["is_weak_signal_only"] is True