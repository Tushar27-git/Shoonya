from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class PublicAssistanceRequest(BaseModel):
    request_id: str
    category: str
    location_precision: str = "HIGH"
    location_string: str
    people_count: int
    vulnerability_tags: List[str] = []
    status: str = "SENT"
    history: List[str] = ["SENT"]
    emergency_escalation_recommended: bool = False
    linked_incident_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EmergencyContact(BaseModel):
    contact_id: str
    name: str
    phone: str
    type: str
    verification_status: str
    escalation_priority: int
    active: bool = True
