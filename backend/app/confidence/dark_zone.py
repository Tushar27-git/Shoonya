from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from ..ingestion.processor import zone_tracker, KNOWN_DISTRICT_ZONES
from ..config import settings

class DarkZoneEvaluator:
    """
    Evaluates district dark zones where communications have failed or reports are absent.
    Enforces the rule: Zero reports in a populated area indicates an urgent information gap,
    NOT safety.
    """
    @staticmethod
    def get_dark_zone_assessments(current_time: Optional[datetime] = None) -> List[Dict[str, Any]]:
        now = current_time or datetime.now(timezone.utc)
        all_zones = zone_tracker.get_all_zone_states(now)

        assessments = []
        for z in all_zones:
            pop = z.get("population", 0)
            is_dark = z.get("is_dark", False)
            silence_min = z.get("silence_duration_minutes", 0)

            # Categorize the dark zone operational risk
            if is_dark and pop >= 5000:
                risk_tier = "CRITICAL_INFORMATION_GAP"
                recommendation = "Deploy drone survey or satellite priority tasking immediately; large exposed population in communication blackout."
            elif is_dark and pop > 1000:
                risk_tier = "MODERATE_INFORMATION_GAP"
                recommendation = "Monitor telecom tower status and cross-corroborate with nearest active checkpoint."
            elif is_dark:
                risk_tier = "LOW_POPULATION_SILENCE"
                recommendation = "Sparse population area; routine radio check when resources allow."
            else:
                risk_tier = "REPORTING_ACTIVE"
                recommendation = "Zone communications healthy; reports streaming normally."

            assessments.append({
                **z,
                "risk_tier": risk_tier,
                "recommended_action": recommendation,
                "ui_display_status": "NO DATA — UNKNOWN STATUS" if is_dark else "ACTIVE TELEMETRY",
            })

        return assessments

dark_zone_evaluator = DarkZoneEvaluator()
