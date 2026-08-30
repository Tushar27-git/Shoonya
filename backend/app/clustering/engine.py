import uuid
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timezone
from ..models.domain import (
    RawReport,
    Incident,
    LocationInfo,
    VictimEstimate,
    ConfidenceFactors,
    PriorityFactors,
    DisputeRecord,
)
from ..models.enums import (
    IncidentStatus,
    LocationPrecision,
    MergeReviewState,
    MicroEnvironmentTag,
    HazardType,
)
from ..config import settings
from .similarity import SimilarityCalculator
from .severity import SeverityCalculator

class ClusteringEngine:
    """
    Spatio-temporal and semantic clustering engine.
    Groups incoming raw reports into incident clusters, applies load-bearing merge
    thresholds, and ensures 100% reversible merges.
    """
    def __init__(self):
        self._incidents: Dict[str, Incident] = {}
        self._report_to_incident: Dict[str, str] = {}
        self._raw_reports: Dict[str, RawReport] = {}

    def get_all_incidents(self) -> List[Incident]:
        return list(self._incidents.values())

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        return self._incidents.get(incident_id)

    def process_report(self, report: RawReport) -> Tuple[Incident, MergeReviewState, float]:
        """
        Process a single raw report against active incidents.
        Returns (incident, merge_review_state, similarity_score).
        """
        self._raw_reports[report.report_id] = report

        # Find best candidate incident to merge with
        best_incident = None
        best_similarity = 0.0

        for inc in self._incidents.values():
            sim = SimilarityCalculator.spatio_temporal_semantic_similarity(
                text1=report.raw_text,
                loc1=report.resolved_location or LocationInfo(lat=26.85, lng=80.95),
                text2=inc.evidence_summary[0] if inc.evidence_summary else "",
                loc2=inc.location
            )
            if sim > best_similarity:
                best_similarity = sim
                best_incident = inc

        # Apply load-bearing merge thresholds
        if best_incident and best_similarity >= settings.MERGE_THRESHOLD_AUTO:
            # Case 1: >= 0.85 Auto-merge
            state = MergeReviewState.AUTO_MERGED
            updated_inc = self._merge_into_incident(best_incident, report, state)
            return updated_inc, state, best_similarity

        elif best_incident and best_similarity >= settings.MERGE_THRESHOLD_REVIEW:
            # Case 2: 0.55 <= conf < 0.85 Provisional merge with review flag
            state = MergeReviewState.NEEDS_REVIEW
            updated_inc = self._merge_into_incident(best_incident, report, state)
            return updated_inc, state, best_similarity

        else:
            # Case 3: < 0.55 Create separate incident
            state = MergeReviewState.SEPARATE
            new_inc = self._create_incident_from_report(report)
            return new_inc, state, best_similarity

    def _create_incident_from_report(self, report: RawReport) -> Incident:
        """Create a new distinct incident cluster from a single report."""
        inc_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
        loc = report.resolved_location or LocationInfo(lat=26.851, lng=80.949, precision=LocationPrecision.LOW)
        zone_id = loc.ward_id or "WARD-07"

        ext = report.extracted_data
        victim_est = VictimEstimate()
        vulnerabilities = []
        micro_env = MicroEnvironmentTag.NONE
        hazard = HazardType.FLOOD

        if ext:
            v_cnt = ext.victim_count or 0
            victim_est = VictimEstimate(min_victims=v_cnt, max_victims=v_cnt, best_guess=v_cnt)
            vulnerabilities = ext.vulnerable_present
            micro_env = ext.micro_environment_tag
            hazard = ext.hazard_type

        # Initial cluster severity calculation
        cluster_severity = SeverityCalculator.compute_cluster_severity([report])

        inc = Incident(
            incident_id=inc_id,
            status=IncidentStatus.REPORTED,
            location=loc,
            location_precision=loc.precision,
            zone_id=zone_id,
            category=hazard,
            micro_environment=micro_env,
            victim_estimate=victim_est,
            vulnerability_tags=vulnerabilities,
            priority_score=cluster_severity,
            urgency_score=ext.urgency_raw if ext else 0.5,
            confidence_score=0.3,
            confidence_floor=0.4,
            evidence_summary=[report.raw_text],
            constituent_report_ids=[report.report_id],
            merge_review_state=MergeReviewState.SEPARATE
        )

        self._incidents[inc_id] = inc
        self._report_to_incident[report.report_id] = inc_id
        return inc

    def _merge_into_incident(
        self,
        incident: Incident,
        report: RawReport,
        merge_state: MergeReviewState
    ) -> Incident:
        """Merge raw report into existing incident while preserving all source reports."""
        if report.report_id not in incident.constituent_report_ids:
            incident.constituent_report_ids.append(report.report_id)

        self._report_to_incident[report.report_id] = incident.incident_id

        # Update evidence summary
        incident.evidence_summary.append(report.raw_text)

        # Merge extracted insights
        if report.extracted_data:
            ext = report.extracted_data
            if ext.victim_count is not None and ext.victim_count > 0:
                current_min = min(incident.victim_estimate.min_victims, ext.victim_count) if incident.victim_estimate.min_victims > 0 else ext.victim_count
                current_max = max(incident.victim_estimate.max_victims, ext.victim_count)
                avg_guess = int((current_min + current_max) / 2)
                incident.victim_estimate = VictimEstimate(
                    min_victims=current_min,
                    max_victims=current_max,
                    best_guess=avg_guess
                )

            for v in ext.vulnerable_present:
                if v not in incident.vulnerability_tags:
                    incident.vulnerability_tags.append(v)

            if incident.micro_environment == MicroEnvironmentTag.NONE and ext.micro_environment_tag != MicroEnvironmentTag.NONE:
                incident.micro_environment = ext.micro_environment_tag

        # Update cluster severity score using log-damped formula
        constituent_reports = [self._raw_reports[r_id] for r_id in incident.constituent_report_ids if r_id in self._raw_reports]
        incident.priority_score = SeverityCalculator.compute_cluster_severity(constituent_reports)
        incident.merge_review_state = merge_state
        incident.updated_at = datetime.now(timezone.utc)
        return incident

    def split_incident(self, incident_id: str) -> List[Incident]:
        """
        Reverses a merge operation: splits a multi-report incident cluster
        back into individual single-report incidents without losing any raw evidence.
        """
        target = self._incidents.pop(incident_id, None)
        if not target:
            return []

        created_incidents = []
        for r_id in target.constituent_report_ids:
            raw_rep = self._raw_reports.get(r_id)
            if raw_rep:
                new_inc = self._create_incident_from_report(raw_rep)
                created_incidents.append(new_inc)

        return created_incidents

    def list_incidents(self) -> List[Incident]:
        """Returns all active clustered incidents."""
        return list(self._incidents.values())

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        """Returns incident by ID."""
        return self._incidents.get(incident_id)

    def add_incident(self, incident: Incident) -> Incident:
        """Adds or updates an incident in the cluster store."""
        self._incidents[incident.incident_id] = incident
        return incident

    def reset(self):
        """Clears all in-memory incidents and reports for simulation reset."""
        self._incidents.clear()
        self._report_to_incident.clear()
        self._raw_reports.clear()

clustering_engine = ClusteringEngine()
cluster_engine = clustering_engine
