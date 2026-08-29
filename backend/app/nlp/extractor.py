import re
from typing import Optional, List, Tuple
from ..models.enums import (
    LocationPrecision,
    MicroEnvironmentTag,
    VulnerabilityTag,
    HazardType,
)
from ..models.domain import ExtractionResult
from ..ingestion.processor import LocationResolver
from .patterns import (
    NUMBER_WORDS,
    VULNERABILITY_PATTERNS,
    MICRO_ENVIRONMENT_PATTERNS,
    HAZARD_PATTERNS,
)

class NLPExtractor:
    """
    Multilingual structured extractor for disaster observations.
    Extracts locations, victim estimates, vulnerability flags, micro-environment tags,
    and life-threat urgency while strictly avoiding manufactured certainty.
    """
    @staticmethod
    def extract(raw_text: str, location_hint: Optional[str] = None) -> ExtractionResult:
        text_lower = raw_text.lower()

        # 1. Location extraction
        loc_info, _ = LocationResolver.resolve(
            raw_text=raw_text,
            location_text=location_hint
        )

        # 2. Victim count extraction
        victim_count = NLPExtractor._extract_victim_count(raw_text, text_lower)

        # 3. Vulnerability tags
        vulnerable_tags = NLPExtractor._extract_vulnerabilities(text_lower, raw_text)

        # 4. Micro-environment tag (PS5 <-> PS2 bridge)
        micro_env = NLPExtractor._extract_micro_environment(text_lower, raw_text)

        # 5. Hazard type
        hazard_type = NLPExtractor._extract_hazard_type(text_lower, raw_text)

        # 6. Urgency score calculation
        urgency = NLPExtractor._calculate_urgency(
            text_lower=text_lower,
            hazard_type=hazard_type,
            micro_env=micro_env,
            vulnerabilities=vulnerable_tags,
            victim_count=victim_count
        )

        return ExtractionResult(
            location_text=loc_info.address,
            resolved_lat=loc_info.lat,
            resolved_lng=loc_info.lng,
            location_precision=loc_info.precision,
            victim_count=victim_count,
            vulnerable_present=vulnerable_tags,
            hazard_type=hazard_type,
            urgency_raw=round(urgency, 2),
            micro_environment_tag=micro_env,
            raw_evidence_text=raw_text
        )

    @staticmethod
    def _extract_victim_count(raw_text: str, text_lower: str) -> Optional[int]:
        """
        Extract explicit or word-based victim counts.
        Carefully strips ordinals, ward numbers, floors, and time stamps.
        """
        # Clean text for number parsing by removing non-victim numeric artifacts
        cleaned = text_lower
        # Strip ward mentions: "ward 07", "ward 7", "ward #4"
        cleaned = re.sub(r"\bward\s*#?\d+\b", "", cleaned)
        # Strip floor ordinals: "2nd floor", "3rd floor", "1st floor", "floor 2"
        cleaned = re.sub(r"\b\d+(?:st|nd|rd|th)\s*(?:floor|manzil)?\b", "", cleaned)
        cleaned = re.sub(r"\bfloor\s*\d+\b", "", cleaned)
        # Strip timestamps: "06:14", "10:30am"
        cleaned = re.sub(r"\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b", "", cleaned)

        # 1. Look for explicit count + victim noun
        # e.g. "8 children", "10 people", "6 students", "4 trapped", "10 log"
        explicit_patterns = [
            r"(\d{1,3})\s*(?:people|persons?|victims?|children|kids?|students?|log|bachche|citizens?|buzurg|elderly|fase|fasi|trapped|dabe)\b",
            r"(?:trapped|fase|rescued|stranded)\s*(\d{1,3})\b",
            r"(\d{1,3})\s*(?:log|people|persons?)\b"
        ]
        for pat in explicit_patterns:
            m = re.search(pat, cleaned)
            if m:
                try:
                    num = int(m.group(1))
                    if 1 <= num <= 500:
                        return num
                except ValueError:
                    pass

        # 2. General standalone digit match in cleaned text
        digit_match = re.search(r"\b(\d{1,3})\b", cleaned)
        if digit_match:
            try:
                num = int(digit_match.group(1))
                if 1 <= num <= 500:
                    return num
            except ValueError:
                pass

        # 3. Word-based number search across multilingual dictionary
        for word, val in NUMBER_WORDS.items():
            pattern = rf"\b{re.escape(word)}\s*(?:log|people|bachche|victims?|fase|trapped)?\b"
            if re.search(pattern, cleaned):
                return val

        # 4. Indefinite words ("several", "many", "family")
        if any(w in text_lower for w in ["several", "many", "family", "group", "parivar", "bahut log"]):
            return 4

        return None

    @staticmethod
    def _extract_vulnerabilities(text_lower: str, raw_text: str) -> List[VulnerabilityTag]:
        tags = []
        for tag, patterns in VULNERABILITY_PATTERNS:
            for pat in patterns:
                # Check both lowercase and raw text for Unicode/Devanagari
                if re.search(pat, text_lower) or re.search(pat, raw_text):
                    if tag not in tags:
                        tags.append(tag)
                    break
        return tags

    @staticmethod
    def _extract_micro_environment(text_lower: str, raw_text: str) -> MicroEnvironmentTag:
        for tag, patterns in MICRO_ENVIRONMENT_PATTERNS:
            for pat in patterns:
                if re.search(pat, text_lower) or re.search(pat, raw_text):
                    return tag
        return MicroEnvironmentTag.NONE

    @staticmethod
    def _extract_hazard_type(text_lower: str, raw_text: str) -> HazardType:
        # Check specific hazards first before general flood
        for hazard, patterns in HAZARD_PATTERNS:
            for pat in patterns:
                if re.search(pat, text_lower) or re.search(pat, raw_text):
                    return hazard
        return HazardType.FLOOD

    @staticmethod
    def _calculate_urgency(
        text_lower: str,
        hazard_type: HazardType,
        micro_env: MicroEnvironmentTag,
        vulnerabilities: List[VulnerabilityTag],
        victim_count: Optional[int]
    ) -> float:
        score = 0.4 # Baseline

        if hazard_type in [HazardType.BUILDING_COLLAPSE, HazardType.BRIDGE_FAILURE]:
            score += 0.35
        elif hazard_type == HazardType.FLOOD:
            score += 0.2

        if micro_env in [MicroEnvironmentTag.DROWNING_RISK, MicroEnvironmentTag.CRUSH_INJURY]:
            score += 0.35
        elif micro_env in [MicroEnvironmentTag.ROOFTOP_STRANDED, MicroEnvironmentTag.DEBRIS_TRAPPED]:
            score += 0.25
        elif micro_env == MicroEnvironmentTag.CUT_OFF_ACCESS:
            score += 0.15

        if VulnerabilityTag.CHILDREN in vulnerabilities or VulnerabilityTag.PREGNANT in vulnerabilities:
            score += 0.15
        if VulnerabilityTag.INJURED in vulnerabilities:
            score += 0.15

        if any(w in text_lower for w in ["immediately", "please help", "urgent", "bachao", "emergency", "fast", "critical"]):
            score += 0.1

        return min(max(score, 0.0), 1.0)

extractor = NLPExtractor()
