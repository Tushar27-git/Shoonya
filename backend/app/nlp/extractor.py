import re
from typing import Dict, Any, List, Optional, Tuple
from app.models.enums import HazardType, MicroEnvironmentTag, SignalType

# Numeric word mapping for Hindi & English
NUMBER_WORDS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "ek": 1, "do": 2, "teen": 3, "char": 4, "paanch": 5, "chhe": 6, "saat": 7, "aath": 8, "nau": 9, "das": 10,
    "१": 1, "२": 2, "३": 3, "४": 4, "५": 5, "६": 6, "७": 7, "८": 8, "९": 9, "१०": 10
}

VULNERABILITY_PATTERNS = {
    "pregnant": [r"pregnant", r"garbhavati", r"garbhwati"],
    "infant_child": [r"child", r"children", r"kid", r"kids", r"bachha", r"bacche", r"shishu"],
    "elderly": [r"elderly", r"old person", r"bujurg", r"buddhe", r"senior"],
    "injured": [r"injured", r"ghayal", r"chot", r"bleeding", r"fracture"],
    "disabled": [r"disabled", r"handicapped", r"divyang"]
}

MICRO_ENV_PATTERNS = {
    MicroEnvironmentTag.ROOFTOP_STRANDED: [r"roof", r"rooftop", r"chhat", r"terrace", r"top floor", r"second floor"],
    MicroEnvironmentTag.DROWNING_RISK: [r"drowning", r"paani gale tak", r"paani sar ke upar", r"washed away", r"current fast"],
    MicroEnvironmentTag.DEBRIS_TRAPPED: [r"debris", r"malba", r"trapped under", r"dab gaye", r"wall collapsed", r"building collapse"],
    MicroEnvironmentTag.CRUSH_INJURY: [r"crush", r"daba hua", r"heavy weight", r"broken pillar"],
    MicroEnvironmentTag.ELECTRICAL_HAZARD: [r"insulin", r"cold chain", r"generator down", r"generator band", r"medicine spoil", r"power cut in camp"],
    MicroEnvironmentTag.NONE: [r"dirty water", r"ganda paani", r"contamination", r"diarrhea", r"vomiting", r"loose motion"]
}

WEAK_SIGNAL_PATTERNS = {
    SignalType.TREMOR_FELT: [r"tremor", r"jhatka", r"vibration", r"earthquake shaking", r"dharti hili"],
    SignalType.CRACK_OBSERVED: [r"crack", r"darar", r"fissure", r"wall gap", r"breach leak"],
    SignalType.WATER_LEVEL_RISING: [r"water rising fast", r"paani achanak badha", r"river level up", r"discharge surge"],
    SignalType.UNUSUAL_SOUND: [r"rumbling", r"strange noise", r"loud sound from dam", r"creaking bridge"]
}

def extract_victim_bounds(text: str) -> Tuple[int, int, int]:
    """Extracts value, range_low, range_high from text preserving uncertainty."""
    lower = text.lower()
    
    # 1. Check direct digits
    digit_match = re.search(r"\b(\d+)\s*(log|people|persons|victims|members|vyakti)?\b", lower)
    if digit_match:
        val = int(digit_match.group(1))
        return val, max(1, val - 1), val + 2

    # 2. Check text number words
    for word, val in NUMBER_WORDS.items():
        if re.search(rf"\b{word}\s*(log|people|persons|members|vyakti)?\b", lower):
            return val, max(1, val - 1), val + 2

    # 3. Vague count ("kuch log", "several people", "family")
    if any(k in lower for k in ["kuch log", "few people", "several", "family", "parivar"]):
        return 4, 2, 8

    return 0, 0, 0

def extract_vulnerabilities(text: str) -> List[str]:
    lower = text.lower()
    vulns = []
    for vuln, patterns in VULNERABILITY_PATTERNS.items():
        if any(re.search(p, lower) for p in patterns):
            vulns.append(vuln)
    return vulns

def extract_micro_environment(text: str) -> Optional[MicroEnvironmentTag]:
    lower = text.lower()
    for env_tag, patterns in MICRO_ENV_PATTERNS.items():
        if any(re.search(p, lower) for p in patterns):
            return env_tag
    return None

def check_weak_signal(text: str) -> Optional[SignalType]:
    lower = text.lower()
    for sig_type, patterns in WEAK_SIGNAL_PATTERNS.items():
        if any(re.search(p, lower) for p in patterns):
            return sig_type
    return None

def parse_report_text(raw_text: str) -> Dict[str, Any]:
    """
    Main extraction parser returning structured fields without altering raw text.
    Handles PS1 weak signals, PS2 micro-environments, and PS4 shelter utilities.
    """
    val, r_low, r_high = extract_victim_bounds(raw_text)
    vulnerabilities = extract_vulnerabilities(raw_text)
    micro_env = extract_micro_environment(raw_text)
    weak_sig = check_weak_signal(raw_text)
    
    lower = raw_text.lower()
    
    # Category detection
    if micro_env in [MicroEnvironmentTag.SHELTER_MEDICAL_RISK, MicroEnvironmentTag.WATER_CONTAMINATION] or "relief camp" in lower or "shelter" in lower:
        category = HazardType.OTHER
    elif micro_env in [MicroEnvironmentTag.DEBRIS_TRAPPED, MicroEnvironmentTag.CRUSH_INJURY] or "malba" in lower or "collapse" in lower:
        category = HazardType.BUILDING_COLLAPSE
    elif "bridge" in lower or "road" in lower:
        category = HazardType.ROAD_WASHOUT
    else:
        category = HazardType.FLOOD

    # PS4 Shelter Utility detection
    shelter_status = None
    if category == HazardType.OTHER:
        power = not ("no power" in lower or "power cut" in lower or "generator down" in lower)
        water = "CONTAMINATED" if ("paani ganda hai" in lower or "dirty water" in lower) else "SAFE"
        med = not ("medicine spoiling" in lower or "medicine spoil" in lower)
        shelter_status = {
            "power_status": power,
            "water_status": water,
            "medicine_cold_chain_status": med
        }

    # Calculate urgency score
    urgency = 0.5
    if micro_env in [MicroEnvironmentTag.DROWNING_RISK, MicroEnvironmentTag.CRUSH_INJURY]:
        urgency = 1.0
    elif micro_env in [MicroEnvironmentTag.ROOFTOP_STRANDED, MicroEnvironmentTag.DEBRIS_TRAPPED, MicroEnvironmentTag.ELECTRICAL_HAZARD]:
        urgency = 0.85
    
    if vulnerabilities:
        urgency = min(1.0, urgency + 0.1)
        
    is_weak_only = (weak_sig is not None and val == 0 and micro_env is None and not vulnerabilities and "paani" not in lower.replace("paani ganda", ""))

    return {
        "raw_evidence_text": raw_text,
        "victim_estimate": {"value": val, "range_low": r_low, "range_high": r_high},
        "vulnerable_present": vulnerabilities,
        "micro_environment": micro_env,
        "category": category,
        "urgency": urgency,
        "weak_signal_type": weak_sig,
        "is_weak_signal_only": is_weak_only,
        "shelter_status": shelter_status
    }