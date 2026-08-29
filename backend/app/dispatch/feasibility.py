import math
from typing import Dict, List, Tuple, Any
from ..models.domain import Incident, Resource, LocationInfo

from ..models.enums import ResourceType, ResourceStatus, HazardType, MicroEnvironmentTag

# Capability matrix mapping resource types to compatible hazards and micro-environments
RESOURCE_CAPABILITIES: Dict[ResourceType, Dict[str, Any]] = {
    ResourceType.BOAT: {
        "hazards": [HazardType.FLOOD],
        "micro_envs": [MicroEnvironmentTag.ROOFTOP_STRANDED, MicroEnvironmentTag.DROWNING_RISK, MicroEnvironmentTag.NONE, MicroEnvironmentTag.CUT_OFF_ACCESS],
        "avg_speed_kmh": 20.0,
        "flood_required": True,
    },
    ResourceType.EXCAVATOR: {
        "hazards": [HazardType.BUILDING_COLLAPSE, HazardType.ROAD_WASHOUT, HazardType.BRIDGE_FAILURE, HazardType.LANDSLIDE],
        "micro_envs": [MicroEnvironmentTag.DEBRIS_TRAPPED, MicroEnvironmentTag.CRUSH_INJURY, MicroEnvironmentTag.NONE, MicroEnvironmentTag.CUT_OFF_ACCESS],
        "avg_speed_kmh": 25.0,
        "flood_required": False,
    },
    ResourceType.AMBULANCE: {
        "hazards": [HazardType.MEDICAL_EMERGENCY, HazardType.FLOOD, HazardType.BUILDING_COLLAPSE, HazardType.OTHER],
        "micro_envs": [MicroEnvironmentTag.CRUSH_INJURY, MicroEnvironmentTag.NONE],
        "avg_speed_kmh": 45.0,
        "flood_required": False,
    },
    ResourceType.MEDICAL_TEAM: {
        "hazards": [HazardType.MEDICAL_EMERGENCY, HazardType.FLOOD, HazardType.BUILDING_COLLAPSE, HazardType.ELECTRICAL_FAULT, HazardType.OTHER],
        "micro_envs": [MicroEnvironmentTag.CRUSH_INJURY, MicroEnvironmentTag.DROWNING_RISK, MicroEnvironmentTag.NONE],
        "avg_speed_kmh": 35.0,
        "flood_required": False,
    },
    ResourceType.HIGH_CLEARANCE_VEHICLE: {
        "hazards": [HazardType.FLOOD, HazardType.ROAD_WASHOUT, HazardType.BRIDGE_FAILURE],
        "micro_envs": [MicroEnvironmentTag.CUT_OFF_ACCESS, MicroEnvironmentTag.NONE],
        "avg_speed_kmh": 30.0,
        "flood_required": False,
    },
    ResourceType.RESCUE_HELICOPTER: {
        "hazards": [HazardType.FLOOD, HazardType.BUILDING_COLLAPSE, HazardType.LANDSLIDE],
        "micro_envs": [MicroEnvironmentTag.ROOFTOP_STRANDED, MicroEnvironmentTag.CUT_OFF_ACCESS, MicroEnvironmentTag.NONE],
        "avg_speed_kmh": 120.0,
        "flood_required": False,
    },
}

class FeasibilityChecker:
    """
    Checks physical and operational feasibility of assigning a resource to an incident,
    and calculates estimated travel time.
    """
    @staticmethod
    def is_feasible(resource: Resource, incident: Incident) -> bool:
        """Checks if resource type is operationally capable of serving the incident."""
        if resource.availability_status != ResourceStatus.AVAILABLE:
            return False

        caps = RESOURCE_CAPABILITIES.get(resource.type)
        if not caps:
            return False

        # Match hazard compatibility
        hazard_match = incident.category in caps["hazards"]
        # Match micro-environment compatibility
        micro_match = incident.micro_environment in caps["micro_envs"]

        return hazard_match and micro_match

    @staticmethod
    def calculate_travel_time_minutes(
        resource: Resource,
        incident: Incident,
        road_speed_factor: float = 1.0
    ) -> float:
        """
        Calculates travel time t_r,i = (distance_km / effective_speed_kmh) * 60.
        """
        loc1 = resource.current_location
        loc2 = incident.location

        lat1, lon1 = loc1.lat, loc1.lng
        lat2, lon2 = loc2.lat, loc2.lng

        # Haversine distance
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        dist_km = R * c

        caps = RESOURCE_CAPABILITIES.get(resource.type, {})
        base_speed = resource.travel_speed_kmh or caps.get("avg_speed_kmh", 30.0)
        effective_speed = max(5.0, base_speed * road_speed_factor)

        # Urban road winding factor (~1.3x Euclidean distance)
        road_dist_km = dist_km * 1.3
        travel_time_min = (road_dist_km / effective_speed) * 60.0

        return round(travel_time_min, 1)
