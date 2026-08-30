from typing import Dict, Any, List, Optional, Tuple

class ConfidenceEngine:
    def __init__(
        self,
        baseline: float = 0.2,
        w_source: float = 0.40,
        w_geo: float = 0.15,
        w_temporal: float = 0.15,
        w_visual: float = 0.20,
        w_contradiction: float = 0.35,
    ):
        self.b = baseline
        self.ws = w_source
        self.wg = w_geo
        self.wt = w_temporal
        self.wv = w_visual
        self.wc = w_contradiction

    def calculate_confidence(
        self,
        independent_sources: int,
        supporting_reports: int,
        geo_consistency: float = 1.0,
        temporal_recency: float = 1.0,
        visual_verified: bool = False,
        contradiction_penalty: float = 0.0,
    ) -> float:
        source_score = min(1.0, (independent_sources * 0.25) + (supporting_reports * 0.005))
        visual_score = 1.0 if visual_verified else 0.0

        raw_c = (
            self.b
            + (self.ws * source_score)
            + (self.wg * geo_consistency)
            + (self.wt * temporal_recency)
            + (self.wv * visual_score)
            - (self.wc * contradiction_penalty)
        )
        return max(0.0, min(1.0, raw_c))

class DisputeDetector:
    @staticmethod
    def evaluate_reports(reports: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
        if len(reports) < 2:
            return False, []

        victim_counts = [r.get("victims", 0) for r in reports if "victims" in r]
        claims = [r.get("raw_text", "") for r in reports if "raw_text" in r]

        if victim_counts and len(victim_counts) >= 2:
            v_min = min(victim_counts)
            v_max = max(victim_counts)
            if v_min > 0 and (v_max / v_min) > 2.0:
                return True, claims

        hazards = set(r.get("category") for r in reports if "category" in r)
        if len(hazards) > 1 and None not in hazards:
            return True, claims

        return False, claims

class DarkZoneEngine:
    @staticmethod
    def evaluate_silence_risk(
        population_density: float,
        telecom_status: str,
        hours_since_last_report: float,
        report_count: int,
        hazard_exposure_factor: float = 1.0
    ) -> Tuple[bool, str, float]:
        is_telecom_down = 1.0 if telecom_status == "DARK" else 0.1
        silence_risk = (population_density / 1000.0) * is_telecom_down * hours_since_last_report * hazard_exposure_factor

        if silence_risk > 15.0 and report_count == 0:
            return True, "NO DATA - UNKNOWN STATUS", silence_risk
        return False, "MONITORED", silence_risk

class CoverageVsTrustMatrix:
    @staticmethod
    def compute_zone_metrics(
        total_reports: int,
        independent_sources: int,
        disputed_count: int
    ) -> Dict[str, Any]:
        coverage_score = min(1.0, total_reports / 20.0)
        
        if total_reports == 0:
            return {"coverage": 0.0, "trust": 0.0, "quadrant": "SILENT_AND_UNINVESTIGATED"}

        dispute_ratio = disputed_count / total_reports
        source_independence_ratio = independent_sources / total_reports
        trust_score = max(0.0, min(1.0, source_independence_ratio - (0.5 * dispute_ratio)))

        if total_reports <= 1:
            quadrant = "SILENT_AND_UNINVESTIGATED"
        elif coverage_score >= 0.5 and trust_score >= 0.5:
            quadrant = "WELL_COVERED_AND_TRUSTED"
        elif coverage_score >= 0.5 and trust_score < 0.5:
            quadrant = "NOISY_AND_UNVERIFIED"
        elif coverage_score < 0.5 and trust_score >= 0.5:
            quadrant = "SPARSE_BUT_CREDIBLE"
        else:
            quadrant = "SILENT_AND_UNINVESTIGATED"

        return {
            "coverage": round(coverage_score, 2),
            "trust": round(trust_score, 2),
            "quadrant": quadrant
        }
