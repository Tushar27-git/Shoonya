import re
from typing import Dict, List, Tuple
from ..models.enums import VulnerabilityTag, HazardType, MicroEnvironmentTag

# Multilingual number dictionary (English, Hindi, Hinglish)
NUMBER_WORDS: Dict[str, int] = {
    # English
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "fifteen": 15, "twenty": 20,
    "thirty": 30, "fifty": 50, "hundred": 100,
    # Hindi Devanagari words
    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "पाँच": 5,
    "छह": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
    "ग्यारह": 11, "बारह": 12, "पंद्रह": 15, "बीस": 20, "पचास": 50, "सौ": 100,
    # Hinglish / Roman Hindi words
    "ek": 1, "do": 2, "teen": 3, "char": 4, "chaar": 4, "paanch": 5, "panch": 5,
    "che": 6, "chhe": 6, "saat": 7, "aath": 8, "ath": 8, "nau": 9, "das": 10, "dus": 10,
    "gyarah": 11, "barah": 12, "pandrah": 15, "pandarh": 15, "bees": 20, "pachaas": 50,
}

# Vulnerability keywords (Devanagari, Roman Hindi, English)
VULNERABILITY_PATTERNS: List[Tuple[VulnerabilityTag, List[str]]] = [
    (VulnerabilityTag.CHILDREN, [
        r"\bchildren\b", r"\bchild\b", r"\bkids?\b", r"\bbaby\b", r"\binfant\b", r"\bstudents?\b",
        r"बच्चे", r"बच्चा", r"शिशु", r"छात्र",
        r"\bbachche\b", r"\bbache\b", r"\bbachhe\b", r"\bbacha\b", r"\bbachha\b"
    ]),
    (VulnerabilityTag.ELDERLY, [
        r"\belderly\b", r"\bsenior\b", r"\bold\s+(?:people|man|woman|citizens?)\b",
        r"बुजुर्ग", r"वृद्ध", r"बूढ़े", r"बूढ़ी",
        r"\bbuzurg\b", r"\bbudhe\b", r"\bbudhi\b", r"\bbuzoorg\b", r"\bold\s+age\b"
    ]),
    (VulnerabilityTag.PREGNANT, [
        r"\bpregnant\b", r"\bpregnancy\b", r"\bexpecting\b",
        r"गर्भवती", r"गर्भावस्था",
        r"\bgarbhvati\b"
    ]),
    (VulnerabilityTag.DISABLED, [
        r"\bdisabled\b", r"\bhandicapped\b", r"\bwheelchair\b", r"\bmobility\s+impaired\b",
        r"दिव्यांग", r"विकलांग",
        r"\bdivyang\b", r"\bviklang\b"
    ]),
    (VulnerabilityTag.INJURED, [
        r"\binjured\b", r"\bwounded\b", r"\bbleeding\b", r"\bfracture\b", r"\bunconscious\b", r"\binjuries\b",
        r"घायल", r"चोट", r"बेहोश",
        r"\bghayal\b", r"\bchot\b", r"\bbehosh\b"
    ]),
]

# Micro-Environment tags (PS5 <-> PS2 bridge)
MICRO_ENVIRONMENT_PATTERNS: List[Tuple[MicroEnvironmentTag, List[str]]] = [
    (MicroEnvironmentTag.ROOFTOP_STRANDED, [
        r"\broof(?:top)?\b", r"\bterrace\b", r"\b2nd\s*floor\b", r"\bsecond\s*floor\b", r"\b3rd\s*floor\b",
        r"\bupper\s*floor\b", r"\btop\s*floor\b",
        r"छत", r"ऊपरी\s*मंजिल", r"दूसरी\s*मंजिल",
        r"\bchhat\b", r"\bchat\b", r"\brooftop\b", r"\bterrace\b",
        r"\bteesri\s*manzil\b", r"\bdoosri\s*manzil\b"
    ]),
    (MicroEnvironmentTag.DROWNING_RISK, [
        r"\bdrowning\b", r"\bwater\s+up\s+to\s+(?:chest|neck|head)\b", r"\bswept\s+away\b", r"\bdeep\s+water\b",
        r"डूब", r"गले\s*तक\s*पानी", r"छाती\s*तक\s*पानी", r"बह\s*गए",
        r"\bdoob\b", r"\bdoobne\b", r"\bgale\s*tak\s*paani\b", r"\bchhati\s*tak\s*paani\b", r"\bkamar\s*tak\s*paani\b"
    ]),
    (MicroEnvironmentTag.DEBRIS_TRAPPED, [
        r"\bdebris\b", r"\brubble\b", r"\btrapped\s+under\b", r"\bcollapsed\s+wall\b", r"\bstructure\s+fall\b",
        r"मलबा", r"मलबे", r"दबे\s*हुए", r"दीवार\s*गिर",
        r"\bmalba\b", r"\bmalbe\b", r"\bdabe\s*hue\b", r"\bdeewar\s*gir\b", r"\btrapped\s+under\s+debris\b"
    ]),
    (MicroEnvironmentTag.CRUSH_INJURY, [
        r"\bcrush\b", r"\bheavy\s+pillar\b", r"\bpinned\s+down\b",
        r"दब\s*गया", r"कुचल",
        r"\bdab\s*gaya\b", r"\bpinned\b"
    ]),
    (MicroEnvironmentTag.CUT_OFF_ACCESS, [
        r"\bcut\s*off\b", r"\bisolated\b", r"\broad\s+(?:cut|washed\s*away|blocked)\b", r"\bbridge\s+broken\b",
        r"रास्ता\s*कट", r"सड़क\s*टूट", r"पुल\s*टूट", r"संपर्क\s*टूटा",
        r"\broad\s*pura\s*cut\b", r"\brasta\s*cut\b", r"\bpul\s*toot\b", r"\bislanded\b", r"\bno\s+access\b"
    ]),
    (MicroEnvironmentTag.ELECTRICAL_HAZARD, [
        r"\belectric\b", r"\blive\s*wire\b", r"\btransformer\s+spark\b", r"\bshock\b",
        r"करंट", r"बिजली\s*का\s*तार",
        r"\bcurrent\b", r"\bbijli\s*taar\b", r"\blive\s*wire\b"
    ]),
]

# Hazard Type keywords (Ordered by specificity)
HAZARD_PATTERNS: List[Tuple[HazardType, List[str]]] = [
    (HazardType.BUILDING_COLLAPSE, [
        r"\bcollapsed?\b", r"\bbuilding\s+fall\b", r"\bwall\s+collapse\b", r"\bmakan\s*gir\b", r"गिर\s*गया", r"मकान\s*गिरा", r"collapse"
    ]),
    (HazardType.ROAD_WASHOUT, [
        r"\bwashout\b", r"\broad\s+cut\b", r"\broad\s+washed\b", r"\brasta\s*toot\b", r"सड़क\s*कट"
    ]),
    (HazardType.BRIDGE_FAILURE, [
        r"\bbridge\s+(?:collapse|damaged|broken|impassable|failure)\b", r"\bpul\s*toot\b", r"पुल\s*टूटा", r"broken\s+bridge"
    ]),
    (HazardType.ELECTRICAL_FAULT, [
        r"\btransformer\b", r"\bshort\s*circuit\b", r"\belectrocution\b", r"\bbijli\b", r"बिजली"
    ]),
    (HazardType.MEDICAL_EMERGENCY, [
        r"\bheart\s*attack\b", r"\boxygen\b", r"\bambulance\b", r"\bcritical\s*patient\b", r"खून", r"\bhospital\b"
    ]),
    (HazardType.FLOOD, [
        r"\bflood\b", r"\bwater\b", r"\binundat\w+\b", r"\bpaani\b", r"\bpani\b", r"पानी", r"बाढ़", r"जलभराव", r"\bsubmerged\b"
    ]),
]
