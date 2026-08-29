from typing import List, Dict, Optional, Any
from datetime import datetime, timezone
from ..models.domain import Venue, LocationInfo, Coordinates
from ..models.enums import VenueType, VenueStatus, LocationPrecision

class VenueManager:
    """
    Manages critical venue network across the operational district.
    Tracks hospital bed surge, shelter capacity, and generates flood risk advisories.
    """
    def __init__(self):
        self._venues: Dict[str, Venue] = {}
        self._initialize_default_venues()

    def _initialize_default_venues(self):
        # 1. District Headquarters Hospital
        hosp = Venue(
            venue_id="VEN-HOSP-01",
            name="District General Hospital & Trauma Centre",
            venue_type=VenueType.HOSPITAL,
            location=LocationInfo(lat=26.8480, lng=80.9380, ward_id="WARD-03", precision=LocationPrecision.HIGH),
            zone_id="WARD-03",
            capacity=250,
            current_occupancy=210,
            status=VenueStatus.OPEN,
            power_status="GENERATOR_BACKUP",
            medical_supply_level="SUFFICIENT",
            contact_phone="+91-522-220011",
            notes="ICU 92% full. Casualty triage bay active."
        )

        # 2. Community Relief Shelter (Govt Inter College)
        shelter = Venue(
            venue_id="VEN-SHELTER-01",
            name="Sector 4 Public Relief Camp (Govt Inter College)",
            venue_type=VenueType.SHELTER,
            location=LocationInfo(lat=26.8440, lng=80.9350, ward_id="WARD-04", precision=LocationPrecision.HIGH),
            zone_id="WARD-04",
            capacity=600,
            current_occupancy=480,
            status=VenueStatus.OPEN,
            power_status="GRID",
            medical_supply_level="LIMITED",
            contact_phone="+91-522-220044",
            notes="Dry rations available for 3 days. Clean drinking water tanker on site."
        )

        # 3. Municipal Logistics Depot
        depot = Venue(
            venue_id="VEN-DEPOT-01",
            name="Central Disaster Logistics & Boat Staging Depot",
            venue_type=VenueType.RELIEF_CENTER,
            location=LocationInfo(lat=26.8520, lng=80.9300, ward_id="WARD-01", precision=LocationPrecision.HIGH),
            zone_id="WARD-01",
            capacity=1000,
            current_occupancy=120,
            status=VenueStatus.OPEN,
            power_status="GRID",
            medical_supply_level="SUFFICIENT",
            contact_phone="+91-522-220099",
            notes="Staging ground for NDRF/SDRF rubber boats and high-clearance trucks."
        )


        self._venues[hosp.venue_id] = hosp
        self._venues[shelter.venue_id] = shelter
        self._venues[depot.venue_id] = depot

    def get_venue(self, venue_id: str) -> Optional[Venue]:
        return self._venues.get(venue_id)

    def list_venues(self) -> List[Venue]:
        return list(self._venues.values())

    def update_occupancy(self, venue_id: str, delta_occupants: int) -> Venue:
        v = self.get_venue(venue_id)
        if not v:
            raise KeyError(f"Venue {venue_id} not found")
        v.capacity_current = max(0, min(v.capacity_total * 2, v.capacity_current + delta_occupants))
        return v

    def evaluate_surge_status(self, venue: Venue) -> str:
        """
        Returns surge tier: NORMAL | NEAR_CAPACITY | OVER_CAPACITY
        """
        if venue.capacity_total == 0:
            return "NORMAL"
        ratio = venue.capacity_current / float(venue.capacity_total)
        if ratio >= 1.0:
            return "OVER_CAPACITY"
        elif ratio >= 0.85:
            return "NEAR_CAPACITY"
        return "NORMAL"

    def check_flood_threat(self, venue: Venue, ward_water_depth_meters: float) -> Optional[str]:
        """
        Checks if flood water threatens venue operations.
        """
        if ward_water_depth_meters >= 1.5:
            return f"URGENT: Flood water level ({ward_water_depth_meters}m) threatens {venue.name}. Evacuation transfer recommended."
        return None

venue_manager = VenueManager()
