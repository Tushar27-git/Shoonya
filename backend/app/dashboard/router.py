from fastapi import APIRouter
from app.dashboard.state_builder import build_dashboard_state

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/state")
async def get_dashboard_state():
    return await build_dashboard_state()
