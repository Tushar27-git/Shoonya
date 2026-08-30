import React, { useState } from "react";
import type {
  Incident,
  Resource,
  DispatchPlanResponse,
  AuditRecord,
} from "../types/domain";
import {
  ShieldCheck,
  Cpu,
  Radio,
  Sliders,
  FileText,
} from "lucide-react";

interface OperationalConsoleProps {
  selectedIncident: Incident | null;
  dispatchPlan: DispatchPlanResponse | null;
  resources: Resource[];
  auditRecords: AuditRecord[];
  onApprovePlan: (planId: string) => Promise<void>;
  onOverridePlan: (planId: string, reason: string) => Promise<void>;
  onRecalculateWeights: (weights: Record<string, number>) => Promise<void>;
  onVerifyAuditChain: () => Promise<void>;
  onGeneratePlan?: () => Promise<void>;
  onTaskDrone?: (incidentId: string, lat: number, lng: number, reason: string) => Promise<void>;
  onVerifyCV?: (incidentId: string) => Promise<void>;
  onSplitIncident?: (incidentId: string) => Promise<void>;
}

export const OperationalConsole: React.FC<OperationalConsoleProps> = ({
  selectedIncident,
  dispatchPlan,
  auditRecords,
  onApprovePlan,
  onOverridePlan,
  onRecalculateWeights,
  onVerifyAuditChain,
  onGeneratePlan,
  onTaskDrone,
  onVerifyCV,
  onSplitIncident,
}) => {
  const [activeTab, setActiveTab] = useState<"DISPATCH" | "WHAT_IF" | "REVERSE_SOS" | "EVIDENCE" | "AUDIT">("DISPATCH");

  // What-if sliders state
  const [weights, setWeights] = useState({
    w1: 0.35, // Severity
    w2: 0.25, // Vulnerability
    w3: 0.20, // Victim count
    w4: 0.10, // Recency
    w5: 0.10, // Accessibility
  });

  // Reverse SOS state
  const [advisoryType, setAdvisoryType] = useState<string>("BOAT_INBOUND");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["SMS", "VOICE_IVR"]);
  const [etaMinutes, setEtaMinutes] = useState<number>(15);
  const [previewLang, setPreviewLang] = useState<"EN" | "HI" | "HINGLISH">("HI");
  const [sosRationale, setSosRationale] = useState<string>("");
  const [isSendingSos, setIsSendingSos] = useState<boolean>(false);
  const [sosStatusMessage, setSosStatusMessage] = useState<string | null>(null);

  // Override modal state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOverrideSubmit = async () => {
    if (!dispatchPlan || !overrideReason.trim()) return;
    setIsSubmitting(true);
    try {
      await onOverridePlan(dispatchPlan.plan_id, overrideReason.trim());
      setShowOverrideModal(false);
      setOverrideReason("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReverseSOS = async () => {
    if (!sosRationale.trim()) return;
    setIsSendingSos(true);
    setSosStatusMessage(null);
    try {
      const payload = selectedIncident
        ? {
            incident_id: selectedIncident.incident_id,
            advisory_type: advisoryType,
            channels: selectedChannels,
            target_radius_km: 1.5,
            eta_min: etaMinutes,
            commander_id: "COMMANDER-01",
            operator_rationale: sosRationale.trim(),
          }
        : {
            ward: "WARD-12",
            radius_km: 2.5,
            advisory_type: advisoryType,
            channels: selectedChannels,
            commander_id: "COMMANDER-01",
            operator_rationale: sosRationale.trim(),
          };

      const endpoint = selectedIncident ? "/notifications/reverse-sos" : "/notifications/broadcast";
      const res = await fetch(`http://127.0.0.1:8001${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to dispatch alert: HTTP ${res.status}`);
      }

      setSosStatusMessage(`✓ Reverse SOS broadcast across ${selectedChannels.join(", ")}`);
      setSosRationale("");
      await onVerifyAuditChain();
    } catch (err: any) {
      setSosStatusMessage(`✗ Error: ${err.message}`);
    } finally {
      setIsSendingSos(false);
    }
  };

  const getAdvisoryPreview = () => {
    const loc = selectedIncident ? selectedIncident.location.address || selectedIncident.incident_id : "Affected Ward";
    if (advisoryType === "BOAT_INBOUND") {
      if (previewLang === "HI") return `राहत दल रवाना: राहत नाव RESCUE-01 ${loc} के लिए रवाना हो गई है। अनुमानित समय: लगभग ${etaMinutes} मिनट। दृश्य संकेतों के साथ सुरक्षित ऊंचाई पर रहें।`;
      if (previewLang === "HINGLISH") return `RESCUE UPDATE: Relief Boat RESCUE-01 ${loc} ke liye dispatch ho chuki hai. ETA: ~${etaMinutes} mins. Safe unchai par signal karein.`;
      return `RESCUE DISPATCH: Relief/Rescue Boat RESCUE-01 dispatched to ${loc}. ETA: ~${etaMinutes} mins. Stay at high ground with visual signals.`;
    } else if (advisoryType === "WATER_CONTAMINATION") {
      if (previewLang === "HI") return `गंभीर स्वास्थ्य चेतावनी: ${loc} में नल का भूजल बाढ़ के कारण दूषित हो चुका है। नल का कच्चा पानी बिल्कुल न पिएं।`;
      if (previewLang === "HINGLISH") return `HEALTH WARNING: ${loc} mein tap water contaminate ho chuka hai. Direct tap water bilkul mat piyein.`;
      return `CRITICAL HEALTH WARNING: Ground tap water in ${loc} is contaminated. DO NOT DRINK untreated tap water.`;
    } else if (advisoryType === "EVACUATION_ORDER") {
      if (previewLang === "HI") return `अनिवार्य निकासी आदेश: ${loc} के लिए तत्काल निकासी आदेश प्रभावी है। कृपया निकटतम राहत केंद्र पर पहुंचे।`;
      if (previewLang === "HINGLISH") return `MANDATORY EVACUATION: ${loc} ke sabhi log nearest relief center pahuchein.`;
      return `MANDATORY EVACUATION: Immediate evacuation order for ${loc}. Proceed along high-ground routes to nearest relief center.`;
    } else {
      if (previewLang === "HI") return `आपातकालीन चेतावनी: ${loc} में बाढ़ का पानी तेजी से बढ़ रहा है। तुरंत ऊपरी मंजिल या छत पर चले जाएं।`;
      if (previewLang === "HINGLISH") return `EMERGENCY ALERT: ${loc} mein flood water badh raha hai. Turant upper floors par safe ho jayein.`;
      return `EMERGENCY ALERT: Flood waters rising rapidly in ${loc}. Move immediately to upper floors or rooftop.`;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--bg-surface)",
        borderLeft: "1px solid var(--border-subtle)",
        width: "380px",
        minWidth: "350px",
        overflow: "hidden",
      }}
    >
      {/* Unified Tab Navigation Bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-root)",
          padding: "4px 6px 0 6px",
          gap: "2px",
        }}
      >
        {[
          { id: "DISPATCH", label: "DISPATCH", icon: Cpu },
          { id: "WHAT_IF", label: "WHAT-IF", icon: Sliders },
          { id: "REVERSE_SOS", label: "REVERSE SOS", icon: Radio },
          { id: "EVIDENCE", label: "EVIDENCE", icon: FileText },
          { id: "AUDIT", label: "AUDIT", icon: ShieldCheck },
        ].map((t) => {
          const isActive = activeTab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className="mono"
              style={{
                flex: 1,
                padding: "8px 2px",
                fontSize: "10px",
                fontWeight: isActive ? 700 : 500,
                backgroundColor: isActive ? "var(--bg-surface)" : "transparent",
                color: isActive ? "var(--blue-light)" : "var(--text-secondary)",
                border: "1px solid",
                borderColor: isActive ? "var(--border-subtle) var(--border-subtle) transparent var(--border-subtle)" : "transparent",
                borderTopLeftRadius: "var(--radius-sm)",
                borderTopRightRadius: "var(--radius-sm)",
                borderBottom: isActive ? "2px solid var(--blue-bright)" : "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={11} color={isActive ? "var(--blue-bright)" : "var(--text-muted)"} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
        {/* ----------------- TAB 1: DISPATCH & HUMAN APPROVAL ----------------- */}
        {activeTab === "DISPATCH" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)" }} className="mono">
                MILP OPTIMIZATION PLAN
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {onGeneratePlan && (
                  <button
                    onClick={onGeneratePlan}
                    className="mono"
                    style={{
                      padding: "3px 8px",
                      fontSize: "10px",
                      fontWeight: 700,
                      backgroundColor: "var(--blue-subtle)",
                      border: "1px solid var(--blue-border)",
                      color: "var(--blue-light)",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(37, 99, 235, 0.25)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--blue-subtle)")}
                  >
                    ⚡ SOLVE CP-SAT
                  </button>
                )}
                {dispatchPlan && (
                  <span
                    className="mono"
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor:
                        dispatchPlan.plan_quality === "PLAN QUALITY: OPTIMAL"
                          ? "var(--color-success-bg)"
                          : "var(--color-warning-bg)",
                      color:
                        dispatchPlan.plan_quality === "PLAN QUALITY: OPTIMAL"
                          ? "var(--color-success)"
                          : "var(--color-warning)",
                      border: `1px solid ${
                        dispatchPlan.plan_quality === "PLAN QUALITY: OPTIMAL"
                          ? "var(--color-success-border)"
                          : "var(--color-warning-border)"
                      }`,
                    }}
                  >
                    {dispatchPlan.plan_quality}
                  </span>
                )}
              </div>
            </div>

            {dispatchPlan ? (
              <>
                <div
                  className="mono"
                  style={{
                    backgroundColor: "var(--bg-root)",
                    padding: "8px 10px",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>SOLVE: <strong style={{ color: "var(--blue-light)" }}>{(dispatchPlan.solver_duration_seconds ?? 0).toFixed(3)}s</strong></span>
                  <span>SERVED: <strong style={{ color: "var(--text-primary)" }}>{dispatchPlan.assignments?.length ?? 0}</strong></span>
                  <span>UNSERVED: <strong style={{ color: (dispatchPlan.unserved_incidents?.length ?? 0) > 0 ? "var(--color-critical)" : "var(--text-secondary)" }}>{dispatchPlan.unserved_incidents?.length ?? 0}</strong></span>
                </div>

                {/* Assignment Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {dispatchPlan.assignments.map((a, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "var(--bg-root)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        padding: "8px 10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="mono">
                        <span style={{ fontWeight: 700, color: "var(--blue-light)", fontSize: "11px" }}>{a.resource_id}</span>
                        <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>➔ {a.incident_id}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>{a.reason}</div>
                      <div className="mono" style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        EST. TRAVEL TIME: <strong style={{ color: "var(--text-primary)" }}>{a.estimated_travel_time_min} MIN</strong>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Human Operator Approval Gate */}
                <div style={{ marginTop: "10px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                  <div className="mono" style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    HUMAN OPERATOR AUTHORIZATION GATE
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => onApprovePlan(dispatchPlan.plan_id)}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        backgroundColor: "var(--blue-bright)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "11px",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        boxShadow: "0 2px 10px rgba(37, 99, 235, 0.3)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      ✓ AUTHORIZE PLAN
                    </button>
                    <button
                      onClick={() => setShowOverrideModal(true)}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        backgroundColor: "var(--color-warning-bg)",
                        border: "1px solid var(--color-warning-border)",
                        color: "var(--color-warning)",
                        fontWeight: 700,
                        fontSize: "11px",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      ✎ OVERRIDE...
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-muted)" }} className="mono">
                NO ACTIVE PLAN GENERATED
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 2: WHAT-IF SIMULATOR ----------------- */}
        {activeTab === "WHAT_IF" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)" }} className="mono">
              PRIORITY FORMULA WEIGHT ADJUSTMENT
            </div>

            {[
              { id: "w1", label: "w1: Hazard Severity", val: weights.w1 },
              { id: "w2", label: "w2: Vulnerability (Children/Injured)", val: weights.w2 },
              { id: "w3", label: "w3: Victim Count Scale", val: weights.w3 },
              { id: "w4", label: "w4: Time Recency", val: weights.w4 },
              { id: "w5", label: "w5: Accessibility Risk", val: weights.w5 },
            ].map((slider) => (
              <div key={slider.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }} className="mono">
                  <span style={{ color: "var(--text-secondary)" }}>{slider.label}</span>
                  <span style={{ color: "var(--blue-light)", fontWeight: 700 }}>{slider.val.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.8"
                  step="0.05"
                  value={slider.val}
                  onChange={(e) =>
                    setWeights({ ...weights, [slider.id]: Number(e.target.value) })
                  }
                  style={{ accentColor: "var(--blue-bright)", cursor: "pointer" }}
                />
              </div>
            ))}

            <button
              onClick={() => onRecalculateWeights(weights)}
              style={{
                marginTop: "8px",
                padding: "8px 0",
                backgroundColor: "var(--blue-bright)",
                border: "none",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "11px",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(37, 99, 235, 0.3)",
                transition: "all 0.15s ease",
              }}
              className="mono"
            >
              RECALCULATE PRIORITIES NOW
            </button>
          </div>
        )}

        {/* ----------------- TAB 3: REVERSE SOS & BROADCAST ----------------- */}
        {activeTab === "REVERSE_SOS" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--blue-light)" }} className="mono">
                OUTBOUND REVERSE SOS // MICRO-GUIDANCE
              </span>
              <span className="mono" style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                {selectedIncident ? `TARGET: ${selectedIncident.incident_id}` : "GEOFENCE: WARD-12"}
              </span>
            </div>

            {sosStatusMessage && (
              <div
                className="mono"
                style={{
                  padding: "6px 8px",
                  fontSize: "10px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: sosStatusMessage.startsWith("✓") ? "var(--color-success-bg)" : "var(--color-critical-bg)",
                  color: sosStatusMessage.startsWith("✓") ? "var(--color-success)" : "var(--color-critical)",
                  border: `1px solid ${sosStatusMessage.startsWith("✓") ? "var(--color-success-border)" : "var(--color-critical-border)"}`,
                }}
              >
                {sosStatusMessage}
              </div>
            )}

            {/* Advisory Type Selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "10px", color: "var(--text-secondary)" }} className="mono">
                ADVISORY TYPE
              </label>
              <select
                value={advisoryType}
                onChange={(e) => setAdvisoryType(e.target.value)}
                style={{
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  padding: "6px 8px",
                  fontSize: "11px",
                  borderRadius: "var(--radius-sm)",
                  outline: "none",
                }}
              >
                <option value="BOAT_INBOUND">BOAT_INBOUND (Rescue Boat ETA & Signals)</option>
                <option value="FLOOD_RISING">FLOOD_RISING (Move to Rooftop / Upper Floors)</option>
                <option value="WATER_CONTAMINATION">WATER_CONTAMINATION (Do Not Drink Tap Water)</option>
                <option value="EVACUATION_ORDER">EVACUATION_ORDER (Proceed to Designated Shelter)</option>
                <option value="SHELTER_AVAILABLE">SHELTER_AVAILABLE (Shelter Capacity Open)</option>
                <option value="GENERAL_ALERT">GENERAL_ALERT (Stay Indoors / Battery Saver)</option>
              </select>
            </div>

            {/* Channel Selection Checkboxes */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "10px", color: "var(--text-secondary)" }} className="mono">
                DISPATCH CHANNELS
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "11px" }}>
                {["SMS", "VOICE_IVR", "CELL_BROADCAST", "RADIO"].map((ch) => (
                  <label key={ch} style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", color: "var(--text-primary)" }}>
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(ch)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChannels([...selectedChannels, ch]);
                        } else {
                          setSelectedChannels(selectedChannels.filter((c) => c !== ch));
                        }
                      }}
                      style={{ accentColor: "var(--blue-bright)" }}
                    />
                    <span className="mono" style={{ fontSize: "10px" }}>{ch}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ETA Input */}
            {advisoryType === "BOAT_INBOUND" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }} className="mono">
                  <span style={{ color: "var(--text-secondary)" }}>ESTIMATED ARRIVAL (ETA)</span>
                  <span style={{ color: "var(--blue-light)", fontWeight: 700 }}>{etaMinutes} MINS</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={etaMinutes}
                  onChange={(e) => setEtaMinutes(Number(e.target.value))}
                  style={{ accentColor: "var(--blue-bright)" }}
                />
              </div>
            )}

            {/* Multi-Lingual Preview Box */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", backgroundColor: "var(--bg-input)", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }} className="mono">
                  LIVE MICRO-GUIDANCE PREVIEW
                </span>
                <div style={{ display: "flex", gap: "3px" }}>
                  {(["HI", "HINGLISH", "EN"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setPreviewLang(lang)}
                      className="mono"
                      style={{
                        padding: "2px 5px",
                        fontSize: "9px",
                        fontWeight: 700,
                        backgroundColor: previewLang === lang ? "var(--blue-bright)" : "transparent",
                        color: previewLang === lang ? "#ffffff" : "var(--text-secondary)",
                        border: "none",
                        borderRadius: "2px",
                        cursor: "pointer",
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: "11px", color: "var(--text-primary)", lineHeight: "1.4", marginTop: "4px" }}>
                {getAdvisoryPreview()}
              </div>
            </div>

            {/* Mandatory Rationale Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "10px", color: "var(--color-warning)" }} className="mono">
                COMMANDER RATIONALE // MANDATORY AUDIT
              </label>
              <textarea
                rows={2}
                placeholder="State operational justification..."
                value={sosRationale}
                onChange={(e) => setSosRationale(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontSize: "11px",
                  borderRadius: "var(--radius-sm)",
                  outline: "none",
                  resize: "none",
                }}
              />
            </div>

            {/* Dispatch Button */}
            <button
              disabled={!sosRationale.trim() || selectedChannels.length === 0 || isSendingSos}
              onClick={handleSendReverseSOS}
              style={{
                padding: "8px 0",
                backgroundColor: sosRationale.trim() && selectedChannels.length > 0 ? "var(--blue-bright)" : "var(--bg-input)",
                border: "none",
                color: sosRationale.trim() && selectedChannels.length > 0 ? "#ffffff" : "var(--text-muted)",
                fontWeight: 700,
                fontSize: "11px",
                borderRadius: "var(--radius-sm)",
                cursor: sosRationale.trim() && selectedChannels.length > 0 ? "pointer" : "not-allowed",
                boxShadow: sosRationale.trim() && selectedChannels.length > 0 ? "0 2px 10px rgba(37, 99, 235, 0.3)" : "none",
                transition: "all 0.15s ease",
              }}
              className="mono"
            >
              {isSendingSos ? "TRANSMITTING OUTBOUND SOS..." : "TRANSMIT REVERSE SOS ADVISORY"}
            </button>
          </div>
        )}

        {/* ----------------- TAB 4: EVIDENCE & DISPUTES ----------------- */}
        {activeTab === "EVIDENCE" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {selectedIncident ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)" }} className="mono">
                    {selectedIncident.incident_id} // EVIDENCE DOSSIER
                  </span>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                    REPORTS: {selectedIncident.constituent_report_ids.length}
                  </span>
                </div>

                {/* Disputes section if present */}
                {selectedIncident.dispute_flag && (
                  <div
                    className="hatched-amber"
                    style={{
                      padding: "10px",
                      borderRadius: "var(--radius-sm)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "var(--color-warning)", fontSize: "11px" }} className="mono">
                      ⚠ MATERIAL CONTRADICTION DETECTED
                    </div>
                    {selectedIncident.disputes.map((d, idx) => (
                      <div key={idx} style={{ fontSize: "11px", color: "var(--text-primary)", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ color: "var(--text-secondary)" }} className="mono">
                          FIELD: {d.field_disputed}
                        </div>
                        <div style={{ backgroundColor: "rgba(0,0,0,0.4)", padding: "5px 8px", borderRadius: "3px" }}>
                          <strong style={{ color: "var(--blue-light)" }}>CLAIM A ({d.claim_a_source}):</strong> {d.claim_a_text}
                        </div>
                        <div style={{ backgroundColor: "rgba(0,0,0,0.4)", padding: "5px 8px", borderRadius: "3px" }}>
                          <strong style={{ color: "var(--color-critical)" }}>CLAIM B ({d.claim_b_source}):</strong> {d.claim_b_text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Constituent Reports List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                    RAW CONSTITUENT OBSERVATIONS
                  </span>
                  {selectedIncident.evidence_summary.map((text, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "var(--bg-root)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        padding: "8px 10px",
                        fontSize: "11px",
                        lineHeight: "1.4",
                        color: "var(--text-primary)",
                      }}
                    >
                      "{text}"
                    </div>
                  ))}
                </div>

                {/* Evidence Verification Action Controls */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                    OPERATIONAL SENSOR FUSION
                  </span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {onVerifyCV && (
                      <button
                        onClick={() => onVerifyCV(selectedIncident.incident_id)}
                        className="mono"
                        style={{
                          flex: 1,
                          padding: "6px 8px",
                          fontSize: "10px",
                          fontWeight: 700,
                          backgroundColor: "var(--blue-subtle)",
                          border: "1px solid var(--blue-border)",
                          color: "var(--blue-light)",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                        }}
                      >
                        🛰 RUN OPTICAL/SAR CV
                      </button>
                    )}
                    {onTaskDrone && (
                      <button
                        onClick={() =>
                          onTaskDrone(
                            selectedIncident.incident_id,
                            selectedIncident.location.lat,
                            selectedIncident.location.lng,
                            `Aerial thermal survey for ${selectedIncident.incident_id}`
                          )
                        }
                        className="mono"
                        style={{
                          flex: 1,
                          padding: "6px 8px",
                          fontSize: "10px",
                          fontWeight: 700,
                          backgroundColor: "var(--color-warning-bg)",
                          border: "1px solid var(--color-warning-border)",
                          color: "var(--color-warning)",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                        }}
                      >
                        🚁 TASK RECON DRONE
                      </button>
                    )}
                    {onSplitIncident && selectedIncident.constituent_report_ids.length > 1 && (
                      <button
                        onClick={() => onSplitIncident(selectedIncident.incident_id)}
                        className="mono"
                        style={{
                          flex: 1,
                          padding: "6px 8px",
                          fontSize: "10px",
                          fontWeight: 700,
                          backgroundColor: "var(--color-critical-bg)",
                          border: "1px solid var(--color-critical-border)",
                          color: "var(--color-critical)",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                        }}
                      >
                        ✂ SPLIT CLUSTER
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-muted)" }} className="mono">
                SELECT AN INCIDENT TO VIEW EVIDENCE
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 5: CRYPTOGRAPHIC AUDIT LOG ----------------- */}
        {activeTab === "AUDIT" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)" }} className="mono">
                TAMPER-EVIDENT AUDIT TRAIL
              </span>
              <button
                onClick={onVerifyAuditChain}
                style={{
                  padding: "3px 8px",
                  fontSize: "10px",
                  fontWeight: 700,
                  backgroundColor: "var(--blue-subtle)",
                  border: "1px solid var(--blue-border)",
                  color: "var(--blue-light)",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                }}
                className="mono"
              >
                VERIFY INTEGRITY
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {auditRecords.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }} className="mono">
                  NO AUDIT BLOCKS RECORDED
                </div>
              ) : (
                auditRecords.map((r, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "var(--bg-root)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                      fontSize: "10px",
                    }}
                    className="mono"
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong style={{ color: "var(--blue-light)" }}>{r.action_type}</strong>
                      <span style={{ color: "var(--text-secondary)" }}>{r.record_id}</span>
                    </div>
                    <div style={{ color: "var(--text-secondary)" }}>
                      ACTOR: {r.actor_id} ({r.actor_role})
                    </div>
                    {r.operator_rationale && (
                      <div style={{ color: "var(--color-warning)", marginTop: "2px" }}>
                        RATIONALE: "{r.operator_rationale}"
                      </div>
                    )}
                    <div style={{ color: "var(--text-muted)", fontSize: "9px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      HASH: {r.record_hash?.substring(0, 20)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ----------------- OVERRIDE RATIONALE MODAL ----------------- */}
      {showOverrideModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "440px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--color-warning-border)",
              borderRadius: "var(--radius-md)",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--color-warning)", fontSize: "12px" }} className="mono">
              OPERATOR DISPATCH OVERRIDE // MANDATORY RATIONALE
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
              Under constitutional guardrails, overriding optimization requires a permanent,
              tamper-evident justification recorded in the immutable audit log.
            </div>

            <textarea
              rows={3}
              placeholder="State precise operational reason (e.g. Ground patrol reports Bridge B impassable)..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontSize: "11px",
                borderRadius: "var(--radius-sm)",
                outline: "none",
                resize: "none",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                onClick={() => setShowOverrideModal(false)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                }}
              >
                CANCEL
              </button>
              <button
                disabled={!overrideReason.trim() || isSubmitting}
                onClick={handleOverrideSubmit}
                style={{
                  padding: "6px 14px",
                  backgroundColor: overrideReason.trim() ? "var(--color-warning)" : "var(--bg-input)",
                  border: "none",
                  color: overrideReason.trim() ? "var(--bg-root)" : "var(--text-muted)",
                  fontWeight: 700,
                  borderRadius: "var(--radius-sm)",
                  cursor: overrideReason.trim() ? "pointer" : "not-allowed",
                }}
              >
                {isSubmitting ? "RECORDING..." : "COMMIT OVERRIDE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
