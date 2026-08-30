from fastapi import APIRouter
from app.dashboard.state_builder import build_dashboard_state

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

from typing import Optional

@router.get("/state")
async def get_dashboard_state(tick: Optional[int] = 0):
    return await build_dashboard_state(tick=tick)
