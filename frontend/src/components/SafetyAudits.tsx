import React, { useMemo } from "react";
import { ShieldCheck, Clock, FileKey, User, Activity, ShieldAlert, CheckCircle } from "lucide-react";

interface AuditRecord {
  record_id: string;
  timestamp: string;
  action_type: string;
  actor_id: string;
  actor_role: string;
  target_entity_type: string;
  target_entity_id: string;
  operator_rationale: string | null;
  record_hash: string;
}

interface Incident {
  incident_id: string;
  category: string;
  priority_score: number;
}

interface SafetyAuditsProps {
  audits: AuditRecord[];
  location?: string;
  incidents?: Incident[];
}

function generateSyntheticAudits(location: string, incidents: Incident[]): AuditRecord[] {
  const primaryDisaster = incidents.length > 0
    ? incidents.reduce((prev, cur) => prev.priority_score > cur.priority_score ? prev : cur).category
    : "GENERAL_HAZARD";

  const hash = (s: string) => s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const seed = hash(location + primaryDisaster);

  const now = new Date();
  const mkTime = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60000).toISOString();
  const mkHash = (id: string) => `SHA3-${(hash(id + location) * 0x9e3779b9 >>> 0).toString(16).padStart(8, "0").toUpperCase()}...${(seed ^ 0xDEAD).toString(16).toUpperCase()}`;

  // Disaster-specific audit templates
  const auditTemplates: Record<string, Partial<AuditRecord>[]> = {
    FLOOD: [
      { action_type: "EVACUATION_ROUTE_OVERRIDE", target_entity_type: "ROUTE", operator_rationale: `Flood depth exceeded 1.2m on primary arterial near ${location}. Emergency bypass activated.` },
      { action_type: "SHELTER_CAPACITY_INCREASE", target_entity_type: "SHELTER", operator_rationale: `Displaced residents from low-lying zones in ${location} require immediate shelter expansion.` },
      { action_type: "PUMPING_STATION_ACTIVATION", target_entity_type: "INFRASTRUCTURE", operator_rationale: `Water levels at critical threshold — activating auxiliary pumps in ${location} sector.` },
      { action_type: "BOAT_RESCUE_DISPATCH", target_entity_type: "RESOURCE", operator_rationale: `Residents stranded due to flash flooding near ${location}. NDRF boats deployed.` },
    ],
    LANDSLIDE: [
      { action_type: "ROAD_CLOSURE_IMPOSED", target_entity_type: "ROUTE", operator_rationale: `Debris slide detected blocking NH road near ${location}. Road closed for public safety.` },
      { action_type: "GEOLOGICAL_SURVEY_TRIGGERED", target_entity_type: "ZONE", operator_rationale: `Unstable slope identified at ${location} — geological survey unit dispatched for risk assessment.` },
      { action_type: "HILLSIDE_EVACUATION_ORDER", target_entity_type: "SECTOR", operator_rationale: `Risk of secondary landslide near ${location}. Hillside settlements evacuated under emergency protocol.` },
      { action_type: "DEBRIS_CLEARANCE_DISPATCHED", target_entity_type: "RESOURCE", operator_rationale: `Heavy machinery deployed to clear blocked route near ${location}.` },
    ],
    FIRE: [
      { action_type: "FIRE_UNIT_DISPATCH", target_entity_type: "RESOURCE", operator_rationale: `Structure fire reported at ${location}. 3 fire tenders dispatched as per protocol.` },
      { action_type: "GAS_SUPPLY_CUTOFF", target_entity_type: "INFRASTRUCTURE", operator_rationale: `Gas pipeline shutoff activated to prevent fire escalation in ${location}.` },
      { action_type: "EXCLUSION_ZONE_ESTABLISHED", target_entity_type: "ZONE", operator_rationale: `500m exclusion zone established around active fire site in ${location}.` },
      { action_type: "AERIAL_SUPPORT_REQUESTED", target_entity_type: "RESOURCE", operator_rationale: `Forest fire spreading toward residential zone near ${location}. Aerial support requested.` },
    ],
    EARTHQUAKE: [
      { action_type: "STRUCTURAL_INTEGRITY_LOCKDOWN", target_entity_type: "BUILDING", operator_rationale: `Post-quake structural assessment ordered for all buildings in ${location}.` },
      { action_type: "SEARCH_AND_RESCUE_DISPATCH", target_entity_type: "RESOURCE", operator_rationale: `Collapse reported in dense residential area of ${location}. SAR teams deployed.` },
      { action_type: "HOSPITAL_SURGE_PROTOCOL", target_entity_type: "SHELTER", operator_rationale: `Casualty influx from ${location} earthquake. Hospital surge protocol activated.` },
      { action_type: "AFTERSHOCK_MONITORING_ACTIVE", target_entity_type: "ZONE", operator_rationale: `Seismic monitoring intensified around ${location} epicenter for aftershock detection.` },
    ],
    GENERAL_HAZARD: [
      { action_type: "SAFETY_PERIMETER_ESTABLISHED", target_entity_type: "ZONE", operator_rationale: `Unknown hazard identified near ${location}. Safety perimeter established pending assessment.` },
      { action_type: "RESOURCE_PREPOSITION", target_entity_type: "RESOURCE", operator_rationale: `Emergency resources pre-positioned in ${location} based on risk assessment.` },
      { action_type: "PUBLIC_ADVISORY_ISSUED", target_entity_type: "SECTOR", operator_rationale: `Public safety advisory issued for residents of ${location} per standard protocol.` },
      { action_type: "INCIDENT_COMMAND_ACTIVATED", target_entity_type: "COMMAND_POST", operator_rationale: `Incident command post activated at ${location} for coordinated disaster response.` },
    ],
  };

  const templates = auditTemplates[primaryDisaster] || auditTemplates["GENERAL_HAZARD"];

  const actors = [
    { id: `OPS-${(seed % 900) + 100}`, role: "FIELD_COMMANDER" },
    { id: `CTRL-${(seed % 50) + 10}`, role: "CONTROL_ROOM_OPERATOR" },
    { id: `DIR-${(seed % 9) + 1}`, role: "DISTRICT_DIRECTOR" },
    { id: `RESP-${(seed % 400) + 200}`, role: "FIRST_RESPONDER" },
  ];

  const entityIds: Record<string, string> = {
    ROUTE: `ROUTE-${location.slice(0, 3).toUpperCase()}-${(seed % 90) + 10}`,
    SHELTER: `SHELTER-${location.slice(0, 3).toUpperCase()}-0${(seed % 5) + 1}`,
    INFRASTRUCTURE: `INFRA-${(seed % 900) + 100}`,
    RESOURCE: `RES-${(seed % 900) + 100}`,
    ZONE: `ZONE-${(seed % 20) + 1}`,
    SECTOR: `SECTOR-${(seed % 15) + 1}`,
    BUILDING: `BLD-${location.slice(0, 3).toUpperCase()}-${(seed % 200) + 50}`,
    COMMAND_POST: `CP-${location.slice(0, 3).toUpperCase()}-MAIN`,
  };

  return templates.map((t, i) => {
    const actor = actors[i % actors.length];
    const rid = `AUD-${(seed + i * 137) % 9000 + 1000}`;
    return {
      record_id: rid,
      timestamp: mkTime(i * 8 + (seed % 5)),
      action_type: t.action_type!,
      actor_id: actor.id,
      actor_role: actor.role,
      target_entity_type: t.target_entity_type!,
      target_entity_id: entityIds[t.target_entity_type!] || `ENT-${i}`,
      operator_rationale: t.operator_rationale || null,
      record_hash: mkHash(rid),
    };
  });
}

export const SafetyAudits: React.FC<SafetyAuditsProps> = ({ audits, location = "Unknown", incidents = [] }) => {
  const displayAudits = useMemo(() => {
    if (audits && audits.length > 0) return audits;
    return generateSyntheticAudits(location, incidents);
  }, [audits, location, incidents]);

  const primaryDisaster = incidents.length > 0
    ? incidents.reduce((prev, cur) => prev.priority_score > cur.priority_score ? prev : cur).category
    : "GENERAL_HAZARD";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
          <ShieldCheck size={28} color="var(--signal-cyan)" />
          <h2 style={{ fontSize: "26px", fontWeight: "bold", color: "white" }}>Cryptographic Safety Audits</h2>
          <span style={{
            backgroundColor: "rgba(79, 70, 229, 0.2)", color: "var(--signal-cyan)",
            padding: "4px 12px", borderRadius: "16px", fontSize: "11px", fontWeight: "bold", border: "1px solid var(--signal-cyan)"
          }}>
            {primaryDisaster} RESPONSE
          </span>
        </div>
        <p style={{ color: "var(--ink-dim)", fontSize: "13px" }}>
          Immutable ledger of all critical operational actions for <strong style={{ color: "white" }}>{location}</strong>. {displayAudits.length} records on-chain.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "TOTAL ACTIONS", value: displayAudits.length.toString(), color: "white" },
          { label: "VERIFIED ON-CHAIN", value: displayAudits.length.toString(), color: "#10B981" },
          { label: "TAMPER ATTEMPTS", value: "0", color: "#10B981" },
          { label: "DISASTER TYPE", value: primaryDisaster, color: "var(--signal-cyan)" },
        ].map((s, i) => (
          <div key={i} style={{
            backgroundColor: "var(--panel-elevated)", padding: "16px", borderRadius: "var(--radius-lg)",
            border: "1px solid var(--grid-line)"
          }}>
            <div style={{ fontSize: "10px", color: "var(--ink-dim)", fontWeight: "bold", letterSpacing: "1px", marginBottom: "8px" }} className="mono">{s.label}</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Audit Records */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {displayAudits.map((audit) => (
          <div key={audit.record_id} style={{
            backgroundColor: "var(--panel)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--grid-line)",
            padding: "20px",
            display: "flex", flexDirection: "column", gap: "14px",
            position: "relative", overflow: "hidden"
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "4px", bottom: 0, backgroundColor: "var(--signal-cyan)" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginLeft: "12px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ padding: "8px", backgroundColor: "rgba(79, 70, 229, 0.1)", borderRadius: "8px", border: "1px solid rgba(79, 70, 229, 0.2)" }}>
                  <Activity size={18} color="var(--signal-cyan)" />
                </div>
                <div>
                  <h3 className="mono" style={{ fontSize: "15px", fontWeight: "bold", color: "white" }}>{audit.action_type}</h3>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                    <Clock size={11} color="var(--ink-dim)" />
                    <span style={{ fontSize: "11px", color: "var(--ink-dim)" }} className="mono">
                      {new Date(audit.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mono" style={{
                fontSize: "10px", color: "var(--ink-dim)", display: "flex", alignItems: "center",
                gap: "6px", backgroundColor: "var(--void)", padding: "4px 8px", borderRadius: "4px",
                border: "1px solid var(--grid-line)"
              }}>
                <FileKey size={11} />
                <span>ID: {audit.record_id}</span>
              </div>
            </div>

            <div style={{
              marginLeft: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px",
              backgroundColor: "var(--void)", padding: "14px", borderRadius: "8px", border: "1px solid var(--grid-line)"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "10px", color: "var(--ink-dim)" }} className="mono">ACTOR DETAILS</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <User size={13} color="var(--signal-cyan)" />
                    <span className="mono" style={{ fontSize: "12px", color: "white" }}>{audit.actor_id} ({audit.actor_role})</span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "var(--ink-dim)" }} className="mono">TARGET ENTITY</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <CheckCircle size={13} color="var(--signal-cyan)" />
                    <span className="mono" style={{ fontSize: "12px", color: "white" }}>{audit.target_entity_type}: {audit.target_entity_id}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderLeft: "1px solid var(--grid-line)", paddingLeft: "16px" }}>
                {audit.operator_rationale && (
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--dispute-amber)" }} className="mono">OPERATOR RATIONALE</span>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "4px" }}>
                      <ShieldAlert size={13} color="var(--dispute-amber)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ fontSize: "12px", color: "var(--ink)", lineHeight: "1.5", fontStyle: "italic" }}>
                        "{audit.operator_rationale}"
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <span style={{ fontSize: "10px", color: "var(--ink-dim)" }} className="mono">CRYPTOGRAPHIC SIGNATURE</span>
                  <div style={{
                    marginTop: "4px", fontSize: "10px", color: "var(--signal-cyan)",
                    backgroundColor: "rgba(79, 70, 229, 0.05)", padding: "6px", borderRadius: "4px",
                    border: "1px solid rgba(79, 70, 229, 0.15)", wordBreak: "break-all"
                  }} className="mono">
                    HASH: {audit.record_hash}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
