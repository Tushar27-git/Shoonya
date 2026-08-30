# SHOONYA Crisis Intelligence Platform — Branch `paavni` Changes & Redesign

## Branch & Remote Information
- **Branch Name:** `paavni`
- **Remote Tracking:** `origin/paavni` (Repository: [https://github.com/Tushar27-git/Shoonya.git](https://github.com/Tushar27-git/Shoonya.git))
- **Base Branch:** `main`

---

## 1. Executive Summary
The `paavni` branch contains the full crisis intelligence platform suite, including the **AI Verification & Fake Report Detection Pipeline**, **FastAPI Backend Services**, **End-to-End Automated Testing Harness**, and a complete **Premium Minimal UI/UX Redesign** based on a unified **Black + Blue + Subtle Glassmorphism** design system.

Key Highlights:
1. **Design System & Visual Identity**:
   - Palette: Deep charcoal & void black surfaces (`#06070a`, `#0a0d14`, `#0f1420`) with controlled electric blue accents (`#2563eb`, `#3b82f6`, `#60a5fa`).
   - Subtle Glassmorphism (`backdrop-filter: blur(14px)`) applied strictly to selected active cards, floating headers, tooltips, and modals.
   - Low-contrast precision borders (`rgba(255, 255, 255, 0.07)` to `0.11`).
   - Strict functional semantic colors (Green for verified/success, Amber for dispute/warning, Coral/Red for critical urgency).
   - Crisp modern sans-serif typography (`Inter`, `Plus Jakarta Sans`, `Outfit`, and `JetBrains Mono` for telemetry & code).
   - Fully responsive layout across Desktop (3-column command grid), Laptop, Tablet, and Mobile viewports with a dedicated pane switcher.
2. **AI-Powered Incident Verification Engine** (`/ai/verify`):
   - Multi-feature Random Forest ML classification model detecting unverified/fake crisis reports from signal corroboration, spatial, temporal, media authenticity, and anomaly metrics.
3. **Interactive Tactical Operations**:
   - Upgraded Tactical Map with dark operational tile layers, incident cluster markers, route passability, silent dark-zone detection, and collapsible legend.
   - Live Incident Triage queue with real-time filters and search.
   - Multi-tab Operational Console (MILP Dispatch solver & Human Approval gate, What-If weight adjusters, Outbound Reverse SOS broadcast composer, Evidence Dossier with dispute diffing, and SHA-256 Tamper-evident Audit chain).
   - Interactive EOC Copilot assistant with citations and SOP action dispatching.

---

## 2. Commit History on `paavni`

| Commit Hash | Commit Message | Scope |
| :--- | :--- | :--- |
| `096cfaf` | `docs: add CHANGES_PAAVNI_BRANCH.md documenting all branch updates` | Documentation |
| `a86ca03` | `feat(ai): integrate AI fake report verification model, API router, and UI verification tests` | Backend AI Verification, API Router, Playwright Tests, `.gitignore` |
| `a343afe` | `feat: enhance UI/UX, add Landing Page, stabilize backend APIs and Copilot assistant` | Frontend UI/UX, Landing Page, Tactical Map, Copilot Modal, Backend Domain APIs |

---

## 3. Detailed Component-by-Component Redesign Breakdown

### A. Core Design System & Tokens (`frontend/src/index.css`)
- Replaced ad-hoc styling with a unified design token architecture:
  - Surface hierarchy: `--bg-root`, `--bg-surface`, `--bg-surface-elevated`, `--bg-surface-hover`, `--bg-input`.
  - Glass tokens: `--bg-glass`, `--bg-glass-active`, `--bg-glass-overlay`, `--backdrop-blur`.
  - Blue accent tokens: `--blue-primary`, `--blue-bright`, `--blue-light`, `--blue-subtle`, `--blue-border`, `--blue-glow`.
  - Semantic tokens: `--color-success`, `--color-warning`, `--color-critical`.
- Minimalist custom scrollbar styling with dark track.
- Leaflet dark tactical theme customization with custom glassmorphic zoom buttons and popup wrappers.

### B. Mission Overview & Landing Page (`frontend/src/components/LandingPage.tsx`)
- Sleek sticky glassmorphic top navigation bar with system status readout.
- High-impact hero section with typography hierarchy, blue pill badge, and launch CTA.
- 4 Core Capability cards featuring clean dark surfaces, low-contrast borders, and hover elevations.
- Bottom telemetry strip with live incident counters and SHA-256 cryptographic audit status.

### C. Top Header & Telemetry Strip (`frontend/src/components/Header.tsx`)
- Glassmorphic top navigation bar.
- Real-time telemetry badges (Queue depth, Active incidents, Disputes, Dark zones, CP-SAT Solver status, and Ingestion-to-map latency).
- Action buttons: Overview return, Copilot trigger, and Live / Paused telemetry toggle.

### D. Incident Triage Feed (`frontend/src/components/IncidentFeed.tsx`)
- Left command panel with instant search by ID, ward, or hazard type.
- Triage filter tabs: `ALL`, `CRITICAL` ($P > 1.0$), `DISPUTES`, `ROOFTOP`.
- Incident Cards:
  - Active card gets subtle glassmorphism (`glass-active`) and blue border (`var(--blue-bright)`).
  - Priority score ($P_i$), hazard chips, micro-environment badges, victim bounds, and ZeroGauge confidence meter.

### E. Tactical Geospatial Map (`frontend/src/components/TacticalMap.tsx`)
- Dark basemap rendering Raipur East operational sector.
- Floating glassmorphic header badge displaying active sector and incident count.
- Floating glassmorphic collapsible legend for all tactical map layers.
- Interactive layers: Ward centers, Silent Dark Zone (Ward 09) hatched polygon with population estimates, road passability, venue surge metrics, incident markers, and fleet resources.

### F. Timeline Replay Bar (`frontend/src/components/TimeReplaySlider.tsx`)
- Glassmorphic bottom control bar.
- Play/Pause toggle, speed multiplier toggles ($1\times, 2\times, 5\times$), scrubber with blue accent track, discrete $+15\text{m}$ simulation tick trigger, and simulation reset.

### G. Operational Console & Tabs (`frontend/src/components/OperationalConsole.tsx`)
- Unified tab bar (`DISPATCH`, `WHAT-IF`, `REVERSE SOS`, `EVIDENCE`, `AUDIT`) with blue active indicators.
- **Dispatch Plan**: MILP solve duration, served/unserved counts, assignment cards, Human Operator Authorization gate with Override modal.
- **What-If Sliders**: Real-time formula weight adjusters ($w_1 \dots w_5$).
- **Reverse SOS**: Advisory type selector, multi-channel dispatch checkboxes, ETA slider, multi-lingual preview (`HI`, `HINGLISH`, `EN`), and commander rationale logging.
- **Evidence Dossier**: Constituent reports, material dispute diffing (Claim A vs Claim B), and sensor fusion actions (Optical/SAR CV, Drone Tasking, Cluster Split).
- **Cryptographic Audit**: Tamper-evident SHA-256 log blocks with integrity verification.

### H. AI Crisis Response Copilot (`frontend/src/components/CopilotModal.tsx`)
- Centered modal dialog with backdrop blur.
- Header with SITREP generator and close controls.
- Structured message thread with commander inquiry vs copilot briefing bubbles.
- Clickable citation pills linking directly to incidents on the tactical map.
- Warning caveats with red alert styling.
- Executable proposed action buttons with blue hover glow.
- Quick prompt suggestion chips and unified input bar.

### I. Confidence ZeroGauge (`frontend/src/components/ZeroGauge.tsx`)
- Minimalist confidence progress meter with semantic tier coloring and dispute hatched overlay.

### J. Responsive Layout Orchestration (`frontend/src/App.tsx`)
- Desktop/Laptop: Full 3-column tactical command grid.
- Tablet/Mobile: Responsive pane navigation bar allowing fluid toggling between Incident Queue, Tactical Map, and Operations Console without horizontal scrolling or crowded UI.

---

## 4. Machine Learning & AI Verification Module (`backend/app/ai/`)
- **`backend/app/ai/trainer.py`**: RandomForestClassifier training script with dataset loader, feature extraction, and evaluation metrics.
- **`backend/app/ai/fake_report_model.joblib`**: Serialized trained model artifact.
- **`backend/app/ai/synthetic_data.csv`**: Crisis report synthetic training dataset.
- **`backend/app/ai/router.py`**: FastAPI router exposing `POST /ai/verify`.
- **`backend/app/main.py`**: Main application router registration.

---

## 5. Automated Testing Suite (`tests/`)
- **`tests/verification.spec.ts`**: Playwright test suite for dashboard loading, map rendering, incident feeds, console tabs, and telemetry verification.
