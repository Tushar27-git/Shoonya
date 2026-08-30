import math
from typing import Dict, Any

class PriorityEngine:
    def __init__(
        self,
        w_severity: float = 0.35,
        w_vulnerability: float = 0.25,
        w_victims: float = 0.20,
        w_recency: float = 0.10,
        w_accessibility: float = 0.10,
        c_min: float = 0.40
    ):
        self.w1 = w_severity
        self.w2 = w_vulnerability
        self.w3 = w_victims
        self.w4 = w_recency
        self.w5 = w_accessibility
        self.c_min = c_min

    def compute_base_urgency(
        self,
        severity: float,
        vulnerability: float,
        victim_count: int,
        recency: float,
        accessibility_risk: float
    ) -> float:
        v_log = math.log10(victim_count + 1)
        return (
            (self.w1 * severity)
            + (self.w2 * vulnerability)
            + (self.w3 * v_log)
            + (self.w4 * recency)
            + (self.w5 * accessibility_risk)
        )

    def confidence_modifier(self, confidence: float) -> float:
        return self.c_min + (1.0 - self.c_min) * confidence

    def compute_priority(
        self,
        severity: float,
        vulnerability: float,
        victim_count: int,
        recency: float,
        accessibility_risk: float,
        confidence: float
    ) -> float:
        u_i = self.compute_base_urgency(severity, vulnerability, victim_count, recency, accessibility_risk)
        m_ci = self.confidence_modifier(confidence)
        return round(u_i * m_ci, 4)

    def explain_priority(
        self,
        severity: float,
        victim_count: int,
        vulnerability: float,
        accessibility_risk: float,
        independent_source_count: int,
        confidence: float,
        priority: float
    ) -> str:
        return (
            f"Assigned priority {priority} because: "
            f"Severity evaluated at {severity}, with {victim_count} potential victims "
            f"and vulnerability factor {vulnerability}. Road/Accessibility risk is {accessibility_risk}. "
            f"Confirmed by {independent_source_count} independent sources (raw confidence {confidence} floored to {self.c_min})."
        )

    def rank_incidents(self, incidents: list, override_weights: dict = None) -> list:
        # Use override weights if provided
        old_w1, old_w2, old_w3, old_w4, old_w5 = self.w1, self.w2, self.w3, self.w4, self.w5
        if override_weights:
            self.w1 = override_weights.get("w1", self.w1)
            self.w2 = override_weights.get("w2", self.w2)
            self.w3 = override_weights.get("w3", self.w3)
            self.w4 = override_weights.get("w4", self.w4)
            self.w5 = override_weights.get("w5", self.w5)

        for inc in incidents:
            # We assume incident is a dict or object. Let's handle dict for simplicity in ranking tests
            if isinstance(inc, dict):
                sev = inc.get("severity", 0.0)
                vuln = inc.get("vulnerability", 0.0)
                vic = inc.get("victim_count", 0)
                rec = inc.get("recency", 0.0)
                acc = inc.get("accessibility_risk", 0.0)
                conf = inc.get("confidence", 0.0)
                indep_sources = inc.get("independent_source_count", 1)
                
                pri = self.compute_priority(sev, vuln, vic, rec, acc, conf)
                inc["priority_score"] = pri
                inc["priority_reason"] = self.explain_priority(sev, vic, vuln, acc, indep_sources, conf, pri)
            else:
                # Handle Incident object
                sev = inc.severity
                vuln = inc.vulnerability
                vic = inc.victim_estimate.value if getattr(inc, "victim_estimate", None) else 0
                rec = inc.recency
                acc = inc.accessibility_risk
                conf = inc.confidence_score
                indep_sources = len(inc.evidence)
                
                pri = self.compute_priority(sev, vuln, vic, rec, acc, conf)
                inc.priority_score = pri
                inc.priority_reason = self.explain_priority(sev, vic, vuln, acc, indep_sources, conf, pri)

        # Restore old weights
        self.w1, self.w2, self.w3, self.w4, self.w5 = old_w1, old_w2, old_w3, old_w4, old_w5

        if incidents and isinstance(incidents[0], dict):
            return sorted(incidents, key=lambda x: x["priority_score"], reverse=True)
        return sorted(incidents, key=lambda x: x.priority_score, reverse=True)

priority_engine = PriorityEngine()
