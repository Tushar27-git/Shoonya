import React, { useEffect, useRef } from "react";
import L from "leaflet";
import type { Incident, Resource } from "../types/domain";


interface TacticalMapProps {
  incidents: Incident[];
  resources: Resource[];
  darkZones?: any[];
  roadDisputes?: any[];
  emergingRiskZones?: any[];
  shelters?: any[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
  mapCenter?: [number, number];
  showRoutes?: boolean;
  primaryIncidentCategory?: string;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  incidents,
  resources,
  darkZones = [],
  roadDisputes = [],
  emergingRiskZones = [],
  shelters = [],
  selectedIncidentId,
  onSelectIncident,
  mapCenter,
  showRoutes = false,
  primaryIncidentCategory = "HAZARD",
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

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

    if (mapboxToken) {
      L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`, {
        maxZoom: 20,
        attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a>',
      }).addTo(map);
    } else {
      // Fallback if no token is provided
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
        className: 'map-tiles-dark'
      }).addTo(map);
    }



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

    // Calculate dynamic offset so simulation follows map location
    const BASE_LAT = 26.8500; // Lucknow base center used by processor
    const BASE_LNG = 80.9450;
    const deltaLat = mapCenter ? mapCenter[0] - BASE_LAT : 0;
    const deltaLng = mapCenter ? mapCenter[1] - BASE_LNG : 0;

    // Helper to offset coordinates
    const offsetPos = (lat: number, lng: number): [number, number] => {
      return [lat + deltaLat, lng + deltaLng];
    };

    // 1. Render Dark Zones dynamically
    darkZones.forEach(dz => {
      if (dz.centroid && dz.centroid.length === 2) {
        // Draw a circle for the dark zone instead of a hardcoded polygon
        const circle = L.circle(offsetPos(dz.centroid[0], dz.centroid[1]), {
          radius: (dz.radius_km || 1) * 1000,
          color: "#5A6472",
          weight: 2,
          dashArray: "4, 4",
          fillColor: "transparent",
          fillOpacity: 0,
        });
        const uiStatus = dz.is_dark ? "OFFLINE" : dz.telecom_status;
        
        if (!showRoutes) {
          circle.bindTooltip(
            `<div style='font-family:monospace;font-size:10px;background:#141920;color:#8A93A0;padding:4px;border:1px solid #5A6472;'><strong>${dz.zone_id} // No-Signal Zone</strong><br/><span style='color:#D6553C;'>Data currently unavailable from this area</span><br/>Network Status: ${uiStatus} | Population: ${dz.population}</div>`,
            { permanent: true, direction: "center", className: "dark-zone-tooltip" }
          );
        }
        layerGroup.addLayer(circle);
      }
    });

    // 2. Render Shelters
    shelters.forEach(s => {
      if (s.location?.lat && s.location?.lng) {
        const smarker = L.circleMarker(offsetPos(s.location.lat, s.location.lng), {
          radius: 10,
          color: "#2B5876",
          weight: 2,
          fillColor: "#4E4376",
          fillOpacity: 0.7,
        });
        smarker.bindTooltip(
          `<div style='font-family:monospace;font-size:10px;background:#141920;color:#8A93A0;padding:4px;border:1px solid #2B5876;'><strong>${s.name}</strong><br/>Occupancy: ${s.current_occupancy}/${s.capacity}</div>`,
          { sticky: true }
        );
        layerGroup.addLayer(smarker);
      }
    });

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

      const marker = L.circleMarker(offsetPos(inc.location.lat, inc.location.lng), {
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
          <span style="color:#8A93A0;">Ward: ${inc.zone_id} | Precision: ${inc.location_precision}</span><br/>
          <span>Severity: <strong>${Math.round(inc.priority_score * 100)}%</strong> | Confidence: <strong>${Math.round(inc.confidence_score * 100)}%</strong></span><br/>
          ${isDisputed ? "<span style='color:#E8A33D;'>⚠ Conflicting Reports Found</span><br/>" : ""}
          <span style="color:#4FD8C4;">Tag: ${inc.micro_environment}</span>
        </div>
      `;
      marker.bindTooltip(tooltipHtml, { sticky: true });
      layerGroup.addLayer(marker);
    });

    // 4. Render Emerging Risk Zones
    emergingRiskZones.forEach(erz => {
      if (erz.location && erz.location.length === 2) {
        const marker = L.circleMarker(offsetPos(erz.location[0], erz.location[1]), {
          radius: 30,
          color: "#A855F7",
          weight: 2,
          className: "pulse-marker",
          fillColor: "#A855F7",
          fillOpacity: 0.2
        });
        marker.bindTooltip(
          `<div style='font-family:monospace;font-size:10px;background:#141920;color:#A855F7;padding:4px;border:1px solid #A855F7;'><strong>${erz.zone_id} // Early Warning Zone</strong><br/>${erz.reason}<br/>Confidence: ${Math.round(erz.confidence * 100)}%</div>`,
          { sticky: true }
        );
        layerGroup.addLayer(marker);
      }
    });

    // 5. Render Available Emergency Resources
    resources.forEach((res) => {
      const resMarker = L.circleMarker(offsetPos(res.current_location.lat, res.current_location.lng), {
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

    // 6. Render Routes if showRoutes is true
    if (showRoutes) {
      const cLat = mapCenter ? mapCenter[0] : BASE_LAT;
      const cLng = mapCenter ? mapCenter[1] : BASE_LNG;

      // Safest Route (Primary, Blue)
      const safestLine = L.polyline([
        [cLat, cLng],
        [cLat + 0.005, cLng + 0.015],
        [cLat + 0.015, cLng + 0.025],
        [cLat + 0.03, cLng + 0.01],
      ], { color: "#4F46E5", weight: 6, opacity: 0.9, lineJoin: "round" }).addTo(layerGroup);
      
      safestLine.bindTooltip(`Safest (Avoids ${primaryIncidentCategory})`, { permanent: true, direction: "center", className: "route-label safest-label" }).openTooltip();
      
      // Balanced Route (Gray, dashed)
      const balancedLine = L.polyline([
        [cLat, cLng],
        [cLat - 0.005, cLng + 0.015],
        [cLat + 0.01, cLng + 0.03],
        [cLat + 0.03, cLng + 0.01],
      ], { color: "#9CA3AF", weight: 4, opacity: 0.7, dashArray: "8, 8", lineJoin: "round" }).addTo(layerGroup);
      
      balancedLine.bindTooltip(`Balanced`, { permanent: true, direction: "center", className: "route-label balanced-label" }).openTooltip();

      // Fastest Route (Red, dashed)
      const fastestLine = L.polyline([
        [cLat, cLng],
        [cLat + 0.015, cLng - 0.005],
        [cLat + 0.025, cLng + 0.005],
        [cLat + 0.03, cLng + 0.01],
      ], { color: "#EF4444", weight: 4, opacity: 0.7, dashArray: "8, 8", lineJoin: "round" }).addTo(layerGroup);
      
      fastestLine.bindTooltip(`Fastest`, { permanent: true, direction: "center", className: "route-label fastest-label" }).openTooltip();

      // Add start and end markers for routes
      L.circleMarker([cLat, cLng], { radius: 8, color: "#10B981", fillColor: "#141920", weight: 3, fillOpacity: 1 }).addTo(layerGroup);
      L.circleMarker([cLat + 0.03, cLng + 0.01], { radius: 8, color: "#EF4444", fillColor: "#141920", weight: 3, fillOpacity: 1 }).addTo(layerGroup);
    }
  }, [incidents, resources, darkZones, roadDisputes, shelters, selectedIncidentId, onSelectIncident, showRoutes, mapCenter]);

  // Update map center dynamically
  useEffect(() => {
    if (mapInstanceRef.current && mapCenter) {
      mapInstanceRef.current.flyTo(mapCenter, 14, { duration: 1.5 });
    }
  }, [mapCenter]);

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
        <div style={{ fontWeight: 700, color: "var(--ink-dim)", marginBottom: "2px" }}>LIVE INCIDENT MAP LEGEND</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--critical-ember)" }} />
          <span>Critical Incident</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--dispute-amber)", border: "1px dashed var(--dispute-amber)" }} />
          <span>Conflicting Reports</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", backgroundColor: "var(--dark-zone-dark)", border: "1px dashed var(--dark-zone-grey)" }} />
          <span>No-Signal Zone</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#141920", border: "2px solid var(--signal-cyan)" }} />
          <span>Emergency Resource Unit</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "rgba(168, 85, 247, 0.2)", border: "2px solid #A855F7" }} />
          <span>Early Warning Zone (Pulsing)</span>
        </div>
      </div>
    </div>
  );
};
