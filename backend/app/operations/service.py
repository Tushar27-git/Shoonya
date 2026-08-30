import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from .models import (
    FleetUnit, RouteSegmentRisk, RoutePlan, SafetyAudit, SafetyAlert,
    FleetStatus, AuditResult, AlertSeverity, AlertAudience, AlertStatus
)

# Mock database
FLEET_STORE: Dict[str, FleetUnit] = {
    "BOAT-B02": FleetUnit(unit_id="BOAT-B02", unit_type="BOAT", status=FleetStatus.AVAILABLE),
    "VAN-02": FleetUnit(unit_id="VAN-02", unit_type="VAN", status=FleetStatus.AVAILABLE),
    "AMB-01": FleetUnit(unit_id="AMB-01", unit_type="AMBULANCE", status=FleetStatus.AVAILABLE),
    "NGO-A": FleetUnit(unit_id="NGO-A", unit_type="PARTNER", status=FleetStatus.AVAILABLE)
}

ROUTES_STORE: Dict[str, RoutePlan] = {}
AUDIT_STORE: Dict[str, SafetyAudit] = {}
ALERT_STORE: Dict[str, SafetyAlert] = {}

async def compute_risk_summary() -> List[Dict[str, Any]]:
    from app.dashboard.state_builder import build_dashboard_state
    # Reads from existing state
    dashboard_state = await build_dashboard_state()
    risks = []
    
    # 1. Shelter Health (SH03)
    # Check simulation tasks for SH03
    for task in dashboard_state.get("tasks", []):
        if "SH03" in task.get("title", "") or "water" in task.get("title", "").lower():
            risks.append({
                "source": "SHELTER_HEALTH",
                "severity": "HIGH",
                "description": "SH03 reports unsafe water, power off, occupancy stress."
            })

    # 2. Infrastructure (DY02 / Bridges)
    for incident in dashboard_state.get("incidents", []):
        if "CRACK" in str(incident) or "DY02" in str(incident):
            risks.append({
                "source": "INFRASTRUCTURE",
                "severity": "CRITICAL",
                "description": f"Emerging risk near DY02 detected."
            })
            
    # 3. Dark Zone (Ward C)
    for dz in dashboard_state.get("dark_zones", []):
        risks.append({
            "source": "DARK_ZONE",
            "severity": "HIGH",
            "description": f"Dark zone detected in {dz.get('ward_id', 'Unknown Ward')}"
        })

    # 4. Information (Disputes)
    for dispute in dashboard_state.get("road_disputes", []):
        risks.append({
            "source": "INFORMATION",
            "severity": "WARNING",
            "description": f"Conflicting claims on segment {dispute.get('segment_id', 'Unknown')}"
        })

    return risks

def plan_route(task_id: str, fleet_unit_id: str) -> List[RoutePlan]:
    fleet = FLEET_STORE.get(fleet_unit_id)
    if not fleet:
        return []
        
    plans = []
    
    # BR04 is disputed, H2 is recommended
    # Fake segment data for demo
    is_heavy = fleet.unit_type in ["VAN", "AMBULANCE"]
    
    route_br04 = RoutePlan(
        route_id=f"ROUTE-BR04-{uuid.uuid4().hex[:4]}",
        task_id=task_id,
        fleet_unit_id=fleet_unit_id,
        segments=[RouteSegmentRisk(segment_id="BR04", risk_score=100, status="DISPUTED", travel_time_minutes=10)],
        total_travel_time_minutes=10,
        total_risk_score=100,
        confidence=0.5,
        restrictions=["AVOID_HEAVY_VEHICLES"]
    )
    
    route_h2 = RoutePlan(
        route_id=f"ROUTE-H2-{uuid.uuid4().hex[:4]}",
        task_id=task_id,
        fleet_unit_id=fleet_unit_id,
        segments=[RouteSegmentRisk(segment_id="H2", risk_score=10, status="OPEN", travel_time_minutes=15)],
        total_travel_time_minutes=15,
        total_risk_score=10,
        confidence=0.9,
        restrictions=[]
    )
    
    if is_heavy:
        # Heavies avoid disputed
        plans = [route_h2]
    else:
        plans = [route_h2, route_br04]
        
    for p in plans:
        ROUTES_STORE[p.route_id] = p
        
    return plans

def run_safety_audit(entity_type: str, entity_id: str, task_id: str) -> SafetyAudit:
    # Rule engine
    is_saathi = entity_type.upper() == "SAATHI"
    is_rescue_task = "RESCUE" in task_id.upper() or "BOAT" in task_id.upper()
    
    if is_saathi and is_rescue_task:
        result = AuditResult.FAIL
        reasons = ["Saathi is not permitted for high-risk water rescue."]
    else:
        fleet = FLEET_STORE.get(entity_id)
        if fleet and (fleet.fuel_percent < 20 or not fleet.crew_available):
            result = AuditResult.FAIL
            reasons = ["Insufficient fuel or crew unavailable."]
        else:
            if entity_id == "VAN-02":
                result = AuditResult.CONDITIONAL_PASS
                reasons = ["Avoid BR04 due to dispute."]
            else:
                result = AuditResult.PASS
                reasons = []

    audit = SafetyAudit(
        audit_id=f"AUDIT-{uuid.uuid4().hex[:6]}",
        entity_type=entity_type,
        entity_id=entity_id,
        task_id=task_id,
        result=result,
        restrictions=reasons
    )
    AUDIT_STORE[audit.audit_id] = audit
    
    if result == AuditResult.FAIL and fleet:
        fleet.status = FleetStatus.UNAVAILABLE
        
    return audit

async def evaluate_alert_triggers():
    from app.dashboard.state_builder import build_dashboard_state
    dashboard_state = await build_dashboard_state()
    # If BR04 is disputed, alert NGO partner
    has_br04 = any(d.get('segment_id') == 'BR04' for d in dashboard_state.get("road_disputes", []))
    if has_br04:
        alert = SafetyAlert(
            alert_id=f"ALERT-{uuid.uuid4().hex[:6]}",
            severity=AlertSeverity.HIGH,
            audience=AlertAudience.NGO_PARTNER,
            status=AlertStatus.SENT,
            message="BR04 is disputed. Heavy vehicles avoid.",
            trigger_source="DISPUTE_PIPELINE"
        )
        ALERT_STORE[alert.alert_id] = alert

