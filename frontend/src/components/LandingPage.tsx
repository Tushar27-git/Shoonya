import React from "react";
import {
  MapPin,
  Cpu,
  Radio,
  ArrowRight,
  Layers,
  Sparkles,
  FileCheck,
  ShieldCheck,
} from "lucide-react";
import type { SystemTelemetry } from "../types/domain";

interface LandingPageProps {
  telemetry: SystemTelemetry;
  onEnterDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  telemetry,
  onEnterDashboard,
}) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "var(--bg-root)",
        backgroundImage: `
          radial-gradient(circle at 50% 12%, rgba(37, 99, 235, 0.08) 0%, transparent 55%),
          radial-gradient(circle at 85% 85%, rgba(37, 99, 235, 0.03) 0%, transparent 45%)
        `,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "var(--text-primary)",
        overflowY: "auto",
        position: "relative",
      }}
    >
      {/* Top Navigation Bar with Glassmorphic Floating Style */}
      <header
        className="glass-panel"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 36px",
          borderBottom: "1px solid var(--border-subtle)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--blue-subtle)",
              border: "1px solid var(--blue-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Layers size={16} color="var(--blue-bright)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span
              style={{
                fontSize: "17px",
                fontWeight: 800,
                letterSpacing: "1.5px",
                color: "var(--text-primary)",
              }}
            >
              SHOONYA
            </span>
            <span
              className="mono"
              style={{
                fontSize: "10px",
                color: "var(--text-secondary)",
                padding: "2px 6px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                letterSpacing: "0.5px",
              }}
            >
              CRISIS INTELLIGENCE
            </span>
          </div>
        </div>

        {/* Right Status Pill & CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            className="mono"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11px",
              padding: "5px 12px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "var(--blue-bright)",
                boxShadow: "0 0 8px var(--blue-bright)",
              }}
            />
            <span style={{ color: "var(--text-muted)" }}>SYSTEM:</span>
            <span style={{ color: "var(--blue-light)", fontWeight: 700 }}>
              ONLINE
            </span>
            <span style={{ color: "var(--border-default)" }}>|</span>
            <span style={{ color: "var(--text-secondary)" }}>RAIPUR EAST SECTOR 4</span>
          </div>

          <button
            onClick={onEnterDashboard}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              backgroundColor: "var(--blue-bright)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "var(--radius-sm)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              letterSpacing: "0.5px",
              boxShadow: "0 2px 10px rgba(37, 99, 235, 0.3)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--blue-primary)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(37, 99, 235, 0.5)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--blue-bright)";
              e.currentTarget.style.boxShadow = "0 2px 10px rgba(37, 99, 235, 0.3)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            ENTER DASHBOARD
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Main Hero Content */}
      <main
        style={{
          maxWidth: "1160px",
          margin: "0 auto",
          padding: "50px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          flex: 1,
          justifyContent: "center",
        }}
      >
        {/* Subtle Top Badge */}
        <div
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "5px 14px",
            backgroundColor: "var(--blue-subtle)",
            border: "1px solid var(--blue-border)",
            borderRadius: "20px",
            fontSize: "11px",
            color: "var(--blue-light)",
            marginBottom: "22px",
            letterSpacing: "0.5px",
          }}
        >
          <Sparkles size={12} color="var(--blue-bright)" />
          NEXT-GEN EMERGENCY OPERATIONS DECISION SUPPORT
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "58px",
            fontWeight: 800,
            letterSpacing: "3px",
            lineHeight: 1.1,
            marginBottom: "16px",
            color: "var(--text-primary)",
            textTransform: "uppercase",
          }}
        >
          SHOONYA
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "19px",
            fontWeight: 600,
            color: "var(--blue-light)",
            maxWidth: "760px",
            marginBottom: "16px",
            lineHeight: 1.4,
          }}
        >
          Closed-Loop Crisis Intelligence & Autonomous Rescue Optimization System
        </p>

        {/* Technical Description */}
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            maxWidth: "700px",
            lineHeight: 1.65,
            marginBottom: "34px",
          }}
        >
          Continuous multi-channel report ingestion, geospatial contradiction resolution, silent telecom dark-zone identification, and constraint-based MILP rescue dispatching under strict human commander verification.
        </p>

        {/* CTA Launch Button */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "48px" }}>
          <button
            onClick={onEnterDashboard}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "13px 32px",
              backgroundColor: "var(--blue-bright)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "var(--radius-md)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "13px",
              letterSpacing: "0.5px",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(37, 99, 235, 0.4)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--blue-primary)";
              e.currentTarget.style.boxShadow = "0 6px 26px rgba(37, 99, 235, 0.6)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--blue-bright)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(37, 99, 235, 0.4)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            LAUNCH OPERATIONAL COMMAND CENTER
            <ArrowRight size={16} />
          </button>
        </div>

        {/* 4 Core Pillars / Capability Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            width: "100%",
            textAlign: "left",
          }}
        >
          {/* Pillar 1 */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              transition: "border-color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--blue-border)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--blue-subtle)",
                border: "1px solid var(--blue-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Radio size={16} color="var(--blue-light)" />
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              Multi-Source Ingestion & Triage
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Ingests Voice, Radio, SMS, and Social feeds. Multilingual NLP estimates casualties, assigns micro-environment tags, and calculates priority ranking.
            </p>
          </div>

          {/* Pillar 2 */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              transition: "border-color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--blue-border)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-warning-bg)",
                border: "1px solid var(--color-warning-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={16} color="var(--color-warning)" />
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              Tactical Map & Dark Zones
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Precision-tiered geospatial tracking. Detects unmonitored communication blackouts and tracks hospital surge and road passability in real time.
            </p>
          </div>

          {/* Pillar 3 */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              transition: "border-color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--blue-border)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--blue-subtle)",
                border: "1px solid var(--blue-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Cpu size={16} color="var(--blue-light)" />
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              MILP CP-SAT Dispatch Solver
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Mathematical constraint solver allocating boats, ambulances, and heavy rescue vehicles within 3–5 seconds with human commander approval gate.
            </p>
          </div>

          {/* Pillar 4 */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              transition: "border-color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--blue-border)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-success-bg)",
                border: "1px solid var(--color-success-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileCheck size={16} color="var(--color-success)" />
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              EOC AI Copilot & SITREP
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Context-grounded operational copilot with verified citations, automated SITREP generation, and reverse SOS citizen broadcast capabilities.
            </p>
          </div>
        </div>
      </main>

      {/* Footer / Telemetry Strip */}
      <footer
        className="glass-panel"
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "12px 36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "11px",
          color: "var(--text-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }} className="mono">
          <span style={{ color: "var(--text-muted)" }}>LIVE TELEMETRY:</span>
          <span>
            INCIDENTS: <strong style={{ color: "var(--color-critical)" }}>{telemetry.active_incidents}</strong>
          </span>
          <span>
            DISPUTES: <strong style={{ color: "var(--color-warning)" }}>{telemetry.disputed_incidents}</strong>
          </span>
          <span>
            DARK ZONES: <strong style={{ color: "var(--text-primary)" }}>{telemetry.dark_zones}</strong>
          </span>
          <span>
            LATENCY: <strong style={{ color: "var(--blue-light)" }}>{telemetry.ingestion_to_map_latency_sec.toFixed(2)}s</strong>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }} className="mono">
          <ShieldCheck size={14} color="var(--blue-bright)" />
          <span style={{ color: "var(--text-secondary)" }}>CRYPTOGRAPHIC AUDIT CHAIN ACTIVE // SHA-256</span>
        </div>
      </footer>
    </div>
  );
};
