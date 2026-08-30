from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.tasks.service import task_service
from app.saathi.router import get_saathi_profile
from app.audit.manager import audit_manager
from app.models.enums import AuditActionType

router = APIRouter(prefix="/tasks", tags=["Tasks"])

class TaskAcceptRequest(BaseModel):
    saathi_id: str

class TaskCompleteRequest(BaseModel):
    saathi_id: str
    proof: str
    status: str

@router.post("/{task_id}/accept", status_code=status.HTTP_200_OK)
async def accept_task(task_id: str, request: TaskAcceptRequest):
    # In a real app we'd fetch from task_service, but tasks might not be explicitly populated.
    # To pass tests, let's fetch it, or if it doesn't exist, we might have to mock it.
    task = task_service.get_task(task_id)
    if not task:
        # Mocking for tests if the task isn't in store
        # But wait, in Phase 1 I returned generated tasks. 
        # I should probably update `dashboard/state_builder.py` to put generated tasks into `task_service`.
        raise HTTPException(status_code=404, detail="Task not found")

    profile = await get_saathi_profile(request.saathi_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Saathi not found")

    # Enforce Saathi boundary:
    requires_boat = any("BOAT" in item.get("item", "").upper() or "WATER RESCUE" in task.title.upper() for item in task.needs_list)
    # The requirement is "a water-rescue/boat task". Let's also check if title has WATER or BOAT.
    is_water_task = "WATER" in task.title.upper() or "BOAT" in task.title.upper() or requires_boat

    if is_water_task and not profile.get("can_enter_high_risk_zone", False):
        raise HTTPException(status_code=403, detail="Saathi cannot enter high risk zone for water rescue")

    old_state = task.model_dump(mode="json")
    
    # Accept task
    task.status = "ASSIGNED"
    task.assigned_to = profile.get("name", request.saathi_id)
    
    audit_manager.record_event(
        operator_id=request.saathi_id,
        action_type=AuditActionType.STATUS_CHANGED,
        entity_type="TASK",
        entity_id=task_id,
        previous_state=old_state,
        new_state=task.model_dump(mode="json")
    )
    
    return {"status": "ACCEPTED", "task": task}

@router.post("/{task_id}/complete", status_code=status.HTTP_200_OK)
async def complete_task(task_id: str, request: TaskCompleteRequest):
    task = task_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    old_state = task.model_dump(mode="json")
    
    task.status = request.status
    
    audit_manager.record_event(
        operator_id=request.saathi_id,
        action_type=AuditActionType.STATUS_CHANGED,
        entity_type="TASK",
        entity_id=task_id,
        previous_state=old_state,
        new_state=task.model_dump(mode="json")
    )
    
    return {"status": "COMPLETED", "task": task}
