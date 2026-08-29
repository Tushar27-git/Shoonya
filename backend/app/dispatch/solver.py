import time
import uuid
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timezone
from ortools.sat.python import cp_model
from ..models.domain import Incident, Resource, AssignmentDetail, DispatchPlanResponse
from ..models.enums import PlanQuality, ResourceStatus
from ..config import settings
from .feasibility import FeasibilityChecker
from .fallback import GreedyFallbackDispatcher

class MILPDispatcher:
    """
    Solves the optimal dispatch assignment formulation:
    max sum(P_i * y_i)
    Subject to:
    y_i <= sum(a_r,i * x_r,i)
    sum_i(x_r,i) <= 1 for all r
    x_r,i <= avail_r
    x_r,i <= feasible_r,i
    t_r,i * x_r,i <= T_max

    Applies hard time budget (3-5s), best-incumbent recovery, and greedy fallback.
    """
    @staticmethod
    def solve(
        incidents: List[Incident],
        resources: List[Resource],
        max_travel_time_min: float = 60.0,
        budget_seconds: Optional[float] = None,
        force_fallback: bool = False
    ) -> DispatchPlanResponse:
        start_time = time.time()
        budget = budget_seconds or settings.SOLVER_TIMEOUT_SECONDS

        if force_fallback:
            return GreedyFallbackDispatcher.dispatch(
                incidents=incidents,
                resources=resources,
                max_travel_time_min=max_travel_time_min,
                solve_duration=budget
            )

        if not incidents or not resources:
            return DispatchPlanResponse(
                plan_id=f"PLAN-{uuid.uuid4().hex[:6].upper()}",
                plan_quality=PlanQuality.OPTIMAL,
                solver_duration_seconds=round(time.time() - start_time, 3),
                solver_status="OPTIMAL",
                objective_value=0.0,
                assignments=[],
                unserved_incidents=[inc.incident_id for inc in incidents],
                created_at=datetime.now(timezone.utc)
            )

        # 1. Filter available resources
        avail_resources = [r for r in resources if r.availability_status == ResourceStatus.AVAILABLE]
        if not avail_resources:
            return DispatchPlanResponse(
                plan_id=f"PLAN-{uuid.uuid4().hex[:6].upper()}",
                plan_quality=PlanQuality.OPTIMAL,
                solver_duration_seconds=round(time.time() - start_time, 3),
                solver_status="NO_AVAILABLE_RESOURCES",
                objective_value=0.0,
                assignments=[],
                unserved_incidents=[inc.incident_id for inc in incidents],
                created_at=datetime.now(timezone.utc)
            )

        # 2. Build CP-SAT Model
        model = cp_model.CpModel()
        x: Dict[Tuple[str, str], cp_model.IntVar] = {}
        y: Dict[str, cp_model.IntVar] = {}

        # Scale float priority to integer for CP-SAT (1000x multiplier)
        SCALE = 1000

        # Decision variables
        for inc in incidents:
            y[inc.incident_id] = model.NewBoolVar(f"y_{inc.incident_id}")
            for res in avail_resources:
                # Check feasibility & travel time cutoff
                if FeasibilityChecker.is_feasible(res, inc):
                    t_min = FeasibilityChecker.calculate_travel_time_minutes(res, inc)
                    if t_min <= max_travel_time_min:
                        x[(res.resource_id, inc.incident_id)] = model.NewBoolVar(f"x_{res.resource_id}_{inc.incident_id}")

        # Constraint 1: Demand coverage: y_i <= sum(x_r,i)
        for inc in incidents:
            candidate_x = [
                x[(res.resource_id, inc.incident_id)]
                for res in avail_resources
                if (res.resource_id, inc.incident_id) in x
            ]
            if candidate_x:
                model.Add(y[inc.incident_id] <= sum(candidate_x))
            else:
                model.Add(y[inc.incident_id] == 0)

        # Constraint 2: Resource at most 1 incident: sum_i(x_r,i) <= 1
        for res in avail_resources:
            assigned_x = [
                x[(res.resource_id, inc.incident_id)]
                for inc in incidents
                if (res.resource_id, inc.incident_id) in x
            ]
            if assigned_x:
                model.Add(sum(assigned_x) <= 1)

        # Objective: Maximize total priority of served incidents
        objective_terms = [
            int(inc.priority_score * SCALE) * y[inc.incident_id]
            for inc in incidents
        ]
        model.Maximize(sum(objective_terms))

        # 3. Execute Solve with time limit
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = float(budget)
        solver_status_code = solver.Solve(model)
        solve_duration = time.time() - start_time

        # 4. Handle solver output status
        if solver_status_code == cp_model.OPTIMAL:
            plan_quality = PlanQuality.OPTIMAL
            solver_status_str = "OPTIMAL"
        elif solver_status_code == cp_model.FEASIBLE:
            plan_quality = PlanQuality.FEASIBLE
            solver_status_str = "FEASIBLE"
        else:
            # Timeout / Infeasible -> Heuristic fallback
            return GreedyFallbackDispatcher.dispatch(
                incidents=incidents,
                resources=avail_resources,
                max_travel_time_min=max_travel_time_min,
                solve_duration=solve_duration
            )

        # Extract assignments
        assignments: List[AssignmentDetail] = []
        served_ids = set()

        for inc in incidents:
            for res in avail_resources:
                if (res.resource_id, inc.incident_id) in x:
                    if solver.Value(x[(res.resource_id, inc.incident_id)]) == 1:
                        t_min = FeasibilityChecker.calculate_travel_time_minutes(res, inc)
                        assignments.append(
                            AssignmentDetail(
                                incident_id=inc.incident_id,
                                resource_id=res.resource_id,
                                estimated_travel_time_min=t_min,
                                served_fraction=1.0,
                                reason=f"CP-SAT {solver_status_str}: {res.type.value} matched to {inc.category.value} (ETA {t_min} min)"
                            )
                        )
                        served_ids.add(inc.incident_id)

        unserved = [inc.incident_id for inc in incidents if inc.incident_id not in served_ids]
        raw_obj_val = solver.ObjectiveValue() / SCALE

        return DispatchPlanResponse(
            plan_id=f"PLAN-{uuid.uuid4().hex[:6].upper()}",
            plan_quality=plan_quality,
            solver_duration_seconds=round(solve_duration, 3),
            solver_status=solver_status_str,
            objective_value=round(raw_obj_val, 4),
            assignments=assignments,
            unserved_incidents=unserved,
            created_at=datetime.now(timezone.utc)
        )

milp_dispatcher = MILPDispatcher()
DispatchSolver = MILPDispatcher

