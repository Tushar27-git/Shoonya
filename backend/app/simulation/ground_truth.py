from typing import Dict, List, Any
from datetime import datetime, timezone
from ..models.domain import LocationInfo, Coordinates
from ..models.enums import HazardType, RoadStatus, LocationPrecision

class GroundTruthWorld:
    """
    Maintains the objective physical reality of the disaster.
    CRITICAL INVARIANT: The operational platform (triage, priority, dispatch)
    NEVER queries GroundTruthWorld directly. It only receives imperfect observations.
    """
    def __init__(self):
        self.sim_time_minutes: int = 0
        
        # True flood depth in meters across district wards
        self.ward_flood_depths: Dict[str, float] = {
            "WARD-01": 0.1, # Dry / minor puddle
            "WARD-02": 0.8, # Station approach flooded
            "WARD-03": 0.2, # Safe
            "WARD-04": 1.4, # Old Market collapsed building
            "WARD-07": 2.6, # School 2nd floor submerged, rooftop victims
            "WARD-08": 0.4, # Low silence
            "WARD-09": 2.2, # Silent zone blackout, severe flood
        }

        # True trapped victim counts (hidden from platform until reported)
        self.true_victims: Dict[str, int] = {
            "WARD-07": 10, # 10 children on school roof
            "WARD-04": 6,  # 6 trapped under market rubble
            "WARD-02": 15, # 15 stranded on island
            "WARD-09": 35, # 35 uncontacted residents in dark zone
        }

        # True road statuses
        self.true_roads: Dict[str, RoadStatus] = {
            "ROAD-MAIN-01": RoadStatus.OPEN,
            "ROAD-STATION-02": RoadStatus.FLOODED,
            "ROAD-MARKET-03": RoadStatus.PARTIALLY_PASSABLE,
            "ROAD-BRIDGE-04": RoadStatus.CLOSED,
        }

    def advance_time(self, delta_minutes: int = 15):
        self.sim_time_minutes += delta_minutes
        
        # Dynamic flood propagation: water increases gradually
        self.ward_flood_depths["WARD-07"] = min(4.0, self.ward_flood_depths["WARD-07"] + 0.15 * (delta_minutes / 15.0))
        self.ward_flood_depths["WARD-04"] = min(3.0, self.ward_flood_depths["WARD-04"] + 0.10 * (delta_minutes / 15.0))
        self.ward_flood_depths["WARD-09"] = min(3.5, self.ward_flood_depths["WARD-09"] + 0.20 * (delta_minutes / 15.0))

    def reset(self):
        self.__init__()

ground_truth = GroundTruthWorld()
