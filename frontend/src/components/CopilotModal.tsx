import React, { useState } from "react";
import { Bot, Send, FileText, AlertTriangle, X, ArrowRight, CheckCircle2 } from "lucide-react";
import type { SitrepResponse } from "../types/domain";

interface CopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
  onExecuteAction?: (actionType: string, targetId: string, params?: Record<string, any>) => void;
}

export const CopilotModal: React.FC<CopilotModalProps> = ({
  isOpen,
  onClose,
  selectedIncidentId,
  onSelectIncident,
  onExecuteAction,
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{
    role: "user" | "copilot";
    text: string;
    citations?: string[];
    caveats?: string[];
    actions?: Array<{ label?: string; action_type?: string; target_id?: string; description?: string; parameters?: Record<string, any> }>;
    timestamp?: string;
  }>>([
    {
      role: "copilot",
      text: "SHOONYA Tactical Copilot ready. Real-time situational intelligence, contradiction analysis, dark-zone surveillance, and automated SITREP generation active.\n\nAsk about active sector incidents, rescue fleet routing, hospital surge, or type an incident ID (e.g., INC-W07-01).",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || query;
    if (!textToSend.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { role: "user", text: textToSend, timestamp: timeStr }]);
    setQuery("");
    setIsLoading(true);
    setActionSuccessMsg(null);

    try {
      const res = await fetch("http://127.0.0.1:8001/copilot/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          focus_incident_id: selectedIncidentId,
        }),
      });

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data: any = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: data.content || data.answer || "Query processed.",
          citations: data.citations || data.evidence_refs || [],
          caveats: data.confidence_caveats || data.warnings || [],
          actions: data.proposed_actions || (data.proposed_action ? [data.proposed_action] : []),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: `EOC Copilot query error: ${e.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchSitrep = async () => {
    setIsLoading(true);
    setActionSuccessMsg(null);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { role: "user", text: "Generate Current EOC Situation Report (SITREP)", timestamp: timeStr }]);

    try {
      const res = await fetch("http://127.0.0.1:8001/copilot/sitrep");
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data: SitrepResponse = await res.json();
      
      const bounds = data.casualty_bounds || { min: 0, max: 0, best_guess: 0 };
      const sitrepText = `STANDARDIZED SITUATION REPORT // ${data.sitrep_id}

${data.executive_summary}

• Active Incidents: ${data.total_active_incidents} (Critical: ${data.critical_incidents_count || 0}, Disputed: ${data.disputed_incidents_count})
• Estimated Casualties: [${bounds.min}..${bounds.max}] (Best Guess: ${bounds.best_guess})
• Dark Zones: ${data.dark_zones_count} unverified silent sectors
• Critical Infrastructure Alerts: ${data.venue_surge_alerts?.length || 0} venues near or over capacity
• Fleet Status: Response fleet available and standing by.

RECOMMENDATIONS:
${data.operational_recommendations?.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n") || "Maintain active monitoring."}`;

      setMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: sitrepText,
          citations: data.critical_incident_ids || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: `Failed to fetch SITREP: ${e.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAction = (act: any) => {
    if (onExecuteAction && act.action_type && act.target_id) {
      onExecuteAction(act.action_type, act.target_id, act.parameters);
    }
    setActionSuccessMsg(`✓ Triggered: ${act.description || act.action_type || "Proposed Action"}`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(5, 7, 9, 0.82)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "720px",
          maxWidth: "92vw",
          maxHeight: "88vh",
          backgroundColor: "var(--panel)",
          border: "1px solid var(--grid-line-bright)",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.85)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--grid-line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "var(--void)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "6px",
                backgroundColor: "var(--signal-cyan-glow)",
                border: "1px solid var(--signal-cyan-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={16} color="var(--signal-cyan)" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink-bright)", letterSpacing: "1px" }} className="mono">
                  SHOONYA EOC COPILOT
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: "9px",
                    padding: "1px 5px",
                    backgroundColor: "rgba(56, 189, 248, 0.15)",
                    color: "var(--signal-cyan)",
                    borderRadius: "3px",
                    fontWeight: 700,
                  }}
                >
                  AI ASSISTANT
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--ink-dim)" }}>
                Context-Grounded Crisis Decision Support • Sector 4
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleFetchSitrep}
              className="mono"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                fontSize: "11px",
                fontWeight: 700,
                backgroundColor: "var(--signal-cyan-glow)",
                border: "1px solid var(--signal-cyan-border)",
                color: "var(--signal-cyan)",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--signal-cyan-glow)";
              }}
            >
              <FileText size={12} />
              GENERATE SITREP
            </button>

            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "var(--ink-dim)",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink-bright)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-dim)")}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Success Toast */}
        {actionSuccessMsg && (
          <div
            className="mono"
            style={{
              padding: "8px 16px",
              backgroundColor: "rgba(56, 189, 248, 0.15)",
              borderBottom: "1px solid var(--signal-cyan-border)",
              color: "var(--signal-cyan)",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckCircle2 size={13} />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Message Thread */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            minHeight: "360px",
            maxHeight: "480px",
          }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: m.role === "user" ? "80%" : "92%",
                backgroundColor: m.role === "user" ? "var(--signal-cyan-glow)" : "var(--void)",
                border: `1px solid ${m.role === "user" ? "var(--signal-cyan-border)" : "var(--grid-line)"}`,
                borderRadius: "6px",
                padding: "12px 14px",
                gap: "8px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div
                  className="mono"
                  style={{
                    fontSize: "10px",
                    color: m.role === "user" ? "var(--signal-cyan)" : "var(--ink-dim)",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  {m.role === "user" ? "COMMANDER INQUIRY" : "TACTICAL COPILOT BRIEFING"}
                </div>
                {m.timestamp && (
                  <span className="mono" style={{ fontSize: "9px", color: "var(--ink-muted)" }}>
                    {m.timestamp}
                  </span>
                )}
              </div>

              <div style={{ fontSize: "12px", color: "var(--ink)", whiteSpace: "pre-wrap", lineHeight: "1.55" }}>
                {m.text}
              </div>

              {/* Citations */}
              {m.citations && m.citations.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "4px", paddingTop: "6px", borderTop: "1px solid var(--grid-line)" }}>
                  <span className="mono" style={{ fontSize: "9px", color: "var(--ink-dim)", fontWeight: 700 }}>
                    VERIFIABLE CITATIONS:
                  </span>
                  {m.citations.map((cit) => (
                    <button
                      key={cit}
                      onClick={() => {
                        onSelectIncident(cit);
                        onClose();
                      }}
                      className="mono"
                      title="Click to highlight incident on tactical map & queue"
                      style={{
                        padding: "2px 7px",
                        fontSize: "10px",
                        fontWeight: 700,
                        backgroundColor: "var(--dispute-amber-glow)",
                        border: "1px solid var(--dispute-amber-border)",
                        color: "var(--dispute-amber)",
                        borderRadius: "3px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <span>{cit}</span>
                      <ArrowRight size={10} />
                    </button>
                  ))}
                </div>
              )}

              {/* Caveats */}
              {m.caveats && m.caveats.length > 0 && (
                <div
                  className="mono"
                  style={{
                    fontSize: "10px",
                    color: "var(--critical-ember)",
                    backgroundColor: "var(--critical-ember-glow)",
                    border: "1px solid var(--critical-ember-border)",
                    borderRadius: "3px",
                    padding: "6px 8px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "6px",
                  }}
                >
                  <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: "1px" }} />
                  <div>
                    {m.caveats.map((cav, cIdx) => (
                      <div key={cIdx}>{cav}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed Executable Actions */}
              {m.actions && m.actions.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                  <span className="mono" style={{ fontSize: "9px", color: "var(--signal-cyan)", fontWeight: 700 }}>
                    RECOMMENDED EXECUTABLE ACTIONS:
                  </span>
                  {m.actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => handleTriggerAction(act)}
                      className="mono"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 10px",
                        backgroundColor: "var(--panel-elevated)",
                        border: "1px solid var(--signal-cyan-border)",
                        color: "var(--ink-bright)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--signal-cyan-glow)";
                        e.currentTarget.style.borderColor = "var(--signal-cyan)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--panel-elevated)";
                        e.currentTarget.style.borderColor = "var(--signal-cyan-border)";
                      }}
                    >
                      <span>⚡ {act.description || act.label || `Execute ${act.action_type || "Action"}`}</span>
                      <ArrowRight size={12} color="var(--signal-cyan)" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="mono" style={{ fontSize: "11px", color: "var(--signal-cyan)", padding: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="pulsing-cyan" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--signal-cyan)" }} />
              COMPUTING EOC INFERENCE & CITATIONS...
            </div>
          )}
        </div>

        {/* Suggested Quick Queries */}
        <div
          style={{
            padding: "10px 16px",
            backgroundColor: "var(--void)",
            borderTop: "1px solid var(--grid-line)",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span className="mono" style={{ fontSize: "10px", color: "var(--ink-muted)" }}>
            QUICK PROMPTS:
          </span>
          {[
            "Summarize top 3 priority incidents",
            "What dark zones require immediate recon?",
            "Check hospital & relief shelter surge",
            "Status of Ward 07 school rescue",
          ].map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sq)}
              className="mono"
              style={{
                padding: "4px 9px",
                fontSize: "10px",
                backgroundColor: "var(--panel)",
                border: "1px solid var(--grid-line)",
                color: "var(--ink-dim)",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--signal-cyan)";
                e.currentTarget.style.borderColor = "var(--signal-cyan-border)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--ink-dim)";
                e.currentTarget.style.borderColor = "var(--grid-line)";
              }}
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: "14px 18px",
            borderTop: "1px solid var(--grid-line)",
            display: "flex",
            gap: "10px",
            backgroundColor: "var(--panel)",
          }}
        >
          <input
            type="text"
            placeholder="Type operational query (e.g., 'Ward 07 rooftop victims', 'INC-W07-01 status')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{
              flex: 1,
              padding: "10px 14px",
              backgroundColor: "var(--void)",
              border: "1px solid var(--grid-line)",
              color: "var(--ink)",
              fontSize: "12px",
              borderRadius: "4px",
              outline: "none",
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!query.trim() || isLoading}
            style={{
              padding: "10px 20px",
              backgroundColor: query.trim() && !isLoading ? "var(--signal-cyan)" : "var(--panel-elevated)",
              border: "none",
              color: query.trim() && !isLoading ? "var(--void)" : "var(--ink-muted)",
              fontWeight: 800,
              fontSize: "12px",
              borderRadius: "4px",
              cursor: query.trim() && !isLoading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              letterSpacing: "0.5px",
              transition: "all 0.15s ease",
            }}
            className="mono"
          >
            <Send size={13} />
            SUBMIT
          </button>
        </div>
      </div>
    </div>
  );
};
