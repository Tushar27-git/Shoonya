import re
import math
from typing import Set, List, Tuple
from ..models.domain import LocationInfo, Coordinates

# Cross-lingual disaster synonym canonicalizer
CANONICAL_SYNONYMS = {
    # Water / Flood
    "paani": "flood", "pani": "flood", "पानी": "flood", "बाढ़": "flood", "water": "flood", "submerged": "flood", "inundated": "flood", "jalbharav": "flood",
    # Building / Roof / School
    "school": "school", "स्कूल": "school", "vidyalaya": "school", "chhat": "roof", "chat": "roof", "छत": "roof", "rooftop": "roof", "terrace": "roof", "manzil": "floor", "floor": "floor",
    # Trapped / Danger / Children
    "trapped": "trapped", "fase": "trapped", "fasi": "trapped", "फंसे": "trapped", "dabe": "trapped", "दबे": "trapped",
    "bachche": "children", "bachha": "children", "बच्चे": "children", "children": "children", "kids": "children", "students": "children",
    # Collapse / Debris / Road
    "collapse": "collapse", "collapsed": "collapse", "gir": "collapse", "gira": "collapse", "मलबा": "debris", "malba": "debris", "debris": "debris",
    "road": "road", "rasta": "road", "सड़क": "road", "bridge": "bridge", "pul": "bridge", "पुल": "bridge",
}

class SimilarityCalculator:
    """
    Computes spatio-temporal and cross-lingual semantic similarity between observations.
    """
    @staticmethod
    def tokenize_and_canonicalize(text: str) -> Set[str]:
        cleaned = re.sub(r"[^\w\s\u0900-\u097F]", " ", text.lower())
        tokens = cleaned.split()
        canonical_tokens = set()
        for tok in tokens:
            if tok in CANONICAL_SYNONYMS:
                canonical_tokens.add(CANONICAL_SYNONYMS[tok])
            elif len(tok) > 2:
                canonical_tokens.add(tok)
        return canonical_tokens

    @staticmethod
    def semantic_similarity(text1: str, text2: str) -> float:
        """Calculates token Jaccard & overlap similarity with canonical synonym expansion."""
        tokens1 = SimilarityCalculator.tokenize_and_canonicalize(text1)
        tokens2 = SimilarityCalculator.tokenize_and_canonicalize(text2)

        if not tokens1 or not tokens2:
            return 0.0

        intersection = len(tokens1.intersection(tokens2))
        union = len(tokens1.union(tokens2))
        
        jaccard = intersection / union if union > 0 else 0.0
        # Overlap coefficient gives higher score when one is a concise substring of another
        overlap = intersection / min(len(tokens1), len(tokens2))
        
        score = 0.5 * jaccard + 0.5 * overlap
        return min(max(score, 0.0), 1.0)

    @staticmethod
    def spatial_distance_km(loc1: LocationInfo, loc2: LocationInfo) -> float:
        """Haversine distance approximation in km."""
        lat1, lon1 = loc1.lat, loc1.lng
        lat2, lon2 = loc2.lat, loc2.lng

        R = 6371.0 # Earth radius km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    @staticmethod
    def spatio_temporal_semantic_similarity(
        text1: str,
        loc1: LocationInfo,
        text2: str,
        loc2: LocationInfo,
        max_distance_km: float = 1.5,
    ) -> float:
        """
        Combines spatial proximity and cross-lingual semantic similarity into
        a composite merge-confidence score [0.0, 1.0].
        """
        dist_km = SimilarityCalculator.spatial_distance_km(loc1, loc2)
        
        # Spatial gating: if > max_distance_km, cannot be same incident
        if dist_km > max_distance_km:
            return 0.0

        spatial_score = max(0.0, 1.0 - (dist_km / max_distance_km))
        semantic_score = SimilarityCalculator.semantic_similarity(text1, text2)

        # Same ward bonus
        ward_match = (loc1.ward_id and loc2.ward_id and loc1.ward_id == loc2.ward_id)
        ward_bonus = 0.1 if ward_match else 0.0

        # Composite score
        composite = (0.45 * spatial_score) + (0.45 * semantic_score) + (0.10 * ward_bonus)
        return min(max(round(composite, 3), 0.0), 1.0)
