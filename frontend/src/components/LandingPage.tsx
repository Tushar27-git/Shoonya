import React from "react";
import {
  MapPin,
  Cpu,
  Radio,
  ArrowRight,
  Layers,
  Sparkles,
  FileCheck,
  CheckCircle2,
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
        backgroundColor: "var(--void)",
        backgroundImage: `
          radial-gradient(circle at 50% 15%, rgba(56, 189, 248, 0.07) 0%, transparent 60%),
          radial-gradient(circle at 80% 85%, rgba(245, 158, 11, 0.04) 0%, transparent 50%),
          linear-gradient(180deg, rgba(9, 12, 16, 0) 0%, rgba(9, 12, 16, 0.8) 100%)
        `,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "var(--ink)",
        overflowY: "auto",
        position: "relative",
      }}
    >
      {/* Top Bar / System Status */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          borderBottom: "1px solid var(--grid-line)",
          backgroundColor: "rgba(15, 21, 31, 0.6)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              backgroundColor: "var(--signal-cyan-glow)",
              border: "1px solid var(--signal-cyan-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Layers size={18} color="var(--signal-cyan)" />
          </div>
          <div>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 800,
                letterSpacing: "2px",
                color: "var(--ink-bright)",
              }}
            >
              SHOONYA
            </span>
            <span
              className="mono"
              style={{
                fontSize: "11px",
                color: "var(--ink-dim)",
                marginLeft: "8px",
                padding: "2px 6px",
                backgroundColor: "var(--panel)",
                border: "1px solid var(--grid-line)",
                borderRadius: "3px",
              }}
            >
              CRISIS INTELLIGENCE PLATFORM
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            className="mono"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              padding: "6px 12px",
              backgroundColor: "var(--panel)",
              border: "1px solid var(--grid-line)",
              borderRadius: "4px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--signal-cyan)",
                boxShadow: "0 0 8px var(--signal-cyan)",
              }}
            />
            <span style={{ color: "var(--ink-dim)" }}>SYSTEM:</span>
            <span style={{ color: "var(--signal-cyan)", fontWeight: 700 }}>
              OPERATIONAL
            </span>
            <span style={{ color: "var(--ink-muted)", margin: "0 4px" }}>|</span>
            <span style={{ color: "var(--ink-dim)" }}>SECTOR 4 RAIPUR EAST</span>
          </div>

          <button
            onClick={onEnterDashboard}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              backgroundColor: "var(--signal-cyan)",
              border: "none",
              borderRadius: "4px",
              color: "var(--void)",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              letterSpacing: "0.5px",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(56, 189, 248, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            ENTER DASHBOARD
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main
        style={{
          maxWidth: "1200px",
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
        {/* Subtle Badge */}
        <div
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 14px",
            backgroundColor: "rgba(56, 189, 248, 0.08)",
            border: "1px solid var(--signal-cyan-border)",
            borderRadius: "20px",
            fontSize: "11px",
            color: "var(--signal-cyan)",
            marginBottom: "24px",
            letterSpacing: "0.5px",
          }}
        >
          <Sparkles size={13} />
          NEXT-GENERATION EMERGENCY OPERATIONS DECISION SUPPORT
        </div>

        {/* Hero Title */}
        <h1
          style={{
            fontSize: "64px",
            fontWeight: 800,
            letterSpacing: "4px",
            lineHeight: 1.1,
            marginBottom: "18px",
            color: "var(--ink-bright)",
            textTransform: "uppercase",
          }}
        >
          SHOONYA
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: "20px",
            fontWeight: 500,
            color: "var(--signal-cyan)",
            maxWidth: "780px",
            marginBottom: "16px",
            lineHeight: 1.4,
          }}
        >
          Closed-Loop Crisis Intelligence & Autonomous Rescue Optimization System
        </p>

        {/* Concise Description */}
        <p
          style={{
            fontSize: "14px",
            color: "var(--ink-dim)",
            maxWidth: "720px",
            lineHeight: 1.7,
            marginBottom: "36px",
          }}
        >
          SHOONYA continuously ingests multi-channel emergency reports, resolves geospatial contradictions, identifies silent telecom dark zones, and solves constraint-based MILP rescue resource dispatching under strict human commander verification.
        </p>

        {/* Enter Dashboard CTA Button */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "50px" }}>
          <button
            onClick={onEnterDashboard}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 34px",
              backgroundColor: "var(--signal-cyan)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "6px",
              color: "var(--void)",
              fontWeight: 800,
              fontSize: "14px",
              letterSpacing: "1px",
              cursor: "pointer",
              boxShadow: "0 6px 24px rgba(56, 189, 248, 0.35)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(56, 189, 248, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 24px rgba(56, 189, 248, 0.35)";
            }}
          >
            ENTER OPERATIONAL DASHBOARD
            <ArrowRight size={18} />
          </button>
        </div>

        {/* 4 Core Pillars / Capability Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "18px",
            width: "100%",
            textAlign: "left",
          }}
        >
          {/* Pillar 1: Spatial Triage */}
          <div
            style={{
              backgroundColor: "var(--panel)",
              border: "1px solid var(--grid-line)",
              borderRadius: "6px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              transition: "border-color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--signal-cyan-border)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--grid-line)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                backgroundColor: "var(--signal-cyan-glow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Radio size={18} color="var(--signal-cyan)" />
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-bright)" }}>
              Multi-Source Ingestion & Triage
            </h3>
            <p style={{ fontSize: "12px", color: "var(--ink-dim)", lineHeight: 1.5 }}>
              Ingests Voice, Radio, SMS, and Social feeds. Employs multilingual NLP for automated casualty estimates, micro-environment tagging, and severity ranking.
            </p>
          </div>

          {/* Pillar 2: Tactical Geospatial Map */}
          <div
            style={{
              backgroundColor: "var(--panel)",
              border: "1px solid var(--grid-line)",
              borderRadius: "6px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              transition: "border-color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--dispute-amber-border)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--grid-line)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                backgroundColor: "var(--dispute-amber-glow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={18} color="var(--dispute-amber)" />
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-bright)" }}>
              Tactical Map & Dark Zones
            </h3>
            <p style={{ fontSize: "12px", color: "var(--ink-dim)", lineHeight: 1.5 }}>
              Provides precision-tiered geospatial tracking. Detects unmonitored communication blackouts and tracks flood-threatened hospital bed capacities.
            </p>
          </div>

          {/* Pillar 3: MILP Dispatch Solver */}
          <div
            style={{
              backgroundColor: "var(--panel)",
              border: "1px solid var(--grid-line)",
              borderRadius: "6px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              transition: "border-color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--critical-ember-border)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--grid-line)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                backgroundColor: "var(--critical-ember-glow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Cpu size={18} color="var(--critical-ember)" />
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-bright)" }}>
              MILP CP-SAT Dispatch Solver
            </h3>
            <p style={{ fontSize: "12px", color: "var(--ink-dim)", lineHeight: 1.5 }}>
              Mathematical constraint solver allocating boats, ambulances, and heavy excavators within a 3–5 second budget with a human commander approval gate.
            </p>
          </div>

          {/* Pillar 4: EOC Copilot */}
          <div
            style={{
              backgroundColor: "var(--panel)",
              border: "1px solid var(--grid-line)",
              borderRadius: "6px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              transition: "border-color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--signal-cyan-border)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--grid-line)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                backgroundColor: "var(--signal-cyan-glow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileCheck size={18} color="var(--signal-cyan)" />
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-bright)" }}>
              EOC AI Copilot & SITREP
            </h3>
            <p style={{ fontSize: "12px", color: "var(--ink-dim)", lineHeight: 1.5 }}>
              Context-grounded operational assistant with strict entity citations, automated SITREP generation, and reverse SOS multi-channel citizen broadcasting.
            </p>
          </div>
        </div>
      </main>

      {/* Footer / Telemetry Strip */}
      <footer
        style={{
          borderTop: "1px solid var(--grid-line)",
          backgroundColor: "var(--panel)",
          padding: "14px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "11px",
          color: "var(--ink-dim)",
        }}
        className="mono"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span>LIVE TELEMETRY:</span>
          <span>INCIDENTS: <strong style={{ color: "var(--critical-ember)" }}>{telemetry.active_incidents}</strong></span>
          <span>DISPUTES: <strong style={{ color: "var(--dispute-amber)" }}>{telemetry.disputed_incidents}</strong></span>
          <span>DARK ZONES: <strong style={{ color: "var(--ink)" }}>{telemetry.dark_zones}</strong></span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={13} color="var(--signal-cyan)" />
          <span>CRYPTOGRAPHIC AUDIT TRAIL ACTIVE // SHA-256</span>
        </div>
      </footer>
    </div>
  );
};
