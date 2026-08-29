from typing import Dict, Any, Optional, List
from fastapi import HTTPException
from ..models.domain import ApprovalGateRequest, ApprovalGateResponse, AuditRecord
from ..models.enums import AuditActionType, IncidentStatus, ResourceStatus
from .manager import audit_manager

class ApprovalGate:
    """
    Enforces the Human Authority & Override Rule:
    AI / MILP optimization proposes actions only; state changes only take effect
    upon explicit operator authorization.
    """
    @staticmethod
    def process_decision(request: ApprovalGateRequest) -> ApprovalGateResponse:
        decision_upper = request.decision.upper()

        if decision_upper not in ["APPROVED", "REJECTED", "OVERRIDDEN"]:
            raise HTTPException(status_code=400, detail="Decision must be 'APPROVED', 'REJECTED', or 'OVERRIDDEN'")

        # Enforce mandatory non-empty rationale on overrides
        if decision_upper == "OVERRIDDEN":
            if not request.override_reason or not request.override_reason.strip():
                raise HTTPException(
                    status_code=400,
                    detail="Mandatory override_reason is required when decision is 'OVERRIDDEN'"
                )
            action_type = AuditActionType.DISPATCH_OVERRIDDEN
        elif decision_upper == "APPROVED":
            action_type = AuditActionType.DISPATCH_APPROVED
        else:
            action_type = AuditActionType.PLAN_REJECTED

        # Record tamper-evident cryptographic audit record
        audit_rec = audit_manager.record_event(
            operator_id=request.operator_id,
            action_type=action_type,
            entity_type="DISPATCH_PLAN",
            entity_id=request.plan_id,
            previous_state={"status": "PROPOSED"},
            new_state={"status": decision_upper, "override_details": request.override_details},
            operator_rationale=request.override_reason
        )

        return ApprovalGateResponse(
            success=True,
            decision=decision_upper,
            audit_record_id=audit_rec.record_id,
            message=f"Plan {request.plan_id} {decision_upper} by {request.operator_id}"
        )

approval_gate = ApprovalGate()
