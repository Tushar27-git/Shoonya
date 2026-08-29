import math
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from ..models.domain import Incident, PriorityFactors
from ..models.enums import VulnerabilityTag, MicroEnvironmentTag, HazardType
from ..config import settings

class PriorityEngine:
    """
    Implements the load-bearing SHOONYA Priority System:
    1. Base Urgency: U_i = w1*S_i + w2*V_i + w3*log(1+N_i) + w4*R_i + w5*A_i
    2. Confidence Modifier: M(c_i) = c_min + (1 - c_min)*c_i (with c_min = 0.4)
    3. Final Priority: P_i = U_i * M(c_i)
    """
    @staticmethod
    def compute_severity_term(incident: Incident) -> float:
        """S_i: Severity factor [0.0, 1.0]."""
        score = 0.4

        if incident.category == HazardType.BUILDING_COLLAPSE:
            score += 0.35
        elif incident.category == HazardType.BRIDGE_FAILURE:
            score += 0.30
        elif incident.category == HazardType.FLOOD:
            score += 0.20

        if incident.micro_environment == MicroEnvironmentTag.CRUSH_INJURY:
            score += 0.35
        elif incident.micro_environment == MicroEnvironmentTag.DROWNING_RISK:
            score += 0.30
        elif incident.micro_environment == MicroEnvironmentTag.ROOFTOP_STRANDED:
            score += 0.20
        elif incident.micro_environment == MicroEnvironmentTag.DEBRIS_TRAPPED:
            score += 0.25

        return min(1.0, score)

    @staticmethod
    def compute_vulnerability_term(incident: Incident) -> float:
        """V_i: Vulnerability factor [0.0, 1.0]."""
        if not incident.vulnerability_tags:
            return 0.0

        score = 0.0
        for tag in incident.vulnerability_tags:
            if tag in [VulnerabilityTag.CHILDREN, VulnerabilityTag.PREGNANT]:
                score += 0.40
            elif tag in [VulnerabilityTag.INJURED, VulnerabilityTag.DISABLED]:
                score += 0.35
            elif tag == VulnerabilityTag.ELDERLY:
                score += 0.25

        return min(1.0, score)

    @staticmethod
    def compute_victim_count_term(incident: Incident) -> float:
        """log(1 + N_i) victim count term."""
        n_i = incident.victim_estimate.best_guess or incident.victim_estimate.max_victims or 0
        return math.log(1.0 + float(n_i))

    @staticmethod
    def compute_recency_term(incident: Incident, current_time: Optional[datetime] = None) -> float:
        """R_i: Recency factor [0.0, 1.0]."""
        now = current_time or datetime.now(timezone.utc)
        age_minutes = max(0.0, (now - incident.updated_at).total_seconds() / 60.0)

        if age_minutes <= 15.0:
            return 1.0
        elif age_minutes <= 60.0:
            return 0.75
        elif age_minutes <= 180.0:
            return 0.45
        else:
            return 0.20

    @staticmethod
    def compute_accessibility_risk_term(incident: Incident) -> float:
        """A_i: Accessibility risk factor [0.0, 1.0]."""
        if incident.micro_environment == MicroEnvironmentTag.CUT_OFF_ACCESS:
            return 0.90
        elif incident.micro_environment == MicroEnvironmentTag.ROOFTOP_STRANDED:
            return 0.75
        else:
            return 0.40

    @staticmethod
    def compute_confidence_modifier(confidence_score: float, c_min: Optional[float] = None) -> float:
        """
        M(c_i) = c_min + (1 - c_min) * c_i
        Invariant: At c_i = 0, M(0) = c_min = 0.4.
        """
        c_floor = c_min if c_min is not None else settings.CONFIDENCE_MIN_FLOOR
        clamped_c = max(0.0, min(1.0, confidence_score))
        modifier = c_floor + ((1.0 - c_floor) * clamped_c)
        return round(modifier, 4)

    @staticmethod
    def evaluate_incident_priority(
        incident: Incident,
        override_weights: Optional[Dict[str, float]] = None,
        current_time: Optional[datetime] = None
    ) -> Incident:
        now = current_time or datetime.now(timezone.utc)
        weights = override_weights or {}

        w1 = weights.get("w1", settings.WEIGHT_SEVERITY)
        w2 = weights.get("w2", settings.WEIGHT_VULNERABILITY)
        w3 = weights.get("w3", settings.WEIGHT_VICTIM_COUNT)
        w4 = weights.get("w4", settings.WEIGHT_RECENCY)
        w5 = weights.get("w5", settings.WEIGHT_ACCESSIBILITY)

        s_i = PriorityEngine.compute_severity_term(incident)
        v_i = PriorityEngine.compute_vulnerability_term(incident)
        n_term = PriorityEngine.compute_victim_count_term(incident)
        r_i = PriorityEngine.compute_recency_term(incident, now)
        a_i = PriorityEngine.compute_accessibility_risk_term(incident)

        # Base Urgency: U_i = w1*S_i + w2*V_i + w3*log(1+N_i) + w4*R_i + w5*A_i
        base_urgency = (w1 * s_i) + (w2 * v_i) + (w3 * n_term) + (w4 * r_i) + (w5 * a_i)

        # Confidence Modifier: M(c_i) = c_min + (1 - c_min)*c_i
        m_c = PriorityEngine.compute_confidence_modifier(incident.confidence_score)

        # Final Priority: P_i = U_i * M(c_i)
        final_priority = base_urgency * m_c

        incident.urgency_score = round(base_urgency, 4)
        incident.priority_score = round(final_priority, 4)
        incident.confidence_floor = settings.CONFIDENCE_MIN_FLOOR
        incident.priority_factors = PriorityFactors(
            severity_score=round(s_i, 3),
            vulnerability_score=round(v_i, 3),
            victim_count_term=round(n_term, 3),
            recency_score=round(r_i, 3),
            accessibility_risk_score=round(a_i, 3),
            base_urgency=round(base_urgency, 4),
            confidence_modifier=round(m_c, 4),
            final_priority=round(final_priority, 4)
        )
        incident.updated_at = now
        return incident

    @staticmethod
    def rank_incidents(
        incidents: List[Incident],
        override_weights: Optional[Dict[str, float]] = None,
        current_time: Optional[datetime] = None
    ) -> List[Incident]:
        """Evaluates and ranks all incidents in descending order of final priority."""
        evaluated = [
            PriorityEngine.evaluate_incident_priority(inc, override_weights, current_time)
            for inc in incidents
        ]
        return sorted(evaluated, key=lambda x: x.priority_score, reverse=True)

    @staticmethod

    def compute_base_urgency(s_i: float, v_i: float, n_victims: int, r_i: float, a_i: float) -> float:
        w1 = settings.WEIGHT_SEVERITY
        w2 = settings.WEIGHT_VULNERABILITY
        w3 = settings.WEIGHT_VICTIM_COUNT
        w4 = settings.WEIGHT_RECENCY
        w5 = settings.WEIGHT_ACCESSIBILITY
        n_term = math.log(1.0 + float(n_victims))
        return (w1 * s_i) + (w2 * v_i) + (w3 * n_term) + (w4 * r_i) + (w5 * a_i)

priority_engine = PriorityEngine()
PriorityCalculator = PriorityEngine

