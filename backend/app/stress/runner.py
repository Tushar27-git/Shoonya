import asyncio
import time
import uuid
import random
from typing import Dict, Any, List
from datetime import datetime, timezone
from ..models.domain import RawReport, LocationInfo, Coordinates
from ..models.enums import SourceChannel, LocationPrecision
from ..core.queue import queue
from ..clustering.engine import clustering_engine
from ..clustering.severity import SeverityCalculator
from ..priority.engine import PriorityCalculator

class StressBenchmarkRunner:
    """
    Executes stress testing, burst ingestion benchmarks,
    and adversarial load invariance validations.
    """
    @staticmethod
    async def run_burst_ingestion_benchmark(count: int = 1000) -> Dict[str, Any]:
        start_time = time.perf_counter()
        
        reports: List[RawReport] = []
        now = datetime.now(timezone.utc)
        
        channels = [SourceChannel.SMS, SourceChannel.VOICE, SourceChannel.RADIO, SourceChannel.SOCIAL, SourceChannel.WEB]
        wards = ["WARD-01", "WARD-02", "WARD-03", "WARD-04", "WARD-07", "WARD-08", "WARD-09"]
        
        for i in range(count):
            r = RawReport(
                report_id=f"BURST-REP-{uuid.uuid4().hex[:6].upper()}",
                source_channel=random.choice(channels),
                raw_text=f"Urgent emergency report #{i}: Flood water rising in {random.choice(wards)}.",
                timestamp=now,
                resolved_location=LocationInfo(
                    lat=26.8500 + random.uniform(-0.02, 0.02),
                    lng=80.9400 + random.uniform(-0.02, 0.02),
                    ward_id=random.choice(wards),
                    precision=LocationPrecision.HIGH
                ),
                zone_id=random.choice(wards)
            )
            reports.append(r)
            
        # Concurrently push to queue
        enqueue_start = time.perf_counter()
        await asyncio.gather(*(queue.push(r) for r in reports))
        enqueue_duration = time.perf_counter() - enqueue_start
        
        total_duration = time.perf_counter() - start_time
        q_depth = await queue.get_queue_depth()
        
        return {
            "total_reports": count,
            "total_duration_sec": round(total_duration, 4),
            "throughput_reports_per_sec": round(count / max(0.001, total_duration), 1),
            "enqueue_duration_sec": round(enqueue_duration, 4),
            "queue_depth": q_depth
        }


    @staticmethod
    def verify_logarithmic_spam_dampening(spam_count: int = 1000) -> Dict[str, Any]:
        """
        Proves that 1,000 duplicate reports on a single trivial issue
        cannot cause infinite linear priority escalation.
        """
        now = datetime.now(timezone.utc)
        spam_reports = [
            RawReport(
                report_id=f"SPAM-{i}",
                source_channel=SourceChannel.SOCIAL, # Low weight
                raw_text="Minor puddle on road",
                timestamp=now
            )
            for i in range(spam_count)
        ]
        
        spam_severity = SeverityCalculator.compute_cluster_severity(spam_reports)
        
        # Severe single report with high-reliability channel
        severe_report = [
            RawReport(
                report_id="SEVERE-01",
                source_channel=SourceChannel.RADIO,
                raw_text="Hospital flooded ICU power failed 20 patients critical",
                timestamp=now
            )
        ]
        severe_severity = SeverityCalculator.compute_cluster_severity(severe_report)
        
        return {
            "spam_count": spam_count,
            "spam_severity_score": spam_severity,
            "severe_single_report_score": severe_severity,
            "dampened_ratio": round(spam_severity / severe_severity, 2)
        }

stress_runner = StressBenchmarkRunner()
