import pytest
from fastapi.testclient import TestClient
from app.ingestion.router import router
from app.core.queue import queue
from fastapi import FastAPI
import asyncio

app = FastAPI()
app.include_router(router)

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_teardown():
    # Reset queue before each test
    queue._memory_queue.clear()
    queue._unacked_reports.clear()
    yield

def test_precise_report_submit():
    payload = {
        "report_id": "REP_PRECISE_001",
        "raw_evidence_text": "Flood near main bridge.",
        "channel": "SMS",
        "source_id": "SRC_123"
    }
    response = client.post("/reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "QUEUED"
    assert data["queue_depth"] == 1
    
    # Assert queue receipt
    assert len(queue._memory_queue) == 1
    assert queue._memory_queue[0].report_id == "REP_PRECISE_001"

def test_vague_location_report_submit():
    payload = {
        "raw_text": "Trapped in building.",
        "sender_id": "SRC_456",
        "channel": "SMS",
        "landmark_hint": "Ward A" # Or some string that matches gazetteer
    }
    response = client.post("/reports/vague", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "QUEUED"
    assert data["location_precision"] == "LOW"
    assert data["radius"] > 0
    
    # Assert queue receipt
    assert len(queue._memory_queue) == 1
    assert "REP-VAGUE" in queue._memory_queue[0].report_id

def test_sms_code_submit():
    payload = {
        "code": "911",
        "sender_id": "SRC_789",
        "location_hint": "Ward B"
    }
    response = client.post("/reports/sms-code", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "RESOLVED_AND_QUEUED"
    assert data["category"] == "FLOOD"
    
    # Assert queue receipt
    assert len(queue._memory_queue) == 1
    report = queue._memory_queue[0]
    assert report.channel == "SMS_CODE"
    assert report.raw_evidence_text == "CODE_911: Ward B"

def test_zone_dark_submit():
    # Assuming W04 is marked as DARK in the router logic
    response = client.get("/reports/zone-status/W04")
    assert response.status_code == 200
    data = response.json()
    assert data["channel_status"] == "DARK"
