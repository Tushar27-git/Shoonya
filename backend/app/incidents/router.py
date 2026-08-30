from fastapi import APIRouter, HTTPException, Header, status
from app.audit.manager import audit_manager
from app.models.enums import AuditActionType
from app.clustering.engine import cluster_engine

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.post("/{incident_id}/approve", status_code=status.HTTP_200_OK)
async def approve_incident(
    incident_id: str,
    x_mock_auth_role: str = Header(None)
):
    if not x_mock_auth_role:
        raise HTTPException(status_code=403, detail="PROTOTYPE AUTH: X-Mock-Auth-Role header required")
        
    incident = cluster_engine.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    old_state = incident.model_dump(mode="json")
    incident.status = "VERIFIED"
    
    audit_manager.record_event(
        operator_id="MOCK_ADMIN",
        action_type=AuditActionType.STATUS_CHANGED,
        entity_type="INCIDENT",
        entity_id=incident_id,
        previous_state=old_state,
        new_state=incident.model_dump(mode="json"),
        operator_rationale=f"Approved by {x_mock_auth_role}"
    )
    
    return {"status": "APPROVED", "incident": incident}
