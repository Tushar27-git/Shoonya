import pytest
import asyncio
from app.dashboard.state_builder import build_dashboard_state
from app.ingestion.processor import zone_tracker

def test_dashboard_dark_zone_invariant():
    async def run_test():
        # Fetch baseline empty state
        initial_state = await build_dashboard_state()
        # At start, we don't know what's in the state (could be non-zero if other tests mutated it),
        # but the invariant is counter == array length
        assert len(initial_state["dark_zones"]) == initial_state["counters"]["dark_zones"]
        
        # Manually insert one dark zone
        zone_tracker.set_telecom_status("WARD-04", "DARK")
        
        state = await build_dashboard_state()
        
        # Assert counter correctly derived from array
        assert len(state["dark_zones"]) >= 1
        assert state["counters"]["dark_zones"] == len(state["dark_zones"])
        
    asyncio.run(run_test())
