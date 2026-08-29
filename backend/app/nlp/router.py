from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from .extractor import NLPExtractor
from ..models.domain import ExtractionResult

router = APIRouter(prefix="/nlp", tags=["NLP Extraction"])

class ExtractionRequest(BaseModel):
    raw_text: str
    location_hint: Optional[str] = None

@router.post("/extract", response_model=ExtractionResult)
async def extract_structured_claims(payload: ExtractionRequest):
    """
    Extracts structured operational claims from multilingual text.
    """
    return NLPExtractor.extract(payload.raw_text, payload.location_hint)
