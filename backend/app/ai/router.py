import os
import joblib
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["AI Verification"])

# Model Path Setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "fake_report_model.joblib")

# Load Trained Model
try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    model = None

# Request Schema
class VerificationRequest(BaseModel):
    source_corroboration: float
    geospatial_consistency: float
    temporal_consistency: float
    media_authenticity: float
    anomaly_score: float

@router.post("/verify")
def verify_incident_report(data: VerificationRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="AI Model file not loaded properly.")
    
    # Input DataFrame Setup
    input_data = pd.DataFrame([[
        data.source_corroboration,
        data.geospatial_consistency,
        data.temporal_consistency,
        data.media_authenticity,
        data.anomaly_score
    ]], columns=[
        'source_corroboration',
        'geospatial_consistency',
        'temporal_consistency',
        'media_authenticity',
        'anomaly_score'
    ])

    # Predict Class & Probability
    prediction = model.predict(input_data)[0]
    probabilities = model.predict_proba(input_data)[0]

    return {
        "status": "success",
        "verification_status": str(prediction),
        "confidence_scores": dict(zip(model.classes_, probabilities.tolist()))
    }