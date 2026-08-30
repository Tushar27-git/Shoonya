import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

# Constants for PII Redaction
PII_KEYS = {"name", "phone", "email", "reporter_name", "contact", "exact_location", "live_position", "coordinates"}
REDACTED_MARKER = "[REDACTED]"

class ShareCard(BaseModel):
    card_id: str
    type: str
    status: str = "DRAFT" # DRAFT or APPROVED
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approver_id: Optional[str] = None

class VerifiedNeedCard(ShareCard):
    type: str = "NEED"
    location_general: str
    affected_count: int
    needed_items: List[str]
    access_note: str
    instructions: str = "DO NOT SEND UNCOORDINATED ITEMS. Please route all assistance through official channels."
    last_verified: datetime

class RumourCorrectionCard(ShareCard):
    type: str = "RUMOUR"
    claim_text: str
    fact_status: str # UNDER_VERIFICATION, DISPUTED, FALSE
    instruction: str
    next_update_eta: Optional[str] = None

class EvacuationWarningCard(ShareCard):
    type: str = "WARNING"
    area: str
    instruction: str
    anti_panic_note: str = "DO NOT FORWARD PANIC. Share only official instructions."

def redact_pii(data: Any) -> Any:
    """
    Recursively redacts PII fields from a dictionary or list.
    Also strips exact coordinate patterns (e.g., 28.123, 77.123) from strings if needed, 
    but primarily relies on key-based redaction.
    """
    if isinstance(data, dict):
        redacted_dict = {}
        for k, v in data.items():
            # If the key is identified as PII, redact it completely
            if any(pii_key in k.lower() for pii_key in PII_KEYS):
                redacted_dict[k] = REDACTED_MARKER
            else:
                redacted_dict[k] = redact_pii(v)
        return redacted_dict
    elif isinstance(data, list):
        return [redact_pii(item) for item in data]
    elif isinstance(data, tuple):
        # We redact tuples completely if they are coordinates (float, float)
        if len(data) == 2 and isinstance(data[0], (int, float)) and isinstance(data[1], (int, float)):
             return REDACTED_MARKER
        return tuple(redact_pii(list(data)))
    elif isinstance(data, str):
        # A simple regex to catch lat/lon like pairs in strings if they leak
        # E.g. "28.1234, 77.1234"
        coord_pattern = r'\b-?\d{1,2}\.\d{3,},\s*-?\d{1,3}\.\d{3,}\b'
        if re.search(coord_pattern, data):
            return re.sub(coord_pattern, REDACTED_MARKER, data)
        return data
    else:
        return data

def generate_need_card(card_id: str, need_data: dict) -> VerifiedNeedCard:
    # need_data is expected to be a dict representation of NeedCard from NEXUS-2
    # Convert exact coords to a general string representation or ward
    
    redacted_data = redact_pii(need_data)
    
    # We map location to a general string
    # Assuming need_data has 'location' or we get a 'ward_id' from somewhere.
    # For now, we just use a generic representation if it's redacted.
    loc = redacted_data.get("location", "General Ward Area")
    if loc == REDACTED_MARKER:
        loc = "General Ward Area (Specifics Redacted)"
        
    card = VerifiedNeedCard(
        card_id=card_id,
        location_general=loc,
        affected_count=redacted_data.get("affected_population", 0),
        needed_items=redacted_data.get("needed_items", []),
        access_note=redacted_data.get("access_note", ""),
        last_verified=redacted_data.get("last_verified", datetime.utcnow())
    )
    # The output of card.model_dump() should also pass through redact_pii before sharing
    return card

def generate_rumour_card(card_id: str, claim: str, status: str, instruction: str, eta: Optional[str] = None) -> RumourCorrectionCard:
    card = RumourCorrectionCard(
        card_id=card_id,
        claim_text=claim,
        fact_status=status,
        instruction=instruction,
        next_update_eta=eta
    )
    return card

def generate_evacuation_card(card_id: str, area: str, instruction: str) -> EvacuationWarningCard:
    card = EvacuationWarningCard(
        card_id=card_id,
        area=area,
        instruction=instruction
    )
    return card
