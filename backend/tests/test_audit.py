import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.domain import ApprovalGateRequest
from app.models.enums import AuditActionType
from app.audit.manager import AuditManager
from app.audit.approval_gate import ApprovalGate

client = TestClient(app)

def test_human_approval_flow():
    """Verify standard operator approval flow creates tamper-evident audit record."""
    manager = AuditManager()
    gate = ApprovalGate()
    
    # 1. Approve plan
    req = ApprovalGateRequest(
        plan_id="PLAN-TEST-01",
        operator_id="OP-EOC-LEAD-01",
        decision="APPROVED"
    )
    res = client.post("/audit/approval", json=req.model_dump())
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["decision"] == "APPROVED"
    assert "audit_record_id" in data

def test_mandatory_override_rationale_enforcement():
    """
    Verify the critical human authority rule:
    Any override MUST supply a non-empty operator rationale.
    """
    # 1. Attempt override WITHOUT rationale -> Must fail with 400
    req_no_reason = {
        "plan_id": "PLAN-TEST-02",
        "operator_id": "OP-EOC-LEAD-01",
        "decision": "OVERRIDDEN",
        "override_reason": "" # Empty rationale
    }
    res_fail = client.post("/audit/approval", json=req_no_reason)
    assert res_fail.status_code == 400
    assert "override_reason" in res_fail.json()["detail"].lower()

    # 2. Attempt override WITH valid rationale -> Must succeed
    req_with_reason = {
        "plan_id": "PLAN-TEST-02",
        "operator_id": "OP-EOC-LEAD-01",
        "decision": "OVERRIDDEN",
        "override_reason": "Ground unit reports Bridge B impassable for Excavator; rerouting via north bypass.",
        "override_details": {"reassigned_resource": "EXCAVATOR-01", "new_route": "NORTH_BYPASS"}
    }
    res_ok = client.post("/audit/approval", json=req_with_reason)
    assert res_ok.status_code == 200
    assert res_ok.json()["decision"] == "OVERRIDDEN"

def test_cryptographic_hash_chain_integrity():
    """
    Verify cryptographic SHA-256 hash chaining across sequential audit entries.
    """
    manager = AuditManager()

    # Record 5 sequential operational events
    for i in range(5):
        manager.record_event(
            operator_id=f"OP-{i}",
            action_type=AuditActionType.STATUS_CHANGED,
            entity_type="INCIDENT",
            entity_id=f"INC-00{i}",
            previous_state={"status": "REPORTED"},
            new_state={"status": "ASSIGNED"}
        )

    is_valid, count, err = manager.verify_integrity()
    assert is_valid is True
    assert count == 5
    assert err is None

def test_tamper_detection_and_immutability():
    """
    Verify tamper-evidence: modifying any historical record payload
    instantly breaks hash chain verification and pinpoints the tampered block.
    """
    manager = AuditManager()

    for i in range(5):
        manager.record_event(
            operator_id=f"OP-{i}",
            action_type=AuditActionType.INCIDENT_MERGED,
            entity_type="INCIDENT",
            entity_id=f"INC-00{i}"
        )

    # Validate intact chain first
    is_valid, _, _ = manager.verify_integrity()
    assert is_valid is True

    # Maliciously tamper with block 2 payload in history
    manager._chain[2].new_state = {"malicious_tamper": True}

    # Verify integrity detection catches tampering at index 2
    is_valid_after, bad_index, err_msg = manager.verify_integrity()
    assert is_valid_after is False
    assert bad_index == 2
    assert "tampering detected at block index 2" in err_msg.lower()

def test_audit_verify_api_endpoint():
    """Verify GET /audit/verify endpoint."""
    res = client.get("/audit/verify")
    assert res.status_code == 200
    data = res.json()
    assert "chain_valid" in data
    assert "verified_blocks" in data
    assert data["chain_valid"] is True
