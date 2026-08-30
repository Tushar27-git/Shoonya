from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from .engine import copilot_engine
from .sitrep import sitrep_generator
from ..models.domain import CopilotMessageResponse, SitrepResponse

router = APIRouter(prefix="/copilot", tags=["AI Advisory & EOC Copilot"])

class MessageHistoryItem(BaseModel):
    role: str # "user" or "copilot"
    content: str = ""
    text: Optional[str] = None
    citations: Optional[List[str]] = None

class CopilotQueryRequest(BaseModel):
    query: Optional[str] = None
    question: Optional[str] = None
    incident_context_id: Optional[str] = None
    focus_incident_id: Optional[str] = None
    focus_zone_id: Optional[str] = None
    officer_id: Optional[str] = None
    conversation_history: Optional[List[MessageHistoryItem]] = None
    history: Optional[List[Dict[str, Any]]] = None

@router.post("/query", response_model=CopilotMessageResponse)
async def query_eoc_copilot(payload: CopilotQueryRequest):
    """
    Submits an operational query to the EOC AI Copilot with multi-turn context support.
    Returns structured assessment, citations, caveats, and executable proposed action buttons.
    """
    user_query = payload.query or payload.question
    if not user_query or not user_query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    history_items = []
    if payload.conversation_history:
        history_items = [h.model_dump() for h in payload.conversation_history]
    elif payload.history:
        history_items = payload.history

    return copilot_engine.process_query(
        query=user_query,
        incident_context_id=payload.incident_context_id or payload.focus_incident_id,
        conversation_history=history_items
    )

@router.get("/sitrep", response_model=SitrepResponse)
async def get_situation_report():
    """
    Generates a formal, standardized EOC Situation Report (SITREP)
    covering active incidents, casualty brackets, venue surge, dark zones,
    resource readiness, and information gaps.
    """
    return sitrep_generator.generate_current_sitrep()
