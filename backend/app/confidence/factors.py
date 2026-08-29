from typing import List, Optional
from datetime import datetime, timezone
from ..models.domain import RawReport, VisualEvidenceMetadata, ConfidenceFactors, LocationInfo
from ..models.enums import SourceChannel, LocationPrecision
from ..config import settings

class FactorEvaluator:
    """
    Computes individual evidence component inputs for the bounded confidence formula:
    C_i = clip(b + w_s*S_i + w_g*G_i + w_t*T_i + w_v*V_i - w_c*K_i, 0, 1)
    """
    @staticmethod
    def evaluate_source_corroboration(reports: List[RawReport]) -> float:
        """
        S_i: Source corroboration.
        Cross-channel corroboration (multiple distinct channels agreeing) is
        materially more valuable than repeated single-channel duplicates.
        """
        if not reports:
            return 0.0

        distinct_channels = {r.source_channel for r in reports}
        num_channels = len(distinct_channels)
        num_reports = len(reports)

        # Baseline channel diversity score
        if num_channels >= 3:
            channel_score = 1.0
        elif num_channels == 2:
            channel_score = 0.75
        else:
            channel_score = 0.4 # Single channel only

        # Minor boost for corroborating volume within channels (max +0.2)
        volume_boost = min(0.2, (num_reports - 1) * 0.05)

        return min(1.0, channel_score + volume_boost)

    @staticmethod
    def evaluate_geospatial_consistency(location: LocationInfo, reports: List[RawReport]) -> float:
        """
        G_i: Geospatial consistency based on location precision and GPS corroboration.
        """
        if location.precision == LocationPrecision.HIGH:
            return 0.95
        elif location.precision == LocationPrecision.MEDIUM:
            return 0.70
        else: # LOW precision
            return 0.35

    @staticmethod
    def evaluate_temporal_recency(reports: List[RawReport], current_time: Optional[datetime] = None) -> float:
        """
        T_i: Temporal consistency & recency. Decays as reports age.
        """
        if not reports:
            return 0.0

        now = current_time or datetime.now(timezone.utc)
        latest_ts = max(r.timestamp for r in reports)
        age_minutes = max(0.0, (now - latest_ts).total_seconds() / 60.0)

        # Recency decay curve: 1.0 at 0m, 0.8 at 15m, 0.5 at 60m, 0.2 at 180m
        if age_minutes <= 10.0:
            return 1.0
        elif age_minutes <= 30.0:
            return 0.85
        elif age_minutes <= 60.0:
            return 0.65
        elif age_minutes <= 180.0:
            return 0.40
        else:
            return 0.20

    @staticmethod
    def evaluate_visual_evidence(visual: Optional[VisualEvidenceMetadata]) -> Optional[float]:
        """
        V_i: Visual/sensor evidence from satellite or drone scans.
        Returns None if no visual evidence has arrived yet.
        """
        if not visual:
            return None
        # Modulated by visual confidence and detection flag
        if visual.flood_detected:
            return visual.visual_confidence
        else:
            # Undamaged or ambiguous
            return 0.3 * visual.visual_confidence
