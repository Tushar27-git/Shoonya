import React from "react";
import type { SystemTelemetry } from "../types/domain";
import {
  Activity,
  ShieldAlert,
  Radio,
  Clock,
  Cpu,
  Bot,
  Home,
  Wifi,
} from "lucide-react";

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
      className="glass-panel"
      style={{
        height: "46px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        userSelect: "none",
        zIndex: 100,
        borderBottom: "1px solid var(--border-subtle)",
        position: "relative",
      }}
    >
      {/* Left: Brand, Overview Back Button & Sector */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {onNavigateToLanding && (
          <button
            onClick={onNavigateToLanding}
            title="Return to Overview"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 8px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-secondary)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--blue-bright)";
              e.currentTarget.style.borderColor = "var(--blue-border)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          >
            <Home size={12} />
            <span>Overview</span>
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontSize: "15px",
              fontWeight: 800,
              letterSpacing: "1.2px",
              color: "var(--text-primary)",
            }}
          >
            SHOONYA
          </span>
        </div>

        <div
          className="mono"
          style={{
            fontSize: "10px",
            color: "var(--text-secondary)",
            padding: "2px 7px",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span style={{ color: "var(--blue-bright)", fontWeight: 700 }}>SECTOR 4</span>
          <span style={{ color: "var(--text-muted)" }}>•</span>
          <span>RAIPUR EAST</span>
        </div>
      </div>

      {/* Center: Live Telemetry Metric Badges */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          overflowX: "auto",
          maxWidth: "calc(100vw - 420px)",
        }}
        className="mono"
      >
        {/* Queue Depth */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            padding: "3px 8px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Radio size={11} color="var(--blue-bright)" />
          <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>QUEUE</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{telemetry.queue_depth}</span>
        </div>

        {/* Active Incidents */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            padding: "3px 8px",
            backgroundColor: "var(--color-critical-bg)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-critical-border)",
          }}
        >
          <Activity size={11} color="var(--color-critical)" />
          <span style={{ color: "var(--text-secondary)", fontSize: "10px" }}>ACTIVE</span>
          <span style={{ color: "var(--color-critical)", fontWeight: 800 }}>{telemetry.active_incidents}</span>
        </div>

        {/* Disputes */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            padding: "3px 8px",
            backgroundColor: telemetry.disputed_incidents > 0 ? "var(--color-warning-bg)" : "var(--bg-surface)",
            borderRadius: "var(--radius-sm)",
            border: `1px solid ${telemetry.disputed_incidents > 0 ? "var(--color-warning-border)" : "var(--border-subtle)"}`,
          }}
        >
          <ShieldAlert size={11} color={telemetry.disputed_incidents > 0 ? "var(--color-warning)" : "var(--text-muted)"} />
          <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>DISPUTES</span>
          <span
            style={{
              color: telemetry.disputed_incidents > 0 ? "var(--color-warning)" : "var(--text-secondary)",
              fontWeight: 700,
            }}
          >
            {telemetry.disputed_incidents}
          </span>
        </div>

        {/* Dark Zones */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            padding: "3px 8px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Wifi size={11} color={telemetry.dark_zones > 0 ? "var(--color-warning)" : "var(--text-muted)"} />
          <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>DARK ZONES</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{telemetry.dark_zones}</span>
        </div>

        {/* Solver */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            padding: "3px 8px",
            backgroundColor: "var(--blue-subtle)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--blue-border)",
          }}
        >
          <Cpu size={11} color="var(--blue-bright)" />
          <span style={{ color: "var(--text-secondary)", fontSize: "10px" }}>SOLVER</span>
          <span style={{ color: "var(--blue-light)", fontWeight: 700 }}>{telemetry.solver_status}</span>
        </div>

        {/* Latency */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            padding: "3px 8px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Clock size={11} color="var(--text-muted)" />
          <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>LATENCY</span>
          <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
            {telemetry.ingestion_to_map_latency_sec.toFixed(2)}s
          </span>
        </div>
      </div>

      {/* Right: Copilot AI & Live / Paused State Button */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={onOpenCopilot}
          className="mono"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            backgroundColor: "var(--blue-subtle)",
            border: "1px solid var(--blue-border)",
            color: "var(--blue-light)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: 700,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(37, 99, 235, 0.25)";
            e.currentTarget.style.borderColor = "var(--blue-bright)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--blue-subtle)";
            e.currentTarget.style.borderColor = "var(--blue-border)";
          }}
        >
          <Bot size={13} color="var(--blue-bright)" />
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
            backgroundColor: isLive ? "var(--bg-surface)" : "var(--color-critical-bg)",
            border: `1px solid ${isLive ? "var(--blue-border)" : "var(--color-critical-border)"}`,
            color: isLive ? "var(--blue-light)" : "var(--color-critical)",
            borderRadius: "var(--radius-sm)",
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
              backgroundColor: isLive ? "var(--blue-bright)" : "var(--color-critical)",
              boxShadow: isLive ? "0 0 6px var(--blue-bright)" : "none",
            }}
          />
          {isLive ? "LIVE" : "PAUSED"}
        </button>
      </div>
    </header>
  );
};
