import React, { useState } from "react";
import { useDashboardState } from "../hooks/useDashboardState";
import { shoonyaApi } from "../api/shoonyaApi";
import { User, CheckCircle2, XCircle, BookOpen, AlertTriangle, Briefcase, ChevronRight, Fingerprint, ShieldCheck } from "lucide-react";

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
    <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "24px", color: "var(--ink)" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <Fingerprint size={28} color="var(--signal-cyan)" />
          <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "white" }}>Operator Profile</h2>
        </div>
        <p style={{ color: "var(--ink-dim)" }}>Identity verification, access control, and active field assignments</p>
      </div>

      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "24px", 
        backgroundColor: "var(--panel-elevated)", 
        borderRadius: "var(--radius-lg)", 
        border: "1px solid var(--grid-line)",
        padding: "24px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "4px", bottom: 0, backgroundColor: "var(--signal-cyan)" }} />
        
        {/* Header Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginLeft: "12px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ padding: "12px", backgroundColor: "rgba(79, 216, 196, 0.1)", borderRadius: "50%", border: "1px solid rgba(79, 216, 196, 0.2)" }}>
              <User size={32} color="var(--signal-cyan)" />
            </div>
            <div>
              <h3 className="mono" style={{ fontSize: "24px", fontWeight: "bold", color: "white" }}>{profile.id}</h3>
              <div style={{ fontSize: "14px", color: "var(--ink-dim)", marginTop: "4px" }}>{profile.role}</div>
            </div>
          </div>
          
          <div className="mono" style={{ 
            fontSize: "12px", 
            fontWeight: "bold", 
            padding: "6px 12px", 
            borderRadius: "4px", 
            backgroundColor: "rgba(79, 216, 196, 0.1)",
            color: "var(--signal-cyan)",
            border: "1px solid var(--signal-cyan)",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <ShieldCheck size={14} />
            {profile.availability}
          </div>
        </div>

        {/* Clearances Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginLeft: "12px" }}>
          
          {/* Training */}
          <div style={{ backgroundColor: "var(--void)", padding: "16px", borderRadius: "8px", border: "1px solid var(--grid-line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <BookOpen size={16} color="var(--ink-dim)" />
              <h4 className="mono" style={{ color: "var(--ink-dim)", fontSize: "11px" }}>CERTIFIED TRAINING</h4>
            </div>
            <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
              {profile.training.map(t => (
                <li key={t} style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "4px", height: "4px", backgroundColor: "var(--ink-dim)", borderRadius: "50%" }} />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Allowed Actions */}
          <div style={{ backgroundColor: "var(--void)", padding: "16px", borderRadius: "8px", border: "1px solid var(--grid-line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <CheckCircle2 size={16} color="var(--signal-cyan)" />
              <h4 className="mono" style={{ color: "var(--signal-cyan)", fontSize: "11px" }}>CLEARED ACTIONS</h4>
            </div>
            <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
              {profile.allowed.map(a => (
                <li key={a} style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "4px", height: "4px", backgroundColor: "var(--signal-cyan)", borderRadius: "50%" }} />
                  {a}
                </li>
              ))}
            </ul>
          </div>

          {/* Not Allowed */}
          <div style={{ backgroundColor: "var(--void)", padding: "16px", borderRadius: "8px", border: "1px solid var(--grid-line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <XCircle size={16} color="var(--critical-ember)" />
              <h4 className="mono" style={{ color: "var(--critical-ember)", fontSize: "11px" }}>RESTRICTED ACTIONS</h4>
            </div>
            <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
              {profile.notAllowed.map(n => (
                <li key={n} style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "4px", height: "4px", backgroundColor: "var(--critical-ember)", borderRadius: "50%" }} />
                  {n}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Available Tasks Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Briefcase size={20} color="var(--ink-dim)" />
          <h3 className="mono" style={{ color: "var(--ink-dim)", fontSize: "14px" }}>PENDING ASSIGNMENTS ({tasks.length})</h3>
        </div>
        
        {errorMsg && (
          <div style={{ 
            padding: "16px", 
            backgroundColor: "rgba(239, 68, 68, 0.1)", 
            color: "var(--critical-ember)", 
            borderRadius: "8px",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <AlertTriangle size={20} />
            <span className="mono" style={{ fontWeight: "bold", fontSize: "12px" }}>ACCESS DENIED: {errorMsg}</span>
          </div>
        )}

        {tasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", backgroundColor: "var(--panel-elevated)", borderRadius: "8px", border: "1px dashed var(--grid-line)" }}>
            <p style={{ color: "var(--ink-muted)" }}>No tasks currently available for dispatch.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {tasks.map((t: any) => (
              <div key={t.task_id} style={{ 
                border: "1px solid var(--grid-line)", 
                padding: "20px", 
                borderRadius: "8px", 
                backgroundColor: "var(--panel-elevated)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h4 style={{ fontSize: "16px", fontWeight: "bold", color: "white", marginBottom: "4px" }}>{t.title || "Unclassified Task"}</h4>
                    <p style={{ fontSize: "13px", color: "var(--ink-dim)", lineHeight: "1.4" }}>{t.description || "No description provided."}</p>
                  </div>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--ink-muted)", backgroundColor: "var(--void)", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--grid-line)" }}>
                    ID: {t.task_id || "UNKNOWN"}
                  </span>
                </div>
                
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button 
                    onClick={() => handleAccept(t.task_id)}
                    style={{ 
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: "rgba(79, 216, 196, 0.1)", 
                      color: "var(--signal-cyan)", 
                      border: "1px solid var(--signal-cyan)", 
                      padding: "8px 16px", 
                      borderRadius: "4px",
                      cursor: "pointer", 
                      fontWeight: "bold",
                      fontSize: "11px",
                      transition: "all 0.2s"
                    }}
                    className="mono"
                  >
                    ACCEPT ASSIGNMENT <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
