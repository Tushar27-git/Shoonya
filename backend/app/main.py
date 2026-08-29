import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
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
    DispatchPlanRequest,
    AssignmentDetail,
    DispatchPlanResponse,
    DispatchApproveRequest,
    WhatIfRequest,
    CopilotQueryRequest,
    CopilotQueryResponse,
    SystemTelemetry,
)

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .core.queue import queue
from .ingestion.router import router as ingestion_router
from .ingestion.processor import LocationResolver, zone_tracker
from .nlp.router import router as nlp_router
from .clustering.router import router as clustering_router
from .confidence.router import router as confidence_router
from .priority.router import router as priority_router
from .dispatch.router import router as dispatch_router
from .audit.router import router as audit_router
from .cv.router import router as cv_router
from .simulation.router import router as simulation_router
from .copilot.router import router as copilot_router
from .notifications.router import router as notifications_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize durable queue on startup
    await queue.initialize()
    yield
    # Cleanup on shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SHOONYA (शून्य) Crisis Intelligence & Decision Support System API",
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












# -----------------------------------------------------------------------------
# In-Memory Mock/Operational Store for API Contract & Fast Validation
# -----------------------------------------------------------------------------

raw_reports_store: List[RawReport] = []
incidents_store: List[Incident] = []
venues_store: List[Venue] = []
resources_store: List[Resource] = []
audit_log_store: List[AuditRecord] = []

def get_current_utc() -> datetime:
    return datetime.now(timezone.utc)

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
    disputed_count = sum(1 for inc in incidents_store if inc.dispute_flag)
    return SystemTelemetry(
        queue_depth=len(raw_reports_store),
        active_incidents=len(incidents_store),
        disputed_incidents=disputed_count,
        dark_zones=0,
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
    results = incidents_store
    if status_filter:
        results = [inc for inc in results if inc.status == status_filter]
    if disputed_only:
        results = [inc for inc in results if inc.dispute_flag]
    if zone_id:
        results = [inc for inc in results if inc.zone_id == zone_id]
    return results

@app.get("/incidents/{incident_id}", response_model=Incident, tags=["Incidents"])
async def get_incident(incident_id: str):
    for inc in incidents_store:
        if inc.incident_id == incident_id:
            return inc
    raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

@app.post("/incidents/{incident_id}/merge-review", tags=["Incidents"])
async def review_incident_merge(incident_id: str, request: MergeReviewRequest):
    for inc in incidents_store:
        if inc.incident_id == incident_id:
            if request.action == "APPROVE_MERGE":
                inc.merge_review_state = MergeReviewState.AUTO_MERGED
            elif request.action == "SPLIT_INCIDENTS":
                inc.merge_review_state = MergeReviewState.SEPARATE
            inc.updated_at = get_current_utc()
            return {"status": "SUCCESS", "incident_id": incident_id, "new_state": inc.merge_review_state}
    raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

# -----------------------------------------------------------------------------
# Dispatch Optimization & What-If API (L6-L7)
# -----------------------------------------------------------------------------

@app.post("/dispatch/plan", response_model=DispatchPlanResponse, tags=["Dispatch"])
async def generate_dispatch_plan(request: DispatchPlanRequest):
    plan_id = f"PLAN-{uuid.uuid4().hex[:8].upper()}"
    # Minimal compliant plan formulation placeholder for API contract validation
    assignments: List[AssignmentDetail] = []
    unserved: List[str] = [inc.incident_id for inc in incidents_store if inc.status == IncidentStatus.PRIORITIZED]
    
    return DispatchPlanResponse(
        plan_id=plan_id,
        plan_quality=PlanQuality.OPTIMAL,
        solver_duration_seconds=0.08,
        solver_status="OPTIMAL",
        objective_value=0.0,
        assignments=assignments,
        unserved_incidents=unserved,
        created_at=get_current_utc(),
    )

@app.post("/dispatch/plan/what-if", response_model=DispatchPlanResponse, tags=["Dispatch"])
async def run_what_if_dispatch(request: WhatIfRequest):
    plan_id = f"WHATIF-{uuid.uuid4().hex[:8].upper()}"
    return DispatchPlanResponse(
        plan_id=plan_id,
        plan_quality=PlanQuality.OPTIMAL,
        solver_duration_seconds=0.12,
        solver_status="OPTIMAL",
        objective_value=0.0,
        assignments=[],
        unserved_incidents=[],
        created_at=get_current_utc(),
    )

@app.post("/dispatch/approve", tags=["Dispatch", "Approval"])
async def approve_dispatch_plan(request: DispatchApproveRequest):
    # Enforce human approval boundary server-side
    if not request.approver_id or not request.approver_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Human approval requires verified approver_id and approver_role"
        )
    
    # Record in audit log
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
        record_hash=f"SHA256-{uuid.uuid4().hex}" # Hash computation expanded in Task 08
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
    results = venues_store
    if zone_id:
        results = [v for v in results if v.zone_id == zone_id]
    if venue_type:
        results = [v for v in results if v.venue_type == venue_type]
    return results

@app.get("/venues/{venue_id}", response_model=Venue, tags=["Venues"])
async def get_venue(venue_id: str):
    for v in venues_store:
        if v.venue_id == venue_id:
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
