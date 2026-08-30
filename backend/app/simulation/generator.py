import random
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone

class SimulationGenerator:
    """
    Generates a deterministic 24-hour scenario script (seed=42).
    Includes duplicates, contradictions, dark zones, WeakSignal clusters, and SHELTER_UTILITY_FAILURE.
    """
    def __init__(self, seed: int = 42):
        self.seed = seed
        self.start_time = datetime.utcnow().replace(tzinfo=timezone.utc, hour=0, minute=0, second=0, microsecond=0)
        
    def generate_scenario(self) -> List[Dict[str, Any]]:
        random.seed(self.seed)
        events = []
        
        # We will generate about 200 reports spread over 24 hours (1440 minutes)
        # 1. Background noise (normal incidents)
        for i in range(100):
            offset_min = random.randint(0, 1440)
            events.append({
                "time_offset_minutes": offset_min,
                "report": {
                    "text": f"Water logging near location {random.randint(1, 50)}",
                    "channel": "SMS",
                    "source_id": f"USER-{random.randint(1000, 9999)}",
                    "location_hint": "WARD-01"
                },
                "checkpoint": None
            })
            
        # 2. Deliberate Duplicates (Clustering test)
        cluster_time = 120 # T+02:00
        for i in range(25):
            events.append({
                "time_offset_minutes": cluster_time + random.randint(0, 30),
                "report": {
                    "text": "Huge flood at the main market! Send boats immediately! We are stuck.",
                    "channel": "SOCIAL",
                    "source_id": f"USER-{random.randint(1000, 9999)}",
                    "location_hint": "WARD-02"
                },
                "checkpoint": "T+02:00 Initial Flooding Cluster" if i == 0 else None
            })
            
        # 3. Contradiction / Dispute (Road status)
        dispute_time = 360 # T+06:00
        events.append({
            "time_offset_minutes": dispute_time,
            "report": {
                "text": "ROAD-BRIDGE-04 is totally collapsed and CLOSED.",
                "channel": "FIELD",
                "source_id": "OFFICER-1",
                "location_hint": "ROAD-BRIDGE-04"
            },
            "checkpoint": "T+06:00 Infrastructure Contradiction"
        })
        events.append({
            "time_offset_minutes": dispute_time + 5,
            "report": {
                "text": "ROAD-BRIDGE-04 is OPEN, we just crossed it.",
                "channel": "SOCIAL",
                "source_id": "CIVILIAN-9",
                "location_hint": "ROAD-BRIDGE-04"
            },
            "checkpoint": None
        })
        
        # 4. WeakSignal Cluster (Phase 6 Correlator)
        weak_time = 480 # T+08:00
        # Tremor
        events.append({
            "time_offset_minutes": weak_time,
            "report": {
                "text": "Zameen hil rahi hai dam ke paas (Tremor felt near Dam)",
                "channel": "SMS",
                "source_id": "USER-W1",
                "location_hint": "WARD-03"
            },
            "checkpoint": "T+08:00 Emerging Risk Zone (Weak Signals)"
        })
        # Crack
        events.append({
            "time_offset_minutes": weak_time + 10,
            "report": {
                "text": "Embankment me crack dikh raha hai",
                "channel": "RADIO",
                "source_id": "USER-W2",
                "location_hint": "WARD-03"
            },
            "checkpoint": None
        })
        # Water Rise
        events.append({
            "time_offset_minutes": weak_time + 15,
            "report": {
                "text": "Paani bahut tezi se badh raha hai yahan",
                "channel": "SOCIAL",
                "source_id": "USER-W3",
                "location_hint": "WARD-03"
            },
            "checkpoint": None
        })
        
        # 5. SHELTER_UTILITY_FAILURE
        shelter_time = 600 # T+10:00
        events.append({
            "time_offset_minutes": shelter_time,
            "report": {
                "text": "Shelter camp me power cut ho gaya hai, medicine spoiling, insulin needs fridge",
                "channel": "SMS",
                "source_id": "CAMP-ADMIN-1",
                "location_hint": "WARD-05"
            },
            "checkpoint": "T+10:00 Shelter Utility Failure"
        })
        
        # 6. Dark Zone Generation (Lack of reports in high pop zone)
        # We simulate this by having T+14:00 checkpoint without sending reports for WARD-09
        events.append({
            "time_offset_minutes": 840, # T+14:00
            "report": {
                "text": "General status update from HQ",
                "channel": "RADIO",
                "source_id": "HQ",
                "location_hint": "WARD-01"
            },
            "checkpoint": "T+14:00 Silence Risk Triggers (Dark Zone in WARD-09)"
        })
        
        # Sort by time
        events.sort(key=lambda x: x["time_offset_minutes"])
        return events

generator = SimulationGenerator(seed=42)
