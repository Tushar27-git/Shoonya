from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class FleetStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    ASSIGNED = "ASSIGNED"
    EN_ROUTE = "EN_ROUTE"
    ON_SCENE = "ON_SCENE"
    TASK_COMPLETE = "TASK_COMPLETE"
    RETURNING = "RETURNING"
    REFUELLING = "REFUELLING"
    MAINTENANCE = "MAINTENANCE"
    UNAVAILABLE = "UNAVAILABLE"

class AuditResult(str, Enum):
    PASS = "PASS"
    CONDITIONAL_PASS = "CONDITIONAL_PASS"
    FAIL = "FAIL"

class AlertSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    WARNING = "WARNING"
    INFO = "INFO"

class AlertAudience(str, Enum):
    INTERNAL = "INTERNAL"
    NGO_PARTNER = "NGO_PARTNER"
    SAATHI = "SAATHI"
    PUBLIC = "PUBLIC"

class AlertStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    SENT = "SENT"
    ACKNOWLEDGED = "ACKNOWLEDGED"

class FleetUnit(BaseModel):
    unit_id: str
    unit_type: str  # e.g., BOAT, VAN, AMBULANCE
    status: FleetStatus = FleetStatus.AVAILABLE
    fuel_percent: int = 100
    crew_available: bool = True
    current_location: Optional[str] = None
    assigned_task_id: Optional[str] = None

class RouteSegmentRisk(BaseModel):
    segment_id: str
    risk_score: int
    status: str
    travel_time_minutes: int

class RoutePlan(BaseModel):
    route_id: str
    task_id: str
    fleet_unit_id: str
    segments: List[RouteSegmentRisk]
    total_travel_time_minutes: int
    total_risk_score: int
    confidence: float
    restrictions: List[str] = []

class SafetyAudit(BaseModel):
    audit_id: str
    entity_type: str
    entity_id: str
    task_id: str
    result: AuditResult
    restrictions: List[str] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SafetyAlert(BaseModel):
    alert_id: str
    severity: AlertSeverity
    audience: AlertAudience
    status: AlertStatus
    message: str
    trigger_source: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
