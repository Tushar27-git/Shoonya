import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.mark.asyncio
async def test_saathi_roster_endpoints():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Test getting the full roster
        resp = await client.get("/saathi/roster")
        assert resp.status_code == 200
        roster = resp.json()
        assert len(roster) >= 10
        assert len(roster) <= 15
        
        # Test getting a specific saathi profile
        saathi_id = roster[0]["id"]
        resp_single = await client.get(f"/saathi/roster/{saathi_id}")
        assert resp_single.status_code == 200
        profile = resp_single.json()
        assert profile["id"] == saathi_id
        assert "role_level" in profile

@pytest.mark.asyncio
async def test_ingestion_reporter_role_level():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Test with a valid Saathi ID
        # Wait, the ingestion API for vague returns the report_id, but the actual report is enqueued.
        # We can't directly read the enqueued report easily from here without popping the queue.
        # We can use the RawReport direct endpoint to verify the model accepts it, 
        # or we test the helper function.
        
        # Let's test the queue depth before and after, and pop the queue to check
        from app.core.queue import queue
        
        # Flush queue for clean test
        while await queue.get_queue_depth() > 0:
            await queue.dequeue()
            
        # Ingest a vague report from a valid Saathi
        vague_payload_saathi = {
            "raw_text": "Water rising",
            "sender_id": "SAATHI-001",
            "channel": "SMS"
        }
        
        resp_saathi = await client.post("/reports/vague", json=vague_payload_saathi)
        assert resp_saathi.status_code == 201
        
        report_saathi = await queue.dequeue()
        assert report_saathi is not None
        assert report_saathi.reporter_role_level == 1 # SAATHI-001 is level 1 in our mock
        
        # Ingest a vague report from an unknown user
        vague_payload_anon = {
            "raw_text": "Water rising again",
            "sender_id": "CITIZEN_001",
            "channel": "SMS"
        }
        
        resp_anon = await client.post("/reports/vague", json=vague_payload_anon)
        assert resp_anon.status_code == 201
        
        report_anon = await queue.dequeue()
        assert report_anon is not None
        assert report_anon.reporter_role_level is None
