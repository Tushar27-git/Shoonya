import hashlib
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/dispatch", tags=["Dispatch"])

class AssignmentProposal(BaseModel):
    incident_id: str
    resource_id: str
    resource_type: str
    eta_minutes: int

class ApprovalPayload(BaseModel):
    approver_id: str
    approver_role: str
    approval_timestamp: datetime
    approved_assignments: List[AssignmentProposal]

class AuditRecord(BaseModel):
    index: int
    timestamp: str
    action: str
    approver_id: str
    payload: Dict[str, Any]
    previous_hash: str
    hash: str

AUDIT_LOG: List[AuditRecord] = []

def calculate_hash(index: int, timestamp: str, action: str, approver_id: str, payload: Dict[str, Any], prev_hash: str) -> str:
    raw = f"{index}|{timestamp}|{action}|{approver_id}|{json.dumps(payload, sort_keys=True)}|{prev_hash}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def append_audit_entry(action: str, approver_id: str, payload: Dict[str, Any]) -> AuditRecord:
    prev_hash = AUDIT_LOG[-1].hash if AUDIT_LOG else "GENESIS_HASH"
    idx = len(AUDIT_LOG)
    ts = datetime.utcnow().isoformat()
    h = calculate_hash(idx, ts, action, approver_id, payload, prev_hash)
    rec = AuditRecord(index=idx, timestamp=ts, action=action, approver_id=approver_id, payload=payload, previous_hash=prev_hash, hash=h)
    AUDIT_LOG.append(rec)
    return rec

def verify_audit_chain() -> bool:
    if not AUDIT_LOG:
        return True
    
    prev_hash = "GENESIS_HASH"
    for rec in AUDIT_LOG:
        if rec.previous_hash != prev_hash:
            return False
        
        calculated_hash = calculate_hash(
            rec.index, rec.timestamp, rec.action, rec.approver_id, rec.payload, prev_hash
        )
        if calculated_hash != rec.hash:
            return False
            
        prev_hash = rec.hash
        
    return True

class DispatchRequest(BaseModel):
    incidents: List[Dict[str, Any]]
    resources: List[Dict[str, Any]]
    closed_road_segments: List[str] = []
    disputed_road_segments: List[str] = []

class HeuristicDispatcher:
    @staticmethod
    def generate_plan(
        incidents: List[Dict[str, Any]], 
        resources: List[Dict[str, Any]], 
        closed_road_segments: List[str],
        disputed_road_segments: List[str]
    ) -> Dict[str, Any]:
        sorted_inc = sorted(incidents, key=lambda x: x.get("priority_score", 0), reverse=True)
        assignments = []
        used_res = set()

        for inc in sorted_inc:
            target_route = inc.get("route_segment_id")
            
            # Avoid CLOSED roads entirely
            if target_route in closed_road_segments:
                continue

            # Penalize DISPUTED roads with extra ETA
            base_eta = 15
            if target_route in disputed_road_segments:
                base_eta += 30  # Heavy penalty for disputed road
            
            category = inc.get("category", "")
            if category == "FLOOD":
                needed = "BOAT"
            elif category == "COLLAPSE":
                needed = "EXCAVATOR"
            else:
                needed = "MEDICAL"

            for r in resources:
                if r["resource_id"] not in used_res and r["type"] == needed and r.get("available", True):
                    assignments.append(AssignmentProposal(
                        incident_id=inc["incident_id"],
                        resource_id=r["resource_id"],
                        resource_type=r["type"],
                        eta_minutes=base_eta
                    ))
                    used_res.add(r["resource_id"])
                    break

        return {
            "plan_quality": "PLAN QUALITY: HEURISTIC",
            "assignments": [a.model_dump() for a in assignments]
        }

@router.post("/plan")
async def generate_dispatch_plan(req: DispatchRequest):
    return HeuristicDispatcher.generate_plan(
        req.incidents, 
        req.resources, 
        req.closed_road_segments,
        req.disputed_road_segments
    )

@router.post("/approve", status_code=status.HTTP_200_OK)
async def approve_dispatch(payload: ApprovalPayload):
    if not payload.approver_id or not payload.approver_role:
        raise HTTPException(status_code=403, detail="Human approval token missing or invalid")
    entry = append_audit_entry("DISPATCH_APPROVED", payload.approver_id, payload.model_dump(mode="json"))
    return {"status": "DISPATCH_COMMITTED", "audit_index": entry.index, "hash": entry.hash}

@router.get("/audit-log")
async def get_audit_log():
    return {"log": [r.model_dump() for r in AUDIT_LOG]}
