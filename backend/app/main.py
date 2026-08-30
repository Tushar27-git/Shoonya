from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.ingestion.router import router as ingestion_router
from app.dispatch.router import router as dispatch_router
from app.needs.router import router as needs_router
from app.amplify.router import router as amplify_router
from app.saathi.router import router as saathi_router

import asyncio
from contextlib import asynccontextmanager
from app.core.queue import queue
from app.clustering.engine import clustering_engine

async def queue_worker():
    while True:
        try:
            batch = await queue.read_batch(batch_size=10)
            for report in batch:
                clustering_engine.process_report(report)
                await queue.ack(report.report_id)
            if not batch:
                await asyncio.sleep(1)
        except Exception as e:
            print(f"Queue worker error: {e}")
            await asyncio.sleep(1)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    task = asyncio.create_task(queue_worker())
    yield
    # Shutdown
    task.cancel()

app = FastAPI(title="SHOONYA Crisis Intelligence System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.dashboard.router import router as dashboard_router

from app.simulation.router import router as simulation_router

from app.tasks.router import router as tasks_router
from app.incidents.router import router as incidents_router
from app.operations.router import router as operations_router
from app.help.router import router as help_router

app.include_router(ingestion_router)
app.include_router(dispatch_router)
app.include_router(needs_router)
app.include_router(amplify_router)
app.include_router(saathi_router)
app.include_router(dashboard_router)
app.include_router(tasks_router)
app.include_router(incidents_router)
app.include_router(operations_router)
app.include_router(help_router)
app.include_router(simulation_router)

from app.copilot.router import router as copilot_router
app.include_router(copilot_router)
@app.get("/health")
async def health_check():
    return {"status": "OPERATIONAL", "system": "SHOONYA"}

@app.get("/telemetry")
async def get_telemetry():
    from app.core.queue import queue
    depth = await queue.get_queue_depth()
    return {
        "queue_depth": depth,
        "active_incidents": 0,
        "disputed_incidents": 0,
        "dark_zones": 1,
        "solver_status": "READY",
        "ingestion_to_map_latency_sec": 0.12,
        "timestamp": "2026-08-30T12:00:00Z"
    }
