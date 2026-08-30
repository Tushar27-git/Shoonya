import math
from datetime import datetime
from typing import List, Dict, Any, Tuple
from app.models.domain import RoadSegment, StatusClaim
from app.models.enums import RoadStatus

def calculate_distance_km(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    return 6371.0 * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))

def compute_cluster_severity(report_weights: List[float], report_count: int) -> float:
    return sum(report_weights) * math.log10(report_count + 1)

class IncidentCluster:
    def __init__(self, cluster_id: str, initial_report_id: str, location: Tuple[float, float], weight: float = 1.0):
        self.cluster_id = cluster_id
        self.centroid = location
        self.constituent_report_ids: List[str] = [initial_report_id]
        self.report_weights: List[float] = [weight]
        self.needs_review: bool = False

    @property
    def severity(self) -> float:
        return compute_cluster_severity(self.report_weights, len(self.constituent_report_ids))

    def evaluate_merge(self, other_cluster: 'IncidentCluster') -> Tuple[float, str]:
        dist = calculate_distance_km(self.centroid, other_cluster.centroid)
        if dist < 0.3:
            sim = 0.90
        elif dist < 1.0:
            sim = 0.70
        else:
            sim = 0.30

        if sim >= 0.85:
            return sim, "AUTO_MERGE"
        elif 0.55 <= sim < 0.85:
            return sim, "PROVISIONAL_MERGE"
        return sim, "DISTINCT"

    def merge(self, other_cluster: 'IncidentCluster', similarity: float):
        self.constituent_report_ids.extend(other_cluster.constituent_report_ids)
        self.report_weights.extend(other_cluster.report_weights)
        if 0.55 <= similarity < 0.85:
            self.needs_review = True

    def split(self, report_id_to_remove: str) -> 'IncidentCluster':
        idx = self.constituent_report_ids.index(report_id_to_remove)
        self.constituent_report_ids.pop(idx)
        wt = self.report_weights.pop(idx)
        return IncidentCluster(f"{self.cluster_id}-split", report_id_to_remove, self.centroid, wt)

class RoadStatusPipeline:
    def __init__(self):
        self.segments: Dict[str, RoadSegment] = {}

    def register_segment(self, segment: RoadSegment):
        self.segments[segment.segment_id] = segment

    def ingest_claim(self, segment_id: str, claim: RoadStatus, source: str) -> RoadSegment:
        seg = self.segments[segment_id]
        new_claim = StatusClaim(claim=claim, source=source, timestamp=datetime.utcnow())
        seg.status_claims.append(new_claim)
        claims = [c.claim for c in seg.status_claims]
        if RoadStatus.OPEN in claims and RoadStatus.CLOSED in claims:
            seg.disputed = True
            seg.status = RoadStatus.UNKNOWN
        else:
            seg.status = claim
        return seg
