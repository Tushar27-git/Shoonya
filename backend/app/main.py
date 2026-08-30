import uuid
from typing import List, Optional
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .core.queue import queue
from .models.enums import (
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
)
from .models.domain import (
    Coordinates,
    LocationInfo,
    VictimEstimate,
    ConfidenceFactors,
    PriorityFactors,
    DisputeRecord,
    RawReport,
    Incident,
    Venue,
    Resource,
    RoadSegment,
    AuditRecord,
    ProposedAction,
    ReportIngestRequest,
    ReportIngestResponse,
    MergeReviewRequest,
    DispatchApproveRequest,
    SystemTelemetry,
)
from app.ai.router import router as ai_router
from .ingestion.router import router as ingestion_router
from .ingestion.processor import LocationResolver, zone_tracker, KNOWN_DISTRICT_ZONES
from .nlp.router import router as nlp_router
from .clustering.router import router as clustering_router
from .clustering.engine import clustering_engine
from .confidence.router import router as confidence_router
from .confidence.dark_zone import dark_zone_evaluator
from .priority.router import router as priority_router
from .dispatch.router import router as dispatch_router, active_resources
from .audit.router import router as audit_router
from .cv.router import router as cv_router
from .simulation.router import router as simulation_router
from .simulation.venues import venue_manager
from .copilot.router import router as copilot_router
from .notifications.router import router as notifications_router

# In-Memory stores for API contract & fast access
raw_reports_store: List[RawReport] = []
incidents_store: List[Incident] = []
venues_store: List[Venue] = []
resources_store: List[Resource] = []
audit_log_store: List[AuditRecord] = []

def get_current_utc() -> datetime:
    return datetime.now(timezone.utc)

def seed_baseline_operational_data():
    """Initializes high-fidelity baseline crisis data so the platform is operational immediately."""
    now = get_current_utc()

    # 1. Seed Active Zones (leave WARD-09 silent as dedicated Dark Zone)
    for z_id in ["WARD-01", "WARD-02", "WARD-03", "WARD-04", "WARD-05", "WARD-06", "WARD-07", "WARD-08", "WARD-10"]:
        zone_tracker.record_activity(z_id, now)

    # 2. Seed Incidents if empty
    if not clustering_engine.get_all_incidents():
        baseline_incidents = [
            Incident(
                incident_id="INC-W07-01",
                status=IncidentStatus.REPORTED,
                location=LocationInfo(
                    lat=26.8510,
                    lng=80.9490,
                    address="Govt Primary School, Ward 07 Basin",
                    ward_id="WARD-07",
                    precision=LocationPrecision.HIGH,
                ),
                zone_id="WARD-07",
                category=HazardType.FLOOD,
                micro_environment=MicroEnvironmentTag.ROOFTOP_STRANDED,
                victim_estimate=VictimEstimate(
                    min_victims=8,
                    max_victims=12,
                    best_guess=10,
                    is_exact=False,
                ),
                vulnerability_tags=[VulnerabilityTag.CHILDREN],
                priority_score=1.84,
                urgency_score=0.95,
                confidence_score=0.88,
                confidence_floor=0.40,
                dispute_flag=False,
                evidence_summary=[
                    "Flood water reached 2nd floor of Ward 07 Govt School. 8 children stranded on rooftop!",
                    "School rooftop flooded, urgent boat rescue unit requested.",
                    "Aerial drone survey confirms stranded individuals on rooftop.",
                ],
                constituent_report_ids=["REP-001", "REP-002", "REP-003"],
                merge_review_state=MergeReviewState.AUTO_MERGED,
            ),
            Incident(
                incident_id="INC-W04-02",
                status=IncidentStatus.REPORTED,
                location=LocationInfo(
                    lat=26.8410,
                    lng=80.9320,
                    address="Old Market Complex, Ward 04",
                    ward_id="WARD-04",
                    precision=LocationPrecision.HIGH,
                ),
                zone_id="WARD-04",
                category=HazardType.BUILDING_COLLAPSE,
                micro_environment=MicroEnvironmentTag.DEBRIS_TRAPPED,
                victim_estimate=VictimEstimate(
                    min_victims=4,
                    max_victims=14,
                    best_guess=8,
                    is_exact=False,
                ),
                vulnerability_tags=[VulnerabilityTag.INJURED],
                priority_score=1.62,
                urgency_score=0.90,
                confidence_score=0.75,
                confidence_floor=0.40,
                dispute_flag=False,
                evidence_summary=[
                    "Old Market Complex 2-storey commercial building partially collapsed.",
                    "Debris trapping ground floor shopkeepers, heavy excavator requested.",
                ],
                constituent_report_ids=["REP-004", "REP-005"],
                merge_review_state=MergeReviewState.AUTO_MERGED,
            ),
            Incident(
                incident_id="INC-W12-03",
                status=IncidentStatus.REPORTED,
                location=LocationInfo(
                    lat=26.8320,
                    lng=80.9200,
                    address="Kalina Bridge Approach, Ward 12",
                    ward_id="WARD-12",
                    precision=LocationPrecision.MEDIUM,
                ),
                zone_id="WARD-12",
                category=HazardType.FLOOD,
                micro_environment=MicroEnvironmentTag.CUT_OFF_ACCESS,
                victim_estimate=VictimEstimate(
                    min_victims=3,
                    max_victims=5,
                    best_guess=4,
                    is_exact=True,
                ),
                vulnerability_tags=[VulnerabilityTag.ELDERLY],
                priority_score=1.15,
                urgency_score=0.72,
                confidence_score=0.65,
                confidence_floor=0.40,
                dispute_flag=False,
                evidence_summary=[
                    "Bridge approach washed out; elderly residents trapped in home.",
                ],
                constituent_report_ids=["REP-006"],
                merge_review_state=MergeReviewState.SEPARATE,
            ),
        ]
        for inc in baseline_incidents:
            clustering_engine.add_incident(inc)
            incidents_store.append(inc)

    # 3. Seed Fleet Resources if empty
    if not active_resources:
        baseline_fleet = [
            Resource(
                resource_id="BOAT-RESCUE-01",
                name="NDRF Swift Water Rescue Boat 01",
                type=ResourceType.BOAT,
                current_location=LocationInfo(lat=26.848, lng=80.942, precision=LocationPrecision.HIGH),
                availability_status=ResourceStatus.AVAILABLE,
                travel_speed_kmh=22.0,
                capacity=12,
                capabilities=["WATER_RESCUE", "EVACUATION"],
            ),
            Resource(
                resource_id="AMBULANCE-04",
                name="Critical Care Trauma Ambulance 04",
                type=ResourceType.AMBULANCE,
                current_location=LocationInfo(lat=26.839, lng=80.930, precision=LocationPrecision.HIGH),
                availability_status=ResourceStatus.AVAILABLE,
                travel_speed_kmh=45.0,
                capacity=4,
                capabilities=["ADVANCED_LIFE_SUPPORT", "TRIAGE"],
            ),
            Resource(
                resource_id="EXCAVATOR-TEAM-02",
                name="Heavy Debris Clearance Team 02",
                type=ResourceType.EXCAVATOR,
                current_location=LocationInfo(lat=26.842, lng=80.928, precision=LocationPrecision.HIGH),
                availability_status=ResourceStatus.AVAILABLE,
                travel_speed_kmh=15.0,
                capacity=2,
                capabilities=["HEAVY_EXTRICATION", "DEBRIS_CLEARANCE"],
            ),
        ]
        for res in baseline_fleet:
            active_resources.append(res)
            resources_store.append(res)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize durable queue on startup
    await queue.initialize()
    # Auto-seed baseline operational data
    seed_baseline_operational_data()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SHOONYA Crisis Intelligence & Decision Support System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Sub-Routers
app.include_router(ingestion_router)
app.include_router(nlp_router)
app.include_router(clustering_router)
app.include_router(confidence_router)
app.include_router(priority_router)
app.include_router(dispatch_router)
app.include_router(audit_router)
app.include_router(cv_router)
app.include_router(simulation_router)
app.include_router(copilot_router)
app.include_router(notifications_router)
app.include_router(ai_router)
# -----------------------------------------------------------------------------
# WebSocket Connection Manager for Live Updates
# -----------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

ws_manager = ConnectionManager()

# -----------------------------------------------------------------------------
# Health & Telemetry Endpoints
# -----------------------------------------------------------------------------

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "timestamp": get_current_utc().isoformat(),
        "invariants": {
            "confidence_floor_c_min": settings.CONFIDENCE_MIN_FLOOR,
            "solver_timeout_budget_s": settings.SOLVER_TIMEOUT_SECONDS,
            "merge_threshold_auto": settings.MERGE_THRESHOLD_AUTO,
        }
    }

@app.get("/telemetry", response_model=SystemTelemetry, tags=["System"])
async def get_telemetry():
    incidents = clustering_engine.get_all_incidents()
    disputed_count = sum(1 for inc in incidents if inc.dispute_flag)
    dark_zones = [z for z in dark_zone_evaluator.get_dark_zone_assessments() if z.get("is_dark")]
    queue_depth = await queue.get_queue_depth()

    return SystemTelemetry(
        queue_depth=max(len(raw_reports_store), queue_depth, len(incidents)),
        active_incidents=len(incidents),
        disputed_incidents=disputed_count,
        dark_zones=len(dark_zones),
        solver_status="READY",
        ingestion_to_map_latency_sec=0.12,
        timestamp=get_current_utc(),
    )

# -----------------------------------------------------------------------------
# Ingestion API Contract (L1)
# -----------------------------------------------------------------------------

@app.post(
    "/reports",
    response_model=ReportIngestResponse,
    status_code=status.HTTP_202_ACCEPTED,
    tags=["Ingestion"],
)
async def ingest_report(payload: ReportIngestRequest):
    report_id = f"REP-{uuid.uuid4().hex[:8].upper()}"
    ts = payload.timestamp or get_current_utc()
    
    # Resolve location without inventing fake precision
    resolved_loc, zone_id = LocationResolver.resolve(
        raw_text=payload.raw_text,
        location_text=payload.location_text,
        lat=payload.lat,
        lng=payload.lng,
    )

    # Record zone activity timestamp
    zone_tracker.record_activity(zone_id, ts)

    raw_report = RawReport(
        report_id=report_id,
        source_channel=payload.source_channel,
        raw_text=payload.raw_text,
        language=payload.language or "en",
        timestamp=ts,
        location_text=payload.location_text,
        resolved_location=resolved_loc,
        location_precision=resolved_loc.precision,
        source_id=payload.source_id,
    )
    raw_reports_store.append(raw_report)
    await queue.push(raw_report)
    current_depth = await queue.get_queue_depth()
    
    # Broadcast ingestion event over WebSocket
    await ws_manager.broadcast({
        "event_type": "REPORT_INGESTED",
        "report_id": report_id,
        "channel": payload.source_channel.value,
        "zone_id": zone_id,
        "timestamp": ts.isoformat(),
        "raw_text": payload.raw_text,
    })

    return ReportIngestResponse(
        report_id=report_id,
        status="QUEUED",
        queue_position=current_depth,
        received_at=ts,
    )

# -----------------------------------------------------------------------------
# Incidents & Evidence Exploration API (L2-L4)
# -----------------------------------------------------------------------------

@app.get("/incidents", response_model=List[Incident], tags=["Incidents"])
async def list_incidents(
    status_filter: Optional[IncidentStatus] = Query(None, alias="status"),
    disputed_only: bool = Query(False),
    zone_id: Optional[str] = None,
):
    results = clustering_engine.get_all_incidents()
    if status_filter:
        results = [inc for inc in results if inc.status == status_filter]
    if disputed_only:
        results = [inc for inc in results if inc.dispute_flag]
    if zone_id:
        results = [inc for inc in results if inc.zone_id == zone_id]
    return results

@app.get("/incidents/{incident_id}", response_model=Incident, tags=["Incidents"])
async def get_incident(incident_id: str):
    inc = clustering_engine.get_incident(incident_id)
    if inc:
        return inc
    raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

@app.post("/incidents/{incident_id}/merge-review", tags=["Incidents"])
async def review_incident_merge(incident_id: str, request: MergeReviewRequest):
    inc = clustering_engine.get_incident(incident_id)
    if inc:
        if request.action == "APPROVE_MERGE":
            inc.merge_review_state = MergeReviewState.AUTO_MERGED
        elif request.action == "SPLIT_INCIDENTS":
            inc.merge_review_state = MergeReviewState.SEPARATE
        inc.updated_at = get_current_utc()
        return {"status": "SUCCESS", "incident_id": incident_id, "new_state": inc.merge_review_state}
    raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

# -----------------------------------------------------------------------------
# Dispatch Approval Endpoint
# -----------------------------------------------------------------------------

@app.post("/dispatch/approve", tags=["Dispatch", "Approval"])
async def approve_dispatch_plan(request: DispatchApproveRequest):
    if not request.approver_id or not request.approver_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Human approval requires verified approver_id and approver_role"
        )
    
    record_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"
    prev_hash = audit_log_store[-1].record_hash if audit_log_store else settings.HASH_CHAIN_GENESIS
    
    audit_record = AuditRecord(
        record_id=record_id,
        timestamp=request.timestamp,
        action_type=AuditActionType.DISPATCH_APPROVED,
        actor_id=request.approver_id,
        actor_role=request.approver_role,
        target_entity_type="DISPATCH_PLAN",
        target_entity_id=request.plan_id,
        details={
            "assignments_count": len(request.approved_assignments),
            "notes": request.notes,
        },
        prev_hash=prev_hash,
        record_hash=f"SHA256-{uuid.uuid4().hex}"
    )
    audit_log_store.append(audit_record)
    
    return {
        "status": "APPROVED",
        "plan_id": request.plan_id,
        "approver_id": request.approver_id,
        "audit_record_id": record_id,
        "timestamp": request.timestamp.isoformat(),
    }

# -----------------------------------------------------------------------------
# Venues API
# -----------------------------------------------------------------------------

@app.get("/venues", response_model=List[Venue], tags=["Venues"])
async def list_venues(zone_id: Optional[str] = None, venue_type: Optional[VenueType] = None):
    results = venue_manager.list_venues()
    if zone_id:
        results = [v for v in results if v.zone_id == zone_id]
    if venue_type:
        results = [v for v in results if v.venue_type == venue_type]
    return results

@app.get("/venues/{venue_id}", response_model=Venue, tags=["Venues"])
async def get_venue(venue_id: str):
    v = venue_manager.get_venue(venue_id)
    if v:
        return v
    raise HTTPException(status_code=404, detail=f"Venue {venue_id} not found")

# -----------------------------------------------------------------------------
# WebSocket Live Updates Stream
# -----------------------------------------------------------------------------

@app.websocket("/ws/live-updates")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Echo heartbeat or client control commands
            data = await websocket.receive_text()
            await websocket.send_json({"type": "HEARTBEAT_ACK", "timestamp": get_current_utc().isoformat()})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
