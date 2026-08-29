import math
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from ..models.domain import VisualEvidenceMetadata

class VisualDetector:
    """
    Simulates multi-spectral optical, SAR (Synthetic Aperture Radar),
    and drone aerial computer vision analysis for disaster verification.
    """
    @staticmethod
    def analyze_sensor_capture(
        image_id: str,
        sensor_type: str, # "SENTINEL-2_OPTICAL" | "SENTINEL-1_SAR" | "DRONE_RGB" | "PLANETSCOPE"
        capture_time: Optional[datetime] = None,
        water_index_ndwi: Optional[float] = None,
        sar_backscatter_db: Optional[float] = None,
        cloud_cover_pct: float = 0.0,
        reported_hazard: str = "FLOOD"
    ) -> VisualEvidenceMetadata:
        ts = capture_time or datetime.now(timezone.utc)
        
        flood_detected = False
        inundated_pct = 0.0
        structural_damage = False
        road_blocked = False
        raw_confidence = 0.75

        # 1. Multi-spectral Optical (e.g. Sentinel-2, PlanetScope)
        if "OPTICAL" in sensor_type.upper() or "PLANETSCOPE" in sensor_type.upper():
            # NDWI > 0.15 indicates surface water / inundation
            ndwi = water_index_ndwi if water_index_ndwi is not None else 0.42
            if ndwi >= 0.15:
                flood_detected = True
                inundated_pct = min(100.0, max(10.0, (ndwi + 0.5) * 80.0))
            
            # Optical confidence penalized by cloud cover
            cloud_penalty = max(0.0, (cloud_cover_pct - 15.0) / 100.0)
            raw_confidence = max(0.2, 0.90 - cloud_penalty)

        # 2. Synthetic Aperture Radar (SAR Sentinel-1) - Cloud-Penetrating
        elif "SAR" in sensor_type.upper():
            # Smooth water surface causes specular reflection, dropping SAR backscatter < -14 dB
            backscatter = sar_backscatter_db if sar_backscatter_db is not None else -18.5
            if backscatter <= -14.0:
                flood_detected = True
                inundated_pct = min(100.0, max(20.0, (-backscatter - 10.0) * 8.0))
            
            # SAR is unaffected by clouds and works at night
            raw_confidence = 0.88

        # 3. Tactical Tactical Recon Drone (RGB / Thermal)
        elif "DRONE" in sensor_type.upper():
            flood_detected = True
            inundated_pct = 68.0
            structural_damage = (reported_hazard == "BUILDING_COLLAPSE")
            road_blocked = True
            raw_confidence = 0.96 # High-resolution ground-truth

        if reported_hazard == "BUILDING_COLLAPSE":
            structural_damage = True
            flood_detected = False

        if reported_hazard in ["ROAD_WASHOUT", "BRIDGE_FAILURE"]:
            road_blocked = True

        resolution = 10.0 if "SENTINEL" in sensor_type.upper() else 0.15 if "DRONE" in sensor_type.upper() else 3.0

        return VisualEvidenceMetadata(
            image_id=image_id,
            sensor_type=sensor_type,
            capture_time=ts,
            flood_detected=flood_detected,
            inundated_area_pct=round(inundated_pct, 1),
            structural_damage_detected=structural_damage,
            road_blocked=road_blocked,
            visual_confidence=round(raw_confidence, 2),
            resolution_meters=resolution,
            cloud_cover_pct=round(cloud_cover_pct, 1),
            bounding_box=[26.840, 80.930, 26.870, 80.970]
        )

visual_detector = VisualDetector()
