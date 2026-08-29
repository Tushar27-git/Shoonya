from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from ..models.domain import ApprovalGateRequest, ApprovalGateResponse, AuditRecord
from ..models.enums import AuditActionType
from .manager import audit_manager
from .approval_gate import approval_gate

router = APIRouter(prefix="/audit", tags=["Human Approval & Audit Log"])

@router.post("/approval", response_model=ApprovalGateResponse)
async def submit_human_approval(request: ApprovalGateRequest):
    """
    Submits a human operator decision (APPROVED, REJECTED, or OVERRIDDEN).
    Overrides require a mandatory non-empty rationale.
    """
    return approval_gate.process_decision(request)

@router.get("/records", response_model=List[AuditRecord])
async def list_audit_records(
    entity_id: Optional[str] = Query(None),
    operator_id: Optional[str] = Query(None),
    action_type: Optional[AuditActionType] = Query(None)
):
    """Queries tamper-evident audit records."""
    return audit_manager.get_records(entity_id=entity_id, operator_id=operator_id, action_type=action_type)

@router.get("/verify")
async def verify_audit_hash_chain():
    """
    Cryptographically verifies the SHA-256 hash chain integrity of the audit log.
    """
    is_valid, count, err = audit_manager.verify_integrity()
    return {
        "chain_valid": is_valid,
        "verified_blocks": count,
        "tamper_detected": not is_valid,
        "error": err
    }
