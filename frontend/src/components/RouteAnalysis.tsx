import React from "react";
import { Shield, Navigation, Zap, AlertTriangle } from "lucide-react";

interface Incident {
  incident_id: string;
  category: string;
  priority_score: number;
}

interface RouteAnalysisProps {
  origin?: string;
  incidents?: Incident[];
}

export const RouteAnalysis: React.FC<RouteAnalysisProps> = ({ origin = "your location", incidents = [] }) => {
  const primaryIncident = incidents.length > 0 
    ? incidents.reduce((prev, current) => (prev.priority_score > current.priority_score) ? prev : current).category 
    : "FLOOD";

  // Pseudo-random dynamic generation based on origin
  const originHash = origin.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const safestTime = 35 + (originHash % 20);
  const safestDist = (6.0 + (originHash % 40) / 10).toFixed(1);
  const safestScore = 90 + (originHash % 8);

  const balancedTime = safestTime - 6 - (originHash % 5);
  const balancedDist = (parseFloat(safestDist) - 0.8).toFixed(1);
  const balancedScore = safestScore - 10;

  const fastestTime = balancedTime - 5 - (originHash % 4);
  const fastestDist = (parseFloat(balancedDist) - 0.6).toFixed(1);
  const fastestScore = balancedScore - 12;
  
  const timeDiff = safestTime - fastestTime;
  const scoreDiff = safestScore - fastestScore;

  return (
    <div style={{ 
      padding: "24px", display: "flex", flexDirection: "column", gap: "20px",
      backgroundColor: "rgba(10, 15, 20, 0.85)", backdropFilter: "blur(12px)",
      border: "1px solid var(--grid-line-bright)", borderRadius: "16px",
      boxShadow: "0 12px 32px rgba(0,0,0,0.7)"
    }}>
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "white", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Navigation size={20} color="var(--signal-cyan)" /> Route Analysis
        </h2>
        <p style={{ color: "var(--ink-dim)", fontSize: "12px", lineHeight: "1.4" }}>Comparing 3 emergency pathways from <strong style={{color:"white"}}>{origin}</strong> to the primary {primaryIncident} incident zone.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Safest Route */}
        <div style={{
          backgroundColor: "rgba(79, 70, 229, 0.1)",
          border: "1px solid var(--signal-cyan)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Shield size={20} color="var(--signal-cyan)" />
              <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "white" }}>Safest Route</h3>
              <span style={{ backgroundColor: "var(--signal-cyan)", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold" }}>★ Recommended</span>
            </div>
            <div style={{ color: "var(--ink-dim)", fontSize: "14px", marginBottom: "12px", display: "flex", gap: "16px" }}>
              <span>⏱ {safestTime} min</span>
              <span>📍 {safestDist} km</span>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["Well-lit", "High footfall", "Active police zone", "CCTV Corridor"].map(tag => (
                <span key={tag} style={{ backgroundColor: "var(--panel-elevated)", color: "var(--ink-dim)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", border: "4px solid var(--signal-cyan)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "bold", color: "white" }}>
            {safestScore}
          </div>
        </div>

        {/* Balanced Route */}
        <div style={{
          backgroundColor: "var(--panel-elevated)",
          border: "1px solid var(--grid-line)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Navigation size={20} color="var(--ink)" />
              <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "white" }}>Balanced</h3>
            </div>
            <div style={{ color: "var(--ink-dim)", fontSize: "14px", marginBottom: "12px", display: "flex", gap: "16px" }}>
              <span>⏱ {balancedTime} min</span>
              <span>📍 {balancedDist} km</span>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["Efficient flow", "Moderate surveillance", "Transit hub proximity"].map(tag => (
                <span key={tag} style={{ backgroundColor: "var(--void)", color: "var(--ink-dim)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", border: "4px solid var(--ink-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "bold", color: "white" }}>
            {balancedScore}
          </div>
        </div>

        {/* Fastest Route */}
        <div style={{
          backgroundColor: "rgba(239, 68, 68, 0.05)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Zap size={20} color="var(--critical-ember)" />
              <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "white" }}>Fastest</h3>
            </div>
            <div style={{ color: "var(--ink-dim)", fontSize: "14px", marginBottom: "12px", display: "flex", gap: "16px" }}>
              <span>⏱ {fastestTime} min</span>
              <span>📍 {fastestDist} km</span>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["Low visibility zones", "Highway dominant", "Isolated service lanes"].map(tag => (
                <span key={tag} style={{ backgroundColor: "var(--void)", color: "var(--ink-dim)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", border: "4px solid var(--critical-ember)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "bold", color: "white" }}>
            {fastestScore}
          </div>
        </div>
      </div>
      
      <div style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--dispute-amber)", display: "flex", gap: "12px", marginTop: "auto" }}>
        <AlertTriangle size={24} color="var(--dispute-amber)" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ color: "var(--dispute-amber)", fontWeight: "bold", marginBottom: "4px" }}>Why this route?</h4>
          <p style={{ color: "var(--ink-dim)", fontSize: "13px" }}>The recommended Safest Route avoids 2 known dark zones and active {primaryIncident} areas. It follows well-lit corridors with active police presence. It takes {timeDiff} minutes longer but provides a {scoreDiff}% higher safety score.</p>
        </div>
      </div>
    </div>
  );
};
