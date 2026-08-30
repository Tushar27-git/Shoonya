from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from .models import RoutePlan, SafetyAudit, SafetyAlert, FleetUnit
from .service import (
    compute_risk_summary, plan_route, run_safety_audit, 
    evaluate_alert_triggers, FLEET_STORE, ROUTES_STORE, AUDIT_STORE, ALERT_STORE
)

router = APIRouter(prefix="/operations", tags=["Operations"])

@router.get("/risk-summary", response_model=List[Dict[str, Any]])
async def get_risk_summary():
    return await compute_risk_summary()

@router.get("/routes", response_model=List[RoutePlan])
def get_routes(task_id: str, fleet_unit_id: str):
    return plan_route(task_id, fleet_unit_id)

@router.post("/routes/{route_id}/approve")
def approve_route(route_id: str):
    route = ROUTES_STORE.get(route_id)
    if not route:
        raise HTTPException(404, "Route not found")
    # Audit log it
    return {"status": "APPROVED", "route": route}

@router.get("/fleet", response_model=List[FleetUnit])
def get_fleet():
    return list(FLEET_STORE.values())

@router.post("/fleet/{unit_id}/assign")
def assign_fleet(unit_id: str, task_id: str):
    fleet = FLEET_STORE.get(unit_id)
    if not fleet:
        raise HTTPException(404, "Fleet unit not found")
    if fleet.status != "AVAILABLE":
        raise HTTPException(400, "Fleet unit not available")
    
    fleet.status = "ASSIGNED"
    fleet.assigned_task_id = task_id
    # Log audit
    return fleet

@router.post("/audits")
def submit_audit(entity_type: str, entity_id: str, task_id: str):
    return run_safety_audit(entity_type, entity_id, task_id)

@router.get("/alerts", response_model=List[SafetyAlert])
async def get_alerts():
    await evaluate_alert_triggers()
    return list(ALERT_STORE.values())

@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    alert = ALERT_STORE.get(alert_id)
    if not alert:
        raise HTTPException(404, "Alert not found")
    alert.status = "ACKNOWLEDGED"
    return alert
