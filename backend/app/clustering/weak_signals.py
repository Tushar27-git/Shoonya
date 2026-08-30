import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
from app.models.domain import WeakSignal
from app.models.enums import SignalType

def haversine_km(c1: Tuple[float, float], c2: Tuple[float, float]) -> float:
    lat1, lon1 = c1
    lat2, lon2 = c2
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    return 6371.0 * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))

class EmergingRiskZone:
    def __init__(self, zone_id: str, structure_name: str, location: Tuple[float, float], contributing_signal_ids: List[str], confidence: float, reason: str):
        self.zone_id = zone_id
        self.structure_name = structure_name
        self.location = location
        self.contributing_signal_ids = contributing_signal_ids
        self.confidence = confidence
        self.reason = reason
        self.created_at = datetime.utcnow()

from app.confidence.engine import ConfidenceEngine

class WeakSignalCorrelator:
    def __init__(self, spatial_window_km: float = 2.0, time_window_hours: float = 3.0):
        self.spatial_window = spatial_window_km
        self.time_window = timedelta(hours=time_window_hours)
        self.signals: List[WeakSignal] = []
        self.conf_engine = ConfidenceEngine()

    def ingest_signal(self, signal: WeakSignal):
        self.signals.append(signal)

    def evaluate_structure(self, structure_id: str, structure_name: str, target_location: Tuple[float, float]) -> Optional[EmergingRiskZone]:
        now = datetime.utcnow()
        relevant: List[WeakSignal] = []
        for s in self.signals:
            if haversine_km(s.location, target_location) <= self.spatial_window:
                if (now - s.timestamp) <= self.time_window:
                    relevant.append(s)

        independent_sources = set(s.source_report_id for s in relevant)
        signal_types = set(s.signal_type for s in relevant)

        # Requires >= 3 independent sources with multiple co-occurring indicators
        if len(independent_sources) >= 3 and len(signal_types) >= 2:
            conf = self.conf_engine.calculate_confidence(
                independent_sources=len(independent_sources),
                supporting_reports=len(relevant)
            )
            type_names = ", ".join([st.value for st in signal_types])
            reason = f"Multiple independent weak signals ({type_names}) detected from {len(independent_sources)} sources near {structure_name}."
            return EmergingRiskZone(
                zone_id=f"ERZ-{structure_id}",
                structure_name=structure_name,
                location=target_location,
                contributing_signal_ids=[s.signal_id for s in relevant],
                confidence=round(conf, 2),
                reason=reason
            )
        return None
