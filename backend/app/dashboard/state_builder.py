import asyncio
from typing import Dict, Any, List
from app.clustering.engine import cluster_engine
from app.confidence.dark_zone import dark_zone_evaluator
from app.simulation.venues import venue_manager
from app.amplify.router import CARD_STORE
from app.dispatch.router import AUDIT_LOG
from app.core.queue import queue
from app.needs.generator import generate_need_card
from app.simulation.router import FEED_STATUS

async def build_dashboard_state() -> Dict[str, Any]:
    # 1. Incidents
    active_incidents_models = cluster_engine.list_incidents()
    incidents = []
    
    # 2. Road Disputes (extracted from incidents)
    road_disputes = []
    
    # 3. Tasks
    tasks = []
    
    for inc in active_incidents_models:
        incidents.append(inc.model_dump(mode="json"))
        
        # Extract disputes
        for d in inc.disputes:
            if d.field_disputed == "ROAD_ACCESSIBILITY":
                road_disputes.append(d.model_dump(mode="json"))
                
        # Generate tasks
        card = generate_need_card(inc, None, [])
        if card:
            tasks.append(card.model_dump(mode="json"))

    # 4. Dark Zones
    all_dark_zone_assessments = dark_zone_evaluator.get_dark_zone_assessments()
    dark_zones = [z for z in all_dark_zone_assessments if z.get("is_dark", False)]

    # 5. Shelters
    shelters = [v.model_dump(mode="json") for v in venue_manager.list_venues()]

    # 6. Amplify Cards
    amplify_cards = [c.model_dump(mode="json") for c in CARD_STORE.values()]

    # 7. Audit Timeline
    audit_timeline = [a.model_dump(mode="json") for a in AUDIT_LOG]

    # 8. Queue depth (async)
    try:
        q_depth = await queue.get_queue_depth()
    except Exception:
        q_depth = 0

    return {
        "mode": "SIMULATION",
        "simulation_status": FEED_STATUS,
        "elapsed_seconds": 0,
        "counters": {
            "queue": q_depth,
            "active_incidents": len(incidents),
            "disputes": len(road_disputes),
            "dark_zones": len(dark_zones),
            "latency_ms": 120
        },
        "incidents": incidents,
        "dark_zones": dark_zones,
        "road_disputes": road_disputes,
        "shelters": shelters,
        "tasks": tasks,
        "resources": [],
        "amplify_cards": amplify_cards,
        "audit_timeline": audit_timeline
    }
