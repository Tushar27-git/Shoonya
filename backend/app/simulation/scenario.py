import json
import random
import time
from pathlib import Path
from datetime import datetime, timedelta
import os
import uuid

GAZETTEER_FILE = Path(__file__).resolve().parent.parent / "data" / "gazetteer.json"
GROUND_TRUTH_FILE = Path(__file__).resolve().parent / "ground_truth.json"

class ScenarioGenerator:
    def __init__(self, seed: int = 42):
        self.seed = seed
        self.random = random.Random(seed)
        
        self.gazetteer = self._load_gazetteer()
        self.wards = {w["id"]: w for w in self.gazetteer if w["id"].startswith("LOC_")}
        
        # Select specific locations based on the fixed seed
        ward_ids = list(self.wards.keys())
        ward_ids.sort() # Ensure deterministic ordering
        
        # Scenario Selections
        self.ward_a_id = "LOC_000"  # Ward A: moderate waterlogging
        self.ward_b_id = "LOC_001"  # Ward B: telecom dead zone
        
        self.bridge_ward = self.wards["LOC_002"]
        self.bridge_segment = self.bridge_ward["road_segments"][0]
        
        self.embankment_ward = self.wards["LOC_003"]
        self.embankment_loc = self.embankment_ward["coordinates"]
        
        self.rooftop_ward = self.wards["LOC_004"]
        self.rooftop_loc = self.rooftop_ward["coordinates"]
        
        self.shelter_ward = self.wards["LOC_005"]
        self.shelter_id = self.shelter_ward["shelters"][0]

    def _load_gazetteer(self):
        try:
            with open(GAZETTEER_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            return []

    def generate(self):
        ground_truth = self._generate_ground_truth()
        perception_feed = self._generate_perception_feed()
        
        # Write ground truth to file
        with open(GROUND_TRUTH_FILE, "w", encoding="utf-8") as f:
            json.dump(ground_truth, f, indent=2)
            
        return {
            "ground_truth": ground_truth,
            "perception_feed": perception_feed
        }
        
    def _generate_ground_truth(self):
        return {
            "ward_a_status": {
                "ward_id": self.ward_a_id,
                "name": self.wards[self.ward_a_id]["name"],
                "flood_depth": "moderate",
                "critical": False
            },
            "ward_b_status": {
                "ward_id": self.ward_b_id,
                "name": self.wards[self.ward_b_id]["name"],
                "telecom_status": "dead",
                "population": self.wards[self.ward_b_id]["population_density"]
            },
            "rooftop_rescue": {
                "ward_id": self.rooftop_ward["id"],
                "coordinates": self.rooftop_loc,
                "trapped_people": True,
                "victims_estimate": 4,
                "vulnerable_present": ["children"]
            },
            "bridge": {
                "segment_id": self.bridge_segment,
                "status": "CLOSED",
                "damaged": True
            },
            "embankment": {
                "ward_id": self.embankment_ward["id"],
                "coordinates": self.embankment_loc,
                "status": "WEAKENING",
                "risk": "HIGH"
            },
            "shelter": {
                "shelter_id": self.shelter_id,
                "water_status": "CONTAMINATED",
                "power_status": False
            }
        }
        
    def _generate_perception_feed(self):
        feed = []
        
        base_time = datetime.utcnow() - timedelta(hours=1)
        
        def add_report(endpoint, payload, delay_sec=0):
            feed.append({
                "endpoint": endpoint,
                "payload": payload,
                "relative_time_sec": delay_sec
            })

        # 1. Ward A: 40-50 duplicate/near-duplicate posts (non-critical waterlogging)
        num_ward_a = self.random.randint(40, 50)
        ward_a_name = self.wards[self.ward_a_id]["name"]
        for i in range(num_ward_a):
            delay = self.random.uniform(0, 50)
            text_variations = [
                f"Water logging at {ward_a_name}",
                f"{ward_a_name} is flooded",
                f"Streets are full of water in {ward_a_name}",
                f"Please help, water on road in {ward_a_name}",
                f"Moderate flooding in {ward_a_name} near the market"
            ]
            add_report("/vague", {
                "raw_text": self.random.choice(text_variations),
                "sender_id": f"CITIZEN_A_{i}",
                "channel": "SOCIAL",
                "landmark_hint": ward_a_name
            }, delay)

        # 2. Ward B: Zero reports (Dark Zone)
        # (Intentionally doing nothing for Ward B)

        # 3. Rooftop rescue: 2-3 independent reports
        num_rooftop = self.random.randint(2, 3)
        rooftop_name = self.rooftop_ward["name"]
        channels = ["SMS", "SOCIAL", "RADIO"]
        for i in range(num_rooftop):
            delay = self.random.uniform(10, 40)
            text_variations = [
                f"Family stuck on roof in {rooftop_name}, kids crying",
                f"Trapped on terrace with children at {rooftop_name}",
                f"Need rescue fast! Water rising, we are on the roof {rooftop_name}"
            ]
            # Use SMS Code for one, vague for others
            if i == 0:
                add_report("/sms-code", {
                    "code": "911",  # ROOFTOP_STRANDED
                    "sender_id": f"ROOF_SENDER_{i}",
                    "location_hint": rooftop_name
                }, delay)
            else:
                add_report("/vague", {
                    "raw_text": self.random.choice(text_variations),
                    "sender_id": f"ROOF_SENDER_{i}",
                    "channel": channels[i % len(channels)],
                    "landmark_hint": rooftop_name
                }, delay)

        # 4. Bridge: Contradictory claims
        bridge_name = self.bridge_ward["name"]
        add_report("/vague", {
            "raw_text": f"Bridge is totally broken at {bridge_name}",
            "sender_id": "DRIVER_1",
            "channel": "SOCIAL",
            "landmark_hint": bridge_name
        }, 5.0)
        
        add_report("/vague", {
            "raw_text": f"Crossed the bridge in {bridge_name}, it's fine",
            "sender_id": "DRIVER_2",
            "channel": "SOCIAL",
            "landmark_hint": bridge_name
        }, 15.0)

        # 5. Embankment: 3+ independent weak signals
        embankment_name = self.embankment_ward["name"]
        delays = [20.0, 22.0, 25.0, 30.0]
        text_signals = [
            f"Saw a large crack in the wall at {embankment_name}",
            f"Water is seeping through the stones near {embankment_name}",
            f"Water level is rising dangerously fast at {embankment_name}",
            f"Hearing weird noises from the structure in {embankment_name}"
        ]
        for i in range(4):
            add_report("/vague", {
                "raw_text": text_signals[i],
                "sender_id": f"OBSERVER_{i}",
                "channel": "SOCIAL",
                "landmark_hint": embankment_name
            }, delays[i])

        # 6. Shelter: water-contamination + power-loss
        shelter_name = self.shelter_ward["name"]
        add_report("/sms-code", {
            "code": "712",  # WATER_CONTAMINATION
            "sender_id": "SHELTER_MANAGER",
            "location_hint": shelter_name
        }, 10.0)
        add_report("/vague", {
            "raw_text": f"Power has been out for hours at {shelter_name} shelter",
            "sender_id": "SHELTER_MANAGER",
            "channel": "SMS",
            "landmark_hint": shelter_name
        }, 12.0)

        # Sort by relative time
        feed.sort(key=lambda x: x["relative_time_sec"])
        return feed

# Singleton instance
generator = ScenarioGenerator()
