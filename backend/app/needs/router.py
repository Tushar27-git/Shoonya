from fastapi import APIRouter, HTTPException
from typing import List
from app.models.domain import NeedCard, ShelterUtilityStatus, WaterStatus
from .generator import generate_need_card
from app.clustering.engine import clustering_engine
# from app.dispatch.router import closed_road_segments  # We might just use an empty list or mock for now

router = APIRouter(prefix="/needs", tags=["Verified Need Cards"])

def _get_mock_shelter_status_for_incident(incident_id: str) -> ShelterUtilityStatus:
    # A mock to provide shelter status for incidents if they don't have it natively.
    # In a real app, this would be fetched from a database.
    return ShelterUtilityStatus(
        shelter_id=f"SH_{incident_id}",
        name=f"Shelter for {incident_id}",
        power_status=False,
        water_status=WaterStatus.CONTAMINATED,
        medicine_cold_chain_status=True,
        affected_population=150,
        linked_incident_id=incident_id
    )

@router.get("", response_model=List[NeedCard])
async def list_needs():
    active_incidents = clustering_engine.get_all_incidents()
    need_cards = []
    
    # We might have a global list of closed road segments somewhere. For now, empty list.
    closed_road_segments = [] 
    
    for incident in active_incidents:
        # Mocking shelter status if it's a SHELTER_UTILITY_FAILURE
        shelter_status = None
        if incident.category == "SHELTER_UTILITY_FAILURE":
            shelter_status = _get_mock_shelter_status_for_incident(incident.incident_id)
            
        card = generate_need_card(incident, shelter_status, closed_road_segments)
        if card:
            need_cards.append(card)
            
    return need_cards

@router.get("/{incident_id}", response_model=NeedCard)
async def get_need_by_incident(incident_id: str):
    incident = clustering_engine.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    shelter_status = None
    if incident.category == "SHELTER_UTILITY_FAILURE":
        shelter_status = _get_mock_shelter_status_for_incident(incident.incident_id)
        
    card = generate_need_card(incident, shelter_status, [])
    if not card:
        raise HTTPException(status_code=404, detail="No need card generated for this incident")
        
    return card
