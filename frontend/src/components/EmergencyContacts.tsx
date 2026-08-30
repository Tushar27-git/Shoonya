import React, { useState } from "react";
import { X, Phone, Heart, Users, Navigation, Radio, Shield, Network } from "lucide-react";

interface EmergencyContactsProps {
  isOpen: boolean;
  onClose: () => void;
  location: string;
}

export const EmergencyContacts: React.FC<EmergencyContactsProps> = ({ isOpen, onClose, location }) => {
  const [persona, setPersona] = useState<"CIVILIAN" | "RESPONDER">("CIVILIAN");

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(4px)"
    }}>
      <div style={{
        backgroundColor: "var(--panel-elevated)",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "600px",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        boxShadow: "0 0 20px rgba(239, 68, 68, 0.1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: "90vh"
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "1px solid rgba(239, 68, 68, 0.2)"
        }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%",
              backgroundColor: "var(--critical-ember)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Shield size={24} color="var(--void)" />
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "white" }}>Emergency SOS Response</h2>
              <p style={{ color: "var(--critical-ember)", fontSize: "14px", marginTop: "4px" }}>
                Active Comm Channels for {location}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ink-dim)", cursor: "pointer" }}>
            <X size={24} />
          </button>
        </div>

        {/* Persona Toggle */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--grid-line)", padding: "16px 24px" }}>
          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button
              onClick={() => setPersona("CIVILIAN")}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px",
                backgroundColor: persona === "CIVILIAN" ? "var(--signal-cyan)" : "transparent",
                color: persona === "CIVILIAN" ? "var(--void)" : "var(--ink-dim)",
                border: `1px solid ${persona === "CIVILIAN" ? "var(--signal-cyan)" : "var(--grid-line)"}`,
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <Users size={16} />
              Civilian Help
            </button>
            <button
              onClick={() => setPersona("RESPONDER")}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px",
                backgroundColor: persona === "RESPONDER" ? "var(--dispute-amber)" : "transparent",
                color: persona === "RESPONDER" ? "var(--void)" : "var(--ink-dim)",
                border: `1px solid ${persona === "RESPONDER" ? "var(--dispute-amber)" : "var(--grid-line)"}`,
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <Network size={16} />
              Team / Responder Comms
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div style={{ padding: "24px", overflowY: "auto" }}>
          
          {persona === "CIVILIAN" ? (
            <>
              {/* Civilian Content */}
              <h3 className="mono" style={{ color: "var(--ink-dim)", fontSize: "12px", marginBottom: "16px", letterSpacing: "1px" }}>
                OFFICIAL HELPLINES
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
                {[
                  { name: "National Emergency", number: "112" },
                  { name: "Disaster Management", number: "1078" },
                  { name: "Ambulance", number: "102" },
                  { name: "Police", number: "100" }
                ].map(h => (
                  <div key={h.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", backgroundColor: "var(--void)", border: "1px solid var(--grid-line)", borderRadius: "8px" }}>
                    <span style={{ fontWeight: "bold", color: "white", fontSize: "14px" }}>{h.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--brand-purple)" }}>
                      <Phone size={16} />
                      <span className="mono" style={{ fontWeight: "bold" }}>{h.number}</span>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="mono" style={{ color: "var(--ink-dim)", fontSize: "12px", marginBottom: "16px", letterSpacing: "1px" }}>
                VERIFIED LOCAL SAATHIS & NGOs
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { name: "Rahul Verma", distance: "0.8 km", skills: "First Aid, Ham Radio", type: "SAATHI" },
                  { name: "Priya Singh", distance: "1.2 km", skills: "Search & Rescue", type: "SAATHI" },
                  { name: "Umeed NGO Local Chapter", distance: "2.5 km", skills: "Food & Shelter, Evacuation", type: "NGO" }
                ].map(s => (
                  <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", backgroundColor: "var(--void)", border: "1px solid var(--grid-line)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      <div style={{ padding: "10px", backgroundColor: "rgba(111, 107, 246, 0.1)", borderRadius: "50%" }}>
                        <Heart size={20} color="var(--brand-purple)" />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontWeight: "bold", color: "white", fontSize: "16px" }}>{s.name}</span>
                          <span className="mono" style={{ fontSize: "9px", padding: "2px 6px", backgroundColor: "var(--panel)", borderRadius: "4px", color: "var(--ink-dim)" }}>
                            {s.type}
                          </span>
                        </div>
                        <span style={{ color: "var(--ink-dim)", fontSize: "13px" }}>{s.distance} • {s.skills}</span>
                      </div>
                    </div>
                    <button style={{
                      backgroundColor: "var(--brand-purple)", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer"
                    }}>
                      Contact
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Responder Content */}
              <h3 className="mono" style={{ color: "var(--ink-dim)", fontSize: "12px", marginBottom: "16px", letterSpacing: "1px" }}>
                TACTICAL COMMAND & SQUAD LEADERS
              </h3>
              <div style={{ display: "grid", gap: "12px", marginBottom: "32px" }}>
                {[
                  { name: "EOC Alpha Command", role: "Incident Commander", channel: "UHF CH-4", online: true },
                  { name: "Sector 4 Evac Team", role: "Field Squad", channel: "UHF CH-9", online: true },
                  { name: "Logistics Hub B", role: "Supply Depot", channel: "UHF CH-2", online: false }
                ].map(r => (
                  <div key={r.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", backgroundColor: "var(--void)", border: "1px solid var(--grid-line)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      <div style={{ position: "relative", padding: "10px", backgroundColor: "rgba(232, 163, 61, 0.1)", borderRadius: "8px", border: "1px solid rgba(232, 163, 61, 0.3)" }}>
                        <Radio size={20} color="var(--dispute-amber)" />
                        <span style={{ position: "absolute", top: "-2px", right: "-2px", width: "10px", height: "10px", backgroundColor: r.online ? "var(--signal-cyan)" : "var(--critical-ember)", borderRadius: "50%", border: "2px solid var(--void)" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: "bold", color: "white", fontSize: "16px", marginBottom: "4px" }}>{r.name}</div>
                        <span style={{ color: "var(--ink-dim)", fontSize: "13px" }}>{r.role}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span className="mono" style={{ fontSize: "12px", color: "var(--dispute-amber)" }}>{r.channel}</span>
                      <button style={{
                        backgroundColor: "transparent", color: "var(--dispute-amber)", border: "1px solid var(--dispute-amber)", padding: "8px 16px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer"
                      }}>
                        Hail
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="mono" style={{ color: "var(--ink-dim)", fontSize: "12px", marginBottom: "16px", letterSpacing: "1px" }}>
                INTER-AGENCY LIAISONS
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { name: "NDRF Local Base", status: "STANDBY" },
                  { name: "Air Ambulance Dispatch", status: "BUSY" },
                  { name: "State Police HQ", status: "AVAILABLE" },
                  { name: "Water Rescue Unit", status: "DEPLOYED" }
                ].map(a => (
                  <div key={a.name} style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "16px", backgroundColor: "var(--void)", border: "1px solid var(--grid-line)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontWeight: "bold", color: "white", fontSize: "14px" }}>{a.name}</span>
                      <Phone size={14} color="var(--ink-dim)" />
                    </div>
                    <span className="mono" style={{ 
                      fontSize: "10px", 
                      color: a.status === "AVAILABLE" || a.status === "STANDBY" ? "var(--signal-cyan)" : "var(--critical-ember)", 
                      fontWeight: "bold" 
                    }}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
