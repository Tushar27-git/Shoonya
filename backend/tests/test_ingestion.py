import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.queue import queue
from app.ingestion.processor import LocationResolver, zone_tracker, KNOWN_DISTRICT_ZONES
from app.models.enums import LocationPrecision, SourceChannel, TelecomStatus
from app.models.domain import RawReport

client = TestClient(app)

@pytest.mark.asyncio
async def test_multi_channel_ingestion():
    """Verify ingestion across multiple distinct channels."""
    channels = [
        ("SMS", "Paani 2nd floor tak aa gaya. 6 log hain.", "hi"),
        ("VOICE", "Voice recording transcript from ward 7 school", "en"),
        ("RADIO", "Unit 4 reports road cut near bridge approach", "en"),
        ("SOCIAL", "Please send help hospital road submerged!!", "en"),
        ("WEB", "Citizen report: 4 elderly trapped on terrace", "en"),
        ("SATELLITE", "Satellite optical scan detected flood extent 62%", "en"),
        ("DRONE", "Drone survey indicates road R17 impassable", "en"),
    ]

    for channel, text, lang in channels:
        payload = {
            "source_channel": channel,
            "raw_text": text,
            "language": lang,
            "location_text": "Ward 07",
        }
        res = client.post("/reports", json=payload)
        assert res.status_code == 202
        data = res.json()
        assert data["status"] == "QUEUED"
        assert data["report_id"].startswith("REP-")

def test_vague_location_resolution():
    """
    Verify the safeguard rule:
    Vague locations must not be turned into fake precise points.
    """
    # 1. Exact GPS coordinates -> HIGH precision
    loc_high, zone_high = LocationResolver.resolve(
        raw_text="Trapped here",
        lat=26.8512,
        lng=80.9488
    )
    assert loc_high.precision == LocationPrecision.HIGH
    assert loc_high.lat == 26.8512
    assert loc_high.lng == 80.9488

    # 2. Ward + specific building -> MEDIUM precision
    loc_med, zone_med = LocationResolver.resolve(
        raw_text="Govt school ground floor flooded in Ward 07",
    )
    assert loc_med.precision == LocationPrecision.MEDIUM
    assert zone_med == "WARD-07"

    # 3. Only ward mentioned -> LOW precision
    loc_low, zone_low = LocationResolver.resolve(
        raw_text="Somewhere in Ward 07 water is rising",
    )
    assert loc_low.precision == LocationPrecision.LOW
    assert zone_low == "WARD-07"

    # 4. Completely vague phrase -> LOW precision with coarse centroid
    loc_vague, zone_vague = LocationResolver.resolve(
        raw_text="paani bahut badh gaya hai banyan tree ke paas",
    )
    assert loc_vague.precision == LocationPrecision.LOW
    assert loc_vague.address == "Unspecified district location"

@pytest.mark.asyncio
async def test_queue_concurrency_and_durability():
    """
    Verify durable queue behavior under concurrent burst load:
    - 50 concurrent pushes
    - 0 data drops
    - FIFO batch reading
    - ACK tracking
    """
    # Clear local queue state
    queue._memory_queue.clear()
    queue._unacked_reports.clear()
    queue._processed_count = 0

    reports = [
        RawReport(
            report_id=f"BURST-REP-{i:03d}",
            source_channel=SourceChannel.SMS,
            raw_text=f"Burst emergency report #{i}",
            location_precision=LocationPrecision.LOW,
        )
        for i in range(50)
    ]

    # Push 50 items concurrently
    await asyncio.gather(*(queue.push(r) for r in reports))

    depth = await queue.get_queue_depth()
    assert depth == 50

    # Read batch of 15
    batch_1 = await queue.read_batch(batch_size=15)
    assert len(batch_1) == 15
    assert batch_1[0].report_id == "BURST-REP-000"

    depth_after_batch = await queue.get_queue_depth()
    assert depth_after_batch == 35

    metrics_1 = await queue.get_metrics()
    assert metrics_1["unacked_in_flight"] == 15
    assert metrics_1["processed_total"] == 0

    # ACK the first 15 items
    for r in batch_1:
        await queue.ack(r.report_id)

    metrics_2 = await queue.get_metrics()
    assert metrics_2["unacked_in_flight"] == 0
    assert metrics_2["processed_total"] == 15

def test_zone_sensing_mode_dark_zone():
    """
    Verify zone activity and silence detection:
    - Zero incoming reports != safe
    - Silence >= 45 min triggers DARK state
    - High-population silent zone flagged as HIGH priority information gap
    """
    now = datetime.now(timezone.utc)
    
    # 1. Ward 07 has recent report -> LIVE
    zone_tracker.record_activity("WARD-07", now - timedelta(minutes=5))
    w7_status = zone_tracker.evaluate_zone_status("WARD-07", now)
    assert w7_status["is_dark"] is False
    assert w7_status["operational_status"] == "REPORTING"

    # 2. Ward 09 has silence for 60 minutes -> DARK
    zone_tracker.record_activity("WARD-09", now - timedelta(minutes=60))
    w9_status = zone_tracker.evaluate_zone_status("WARD-09", now)
    assert w9_status["is_dark"] is True
    assert w9_status["operational_status"] == "NO DATA — UNKNOWN STATUS"
    assert w9_status["population"] == 8600
    assert w9_status["information_gap_priority"] == "HIGH"

    # 3. Direct telecom blackout on Ward 04 -> DARK
    zone_tracker.set_telecom_status("WARD-04", TelecomStatus.DARK)
    w4_status = zone_tracker.evaluate_zone_status("WARD-04", now)
    assert w4_status["is_dark"] is True
    assert w4_status["telecom_status"] == "DARK"

def test_ingestion_api_queue_and_zone_endpoints():
    """Verify GET /ingestion/queue and GET /ingestion/zones endpoints."""
    q_res = client.get("/ingestion/queue")
    assert q_res.status_code == 200
    q_data = q_res.json()
    assert "queue_depth" in q_data
    assert "processed_total" in q_data

    z_res = client.get("/ingestion/zones")
    assert z_res.status_code == 200
    z_data = z_res.json()
    assert len(z_data) == len(KNOWN_DISTRICT_ZONES)
    assert any(z["zone_id"] == "WARD-07" for z in z_data)
