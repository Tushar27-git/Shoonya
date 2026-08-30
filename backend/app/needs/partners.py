import math
from typing import List, Optional
from app.models.domain import NGOPartner

# Mock static list of partners
MOCK_PARTNERS: List[NGOPartner] = [
    NGOPartner(
        id="NGO_001",
        name="Red Cross Local",
        capabilities=["water", "ORS", "chlorine", "medical"],
        location=(28.6139, 77.2090),
        stock_available=True
    ),
    NGOPartner(
        id="NGO_002",
        name="Global Food Network",
        capabilities=["infant nutrition", "food"],
        location=(28.7041, 77.1025),
        stock_available=True
    ),
    NGOPartner(
        id="NGO_003",
        name="Cold Chain Responders",
        capabilities=["insulin", "cold-chain"],
        location=(28.5355, 77.3910),
        stock_available=True
    ),
    NGOPartner(
        id="NGO_004",
        name="Local Relief Initiative",
        capabilities=["water", "food", "blankets"],
        location=(28.6448, 77.2167),
        stock_available=True
    )
]

def _distance(loc1: tuple[float, float], loc2: tuple[float, float]) -> float:
    # simple euclidean distance for mock matching
    return math.sqrt((loc1[0] - loc2[0])**2 + (loc1[1] - loc2[1])**2)

def match_partners(needed_items: List[str], incident_location: tuple[float, float], route_segment_id: Optional[str], closed_road_segments: List[str]) -> List[str]:
    """
    Find matching partners based on capability tags, sort by distance,
    and reject if the route crosses a CLOSED road segment.
    """
    matched_partners = []
    
    # If the route segment is closed, no partner can reach (deterministic rejection based on incident's single segment)
    # In a real system, we'd check the path from NGO to incident. Here we use the simplified logic requested.
    if route_segment_id and route_segment_id in closed_road_segments:
        return []

    for partner in MOCK_PARTNERS:
        if not partner.stock_available:
            continue
            
        # Check if capabilities overlap with needed items
        has_capability = any(item in partner.capabilities for item in needed_items)
        if has_capability:
            matched_partners.append(partner)
            
    # Sort by distance
    matched_partners.sort(key=lambda p: _distance(p.location, incident_location))
    
    return [p.id for p in matched_partners]
