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
      text: "SHOONYA Tactical Copilot online. Real-time situational intelligence, contradiction analysis, dark-zone surveillance, and automated SITREP generation active.\n\nAsk about active sector incidents, rescue fleet routing, hospital surge, or type an incident ID (e.g., INC-W07-01).",
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
• Infrastructure Surge: ${data.venue_surge_alerts?.length || 0} venues near or over capacity
• Fleet Status: Response fleet active and standing by.

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
        backgroundColor: "var(--bg-glass-overlay)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
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
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "var(--bg-root)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--blue-subtle)",
                border: "1px solid var(--blue-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={15} color="var(--blue-bright)" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    letterSpacing: "0.8px",
                  }}
                  className="mono"
                >
                  SHOONYA EOC COPILOT
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: "9px",
                    padding: "1px 5px",
                    backgroundColor: "var(--blue-subtle)",
                    color: "var(--blue-light)",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 700,
                  }}
                >
                  AI ASSISTANT
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
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
                backgroundColor: "var(--blue-subtle)",
                border: "1px solid var(--blue-border)",
                color: "var(--blue-light)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(37, 99, 235, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--blue-subtle)";
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
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
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
              backgroundColor: "var(--color-success-bg)",
              borderBottom: "1px solid var(--color-success-border)",
              color: "var(--color-success)",
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
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            minHeight: "340px",
            maxHeight: "460px",
          }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: m.role === "user" ? "78%" : "92%",
                backgroundColor: m.role === "user" ? "var(--blue-subtle)" : "var(--bg-root)",
                border: `1px solid ${m.role === "user" ? "var(--blue-border)" : "var(--border-subtle)"}`,
                borderRadius: "var(--radius-md)",
                padding: "11px 13px",
                gap: "7px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div
                  className="mono"
                  style={{
                    fontSize: "10px",
                    color: m.role === "user" ? "var(--blue-light)" : "var(--text-secondary)",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  {m.role === "user" ? "COMMANDER INQUIRY" : "TACTICAL COPILOT BRIEFING"}
                </div>
                {m.timestamp && (
                  <span className="mono" style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                    {m.timestamp}
                  </span>
                )}
              </div>

              <div style={{ fontSize: "12px", color: "var(--text-primary)", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                {m.text}
              </div>

              {/* Citations */}
              {m.citations && m.citations.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap", marginTop: "3px", paddingTop: "6px", borderTop: "1px solid var(--border-subtle)" }}>
                  <span className="mono" style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700 }}>
                    VERIFIED CITATIONS:
                  </span>
                  {m.citations.map((cit) => (
                    <button
                      key={cit}
                      onClick={() => {
                        onSelectIncident(cit);
                        onClose();
                      }}
                      className="mono"
                      title="Click to highlight incident on tactical map"
                      style={{
                        padding: "2px 6px",
                        fontSize: "9px",
                        fontWeight: 700,
                        backgroundColor: "var(--color-warning-bg)",
                        border: "1px solid var(--color-warning-border)",
                        color: "var(--color-warning)",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <span>{cit}</span>
                      <ArrowRight size={9} />
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
                    color: "var(--color-critical)",
                    backgroundColor: "var(--color-critical-bg)",
                    border: "1px solid var(--color-critical-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "6px 8px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "6px",
                  }}
                >
                  <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: "1px" }} />
                  <div>
                    {m.caveats.map((cav, cIdx) => (
                      <div key={cIdx}>{cav}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed Actions */}
              {m.actions && m.actions.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "3px" }}>
                  <span className="mono" style={{ fontSize: "9px", color: "var(--blue-light)", fontWeight: 700 }}>
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
                        backgroundColor: "var(--bg-surface-elevated)",
                        border: "1px solid var(--blue-border)",
                        color: "var(--text-primary)",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        fontSize: "11px",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--blue-subtle)";
                        e.currentTarget.style.borderColor = "var(--blue-bright)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--bg-surface-elevated)";
                        e.currentTarget.style.borderColor = "var(--blue-border)";
                      }}
                    >
                      <span>⚡ {act.description || act.label || `Execute ${act.action_type || "Action"}`}</span>
                      <ArrowRight size={11} color="var(--blue-bright)" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="mono" style={{ fontSize: "11px", color: "var(--blue-light)", padding: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="pulsing-blue" style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "var(--blue-bright)" }} />
              COMPUTING EOC INFERENCE...
            </div>
          )}
        </div>

        {/* Suggested Quick Prompts */}
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--bg-root)",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            gap: "5px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span className="mono" style={{ fontSize: "9px", color: "var(--text-muted)" }}>
            QUICK PROMPTS:
          </span>
          {[
            "Top 3 priority incidents",
            "Dark zones requiring recon",
            "Hospital & relief shelter surge",
            "Status of Ward 07 rescue",
          ].map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sq)}
              className="mono"
              style={{
                padding: "3px 8px",
                fontSize: "10px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--blue-light)";
                e.currentTarget.style.borderColor = "var(--blue-border)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.borderColor = "var(--border-subtle)";
              }}
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            gap: "8px",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <input
            type="text"
            placeholder="Type operational inquiry (e.g. 'Ward 07 rooftop victims', 'INC-W07-01 status')..."
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
              padding: "8px 12px",
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              fontSize: "12px",
              borderRadius: "var(--radius-sm)",
              outline: "none",
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!query.trim() || isLoading}
            style={{
              padding: "8px 18px",
              backgroundColor: query.trim() && !isLoading ? "var(--blue-bright)" : "var(--bg-input)",
              border: "none",
              color: query.trim() && !isLoading ? "#ffffff" : "var(--text-muted)",
              fontWeight: 700,
              fontSize: "11px",
              borderRadius: "var(--radius-sm)",
              cursor: query.trim() && !isLoading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              letterSpacing: "0.5px",
              transition: "all 0.15s ease",
            }}
            className="mono"
          >
            <Send size={12} />
            SUBMIT
          </button>
        </div>
      </div>
    </div>
  );
};
