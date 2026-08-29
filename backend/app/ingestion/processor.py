import re
from typing import Optional, Dict, Tuple, List, Any
from datetime import datetime, timezone
from ..models.enums import LocationPrecision, SourceChannel, TelecomStatus
from ..models.domain import LocationInfo, Coordinates, RawReport
from ..config import settings

# Predefined district dictionary of wards and coarse boundaries
KNOWN_DISTRICT_ZONES: Dict[str, Dict[str, Any]] = {
    "WARD-01": {"name": "Civil Lines", "centroid": (26.8500, 80.9400), "radius_km": 1.2, "population": 6200},
    "WARD-02": {"name": "Hazratganj South", "centroid": (26.8450, 80.9450), "radius_km": 1.0, "population": 8400},
    "WARD-03": {"name": "Riverfront North", "centroid": (26.8620, 80.9380), "radius_km": 1.5, "population": 4300},
    "WARD-04": {"name": "Old Market Complex", "centroid": (26.8410, 80.9320), "radius_km": 1.1, "population": 9100},
    "WARD-05": {"name": "Station Approach", "centroid": (26.8320, 80.9250), "radius_km": 1.8, "population": 7800},
    "WARD-06": {"name": "East Embankment", "centroid": (26.8580, 80.9550), "radius_km": 1.4, "population": 5100},
    "WARD-07": {"name": "Govt School Basin", "centroid": (26.8510, 80.9490), "radius_km": 1.3, "population": 4820},
    "WARD-08": {"name": "Industrial Sector 4", "centroid": (26.8250, 80.9150), "radius_km": 2.0, "population": 3100},
    "WARD-09": {"name": "Low-lying Sarda Enclave", "centroid": (26.8680, 80.9620), "radius_km": 1.6, "population": 8600},
    "WARD-10": {"name": "West Canal Road", "centroid": (26.8390, 80.9100), "radius_km": 1.7, "population": 5400},
}

class ZoneActivityTracker:
    """
    Tracks channel communication status and silence duration per zone.
    Enforces the rule: Zero reports does not equal safe.
    """
    def __init__(self):
        self._zone_latest_report: Dict[str, datetime] = {}
        self._zone_telecom_status: Dict[str, TelecomStatus] = {
            z_id: TelecomStatus.LIVE for z_id in KNOWN_DISTRICT_ZONES
        }

    def record_activity(self, zone_id: str, timestamp: datetime):
        """Record activity in a zone and reset dark status."""
        self._zone_latest_report[zone_id] = timestamp
        self._zone_telecom_status[zone_id] = TelecomStatus.LIVE

    def set_telecom_status(self, zone_id: str, status: TelecomStatus):
        """Manually or simulator-driven telecom outage trigger."""
        self._zone_telecom_status[zone_id] = status

    def evaluate_zone_status(self, zone_id: str, current_time: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Evaluate if a zone is in DARK sensing mode.
        Cross references silence duration with population exposure.
        """
        now = current_time or datetime.now(timezone.utc)
        zone_info = KNOWN_DISTRICT_ZONES.get(zone_id, {"population": 1000, "name": zone_id})
        last_seen = self._zone_latest_report.get(zone_id)
        telecom_state = self._zone_telecom_status.get(zone_id, TelecomStatus.LIVE)

        silence_minutes = 0.0
        if last_seen:
            silence_minutes = (now - last_seen).total_seconds() / 60.0
        else:
            silence_minutes = 120.0 # Initial baseline silence

        is_dark = (
            telecom_state == TelecomStatus.DARK or
            silence_minutes >= settings.DARK_ZONE_SILENCE_MINUTES
        )

        return {
            "zone_id": zone_id,
            "zone_name": zone_info.get("name"),
            "population": zone_info.get("population", 1000),
            "telecom_status": telecom_state.value,
            "last_report_at": last_seen.isoformat() if last_seen else None,
            "silence_duration_minutes": round(silence_minutes, 1),
            "is_dark": is_dark,
            "operational_status": "NO DATA — UNKNOWN STATUS" if is_dark else "REPORTING",
            "information_gap_priority": "HIGH" if (is_dark and zone_info.get("population", 0) > 5000) else "LOW"
        }

    def get_all_zone_states(self, current_time: Optional[datetime] = None) -> List[Dict[str, Any]]:
        return [self.evaluate_zone_status(z_id, current_time) for z_id in KNOWN_DISTRICT_ZONES]

    def get_dark_zones(self, current_time: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Returns zones flagged as dark / silent."""
        return [z for z in self.get_all_zone_states(current_time) if z.get("is_dark")]

zone_tracker = ZoneActivityTracker()


class LocationResolver:
    """
    Resolves raw location strings and GPS coordinates into structured LocationInfo.
    Adheres strictly to the rule: Vague descriptions must not be turned into fake precise pins.
    """
    @staticmethod
    def resolve(
        raw_text: str,
        location_text: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
    ) -> Tuple[LocationInfo, str]:
        """
        Returns (LocationInfo, zone_id).
        """
        # Case 1: Exact GPS coordinates supplied directly
        if lat is not None and lng is not None:
            zone_id = LocationResolver._find_nearest_zone(lat, lng)
            return LocationInfo(
                lat=lat,
                lng=lng,
                address=location_text or "Exact GPS Coordinates",
                ward_id=zone_id,
                precision=LocationPrecision.HIGH
            ), zone_id

        search_corpus = f"{location_text or ''} {raw_text}".lower()

        # Case 2: Mention of specific known wards
        for ward_id, data in KNOWN_DISTRICT_ZONES.items():
            ward_num = ward_id.split("-")[-1].lstrip("0")
            patterns = [
                rf"\bward\s*0?{ward_num}\b",
                rf"\bward\s*#{ward_num}\b",
                rf"\b{data['name'].lower()}\b"
            ]
            for pat in patterns:
                if re.search(pat, search_corpus):
                    centroid_lat, centroid_lng = data["centroid"]
                    # If only ward is mentioned, tag as LOW precision
                    # If specific sub-location/building mentioned, tag as MEDIUM
                    has_building = any(kw in search_corpus for kw in ["school", "hospital", "bridge", "station", "building", "floor", "market"])
                    precision = LocationPrecision.MEDIUM if has_building else LocationPrecision.LOW

                    return LocationInfo(
                        lat=centroid_lat,
                        lng=centroid_lng,
                        address=f"{data['name']} ({ward_id})",
                        ward_id=ward_id,
                        precision=precision
                    ), ward_id

        # Case 3: Vague phrases ("near tree", "water rising", "some house")
        # Default to district central operational zone with LOW precision
        default_zone = "WARD-07"
        centroid_lat, centroid_lng = KNOWN_DISTRICT_ZONES[default_zone]["centroid"]
        return LocationInfo(
            lat=centroid_lat,
            lng=centroid_lng,
            address="Unspecified district location",
            ward_id=default_zone,
            precision=LocationPrecision.LOW
        ), default_zone

    @staticmethod
    def _find_nearest_zone(lat: float, lng: float) -> str:
        """Find the nearest ward ID based on Euclidean distance."""
        best_zone = "WARD-07"
        min_dist = float("inf")
        for z_id, data in KNOWN_DISTRICT_ZONES.items():
            c_lat, c_lng = data["centroid"]
            dist = (lat - c_lat) ** 2 + (lng - c_lng) ** 2
            if dist < min_dist:
                min_dist = dist
                best_zone = z_id
        return best_zone
