from typing import List, Dict, Tuple, Optional
from datetime import datetime, timezone
import uuid
from ..models.domain import Incident, Resource, AssignmentDetail, DispatchPlanResponse
from ..models.enums import PlanQuality, ResourceStatus
from ..config import settings
from .feasibility import FeasibilityChecker

class GreedyFallbackDispatcher:
    """
    Deterministic greedy nearest-resource / highest-priority heuristic fallback.
    Invoked when solver times out or fails to prove an exact feasible solution within budget.
    Explicitly outputs: PLAN QUALITY: HEURISTIC (FALLBACK).
    """
    @staticmethod
    def dispatch(
        incidents: List[Incident],
        resources: List[Resource],
        max_travel_time_min: float = 60.0,
        solve_duration: float = 0.05
    ) -> DispatchPlanResponse:
        plan_id = f"PLAN-HEURISTIC-{uuid.uuid4().hex[:6].upper()}"


        # 1. Sort incidents by priority descending
        sorted_incidents = sorted(incidents, key=lambda x: x.priority_score, reverse=True)

        # 2. Track remaining available resources
        available_resources = {r.resource_id: r for r in resources if r.availability_status == ResourceStatus.AVAILABLE}

        assignments: List[AssignmentDetail] = []
        served_incident_ids = set()

        for inc in sorted_incidents:
            best_resource = None
            best_time = float("inf")

            for r_id, res in available_resources.items():
                if FeasibilityChecker.is_feasible(res, inc):
                    t_min = FeasibilityChecker.calculate_travel_time_minutes(res, inc)
                    if t_min <= max_travel_time_min and t_min < best_time:
                        best_time = t_min
                        best_resource = res

            if best_resource is not None:
                assignments.append(
                    AssignmentDetail(
                        incident_id=inc.incident_id,
                        resource_id=best_resource.resource_id,
                        estimated_travel_time_min=best_time,
                        served_fraction=1.0,
                        reason=f"Greedy heuristic: nearest feasible {best_resource.type.value} (ETA {best_time} min)"
                    )
                )
                served_incident_ids.add(inc.incident_id)
                # Mark resource as assigned
                available_resources.pop(best_resource.resource_id, None)

        unserved = [inc.incident_id for inc in sorted_incidents if inc.incident_id not in served_incident_ids]

        return DispatchPlanResponse(
            plan_id=plan_id,
            plan_quality=PlanQuality.HEURISTIC_FALLBACK,
            solver_duration_seconds=round(solve_duration, 4),
            solver_status="HEURISTIC_FALLBACK",
            objective_value=round(sum(inc.priority_score for inc in incidents if inc.incident_id in served_incident_ids), 4),
            assignments=assignments,
            unserved_incidents=unserved,
            created_at=datetime.now(timezone.utc)
        )

    generate_plan = dispatch

greedy_dispatcher = GreedyFallbackDispatcher()
