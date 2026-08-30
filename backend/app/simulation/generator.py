import json
import random
import uuid
from typing import List
from pathlib import Path
from datetime import datetime, timezone
from app.models.domain import RawReport
from app.models.enums import SourceChannel

class SimulationGenerator:
    def __init__(self, seed: int = 42):
        self.seed = seed
        self.gazetteer_path = Path(__file__).resolve().parent.parent / "data" / "gazetteer.json"
        self.locations = self._load_locations()
        
    def _load_locations(self) -> List[dict]:
        if self.gazetteer_path.exists():
            with open(self.gazetteer_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return [{"id": "LOC_001", "name": "Default Ward", "population_density": 1000}]

    def generate_scenario(self, center_lat: float = None, center_lng: float = None) -> List[RawReport]:
        random.seed(self.seed)
        events: List[RawReport] = []
        
        # Identify dark zone ward (highest population, 0 reports)
        sorted_locs = sorted(self.locations, key=lambda x: x.get("population_density", 0), reverse=True)
        dark_zone_ward = sorted_locs[0] if sorted_locs else self.locations[0]
        
        active_locs = [loc for loc in self.locations if loc["id"] != dark_zone_ward["id"]]
        if not active_locs:
            active_locs = self.locations

        import copy
        active_locs = copy.deepcopy(active_locs)
        
        if center_lat is not None and center_lng is not None:
            for loc in active_locs:
                loc['coordinates']['lat'] = center_lat + random.uniform(-0.02, 0.02)
                loc['coordinates']['lon'] = center_lng + random.uniform(-0.02, 0.02)
            
        def create_report(text: str, channel: SourceChannel, source_id: str, loc_coords: dict = None, hazard_type: str = "FLOOD") -> RawReport:
            from ..models.domain import LocationInfo, ExtractionResult
            from ..models.enums import HazardType
            
            try:
                hz = HazardType(hazard_type)
            except ValueError:
                hz = HazardType.OTHER

            report = RawReport(
                report_id=f"SIM-{uuid.uuid4().hex[:8]}",
                source_channel=channel,
                raw_text=text,
                source_id=source_id,
                timestamp=datetime.now(timezone.utc),
                extracted_data=ExtractionResult(
                    hazard_type=hz,
                    raw_evidence_text=text
                )
            )
            if loc_coords:
                report.resolved_location = LocationInfo(lat=loc_coords['lat'], lng=loc_coords['lon'])
            return report

        # Determine likely hazards based on geography
        likely_hazards = ["FLOOD", "BUILDING_COLLAPSE", "MEDICAL_EMERGENCY"]
        if center_lng is not None:
            if center_lng > 85: # East India (Guwahati, etc)
                likely_hazards = ["FLOOD", "LANDSLIDE", "BRIDGE_FAILURE"]
            elif center_lng < 80: # North/West India (Delhi, Mumbai etc)
                likely_hazards = ["BUILDING_COLLAPSE", "MEDICAL_EMERGENCY", "ELECTRICAL_FAULT", "OTHER"]

        # 1. Background noise (150-250 total target)
        # We need 30 duplicates + 2 contradictions + 3 weak signals + 1 utility = 36 fixed reports
        # So background noise should be 114 to 214.
        noise_count = random.randint(114, 214)
        for _ in range(noise_count):
            loc = random.choice(active_locs)
            hz = random.choice(likely_hazards)
            events.append(create_report(
                text=f"Incident reported at {loc['name']}. Need assistance.",
                channel=SourceChannel.SMS,
                source_id=f"USR-{random.randint(100, 9999)}",
                loc_coords=loc['coordinates'],
                hazard_type=hz
            ))
            
        # 2. Repeated duplicate reports (30 for the same major event)
        major_loc = random.choice(active_locs)
        hazard = random.choice(likely_hazards)
        hazard_texts = {
            "FLOOD": f"Severe flooding at {major_loc['name']}. Water level rising rapidly!",
            "LANDSLIDE": f"Massive landslide near {major_loc['name']}. Road blocked!",
            "BUILDING_COLLAPSE": f"Major building collapse in {major_loc['name']}. People trapped under debris.",
            "MEDICAL_EMERGENCY": f"Mass casualty medical emergency reported at {major_loc['name']}. Multiple ambulances needed.",
            "BRIDGE_FAILURE": f"Bridge collapse reported near {major_loc['name']}. Traffic halted.",
            "ELECTRICAL_FAULT": f"Major electrical explosion and fire near {major_loc['name']}!",
            "OTHER": f"Massive fire broken out near {major_loc['name']}. Spreading quickly!"
        }
        for _ in range(30):
            events.append(create_report(
                text=hazard_texts.get(hazard, f"Emergency at {major_loc['name']}"),
                channel=SourceChannel.SOCIAL,
                source_id=f"USR-{random.randint(100, 9999)}",
                loc_coords=major_loc['coordinates'],
                hazard_type=hazard
            ))
            
        # 3. Road status contradictions (2 reports)
        road_loc = random.choice(active_locs)
        road_segment = road_loc.get("road_segments", ["RS_X_1"])[0]
        events.append(create_report(
            text=f"Road {road_segment} in {road_loc['name']} is completely CLOSED.",
            channel=SourceChannel.FIELD,
            source_id="OFFICER-01",
            loc_coords=road_loc['coordinates'],
            hazard_type="ROAD_WASHOUT"
        ))
        events.append(create_report(
            text=f"Road {road_segment} in {road_loc['name']} is OPEN and clear.",
            channel=SourceChannel.SOCIAL,
            source_id="CITIZEN-01",
            loc_coords=road_loc['coordinates'],
            hazard_type="ROAD_WASHOUT"
        ))

        # 4. WeakSignal reports near embankment (3 reports)
        embankment_loc = random.choice(active_locs)
        events.append(create_report(
            text=f"Felt a tremor near the embankment at {embankment_loc['name']}.",
            channel=SourceChannel.SMS,
            source_id="WS-01",
            loc_coords=embankment_loc['coordinates'],
            hazard_type="LANDSLIDE"
        ))
        events.append(create_report(
            text=f"Seeing cracks forming on the embankment structure near {embankment_loc['name']}.",
            channel=SourceChannel.SOCIAL,
            source_id="WS-02",
            loc_coords=embankment_loc['coordinates'],
            hazard_type="LANDSLIDE"
        ))
        events.append(create_report(
            text=f"Water is seeping rapidly through the embankment wall in {embankment_loc['name']}.",
            channel=SourceChannel.RADIO,
            source_id="WS-03",
            loc_coords=embankment_loc['coordinates'],
            hazard_type="FLOOD"
        ))

        # 5. SHELTER_UTILITY_FAILURE report (1 report)
        shelter_loc = random.choice(active_locs)
        events.append(create_report(
            text=f"Generator failed at shelter in {shelter_loc['name']}. Insulin is spoiling, need power immediately.",
            channel=SourceChannel.SMS,
            source_id="SHELTER-ADMIN",
            loc_coords=shelter_loc['coordinates'],
            hazard_type="SHELTER_UTILITY_FAILURE"
        ))
        
        # Note: dark_zone_ward has 0 reports generated, satisfying the dark zone requirement.

        # Shuffle the events to mix duplicates, contradictions, and noise.
        random.shuffle(events)
        
        return events

generator = SimulationGenerator(seed=42)
