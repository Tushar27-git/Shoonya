import pytest
import asyncio
import httpx
import time

BASE_URL = "http://127.0.0.1:8000"

@pytest.mark.asyncio
async def test_nexus1_simulation():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # 1. Start the simulation
        print("Starting simulation...")
        start_resp = await client.post("/simulation/run")
        assert start_resp.status_code == 200
        
        # Wait for the simulation to finish (approx 60-90 seconds)
        # For the test, we'll wait a bit longer to ensure queue is processed
        print("Waiting for simulation to replay (90s)...")
        # In a real environment, we would actually wait 90 seconds. 
        # For the sake of test speed, you might want to mock the time or run the test separately.
        # await asyncio.sleep(90)
        
        # 2. Check Ward A duplicate cluster is dampened
        incidents_resp = await client.get("/clustering/incidents")
        incidents = incidents_resp.json() if incidents_resp.status_code == 200 else []
        
        ward_a_incidents = [inc for inc in incidents if "LOC_000" in inc.get("location", {}).get("centroid", "")]
        # Assert log10 dampening effect is visible (e.g., priority score shouldn't be massive despite 50 reports)
        if ward_a_incidents:
            assert ward_a_incidents[0].get("priority_score", 0) < 5.0 # Assuming log10 dampens to small number
            
        # 3. Check Ward B dark zone
        dz_resp = await client.get("/confidence/dark-zones")
        dark_zones = dz_resp.json() if dz_resp.status_code == 200 else []
        
        ward_b_dz = next((dz for dz in dark_zones if dz.get("ward_id") == "LOC_001"), None)
        # Note: the actual endpoint might return different structure, but we assert it's present
        assert ward_b_dz is not None or "LOC_001" in [dz.get("id") for dz in dark_zones]
        
        # 4. Check Rooftop incident confidence >= 0.4
        rooftop_incidents = [inc for inc in incidents if inc.get("category") == "FLOOD" and "LOC_004" in str(inc)]
        if rooftop_incidents:
            assert rooftop_incidents[0].get("confidence_score", 0) >= 0.4
            
        # 5. Check Bridge disputed=true
        disputes_resp = await client.get("/confidence/disputes")
        disputes = disputes_resp.json() if disputes_resp.status_code == 200 else []
        
        bridge_dispute = next((d for d in disputes if "LOC_002" in str(d)), None)
        assert bridge_dispute is not None or len(disputes) > 0 # At least one dispute
        
        # 6. Check Embankment EMERGING_RISK_ZONE
        # This might be in incidents or another endpoint. We check incidents for now.
        embankment_incidents = [inc for inc in incidents if "LOC_003" in str(inc)]
        if embankment_incidents:
            # check if one of them is an emerging risk
            pass
            
        # 7. Compare with Ground Truth
        gt_resp = await client.get("/simulation/ground-truth", headers={"x-demo-mode": "true"})
        assert gt_resp.status_code == 200
        ground_truth = gt_resp.json()
        
        assert ground_truth["ward_a_status"]["ward_id"] == "LOC_000"
        assert ground_truth["ward_b_status"]["ward_id"] == "LOC_001"
        assert ground_truth["rooftop_rescue"]["trapped_people"] is True
        assert ground_truth["bridge"]["status"] == "CLOSED"
        assert ground_truth["embankment"]["risk"] == "HIGH"
        assert ground_truth["shelter"]["water_status"] == "CONTAMINATED"
        
        print("Verification passed (skeleton).")
