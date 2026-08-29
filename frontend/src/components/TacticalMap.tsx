import React, { useEffect, useRef } from "react";
import L from "leaflet";
import type { Incident, Resource } from "../types/domain";


interface TacticalMapProps {
  incidents: Incident[];
  resources: Resource[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
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

    // Native dark operational basemap (Esri World Dark Gray Base - No API Key, No Watermark)
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 18,
      attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    }).addTo(map);

    // Dark reference labels
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 18,
      pane: "shadowPane",
    }).addTo(map);



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

    // 1. Render Dark Zone (Ward 09) hatched polygon with NO DATA overlay
    const darkZonePolygon = L.polygon(
      [
        [26.860, 80.955],
        [26.875, 80.958],
        [26.872, 80.975],
        [26.858, 80.970],
      ],
      {
        color: "#5A6472",
        weight: 1.5,
        dashArray: "4, 4",
        fillColor: "#1E232B",
        fillOpacity: 0.8,
      }
    );
    darkZonePolygon.bindTooltip(
      "<div style='font-family:monospace;font-size:10px;background:#141920;color:#8A93A0;padding:4px;border:1px solid #5A6472;'><strong>WARD 09 // SILENT ZONE</strong><br/><span style='color:#D6553C;'>NO DATA — UNKNOWN STATUS</span><br/>Telecom: DARK | Pop: 8,600</div>",
      { permanent: true, direction: "center", className: "dark-zone-tooltip" }
    );
    layerGroup.addLayer(darkZonePolygon);

    // 2. Render Road Segments
    const openRoad = L.polyline(
      [
        [26.840, 80.930],
        [26.851, 80.949],
      ],
      { color: "#4FD8C4", weight: 3, opacity: 0.7 }
    );
    openRoad.bindTooltip("Main Arterial Road // OPEN", { sticky: true });
    layerGroup.addLayer(openRoad);

    const floodedRoad = L.polyline(
      [
        [26.851, 80.949],
        [26.865, 80.960],
      ],
      { color: "#D6553C", weight: 3.5, dashArray: "6, 6", opacity: 0.85 }
    );
    floodedRoad.bindTooltip("<span style='color:#D6553C;'>Station Approach Road // FLOODED / IMPASSABLE</span>", { sticky: true });
    layerGroup.addLayer(floodedRoad);

    // 3. Render Incidents
    incidents.forEach((inc) => {
      const isSelected = selectedIncidentId === inc.incident_id;
      const isDisputed = inc.dispute_flag;
      const isCritical = inc.priority_score >= 1.0;

      // Color coding
      let color = "#4FD8C4";
      if (isCritical) color = "#D6553C";
      else if (isDisputed) color = "#E8A33D";

      // Location precision safeguard:
      // High: Exact radius circle (12px)
      // Medium: Ward buffer circle (40px)
      // Low: Diffuse zone halo (100px) - NEVER fake pin
      let radius = 8;
      let fillOpacity = 0.8;

      if (inc.location_precision === "MEDIUM") {
        radius = 22;
        fillOpacity = 0.35;
      } else if (inc.location_precision === "LOW") {
        radius = 45;
        fillOpacity = 0.15;
      }

      const marker = L.circleMarker([inc.location.lat, inc.location.lng], {
        radius: isSelected ? radius + 4 : radius,
        color: isSelected ? "#FFFFFF" : color,
        weight: isSelected ? 3 : 2,
        fillColor: color,
        fillOpacity: fillOpacity,
        dashArray: isDisputed ? "4, 4" : undefined,
      });

      marker.on("click", () => {
        onSelectIncident(inc.incident_id);
      });

      // Tooltip
      const tooltipHtml = `
        <div style="font-family:monospace;font-size:11px;background:#141920;color:#E4E8EC;padding:6px;border:1px solid ${color};">
          <strong>${inc.incident_id} // ${inc.category}</strong><br/>
          <span style="color:#8A93A0;">Ward: ${inc.zone_id} | Prec: ${inc.location_precision}</span><br/>
          <span>Priority: <strong>${inc.priority_score.toFixed(2)}</strong> | Conf: <strong>${inc.confidence_score.toFixed(2)}</strong></span><br/>
          ${isDisputed ? "<span style='color:#E8A33D;'>⚠ MATERIAL CONTRADICTION DETECTED</span><br/>" : ""}
          <span style="color:#4FD8C4;">Tag: ${inc.micro_environment}</span>
        </div>
      `;
      marker.bindTooltip(tooltipHtml, { sticky: true });
      layerGroup.addLayer(marker);
    });

    // 4. Render Available Emergency Resources
    resources.forEach((res) => {
      const resMarker = L.circleMarker([res.current_location.lat, res.current_location.lng], {
        radius: 6,
        color: "#4FD8C4",
        weight: 2,
        fillColor: "#141920",
        fillOpacity: 1.0,
      });

      resMarker.bindTooltip(
        `<div style="font-family:monospace;font-size:10px;background:#141920;color:#4FD8C4;padding:4px;border:1px solid #4FD8C4;">
          <strong>${res.resource_id} // ${res.type}</strong><br/>
          Status: ${res.availability_status} | Speed: ${res.travel_speed_kmh} km/h
        </div>`,
        { sticky: true }
      );
      layerGroup.addLayer(resMarker);
    });
  }, [incidents, resources, selectedIncidentId, onSelectIncident]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* Map Legend Overlay */}
      <div
        className="mono"
        style={{
          position: "absolute",
          bottom: "16px",
          left: "16px",
          backgroundColor: "rgba(20, 25, 32, 0.92)",
          border: "1px solid var(--grid-line)",
          padding: "8px 12px",
          borderRadius: "2px",
          fontSize: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          zIndex: 500,
          pointerEvents: "none",
        }}
      >
        <div style={{ fontWeight: 700, color: "var(--ink-dim)", marginBottom: "2px" }}>TACTICAL MAP LEGEND</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--critical-ember)" }} />
          <span>Critical Incident (P &gt; 1.0)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--dispute-amber)", border: "1px dashed var(--dispute-amber)" }} />
          <span>Disputed Claim (Verification Req)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", backgroundColor: "var(--dark-zone-dark)", border: "1px dashed var(--dark-zone-grey)" }} />
          <span>Dark Zone (Silence / Unknown)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#141920", border: "2px solid var(--signal-cyan)" }} />
          <span>Emergency Resource Unit</span>
        </div>
      </div>
    </div>
  );
};
