import React, { useState } from "react";
import { MessageSquare, Send, FileText, AlertTriangle, X } from "lucide-react";
import type { CopilotMessageResponse, SitrepResponse } from "../types/domain";

const API_BASE = "http://127.0.0.1:8000";

interface CopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
}

export const CopilotModal: React.FC<CopilotModalProps> = ({
  isOpen,
  onClose,
  selectedIncidentId,
  onSelectIncident,
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{
    role: "user" | "copilot";
    text: string;
    citations?: string[];
    caveats?: string[];
    actions?: Array<{ label: string; action_id: string }>;
  }>>([
    {
      role: "copilot",
      text: "SHOONYA EOC Copilot active. Multilingual crisis intelligence and SITREP generation ready. Ask about any active incident, resource allocation, or district flood status.",
    },
  ]);


  if (!isOpen) return null;

  const handleSend = async (queryText: string) => {
    const textToSend = queryText || query;
    if (!textToSend.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: textToSend }]);
    setQuery("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/copilot/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          focus_incident_id: selectedIncidentId,
        }),
      });

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data: CopilotMessageResponse = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: data.content,
          citations: data.citations,
          caveats: data.caveats,
          actions: data.proposed_actions,
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: `EOC Copilot query error: ${e.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchSitrep = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/copilot/sitrep`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data: SitrepResponse = await res.json();
      setMessages((prev) => [

        ...prev,
        {
          role: "copilot",
          text: `SITUATION REPORT // ${data.sitrep_id}\n\n• Active Incidents: ${data.total_active_incidents}\n• Disputed Incidents: ${data.disputed_incidents_count}\n• Estimated Casualties: [${data.casualty_bounds.min}..${data.casualty_bounds.max}] (Best guess: ${data.casualty_bounds.best_guess})\n• Dark Zones: ${data.dark_zones_count} unverified sectors\n• Critical Venues at Risk: ${data.critical_venues_at_risk.length}\n• Fleet Utilization: ${data.fleet_status.assigned_resources}/${data.fleet_status.total_resources} (${data.fleet_status.fleet_utilization_pct.toFixed(0)}%)`,
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: `Failed to fetch SITREP: ${e.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(11, 14, 17, 0.85)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "680px",
          maxHeight: "85vh",
          backgroundColor: "var(--panel)",
          border: "1px solid var(--grid-line)",
          borderRadius: "4px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.8)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--grid-line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "var(--void)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MessageSquare size={16} color="var(--signal-cyan)" />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)", letterSpacing: "1px" }} className="mono">
              EOC AI ADVISORY COPILOT // शून्य
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleFetchSitrep}
              className="mono"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 8px",
                fontSize: "10px",
                fontWeight: 700,
                backgroundColor: "rgba(79, 216, 196, 0.1)",
                border: "1px solid var(--signal-cyan)",
                color: "var(--signal-cyan)",
                borderRadius: "2px",
                cursor: "pointer",
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
                padding: "4px",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
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
                maxWidth: "85%",
                backgroundColor: m.role === "user" ? "rgba(79, 216, 196, 0.1)" : "var(--void)",
                border: `1px solid ${m.role === "user" ? "var(--signal-cyan)" : "var(--grid-line)"}`,
                borderRadius: "3px",
                padding: "10px 12px",
                gap: "6px",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: "9px",
                  color: m.role === "user" ? "var(--signal-cyan)" : "var(--ink-dim)",
                  fontWeight: 700,
                }}
              >
                {m.role === "user" ? "COMMANDER QUERY" : "SHOONYA AI ADVISORY"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--ink)", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                {m.text}
              </div>

              {/* Citations */}
              {m.citations && m.citations.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                  <span className="mono" style={{ fontSize: "9px", color: "var(--ink-dim)" }}>
                    CITATIONS:
                  </span>
                  {m.citations.map((cit) => (
                    <button
                      key={cit}
                      onClick={() => onSelectIncident(cit)}
                      className="mono"
                      style={{
                        padding: "1px 5px",
                        fontSize: "9px",
                        fontWeight: 700,
                        backgroundColor: "rgba(232, 163, 61, 0.15)",
                        border: "1px solid var(--dispute-amber)",
                        color: "var(--dispute-amber)",
                        borderRadius: "2px",
                        cursor: "pointer",
                      }}
                    >
                      {cit}
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
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginTop: "2px",
                  }}
                >
                  <AlertTriangle size={11} />
                  <span>CAVEAT: {m.caveats.join("; ")}</span>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="mono" style={{ fontSize: "11px", color: "var(--signal-cyan)", padding: "6px" }}>
              COMPUTING EOC INFERENCE & CITATIONS...
            </div>
          )}
        </div>

        {/* Suggested Queries */}
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--void)",
            borderTop: "1px solid var(--grid-line)",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          {[
            "वार्ड 07 स्कूल के लिए क्या राहत भेजी गई है?",
            "What dark zones require immediate recon?",
            "Summarize top 3 priority incidents",
          ].map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sq)}
              className="mono"
              style={{
                padding: "3px 8px",
                fontSize: "10px",
                backgroundColor: "var(--panel)",
                border: "1px solid var(--grid-line)",
                color: "var(--ink-dim)",
                borderRadius: "2px",
                cursor: "pointer",
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
            borderTop: "1px solid var(--grid-line)",
            display: "flex",
            gap: "8px",
            backgroundColor: "var(--panel)",
          }}
        >
          <input
            type="text"
            placeholder="Type crisis query in Hindi (वार्ड 07) or English..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend(query);
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              backgroundColor: "var(--void)",
              border: "1px solid var(--grid-line)",
              color: "var(--ink)",
              fontSize: "12px",
              borderRadius: "2px",
              outline: "none",
            }}
          />
          <button
            onClick={() => handleSend(query)}
            disabled={!query.trim() || isLoading}
            style={{
              padding: "8px 16px",
              backgroundColor: query.trim() && !isLoading ? "var(--signal-cyan)" : "var(--grid-line)",
              border: "none",
              color: "var(--void)",
              fontWeight: 700,
              borderRadius: "2px",
              cursor: query.trim() && !isLoading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            className="mono"
          >
            <Send size={13} />
            ASK
          </button>
        </div>
      </div>
    </div>
  );
};
