import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.dispatch.router import AUDIT_LOG, verify_audit_chain, append_audit_entry, calculate_hash

client = TestClient(app)

def test_dispatch_approval_rejection():
    # Attempt dispatch without approver_id
    payload = {
        "approver_id": "",
        "approver_role": "COMMANDER",
        "approval_timestamp": datetime.utcnow().isoformat(),
        "approved_assignments": []
    }
    
    response = client.post("/dispatch/approve", json=payload)
    assert response.status_code == 403
    assert "Human approval token missing" in response.json()["detail"]
    
    # Missing role
    payload_no_role = {
        "approver_id": "U-123",
        "approver_role": "",
        "approval_timestamp": datetime.utcnow().isoformat(),
        "approved_assignments": []
    }
    response_no_role = client.post("/dispatch/approve", json=payload_no_role)
    assert response_no_role.status_code == 403

def test_hash_chain_integrity():
    # Clear log for clean test
    AUDIT_LOG.clear()
    
    # Add valid entries
    entry1 = append_audit_entry("TEST_ACTION_1", "USER-1", {"k": "v1"})
    entry2 = append_audit_entry("TEST_ACTION_2", "USER-2", {"k": "v2"})
    
    # Verify chain is intact
    assert verify_audit_chain() is True
    
    # Tamper with the payload of entry1
    original_payload = AUDIT_LOG[0].payload
    AUDIT_LOG[0].payload = {"k": "TAMPERED"}
    
    # Verify chain detects tampering
    assert verify_audit_chain() is False
    
    # Restore and verify it passes again
    AUDIT_LOG[0].payload = original_payload
    assert verify_audit_chain() is True
    
    # Tamper with the previous_hash of entry2
    original_prev_hash = AUDIT_LOG[1].previous_hash
    AUDIT_LOG[1].previous_hash = "BAD_HASH"
    
    assert verify_audit_chain() is False
