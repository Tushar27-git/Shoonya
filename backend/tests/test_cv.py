import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.domain import Incident, LocationInfo, VisualEvidenceMetadata
from app.models.enums import LocationPrecision, HazardType, MicroEnvironmentTag
from app.cv.detector import VisualDetector
from app.cv.fusion import VisualFusionEngine
from app.cv.tasking import SensorTaskingManager
from app.clustering.engine import clustering_engine

client = TestClient(app)

def test_optical_and_sar_detection():
    """
    Verify multi-spectral optical and SAR computer vision analysis models.
    """
    # 1. Multi-spectral optical with low clouds
    opt_clear = VisualDetector.analyze_sensor_capture(
        image_id="OPT-001",
        sensor_type="SENTINEL-2_OPTICAL",
        water_index_ndwi=0.45,
        cloud_cover_pct=5.0
    )
    assert opt_clear.flood_detected is True
    assert opt_clear.inundated_area_pct > 50.0
    assert opt_clear.visual_confidence >= 0.85

    # 2. Multi-spectral optical with heavy cloud cover (should penalize confidence)
    opt_cloudy = VisualDetector.analyze_sensor_capture(
        image_id="OPT-002",
        sensor_type="SENTINEL-2_OPTICAL",
        water_index_ndwi=0.45,
        cloud_cover_pct=85.0
    )
    assert opt_cloudy.visual_confidence < opt_clear.visual_confidence

    # 3. SAR Sentinel-1 (Cloud-penetrating all-weather radar)
    sar_capture = VisualDetector.analyze_sensor_capture(
        image_id="SAR-001",
        sensor_type="SENTINEL-1_SAR",
        sar_backscatter_db=-19.5,
        cloud_cover_pct=100.0 # Full monsoon overcast
    )
    assert sar_capture.flood_detected is True
    assert sar_capture.visual_confidence >= 0.85 # Radar unaffected by clouds

def test_async_visual_fusion_and_precision_elevation():
    """
    Verify asynchronous fusion elevates incident confidence and upgrades precision halo.
    """
    loc = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07", precision=LocationPrecision.MEDIUM)
    inc = Incident(
        incident_id="INC-CV-01",
        location=loc,
        location_precision=LocationPrecision.MEDIUM,
        zone_id="WARD-07",
        category=HazardType.FLOOD,
        confidence_score=0.40
    )

    # Ingest high-resolution tactical drone imagery (0.15m resolution)
    drone_evidence = VisualDetector.analyze_sensor_capture(
        image_id="DRONE-IMG-001",
        sensor_type="DRONE_RGB",
        reported_hazard="FLOOD"
    )

    fused_inc = VisualFusionEngine.fuse_visual_evidence(inc, drone_evidence)

    # 1. Confidence upgraded with visual factor (V_i)
    assert fused_inc.confidence_score > 0.70
    assert fused_inc.confidence_factors.visual_evidence is not None

    # 2. Precision upgraded to HIGH upon high-res drone localization
    assert fused_inc.location_precision == LocationPrecision.HIGH
    assert fused_inc.location.precision == LocationPrecision.HIGH

def test_visual_dispute_detection():
    """
    Verify dispute detection when high-confidence satellite imagery
    contradicts text claims (e.g. text claims severe flood but satellite detects 0%).
    """
    loc = LocationInfo(lat=26.8510, lng=80.9490, ward_id="WARD-07")
    inc = Incident(
        incident_id="INC-DISP-CV",
        location=loc,
        zone_id="WARD-07",
        category=HazardType.FLOOD,
        confidence_score=0.50
    )

    # High-confidence optical scan showing 0% inundation (false alarm)
    clear_dry_satellite = VisualEvidenceMetadata(
        image_id="SAT-DRY-01",
        sensor_type="SENTINEL-2_OPTICAL",
        flood_detected=False,
        inundated_area_pct=0.0,
        visual_confidence=0.92,
        cloud_cover_pct=0.0
    )

    fused_inc = VisualFusionEngine.fuse_visual_evidence(inc, clear_dry_satellite)

    assert fused_inc.dispute_flag is True
    assert len(fused_inc.disputes) >= 1
    disp = fused_inc.disputes[0]
    assert disp.field_disputed == "VISUAL_FLOOD_ABSENCE"
    assert "0%" in disp.claim_b_text

def test_drone_recon_tasking_endpoint():
    """Verify POST /cv/task-drone endpoint."""
    payload = {
        "incident_id": "INC-W09-DARK",
        "target_lat": 26.865,
        "target_lng": 80.960,
        "reason": "Verify unmonitored silent zone Ward 09"
    }
    res = client.post("/cv/task-drone", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "QUEUED"
    assert "drone_assigned" in data
    assert "task_id" in data
