import React from "react";
import { TrendingUp, AlertCircle, Clock, ShieldCheck } from "lucide-react";

interface Incident {
  incident_id: string;
  category: string;
  priority_score: number;
}

interface RiskAnalyticsProps {
  origin?: string;
  incidents?: Incident[];
}

export const RiskAnalytics: React.FC<RiskAnalyticsProps> = ({ origin = "Delhi NCR", incidents = [] }) => {
  const primaryIncident = incidents.length > 0 
    ? incidents.reduce((prev, current) => (prev.priority_score > current.priority_score) ? prev : current).category 
    : "Low Lighting";

  return (
    <div style={{ 
      padding: "32px", display: "flex", flexDirection: "column", gap: "24px"
    }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "white" }}>Risk Analytics</h2>
          <span style={{ backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#10B981", padding: "4px 12px", borderRadius: "16px", fontSize: "12px", fontWeight: "bold" }}>Live Data Stream</span>
        </div>
        <p style={{ color: "var(--ink-dim)" }}>Predictive safety modeling & trend analysis near {origin}</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {[
          { title: "LOGGED INCIDENTS", value: incidents.length.toString(), sub: `Active in ${origin}`, icon: <AlertCircle size={20} color="var(--ink-dim)" /> },
          { title: "INCIDENT RESOLUTION RATE", value: "98.4%", sub: "Target ≥ 95%", color: "#10B981", icon: <ShieldCheck size={20} color="var(--ink-dim)" /> },
          { title: "AVG RESPONSE / DISPATCH", value: "3.2 min", sub: `${origin} response SLA`, color: "var(--signal-cyan)", icon: <Clock size={20} color="var(--ink-dim)" /> },
          { title: "PRIMARY INCIDENT TYPE", value: primaryIncident, sub: "Telemetry classification", icon: <TrendingUp size={20} color="var(--ink-dim)" /> },
        ].map((kpi, i) => (
          <div key={i} style={{ backgroundColor: "rgba(15, 20, 25, 0.7)", padding: "20px", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ color: "var(--ink-dim)", fontSize: "11px", fontWeight: "bold", letterSpacing: "1px" }}>{kpi.title}</span>
              {kpi.icon}
            </div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: kpi.color || "white", marginBottom: "4px" }}>
              {kpi.value}
            </div>
            <div style={{ color: "var(--ink-dim)", fontSize: "12px" }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Area */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", flex: 1 }}>
        {/* Trend Chart (Mock) */}
        <div style={{ backgroundColor: "rgba(15, 20, 25, 0.7)", padding: "24px", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "white", marginBottom: "4px" }}>Incident Volume vs SafeScore Trend</h3>
          <p style={{ color: "var(--ink-dim)", fontSize: "13px", marginBottom: "24px" }}>6-month rolling overview of logged safety alerts</p>
          
          <div style={{ height: "200px", display: "flex", alignItems: "flex-end", gap: "40px", padding: "0 20px", position: "relative", borderBottom: "1px solid var(--grid-line)", borderLeft: "1px solid var(--grid-line)" }}>
            {/* Extremely basic mock chart using pure CSS for visual resemblance */}
            {["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"].map((month, i) => {
              const safeScoreHeights = [120, 130, 140, 150, 160, 170];
              const incidentHeights = [40, 35, 30, 25, 20, 15];
              return (
                <div key={month} style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative", height: "100%" }}>
                  <div style={{ position: "absolute", bottom: "-24px", color: "var(--ink-dim)", fontSize: "12px" }}>{month}</div>
                  
                  {/* SafeScore Node */}
                  <div style={{ position: "absolute", bottom: `${safeScoreHeights[i]}px`, width: "8px", height: "8px", backgroundColor: "var(--signal-cyan)", borderRadius: "50%", zIndex: 10 }} />
                  {i < 5 && <div style={{ position: "absolute", bottom: `${safeScoreHeights[i] + 4}px`, left: "50%", width: "100%", height: "2px", backgroundColor: "var(--signal-cyan)", transformOrigin: "left", transform: `rotate(-${(safeScoreHeights[i+1]-safeScoreHeights[i])/2}deg)` }} />}
                  
                  {/* Incident Node */}
                  <div style={{ position: "absolute", bottom: `${incidentHeights[i]}px`, width: "8px", height: "8px", backgroundColor: "var(--critical-ember)", borderRadius: "50%", zIndex: 10 }} />
                  {i < 5 && <div style={{ position: "absolute", bottom: `${incidentHeights[i] + 4}px`, left: "50%", width: "100%", height: "2px", backgroundColor: "var(--critical-ember)", transformOrigin: "left", transform: `rotate(${(incidentHeights[i]-incidentHeights[i+1])/2}deg)` }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar Chart (Mock) */}
        <div style={{ backgroundColor: "var(--panel-elevated)", padding: "24px", borderRadius: "var(--radius-lg)", border: "1px solid var(--grid-line)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "white", marginBottom: "4px" }}>Identified Elevated Risk Locations</h3>
          <p style={{ color: "var(--ink-dim)", fontSize: "13px", marginBottom: "24px" }}>Top sectors flagged with safety deviations</p>
          
          <div style={{ height: "200px", display: "flex", alignItems: "flex-end", gap: "20px", padding: "0 10px", borderBottom: "1px solid var(--grid-line)", borderLeft: "1px solid var(--grid-line)" }}>
            {[
              { label: "Subhash Nagar Unit", value: 80 },
              { label: "Tagore Garden", value: 60 },
              { label: "Kasturba Gandhi", value: 30 }
            ].map((bar, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "100%", height: `${bar.value}%`, backgroundColor: "var(--signal-cyan)", borderRadius: "4px 4px 0 0", transition: "height 0.3s" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "20px", marginTop: "12px", padding: "0 10px" }}>
            <div style={{ flex: 1, fontSize: "10px", color: "var(--ink-dim)", textAlign: "center" }}>North Sector</div>
            <div style={{ flex: 1, fontSize: "10px", color: "var(--ink-dim)", textAlign: "center" }}>Central Zone</div>
            <div style={{ flex: 1, fontSize: "10px", color: "var(--ink-dim)", textAlign: "center" }}>South District</div>
          </div>
        </div>
      </div>
    </div>
  );
};
