from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from .service import (
    create_request, get_public_directory, get_nearby_help, get_guidance, 
    get_public_alerts, HELP_REQUEST_STORE, redact_for_public
)
from app.audit.manager import audit_manager
from app.models.enums import AuditActionType

router = APIRouter(prefix="/help", tags=["Help"])

@router.get("/contacts")
def contacts():
    return get_public_directory()

@router.get("/nearby")
def nearby():
    return get_nearby_help()

@router.post("/requests")
def create_req(payload: Dict[str, Any]):
    req = create_request(payload)
    return redact_for_public(req.model_dump())

@router.get("/requests/{req_id}")
def get_req(req_id: str):
    req = HELP_REQUEST_STORE.get(req_id)
    if not req:
        raise HTTPException(404, "Request not found")
    return redact_for_public(req.model_dump())

@router.get("/guidance/{category}")
def guidance(category: str):
    return get_guidance(category)

@router.get("/alerts")
def alerts():
    return get_public_alerts()

# Admin
@router.post("/admin/requests/{req_id}/assign-partner")
def assign_partner(req_id: str, payload: Dict[str, str]):
    req = HELP_REQUEST_STORE.get(req_id)
    if not req:
        raise HTTPException(404)
        
    req.status = "PARTNER_ASSIGNED"
    req.history.append("PARTNER_ASSIGNED")
    
    audit_manager.record_event(
        operator_id=payload.get("approver_id", "ADMIN"),
        action_type=AuditActionType.STATUS_CHANGED, # Or custom
        entity_type="HELP_REQUEST",
        entity_id=req_id,
        previous_state={},
        new_state={"status": req.status},
        operator_rationale="Assigned partner"
    )
    
    return req
