# SHOONYA — Complete Change Log & Feature Documentation

> **Branch:** `shreya` | **Repo:** [Tushar27-git/Shoonya](https://github.com/Tushar27-git/Shoonya)
> Last Updated: 2026-08-31

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [UI / Frontend Changes](#ui--frontend-changes)
3. [Backend Changes](#backend-changes)
4. [New Components Added](#new-components-added)
5. [Key Features Implemented](#key-features-implemented)
6. [File-by-File Summary](#file-by-file-summary)

---

## Architecture Overview

Shoonya was transformed from a **tab-switching, map-hiding** interface into a **persistent-map, floating overlay** dashboard (SafeSphere-style).

```
Before:  [Sidebar] | [Tab View — entire screen replaced]
After:   [Sidebar] | [TacticalMap — always visible] + [Floating HUD Panels]
```

- **TacticalMap** always stays rendered at `z-index: 1` filling the full viewport
- **Overlays** (Route Analysis, etc.) float above the map at `z-index: 20`
- **Full-screen tabs** (Risk Analytics, Safety Audits, Settings etc.) cover the map at `z-index: 30` with a solid `var(--void)` background

---

## UI / Frontend Changes

### 1. `SenseConsole.tsx` — Complete Refactor

| Change | Details |
|--------|---------|
| Persistent map | `TacticalMap` now lives outside tab switching, always mounted |
| Overlay architecture | Each tab renders as `position: absolute` overlay above map |
| `primaryIncidentCategory` computed | Extracted from live incidents list and passed to `TacticalMap` |
| `mapCenter` state | Synced from `LocationSearch` to `TacticalMap` for live panning |
| `showRoutes` prop | Passes `true` to `TacticalMap` when `ROUTE_ANALYSIS` tab is active |
| Risk Analytics layout | Changed to `inset: 0`, solid `var(--void)` background, no map bleed |
| Safety Audits layout | Changed to `inset: 0`, solid `var(--void)` background, passes `location` + `incidents` |
| Route Analysis layout | Floats as right-side panel over map |

---

### 2. `TacticalMap.tsx` — Route Rendering & Clean Mode

| Change | Details |
|--------|---------|
| `showRoutes` prop | When true, draws 3 Leaflet polylines on the map |
| `primaryIncidentCategory` prop | Used in route label: "Safest (Avoids LANDSLIDE)" |
| **Safest Route** | Solid blue (`#4F46E5`), weight 6, permanent tooltip label |
| **Balanced Route** | Dashed gray (`#9CA3AF`), weight 4, permanent tooltip label |
| **Fastest Route** | Dashed red (`#EF4444`), weight 4, permanent tooltip label |
| Start/end markers | Green circle at origin, Red circle at incident zone |
| **Clean route mode** | When `showRoutes === true`, dark zone permanent tooltips are **suppressed** for a clean routing view |
| Dependency array updated | `showRoutes` and `mapCenter` added to useEffect deps |

---

### 3. `RouteAnalysis.tsx` — Location-Dynamic Stats

| Change | Details |
|--------|---------|
| Glassmorphic panel | `backdropFilter: blur(12px)`, semi-transparent dark background |
| **Dynamic stats per location** | Origin string hashed → unique ETA, distance, safety score per location |
| Safest Route stats | `35–55 min`, `6–10 km`, `90–97 score` — varies by location |
| Balanced / Fastest | Derived relative to Safest |
| "Why this route?" | Dynamic time difference and score improvement |
| Disaster-aware text | `primaryIncident` category used in description and advisory panel |

---

### 4. `RiskAnalytics.tsx` — Live Data, Solid Background

| Change | Details |
|--------|---------|
| Removed glassmorphism | No more `backdropFilter`/transparent background — clean full-page view |
| Live incident count | "LOGGED INCIDENTS" KPI reads from real `incidents` prop |
| Primary incident type | "PRIMARY INCIDENT TYPE" KPI shows highest-priority incident category |
| Location-aware text | All sub-labels reference `origin` (the selected location) |

---

### 5. `SafetyAudits.tsx` — Completely Rewritten

Generates **4 realistic audit records** based on the current location and primary disaster type. See [New Components Added](#new-components-added).

---

### 6. `LocationSearch.tsx` — Autocomplete Suggestions

| Change | Details |
|--------|---------|
| Live suggestion dropdown | As user types, Mapbox Geocoding API is queried |
| Debounced search | Query fires after each keystroke |
| Suggestion selection | Clicking a suggestion sets coordinates and location name |
| `onLocationFound` callback | Passes `[lat, lng]` and place name up to `SenseConsole` |

---

### 7. `index.css` — Styles Added

| Addition | Details |
|----------|---------|
| `.route-label` | Transparent background, no border — clean floating text on map |
| `.safest-label` | Indigo color (`#818CF8`) for Safest Route label |
| `.balanced-label` | Gray color (`#9CA3AF`) for Balanced Route label |
| `.fastest-label` | Red color (`#F87171`) for Fastest Route label |

---

## Backend Changes

### 8. `simulation/generator.py` — Geography-Aware Disasters

| Change | Details |
|--------|---------|
| Location-based hazard types | FLOOD in Assam/Northeast, LANDSLIDE in hill states, EARTHQUAKE in seismic zones |
| Coordinate-based classification | `lat/lng` used to determine appropriate disaster category |
| Multiple disaster types | Previously defaulted to FLOOD for all — now geography-correct |

---

### 9. `clustering/engine.py` — Hazard Extraction Fix

| Change | Details |
|--------|---------|
| `hazard_type` propagation | Fixed: `hazard_type` and `micro_environment_tag` now correctly passed into generated incidents |
| No more FLOOD default | Incidents now correctly reflect the hazard type from the simulation |
| `extracted_data` reading | Engine reads simulation's `extracted_data` to source correct category |

---

### 10. `dashboard/state_builder.py` — Audit Timeline & State

| Change | Details |
|--------|---------|
| `audit_timeline` included | Dashboard state now includes safety audit records when available |
| Live incident propagation | Ensures `incidents` list is correctly passed to frontend state |

---

## New Components Added

### `SafetyAudits.tsx` — Synthetic Disaster-Aware Audits

| Disaster | Actions Generated |
|----------|------------------|
| **FLOOD** | `EVACUATION_ROUTE_OVERRIDE`, `SHELTER_CAPACITY_INCREASE`, `PUMPING_STATION_ACTIVATION`, `BOAT_RESCUE_DISPATCH` |
| **LANDSLIDE** | `ROAD_CLOSURE_IMPOSED`, `GEOLOGICAL_SURVEY_TRIGGERED`, `HILLSIDE_EVACUATION_ORDER`, `DEBRIS_CLEARANCE_DISPATCHED` |
| **FIRE** | `FIRE_UNIT_DISPATCH`, `GAS_SUPPLY_CUTOFF`, `EXCLUSION_ZONE_ESTABLISHED`, `AERIAL_SUPPORT_REQUESTED` |
| **EARTHQUAKE** | `STRUCTURAL_INTEGRITY_LOCKDOWN`, `SEARCH_AND_RESCUE_DISPATCH`, `HOSPITAL_SURGE_PROTOCOL`, `AFTERSHOCK_MONITORING_ACTIVE` |
| **GENERAL_HAZARD** | `SAFETY_PERIMETER_ESTABLISHED`, `RESOURCE_PREPOSITION`, `PUBLIC_ADVISORY_ISSUED`, `INCIDENT_COMMAND_ACTIVATED` |

Each audit record includes:
- Unique `record_id` (seeded by location)
- `timestamp` (staggered minutes ago)
- `actor_id` + `actor_role` (FIELD_COMMANDER, CONTROL_ROOM_OPERATOR, etc.)
- `target_entity_type` + `target_entity_id` (ROUTE, SHELTER, ZONE, etc.)
- Location-specific `operator_rationale` explaining WHY the action was taken
- `record_hash` (SHA3-style synthetic cryptographic hash)
- Stats bar: Total Actions, Verified On-Chain, Tamper Attempts, Disaster Type

---

### `FleetStatus.tsx`
Displays the status of emergency fleet vehicles and resources. Shows availability, type, speed, and last-known location.

### `SafetyAlerts.tsx`
A real-time alert feed for active safety warnings, filtered by location and severity.

### `Settings.tsx`
Application settings panel for notification preferences, map layers, and operator credentials.

---

## Key Features Implemented

### ✅ Location Autocomplete Search
Type any location → live suggestions appear → select to fly map there and run location-aware simulation.

### ✅ Geography-Aware Simulation
Backend generates appropriate disasters based on real Indian geography:
- Northeast (Assam, Meghalaya) → FLOOD
- Himachal, Uttarakhand, Northeast hills → LANDSLIDE
- Gujarat, NE India → EARTHQUAKE
- Delhi, Punjab plains → URBAN_HAZARD, FIRE

### ✅ Route Analysis with Live Map
- 3 colored polylines drawn directly on the Leaflet map
- Permanent text labels: "Safest (Avoids LANDSLIDE)", "Balanced", "Fastest"
- Clean map mode: No-Signal Zone boxes hidden when viewing routes
- Right-side floating panel: ETA, distance, safety score vary per location

### ✅ Risk Analytics Full-Screen View
No map bleed, solid background. KPIs driven by live simulation data.

### ✅ Safety Audits — Disaster-Location Aware
Synthetic audit ledger generated per location + disaster. Changes completely when you switch location or run simulation.

### ✅ All Changes Pushed to Git
- Branch: `shreya`
- Remote: `https://github.com/Tushar27-git/Shoonya.git`
- Commit: `a8c34d9` — **38 files changed, 2368 insertions**

---

## File-by-File Summary

| File | Type | Change Summary |
|------|------|---------------|
| `frontend/src/components/SenseConsole.tsx` | Modified | Persistent map + overlay architecture |
| `frontend/src/components/TacticalMap.tsx` | Modified | Route polylines, clean mode, labels |
| `frontend/src/components/RouteAnalysis.tsx` | Modified | Glassmorphic panel, dynamic stats per location |
| `frontend/src/components/RiskAnalytics.tsx` | Modified | Full-page solid view, live data |
| `frontend/src/components/SafetyAudits.tsx` | **Rewritten** | Disaster-aware synthetic audits |
| `frontend/src/components/LocationSearch.tsx` | Modified | Autocomplete suggestions dropdown |
| `frontend/src/components/Header.tsx` | Modified | Telemetry display updates |
| `frontend/src/components/CopilotModal.tsx` | Modified | AI copilot integration |
| `frontend/src/components/EmergencyContacts.tsx` | Modified | Location-aware contacts |
| `frontend/src/components/SaathiProfile.tsx` | Modified | Profile updates |
| `frontend/src/components/FleetStatus.tsx` | **New** | Fleet tracking panel |
| `frontend/src/components/SafetyAlerts.tsx` | **New** | Live safety alert feed |
| `frontend/src/components/Settings.tsx` | **New** | App settings panel |
| `frontend/src/hooks/useDashboardState.ts` | Modified | State management hooks |
| `frontend/src/index.css` | Modified | Route label styles, animations |
| `frontend/.env` | **New** | Mapbox token config |
| `backend/app/simulation/generator.py` | Modified | Geography-aware disaster generation |
| `backend/app/clustering/engine.py` | Modified | Hazard type propagation fix |
| `backend/app/dashboard/state_builder.py` | Modified | Audit timeline + incident state |
| `backend/app/dashboard/router.py` | Modified | API route updates |
| `backend/app/ingestion/router.py` | Modified | Data ingestion fixes |
| `backend/app/main.py` | Modified | App entrypoint updates |
| `backend/app/models/domain.py` | Modified | Domain model additions |
| `backend/app/models/enums.py` | Modified | Enum additions for hazard types |
| `backend/app/needs/generator.py` | Modified | Needs generator updates |
| `backend/app/operations/service.py` | Modified | Operations service updates |
| `backend/app/simulation/router.py` | Modified | Simulation API updates |
| `shoonya_architecture_guide.md` | **New** | Architecture documentation |
