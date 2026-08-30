import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { Incident, Resource } from "../types/domain";
import { Layers, Navigation } from "lucide-react";

interface TacticalMapProps {
  incidents: Incident[];
  resources: Resource[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
  onTaskDrone?: (incidentId: string, lat: number, lng: number, reason: string) => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  incidents,
  resources,
  selectedIncidentId,
  onSelectIncident,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered on Raipur East sector
    const map = L.map(mapContainerRef.current, {
      center: [26.8500, 80.9450],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Native dark operational basemap (Esri World Dark Gray Base)
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 18,
        attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
      }
    ).addTo(map);

    // Dark reference labels
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 18,
        pane: "shadowPane",
      }
    ).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map layers on state changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    // 1. Sector Boundary & Ward Labels
    const wardCenters = [
      { name: "WARD 01 (Civil Lines)", lat: 26.8500, lng: 80.9400 },
      { name: "WARD 03 (Riverfront)", lat: 26.8620, lng: 80.9380 },
      { name: "WARD 04 (Market)", lat: 26.8410, lng: 80.9320 },
      { name: "WARD 07 (Basin)", lat: 26.8510, lng: 80.9490 },
      { name: "WARD 12 (Kalina)", lat: 26.8320, lng: 80.9200 },
    ];

    wardCenters.forEach((wc) => {
      const wardLabelMarker = L.circleMarker([wc.lat, wc.lng], {
        radius: 3,
        color: "#475569",
        weight: 1,
        fillColor: "#0F172A",
        fillOpacity: 0.8,
      });
      wardLabelMarker.bindTooltip(
        `<span style="font-family:monospace;font-size:9px;color:#94A3B8;">${wc.name}</span>`,
        { permanent: false, direction: "top", className: "ward-tooltip" }
      );
      layerGroup.addLayer(wardLabelMarker);
    });

    // 2. Render Dark Zone (Ward 09) hatched polygon with NO DATA overlay
    const darkZonePolygon = L.polygon(
      [
        [26.860, 80.955],
        [26.875, 80.958],
        [26.872, 80.975],
        [26.858, 80.970],
      ],
      {
        color: "#F59E0B",
        weight: 1.5,
        dashArray: "6, 6",
        fillColor: "#1E293B",
        fillOpacity: 0.75,
      }
    );

    darkZonePolygon.bindPopup(`
      <div style="padding: 12px; font-family: sans-serif; min-width: 200px;">
        <div style="font-size: 11px; font-weight: 800; color: #F59E0B; letter-spacing: 0.5px; margin-bottom: 4px;" class="mono">
          WARD 09 • SILENT DARK ZONE
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #EF4444; margin-bottom: 6px;">
          NO DATA — UNKNOWN OPERATIONAL STATUS
        </div>
        <div style="font-size: 11px; color: #94A3B8; margin-bottom: 8px; line-height: 1.4;">
          Telecom towers offline. Estimated population: <strong>8,600</strong> residents exposed to potential unmonitored flood breach.
        </div>
        <div style="font-size: 10px; color: #38BDF8; font-family: monospace;">
          Recommended: Priority Drone Recon Sweep
        </div>
      </div>
    `);

    darkZonePolygon.bindTooltip(
      "<div style='font-family:monospace;font-size:10px;background:#0F172A;color:#F59E0B;padding:4px 8px;border:1px solid #F59E0B;border-radius:3px;'><strong>WARD 09 • SILENT DARK ZONE</strong><br/><span style='color:#EF4444;'>NO DATA (8.6k Population)</span></div>",
      { permanent: true, direction: "center", className: "dark-zone-tooltip" }
    );
    layerGroup.addLayer(darkZonePolygon);

    // 3. Render Road Segments
    const openRoad = L.polyline(
      [
        [26.840, 80.930],
        [26.851, 80.949],
      ],
      { color: "#38BDF8", weight: 3.5, opacity: 0.75 }
    );
    openRoad.bindTooltip("Main Arterial Road • OPEN / PASSABLE", { sticky: true });
    layerGroup.addLayer(openRoad);

    const floodedRoad = L.polyline(
      [
        [26.851, 80.949],
        [26.865, 80.960],
      ],
      { color: "#EF4444", weight: 4, dashArray: "6, 6", opacity: 0.9 }
    );
    floodedRoad.bindTooltip(
      "<span style='color:#EF4444;font-weight:700;'>Station Approach Road • FLOODED / IMPASSABLE</span>",
      { sticky: true }
    );
    layerGroup.addLayer(floodedRoad);

    // 4. Critical Venues (Hospitals, Shelters, Depots)
    const venues = [
      {
        id: "VEN-HOSP-01",
        name: "District General Hospital",
        type: "HOSPITAL",
        lat: 26.8480,
        lng: 80.9380,
        capacity: 250,
        occupancy: 210,
        status: "NEAR_CAPACITY",
      },
      {
        id: "VEN-SHELTER-01",
        name: "Sector 4 Relief Camp",
        type: "SHELTER",
        lat: 26.8440,
        lng: 80.9350,
        capacity: 600,
        occupancy: 480,
        status: "OPEN",
      },
      {
        id: "VEN-DEPOT-01",
        name: "Logistics & Boat Depot",
        type: "LOGISTICS",
        lat: 26.8520,
        lng: 80.9300,
        capacity: 1000,
        occupancy: 120,
        status: "OPERATIONAL",
      },
    ];

    venues.forEach((v) => {
      const occPct = Math.round((v.occupancy / v.capacity) * 100);
      const isSurge = occPct >= 80;
      const venueColor = isSurge ? "#F59E0B" : "#38BDF8";

      const venueMarker = L.circleMarker([v.lat, v.lng], {
        radius: 9,
        color: venueColor,
        weight: 2,
        fillColor: "#0F172A",
        fillOpacity: 0.9,
      });

      venueMarker.bindPopup(`
        <div style="padding: 10px; font-family: sans-serif; min-width: 190px;">
          <div style="font-size: 10px; font-weight: 700; color: ${venueColor}; letter-spacing: 0.5px;" class="mono">
            ${v.id} • ${v.type}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin: 2px 0 6px 0;">
            ${v.name}
          </div>
          <div style="font-size: 11px; color: #94A3B8; margin-bottom: 4px;">
            Bed / Shelter Surge: <strong style="color: ${venueColor};">${v.occupancy} / ${v.capacity} (${occPct}%)</strong>
          </div>
          <div style="font-size: 10px; color: #64748B;">
            Status: <span style="color: #F1F5F9;">${v.status}</span>
          </div>
        </div>
      `);

      venueMarker.bindTooltip(
        `<div style="font-family:monospace;font-size:10px;background:#0F172A;color:${venueColor};padding:3px 6px;border:1px solid ${venueColor};border-radius:2px;">
          ${v.name} (${occPct}%)
        </div>`,
        { sticky: true }
      );
      layerGroup.addLayer(venueMarker);
    });

    // 5. Render Incident Markers
    incidents.forEach((inc) => {
      const isSelected = selectedIncidentId === inc.incident_id;
      const isDisputed = inc.dispute_flag;
      const isCritical = inc.priority_score >= 1.0;

      let color = "#38BDF8";
      if (isCritical) color = "#EF4444";
      else if (isDisputed) color = "#F59E0B";

      let radius = 10;
      let fillOpacity = 0.85;

      if (inc.location_precision === "MEDIUM") {
        radius = 24;
        fillOpacity = 0.35;
      } else if (inc.location_precision === "LOW") {
        radius = 45;
        fillOpacity = 0.18;
      }

      const marker = L.circleMarker([inc.location.lat, inc.location.lng], {
        radius: isSelected ? radius + 5 : radius,
        color: isSelected ? "#FFFFFF" : color,
        weight: isSelected ? 3.5 : 2,
        fillColor: color,
        fillOpacity: fillOpacity,
        dashArray: isDisputed ? "4, 4" : undefined,
      });

      marker.on("click", () => {
        onSelectIncident(inc.incident_id);
      });

      // Rich Interactive Popup
      const vicText =
        inc.victim_estimate.min_victims === inc.victim_estimate.max_victims
          ? `${inc.victim_estimate.best_guess}`
          : `[${inc.victim_estimate.min_victims}..${inc.victim_estimate.max_victims}]`;

      const popupHtml = `
        <div style="padding: 12px; font-family: sans-serif; min-width: 220px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 11px; font-weight: 800; color: ${color};" class="mono">
              ${inc.incident_id}
            </span>
            <span style="font-size: 10px; padding: 1px 5px; background: rgba(255,255,255,0.08); border-radius: 3px; color: #94A3B8;" class="mono">
              ${inc.zone_id}
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
            ${inc.category.replace(/_/g, " ")}
          </div>
          <div style="font-size: 11px; color: #94A3B8; margin-bottom: 6px;">
            ${inc.location.address || "Sector Location"}
          </div>
          <div style="display: flex; gap: 8px; font-size: 11px; margin-bottom: 6px;" class="mono">
            <span>P: <strong style="color:${color};">${inc.priority_score.toFixed(2)}</strong></span>
            <span>Conf: <strong style="color:#38BDF8;">${inc.confidence_score.toFixed(2)}</strong></span>
            <span>Victims: <strong style="color:#FFFFFF;">${vicText}</strong></span>
          </div>
          ${
            inc.micro_environment !== "NONE"
              ? `<div style="font-size: 10px; color: #38BDF8; font-weight: 600; margin-bottom: 6px;" class="mono">
                  Tag: ${inc.micro_environment.replace(/_/g, " ")}
                </div>`
              : ""
          }
          ${
            isDisputed
              ? `<div style="font-size: 10px; color: #F59E0B; font-weight: 700; margin-bottom: 6px;" class="mono">
                  ⚠ MATERIAL CONTRADICTION DETECTED
                </div>`
              : ""
          }
          <div style="font-size: 10px; color: #94A3B8; font-style: italic; margin-bottom: 8px;">
            "${inc.evidence_summary[0] || "Report queued"}"
          </div>
          <div style="display: flex; gap: 6px;">
            <button id="btn-select-${inc.incident_id}" style="flex: 1; padding: 4px 8px; background: #38BDF8; border: none; border-radius: 3px; color: #090C10; font-size: 10px; font-weight: 700; cursor: pointer;">
              SELECT INCIDENT
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-select-${inc.incident_id}`);
        if (btn) {
          btn.onclick = () => onSelectIncident(inc.incident_id);
        }
      });

      marker.bindTooltip(
        `<div style="font-family:monospace;font-size:10px;background:#0F172A;color:${color};padding:4px 6px;border:1px solid ${color};border-radius:2px;">
          <strong>${inc.incident_id}</strong> (${inc.category}) | P: ${inc.priority_score.toFixed(2)}
        </div>`,
        { sticky: true }
      );

      layerGroup.addLayer(marker);
    });

    // 6. Emergency Fleet Resources
    resources.forEach((res) => {
      const resMarker = L.circleMarker([res.current_location.lat, res.current_location.lng], {
        radius: 7,
        color: "#38BDF8",
        weight: 2,
        fillColor: "#0F172A",
        fillOpacity: 1.0,
      });

      resMarker.bindPopup(`
        <div style="padding: 10px; font-family: sans-serif; min-width: 180px;">
          <div style="font-size: 10px; font-weight: 800; color: #38BDF8; letter-spacing: 0.5px;" class="mono">
            ${res.resource_id} • ${res.type}
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #FFFFFF; margin: 3px 0;">
            ${res.name || res.type}
          </div>
          <div style="font-size: 11px; color: #94A3B8;">
            Status: <strong style="color: #38BDF8;">${res.availability_status}</strong>
          </div>
          <div style="font-size: 11px; color: #94A3B8;">
            Speed: ${res.travel_speed_kmh} km/h
          </div>
        </div>
      `);

      resMarker.bindTooltip(
        `<div style="font-family:monospace;font-size:10px;background:#0F172A;color:#38BDF8;padding:3px 6px;border:1px solid #38BDF8;border-radius:2px;">
          <strong>${res.resource_id}</strong> (${res.type}) • ${res.availability_status}
        </div>`,
        { sticky: true }
      );
      layerGroup.addLayer(resMarker);
    });
  }, [incidents, resources, selectedIncidentId, onSelectIncident]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* Map Header Status Badge */}
      <div
        className="mono"
        style={{
          position: "absolute",
          top: "14px",
          left: "14px",
          backgroundColor: "rgba(15, 21, 31, 0.9)",
          backdropFilter: "blur(8px)",
          border: "1px solid var(--grid-line)",
          padding: "6px 12px",
          borderRadius: "4px",
          fontSize: "11px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          zIndex: 500,
          boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
        }}
      >
        <Navigation size={13} color="var(--signal-cyan)" />
        <span style={{ color: "var(--ink-dim)" }}>SECTOR MAP:</span>
        <span style={{ color: "var(--ink-bright)", fontWeight: 700 }}>RAIPUR EAST</span>
        <span style={{ color: "var(--ink-muted)" }}>|</span>
        <span style={{ color: "var(--signal-cyan)" }}>{incidents.length} INCIDENTS</span>
      </div>

      {/* Map Legend Overlay */}
      <div
        className="mono"
        style={{
          position: "absolute",
          bottom: "16px",
          left: "16px",
          backgroundColor: "rgba(15, 21, 31, 0.92)",
          backdropFilter: "blur(10px)",
          border: "1px solid var(--grid-line)",
          padding: "10px 14px",
          borderRadius: "6px",
          fontSize: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          zIndex: 500,
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.6)",
          minWidth: "200px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            borderBottom: isLegendOpen ? "1px solid var(--grid-line)" : "none",
            paddingBottom: isLegendOpen ? "4px" : "0",
          }}
          onClick={() => setIsLegendOpen(!isLegendOpen)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "var(--ink-dim)" }}>
            <Layers size={12} color="var(--signal-cyan)" />
            <span>MAP LEGEND</span>
          </div>
          <span style={{ fontSize: "9px", color: "var(--ink-muted)" }}>{isLegendOpen ? "▼" : "▲"}</span>
        </div>

        {isLegendOpen && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",
                  backgroundColor: "var(--critical-ember)",
                  boxShadow: "0 0 6px var(--critical-ember)",
                }}
              />
              <span>Critical Incident (P &gt; 1.0)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",
                  backgroundColor: "var(--signal-cyan)",
                }}
              />
              <span>Standard Incident Cluster</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",
                  backgroundColor: "transparent",
                  border: "1.5px dashed var(--dispute-amber)",
                }}
              />
              <span>Contradiction / Dispute</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "12px",
                  height: "10px",
                  backgroundColor: "rgba(100, 116, 139, 0.3)",
                  border: "1px dashed var(--dispute-amber)",
                }}
              />
              <span>Silent Dark Zone (Ward 09)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",
                  backgroundColor: "var(--panel)",
                  border: "2px solid var(--signal-cyan)",
                }}
              />
              <span>Emergency Fleet (Boat/Ambulance)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",
                  backgroundColor: "var(--panel)",
                  border: "2px solid var(--dispute-amber)",
                }}
              />
              <span>Critical Venue (Hospital/Shelter)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
