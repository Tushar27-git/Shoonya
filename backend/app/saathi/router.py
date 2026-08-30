import json
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/saathi/roster", tags=["Saathi Roster"])

ROSTER_FILE = Path(__file__).resolve().parent / "roster.json"
ROSTER_DATA: List[Dict[str, Any]] = []

def load_roster():
    global ROSTER_DATA
    if ROSTER_FILE.exists():
        with open(ROSTER_FILE, "r", encoding="utf-8") as f:
            try:
                ROSTER_DATA = json.load(f)
            except Exception as e:
                print(f"Failed to load roster: {e}")

load_roster()

@router.get("")
async def get_roster():
    return ROSTER_DATA

@router.get("/{saathi_id}")
async def get_saathi_profile(saathi_id: str):
    profile = next((p for p in ROSTER_DATA if p["id"] == saathi_id), None)
    if not profile:
        raise HTTPException(status_code=404, detail="Saathi profile not found")
    return profile

def get_role_level(saathi_id: str) -> int:
    """Helper for ingestion pipeline"""
    if not ROSTER_DATA:
        load_roster()
    profile = next((p for p in ROSTER_DATA if p["id"] == saathi_id), None)
    if profile:
        return profile.get("role_level")
    return None
