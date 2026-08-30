import urllib.request
import json
import time
import sys

# Configure UTF-8 for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8001"

def api_post(endpoint, data):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def api_get(endpoint):
    url = f"{BASE_URL}{endpoint}"
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode("utf-8"))

print("=" * 75)
print("  SHOONYA CRISIS PLATFORM — FULL END-TO-END SERVICE & SCENARIO LOADER")
print("=" * 75)

# 1. Health & Telemetry Check
print("\n[1/11] Checking System Health & Telemetry...")
health = api_get("/health")
telemetry = api_get("/telemetry")
print(f"  ✓ System Status: {health['status']} ({health['service']})")
c_min = health['invariants'].get('confidence_floor_c_min', 0.4)
budget = health['invariants'].get('solver_timeout_budget_s', 4.0)
print(f"  ✓ Invariants: c_min={c_min}, Solver Budget={budget}s, Auto Merge={health['invariants'].get('merge_threshold_auto', 0.85)}")
print(f"  ✓ Live Telemetry: Queue={telemetry['queue_depth']}, Active Incidents={telemetry['active_incidents']}, Dark Zones={telemetry['dark_zones']}")

# 2. Multi-Channel Ingestion & NLP Extraction
print("\n[2/11] Ingesting Multi-Channel Emergency Reports...")
reports_payload = [
    {
        "source_channel": "RADIO",
        "raw_text": "EOC Patrol Unit 4: Severe waterlogging at Ward 07 Primary School. Ground floor submerged. 12 children stranded on rooftop. Request boat.",
        "location_text": "Govt Primary School, Ward 07 Basin",
        "source_id": "PATROL-RADIO-04"
    },
    {
        "source_channel": "VOICE",
        "raw_text": "वार्ड 07 स्कूल में पानी 8 फीट ऊपर आ गया है, 10 बच्चे और 2 शिक्षक छत पर फंसे हैं, तुरंत नाव भेजो!",
        "location_text": "Ward 07 School",
        "source_id": "CALLER-98231"
    },
    {
        "source_channel": "SOCIAL",
        "raw_text": "Old Market Complex Ward 04 2-storey building collapsed, 6-8 people trapped under debris near Jain Mandir!",
        "location_text": "Old Market Complex, Ward 04",
        "source_id": "TWITTER-POST-881"
    },
    {
        "source_channel": "SMS",
        "raw_text": "Ward 12 Kalina Bridge ke paas road cut off ho chuki hai, 4 elderly patients hospital nahi ja pa rahe",
        "location_text": "Kalina Bridge, Ward 12",
        "source_id": "+91-9876543210"
    },
    {
        "source_channel": "DRONE",
        "raw_text": "AERIAL RECON SURVEY: Thermal camera confirms 11 stranded individuals on rooftop of Ward 07 School. Water depth approx 2.2m.",
        "location_text": "Ward 07 Basin",
        "source_id": "DRONE-ALPHA-01"
    }
]

for rep in reports_payload:
    res = api_post("/ingestion/reports", rep)
    print(f"  ✓ Ingested [{res['report_id']}] via {rep['source_channel']} | Queue Pos: {res['queue_position']} | Status: {res['status']}")

# 3. NLP Extraction Test
print("\n[3/11] Running Multilingual NLP Entity Extraction...")
nlp_res = api_post("/nlp/extract", {
    "raw_text": "वार्ड 07 स्कूल की दूसरी मंजिल पर 10 बच्चे फंसे हैं, तुरंत नाव चाहिए",
    "location_hint": "Ward 07 School"
})
print(f"  ✓ NLP Result: Hazard={nlp_res['hazard_type']} | Victims={nlp_res['victim_count']} | MicroEnv={nlp_res['micro_environment_tag']} | Vulnerabilities={nlp_res['vulnerable_present']}")

# 4. Seed Clustered Incidents for Tactical Operations
print("\n[4/11] Seeding Tactical Clustered Incidents...")
initial_incidents = [
    {
        "incident_id": "INC-W07-01",
        "status": "REPORTED",
        "location": {
            "lat": 26.8510,
            "lng": 80.9490,
            "address": "Govt Primary School, Ward 07 Basin",
            "ward_id": "WARD-07",
            "precision": "HIGH"
        },
        "zone_id": "WARD-07",
        "category": "FLOOD",
        "micro_environment": "ROOFTOP_STRANDED",
        "victim_estimate": {
            "min_victims": 8,
            "max_victims": 12,
            "best_guess": 10,
            "is_exact": False
        },
        "vulnerability_tags": ["CHILDREN"],
        "priority_score": 1.84,
        "urgency_score": 0.95,
        "confidence_score": 0.88,
        "confidence_floor": 0.40,
        "dispute_flag": False,
        "evidence_summary": [
            "Flood water reached 2nd floor of Ward 07 Govt School. 8 children stranded on rooftop!",
            "वार्ड 07 स्कूल में पानी भर गया है, 10 बच्चे छत पर फंसे हैं",
            "Voice transcript: School rooftop flooded, urgent boat required."
        ],
        "constituent_report_ids": ["REP-001", "REP-002", "REP-003"]
    },
    {
        "incident_id": "INC-W04-02",
        "status": "REPORTED",
        "location": {
            "lat": 26.8410,
            "lng": 80.9320,
            "address": "Old Market Complex, Ward 04",
            "ward_id": "WARD-04",
            "precision": "HIGH"
        },
        "zone_id": "WARD-04",
        "category": "BUILDING_COLLAPSE",
        "micro_environment": "DEBRIS_TRAPPED",
        "victim_estimate": {
            "min_victims": 4,
            "max_victims": 14,
            "best_guess": 8,
            "is_exact": False
        },
        "vulnerability_tags": ["INJURED"],
        "priority_score": 1.62,
        "urgency_score": 0.90,
        "confidence_score": 0.75,
        "confidence_floor": 0.40,
        "dispute_flag": False,
        "evidence_summary": [
            "Old Market Complex 2-storey commercial building partially collapsed.",
            "Debris trapping ground floor shopkeepers, heavy excavator requested."
        ],
        "constituent_report_ids": ["REP-004", "REP-005"]
    },
    {
        "incident_id": "INC-W12-03",
        "status": "REPORTED",
        "location": {
            "lat": 26.8320,
            "lng": 80.9200,
            "address": "Kalina Bridge Approach, Ward 12",
            "ward_id": "WARD-12",
            "precision": "MEDIUM"
        },
        "zone_id": "WARD-12",
        "category": "FLOOD",
        "micro_environment": "CUT_OFF_ACCESS",
        "victim_estimate": {
            "min_victims": 3,
            "max_victims": 5,
            "best_guess": 4,
            "is_exact": True
        },
        "vulnerability_tags": ["ELDERLY"],
        "priority_score": 1.15,
        "urgency_score": 0.72,
        "confidence_score": 0.65,
        "confidence_floor": 0.40,
        "dispute_flag": False,
        "evidence_summary": [
            "Bridge approach washed out; elderly patients trapped in home."
        ],
        "constituent_report_ids": ["REP-006"]
    }
]

for inc_data in initial_incidents:
    api_post("/clustering/incidents", inc_data)

incidents = api_get("/clustering/incidents")
print(f"  ✓ Active Incident Clusters in Feed: {len(incidents)}")
target_inc_id = incidents[0]["incident_id"]
for inc in incidents:
    vic = inc["victim_estimate"]["best_guess"]
    print(f"    • [{inc['incident_id']}] {inc['category']} @ {inc['zone_id']} | Priority={inc['priority_score']:.2f} | Conf={inc['confidence_score']:.2f} | Victims={vic}")

# 5. Contradiction & Dark-Zone Detection
print("\n[5/11] Evaluating Dark Zones & Dispute Records...")
dark_zones = api_get("/confidence/dark-zones")
print(f"  ✓ Monitored Dark Zones: {len(dark_zones)}")
for dz in dark_zones[:3]:
    name = dz.get('zone_name') or dz.get('zone_id', 'UNKNOWN')
    silence = dz.get('silence_duration_minutes', 0.0)
    pop = dz.get('population') or dz.get('estimated_population', 0)
    status_disp = dz.get('ui_display_status') or ('DARK' if dz.get('is_dark') else 'ACTIVE')
    print(f"    • [{name}] Status: {status_disp} | Silence Duration: {silence:.1f}m | Pop: {pop}")

# 6. Register Fleet & Run Dispatch Optimization
print("\n[6/11] Registering Emergency Fleet & Running MILP CP-SAT Dispatch Solver...")
fleet = [
    {
        "resource_id": "BOAT-RESCUE-01",
        "type": "BOAT",
        "current_location": {"lat": 26.848, "lng": 80.942},
        "availability_status": "AVAILABLE",
        "travel_speed_kmh": 22.0
    },
    {
        "resource_id": "AMBULANCE-04",
        "type": "AMBULANCE",
        "current_location": {"lat": 26.839, "lng": 80.930},
        "availability_status": "AVAILABLE",
        "travel_speed_kmh": 45.0
    },
    {
        "resource_id": "EXCAVATOR-TEAM-02",
        "type": "EXCAVATOR",
        "current_location": {"lat": 26.842, "lng": 80.928},
        "availability_status": "AVAILABLE",
        "travel_speed_kmh": 15.0
    }
]

for res_item in fleet:
    api_post("/dispatch/resources", res_item)

resources = api_get("/dispatch/resources")
print(f"  ✓ Active District Emergency Fleet: {len(resources)} units")

dispatch_plan = api_post("/dispatch/plan", {
    "max_travel_time_min": 60.0,
    "budget_seconds": 3.5,
    "commander_id": "CHIEF-EOC"
})
print(f"  ✓ Generated Plan: [{dispatch_plan['plan_id']}] Quality: {dispatch_plan['plan_quality']} (Solve Time: {dispatch_plan['solver_duration_seconds']}s)")
print(f"  ✓ Assigned Missions: {len(dispatch_plan['assignments'])} | Unserved Incidents: {len(dispatch_plan['unserved_incidents'])}")
for asm in dispatch_plan["assignments"]:
    print(f"    -> Resource {asm['resource_id']} assigned to Incident {asm['incident_id']} (ETA: {asm['estimated_travel_time_min']:.1f} mins)")

# 7. Human Commander Approval Gate & Cryptographic Audit
print("\n[7/11] Submitting Human Commander Approval to SHA-256 Audit Gate...")
approval_res = api_post("/audit/approval", {
    "plan_id": dispatch_plan["plan_id"],
    "decision": "APPROVED",
    "operator_id": "COMMANDER-01",
    "override_reason": "High-priority rooftop rescue verified by aerial drone; optimal boat routing confirmed by EOC chief."
})
print(f"  ✓ Approval Gate Result: Success={approval_res['success']} | Decision={approval_res['decision']}")
print(f"  ✓ Tamper-Evident Audit Record: [{approval_res['audit_record_id']}]")

# 8. Computer Vision Verification & Drone Tasking
print("\n[8/11] Running Multi-Spectral CV & Drone Tasking Pipeline...")
cv_res = api_post("/cv/verify", {
    "incident_id": target_inc_id,
    "sensor_type": "SENTINEL-2_OPTICAL",
    "water_index_ndwi": 0.68,
    "cloud_cover_pct": 12.0
})
print(f"  ✓ CV Evidence Verified for [{cv_res['incident_id']}]: New Confidence C_i = {cv_res['confidence_score']:.2f}")

drone_task = api_post("/cv/task-drone", {
    "incident_id": target_inc_id,
    "target_lat": 26.865,
    "target_lng": 80.962,
    "reason": "Aerial thermal verification of silent dark zone to confirm potential levee breach."
})
print(f"  ✓ Drone Recon Task Dispatched: [{drone_task['task_id']}] to ({drone_task['target_coordinates']['lat']}, {drone_task['target_coordinates']['lng']}) | Status: {drone_task['status']}")

# 9. Discrete Disaster Simulation Engine Advancement & Critical Venues
print("\n[9/11] Advancing Disaster Simulation Tick (Delta_t = 15 min)...")
sim_state = api_post("/simulation/tick", {"delta_minutes": 15})
print(f"  ✓ Simulation Elapsed Time: T+{sim_state['sim_time_minutes']} mins (Tick #{sim_state['tick_index']})")
print(f"  ✓ Generated Synthetic Reports: {sim_state['reports_generated']} | Active Threats: {len(sim_state['venue_threats'])}")


venues = api_get("/venues")
print(f"  ✓ Critical Venue Network ({len(venues)} venues):")
for v in venues[:3]:
    occ_pct = (v.get('current_occupancy', 0) / max(1, v.get('capacity', 1))) * 100
    print(f"    • [{v['name']}] Status: {v['status']} | Occupancy: {v.get('current_occupancy', 0)}/{v.get('capacity', 0)} ({occ_pct:.0f}%)")


# 10. AI Copilot SITREP & Reverse SOS Outbound Broadcast
print("\n[10/11] Querying EOC Copilot & Triggering Reverse SOS Micro-Guidance...")
copilot_query = api_post("/copilot/query", {
    "query": "वार्ड 07 स्कूल के लिए क्या राहत भेजी गई है?",
    "language": "HI"
})
print(f"  ✓ Copilot Multilingual Response (HI):\n    \"{copilot_query['content'][:150]}...\"")
print(f"  ✓ Citations: {copilot_query['citations']}")

sitrep = api_get("/copilot/sitrep")
print(f"  ✓ SITREP Generated [{sitrep['sitrep_id']}]: Active={sitrep['total_active_incidents']} | Casualties={sitrep['casualty_bounds']} | Dark Zones={sitrep['dark_zones_count']}")

reverse_sos = api_post("/notifications/reverse-sos", {
    "incident_id": target_inc_id,
    "advisory_type": "BOAT_INBOUND",
    "channels": ["SMS", "VOICE_IVR"],
    "target_radius_km": 1.5,
    "eta_min": 12,
    "resource_id": "BOAT-RESCUE-01",
    "commander_id": "COMMANDER-01",
    "operator_rationale": "Boat en-route; advising stranded rooftop victims to deploy flashlight signals."
})
print(f"  ✓ Reverse SOS Dispatched ({len(reverse_sos)} channels): Status={reverse_sos[0]['status']}")
print(f"    • Hindi Text: \"{reverse_sos[0]['message_text_hi'][:85]}...\"")

# 11. Final Audit Chain Cryptographic Verification
audit_verify = api_get("/audit/verify")
print("\n" + "=" * 75)
print(f"  CRYPTOGRAPHIC AUDIT CHAIN INTEGRITY: {'VALID ✓' if audit_verify['chain_valid'] else 'COMPROMISED ✗'}")
print(f"  Total Verified Blocks in Genesis-to-Head Chain: {audit_verify['verified_blocks']}")
print("=" * 75)
print("\n  ALL SERVICES FULLY LOADED, INTEGRATED, AND OPERATIONAL.\n")
