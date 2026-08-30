import React from "react";
import type { SystemTelemetry } from "../types/domain";
import { LocationSearch } from "./LocationSearch";

import { Activity, ShieldAlert, Radio, Clock, Cpu } from "lucide-react";

interface HeaderProps {
  telemetry: SystemTelemetry;
  isLive: boolean;
  onToggleLive: () => void;
  onOpenCopilot: () => void;
  onLocationFound?: (latLng: [number, number], locationName: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  isLive,
  onToggleLive,
  onOpenCopilot,
  onLocationFound,
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
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontSize: "15px", fontWeight: 800, letterSpacing: "1px", color: "var(--signal-cyan)", whiteSpace: "nowrap" }}>
            SHOONYA
          </span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-dim)", whiteSpace: "nowrap" }}>
            // शून्य
          </span>
        </div>
        <LocationSearch onLocationFound={onLocationFound} />
      </div>

      {/* Real-time Telemetry Readouts */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", overflowX: "auto", whiteSpace: "nowrap" }} className="mono">
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
          <Radio size={13} color="var(--signal-cyan)" />
          <span style={{ color: "var(--ink-dim)" }}>PENDING REPORTS:</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>{telemetry?.queue_depth ?? 0}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
          <Activity size={13} color="var(--critical-ember)" />
          <span style={{ color: "var(--ink-dim)" }}>VERIFIED INCIDENTS:</span>
          <span style={{ color: "var(--critical-ember)", fontWeight: 700 }}>{telemetry?.active_incidents ?? 0}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
          <ShieldAlert size={13} color="var(--dispute-amber)" />
          <span style={{ color: "var(--ink-dim)" }}>CONFLICTS:</span>
          <span style={{ color: "var(--dispute-amber)", fontWeight: 600 }}>{telemetry?.disputed_incidents ?? 0}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--dark-zone-grey)" }} />
          <span style={{ color: "var(--ink-dim)" }}>NO-SIGNAL ZONES:</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>{telemetry?.dark_zones ?? 0}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
          <Cpu size={13} color="var(--ink-dim)" />
          <span style={{ color: "var(--ink-dim)" }}>SYSTEM STATUS:</span>
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
            gap: "4px",
            padding: "4px 8px",
            backgroundColor: "rgba(79, 216, 196, 0.15)",
            border: "1px solid var(--signal-cyan)",
            color: "var(--signal-cyan)",
            borderRadius: "2px",
            cursor: "pointer",
            fontSize: "10px",
            fontWeight: 700,
            whiteSpace: "nowrap"
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
          AI ADVISORY
        </button>

        <button
          onClick={onToggleLive}
          className="mono"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            backgroundColor: isLive ? "rgba(79, 216, 196, 0.1)" : "rgba(214, 85, 60, 0.1)",
            border: `1px solid ${isLive ? "var(--signal-cyan)" : "var(--critical-ember)"}`,
            color: isLive ? "var(--signal-cyan)" : "var(--critical-ember)",
            borderRadius: "2px",
            cursor: "pointer",
            fontSize: "10px",
            fontWeight: 600,
            whiteSpace: "nowrap"
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
          {isLive ? "LIVE" : "PAUSED"}
        </button>
      </div>
    </header>
  );
};


