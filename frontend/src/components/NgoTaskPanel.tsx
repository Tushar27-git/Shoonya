import React from "react";

interface NgoTaskPanelProps {
  needs: any[];
  acceptedTasks: Set<string>;
  onAcceptTask: (id: string) => void;
}

export const NgoTaskPanel: React.FC<NgoTaskPanelProps> = ({ needs, acceptedTasks, onAcceptTask }) => {
  return (
    <div style={{ padding: "24px", color: "var(--ink)", height: "100%", overflowY: "auto" }}>
      <h2 className="mono" style={{ color: "var(--signal-cyan)", marginBottom: "24px" }}>NGO TASK ASSIGNMENTS</h2>
      
      {needs.length === 0 ? (
        <div style={{ color: "var(--ink-dim)" }}>No verified needs available at this time.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "16px" }}>
          {needs.map(need => (
            <div key={need.incident_id} style={{ 
              backgroundColor: "var(--panel-elevated)", 
              border: `1px solid ${acceptedTasks.has(need.incident_id) ? "var(--signal-cyan)" : "var(--grid-line)"}`,
              padding: "16px" 
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <strong className="mono" style={{ color: "var(--signal-cyan)" }}>{need.incident_id}</strong>
                <span className="mono" style={{ 
                  color: acceptedTasks.has(need.incident_id) ? "var(--signal-cyan)" : "var(--dispute-amber)" 
                }}>
                  {acceptedTasks.has(need.incident_id) ? "ACCEPTED" : need.status_label}
                </span>
              </div>
              
              <div style={{ marginBottom: "12px", fontSize: "14px" }}>
                <div><strong>Location:</strong> {need.location_general || "Unknown"}</div>
                <div><strong>Affected:</strong> {need.affected_population} individuals</div>
                <div><strong>Items Needed:</strong> {need.needed_items.join(", ")}</div>
              </div>

              <div className="hatched-amber" style={{ padding: "8px", border: "1px solid var(--dispute-amber)", marginBottom: "16px", fontSize: "12px", color: "var(--dispute-amber)" }}>
                <strong>Access Note:</strong> {need.access_note}
              </div>

              {need.recommended_partners && need.recommended_partners.length > 0 && (
                <div style={{ marginBottom: "16px", fontSize: "12px", color: "var(--ink-dim)" }}>
                  <strong>Recommended Partner:</strong> {need.recommended_partners[0]}
                </div>
              )}

              <button 
                className="mono"
                onClick={() => onAcceptTask(need.incident_id)}
                disabled={acceptedTasks.has(need.incident_id)}
                style={{
                  width: "100%", padding: "8px", fontWeight: "bold",
                  backgroundColor: acceptedTasks.has(need.incident_id) ? "var(--ink-muted)" : "var(--signal-cyan)",
                  color: acceptedTasks.has(need.incident_id) ? "var(--ink)" : "var(--void)",
                  border: "none", cursor: acceptedTasks.has(need.incident_id) ? "not-allowed" : "pointer"
                }}
              >
                {acceptedTasks.has(need.incident_id) ? "TASK ACCEPTED" : "ACCEPT TASK"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
