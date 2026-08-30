import React from "react";
import { PhoneCall, Heart, ShieldAlert, X } from "lucide-react";

interface EmergencyContactsProps {
  isOpen: boolean;
  onClose: () => void;
  location: string;
}

export const EmergencyContacts: React.FC<EmergencyContactsProps> = ({ isOpen, onClose, location }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.8)",
      backdropFilter: "blur(4px)",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        width: "600px",
        backgroundColor: "var(--panel)",
        border: "1px solid var(--critical-ember)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(239, 68, 68, 0.25)"
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          padding: "20px 24px",
          borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ backgroundColor: "var(--critical-ember)", padding: "8px", borderRadius: "50%" }}>
              <ShieldAlert size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "white" }}>Emergency SOS Response</h2>
              <p style={{ color: "var(--critical-ember)", fontSize: "14px" }}>Active Local Contacts for {location}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ink-dim)", cursor: "pointer" }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Helplines */}
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "var(--ink-dim)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Official Helplines</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { name: "National Emergency", number: "112" },
                { name: "Disaster Management", number: "1078" },
                { name: "Ambulance", number: "102" },
                { name: "Police", number: "100" },
              ].map(help => (
                <div key={help.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--panel-elevated)", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--grid-line)" }}>
                  <span style={{ color: "white", fontWeight: "bold" }}>{help.name}</span>
                  <a href={`tel:${help.number}`} style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--signal-cyan)", textDecoration: "none", fontWeight: "bold" }}>
                    <PhoneCall size={16} />
                    {help.number}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Volunteers / Saathis */}
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "var(--ink-dim)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Verified Local Saathis (Volunteers)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { name: "Rahul Verma", dist: "0.8 km", skills: "First Aid, Ham Radio" },
                { name: "Priya Singh", dist: "1.2 km", skills: "Search & Rescue" },
              ].map(saathi => (
                <div key={saathi.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--panel-elevated)", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--grid-line)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ backgroundColor: "rgba(79, 70, 229, 0.1)", padding: "8px", borderRadius: "50%" }}>
                      <Heart size={16} color="var(--signal-cyan)" />
                    </div>
                    <div>
                      <div style={{ color: "white", fontWeight: "bold" }}>{saathi.name}</div>
                      <div style={{ color: "var(--ink-dim)", fontSize: "12px" }}>{saathi.dist} • {saathi.skills}</div>
                    </div>
                  </div>
                  <button style={{ backgroundColor: "var(--signal-cyan)", border: "none", padding: "8px 16px", borderRadius: "var(--radius-sm)", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                    Contact
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
