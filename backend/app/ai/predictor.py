from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = BASE_DIR / "models" / "verification_model.joblib"


class VerificationPredictor:

    def __init__(self):
        bundle = joblib.load(MODEL_PATH)

        self.model = bundle["model"]
        self.features = bundle["features"]

    def predict(
        self,
        source_corroboration: float,
        geospatial_consistency: float,
        temporal_consistency: float,
        visual_evidence: float,
        contradiction_penalty: float,
        baseline_prior: float,
        victim_count: int,
        urgency: float,
    ):

        data = {
            "source_corroboration": [source_corroboration],
            "geospatial_consistency": [geospatial_consistency],
            "temporal_consistency": [temporal_consistency],
            "visual_evidence": [visual_evidence],
            "contradiction_penalty": [contradiction_penalty],
            "baseline_prior": [baseline_prior],
            "victim_count": [victim_count],
            "urgency": [urgency],
        }

        X = pd.DataFrame(data)[self.features]

        prediction = self.model.predict(X)[0]

        probabilities = self.model.predict_proba(X)[0]

        confidence = max(probabilities)

        return {
            "verification_status": prediction,
            "confidence": round(float(confidence), 3),
        }
