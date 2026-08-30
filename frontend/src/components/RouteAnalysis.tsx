import React from "react";
import { Shield, Navigation, Zap, AlertTriangle } from "lucide-react";

export const RouteAnalysis: React.FC = () => {
  return (
    <div style={{ padding: "24px", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--ink)", marginBottom: "8px" }}>Route Analysis</h2>
        <p style={{ color: "var(--ink-dim)" }}>Comparing 3 pedestrian pathways to India Gate.</p>
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
              <span>⏱ 41 min</span>
              <span>📍 7.2 km</span>
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
            94
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
              <span>⏱ 34 min</span>
              <span>📍 6.4 km</span>
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
            84
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
              <span>⏱ 27 min</span>
              <span>📍 5.8 km</span>
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
            72
          </div>
        </div>
      </div>
      
      <div style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--dispute-amber)", display: "flex", gap: "12px", marginTop: "auto" }}>
        <AlertTriangle size={24} color="var(--dispute-amber)" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ color: "var(--dispute-amber)", fontWeight: "bold", marginBottom: "4px" }}>Why this route?</h4>
          <p style={{ color: "var(--ink-dim)", fontSize: "13px" }}>The recommended Safest Route avoids 2 known dark zones and follows well-lit corridors with active police presence. It takes 14 minutes longer but provides a 22% higher safety score.</p>
        </div>
      </div>
    </div>
  );
};
