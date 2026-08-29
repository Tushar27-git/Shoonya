from typing import List, Optional
from datetime import datetime, timezone
from ..models.domain import Incident, RawReport, ConfidenceFactors
from ..config import settings
from .factors import FactorEvaluator
from .contradiction import ContradictionDetector

class ConfidenceEngine:
    """
    Implements the load-bearing Bounded Confidence Formula:
    C_i = clip(b + w_s*S_i + w_g*G_i + w_t*T_i + w_v*V_i - w_c*K_i, 0, 1)
    """
    @staticmethod
    def evaluate_incident_confidence(
        incident: Incident,
        reports: List[RawReport],
        current_time: Optional[datetime] = None
    ) -> Incident:
        now = current_time or datetime.now(timezone.utc)

        # 1. Evaluate evidence factors
        s_i = FactorEvaluator.evaluate_source_corroboration(reports)
        g_i = FactorEvaluator.evaluate_geospatial_consistency(incident.location, reports)
        t_i = FactorEvaluator.evaluate_temporal_recency(reports, now)
        v_i = FactorEvaluator.evaluate_visual_evidence(incident.visual_evidence)

        # 2. Detect contradictions
        text_disputes, k_i = ContradictionDetector.detect_disputes(incident.incident_id, reports)
        
        # Merge existing disputes (e.g. visual/sensor disputes) with newly found text disputes
        all_disputes = list(incident.disputes)
        for td in text_disputes:
            if not any(d.contradiction_id == td.contradiction_id for d in all_disputes):
                all_disputes.append(td)

        # Apply visual contradiction penalty if visual dispute present
        if any(d.field_disputed == "VISUAL_FLOOD_ABSENCE" for d in all_disputes):
            k_i = min(1.0, k_i + 0.45)

        incident.disputes = all_disputes
        incident.dispute_flag = len(all_disputes) > 0


        # 3. Apply formula weights from runtime settings
        b = settings.CONF_BASELINE_PRIOR
        w_s = settings.CONF_WEIGHT_SOURCE
        w_g = settings.CONF_WEIGHT_GEO
        w_t = settings.CONF_WEIGHT_TEMPORAL
        w_v = settings.CONF_WEIGHT_VISUAL
        w_c = settings.CONF_WEIGHT_CONTRADICTION

        # If visual evidence is not yet available, visual term contributes 0 without penalizing
        v_term = (w_v * v_i) if v_i is not None else 0.0

        raw_conf = (
            b
            + (w_s * s_i)
            + (w_g * g_i)
            + (w_t * t_i)
            + v_term
            - (w_c * k_i)
        )

        # Load-bearing clipping invariant [0.0, 1.0]
        final_conf = max(0.0, min(1.0, raw_conf))

        incident.confidence_factors = ConfidenceFactors(
            source_corroboration=round(s_i, 3),
            geospatial_consistency=round(g_i, 3),
            temporal_consistency=round(t_i, 3),
            visual_evidence=round(v_i, 3) if v_i is not None else None,
            contradiction_penalty=round(k_i, 3),
            baseline_prior=b,
            score=round(final_conf, 3)
        )
        incident.confidence_score = round(final_conf, 3)
        incident.updated_at = now
        return incident

confidence_engine = ConfidenceEngine()
