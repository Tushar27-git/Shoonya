import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  FileText,
  AlertTriangle,
  X,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  User,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { SitrepResponse } from "../types/domain";

interface ProposedActionItem {
  label?: string;
  action_type?: string;
  target_id?: string;
  description?: string;
  parameters?: Record<string, any>;
}

interface ChatMessage {
  id: string;
  role: "user" | "copilot";
  text: string;
  citations?: string[];
  caveats?: string[];
  actions?: ProposedActionItem[];
  timestamp: string;
  isError?: boolean;
  retryQuery?: string;
}

interface CopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
  onExecuteAction?: (actionType: string, targetId: string, params?: Record<string, any>) => void;
  apiBase?: string;
  userLocation?: string;
}

const LOADING_PHASES = [
  "ANALYZING INCIDENT DATA...",
  "CORRELATING REPORTS & CITATIONS...",
  "ASSESSING OPERATIONAL PRIORITY...",
  "GENERATING TACTICAL RECOMMENDATION...",
];

export const CopilotModal: React.FC<CopilotModalProps> = ({
  isOpen,
  onClose,
  selectedIncidentId,
  onSelectIncident,
  onExecuteAction,
  apiBase = "http://127.0.0.1:8000",
  userLocation,
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState(0);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-welcome",
      role: "copilot",
      text: "SHOONYA Tactical Copilot online. Real-time situational intelligence, contradiction analysis, dark-zone surveillance, and automated SITREP generation active.\n\nAsk about active sector incidents, multi-call correlation, rescue fleet routing, or type an incident ID (e.g. INC-W07-01).",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Dynamic loading phase rotator
  useEffect(() => {
    if (!isLoading) {
      setLoadingPhaseIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingPhaseIndex((prev) => (prev + 1) % LOADING_PHASES.length);
    }, 900);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    if (isOpen && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    if (isLoading) return; // Prevent duplicate parallel submissions

    const textToSend = (queryText || query).trim();
    if (!textToSend) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsgId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      text: textToSend,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);
    setActionSuccessMsg(null);

    // Build conversation history for multi-turn reasoning
    const conversationHistory = messages
      .filter((m) => !m.isError)
      .slice(-6)
      .map((m) => ({
        role: m.role,
        content: m.text,
        citations: m.citations || [],
      }));

    try {
      const res = await fetch(`${apiBase}/copilot/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          focus_incident_id: selectedIncidentId,
          conversation_history: conversationHistory,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText || "Server error"}`);
      }

      const data: any = await res.json();
      const copilotMsgId = `copilot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      setMessages((prev) => [
        ...prev,
        {
          id: copilotMsgId,
          role: "copilot",
          text: data.content || data.answer || "Query processed successfully.",
          citations: data.citations || data.evidence_refs || [],
          caveats: data.confidence_caveats || data.warnings || [],
          actions: data.proposed_actions || (data.proposed_action ? [data.proposed_action] : []),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (e: any) {
      const isConnectionError =
        e.message?.includes("Failed to fetch") ||
        e.message?.includes("NetworkError") ||
        e.name === "TypeError";

      const errorMessage = isConnectionError
        ? `Unable to reach the EOC decision service (${apiBase}).\nPlease ensure the backend FastAPI service is running on port 8001.`
        : `EOC decision inference error: ${e.message || "Unknown error occurred"}`;

      const errorMsgId = `err-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      setMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          role: "copilot",
          text: errorMessage,
          isError: true,
          retryQuery: textToSend,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchSitrep = async () => {
    if (isLoading) return; // Prevent duplicate requests

    setIsLoading(true);
    setActionSuccessMsg(null);
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsgId = `user-sitrep-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        text: "Generate Current EOC Situation Report (SITREP)",
        timestamp: timeStr,
      },
    ]);

    try {
      const res = await fetch(`${apiBase}/copilot/sitrep`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText || "Server error"}`);
      }

      const data: SitrepResponse = await res.json();
      const copilotMsgId = `copilot-sitrep-${Date.now()}`;

      const sitrepText = `${data.executive_summary}

================================================================================
OPERATIONAL RECOMMENDATIONS:
${data.operational_recommendations?.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n") || "Maintain active monitoring."}`;

      setMessages((prev) => [
        ...prev,
        {
          id: copilotMsgId,
          role: "copilot",
          text: sitrepText,
          citations: data.critical_incident_ids || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (e: any) {
      const isConnectionError =
        e.message?.includes("Failed to fetch") ||
        e.message?.includes("NetworkError") ||
        e.name === "TypeError";

      const errorMessage = isConnectionError
        ? `Unable to reach the EOC decision service (${apiBase}) to compile SITREP.\nPlease verify backend connectivity.`
        : `Failed to compile SITREP: ${e.message || "Unknown error occurred"}`;

      const errorMsgId = `err-sitrep-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          role: "copilot",
          text: errorMessage,
          isError: true,
          retryQuery: "Generate Current EOC Situation Report (SITREP)",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAction = (act: ProposedActionItem) => {
    if (onExecuteAction && act.action_type && act.target_id) {
      onExecuteAction(act.action_type, act.target_id, act.parameters);
    }
    setActionSuccessMsg(`✓ Executed: ${act.description || act.action_type || "Tactical Action"}`);
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "740px",
          maxWidth: "94vw",
          height: "85vh",
          maxHeight: "720px",
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
            padding: "12px 18px",
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
                width: "32px",
                height: "32px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--blue-subtle)",
                border: "1px solid var(--blue-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={16} color="var(--blue-bright)" />
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
                    padding: "1px 6px",
                    backgroundColor: "var(--blue-subtle)",
                    color: "var(--blue-light)",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 700,
                    border: "1px solid var(--blue-border)",
                  }}
                >
                  TACTICAL ADVISOR
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                Context-Grounded Crisis Decision Support • Sector 4 (Raipur East)
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handleFetchSitrep}
              disabled={isLoading}
              className="mono"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 11px",
                fontSize: "11px",
                fontWeight: 700,
                backgroundColor: isLoading ? "var(--bg-input)" : "var(--blue-subtle)",
                border: "1px solid var(--blue-border)",
                color: isLoading ? "var(--text-muted)" : "var(--blue-light)",
                borderRadius: "var(--radius-sm)",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.backgroundColor = "rgba(37, 99, 235, 0.25)";
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.currentTarget.style.backgroundColor = "var(--blue-subtle)";
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
                padding: "5px",
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

        {/* Action Success Banner */}
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
          ref={chatScrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            backgroundColor: "var(--bg-root)",
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: m.role === "user" ? "80%" : "95%",
                width: m.role === "user" ? "auto" : "100%",
                backgroundColor: m.role === "user" ? "var(--blue-subtle)" : "var(--bg-surface)",
                border: `1px solid ${
                  m.isError
                    ? "var(--color-critical-border)"
                    : m.role === "user"
                    ? "var(--blue-border)"
                    : "var(--border-subtle)"
                }`,
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                gap: "8px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {/* Message Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                <div
                  className="mono"
                  style={{
                    fontSize: "10px",
                    color: m.isError
                      ? "var(--color-critical)"
                      : m.role === "user"
                      ? "var(--blue-light)"
                      : "var(--text-secondary)",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {m.role === "user" ? (
                    <>
                      <User size={11} />
                      <span>COMMANDER INQUIRY</span>
                    </>
                  ) : m.isError ? (
                    <>
                      <ShieldAlert size={12} color="var(--color-critical)" />
                      <span>SERVICE CONNECTION ADVISORY</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={11} color="var(--blue-bright)" />
                      <span>TACTICAL DECISION ASSESSMENT</span>
                    </>
                  )}
                </div>
                {m.timestamp && (
                  <span className="mono" style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                    {m.timestamp}
                  </span>
                )}
              </div>

              {/* Message Content */}
              <div
                style={{
                  fontSize: "12px",
                  color: m.isError ? "var(--color-critical)" : "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.55",
                }}
              >
                {m.text}
              </div>

              {/* Retry button on error */}
              {m.isError && m.retryQuery && (
                <div style={{ marginTop: "4px" }}>
                  <button
                    onClick={() => {
                      if (m.retryQuery === "Generate Current EOC Situation Report (SITREP)") {
                        handleFetchSitrep();
                      } else {
                        handleSend(m.retryQuery);
                      }
                    }}
                    disabled={isLoading}
                    className="mono"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "5px 10px",
                      fontSize: "10px",
                      fontWeight: 700,
                      backgroundColor: "var(--color-critical-bg)",
                      border: "1px solid var(--color-critical-border)",
                      color: "var(--color-critical)",
                      borderRadius: "var(--radius-sm)",
                      cursor: isLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    <RefreshCw size={10} />
                    <span>Retry Request</span>
                  </button>
                </div>
              )}

              {/* Verified Citations */}
              {m.citations && m.citations.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexWrap: "wrap",
                    marginTop: "4px",
                    paddingTop: "6px",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <span className="mono" style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700 }}>
                    VERIFIED ENTITY CITATIONS:
                  </span>
                  {m.citations.map((cit) => (
                    <button
                      key={cit}
                      onClick={() => {
                        onSelectIncident(cit);
                        onClose();
                      }}
                      className="mono"
                      title={`Highlight ${cit} on tactical map`}
                      style={{
                        padding: "2px 7px",
                        fontSize: "9px",
                        fontWeight: 700,
                        backgroundColor: "var(--blue-subtle)",
                        border: "1px solid var(--blue-border)",
                        color: "var(--blue-light)",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>{cit}</span>
                      <ArrowRight size={9} />
                    </button>
                  ))}
                </div>
              )}

              {/* Confidence Caveats */}
              {m.caveats && m.caveats.length > 0 && (
                <div
                  className="mono"
                  style={{
                    fontSize: "10px",
                    color: "var(--color-warning)",
                    backgroundColor: "var(--color-warning-bg)",
                    border: "1px solid var(--color-warning-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "7px 9px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "7px",
                  }}
                >
                  <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: "1px" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    {m.caveats.map((cav, cIdx) => (
                      <div key={cIdx}>{cav}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Executable Actions */}
              {m.actions && m.actions.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
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
                        padding: "7px 11px",
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

          {/* Dynamic Tactical Loading State */}
          {isLoading && (
            <div
              className="mono"
              style={{
                fontSize: "11px",
                color: "var(--blue-light)",
                padding: "8px 12px",
                backgroundColor: "var(--blue-subtle)",
                border: "1px solid var(--blue-border)",
                borderRadius: "var(--radius-sm)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                alignSelf: "flex-start",
              }}
            >
              <span
                className="pulsing-blue"
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "var(--blue-bright)",
                }}
              />
              <span>{LOADING_PHASES[loadingPhaseIndex]}</span>
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
            gap: "6px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span className="mono" style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700 }}>
            QUICK PROMPTS:
          </span>
          {[
            "Top 3 priority incidents",
            "There are 15 calls from the same locality and time. What should I do?",
            "How many rescue boats and ambulances are available?",
            "Dark zones requiring reconnaissance",
            "Status of Ward 07 rescue",
          ].map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sq)}
              disabled={isLoading}
              className="mono"
              style={{
                padding: "4px 9px",
                fontSize: "10px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                color: isLoading ? "var(--text-muted)" : "var(--text-secondary)",
                borderRadius: "var(--radius-sm)",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.color = "var(--blue-light)";
                  e.currentTarget.style.borderColor = "var(--blue-border)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                }
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
            ref={inputRef}
            type="text"
            placeholder="Type tactical query (e.g. '15 calls from same area', 'Should I dispatch another team?', 'INC-W07-01 status')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{
              flex: 1,
              padding: "9px 12px",
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
              padding: "9px 18px",
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
