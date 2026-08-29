from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from ..models.domain import VisualEvidenceMetadata, Incident
from .detector import visual_detector
from .fusion import visual_fusion_engine
from .tasking import sensor_tasking
from ..clustering.engine import clustering_engine

router = APIRouter(prefix="/cv", tags=["Computer Vision & Multi-Sensor Fusion"])

class DroneTaskRequest(BaseModel):
    incident_id: str
    target_lat: float
    target_lng: float
    reason: Optional[str] = "Aerial verification of disputed incident claims"

class CVVerificationRequest(BaseModel):
    incident_id: str
    sensor_type: str # "SENTINEL-2_OPTICAL" | "SENTINEL-1_SAR" | "DRONE_RGB"
    water_index_ndwi: Optional[float] = None
    sar_backscatter_db: Optional[float] = None
    cloud_cover_pct: float = 0.0

@router.post("/verify", response_model=Incident)
async def verify_incident_with_imagery(payload: CVVerificationRequest):
    """
    Ingests satellite/drone imagery metadata, runs CV detection,
    fuses visual evidence into incident cluster, and updates confidence C_i.
    """
    incident = clustering_engine.get_incident(payload.incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {payload.incident_id} not found")

    evidence = visual_detector.analyze_sensor_capture(
        image_id=f"IMG-{payload.sensor_type[:3]}-001",
        sensor_type=payload.sensor_type,
        water_index_ndwi=payload.water_index_ndwi,
        sar_backscatter_db=payload.sar_backscatter_db,
        cloud_cover_pct=payload.cloud_cover_pct,
        reported_hazard=incident.category
    )

    updated_inc = visual_fusion_engine.fuse_visual_evidence(incident, evidence)
    return updated_inc

@router.post("/task-drone")
async def task_drone_recon(payload: DroneTaskRequest):
    """
    Tasks autonomous drone survey for dark-zones or disputed coordinates.
    """
    return sensor_tasking.request_drone_recon(
        incident_id=payload.incident_id,
        target_lat=payload.target_lat,
        target_lng=payload.target_lng,
        reason=payload.reason or "Tactical drone verification"
    )

@router.get("/tasks")
async def list_active_cv_tasks():
    """Returns active drone survey tasks."""
    return sensor_tasking.get_active_tasks()
