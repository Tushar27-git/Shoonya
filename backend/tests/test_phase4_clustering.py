import pytest
from app.clustering.dedup import (
    compute_cluster_severity,
    IncidentCluster,
    RoadStatusPipeline
)
from app.models.domain import RoadSegment
from app.models.enums import RoadStatus

def test_log10_dampening():
    # 50 low-weight duplicate reports (e.g., automated social media reposts, weight=0.01)
    low_weights = [0.01] * 50
    score_50_low = compute_cluster_severity(low_weights, 50)
    
    # 2 independently confirmed high-weight reports (e.g., field operatives, weight=1.0)
    high_weights = [1.0] * 2
    score_2_high = compute_cluster_severity(high_weights, 2)
    
    # Assert log10 dampening makes the 50 low-weight reports score LOWER than 2 high-weight reports
    assert score_50_low < score_2_high
    assert score_50_low > 0

def test_merge_reversibility():
    cluster1 = IncidentCluster(cluster_id="C1", initial_report_id="R1", location=(26.0, 91.0), weight=1.0)
    cluster2 = IncidentCluster(cluster_id="C2", initial_report_id="R2", location=(26.005, 91.005), weight=0.8)
    
    # Simulate a provisional merge
    similarity, action = cluster1.evaluate_merge(cluster2)
    assert action == "PROVISIONAL_MERGE"
    
    cluster1.merge(cluster2, similarity)
    assert len(cluster1.constituent_report_ids) == 2
    assert "R2" in cluster1.constituent_report_ids
    assert cluster1.needs_review is True
    
    # Reverse the merge (split)
    split_cluster = cluster1.split("R2")
    assert len(cluster1.constituent_report_ids) == 1
    assert "R2" not in cluster1.constituent_report_ids
    assert split_cluster.constituent_report_ids[0] == "R2"
    assert split_cluster.report_weights[0] == 0.8

def test_road_segment_contradiction():
    pipeline = RoadStatusPipeline()
    
    # Register segment
    segment = RoadSegment(segment_id="RS-001", name="Main Bridge", endpoints=((0,0), (1,1)))
    pipeline.register_segment(segment)
    
    # Ingest OPEN claim
    seg_updated = pipeline.ingest_claim("RS-001", RoadStatus.OPEN, "source_1")
    assert seg_updated.status == RoadStatus.OPEN
    assert seg_updated.disputed is False
    
    # Ingest CLOSED claim
    seg_updated = pipeline.ingest_claim("RS-001", RoadStatus.CLOSED, "source_2")
    assert seg_updated.status == RoadStatus.UNKNOWN
    assert seg_updated.disputed is True
    
    # Verify claims are retained verbatim
    assert len(seg_updated.status_claims) == 2
    assert seg_updated.status_claims[0].claim == RoadStatus.OPEN
    assert seg_updated.status_claims[1].claim == RoadStatus.CLOSED
