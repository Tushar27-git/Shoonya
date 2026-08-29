import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from ..models.domain import ProposedAction
from ..models.enums import ProposedActionType

class SensorTaskingManager:
    """
    Manages autonomous drone survey dispatch and satellite priority tasking requests
    for unverified incidents and dark zones.
    """
    def __init__(self):
        self._tasking_queue: List[Dict[str, Any]] = []

    def request_drone_recon(
        self,
        incident_id: str,
        target_lat: float,
        target_lng: float,
        priority: float = 1.0,
        reason: str = "High-priority verification of critical unverified cluster"
    ) -> Dict[str, Any]:
        task_id = f"DRONE-TASK-{uuid.uuid4().hex[:6].upper()}"
        task = {
            "task_id": task_id,
            "incident_id": incident_id,
            "target_coordinates": {"lat": target_lat, "lng": target_lng},
            "status": "QUEUED",
            "priority": priority,
            "reason": reason,
            "drone_assigned": "NDRF-DRONE-QUAD-02",
            "eta_minutes": 6.5,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        self._tasking_queue.append(task)
        return task

    def get_active_tasks(self) -> List[Dict[str, Any]]:
        return self._tasking_queue

sensor_tasking = SensorTaskingManager()
