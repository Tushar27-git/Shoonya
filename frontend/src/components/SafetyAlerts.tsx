import React, { useState } from "react";
import { AlertTriangle, ShieldAlert, Navigation, Users, Info, ArrowRight } from "lucide-react";

interface Incident {
  incident_id: string;
  category: string;
  priority_score: number;
}

interface SafetyAlertsProps {
  location: string;
  incidents: Incident[];
}

export const SafetyAlerts: React.FC<SafetyAlertsProps> = ({ location, incidents }) => {
  const [persona, setPersona] = useState<"CIVILIAN" | "RESPONDER">("CIVILIAN");

  // AI-generated advisories based on persona and incident type
  const getAdvisory = (category: string) => {
    if (persona === "CIVILIAN") {
      switch (category.toUpperCase()) {
        case "FLOOD":
          return "Move to higher ground immediately. Avoid walking or driving through floodwaters. Secure essential documents in waterproof containers and unplug electrical appliances if safe to do so.";
        case "COLLAPSE":
          return "Stay away from damaged buildings and structures. Do not re-enter your home if it has sustained structural damage. Await official clearance.";
        case "FIRE":
          return "Evacuate the area immediately using stairs, not elevators. Stay low to the ground to avoid smoke inhalation. Cover your nose and mouth with a damp cloth.";
        case "MEDICAL":
          return "Stay calm and keep the affected individual comfortable. Do not move them unless they are in immediate danger. Clear a path for emergency personnel.";
        default:
          return "Remain vigilant and stay indoors if possible. Follow official instructions broadcast over radio or SMS. Keep an emergency kit ready.";
      }
    } else {
      switch (category.toUpperCase()) {
        case "FLOOD":
          return "Deploy flat-bottom boats for shallow water extraction. Prioritize vulnerable demographics (elderly/children). Establish triage zones at dry-ground perimeters. Ensure all rescue personnel wear PFDs.";
        case "COLLAPSE":
          return "Initiate search and rescue protocols. Deploy heavy lifting equipment and structural engineers to assess stability. Establish a safety perimeter of at least 100 meters.";
        case "FIRE":
          return "Coordinate with local fire departments for perimeter control. Prepare medical triage for burn victims and smoke inhalation. Secure evacuation routes and manage crowd control.";
        case "MEDICAL":
          return "Dispatch advanced life support (ALS) units. Prepare for potential mass casualty incident (MCI) triage protocols. Coordinate with nearest level 1 trauma center.";
        default:
          return "Maintain operational readiness. Monitor telemetry feeds and prepare for rapid deployment upon commander authorization.";
      }
    }
  };

  // Mock a default situation if no incidents exist
  const activeSituations = incidents.length > 0 ? incidents : [
    { incident_id: "SIM-001", category: "FLOOD", priority_score: 0.85 }
  ];

  return (
    <div style={{ padding: "32px", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <ShieldAlert size={28} color="var(--critical-ember)" />
          <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "white" }}>AI Safety Advisories</h2>
        </div>
        <p style={{ color: "var(--ink-dim)" }}>Context-aware safety protocols and actionable intelligence for {location}</p>
      </div>

      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--grid-line)", paddingBottom: "16px" }}>
        <button
          onClick={() => setPersona("CIVILIAN")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            backgroundColor: persona === "CIVILIAN" ? "var(--signal-cyan)" : "transparent",
            color: persona === "CIVILIAN" ? "var(--void)" : "var(--ink-dim)",
            border: `1px solid ${persona === "CIVILIAN" ? "var(--signal-cyan)" : "var(--grid-line)"}`,
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <Users size={18} />
          Civilian Guidance
        </button>
        
        <button
          onClick={() => setPersona("RESPONDER")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            backgroundColor: persona === "RESPONDER" ? "var(--dispute-amber)" : "transparent",
            color: persona === "RESPONDER" ? "var(--void)" : "var(--ink-dim)",
            border: `1px solid ${persona === "RESPONDER" ? "var(--dispute-amber)" : "var(--grid-line)"}`,
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <Navigation size={18} />
          Evacuation Team Protocols
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {activeSituations.map((incident) => (
          <div key={incident.incident_id} style={{
            backgroundColor: "var(--panel-elevated)",
            borderRadius: "var(--radius-lg)",
            border: `1px solid ${persona === "CIVILIAN" ? "var(--signal-cyan)" : "var(--dispute-amber)"}`,
            padding: "24px",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", backgroundColor: persona === "CIVILIAN" ? "var(--signal-cyan)" : "var(--dispute-amber)" }} />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <AlertTriangle size={24} color={persona === "CIVILIAN" ? "var(--signal-cyan)" : "var(--dispute-amber)"} />
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "white" }}>
                    {incident.category} SITUATION DETECTED
                  </h3>
                  <span className="mono" style={{ fontSize: "11px", color: "var(--ink-dim)" }}>INCIDENT REF: {incident.incident_id}</span>
                </div>
              </div>
              
              <div className="mono" style={{
                fontSize: "10px",
                fontWeight: "bold",
                padding: "4px 8px",
                backgroundColor: "var(--void)",
                color: incident.priority_score > 0.7 ? "var(--critical-ember)" : "var(--ink-dim)",
                border: "1px solid var(--grid-line)",
                borderRadius: "4px"
              }}>
                SEVERITY: {Math.round(incident.priority_score * 100)}%
              </div>
            </div>

            <div style={{
              backgroundColor: "var(--void)",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid var(--grid-line)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Info size={16} color="var(--signal-cyan)" />
                <span className="mono" style={{ fontSize: "11px", color: "var(--ink-dim)", letterSpacing: "1px" }}>
                  AI GENERATED ADVISORY // {persona}
                </span>
              </div>
              
              <p style={{ fontSize: "15px", color: "white", lineHeight: "1.6", letterSpacing: "0.2px" }}>
                {getAdvisory(incident.category)}
              </p>
            </div>
            
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "transparent",
                color: persona === "CIVILIAN" ? "var(--signal-cyan)" : "var(--dispute-amber)",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold"
              }}>
                Acknowledge Advisory <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
