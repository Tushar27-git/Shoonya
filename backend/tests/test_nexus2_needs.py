import pytest
from app.models.domain import IncidentRecord, Location, ShelterUtilityStatus, WaterStatus, IncidentCategory, VictimEstimate
from app.needs.generator import generate_need_card

def test_shelter_utility_incident_generation():
    incident = IncidentRecord(
        incident_id="INC-001",
        location=Location(centroid=(28.6139, 77.2090)),
        category=IncidentCategory.SHELTER_UTILITY_FAILURE,
        confidence_score=0.9, # Should map to VERIFIED
        priority_score=6.0,
        route_segment_id="RS_CLOSED"
    )
    
    shelter_status = ShelterUtilityStatus(
        shelter_id="SH-01",
        name="Test Shelter",
        power_status=False,
        water_status=WaterStatus.CONTAMINATED,
        medicine_cold_chain_status=True,
        affected_population=500
    )
    
    closed_roads = ["RS_CLOSED"]
    
    need_card = generate_need_card(incident, shelter_status, closed_roads)
    
    assert need_card is not None
    assert need_card.incident_id == "INC-001"
    
    # Verify needed items
    assert "water" in need_card.needed_items
    assert "chlorine" in need_card.needed_items
    assert "ORS" in need_card.needed_items
    assert "insulin" in need_card.needed_items
    assert "cold-chain" in need_card.needed_items
    
    # Verify status label mapping
    assert need_card.status_label == "VERIFIED"
    
    # Verify partner matching excludes closed routes
    # Since RS_CLOSED is in closed_roads, it should return 0 partners
    assert len(need_card.recommended_partners) == 0
    assert need_card.access_note == "Road is closed"

def test_flood_incident_generation():
    incident = IncidentRecord(
        incident_id="INC-002",
        location=Location(centroid=(28.7041, 77.1025)),
        category=IncidentCategory.FLOOD,
        vulnerable_present=["children"],
        confidence_score=0.5, # Should map to UNDER VERIFICATION
        priority_score=8.0,
        route_segment_id="RS_OPEN"
    )
    
    closed_roads = ["RS_CLOSED"]
    
    need_card = generate_need_card(incident, closed_road_segments=closed_roads)
    
    assert need_card is not None
    assert "infant nutrition" in need_card.needed_items
    
    assert need_card.status_label == "UNDER VERIFICATION"
    assert need_card.access_note == "Route clear"
    
    # Global Food Network should be recommended
    assert "NGO_002" in need_card.recommended_partners
