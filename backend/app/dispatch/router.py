from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Dict, Optional, Any
from ..models.domain import (
    Incident,
    Resource,
    DispatchPlanRequest,
    DispatchPlanResponse,
    WhatIfRequest,
)
from ..models.enums import ResourceStatus, ResourceType
from .solver import MILPDispatcher
from .what_if import WhatIfEngine
from ..clustering.engine import clustering_engine

router = APIRouter(prefix="/dispatch", tags=["Dispatch & Optimization"])

# In-memory resources registry
active_resources: List[Resource] = []

@router.get("/resources", response_model=List[Resource])
async def list_resources():
    """Returns active district emergency resources."""
    return active_resources

@router.post("/resources", response_model=Resource)
async def register_resource(resource: Resource):
    """Registers or updates an operational resource."""
    for i, r in enumerate(active_resources):
        if r.resource_id == resource.resource_id:
            active_resources[i] = resource
            return resource
    active_resources.append(resource)
    return resource

@router.post("/plan", response_model=DispatchPlanResponse)
async def generate_dispatch_plan_endpoint(request: Optional[DispatchPlanRequest] = Body(None)):
    """
    Solves the MILP dispatch formulation with hard 3-5s budget,
    falling back to greedy heuristic if necessary.
    """
    req = request or DispatchPlanRequest()
    incidents = clustering_engine.get_all_incidents()
    
    plan = MILPDispatcher.solve(
        incidents=incidents,
        resources=active_resources,
        max_travel_time_min=req.max_travel_time_minutes
    )
    return plan

@router.post("/plan/what-if")
async def run_what_if_analysis_endpoint(request: WhatIfRequest):
    """
    Runs dispatch what-if scenario analysis without modifying live state.
    """
    incidents = clustering_engine.get_all_incidents()
    result = WhatIfEngine.evaluate_what_if(incidents, active_resources, request)
    return result
