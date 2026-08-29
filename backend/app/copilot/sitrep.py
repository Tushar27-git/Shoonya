from typing import Dict, List, Any
from datetime import datetime, timezone
import uuid
from ..models.domain import SitrepResponse
from ..clustering.engine import clustering_engine
from ..simulation.venues import venue_manager
from ..ingestion.processor import zone_tracker

class SitrepGenerator:
    """
    Generates standardized Emergency Operations Centre (EOC) Situation Reports (SITREPs).
    Aggregates incident queues, casualty uncertainty brackets, critical infrastructure status,
    and dark zone surveillance metrics.
    """
    @staticmethod
    def generate_current_sitrep() -> SitrepResponse:
        incidents = clustering_engine.list_incidents()
        venues = venue_manager.list_venues()
        dark_zones = zone_tracker.get_dark_zones()

        # Compute casualty bounds
        total_min_victims = sum(inc.victim_estimate.min_victims for inc in incidents)
        total_max_victims = sum(inc.victim_estimate.max_victims for inc in incidents)
        total_best_guess = sum(inc.victim_estimate.best_guess for inc in incidents)

        # Priority breakdown
        critical_count = sum(1 for inc in incidents if inc.priority_score >= 1.0)
        disputed_count = sum(1 for inc in incidents if inc.dispute_flag)

        # Venue surge breakdown
        hospital_surge = []
        for v in venues:
            surge = venue_manager.evaluate_surge_status(v)
            if surge in ["NEAR_CAPACITY", "OVER_CAPACITY"]:
                hospital_surge.append(f"{v.name} ({v.venue_id}): {surge} ({v.capacity_current}/{v.capacity_total} beds)")

        # Compile concise executive summary
        summary_lines = [
            f"OPERATIONAL SITUATION REPORT // DISTRICT RAIPUR EAST",
            f"TOTAL ACTIVE INCIDENTS: {len(incidents)} (CRITICAL: {critical_count}, DISPUTED: {disputed_count})",
            f"CASUALTY ESTIMATE BOUNDS: [{total_min_victims} .. {total_max_victims}] (Best Guess: {total_best_guess})",
            f"DARK ZONES UNDER SURVEILLANCE: {len(dark_zones)} (Silent zones: {', '.join(dz.get('zone_name', '') if isinstance(dz, dict) else dz.zone_name for dz in dark_zones) if dark_zones else 'NONE'})",
            f"CRITICAL VENUE ALERTS: {len(hospital_surge)} venues operating near or above nominal capacity.",
        ]


        critical_incident_ids = [inc.incident_id for inc in incidents if inc.priority_score >= 1.0]

        recommendations = [
            "Prioritize inflatable rescue boat deployment to Ward 07 school rooftop basin.",
            "Deploy JCB heavy excavator to Ward 04 market debris collapse.",
            "Task autonomous drone reconnaissance to Ward 09 silent sector to assess uncorroborated flood depth.",
        ]

        return SitrepResponse(
            sitrep_id=f"SITREP-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M')}",
            timestamp=datetime.now(timezone.utc),
            executive_summary="\n".join(summary_lines),
            total_active_incidents=len(incidents),
            critical_incidents_count=critical_count,
            disputed_incidents_count=disputed_count,
            casualty_bounds={"min": total_min_victims, "max": total_max_victims, "best_guess": total_best_guess},
            dark_zones_count=len(dark_zones),
            critical_incident_ids=critical_incident_ids,
            venue_surge_alerts=hospital_surge,
            operational_recommendations=recommendations
        )

sitrep_generator = SitrepGenerator()
