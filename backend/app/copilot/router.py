from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from .engine import copilot_engine
from .sitrep import sitrep_generator
from ..models.domain import CopilotMessageResponse, SitrepResponse

router = APIRouter(prefix="/copilot", tags=["AI Advisory & EOC Copilot"])

class CopilotQueryRequest(BaseModel):
    query: Optional[str] = None
    question: Optional[str] = None
    incident_context_id: Optional[str] = None
    focus_incident_id: Optional[str] = None
    focus_zone_id: Optional[str] = None
    officer_id: Optional[str] = None

@router.post("/query", response_model=CopilotMessageResponse)
async def query_eoc_copilot(payload: CopilotQueryRequest):
    """
    Submits an operational query to the EOC AI Copilot.
    Returns structured assessment, citations, caveats, and executable proposed action buttons.
    """
    user_query = payload.query or payload.question
    if not user_query or not user_query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return copilot_engine.process_query(user_query, payload.incident_context_id or payload.focus_incident_id)

@router.get("/sitrep", response_model=SitrepResponse)
async def get_situation_report():
    """
    Generates a formal, standardized EOC Situation Report (SITREP)
    covering active incidents, casualty brackets, venue surge, and dark zones.
    """
    return sitrep_generator.generate_current_sitrep()
