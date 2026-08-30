import React from "react";
import type { SystemTelemetry } from "../types/domain";

import { Activity, ShieldAlert, Radio, Clock, Cpu } from "lucide-react";

interface HeaderProps {
  telemetry: SystemTelemetry;
  isLive: boolean;
  onToggleLive: () => void;
  onOpenCopilot: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  isLive,
  onToggleLive,
  onOpenCopilot,
}) => {
  return (
    <header
      style={{
        height: "44px",
        backgroundColor: "var(--panel)",
        borderBottom: "1px solid var(--grid-line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        userSelect: "none",
        zIndex: 100,
      }}
    >
      {/* Brand & Sector */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "1px", color: "var(--signal-cyan)" }}>
            SHOONYA
          </span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-dim)" }}>
            // शून्य
          </span>
        </div>
        <div
          className="mono"
          style={{
            fontSize: "11px",
            color: "var(--ink-dim)",
            padding: "2px 8px",
            backgroundColor: "var(--void)",
            border: "1px solid var(--grid-line)",
            borderRadius: "2px",
          }}
        >
          SECTOR 4 // LUCKNOW COMMAND
        </div>
      </div>

      {/* Real-time Telemetry Readouts */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }} className="mono">
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
          <Radio size={13} color="var(--signal-cyan)" />
          <span style={{ color: "var(--ink-dim)" }}>QUEUE:</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>{telemetry?.queue_depth ?? 0}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
          <Activity size={13} color="var(--critical-ember)" />
          <span style={{ color: "var(--ink-dim)" }}>ACTIVE INCIDENTS:</span>
          <span style={{ color: "var(--critical-ember)", fontWeight: 700 }}>{telemetry?.active_incidents ?? 0}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
          <ShieldAlert size={13} color="var(--dispute-amber)" />
          <span style={{ color: "var(--ink-dim)" }}>DISPUTES:</span>
          <span style={{ color: "var(--dispute-amber)", fontWeight: 600 }}>{telemetry?.disputed_incidents ?? 0}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--dark-zone-grey)" }} />
          <span style={{ color: "var(--ink-dim)" }}>DARK ZONES:</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>{telemetry?.dark_zones ?? 0}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
          <Cpu size={13} color="var(--ink-dim)" />
          <span style={{ color: "var(--ink-dim)" }}>ADVISORY SOLVER:</span>
          <span style={{ color: "var(--signal-cyan)", fontWeight: 600 }}>{telemetry?.solver_status}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Clock size={13} color="var(--ink-dim)" />
          <span style={{ color: "var(--ink-dim)" }}>LATENCY:</span>
          <span style={{ color: "var(--signal-cyan)", fontWeight: 600 }}>{telemetry?.ingestion_to_map_latency_sec?.toFixed(2) ?? "0.00"}s</span>
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
            padding: "4px 10px",
            backgroundColor: "rgba(79, 216, 196, 0.15)",
            border: "1px solid var(--signal-cyan)",
            color: "var(--signal-cyan)",
            borderRadius: "2px",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "var(--signal-cyan)",
              boxShadow: "0 0 6px var(--signal-cyan)",
            }}
          />
          AI ADVISORY / HUMAN CONTROL
        </button>

        <button
          onClick={onToggleLive}
          className="mono"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            backgroundColor: isLive ? "rgba(79, 216, 196, 0.1)" : "rgba(214, 85, 60, 0.1)",
            border: `1px solid ${isLive ? "var(--signal-cyan)" : "var(--critical-ember)"}`,
            color: isLive ? "var(--signal-cyan)" : "var(--critical-ember)",
            borderRadius: "2px",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: isLive ? "var(--signal-cyan)" : "var(--critical-ember)",
              boxShadow: isLive ? "0 0 6px var(--signal-cyan)" : "none",
            }}
          />
          {isLive ? "SIMULATION STREAM" : "REPLAY PAUSED"}
        </button>
      </div>
    </header>
  );
};


