import React, { useState } from "react";
import { Truck, CheckCircle, AlertTriangle, RefreshCw, Shield, Clock, User, ChevronRight, Loader } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

interface AssignmentProposal {
  incident_id: string;
  resource_id: string;
  resource_type: string;
  eta_minutes: number;
}

interface DispatchPlan {
  plan_quality: string;
  assignments: AssignmentProposal[];
}

interface DispatchPanelProps {
  incidents: any[];
  resources: any[];
}

export const DispatchPanel: React.FC<DispatchPanelProps> = ({ incidents, resources }) => {
  const [plan, setPlan] = useState<DispatchPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approveSuccess, setApproveSuccess] = useState<string | null>(null);
  const [approverIdInput, setApproverIdInput] = useState("");
  const [approverRoleInput, setApproverRoleInput] = useState("FIELD_COMMANDER");
  const [approveError, setApproveError] = useState<string | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    setIsGenerating(true);
    setApproveSuccess(null);
    setApproveError(null);
    try {
      const incidentPayload = incidents.map(i => ({
        incident_id: i.incident_id,
        category: i.category,
        priority_score: i.priority_score,
        route_segment_id: i.zone_id,
      }));

      const resourcePayload = resources.map(r => ({
        resource_id: r.resource_id,
        type: r.type,
        available: r.availability_status === "AVAILABLE",
      }));

      const res = await fetch(`${API_BASE}/dispatch/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidents: incidentPayload,
          resources: resourcePayload,
          closed_road_segments: [],
          disputed_road_segments: [],
        }),
      });

      const data: DispatchPlan = await res.json();
      setPlan(data);
      setSelectedAssignments(new Set(data.assignments.map((a) => a.incident_id)));
    } catch (e) {
      console.error("Dispatch plan error", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!plan) return;
    if (!approverIdInput.trim()) {
      setApproveError("Approver ID is required.");
      return;
    }

    setIsApproving(true);
    setApproveError(null);
    try {
      const approved = plan.assignments.filter(a => selectedAssignments.has(a.incident_id));
      const res = await fetch(`${API_BASE}/dispatch/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approver_id: approverIdInput.trim(),
          approver_role: approverRoleInput,
          approval_timestamp: new Date().toISOString(),
          approved_assignments: approved,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setApproveSuccess(`DISPATCH COMMITTED — Audit Block #${data.audit_index} | Hash: ${data.hash.slice(0, 16)}...`);
      } else {
        setApproveError(data.detail || "Approval failed.");
      }
    } catch (e) {
      setApproveError("Network error during approval.");
    } finally {
      setIsApproving(false);
    }
  };

  const toggleAssignment = (incidentId: string) => {
    setSelectedAssignments(prev => {
      const next = new Set(prev);
      next.has(incidentId) ? next.delete(incidentId) : next.add(incidentId);
      return next;
    });
  };

  const resourceTypeColors: Record<string, string> = {
    BOAT: "#22D3EE",
    AMBULANCE: "#F87171",
    EXCAVATOR: "#FB923C",
    MEDICAL_TEAM: "#4ADE80",
    RESCUE_HELICOPTER: "#A78BFA",
    MEDICAL: "#4ADE80",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
          <Truck size={28} color="var(--signal-cyan)" />
          <h2 style={{ fontSize: "26px", fontWeight: "bold", color: "white" }}>Dispatch Control</h2>
        </div>
        <p style={{ color: "var(--ink-dim)", fontSize: "13px" }}>
          AI-generated optimal resource assignments. Generate a plan, review assignments, then approve with your officer ID.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "ACTIVE INCIDENTS", value: incidents.length.toString() },
          { label: "AVAILABLE RESOURCES", value: resources.filter(r => r.availability_status === "AVAILABLE").length.toString() },
          { label: "ASSIGNMENTS READY", value: plan ? plan.assignments.length.toString() : "—" },
          { label: "PLAN QUALITY", value: plan ? plan.plan_quality.replace("PLAN QUALITY: ", "") : "NOT GENERATED", color: plan ? "#10B981" : "var(--ink-dim)" },
        ].map((s, i) => (
          <div key={i} style={{ backgroundColor: "var(--panel-elevated)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--grid-line)" }}>
            <div style={{ fontSize: "10px", color: "var(--ink-dim)", fontWeight: "bold", letterSpacing: "1px", marginBottom: "8px" }} className="mono">{s.label}</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: s.color || "white" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Generate Button */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || incidents.length === 0}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            backgroundColor: isGenerating ? "var(--panel-elevated)" : "var(--signal-cyan)",
            color: "white", border: "none", borderRadius: "var(--radius-md)",
            padding: "12px 24px", fontSize: "14px", fontWeight: "bold", cursor: "pointer",
            opacity: incidents.length === 0 ? 0.5 : 1,
          }}
        >
          {isGenerating ? <Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={16} />}
          {isGenerating ? "GENERATING PLAN..." : "GENERATE DISPATCH PLAN"}
        </button>
        {incidents.length === 0 && (
          <span style={{ color: "var(--ink-dim)", fontSize: "12px" }}>Run a simulation first to populate incidents</span>
        )}
      </div>

      {/* Assignment List */}
      {plan && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "white", marginBottom: "4px" }}>
            Proposed Assignments — {plan.assignments.length} units
          </h3>
          {plan.assignments.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--ink-dim)", backgroundColor: "var(--panel)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--grid-line)" }}>
              No viable assignments generated. Insufficient resources for current incident load.
            </div>
          ) : (
            plan.assignments.map((a) => (
              <div
                key={a.incident_id}
                onClick={() => toggleAssignment(a.incident_id)}
                style={{
                  backgroundColor: selectedAssignments.has(a.incident_id) ? "rgba(79, 70, 229, 0.1)" : "var(--panel)",
                  border: `1px solid ${selectedAssignments.has(a.incident_id) ? "var(--signal-cyan)" : "var(--grid-line)"}`,
                  borderRadius: "var(--radius-lg)", padding: "16px 20px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  cursor: "pointer", transition: "all 0.15s ease",
                  position: "relative", overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, width: "4px", bottom: 0, backgroundColor: resourceTypeColors[a.resource_type] || "var(--signal-cyan)" }} />
                <div style={{ marginLeft: "12px", display: "flex", gap: "32px", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--ink-dim)", marginBottom: "4px" }} className="mono">INCIDENT</div>
                    <div style={{ fontSize: "13px", color: "white", fontWeight: "bold" }} className="mono">{a.incident_id}</div>
                  </div>
                  <ChevronRight size={16} color="var(--ink-dim)" />
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--ink-dim)", marginBottom: "4px" }} className="mono">RESOURCE</div>
                    <div style={{ fontSize: "13px", fontWeight: "bold", color: resourceTypeColors[a.resource_type] || "white" }}>{a.resource_id}</div>
                  </div>
                  <div style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <span style={{ fontSize: "11px", color: "var(--ink-dim)" }}>{a.resource_type}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={13} color="var(--ink-dim)" />
                    <span style={{ fontSize: "12px", color: "var(--ink-dim)" }}>{a.eta_minutes} min ETA</span>
                  </div>
                </div>
                <div>
                  {selectedAssignments.has(a.incident_id)
                    ? <CheckCircle size={20} color="var(--signal-cyan)" />
                    : <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid var(--grid-line)" }} />
                  }
                </div>
              </div>
            ))
          )}

          {/* Approval Section */}
          {plan.assignments.length > 0 && (
            <div style={{ marginTop: "8px", backgroundColor: "var(--panel)", borderRadius: "var(--radius-lg)", border: "1px solid var(--grid-line)", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={18} color="var(--dispute-amber)" />
                <h4 style={{ color: "var(--dispute-amber)", fontWeight: "bold", fontSize: "14px" }}>Human Approval Required</h4>
              </div>
              <p style={{ color: "var(--ink-dim)", fontSize: "12px" }}>
                {selectedAssignments.size} of {plan.assignments.length} assignments selected. Enter your officer ID and role to commit dispatch to the cryptographic audit chain.
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "var(--void)", border: "1px solid var(--grid-line)", borderRadius: "var(--radius-md)", padding: "8px 12px", flex: 1 }}>
                  <User size={14} color="var(--ink-dim)" />
                  <input
                    type="text"
                    placeholder="Officer ID (e.g. CMD-007)"
                    value={approverIdInput}
                    onChange={e => setApproverIdInput(e.target.value)}
                    style={{ background: "transparent", border: "none", outline: "none", color: "white", fontSize: "13px", flex: 1 }}
                    className="mono"
                  />
                </div>
                <select
                  value={approverRoleInput}
                  onChange={e => setApproverRoleInput(e.target.value)}
                  style={{ backgroundColor: "var(--void)", border: "1px solid var(--grid-line)", borderRadius: "var(--radius-md)", padding: "8px 12px", color: "white", fontSize: "13px", cursor: "pointer" }}
                >
                  <option value="FIELD_COMMANDER">Field Commander</option>
                  <option value="DISTRICT_DIRECTOR">District Director</option>
                  <option value="CONTROL_ROOM_OPERATOR">Control Room Operator</option>
                  <option value="INCIDENT_COMMANDER">Incident Commander</option>
                </select>
              </div>

              {approveError && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--critical-ember)", fontSize: "12px" }}>
                  <AlertTriangle size={14} /> {approveError}
                </div>
              )}

              {approveSuccess && (
                <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid #10B981", borderRadius: "var(--radius-md)", padding: "12px 16px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <CheckCircle size={16} color="#10B981" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ color: "#10B981", fontSize: "12px" }} className="mono">{approveSuccess}</span>
                </div>
              )}

              <button
                onClick={handleApprove}
                disabled={isApproving || selectedAssignments.size === 0}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  backgroundColor: isApproving ? "var(--panel-elevated)" : "#10B981",
                  color: "white", border: "none", borderRadius: "var(--radius-md)",
                  padding: "12px 24px", fontSize: "14px", fontWeight: "bold", cursor: "pointer",
                  opacity: selectedAssignments.size === 0 ? 0.5 : 1,
                }}
              >
                {isApproving ? <Loader size={16} /> : <CheckCircle size={16} />}
                {isApproving ? "COMMITTING TO AUDIT CHAIN..." : `APPROVE & DISPATCH (${selectedAssignments.size} units)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
