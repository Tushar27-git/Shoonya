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

    const map = L.map(mapContainerRef.current, {
      center: [26.8500, 80.9450],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark operational basemap (Esri World Dark Gray Base)
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 18,
        attribution: "Tiles &copy; Esri",
      }
    ).addTo(map);

    // Reference labels
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

    // 1. Sector Boundary & Ward Center Reference Points
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
        color: "#334155",
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

    // 2. Render Dark Zone (Ward 09) Polygon
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
        fillColor: "#111827",
        fillOpacity: 0.7,
      }
    );

    darkZonePolygon.bindPopup(`
      <div style="padding: 12px; font-family: sans-serif; min-width: 200px;">
        <div style="font-size: 10px; font-weight: 800; color: #F59E0B; letter-spacing: 0.5px; margin-bottom: 3px;" class="mono">
          WARD 09 • SILENT DARK ZONE
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #EF4444; margin-bottom: 6px;">
          NO DATA — UNKNOWN STATUS
        </div>
        <div style="font-size: 11px; color: #94A3B8; margin-bottom: 8px; line-height: 1.4;">
          Telecom blackouts active. Estimated population: <strong>8,600</strong> residents exposed to potential unmonitored surge.
        </div>
        <div style="font-size: 10px; color: #60A5FA; font-family: monospace;">
          Recommended: Priority Aerial Recon Sweep
        </div>
      </div>
    `);

    darkZonePolygon.bindTooltip(
      "<div style='font-family:monospace;font-size:10px;background:#0A0D14;color:#F59E0B;padding:4px 8px;border:1px solid #F59E0B;border-radius:4px;'><strong>WARD 09 • SILENT DARK ZONE</strong><br/><span style='color:#EF4444;'>NO DATA (8.6k Population)</span></div>",
      { permanent: true, direction: "center", className: "dark-zone-tooltip" }
    );
    layerGroup.addLayer(darkZonePolygon);

    // 3. Render Road Segments
    const openRoad = L.polyline(
      [
        [26.840, 80.930],
        [26.851, 80.949],
      ],
      { color: "#3B82F6", weight: 3, opacity: 0.8 }
    );
    openRoad.bindTooltip("Main Arterial Road • OPEN / PASSABLE", { sticky: true });
    layerGroup.addLayer(openRoad);

    const floodedRoad = L.polyline(
      [
        [26.851, 80.949],
        [26.865, 80.960],
      ],
      { color: "#EF4444", weight: 3.5, dashArray: "6, 6", opacity: 0.9 }
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
      const venueColor = isSurge ? "#F59E0B" : "#3B82F6";

      const venueMarker = L.circleMarker([v.lat, v.lng], {
        radius: 8,
        color: venueColor,
        weight: 2,
        fillColor: "#0A0D14",
        fillOpacity: 0.9,
      });

      venueMarker.bindPopup(`
        <div style="padding: 10px; font-family: sans-serif; min-width: 180px;">
          <div style="font-size: 10px; font-weight: 700; color: ${venueColor}; letter-spacing: 0.5px;" class="mono">
            ${v.id} • ${v.type}
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #FFFFFF; margin: 2px 0 5px 0;">
            ${v.name}
          </div>
          <div style="font-size: 11px; color: #94A3B8; margin-bottom: 4px;">
            Bed / Shelter Surge: <strong style="color: ${venueColor};">${v.occupancy} / ${v.capacity} (${occPct}%)</strong>
          </div>
          <div style="font-size: 10px; color: #64748B;">
            Status: <span style="color: #F8FAFC;">${v.status}</span>
          </div>
        </div>
      `);

      venueMarker.bindTooltip(
        `<div style="font-family:monospace;font-size:10px;background:#0A0D14;color:${venueColor};padding:3px 6px;border:1px solid ${venueColor};border-radius:3px;">
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

      let color = "#3B82F6";
      if (isCritical) color = "#EF4444";
      else if (isDisputed) color = "#F59E0B";

      let radius = 9;
      let fillOpacity = 0.85;

      if (inc.location_precision === "MEDIUM") {
        radius = 22;
        fillOpacity = 0.3;
      } else if (inc.location_precision === "LOW") {
        radius = 42;
        fillOpacity = 0.16;
      }

      const marker = L.circleMarker([inc.location.lat, inc.location.lng], {
        radius: isSelected ? radius + 4 : radius,
        color: isSelected ? "#FFFFFF" : color,
        weight: isSelected ? 3 : 1.5,
        fillColor: color,
        fillOpacity: fillOpacity,
        dashArray: isDisputed ? "4, 4" : undefined,
      });

      marker.on("click", () => {
        onSelectIncident(inc.incident_id);
      });

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
            <span style="font-size: 9px; padding: 1px 5px; background: rgba(255,255,255,0.08); border-radius: 3px; color: #94A3B8;" class="mono">
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
            <span>Conf: <strong style="color:#60A5FA;">${inc.confidence_score.toFixed(2)}</strong></span>
            <span>Victims: <strong style="color:#FFFFFF;">${vicText}</strong></span>
          </div>
          ${
            inc.micro_environment !== "NONE"
              ? `<div style="font-size: 10px; color: #60A5FA; font-weight: 600; margin-bottom: 6px;" class="mono">
                  Tag: ${inc.micro_environment.replace(/_/g, " ")}
                </div>`
              : ""
          }
          ${
            isDisputed
              ? `<div style="font-size: 10px; color: #F59E0B; font-weight: 700; margin-bottom: 6px;" class="mono">
                  ⚠ CONTRADICTION DETECTED
                </div>`
              : ""
          }
          <div style="font-size: 10px; color: #94A3B8; font-style: italic; margin-bottom: 8px;">
            "${inc.evidence_summary[0] || "Report queued"}"
          </div>
          <div style="display: flex; gap: 6px;">
            <button id="btn-select-${inc.incident_id}" style="flex: 1; padding: 5px 8px; background: #2563EB; border: none; border-radius: 4px; color: #FFFFFF; font-size: 10px; font-weight: 700; cursor: pointer;">
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
        `<div style="font-family:monospace;font-size:10px;background:#0A0D14;color:${color};padding:3px 6px;border:1px solid ${color};border-radius:3px;">
          <strong>${inc.incident_id}</strong> (${inc.category}) | P: ${inc.priority_score.toFixed(2)}
        </div>`,
        { sticky: true }
      );

      layerGroup.addLayer(marker);
    });

    // 6. Emergency Fleet Resources
    resources.forEach((res) => {
      const resMarker = L.circleMarker([res.current_location.lat, res.current_location.lng], {
        radius: 6,
        color: "#3B82F6",
        weight: 2,
        fillColor: "#0A0D14",
        fillOpacity: 1.0,
      });

      resMarker.bindPopup(`
        <div style="padding: 10px; font-family: sans-serif; min-width: 170px;">
          <div style="font-size: 10px; font-weight: 800; color: #3B82F6; letter-spacing: 0.5px;" class="mono">
            ${res.resource_id} • ${res.type}
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #FFFFFF; margin: 2px 0;">
            ${res.name || res.type}
          </div>
          <div style="font-size: 11px; color: #94A3B8;">
            Status: <strong style="color: #60A5FA;">${res.availability_status}</strong>
          </div>
          <div style="font-size: 11px; color: #94A3B8;">
            Speed: ${res.travel_speed_kmh} km/h
          </div>
        </div>
      `);

      resMarker.bindTooltip(
        `<div style="font-family:monospace;font-size:10px;background:#0A0D14;color:#3B82F6;padding:3px 6px;border:1px solid #3B82F6;border-radius:3px;">
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

      {/* Floating Glassmorphic Map Status Badge */}
      <div
        className="mono glass-panel"
        style={{
          position: "absolute",
          top: "14px",
          left: "14px",
          padding: "5px 12px",
          borderRadius: "var(--radius-sm)",
          fontSize: "11px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          zIndex: 500,
          boxShadow: "var(--shadow-md)",
        }}
      >
        <Navigation size={12} color="var(--blue-bright)" />
        <span style={{ color: "var(--text-muted)" }}>SECTOR MAP:</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>RAIPUR EAST</span>
        <span style={{ color: "var(--border-default)" }}>|</span>
        <span style={{ color: "var(--blue-light)" }}>{incidents.length} INCIDENTS</span>
      </div>

      {/* Floating Glassmorphic Collapsible Legend */}
      <div
        className="mono glass-panel"
        style={{
          position: "absolute",
          bottom: "14px",
          left: "14px",
          padding: "10px 12px",
          borderRadius: "var(--radius-md)",
          fontSize: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          zIndex: 500,
          boxShadow: "var(--shadow-lg)",
          minWidth: "190px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            borderBottom: isLegendOpen ? "1px solid var(--border-subtle)" : "none",
            paddingBottom: isLegendOpen ? "4px" : "0",
          }}
          onClick={() => setIsLegendOpen(!isLegendOpen)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "var(--text-secondary)" }}>
            <Layers size={11} color="var(--blue-bright)" />
            <span>MAP LEGEND</span>
          </div>
          <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{isLegendOpen ? "▼" : "▲"}</span>
        </div>

        {isLegendOpen && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-critical)",
                  boxShadow: "0 0 6px var(--color-critical)",
                }}
              />
              <span>Critical Incident (P &gt; 1.0)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--blue-bright)",
                }}
              />
              <span>Standard Incident Cluster</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "transparent",
                  border: "1.5px dashed var(--color-warning)",
                }}
              />
              <span>Contradiction / Dispute</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "11px",
                  height: "9px",
                  backgroundColor: "rgba(100, 116, 139, 0.25)",
                  border: "1px dashed var(--color-warning)",
                  borderRadius: "1px",
                }}
              />
              <span>Silent Dark Zone (Ward 09)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--bg-surface)",
                  border: "2px solid var(--blue-bright)",
                }}
              />
              <span>Emergency Fleet (Boat/Ambulance)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--bg-surface)",
                  border: "2px solid var(--color-warning)",
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
