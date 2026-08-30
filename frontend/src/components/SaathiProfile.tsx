import React, { useState } from "react";
import { useDashboardState } from "../hooks/useDashboardState";
import { shoonyaApi } from "../api/shoonyaApi";

export const SaathiProfile: React.FC = () => {
  const { state } = useDashboardState();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const profile = {
    id: "S-204",
    role: "Community First Responder",
    training: ["Basic First Aid", "Crowd Management", "Needs Verification"],
    allowed: ["VERIFICATION", "SHELTER_SUPPORT", "SUPPLY_DISTRIBUTION"],
    notAllowed: ["WATER_RESCUE", "HAZMAT", "HEAVY_DEBRIS"],
    availability: "AVAILABLE"
  };

  const tasks = state?.tasks || [];

  const handleAccept = async (taskId: string) => {
    try {
      setErrorMsg(null);
      await shoonyaApi.acceptTask(taskId, profile.id);
    } catch (e: any) {
      setErrorMsg(e.message || "403 Forbidden: Saathi not permitted for this task.");
    }
  };

  return (
    <div style={{ padding: 24, color: "var(--ink)", height: "100%", overflowY: "auto" }}>
      <h2 className="mono" style={{ color: "var(--signal-cyan)" }}>SAATHI PROFILE: {profile.id}</h2>
      
      <div style={{ backgroundColor: "var(--panel-elevated)", border: "1px solid var(--grid-line)", padding: 24, marginBottom: 24 }}>
        <p><strong>Role:</strong> {profile.role}</p>
        <p><strong>Status:</strong> <span style={{ color: "var(--signal-cyan)" }}>{profile.availability}</span></p>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 16 }}>
          <div>
            <h4 style={{ color: "var(--ink-dim)" }}>TRAINING</h4>
            <ul style={{ paddingLeft: 20 }}>
              {profile.training.map(t => <li key={t}>{t}</li>)}
            </ul>
          </div>
          <div>
            <h4 style={{ color: "var(--signal-cyan)" }}>ALLOWED ACTIONS</h4>
            <ul style={{ paddingLeft: 20 }}>
              {profile.allowed.map(a => <li key={a}>{a}</li>)}
            </ul>
          </div>
          <div>
            <h4 style={{ color: "var(--critical-ember)" }}>NOT ALLOWED</h4>
            <ul style={{ paddingLeft: 20 }}>
              {profile.notAllowed.map(n => <li key={n}>{n}</li>)}
            </ul>
          </div>
        </div>
      </div>

      <h3 className="mono" style={{ color: "var(--ink-dim)" }}>AVAILABLE TASKS</h3>
      {errorMsg && (
        <div style={{ padding: 16, backgroundColor: "var(--critical-ember)", color: "#000", marginBottom: 16, fontWeight: "bold" }}>
          ⚠️ REJECTED: {errorMsg}
        </div>
      )}

      {tasks.length === 0 && <p>No tasks available.</p>}
      {tasks.map((t: any) => (
        <div key={t.task_id} style={{ border: "1px solid var(--grid-line)", padding: 16, marginBottom: 16, backgroundColor: "#111" }}>
          <h4>{t.title}</h4>
          <p>{t.description}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <span style={{ color: "var(--ink-muted)" }}>ID: {t.task_id}</span>
            <button 
              onClick={() => handleAccept(t.task_id)}
              style={{ backgroundColor: "var(--signal-cyan)", color: "#000", border: "none", padding: "8px 16px", cursor: "pointer", fontWeight: "bold" }}
            >
              ACCEPT TASK
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
