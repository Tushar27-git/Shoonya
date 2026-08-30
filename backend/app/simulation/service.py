import json
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional
from app.simulation.ground_truth import ground_truth

class SimulationEngine:
    def __init__(self):
        self.status = "IDLE"
        self.elapsed_seconds = 0
        self.seed = 42
        self.task: Optional[asyncio.Task] = None
        self.events = []
        
        # Load seed
        seed_path = Path(__file__).parent / "scenario_seed_42.json"
        if seed_path.exists():
            with open(seed_path, "r", encoding="utf-8") as f:
                self.events = json.load(f)

    async def _run_loop(self):
        self.status = "RUNNING"
        self.elapsed_seconds = 0
        
        while self.elapsed_seconds <= 60 and self.status == "RUNNING":
            # Find and execute events for current second
            current_events = [e for e in self.events if e["time_offset_seconds"] == self.elapsed_seconds]
            for event in current_events:
                await self._execute_event(event)
                
            await asyncio.sleep(1.0)
            self.elapsed_seconds += 1
            
        if self.status == "RUNNING":
            self.status = "COMPLETE"

    async def _execute_event(self, event: Dict[str, Any]):
        action = event.get("action")
        payload = event.get("payload", {})
        
        if action == "ingest_vague":
            from app.ingestion.router import ingest_vague_report, VagueLocationReportPayload
            from app.models.enums import SourceChannel
            try:
                # Map channel string to enum
                channel_str = payload.get("channel", "SMS")
                channel = getattr(SourceChannel, channel_str, SourceChannel.SMS)
                
                req = VagueLocationReportPayload(
                    raw_text=payload["raw_text"],
                    sender_id=payload["sender_id"],
                    channel=channel,
                    landmark_hint=payload.get("landmark_hint")
                )
                await ingest_vague_report(req)
            except Exception as e:
                print(f"Error executing ingest_vague: {e}")
                
        elif action == "duplicate_burst":
            from app.ingestion.router import ingest_vague_report, VagueLocationReportPayload
            from app.models.enums import SourceChannel
            for i in range(payload.get("count", 50)):
                try:
                    req = VagueLocationReportPayload(
                        raw_text=payload["base_text"],
                        sender_id=f"BURST-USER-{i}",
                        channel=SourceChannel.SMS,
                        landmark_hint=payload.get("ward")
                    )
                    await ingest_vague_report(req)
                except Exception as e:
                    pass
                    
        elif action == "telecom_outage":
            from app.ingestion.processor import zone_tracker
            zone_tracker.set_telecom_status(payload.get("ward"), "DARK")
            
        elif action == "trigger_dispatch":
            pass # In a real implementation we might trigger the dispatch engine here if it's not automated
            
        elif action == "trigger_amplify":
            pass # Same for amplify

    def start(self):
        self.reset()
        self.status = "RUNNING"
        self.task = asyncio.create_task(self._run_loop())
        
    def reset(self):
        if self.task:
            self.task.cancel()
            self.task = None
        self.status = "IDLE"
        self.elapsed_seconds = 0
        ground_truth.reset()
        
        # Reset other state (this is simplistic but enough for the baseline)
        from app.clustering.engine import cluster_engine
        cluster_engine._incidents.clear()
        
        from app.dispatch.router import AUDIT_LOG
        AUDIT_LOG.clear()
        
        from app.ingestion.processor import zone_tracker
        zone_tracker._zone_telecom_status = {z: "LIVE" for z in zone_tracker._zone_telecom_status}
        zone_tracker._zone_latest_report = {}

simulation_engine = SimulationEngine()
