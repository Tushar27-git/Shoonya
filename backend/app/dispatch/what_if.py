from typing import List, Dict, Optional, Any
from ..models.domain import Incident, Resource, DispatchPlanResponse, WhatIfRequest
from ..models.enums import ResourceStatus
from .solver import MILPDispatcher
from ..priority.engine import PriorityEngine

class WhatIfEngine:
    """
    Evaluates alternative operational scenarios without mutating live state.
    Simulates:
    - Resource breakdowns (e.g. Boat-03 offline)
    - Road closures (inflating travel times)
    - Priority weight adjustments
    """
    @staticmethod
    def evaluate_what_if(
        incidents: List[Incident],
        resources: List[Resource],
        request: WhatIfRequest
    ) -> Dict[str, Any]:
        # 1. Clone & filter resources
        sim_resources = []
        for r in resources:
            r_copy = r.model_copy()
            if r.resource_id in request.unavailable_resources:
                r_copy.availability_status = ResourceStatus.MAINTENANCE
            sim_resources.append(r_copy)

        # 2. Clone & re-evaluate incident priorities if weights are adjusted
        sim_incidents = []
        for inc in incidents:
            inc_copy = inc.model_copy()
            if request.weight_adjustments:
                inc_copy = PriorityEngine.evaluate_incident_priority(
                    inc_copy,
                    override_weights=request.weight_adjustments
                )
            sim_incidents.append(inc_copy)

        # 3. Solve baseline plan vs what-if plan
        baseline_plan = MILPDispatcher.solve(incidents, resources)
        what_if_plan = MILPDispatcher.solve(sim_incidents, sim_resources)

        # 4. Compute impact deltas
        baseline_served = {a.incident_id: a.resource_id for a in baseline_plan.assignments}
        whatif_served = {a.incident_id: a.resource_id for a in what_if_plan.assignments}

        lost_coverage = [inc_id for inc_id in baseline_served if inc_id not in whatif_served]
        reassigned = [
            inc_id for inc_id in baseline_served
            if inc_id in whatif_served and baseline_served[inc_id] != whatif_served[inc_id]
        ]

        return {
            "what_if_plan": what_if_plan,
            "baseline_plan": baseline_plan,
            "impact_analysis": {
                "lost_coverage_incident_ids": lost_coverage,
                "reassigned_incident_ids": reassigned,
                "objective_delta": round(what_if_plan.objective_value - baseline_plan.objective_value, 4),
                "unserved_count_delta": len(what_if_plan.unserved_incidents) - len(baseline_plan.unserved_incidents)
            }
        }

what_if_engine = WhatIfEngine()
