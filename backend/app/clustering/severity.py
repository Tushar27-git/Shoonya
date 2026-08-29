import math
from typing import List, Dict
from ..models.domain import RawReport
from ..models.enums import SourceChannel

# Channel weight mapping reflecting source reliability
CHANNEL_WEIGHTS: Dict[SourceChannel, float] = {
    SourceChannel.RADIO: 1.0,
    SourceChannel.SATELLITE: 1.0,
    SourceChannel.DRONE: 0.9,
    SourceChannel.VOICE: 0.8,
    SourceChannel.SMS: 0.8,
    SourceChannel.WEB: 0.7,
    SourceChannel.SOCIAL: 0.5,
}

class SeverityCalculator:
    """
    Implements the load-bearing cluster severity formula:
    Cluster Severity Score = sum(Report Weight) * log10(Report Count + 1)
    """
    @staticmethod
    def compute_cluster_severity(reports: List[RawReport]) -> float:
        if not reports:
            return 0.0

        # Sum of report weights based on channel and source trust
        total_weight = 0.0
        for r in reports:
            base_w = CHANNEL_WEIGHTS.get(r.source_channel, 0.7)
            # Modulate by source trust score if present
            trust_factor = 0.5 + (0.5 * r.trust_score)
            total_weight += (base_w * trust_factor)

        # Mandatory log10 dampening factor
        report_count = len(reports)
        log_dampening = math.log10(report_count + 1.0)

        severity_score = total_weight * log_dampening
        return round(severity_score, 4)

calculator = SeverityCalculator()
