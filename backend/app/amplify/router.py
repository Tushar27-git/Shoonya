import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Header
from pydantic import BaseModel

from .cards import (
    generate_need_card,
    generate_rumour_card,
    generate_evacuation_card,
    ShareCard
)

router = APIRouter(prefix="/amplify/cards", tags=["Amplify Cards"])

# In-memory store for draft/approved cards
CARD_STORE: Dict[str, ShareCard] = {}

class ApprovalPayload(BaseModel):
    approver_id: str

@router.post("/{card_id}/approve")
async def approve_card(card_id: str, payload: ApprovalPayload, x_mock_auth_role: str = Header(None)):
    """
    Approves a DRAFT card. Rejects if approver_id is missing or auth header missing.
    """
    if not x_mock_auth_role:
        raise HTTPException(status_code=403, detail="PROTOTYPE AUTH: X-Mock-Auth-Role header required")

    if not payload.approver_id:
        raise HTTPException(status_code=403, detail="Human approver_id is required")
        
    card = CARD_STORE.get(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
        
    if card.status == "APPROVED":
        return {"status": "ALREADY_APPROVED", "card": card}
        
    old_state = card.model_dump(mode="json")
    
    card.status = "APPROVED"
    card.approver_id = payload.approver_id
    
    from app.audit.manager import audit_manager
    from app.models.enums import AuditActionType
    
    audit_manager.record_event(
        operator_id=payload.approver_id,
        action_type=AuditActionType.AMPLIFY_APPROVED,
        entity_type="AMPLIFY_CARD",
        entity_id=card_id,
        previous_state=old_state,
        new_state=card.model_dump(mode="json"),
        operator_rationale=f"Approved by {x_mock_auth_role}"
    )
    
    return {"status": "APPROVED", "card": card}

@router.post("/{card_type}/{source_id}")
async def generate_draft_card(card_type: str, source_id: str, payload: Optional[Dict[str, Any]] = None):
    """
    Generates a DRAFT card. 
    In a real system, this would look up the source_id (Incident, NeedCard, etc.) from the DB.
    Here we allow passing a payload for the mock generation.
    """
    card_id = f"CARD-{uuid.uuid4().hex[:8].upper()}"
    payload = payload or {}
    
    if card_type == "need":
        card = generate_need_card(card_id, payload)
    elif card_type == "rumour":
        card = generate_rumour_card(
            card_id,
            claim=payload.get("claim_text", "Unknown claim"),
            status=payload.get("fact_status", "UNDER_VERIFICATION"),
            instruction=payload.get("instruction", "Await official updates."),
            eta=payload.get("next_update_eta")
        )
    elif card_type == "evacuation":
        card = generate_evacuation_card(
            card_id,
            area=payload.get("area", "Unknown Area"),
            instruction=payload.get("instruction", "Follow local authorities.")
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unknown card type: {card_type}")
        
    CARD_STORE[card_id] = card
    return card

from fastapi import Header



@router.get("")
async def get_all_cards():
    return list(CARD_STORE.values())

@router.get("/{card_id}")
async def get_card(card_id: str):
    card = CARD_STORE.get(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card
