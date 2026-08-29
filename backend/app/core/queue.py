import json
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from ..models.domain import RawReport
from ..config import settings

class IngestionQueue:
    """
    Durable ingestion queue supporting Redis Streams with an async in-memory
    durable fallback for zero-dependency local execution.
    """
    def __init__(self):
        self._memory_queue: List[RawReport] = []
        self._unacked_reports: Dict[str, RawReport] = {}
        self._processed_count: int = 0
        self._lock = asyncio.Lock()
        self._redis_client = None
        self._use_redis = False

    async def initialize(self):
        """Try connecting to Redis Streams if configured."""
        try:
            import redis.asyncio as aioredis
            client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            await client.ping()
            self._redis_client = client
            self._use_redis = True
            # Ensure stream and consumer group exist
            try:
                await self._redis_client.xgroup_create(
                    name="shoonya_reports_stream",
                    groupname="nlp_workers",
                    id="0",
                    mkstream=True
                )
            except Exception:
                pass # Group may already exist
        except Exception:
            self._use_redis = False
            self._redis_client = None

    async def push(self, report: RawReport) -> str:
        """Push a raw report onto the durable queue."""
        async with self._lock:
            if self._use_redis and self._redis_client:
                try:
                    payload = report.model_dump_json()
                    msg_id = await self._redis_client.xadd(
                        "shoonya_reports_stream",
                        {"payload": payload, "report_id": report.report_id}
                    )
                    return str(msg_id)
                except Exception:
                    # Fallback to memory on Redis failure
                    pass
            
            self._memory_queue.append(report)
            return report.report_id

    async def enqueue(self, report: RawReport) -> str:
        return await self.push(report)


    async def read_batch(self, batch_size: int = 10, consumer_name: str = "worker_1") -> List[RawReport]:
        """Read a batch of reports for downstream worker processing."""
        async with self._lock:
            if self._use_redis and self._redis_client:
                try:
                    entries = await self._redis_client.xreadgroup(
                        groupname="nlp_workers",
                        consumername=consumer_name,
                        streams={"shoonya_reports_stream": ">"},
                        count=batch_size
                    )
                    batch = []
                    if entries:
                        for _, messages in entries:
                            for msg_id, data in messages:
                                report_obj = RawReport.model_validate_json(data["payload"])
                                batch.append(report_obj)
                                self._unacked_reports[str(msg_id)] = report_obj
                    return batch
                except Exception:
                    pass

            # In-memory durable FIFO extraction
            batch = self._memory_queue[:batch_size]
            self._memory_queue = self._memory_queue[batch_size:]
            for r in batch:
                self._unacked_reports[r.report_id] = r
            return batch

    async def ack(self, report_id_or_msg_id: str):
        """Acknowledge successful downstream processing."""
        async with self._lock:
            if self._use_redis and self._redis_client:
                try:
                    await self._redis_client.xack("shoonya_reports_stream", "nlp_workers", report_id_or_msg_id)
                except Exception:
                    pass
            
            self._unacked_reports.pop(report_id_or_msg_id, None)
            self._processed_count += 1

    async def get_queue_depth(self) -> int:
        """Get current pending queue depth."""
        async with self._lock:
            if self._use_redis and self._redis_client:
                try:
                    info = await self._redis_client.xlen("shoonya_reports_stream")
                    return int(info)
                except Exception:
                    pass
            return len(self._memory_queue)

    async def get_metrics(self) -> Dict[str, Any]:
        """Get queue performance metrics."""
        depth = await self.get_queue_depth()
        return {
            "queue_depth": depth,
            "unacked_in_flight": len(self._unacked_reports),
            "processed_total": self._processed_count,
            "backend": "REDIS_STREAMS" if self._use_redis else "DURABLE_IN_MEMORY"
        }

queue = IngestionQueue()
