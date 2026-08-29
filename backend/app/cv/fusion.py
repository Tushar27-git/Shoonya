from typing import List, Optional, Tuple
from datetime import datetime, timezone
import uuid
from ..models.domain import Incident, VisualEvidenceMetadata, DisputeRecord, RawReport
from ..models.enums import LocationPrecision, SourceChannel
from ..confidence.engine import ConfidenceEngine


class VisualFusionEngine:
    """
    Asynchronously fuses optical, SAR, and drone visual evidence into active incidents.
    Calibrates confidence (V_i), upgrades location precision halos, and flags visual disputes.
    """
    @staticmethod
    def fuse_visual_evidence(
        incident: Incident,
        visual: VisualEvidenceMetadata,
        constituent_reports: Optional[List[RawReport]] = None,
        current_time: Optional[datetime] = None
    ) -> Incident:
        now = current_time or datetime.now(timezone.utc)

        # 1. Attach visual evidence to incident
        incident.visual_evidence = visual

        # 2. Precision upgrade: High-res drone imagery localizes location to HIGH precision
        if visual.resolution_meters <= 1.0 and incident.location_precision != LocationPrecision.HIGH:
            incident.location_precision = LocationPrecision.HIGH
            incident.location.precision = LocationPrecision.HIGH

        # 3. Check for Visual vs Claim Discrepancies (Visual Dispute Detection)
        if visual.visual_confidence >= 0.85:
            # If incident is FLOOD but optical/SAR detects 0% inundation
            if incident.category == "FLOOD" and not visual.flood_detected and visual.inundated_area_pct < 5.0:
                sensor_channel = SourceChannel.DRONE if "DRONE" in visual.sensor_type else SourceChannel.SATELLITE
                disp = DisputeRecord(
                    contradiction_id=f"DISP-CV-{uuid.uuid4().hex[:6].upper()}",
                    incident_id=incident.incident_id,
                    field_disputed="VISUAL_FLOOD_ABSENCE",
                    claim_a_text="Constituent text reports severe flooding",
                    claim_a_source=SourceChannel.SMS,
                    claim_a_time=incident.created_at,
                    claim_b_text=f"{visual.sensor_type} imagery indicates 0% inundation (Confidence {visual.visual_confidence})",
                    claim_b_source=sensor_channel,
                    claim_b_time=visual.capture_time,
                    materiality=0.85,
                    resolved=False
                )
                incident.disputes.append(disp)
                incident.dispute_flag = True

        # 4. Re-evaluate bounded confidence score via ConfidenceEngine
        reports = constituent_reports or [
            RawReport(
                report_id="R-DUMMY",
                source_channel=SourceChannel.RADIO,
                raw_text=incident.evidence_summary[0] if incident.evidence_summary else "",
                timestamp=incident.created_at,
                resolved_location=incident.location
            )
        ]

        
        updated_inc = ConfidenceEngine.evaluate_incident_confidence(
            incident=incident,
            reports=reports,
            current_time=now
        )

        return updated_inc

visual_fusion_engine = VisualFusionEngine()
