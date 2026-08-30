from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field, field_validator, model_validator
from .enums import (
    IncidentStatus,
    LocationPrecision,
    SourceChannel,
    MicroEnvironmentTag,
    VulnerabilityTag,
    HazardType,
    VenueType,
    VenueStatus,
    ResourceType,
    ResourceStatus,
    RoadStatus,
    MergeReviewState,
    PlanQuality,
    AuditActionType,
    TelecomStatus,
    ProposedActionType,
    NotificationChannel,
    NotificationStatus,
    AdvisoryType
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)

# -----------------------------------------------------------------------------
# Spatial & Geographic Objects
# -----------------------------------------------------------------------------

class Coordinates(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    lng: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")

class LocationInfo(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    address: Optional[str] = None
    ward_id: Optional[str] = None
    polygon: Optional[List[Coordinates]] = None
    precision: LocationPrecision = LocationPrecision.HIGH

    @property
    def ward(self) -> Optional[str]:
        return self.ward_id

    @property
    def raw_text(self) -> Optional[str]:
        return self.address

Location = LocationInfo

class WeakSignal(BaseModel):
    signal_id: str
    signal_type: str  # or SignalType from enums
    location: LocationInfo
    timestamp: datetime = Field(default_factory=utc_now)
    source_report_id: str

SMS_CODE_MAP: Dict[str, Dict[str, Any]] = {
    "911": {
        "category": HazardType.FLOOD,
        "micro_environment": MicroEnvironmentTag.ROOFTOP_STRANDED,
        "urgency_default": 0.95
    },
    "101": {
        "category": HazardType.COLLAPSE,
        "micro_environment": MicroEnvironmentTag.DEBRIS_TRAPPED,
        "urgency_default": 0.90
    },
    "102": {
        "category": HazardType.SHELTER_UTILITY_FAILURE,
        "micro_environment": MicroEnvironmentTag.SHELTER_MEDICAL_RISK,
        "urgency_default": 0.85
    }
}


# -----------------------------------------------------------------------------
# Incident Evidence & Measurement Sub-Models
# -----------------------------------------------------------------------------

class VictimEstimate(BaseModel):
    min_victims: int = Field(default=0, ge=0)
    max_victims: int = Field(default=0, ge=0)
    best_guess: int = Field(default=0, ge=0)
    is_exact: bool = False

    @model_validator(mode="after")
    def validate_bounds(self) -> VictimEstimate:
        if self.min_victims > self.max_victims:
            self.max_victims = self.min_victims
        if not (self.min_victims <= self.best_guess <= self.max_victims):
            self.best_guess = max(self.min_victims, min(self.best_guess, self.max_victims))
        return self

class ConfidenceFactors(BaseModel):
    source_corroboration: float = Field(default=0.0, ge=0.0, le=1.0)
    geospatial_consistency: float = Field(default=0.0, ge=0.0, le=1.0)
    temporal_consistency: float = Field(default=0.0, ge=0.0, le=1.0)
    visual_evidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    contradiction_penalty: float = Field(default=0.0, ge=0.0, le=1.0)
    baseline_prior: float = Field(default=0.2, ge=0.0, le=1.0)
    score: float = Field(default=0.2, ge=0.0, le=1.0)

class PriorityFactors(BaseModel):
    severity_score: float = Field(default=0.0, ge=0.0, le=1.0)
    vulnerability_score: float = Field(default=0.0, ge=0.0, le=1.0)
    victim_count_term: float = Field(default=0.0, ge=0.0)
    recency_score: float = Field(default=0.0, ge=0.0, le=1.0)
    accessibility_risk_score: float = Field(default=0.0, ge=0.0, le=1.0)
    base_urgency: float = Field(default=0.0, ge=0.0)
    confidence_modifier: float = Field(default=0.4, ge=0.4, le=1.0)
    final_priority: float = Field(default=0.0, ge=0.0)

class DisputeRecord(BaseModel):
    contradiction_id: str
    incident_id: str
    field_disputed: str
    claim_a_text: str
    claim_a_source: SourceChannel
    claim_a_time: datetime
    claim_b_text: str
    claim_b_source: SourceChannel
    claim_b_time: datetime
    materiality: float = Field(default=0.5, ge=0.0, le=1.0)
    resolved: bool = False
    resolution_note: Optional[str] = None

class VisualEvidenceMetadata(BaseModel):
    image_id: str
    sensor_type: str = "SATELLITE"
    capture_time: datetime = Field(default_factory=utc_now)
    ingestion_time: datetime = Field(default_factory=utc_now)
    flood_detected: bool = False
    inundated_area_pct: float = Field(default=0.0, ge=0.0, le=100.0)
    structural_damage_detected: bool = False
    road_blocked: bool = False
    road_accessibility: str = "MEDIUM"
    visual_confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    resolution_meters: float = 10.0
    cloud_cover_pct: float = 0.0
    bounding_box: Optional[List[float]] = None
    model_name: str = "Prithvi-EO-2.0-Flood"
    model_version: str = "v1.0"
    limitations: str = "Optical sensor subject to cloud cover"


class ExtractionResult(BaseModel):
    location_text: Optional[str] = None
    resolved_lat: Optional[float] = None
    resolved_lng: Optional[float] = None
    location_precision: LocationPrecision = LocationPrecision.LOW
    victim_count: Optional[int] = None
    vulnerable_present: List[VulnerabilityTag] = Field(default_factory=list)
    hazard_type: HazardType = HazardType.FLOOD
    urgency_raw: float = Field(default=0.5, ge=0.0, le=1.0)
    micro_environment_tag: MicroEnvironmentTag = MicroEnvironmentTag.NONE
    raw_evidence_text: str

# -----------------------------------------------------------------------------
# Core Canonical Entities
# -----------------------------------------------------------------------------

class RawReport(BaseModel):
    report_id: str
    source_channel: SourceChannel
    raw_text: str
    language: str = "en"
    timestamp: datetime = Field(default_factory=utc_now)
    location_text: Optional[str] = None
    resolved_location: Optional[LocationInfo] = None
    location_precision: LocationPrecision = LocationPrecision.LOW
    extracted_data: Optional[ExtractionResult] = None
    cluster_id: Optional[str] = None
    source_id: Optional[str] = None
    trust_score: float = Field(default=0.5, ge=0.0, le=1.0)
    reporter_role_level: Optional[int] = None

class Incident(BaseModel):
    incident_id: str
    status: IncidentStatus = IncidentStatus.REPORTED
    location: LocationInfo
    location_precision: LocationPrecision = LocationPrecision.HIGH
    zone_id: str = "WARD-07"
    venue_id: Optional[str] = None




    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    category: HazardType = HazardType.FLOOD
    micro_environment: MicroEnvironmentTag = MicroEnvironmentTag.NONE
    victim_estimate: VictimEstimate = Field(default_factory=VictimEstimate)
    vulnerability_tags: List[VulnerabilityTag] = Field(default_factory=list)
    
    # Priority & Confidence Metrics (Load-bearing formulas)
    priority_score: float = Field(default=0.0, ge=0.0)
    urgency_score: float = Field(default=0.0, ge=0.0)
    confidence_score: float = Field(default=0.2, ge=0.0, le=1.0)
    confidence_floor: float = Field(default=0.4, description="Invariant M(0)=0.4")
    confidence_factors: ConfidenceFactors = Field(default_factory=ConfidenceFactors)
    priority_factors: PriorityFactors = Field(default_factory=PriorityFactors)

    # Disagreement & Evidence Integrity
    dispute_flag: bool = False
    disputes: List[DisputeRecord] = Field(default_factory=list)
    evidence_summary: List[str] = Field(default_factory=list)
    visual_evidence: Optional[VisualEvidenceMetadata] = None
    constituent_report_ids: List[str] = Field(default_factory=list)
    
    # Operational Allocation
    assigned_resources: List[str] = Field(default_factory=list)
    merge_review_state: MergeReviewState = MergeReviewState.SEPARATE
    trust_state: str = "NORMAL"

class Venue(BaseModel):
    venue_id: str
    name: str
    venue_type: VenueType
    location: LocationInfo
    zone_id: str = "WARD-01"
    capacity: int = Field(default=100, ge=0)
    current_occupancy: int = Field(default=0, ge=0)
    status: VenueStatus = VenueStatus.OPEN
    criticality: float = Field(default=0.5, ge=0.0, le=1.0)
    available_services: List[str] = Field(default_factory=list)
    accessibility: str = "OPEN"
    operational_hours: str = "24/7"
    hazard_exposure: float = Field(default=0.0, ge=0.0, le=1.0)
    source: str = "SYNTHETIC"
    notes: Optional[str] = None
    power_status: Optional[str] = "GRID"
    medical_supply_level: Optional[str] = "SUFFICIENT"
    contact_phone: Optional[str] = None
    updated_at: datetime = Field(default_factory=utc_now)

    @property
    def capacity_total(self) -> int:
        return self.capacity

    @capacity_total.setter
    def capacity_total(self, val: int):
        self.capacity = val

    @property
    def capacity_current(self) -> int:
        return self.current_occupancy

    @capacity_current.setter
    def capacity_current(self, val: int):
        self.current_occupancy = val


class Resource(BaseModel):
    resource_id: str
    type: ResourceType
    name: str = ""
    home_location: Optional[LocationInfo] = None
    current_location: LocationInfo
    capacity: int = Field(default=4, ge=1)
    capabilities: List[str] = Field(default_factory=list)
    availability_status: ResourceStatus = ResourceStatus.AVAILABLE
    travel_speed_kmh: float = Field(default=25.0, gt=0.0)
    hazard_constraints: List[HazardType] = Field(default_factory=list)
    current_assignment: Optional[str] = None
    updated_at: datetime = Field(default_factory=utc_now)


class RoadSegment(BaseModel):
    segment_id: str
    name: str
    from_node: Coordinates
    to_node: Coordinates
    length_km: float = Field(default=1.0, gt=0.0)
    status: RoadStatus = RoadStatus.OPEN
    closure_reason: Optional[str] = None
    last_verified_at: datetime = Field(default_factory=utc_now)
    staleness_flag: bool = False
    confidence_in_status: float = Field(default=1.0, ge=0.0, le=1.0)

class TelecomZone(BaseModel):
    zone_id: str
    zone_name: str
    status: TelecomStatus = TelecomStatus.LIVE
    estimated_population: int = Field(default=1000, ge=0)
    last_report_at: Optional[datetime] = None
    outage_started_at: Optional[datetime] = None
    outage_reason: Optional[str] = None
    is_dark: bool = False
    silence_duration_minutes: float = 0.0

class AuditRecord(BaseModel):
    record_id: str
    timestamp: datetime = Field(default_factory=utc_now)
    action_type: AuditActionType
    actor_id: str = "SYSTEM"
    actor_role: str = "OPERATOR"
    target_entity_type: str = "SYSTEM"
    target_entity_id: str = ""
    previous_state: Dict[str, Any] = Field(default_factory=dict)
    new_state: Dict[str, Any] = Field(default_factory=dict)
    details: Dict[str, Any] = Field(default_factory=dict)
    operator_rationale: Optional[str] = None
    prev_hash: str
    record_hash: str

    @property
    def operator_id(self) -> str:
        return self.actor_id

    @property
    def entity_type(self) -> str:
        return self.target_entity_type

    @property
    def entity_id(self) -> str:
        return self.target_entity_id

    @property
    def current_hash(self) -> str:
        return self.record_hash


class ProposedAction(BaseModel):
    action_id: str = Field(default_factory=lambda: f"ACT-{uuid.uuid4().hex[:6].upper()}")
    action_type: ProposedActionType
    incident_id: Optional[str] = ""
    target_id: Optional[str] = None
    resource_id: Optional[str] = None
    reason: str = ""
    description: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    evidence_refs: List[str] = Field(default_factory=list)
    requires_human_approval: bool = True
    created_at: datetime = Field(default_factory=utc_now)


class ReverseSOSNotification(BaseModel):
    notification_id: str
    incident_id: str
    recipient_identifier: str
    channel: SourceChannel
    message: str
    eta_minutes: Optional[int] = None
    sent_at: datetime = Field(default_factory=utc_now)
    acknowledged: bool = False

# -----------------------------------------------------------------------------
# API Request & Response Schemas
# -----------------------------------------------------------------------------

class ReportIngestRequest(BaseModel):
    source_channel: SourceChannel
    raw_text: str
    language: Optional[str] = "en"
    timestamp: Optional[datetime] = None
    location_text: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    source_id: Optional[str] = None

class ReportIngestResponse(BaseModel):
    report_id: str
    status: str = "QUEUED"
    queue_position: int = 1
    received_at: datetime = Field(default_factory=utc_now)

class MergeReviewRequest(BaseModel):
    action: str = Field(..., description="'APPROVE_MERGE' or 'SPLIT_INCIDENTS'")
    approver_id: str
    notes: Optional[str] = None

class DispatchPlanRequest(BaseModel):
    max_travel_time_minutes: float = Field(default=60.0, gt=0.0)
    override_weights: Optional[Dict[str, float]] = None
    excluded_resource_ids: List[str] = Field(default_factory=list)

class AssignmentDetail(BaseModel):
    incident_id: str
    resource_id: str
    estimated_travel_time_min: float
    served_fraction: float
    reason: str

class DispatchPlanResponse(BaseModel):
    plan_id: str
    plan_quality: PlanQuality
    solver_duration_seconds: float
    solver_status: str
    objective_value: float
    assignments: List[AssignmentDetail]
    unserved_incidents: List[str]
    created_at: datetime = Field(default_factory=utc_now)

class ApprovalGateRequest(BaseModel):
    plan_id: str
    operator_id: str
    decision: str = Field(..., description="APPROVED | REJECTED | OVERRIDDEN")
    override_reason: Optional[str] = None
    override_details: Optional[Dict[str, Any]] = None
    approved_assignments: List[AssignmentDetail] = Field(default_factory=list)

class ApprovalGateResponse(BaseModel):
    success: bool
    decision: str
    audit_record_id: str
    message: str

class DispatchApproveRequest(BaseModel):
    plan_id: str
    approver_id: str
    approver_role: str
    approved_assignments: List[AssignmentDetail]
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=utc_now)

class WhatIfRequest(BaseModel):

    unavailable_resources: List[str] = Field(default_factory=list)
    weight_adjustments: Optional[Dict[str, float]] = None
    simulated_road_closures: List[str] = Field(default_factory=list)

class CopilotQueryRequest(BaseModel):
    officer_id: Optional[str] = "OFFICER-01"
    question: Optional[str] = ""
    query: Optional[str] = None
    incident_context_id: Optional[str] = None
    focus_incident_id: Optional[str] = None
    focus_zone_id: Optional[str] = None

class CopilotQueryResponse(BaseModel):
    answer: str
    certainty: str = Field(default="KNOWN", description="KNOWN | DISPUTED | UNKNOWN | RECOMMENDED")
    evidence_refs: List[str] = Field(default_factory=list)
    key_changes: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    proposed_action: Optional[ProposedAction] = None

class CopilotMessageResponse(BaseModel):
    message_id: str
    timestamp: datetime = Field(default_factory=utc_now)
    query: str
    content: str
    citations: List[str] = Field(default_factory=list)
    confidence_caveats: List[str] = Field(default_factory=list)
    proposed_actions: List[ProposedAction] = Field(default_factory=list)
    language_detected: str = "EN"
    certainty: str = "KNOWN"
    evidence_refs: List[str] = Field(default_factory=list)

class SitrepResponse(BaseModel):
    sitrep_id: str
    timestamp: datetime = Field(default_factory=utc_now)
    executive_summary: str
    total_active_incidents: int = 0
    critical_incidents_count: int = 0
    disputed_incidents_count: int = 0
    casualty_bounds: Dict[str, int] = Field(default_factory=dict)
    dark_zones_count: int = 0
    critical_incident_ids: List[str] = Field(default_factory=list)
    venue_surge_alerts: List[str] = Field(default_factory=list)
    operational_recommendations: List[str] = Field(default_factory=list)

class SystemTelemetry(BaseModel):
    queue_depth: int = 0
    active_incidents: int = 0
    disputed_incidents: int = 0
    dark_zones: int = 0
    solver_status: str = "READY"
    ingestion_to_map_latency_sec: float = 0.0
    timestamp: datetime = Field(default_factory=utc_now)

# -----------------------------------------------------------------------------
# Notification & Reverse SOS Models
# -----------------------------------------------------------------------------

class NotificationRecipient(BaseModel):
    recipient_id: str
    contact_handle: str
    channel: NotificationChannel = NotificationChannel.SMS
    ward: Optional[str] = None
    location: Optional[Coordinates] = None
    language_preference: str = "HI"

class NotificationRecord(BaseModel):
    notification_id: str
    incident_id: Optional[str] = None
    advisory_type: AdvisoryType
    channel: NotificationChannel
    target_recipient_count: int = 1
    ward: Optional[str] = None
    target_radius_km: Optional[float] = None
    message_text_en: str
    message_text_hi: str
    message_text_hinglish: str
    status: NotificationStatus = NotificationStatus.SENT
    sent_at: datetime = Field(default_factory=utc_now)
    delivery_latency_ms: float = 120.0
    commander_id: str = "COMMANDER-01"
    rationale: Optional[str] = None

class ReverseSOSRequest(BaseModel):
    incident_id: str
    advisory_type: AdvisoryType = AdvisoryType.BOAT_INBOUND
    channels: List[NotificationChannel] = Field(default_factory=lambda: [NotificationChannel.SMS, NotificationChannel.VOICE_IVR])
    target_radius_km: float = Field(default=1.5, ge=0.1, le=20.0)
    eta_min: Optional[int] = 15
    resource_id: Optional[str] = None
    custom_guidance: Optional[str] = None
    commander_id: str = "COMMANDER-01"
    operator_rationale: str = Field(..., min_length=3, description="Mandatory rationale for outbound Reverse SOS")

class BroadcastRequest(BaseModel):
    ward: Optional[str] = "WARD-12"
    coordinates: Optional[Coordinates] = None
    radius_km: float = Field(default=2.5, ge=0.1, le=50.0)
    advisory_type: AdvisoryType = AdvisoryType.FLOOD_RISING
    channels: List[NotificationChannel] = Field(default_factory=lambda: [NotificationChannel.SMS, NotificationChannel.CELL_BROADCAST, NotificationChannel.RADIO])
    custom_text_en: Optional[str] = None
    custom_text_hi: Optional[str] = None
    custom_text_hinglish: Optional[str] = None
    commander_id: str = "COMMANDER-01"
    operator_rationale: str = Field(..., min_length=3, description="Mandatory rationale for regional alert broadcast")

class NotificationSummaryResponse(BaseModel):
    total_broadcasts_sent: int
    total_recipients_reached: int
    active_advisories_count: int
    channels_breakdown: Dict[str, int]
    recent_broadcasts: List[NotificationRecord]

from typing import Tuple

class StatusClaim(BaseModel):
    claim: RoadStatus
    source: str
    timestamp: datetime = Field(default_factory=utc_now)

class ShelterUtilityStatus(BaseModel):
    shelter_id: str
    name: str
    power_status: bool = True
    water_status: str = "SAFE"
    medicine_cold_chain_status: bool = True
    affected_population: int = 0
    linked_incident_id: Optional[str] = None

class NGOPartner(BaseModel):
    id: str
    name: str
    capabilities: List[str] = Field(default_factory=list)
    location: Tuple[float, float]
    stock_available: bool = True

from enum import Enum
class WaterStatus(str, Enum):
    SAFE = "SAFE"
    CONTAMINATED = "CONTAMINATED"
    UNKNOWN = "UNKNOWN"

class NeedCard(BaseModel):
    need_id: str
    incident_id: Optional[str] = None
    category: str
    description: str
    quantity_needed: int = 1
    priority: str = "MEDIUM"
    status: str = "PENDING"

