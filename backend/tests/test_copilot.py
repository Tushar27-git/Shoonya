import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.copilot.engine import EOCCopilotEngine, copilot_engine
from app.copilot.sitrep import SitrepGenerator, sitrep_generator
from app.models.domain import Incident, LocationInfo, DisputeRecord, RawReport
from app.models.enums import LocationPrecision, HazardType, SourceChannel
from app.clustering.engine import clustering_engine

client = TestClient(app)

def test_incident_query_and_citations():
    """
    Verify copilot query for a specific incident grounds its answer in facts,
    includes citations, and generates executable proposed actions.
    """
    # Seed incident
    loc = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07", address="Govt School Ward 07")
    inc = Incident(
        incident_id="INC-COPILOT-01",
        location=loc,
        zone_id="WARD-07",
        category=HazardType.FLOOD,
        priority_score=1.85,
        confidence_score=0.45,
        dispute_flag=False
    )
    clustering_engine.add_incident(inc)

    res = copilot_engine.process_query("What is the current tactical status of INC-COPILOT-01?")
    
    assert res.message_id.startswith("COPILOT-")
    assert "INC-COPILOT-01" in res.citations
    assert len(res.proposed_actions) >= 1
    assert "LOW CONFIDENCE" in str(res.confidence_caveats)
    assert any(a.target_id == "INC-COPILOT-01" for a in res.proposed_actions)

def test_dark_zone_surveillance_query():
    """
    Verify copilot handles dark zone queries by stating unmonitored risk without hallucinating safety.
    """
    res = copilot_engine.process_query("Give me a situation update on Ward 09 dark zone")
    assert len(res.confidence_caveats) >= 1
    assert "WARD-09" in res.citations or "dark" in res.content.lower()
    assert any(a.action_type.value == "REQUEST_INFO" for a in res.proposed_actions)

def test_hospital_and_venue_surge_advisory():
    """
    Verify copilot alerts on critical infrastructure and hospital bed surge.
    """
    res = copilot_engine.process_query("What is the hospital bed occupancy and ICU capacity?")
    assert "VEN-HOSP-01" in res.citations or "hospital" in res.content.lower()
    assert "CRITICAL INFRASTRUCTURE" in res.content

def test_multilingual_hindi_and_hinglish_queries():
    """
    Verify copilot handles Hindi Devanagari and Hinglish queries.
    """
    # Hindi query
    res_hi = copilot_engine.process_query("वार्ड 7 में क्या स्थिति है?")
    assert res_hi.language_detected == "HI"
    assert len(res_hi.content) > 0

    # Hinglish query
    res_hing = copilot_engine.process_query("Hospital me beds available hain kya?")
    assert len(res_hing.content) > 0

def test_formal_sitrep_generation():
    """
    Verify SITREP generator compiles structured executive summary and casualty bounds.
    """
    sitrep = sitrep_generator.generate_current_sitrep()
    assert sitrep.sitrep_id.startswith("SITREP-")
    assert "OPERATIONAL SITUATION REPORT" in sitrep.executive_summary
    assert "min" in sitrep.casualty_bounds
    assert "max" in sitrep.casualty_bounds
    assert len(sitrep.operational_recommendations) >= 1

def test_copilot_api_endpoints():
    """
    Verify FastAPI endpoints /copilot/query and /copilot/sitrep.
    """
    # 1. Query endpoint
    query_payload = {"query": "Summarize top priority rescue incidents in the district"}
    res_query = client.post("/copilot/query", json=query_payload)
    assert res_query.status_code == 200
    data_q = res_query.json()
    assert "message_id" in data_q
    assert "citations" in data_q
    assert "proposed_actions" in data_q

    # 2. SITREP endpoint
    res_sitrep = client.get("/copilot/sitrep")
    assert res_sitrep.status_code == 200
    data_s = res_sitrep.json()
    assert "sitrep_id" in data_s
    assert "executive_summary" in data_s
