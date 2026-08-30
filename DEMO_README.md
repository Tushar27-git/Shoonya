# SHOONYA Demo README

## Running the Backend
1. Open a terminal and navigate to `backend/`.
2. Run `fastapi run app/main.py`
3. The API will be available at `http://localhost:8000`.

## Running the Frontend
1. Open a second terminal and navigate to `frontend/`.
2. Run `npm install` (if not already installed).
3. Run `npm run dev`.
4. Open the application at `http://localhost:5174`.

## Running the Simulation
1. Ensure both frontend and backend are running.
2. In the frontend, the global controls are at the top. Click **Run Simulation**.
3. You can click **Reveal Ground Truth** anytime after starting to see the exact state vs the dashboard state.

## Live Judging Checklist (Phase 10)
Follow these steps strictly to demonstrate the platform to judges:

1. **Start**: Click "Run Simulation". Observe the `SIMULATION RUNNING` status.
2. **Data Ingestion**: Wait 12 seconds. Watch the "RAW REPORTS" spike by 50 in the Impact Board, then see them group into a minimal number of "CLUSTERS".
3. **Rooftop Emergency**: Watch the priority queue; you will see an incident labeled `CRITICAL` with `CHILDREN` vulnerability flag.
4. **Dark Zone**: At 24 seconds, observe the grey hatched polygon appear on the map for Ward C. No reports originate from this zone.
5. **Dispute Detection**: Watch the Priority Queue or map for the dashed orange/purple segment representing the `BR04` conflicting claims.
6. **Task Generation**: At 36 seconds, the SH03 shelter update creates a logistics task. Switch to the NGO Tasks tab to view it.
7. **Weak Signal / Emerging Risk**: At 44 seconds, observe the amber ring (Emerging Risk) near DY02 on the map.
8. **Action**: Click a map marker or Priority Queue item and approve the AI recommended action using the mockup Auth.
9. **Saathi Rejection Demo**: Go to the Saathi Profile tab. Try to accept a water rescue task. It will be rejected (`403 Forbidden`) with a visible safety warning because Saathis are not permitted for high-risk water rescue.
10. **Amplify Public Alerts**: Go to the Amplify Cards tab. View the drafted cards, noting all PII is redacted. Approve one.
11. **Verification**: Go to the Impact Board. It should reflect the newly approved cards, completed tasks, and total events.
12. **Reveal Truth**: Click "Reveal Ground Truth" to show the judge the hidden 60-second JSON fact sheet vs the dashboard state.
13. **Reset**: Click "Reset Demo" to return to baseline.

*Note: All interfaces are marked `⚠️ SIMULATION MODE - NOT LIVE TELEMETRY ⚠️` as a demo safety precaution.*
