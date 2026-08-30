import React, { useState } from "react";
import type { Incident } from "../types/domain";
import { ZeroGauge } from "./ZeroGauge";
import { Users, ShieldAlert, AlertCircle, Filter, Search } from "lucide-react";

interface IncidentFeedProps {
  incidents: Incident[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
}

export const IncidentFeed: React.FC<IncidentFeedProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
}) => {
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "DISPUTED" | "ROOFTOP">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIncidents = incidents.filter((inc) => {
    if (filter === "CRITICAL" && inc.priority_score < 1.0) return false;
    if (filter === "DISPUTED" && !inc.dispute_flag) return false;
    if (filter === "ROOFTOP" && inc.micro_environment !== "ROOFTOP_STRANDED") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = inc.incident_id.toLowerCase().includes(q);
      const matchLoc = inc.location.address?.toLowerCase().includes(q) || inc.zone_id.toLowerCase().includes(q);
      const matchCat = inc.category.toLowerCase().includes(q);
      if (!matchId && !matchLoc && !matchCat) return false;
    }
    return true;
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--panel)",
        borderRight: "1px solid var(--grid-line)",
        width: "360px",
        minWidth: "340px",
      }}
    >
      {/* Header & Search */}
      <div style={{ padding: "14px 12px", borderBottom: "1px solid var(--grid-line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={13} color="var(--signal-cyan)" />
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--ink-bright)", letterSpacing: "0.5px" }} className="mono">
              TRIAGE QUEUE
            </span>
            <span
              className="mono"
              style={{
                fontSize: "10px",
                padding: "1px 6px",
                backgroundColor: "var(--void)",
                border: "1px solid var(--grid-line)",
                borderRadius: "10px",
                color: "var(--signal-cyan)",
                fontWeight: 700,
              }}
            >
              {filteredIncidents.length}
            </span>
          </div>
          <span className="mono" style={{ fontSize: "10px", color: "var(--ink-dim)" }}>
            ORDER: PRIORITY (P_i) ↓
          </span>
        </div>

        <div style={{ position: "relative", marginBottom: "10px" }}>
          <Search size={12} color="var(--ink-muted)" style={{ position: "absolute", left: "9px", top: "8px" }} />
          <input
            type="text"
            placeholder="Search ward, hazard, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mono"
            style={{
              width: "100%",
              padding: "6px 8px 6px 28px",
              backgroundColor: "var(--void)",
              border: "1px solid var(--grid-line)",
              color: "var(--ink)",
              fontSize: "11px",
              borderRadius: "4px",
              outline: "none",
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: "5px" }}>
          {[
            { id: "ALL", label: "ALL" },
            { id: "CRITICAL", label: "P > 1.0" },
            { id: "DISPUTED", label: "DISPUTES" },
            { id: "ROOFTOP", label: "ROOFTOP" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className="mono"
              style={{
                flex: 1,
                padding: "4px 0",
                fontSize: "10px",
                fontWeight: filter === tab.id ? 700 : 600,
                backgroundColor: filter === tab.id ? "var(--signal-cyan-glow)" : "var(--void)",
                color: filter === tab.id ? "var(--signal-cyan)" : "var(--ink-dim)",
                border: `1px solid ${filter === tab.id ? "var(--signal-cyan-border)" : "var(--grid-line)"}`,
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {filteredIncidents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--ink-muted)" }} className="mono">
            <AlertCircle size={20} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
            NO INCIDENTS MATCHING CRITERIA
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isSelected = selectedIncidentId === inc.incident_id;
            const isCritical = inc.priority_score >= 1.0;

            return (
              <div
                key={inc.incident_id}
                onClick={() => onSelectIncident(inc.incident_id)}
                style={{
                  backgroundColor: isSelected ? "var(--panel-elevated)" : "var(--void)",
                  border: isSelected
                    ? "1px solid var(--signal-cyan)"
                    : isCritical
                    ? "1px solid var(--critical-ember-border)"
                    : "1px solid var(--grid-line)",
                  borderRadius: "5px",
                  padding: "11px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "7px",
                  position: "relative",
                  boxShadow: isSelected ? "0 0 12px var(--signal-cyan-glow)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {/* Header row: ID, Ward, Priority Score */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="mono" style={{ fontSize: "11px", fontWeight: 800, color: "var(--ink-bright)" }}>
                      {inc.incident_id}
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "9px",
                        padding: "1px 5px",
                        backgroundColor: "var(--panel)",
                        border: "1px solid var(--grid-line)",
                        borderRadius: "3px",
                        color: "var(--ink-dim)",
                      }}
                    >
                      {inc.zone_id}
                    </span>
                  </div>

                  {/* Priority & Urgency Badge */}
                  <div className="mono" style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "10px", color: "var(--ink-dim)" }}>P:</span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: isCritical ? "var(--critical-ember)" : "var(--signal-cyan)",
                      }}
                    >
                      {inc.priority_score.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Location text */}
                <div style={{ fontSize: "11px", color: "var(--ink-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {inc.location.address || `Sector Zone ${inc.zone_id}`}
                </div>

                {/* Tags row: Hazard, Micro-Environment, Dispute */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: "9px",
                      padding: "2px 6px",
                      backgroundColor: "var(--critical-ember-glow)",
                      color: "var(--critical-ember)",
                      border: "1px solid var(--critical-ember-border)",
                      borderRadius: "3px",
                      fontWeight: 700,
                    }}
                  >
                    {inc.category.replace(/_/g, " ")}
                  </span>

                  {inc.micro_environment !== "NONE" && (
                    <span
                      className="mono"
                      style={{
                        fontSize: "9px",
                        padding: "2px 6px",
                        backgroundColor: "var(--signal-cyan-glow)",
                        color: "var(--signal-cyan)",
                        border: "1px solid var(--signal-cyan-border)",
                        borderRadius: "3px",
                        fontWeight: 700,
                      }}
                    >
                      {inc.micro_environment.replace(/_/g, " ")}
                    </span>
                  )}

                  {inc.dispute_flag && (
                    <span
                      className="mono hatched-amber"
                      style={{
                        fontSize: "9px",
                        padding: "2px 6px",
                        color: "var(--dispute-amber)",
                        borderRadius: "3px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <ShieldAlert size={10} /> DISPUTED
                    </span>
                  )}
                </div>

                {/* Victim estimates and vulnerability pills */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: "var(--ink-dim)" }} className="mono">
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Users size={11} color="var(--ink-dim)" />
                    <span>
                      VICTIMS:{" "}
                      <strong style={{ color: "var(--ink-bright)" }}>
                        {inc.victim_estimate.min_victims === inc.victim_estimate.max_victims
                          ? inc.victim_estimate.best_guess
                          : `[${inc.victim_estimate.min_victims}..${inc.victim_estimate.max_victims}]`}
                      </strong>
                    </span>
                  </div>

                  {inc.vulnerability_tags.length > 0 && (
                    <span style={{ color: "var(--critical-ember)", fontWeight: 600 }}>
                      +{inc.vulnerability_tags.length} VULN
                    </span>
                  )}
                </div>

                {/* Zero Gauge Confidence Meter */}
                <ZeroGauge
                  score={inc.confidence_score}
                  isDisputed={inc.dispute_flag}
                  size="sm"
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
