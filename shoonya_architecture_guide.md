# SHOONYA: System Architecture & Feature Guide

This document explains the core functionalities of the **SHOONYA (Crisis Intelligence & Decision Support Platform)**, specifically detailing the frontend dashboard UI, the map mechanics, incident ingestion, and location tracking. This guide is designed to help anyone (or any AI) understand the system's current state and capabilities.

---

## 1. The Header (Upper Telemetry Bar)

The header at the top of the dashboard acts as the system's "vital signs" monitor. It displays real-time telemetry from the backend (`app/dashboard/state_builder.py`):

*   **AI ADVISORY / HUMAN COMMAND**: A toggle button that opens the AI Copilot. This allows the operator to chat with an LLM that has full context of the current disaster state, enabling it to suggest dispatch strategies or generate SITREPs (Situation Reports).
*   **SIMULATION STREAM**: A toggle to connect/disconnect from the live data firehose.
*   **QUEUE**: Represents raw, unprocessed messages (SMS, tweets, sensor pings) sitting in the backend ingestion queue waiting for NLP extraction.
*   **ACTIVE INCIDENTS**: The total number of distinct, clustered crisis events currently tracked on the map (e.g., a localized flood, a building collapse).
*   **DISPUTES**: The number of incidents flagged for "Material Contradiction" (e.g., a Twitter bot claims a bridge collapsed, but a verified NGO volunteer on the ground reports it is safe).
*   **DARK ZONES**: The number of localized geographical zones where telecom infrastructure has failed, creating an information vacuum.
*   **ADVISORY SOLVER**: Shows whether the backend optimization algorithms (which decide which ambulance goes where) are currently `READY` or `COMPUTING`.

## 2. The Tactical Map & Simulation

The Tactical Map is the core visualizer of the system, built using Leaflet with a custom dark operational theme.

### How the Simulation Works
When you click **"▶ RUN SIMULATION"**, the frontend sends a `POST /simulation/run` request to the backend. The backend's Simulation Engine (`app/simulation/generator.py`) begins injecting synthetic, pre-scripted disaster data (like a massive flood in Lucknow) into the ingestion pipeline. This mimics hundreds of citizens reporting emergencies simultaneously.

The frontend uses a React hook (`useDashboardState`) to poll the `GET /dashboard/state` endpoint every few seconds. As the backend processes the simulation data, the frontend map automatically updates to show:
*   **Red Circles (Critical)**: Priority score > 1.0.
*   **Amber Dashed Circles (Disputed)**: Conflicting information requires human verification.
*   **Dark Grey Halos (Dark Zones)**: Areas with no signal.
*   **Cyan Outlines (Resources)**: Available ambulances or response teams.

## 3. How Incidents are Actually Reported

SHOONYA does not just blindly put every text message on a map. It uses an AI-driven pipeline:

1.  **Ingestion (`POST /reports`)**: A citizen sends a text: *"Huge fire at the main market, people trapped!"*
2.  **NLP Extraction (`app/nlp/extractor.py`)**: An LLM parses the messy text and converts it into a structured `Claim` object, identifying the *category* (Fire), *location* (Main Market), and *precision* (Medium).
3.  **Clustering (`app/clustering/engine.py`)**: If 50 people text about the fire, the engine geometrically and semantically clusters them into **ONE** `Incident` rather than cluttering the map with 50 pins.
4.  **Prioritization (`app/priority/engine.py`)**: The system looks at keywords ("trapped"), infrastructure density, and active threats to assign a Priority Score.
5.  **Rendering**: The single, clustered incident appears on the map.

## 4. Location-to-Location (The "From" & "To" Search)

The Location Search bar is a new addition to give the dashboard a localized, citizen-centric utility (similar to Google Maps).

*   **How it Works**: When a user types a city or address into the "From" or "To" inputs and hits Enter, the frontend makes an API call to **Nominatim (OpenStreetMap's free Geocoding service)**.
*   **Geocoding**: Nominatim translates the human-readable text (e.g., "India Gate, New Delhi") into exact GPS coordinates (Latitude/Longitude).
*   **Fly-to Animation**: The component passes these coordinates down to the Tactical Map, which uses the Leaflet `flyTo()` command to smoothly pan and zoom the map camera exactly to that location.
*   **Live Location (Use Current Location)**: If clicked, the browser's Geolocation API grabs the user's actual physical GPS coordinates. It then *reverse-geocodes* those coordinates into a readable street name, updates the map, and passes that localized context to the **Emergency SOS Response** panel so the user sees volunteers and helplines strictly relevant to their immediate surroundings.
