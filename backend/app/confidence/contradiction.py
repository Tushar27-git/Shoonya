import re
import uuid
from typing import List, Tuple
from datetime import datetime, timezone
from ..models.domain import RawReport, DisputeRecord
from ..models.enums import SourceChannel

class ContradictionDetector:
    """
    Detects material conflicts and disputes among constituent reports.
    Adheres strictly to the guardrail: Contradictions are evidence, not noise;
    never average conflicting claims into a single fabricated number.
    """
    @staticmethod
    def detect_disputes(incident_id: str, reports: List[RawReport]) -> Tuple[List[DisputeRecord], float]:
        """
        Scans reports in an incident cluster for conflicting claims.
        Returns (dispute_records, contradiction_penalty_K_i).
        """
        if len(reports) < 2:
            return [], 0.0

        disputes: List[DisputeRecord] = []
        total_penalty = 0.0

        # 1. Check victim count contradiction
        extracted_counts = []
        for r in reports:
            if r.extracted_data and r.extracted_data.victim_count is not None:
                extracted_counts.append((r, r.extracted_data.victim_count))
            else:
                m = re.search(r"\b(\d+)\s*(?:people|victims|casualties|bachhe|log|trapped)\b", r.raw_text.lower())
                if m:
                    extracted_counts.append((r, int(m.group(1))))

        if len(extracted_counts) >= 2:
            min_entry = min(extracted_counts, key=lambda x: x[1])
            max_entry = max(extracted_counts, key=lambda x: x[1])

            # Material discrepancy if max >= 1.8 * min and difference >= 3 (or min == 0 and max >= 3)
            is_discrepancy = False
            if min_entry[1] == 0 and max_entry[1] >= 3:
                is_discrepancy = True
            elif min_entry[1] > 0 and max_entry[1] >= (1.8 * min_entry[1]) and (max_entry[1] - min_entry[1]) >= 3:
                is_discrepancy = True

            if is_discrepancy:
                disp = DisputeRecord(
                    contradiction_id=f"DISP-VIC-{uuid.uuid4().hex[:6].upper()}",
                    incident_id=incident_id,
                    field_disputed="VICTIM_COUNT",
                    claim_a_text=f"Reported {min_entry[1]} victims: '{min_entry[0].raw_text}'",
                    claim_a_source=min_entry[0].source_channel,
                    claim_a_time=min_entry[0].timestamp,
                    claim_b_text=f"Reported {max_entry[1]} victims: '{max_entry[0].raw_text}'",
                    claim_b_source=max_entry[0].source_channel,
                    claim_b_time=max_entry[0].timestamp,
                    materiality=0.75,
                    resolved=False,
                )
                disputes.append(disp)
                total_penalty += 0.40

        # 2. Check accessibility / road open vs blocked contradiction
        open_claims = [r for r in reports if re.search(r"\b(?:road\s+open|accessible|safe|cars\s+passing|safe\s+rasta)\b", r.raw_text.lower())]
        blocked_claims = [r for r in reports if re.search(r"\b(?:road\s+blocked|cut\s*off|impassable|rasta\s*band|submerged\s+road)\b", r.raw_text.lower())]

        if open_claims and blocked_claims:
            disp = DisputeRecord(
                contradiction_id=f"DISP-ACC-{uuid.uuid4().hex[:6].upper()}",
                incident_id=incident_id,
                field_disputed="ROAD_ACCESSIBILITY",
                claim_a_text=f"Claimed open: '{open_claims[0].raw_text}'",
                claim_a_source=open_claims[0].source_channel,
                claim_a_time=open_claims[0].timestamp,
                claim_b_text=f"Claimed blocked: '{blocked_claims[0].raw_text}'",
                claim_b_source=blocked_claims[0].source_channel,
                claim_b_time=blocked_claims[0].timestamp,
                materiality=0.65,
                resolved=False,
            )
            disputes.append(disp)
            total_penalty += 0.35

        # 3. Check severity conflict (safe building vs severe flood/collapse)
        safe_claims = [r for r in reports if re.search(r"\b(?:safe|no\s+water|minor\s+water|school\s+safe|building\s+intact|0\s+casualties)\b", r.raw_text.lower())]
        danger_claims = [r for r in reports if re.search(r"\b(?:2nd\s*floor|collapsed|drowning|deep\s+water|heavy\s+flood|trapped)\b", r.raw_text.lower())]


        if safe_claims and danger_claims:
            disp = DisputeRecord(
                contradiction_id=f"DISP-SEV-{uuid.uuid4().hex[:6].upper()}",
                incident_id=incident_id,
                field_disputed="SEVERITY_LEVEL",
                claim_a_text=f"Claimed safe/minor: '{safe_claims[0].raw_text}'",
                claim_a_source=safe_claims[0].source_channel,
                claim_a_time=safe_claims[0].timestamp,
                claim_b_text=f"Claimed severe: '{danger_claims[0].raw_text}'",
                claim_b_source=danger_claims[0].source_channel,
                claim_b_time=danger_claims[0].timestamp,
                materiality=0.80,
                resolved=False,
            )
            disputes.append(disp)
            total_penalty += 0.45

        # Cap penalty at 1.0
        capped_penalty = min(1.0, total_penalty)
        return disputes, capped_penalty

detector = ContradictionDetector()
