import pytest
from httpx import AsyncClient
from datetime import datetime
from app.amplify.cards import redact_pii, REDACTED_MARKER
from app.main import app

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.mark.asyncio
async def test_card_generation_and_approval():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Test 1: Verified Need Card
        need_payload = {
            "location": "Ward A",
            "affected_population": 50,
            "needed_items": ["water", "food"],
            "access_note": "Clear",
            "last_verified": datetime.utcnow().isoformat()
        }
        resp = await client.post("/amplify/cards/need/SRC_123", json=need_payload)
        assert resp.status_code == 200
        need_card = resp.json()
        assert need_card["type"] == "NEED"
        assert need_card["status"] == "DRAFT"
        card_id = need_card["card_id"]
        
        # Test 2: Approval Gate - Missing Approver
        approve_resp = await client.post(f"/amplify/cards/{card_id}/approve", json={})
        # Note: Validation error might be 422 if pydantic blocks it, or 403 if our manual check hits
        assert approve_resp.status_code in [403, 422]
        
        # Test 3: Approval Gate - Success
        approve_resp = await client.post(f"/amplify/cards/{card_id}/approve", json={"approver_id": "OP-1"})
        assert approve_resp.status_code == 200
        approved_card = approve_resp.json()["card"]
        assert approved_card["status"] == "APPROVED"
        assert approved_card["approver_id"] == "OP-1"

        # Test 4: Rumour Card Generation
        rumour_payload = {
            "claim_text": "Bridge is broken",
            "fact_status": "DISPUTED",
            "instruction": "Wait for official update"
        }
        resp = await client.post("/amplify/cards/rumour/SRC_456", json=rumour_payload)
        assert resp.status_code == 200
        rumour_card = resp.json()
        assert rumour_card["type"] == "RUMOUR"
        assert rumour_card["fact_status"] == "DISPUTED"

        # Test 5: Evacuation Card Generation
        evac_payload = {
            "area": "Ward C",
            "instruction": "Evacuate immediately"
        }
        resp = await client.post("/amplify/cards/evacuation/SRC_789", json=evac_payload)
        assert resp.status_code == 200
        evac_card = resp.json()
        assert evac_card["type"] == "WARNING"
        assert "DO NOT FORWARD PANIC" in evac_card["anti_panic_note"]

def test_pii_redaction():
    # Test dictionary redaction based on keys
    mock_data = {
        "reporter_name": "John Doe",
        "phone_number": "+1234567890",
        "safe_field": "This is safe",
        "live_position": [28.12, 77.12],
        "nested": {
            "contact_email": "john@example.com",
            "ok_field": True
        }
    }
    
    redacted = redact_pii(mock_data)
    
    assert redacted["reporter_name"] == REDACTED_MARKER
    assert redacted["phone_number"] == REDACTED_MARKER
    assert redacted["live_position"] == REDACTED_MARKER
    assert redacted["nested"]["contact_email"] == REDACTED_MARKER
    assert redacted["safe_field"] == "This is safe"
    assert redacted["nested"]["ok_field"] is True
    
    # Test tuple coordinate redaction
    assert redact_pii((28.1234, 77.1234)) == REDACTED_MARKER
    
    # Test string pattern redaction
    text = "Reporter at 28.12345, 77.12345 needs help"
    redacted_text = redact_pii(text)
    assert REDACTED_MARKER in redacted_text
    assert "28.12345" not in redacted_text
