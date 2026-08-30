import React from "react";
// domain unused
import { useDashboardState } from "../hooks/useDashboardState";

export const ImpactBoard: React.FC = () => {
  const { state, loading } = useDashboardState();
  if (loading || !state) return <div>Loading Impact Board...</div>;
  
  const activeCritical = (state.incidents || []).filter((i: any) => i.priority === "CRITICAL" && i.status !== "RESOLVED").length;
  const darkZones = (state.dark_zones || []).length;
  const disputes = (state.road_disputes || []).length;
  const tasks = state.tasks || [];
  const tasksCreated = tasks.length;
  const tasksAccepted = tasks.filter((t: any) => t.status === "ASSIGNED" || t.status === "EN_ROUTE").length;
  const tasksCompleted = tasks.filter((t: any) => t.status === "RESOLVED").length;
  const gapFulfilled = tasksCreated > 0 ? Math.round(((tasksAccepted + tasksCompleted) / tasksCreated) * 100) : 0;
  
  const cards = state.amplify_cards || [];
  const cardsDrafted = cards.length;
  const cardsApproved = cards.filter((c: any) => c.status === "APPROVED").length;
  const auditCount = (state.audit_timeline || []).length;
  const rawQueue = state.counters?.queue || 0;
  
  return (
    <div style={{ padding: "24px", color: "var(--ink)", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <h2 className="mono" style={{ color: "var(--signal-cyan)", margin: 0 }}>SYSTEM IMPACT BOARD</h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
        
        {/* Cluster 1: Processing */}
        <div style={{ backgroundColor: "var(--panel-elevated)", border: "1px solid var(--grid-line)", padding: "24px" }}>
          <h3 className="mono" style={{ color: "var(--ink-dim)", marginBottom: "16px" }}>DATA PIPELINE</h3>
          <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
            <div>
              <div className="mono" style={{ fontSize: "36px", color: "var(--ink)", fontWeight: "bold" }}>{rawQueue}</div>
              <div className="mono" style={{ fontSize: "12px", color: "var(--ink-muted)" }}>RAW REPORTS</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: "36px", color: "var(--signal-cyan)", fontWeight: "bold" }}>{state.incidents?.length || 0}</div>
              <div className="mono" style={{ fontSize: "12px", color: "var(--ink-muted)" }}>CLUSTERS</div>
            </div>
          </div>
        </div>

        {/* Cluster 2: Ground Truth */}
        <div style={{ backgroundColor: "var(--panel-elevated)", border: "1px solid var(--grid-line)", padding: "24px" }}>
          <h3 className="mono" style={{ color: "var(--ink-dim)", marginBottom: "16px" }}>SITUATIONAL AWARENESS</h3>
          <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
            <div>
              <div className="mono" style={{ fontSize: "36px", color: "var(--critical-ember)", fontWeight: "bold" }}>{activeCritical}</div>
              <div className="mono" style={{ fontSize: "12px", color: "var(--ink-muted)" }}>ACTIVE CRITICAL</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: "36px", color: "var(--ink)", fontWeight: "bold" }}>{darkZones}</div>
              <div className="mono" style={{ fontSize: "12px", color: "var(--ink-muted)" }}>DARK ZONES</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: "36px", color: "var(--dispute-amber)", fontWeight: "bold" }}>{disputes}</div>
              <div className="mono" style={{ fontSize: "12px", color: "var(--ink-muted)" }}>DISPUTES</div>
            </div>
          </div>
        </div>

        {/* Cluster 3: Action */}
        <div style={{ backgroundColor: "var(--panel-elevated)", border: "1px solid var(--grid-line)", padding: "24px", gridColumn: "span 2" }}>
          <h3 className="mono" style={{ color: "var(--ink-dim)", marginBottom: "16px" }}>LOGISTICS & COMMUNICATION</h3>
          <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
            <div>
              <div className="mono" style={{ fontSize: "36px", color: "var(--signal-cyan)", fontWeight: "bold" }}>{tasksCreated} / {tasksAccepted}</div>
              <div className="mono" style={{ fontSize: "12px", color: "var(--ink-muted)" }}>TASKS (OPEN/ACCEPTED)</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: "36px", color: "var(--signal-cyan)", fontWeight: "bold" }}>{gapFulfilled}%</div>
              <div className="mono" style={{ fontSize: "12px", color: "var(--ink-muted)" }}>RESOURCE GAP FULFILLED</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: "36px", color: "var(--ink)", fontWeight: "bold" }}>{cardsDrafted} / {cardsApproved}</div>
              <div className="mono" style={{ fontSize: "12px", color: "var(--ink-muted)" }}>AMPLIFY (DRAFT/APPROVED)</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: "36px", color: "var(--ink)", fontWeight: "bold" }}>{auditCount}</div>
              <div className="mono" style={{ fontSize: "12px", color: "var(--ink-muted)" }}>AUDIT EVENTS</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
