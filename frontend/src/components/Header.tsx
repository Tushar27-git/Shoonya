import React from "react";
import type { SystemTelemetry } from "../types/domain";
import { Activity, ShieldAlert, Radio, Clock, Cpu, Bot, Home } from "lucide-react";

interface HeaderProps {
  telemetry: SystemTelemetry;
  isLive: boolean;
  onToggleLive: () => void;
  onOpenCopilot: () => void;
  onNavigateToLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  isLive,
  onToggleLive,
  onOpenCopilot,
  onNavigateToLanding,
}) => {
  return (
    <header
      style={{
        height: "48px",
        backgroundColor: "var(--panel)",
        borderBottom: "1px solid var(--grid-line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        userSelect: "none",
        zIndex: 100,
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* Brand & Sector */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {onNavigateToLanding && (
          <button
            onClick={onNavigateToLanding}
            title="Return to Landing Page"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 8px",
              backgroundColor: "var(--void)",
              border: "1px solid var(--grid-line)",
              borderRadius: "4px",
              color: "var(--ink-dim)",
              fontSize: "11px",
              fontWeight: 600,
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
            <Home size={12} />
            <span>Overview</span>
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 800,
              letterSpacing: "1.5px",
              color: "var(--ink-bright)",
            }}
          >
            SHOONYA
          </span>
        </div>

        <div
          className="mono"
          style={{
            fontSize: "11px",
            color: "var(--ink-dim)",
            padding: "3px 8px",
            backgroundColor: "var(--void)",
            border: "1px solid var(--grid-line)",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span style={{ color: "var(--signal-cyan)", fontWeight: 700 }}>SECTOR 4</span>
          <span style={{ color: "var(--ink-muted)" }}>•</span>
          <span>RAIPUR EAST COMMAND</span>
        </div>
      </div>

      {/* Real-time Telemetry Readouts */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }} className="mono">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            padding: "3px 8px",
            backgroundColor: "var(--void)",
            borderRadius: "4px",
            border: "1px solid var(--grid-line)",
          }}
        >
          <Radio size={12} color="var(--signal-cyan)" />
          <span style={{ color: "var(--ink-dim)" }}>QUEUE:</span>
          <span style={{ color: "var(--ink-bright)", fontWeight: 700 }}>{telemetry.queue_depth}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            padding: "3px 8px",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            borderRadius: "4px",
            border: "1px solid var(--critical-ember-border)",
          }}
        >
          <Activity size={12} color="var(--critical-ember)" />
          <span style={{ color: "var(--ink-dim)" }}>ACTIVE:</span>
          <span style={{ color: "var(--critical-ember)", fontWeight: 800 }}>{telemetry.active_incidents}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            padding: "3px 8px",
            backgroundColor: "rgba(245, 158, 11, 0.08)",
            borderRadius: "4px",
            border: "1px solid var(--dispute-amber-border)",
          }}
        >
          <ShieldAlert size={12} color="var(--dispute-amber)" />
          <span style={{ color: "var(--ink-dim)" }}>DISPUTES:</span>
          <span style={{ color: "var(--dispute-amber)", fontWeight: 700 }}>{telemetry.disputed_incidents}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            padding: "3px 8px",
            backgroundColor: "var(--void)",
            borderRadius: "4px",
            border: "1px solid var(--grid-line)",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: telemetry.dark_zones > 0 ? "var(--dispute-amber)" : "var(--dark-zone-grey)",
            }}
          />
          <span style={{ color: "var(--ink-dim)" }}>DARK ZONES:</span>
          <span style={{ color: "var(--ink-bright)", fontWeight: 700 }}>{telemetry.dark_zones}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            padding: "3px 8px",
            backgroundColor: "var(--void)",
            borderRadius: "4px",
            border: "1px solid var(--grid-line)",
          }}
        >
          <Cpu size={12} color="var(--signal-cyan)" />
          <span style={{ color: "var(--ink-dim)" }}>SOLVER:</span>
          <span style={{ color: "var(--signal-cyan)", fontWeight: 700 }}>{telemetry.solver_status}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
          }}
        >
          <Clock size={12} color="var(--ink-dim)" />
          <span style={{ color: "var(--ink-dim)" }}>LATENCY:</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>{telemetry.ingestion_to_map_latency_sec.toFixed(2)}s</span>
        </div>
      </div>

      {/* Action Controls & Live / Paused Status Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={onOpenCopilot}
          className="mono"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            backgroundColor: "var(--signal-cyan-glow)",
            border: "1px solid var(--signal-cyan-border)",
            color: "var(--signal-cyan)",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: 700,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.25)";
            e.currentTarget.style.boxShadow = "0 0 10px var(--signal-cyan-glow)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--signal-cyan-glow)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <Bot size={13} />
          <span>COPILOT AI</span>
        </button>

        <button
          onClick={onToggleLive}
          className="mono"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            backgroundColor: isLive ? "var(--signal-cyan-glow)" : "var(--critical-ember-glow)",
            border: `1px solid ${isLive ? "var(--signal-cyan-border)" : "var(--critical-ember-border)"}`,
            color: isLive ? "var(--signal-cyan)" : "var(--critical-ember)",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: 700,
            transition: "all 0.15s ease",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: isLive ? "var(--signal-cyan)" : "var(--critical-ember)",
              boxShadow: isLive ? "0 0 8px var(--signal-cyan)" : "none",
            }}
          />
          {isLive ? "LIVE TELEMETRY" : "REPLAY PAUSED"}
        </button>
      </div>
    </header>
  );
};
