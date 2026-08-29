import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.nlp.extractor import NLPExtractor
from app.models.enums import (
    LocationPrecision,
    MicroEnvironmentTag,
    VulnerabilityTag,
    HazardType,
)

client = TestClient(app)

def test_english_extraction():
    """Verify structured extraction from English emergency report."""
    text = "Flood water reached 2nd floor of Ward 07 Govt School. 8 children stranded on rooftop!"
    res = NLPExtractor.extract(text)
    
    assert res.victim_count == 8
    assert VulnerabilityTag.CHILDREN in res.vulnerable_present
    assert res.micro_environment_tag == MicroEnvironmentTag.ROOFTOP_STRANDED
    assert res.hazard_type == HazardType.FLOOD
    assert res.urgency_raw >= 0.7
    assert res.location_precision in [LocationPrecision.HIGH, LocationPrecision.MEDIUM]
    assert "WARD-07" in res.location_text.upper()

def test_hindi_devanagari_extraction():
    """Verify structured extraction from Hindi Devanagari text."""
    text = "स्कूल के पास पानी बहुत बढ़ गया है, 10 बच्चे फंसे हुए हैं, छत पर हैं और डूबने का खतरा है।"
    res = NLPExtractor.extract(text, location_hint="Ward 07 Govt School")
    
    assert res.victim_count == 10
    assert VulnerabilityTag.CHILDREN in res.vulnerable_present
    # Either ROOFTOP or DROWNING_RISK is detected based on high severity
    assert res.micro_environment_tag in [MicroEnvironmentTag.ROOFTOP_STRANDED, MicroEnvironmentTag.DROWNING_RISK]
    assert res.hazard_type == HazardType.FLOOD
    assert res.urgency_raw >= 0.75

def test_hinglish_code_switching_extraction():
    """Verify structured extraction from Hinglish Romanized Hindi text."""
    text = "Paani 2nd floor tak aa gaya bhai, chhat pe 8 log hain aur 2 buzurg hain. Please help urgent!"
    res = NLPExtractor.extract(text, location_hint="Ward 07")
    
    assert res.victim_count == 8
    assert VulnerabilityTag.ELDERLY in res.vulnerable_present
    assert res.micro_environment_tag == MicroEnvironmentTag.ROOFTOP_STRANDED
    assert res.hazard_type == HazardType.FLOOD
    assert res.urgency_raw >= 0.7

def test_debris_collapse_extraction():
    """Verify building collapse and debris entrapment extraction."""
    text = "Two storey building collapsed in Old Market Complex. 4 people trapped under debris with crush injuries."
    res = NLPExtractor.extract(text)
    
    assert res.victim_count == 4
    assert res.hazard_type == HazardType.BUILDING_COLLAPSE
    assert res.micro_environment_tag in [MicroEnvironmentTag.DEBRIS_TRAPPED, MicroEnvironmentTag.CRUSH_INJURY]
    assert VulnerabilityTag.INJURED in res.vulnerable_present or res.urgency_raw >= 0.85

def test_cut_off_access_extraction():
    """Verify road washout and islanded access extraction."""
    text = "Road pura cut ho gaya hai, bridge is broken near Station Approach, 15 people isolated with no access."
    res = NLPExtractor.extract(text)
    
    assert res.victim_count == 15
    assert res.micro_environment_tag == MicroEnvironmentTag.CUT_OFF_ACCESS
    assert res.hazard_type in [HazardType.BRIDGE_FAILURE, HazardType.ROAD_WASHOUT, HazardType.FLOOD]

def test_uncertainty_preservation():
    """
    Verify the extractor does NOT manufacture certainty when information is missing:
    - Missing victim count remains None
    - Vague text resolves to LocationPrecision.LOW
    """
    text = "Paani badh raha hai jaldi aao"
    res = NLPExtractor.extract(text)
    
    assert res.victim_count is None # Uncertainty preserved
    assert res.location_precision == LocationPrecision.LOW
    assert res.vulnerable_present == []
    assert res.micro_environment_tag == MicroEnvironmentTag.NONE

def test_nlp_api_endpoint():
    """Verify POST /nlp/extract endpoint."""
    payload = {
        "raw_text": "Ward 07 Govt School rooftop has 6 trapped students",
        "location_hint": "Ward 07"
    }
    response = client.post("/nlp/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["victim_count"] == 6
    assert "CHILDREN" in data["vulnerable_present"]
    assert data["micro_environment_tag"] == "ROOFTOP_STRANDED"
