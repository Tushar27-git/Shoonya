import random
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from .ground_truth import ground_truth
from .venues import venue_manager
from ..models.domain import RawReport, LocationInfo
from ..models.enums import SourceChannel, LocationPrecision
from ..core.queue import queue

class DisasterSimulationEngine:
    """
    Discrete-event simulation engine for the Raipur East disaster scenario.
    Advances physical ground truth, simulates agent observations, generates noisy reports,
    and feeds the durable ingestion queue.
    """
    def __init__(self):
        self.is_running: bool = False
        self.tick_count: int = 0
        self.total_generated_reports: int = 0

    async def tick(self, delta_minutes: int = 15) -> Dict[str, Any]:
        """
        Advances the simulation by delta_minutes.
        """
        self.tick_count += 1
        ground_truth.advance_time(delta_minutes)

        # Generate realistic noisy multi-channel reports based on ground truth state
        new_reports: List[RawReport] = []
        now = datetime.now(timezone.utc)

        # 1. Flood Ingress in Ward 07 (Rooftop Stranded)
        if ground_truth.ward_flood_depths["WARD-07"] >= 2.0:
            rep_sms = RawReport(
                report_id=f"SIM-REP-{uuid.uuid4().hex[:6].upper()}",
                source_channel=SourceChannel.SMS,
                raw_text=f"Paani 2nd floor tak aa gaya hai Ward 07 Primary School me. {random.randint(8, 12)} bachhe chhat par hain, please send boat!",
                timestamp=now,
                resolved_location=LocationInfo(
                    lat=26.8510,
                    lng=80.9490,
                    address="Govt Primary School, Ward 07",
                    ward_id="WARD-07",
                    precision=LocationPrecision.HIGH
                ),
                zone_id="WARD-07"
            )
            new_reports.append(rep_sms)

        # 2. Structural collapse in Ward 04 (Disputed counts)
        if ground_truth.ward_flood_depths["WARD-04"] >= 1.0:
            count_rumor = random.choice([4, 6, 14]) # Disputed noise
            rep_radio = RawReport(
                report_id=f"SIM-REP-{uuid.uuid4().hex[:6].upper()}",
                source_channel=SourceChannel.RADIO,
                raw_text=f"Patrol Unit 3: Building collapsed in Old Market Complex Ward 04. Trapped victims estimated around {count_rumor}.",
                timestamp=now,
                resolved_location=LocationInfo(
                    lat=26.8410,
                    lng=80.9320,
                    address="Old Market Complex, Ward 04",
                    ward_id="WARD-04",
                    precision=LocationPrecision.HIGH
                ),
                zone_id="WARD-04"
            )
            new_reports.append(rep_radio)

        # 3. Islanded Station Road in Ward 02
        rep_voice = RawReport(
            report_id=f"SIM-REP-{uuid.uuid4().hex[:6].upper()}",
            source_channel=SourceChannel.VOICE,
            raw_text="Station Approach Road pura cut ho gaya hai, 15 elderly log fans gaye hain mandir ke paas.",
            timestamp=now,
            resolved_location=LocationInfo(
                lat=26.8350,
                lng=80.9580,
                address="Station Approach Road Island, Ward 02",
                ward_id="WARD-02",
                precision=LocationPrecision.MEDIUM
            ),
            zone_id="WARD-02"
        )
        new_reports.append(rep_voice)

        # Push generated reports to the durable intake queue
        for r in new_reports:
            await queue.enqueue(r)
            self.total_generated_reports += 1

        # Check venue threats
        venue_threats = []
        for v in venue_manager.list_venues():
            w_id = v.location.ward_id or "WARD-01"
            w_water = ground_truth.ward_flood_depths.get(w_id, 0.0)
            threat = venue_manager.check_flood_threat(v, w_water)
            if threat:
                venue_threats.append({"venue_id": v.venue_id, "threat": threat})

        return {
            "tick_index": self.tick_count,
            "sim_time_minutes": ground_truth.sim_time_minutes,
            "reports_generated": len(new_reports),
            "total_reports": self.total_generated_reports,
            "ground_truth_flood_depths": ground_truth.ward_flood_depths,
            "venue_threats": venue_threats,
        }

    def reset(self):
        ground_truth.reset()
        self.tick_count = 0
        self.total_generated_reports = 0

simulation_engine = DisasterSimulationEngine()
