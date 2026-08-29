import React, { useState } from "react";
import type { Incident } from "../types/domain";
import { ZeroGauge } from "./ZeroGauge";
import { Users, ShieldAlert } from "lucide-react";


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
      <div style={{ padding: "12px", borderBottom: "1px solid var(--grid-line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-dim)", letterSpacing: "1px" }}>
            INCIDENT TRIAGE QUEUE // {filteredIncidents.length}
          </span>
          <span className="mono" style={{ fontSize: "10px", color: "var(--signal-cyan)" }}>
            ORDER: PRIORITY (P_i) ↓
          </span>
        </div>

        <input
          type="text"
          placeholder="Filter ward, ID, or hazard..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mono"
          style={{
            width: "100%",
            padding: "6px 8px",
            backgroundColor: "var(--void)",
            border: "1px solid var(--grid-line)",
            color: "var(--ink)",
            fontSize: "11px",
            borderRadius: "2px",
            outline: "none",
            marginBottom: "8px",
          }}
        />

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: "4px" }}>
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
                padding: "3px 0",
                fontSize: "10px",
                fontWeight: 600,
                backgroundColor: filter === tab.id ? "var(--grid-line-bright)" : "var(--void)",
                color: filter === tab.id ? "var(--ink)" : "var(--ink-dim)",
                border: "1px solid var(--grid-line)",
                borderRadius: "2px",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {filteredIncidents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--ink-muted)" }} className="mono">
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
                    ? "1px solid rgba(214, 85, 60, 0.4)"
                    : "1px solid var(--grid-line)",
                  borderRadius: "2px",
                  padding: "10px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  position: "relative",
                  transition: "background-color 0.15s ease",
                }}
              >
                {/* Header row: ID, Ward, Priority Score */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)" }}>
                      {inc.incident_id}
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "9px",
                        padding: "1px 4px",
                        backgroundColor: "var(--panel)",
                        border: "1px solid var(--grid-line)",
                        borderRadius: "2px",
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
                        fontWeight: 700,
                        color: isCritical ? "var(--critical-ember)" : "var(--ink)",
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
                      padding: "2px 5px",
                      backgroundColor: "rgba(214, 85, 60, 0.15)",
                      color: "var(--critical-ember)",
                      border: "1px solid rgba(214, 85, 60, 0.3)",
                      borderRadius: "2px",
                      fontWeight: 600,
                    }}
                  >
                    {inc.category}
                  </span>

                  {inc.micro_environment !== "NONE" && (
                    <span
                      className="mono"
                      style={{
                        fontSize: "9px",
                        padding: "2px 5px",
                        backgroundColor: "rgba(79, 216, 196, 0.12)",
                        color: "var(--signal-cyan)",
                        border: "1px solid rgba(79, 216, 196, 0.3)",
                        borderRadius: "2px",
                        fontWeight: 600,
                      }}
                    >
                      {inc.micro_environment}
                    </span>
                  )}

                  {inc.dispute_flag && (
                    <span
                      className="mono hatched-amber"
                      style={{
                        fontSize: "9px",
                        padding: "2px 5px",
                        color: "var(--dispute-amber)",
                        borderRadius: "2px",
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
                      <strong style={{ color: "var(--ink)" }}>
                        {inc.victim_estimate.min_victims === inc.victim_estimate.max_victims
                          ? inc.victim_estimate.best_guess
                          : `[${inc.victim_estimate.min_victims}..${inc.victim_estimate.max_victims}]`}
                      </strong>
                    </span>
                  </div>

                  {inc.vulnerability_tags.length > 0 && (
                    <span style={{ color: "var(--critical-ember)" }}>
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
