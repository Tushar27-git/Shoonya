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
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        width: "350px",
        minWidth: "320px",
      }}
    >
      {/* Header & Search */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-root)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={12} color="var(--blue-bright)" />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "0.5px",
              }}
              className="mono"
            >
              TRIAGE QUEUE
            </span>
            <span
              className="mono"
              style={{
                fontSize: "10px",
                padding: "1px 6px",
                backgroundColor: "var(--blue-subtle)",
                border: "1px solid var(--blue-border)",
                borderRadius: "10px",
                color: "var(--blue-light)",
                fontWeight: 700,
              }}
            >
              {filteredIncidents.length}
            </span>
          </div>
          <span className="mono" style={{ fontSize: "10px", color: "var(--text-muted)" }}>
            ORDER: P_i ↓
          </span>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", marginBottom: "8px" }}>
          <Search
            size={13}
            color="var(--text-muted)"
            style={{ position: "absolute", left: "10px", top: "8px" }}
          />
          <input
            type="text"
            placeholder="Search ID, ward, or hazard..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mono"
            style={{
              width: "100%",
              padding: "6px 10px 6px 28px",
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              fontSize: "11px",
              borderRadius: "var(--radius-sm)",
              outline: "none",
              transition: "border-color 0.15s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--blue-border)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: "4px" }}>
          {[
            { id: "ALL", label: "ALL" },
            { id: "CRITICAL", label: "P > 1.0" },
            { id: "DISPUTED", label: "DISPUTES" },
            { id: "ROOFTOP", label: "ROOFTOP" },
          ].map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className="mono"
                style={{
                  flex: 1,
                  padding: "4px 0",
                  fontSize: "10px",
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? "var(--blue-subtle)" : "var(--bg-input)",
                  color: isActive ? "var(--blue-light)" : "var(--text-secondary)",
                  border: `1px solid ${isActive ? "var(--blue-border)" : "var(--border-subtle)"}`,
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Incident Cards Feed */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {filteredIncidents.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 10px",
              color: "var(--text-muted)",
            }}
            className="mono"
          >
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
                className={isSelected ? "glass-active" : ""}
                style={{
                  backgroundColor: isSelected ? "var(--bg-glass-active)" : "var(--bg-root)",
                  border: isSelected
                    ? "1px solid var(--blue-bright)"
                    : isCritical
                    ? "1px solid var(--color-critical-border)"
                    : "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 12px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = "var(--border-hover)";
                    e.currentTarget.style.backgroundColor = "var(--bg-surface-elevated)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = isCritical ? "var(--color-critical-border)" : "var(--border-subtle)";
                    e.currentTarget.style.backgroundColor = "var(--bg-root)";
                  }
                }}
              >
                {/* Top row: ID, Ward, Priority Score */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: isSelected ? "var(--blue-light)" : "var(--text-primary)",
                      }}
                    >
                      {inc.incident_id}
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "9px",
                        padding: "1px 5px",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {inc.zone_id}
                    </span>
                  </div>

                  {/* Priority Value */}
                  <div className="mono" style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>P:</span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: isCritical ? "var(--color-critical)" : "var(--blue-light)",
                      }}
                    >
                      {inc.priority_score.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Location text */}
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {inc.location.address || `Sector Zone ${inc.zone_id}`}
                </div>

                {/* Tags row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: "9px",
                      padding: "2px 5px",
                      backgroundColor: "var(--color-critical-bg)",
                      color: "var(--color-critical)",
                      border: "1px solid var(--color-critical-border)",
                      borderRadius: "var(--radius-sm)",
                      fontWeight: 600,
                    }}
                  >
                    {inc.category.replace(/_/g, " ")}
                  </span>

                  {inc.micro_environment !== "NONE" && (
                    <span
                      className="mono"
                      style={{
                        fontSize: "9px",
                        padding: "2px 5px",
                        backgroundColor: "var(--blue-subtle)",
                        color: "var(--blue-light)",
                        border: "1px solid var(--blue-border)",
                        borderRadius: "var(--radius-sm)",
                        fontWeight: 600,
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
                        padding: "2px 5px",
                        color: "var(--color-warning)",
                        borderRadius: "var(--radius-sm)",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <ShieldAlert size={9} /> DISPUTED
                    </span>
                  )}
                </div>

                {/* Victim estimates and vulnerability pills */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "10px",
                    color: "var(--text-secondary)",
                  }}
                  className="mono"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Users size={10} color="var(--text-muted)" />
                    <span>
                      VICTIMS:{" "}
                      <strong style={{ color: "var(--text-primary)" }}>
                        {inc.victim_estimate.min_victims === inc.victim_estimate.max_victims
                          ? inc.victim_estimate.best_guess
                          : `[${inc.victim_estimate.min_victims}..${inc.victim_estimate.max_victims}]`}
                      </strong>
                    </span>
                  </div>

                  {inc.vulnerability_tags.length > 0 && (
                    <span style={{ color: "var(--color-critical)", fontWeight: 600 }}>
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
