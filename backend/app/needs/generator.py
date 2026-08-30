from typing import Optional, List
from datetime import datetime
from app.models.domain import Incident, ShelterUtilityStatus, NeedCard, HazardType, WaterStatus
from .partners import match_partners

def generate_need_card(
    incident: Incident, 
    shelter_status: Optional[ShelterUtilityStatus] = None, 
    closed_road_segments: Optional[List[str]] = None
) -> Optional[NeedCard]:
    
    if closed_road_segments is None:
        closed_road_segments = []
        
    # Trigger condition: SHELTER_UTILITY_FAILURE or priority > threshold
    if incident.category != HazardType.SHELTER_UTILITY_FAILURE and incident.priority_score <= 5.0:
        return None
        
    needed_items = []
    
    # Rule 1: water_status == CONTAMINATED -> water+chlorine+ORS
    if shelter_status and shelter_status.water_status == WaterStatus.CONTAMINATED:
        needed_items.extend(["water", "chlorine", "ORS"])
        
    # Rule 2: power_status == False + cold_chain -> insulin/cold-chain flag
    if shelter_status and not shelter_status.power_status and shelter_status.medicine_cold_chain_status:
        needed_items.extend(["insulin", "cold-chain"])
        
    # Rule 3: category == FLOOD + vulnerable=[children] -> infant nutrition
    if incident.category == HazardType.FLOOD and "children" in incident.vulnerability_tags:
        needed_items.append("infant nutrition")
        
    # Determine Status Label based on confidence
    if incident.confidence_score > 0.8:
        status_label = "VERIFIED"
    elif incident.confidence_score > 0.4:
        status_label = "UNDER VERIFICATION"
    else:
        status_label = "NO DATA - UNKNOWN STATUS"
        
    if incident.trust_state != "NORMAL" or getattr(incident, 'disputed_flag', False):
        status_label = "DISPUTED"
        
    # Access note
    route_segment_id = getattr(incident, "route_segment_id", None)
    access_note = "Route clear"
    if route_segment_id and route_segment_id in closed_road_segments:
        access_note = "Road is closed"
        
    affected_population = shelter_status.affected_population if shelter_status else incident.victim_estimate.best_guess
    
    # Partner matching
    recommended = match_partners(needed_items, incident.location.centroid if hasattr(incident.location, 'centroid') else (incident.location.lat, incident.location.lng), route_segment_id, closed_road_segments)
    
    description = ", ".join(needed_items) if needed_items else "General assessment needed"
    priority = "HIGH" if incident.priority_score > 7.0 else "MEDIUM"
    status = status_label if status_label in ["PENDING", "VERIFIED", "DISPUTED"] else "PENDING"
    
    return NeedCard(
        need_id=f"NEED-{incident.incident_id}",
        incident_id=incident.incident_id,
        category=incident.category.value if hasattr(incident.category, 'value') else str(incident.category),
        description=f"{description}. {access_note}",
        quantity_needed=affected_population,
        priority=priority,
        status=status
    )
