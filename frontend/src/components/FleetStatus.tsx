import React from "react";
import { Truck, Activity, Navigation, Zap, Battery, BatteryMedium, BatteryLow, AlertTriangle, Users } from "lucide-react";

interface FleetUnit {
  unit_id: string;
  unit_type: string;
  status: string;
  assigned_task_id: string | null;
  fuel_percent: number;
  crew_available: boolean;
}

interface FleetStatusProps {
  fleet: FleetUnit[];
}

export const FleetStatus: React.FC<FleetStatusProps> = ({ fleet }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "AMBULANCE": return <Activity size={20} color="var(--critical-ember)" />;
      case "BOAT": return <Navigation size={20} color="var(--signal-cyan)" />;
      default: return <Truck size={20} color="var(--ink)" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "var(--signal-cyan)";
      case "ASSIGNED": return "var(--dispute-amber)";
      case "IN_TRANSIT": return "#3B82F6";
      case "UNAVAILABLE": return "var(--critical-ember)";
      default: return "var(--ink-dim)";
    }
  };

  const getBatteryIcon = (percent: number) => {
    if (percent > 70) return <Battery size={16} color="var(--signal-cyan)" />;
    if (percent > 30) return <BatteryMedium size={16} color="var(--dispute-amber)" />;
    return <BatteryLow size={16} color="var(--critical-ember)" />;
  };

  return (
    <div style={{ padding: "32px", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "white", marginBottom: "8px" }}>Fleet Status</h2>
        <p style={{ color: "var(--ink-dim)" }}>Real-time telemetry and resource allocation for deployed units</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {fleet.map((unit) => (
          <div key={unit.unit_id} style={{ 
            backgroundColor: "var(--panel-elevated)", 
            padding: "20px", 
            borderRadius: "var(--radius-lg)", 
            border: `1px solid ${getStatusColor(unit.status)}`,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", backgroundColor: getStatusColor(unit.status) }} />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ padding: "8px", backgroundColor: "var(--void)", borderRadius: "8px", border: "1px solid var(--grid-line)" }}>
                  {getIcon(unit.unit_type)}
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "white" }}>{unit.unit_id}</h3>
                  <div style={{ fontSize: "11px", color: "var(--ink-dim)", letterSpacing: "1px", marginTop: "2px" }} className="mono">{unit.unit_type}</div>
                </div>
              </div>
              <div className="mono" style={{ 
                fontSize: "10px", 
                fontWeight: "bold", 
                padding: "4px 8px", 
                borderRadius: "4px", 
                backgroundColor: "var(--void)",
                color: getStatusColor(unit.status),
                border: `1px solid ${getStatusColor(unit.status)}`
              }}>
                {unit.status}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", backgroundColor: "var(--void)", padding: "12px", borderRadius: "8px", border: "1px solid var(--grid-line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {getBatteryIcon(unit.fuel_percent)}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "10px", color: "var(--ink-dim)" }} className="mono">FUEL / BATTERY</span>
                  <span style={{ fontSize: "14px", fontWeight: "bold", color: "white" }}>{unit.fuel_percent}%</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={16} color={unit.crew_available ? "var(--signal-cyan)" : "var(--critical-ember)"} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "10px", color: "var(--ink-dim)" }} className="mono">CREW STATUS</span>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: unit.crew_available ? "var(--signal-cyan)" : "var(--critical-ember)" }}>
                    {unit.crew_available ? "READY" : "UNAVAILABLE"}
                  </span>
                </div>
              </div>
            </div>

            {unit.assigned_task_id && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", backgroundColor: "rgba(232, 163, 61, 0.1)", padding: "8px 12px", borderRadius: "4px", border: "1px solid rgba(232, 163, 61, 0.3)" }}>
                <Zap size={14} color="var(--dispute-amber)" />
                <span className="mono" style={{ fontSize: "11px", color: "var(--dispute-amber)", fontWeight: "bold" }}>
                  TASK: {unit.assigned_task_id}
                </span>
              </div>
            )}
            
            {unit.status === "UNAVAILABLE" && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "8px 12px", borderRadius: "4px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                <AlertTriangle size={14} color="var(--critical-ember)" />
                <span className="mono" style={{ fontSize: "11px", color: "var(--critical-ember)" }}>
                  UNIT OUT OF SERVICE
                </span>
              </div>
            )}
          </div>
        ))}

        {fleet.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--ink-dim)" }}>
            <Truck size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
            <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>No Fleet Units Registered</h3>
            <p>Awaiting telemetry sync with operational command...</p>
          </div>
        )}
      </div>
    </div>
  );
};
