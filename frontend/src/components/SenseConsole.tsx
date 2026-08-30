import React, { useState } from "react";
import { TacticalMap } from "./TacticalMap";
import { Header } from "./Header";
import { NgoTaskPanel } from "./NgoTaskPanel";
import { AmplifyCardPreview } from "./AmplifyCardPreview";
import { SaathiProfile } from "./SaathiProfile";
import { ImpactBoard } from "./ImpactBoard";
import { LocationSearch } from "./LocationSearch";
import { RiskAnalytics } from "./RiskAnalytics";
import { RouteAnalysis } from "./RouteAnalysis";
import { FleetStatus } from "./FleetStatus";
import { SafetyAudits } from "./SafetyAudits";
import { SafetyAlerts } from "./SafetyAlerts";
import { Settings } from "./Settings";
import { EmergencyContacts } from "./EmergencyContacts";
import { CopilotModal } from "./CopilotModal";
import { DispatchPanel } from "./DispatchPanel";
import { useDashboardState } from "../hooks/useDashboardState";
import { Shield, Map as MapIcon, BarChart2, Truck, CheckSquare, Bell, User, Settings as SettingsIcon, AlertOctagon, Send } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

export const SenseConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("SENSE_MAP");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [locationName, setLocationName] = useState<string>("Connaught Place, New Delhi");
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const { state } = useDashboardState();
  const incidents = state?.active_incidents || state?.incidents || [];
  const needs = state?.tasks || [];
  const amplifyCards = state?.amplify_cards || [];
  const emergingRiskZones = state?.emerging_risk_zones || [];
  const queueDepth = state?.queue_depth ?? (state?.counters?.queue || 0);
  const roadDisputes = state?.disputes || state?.road_disputes || [];
  const darkZones = state?.dark_zones || [];
  const fleetData = state?.fleet || [];
  const auditTimeline = state?.audit_timeline || [];
  
  const isSimulating = state?.simulation_status === "RUNNING";
  const simulationComplete = state?.simulation_status === "COMPLETE";

  const handleRunSimulation = async () => {
    try {
      const payload = mapCenter ? { lat: mapCenter[0], lng: mapCenter[1] } : {};
      await fetch(`${API_BASE}/simulation/run`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetDemo = async () => {
    try {
      await fetch(`${API_BASE}/simulation/reset`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevealGroundTruth = async () => {
    try {
      await fetch(`${API_BASE}/simulation/reveal-ground-truth`, {
        method: "POST"
      });
    } catch (e) {}
  };

  const handleAcceptTask = async (id: string) => {
    try {
      await fetch(`${API_BASE}/tasks/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saathi_id: "NGO-A" })
      });
    } catch (e) {}
  };

  const handleApproveCard = async (cardId: string) => {
    try {
      await fetch(`${API_BASE}/amplify/cards/${cardId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Mock-Auth-Role": "ADMIN" },
        body: JSON.stringify({ approver_id: "EOC-COMMAND-01" })
      });
    } catch(e) {}
  };

  const selectedIncident = incidents.find((i: any) => i.incident_id === selectedIncidentId);

  const primaryIncidentCategory = incidents.length > 0 
    ? incidents.reduce((prev: any, current: any) => (prev.priority_score > current.priority_score) ? prev : current).category 
    : "HAZARD";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", backgroundColor: "var(--void)" }}>
      <Header telemetry={{ 
        queue_depth: queueDepth, 
        active_incidents: incidents.length, 
        disputed_incidents: roadDisputes.length, 
        dark_zones: darkZones.length, 
        solver_status: state?.advisory_solver || "READY" 
      } as any} isLive={true} onToggleLive={() => {}} onOpenCopilot={() => setIsCopilotOpen(true)} 
      onLocationFound={(coords, name) => {
        setMapCenter(coords);
        setLocationName(name);
      }} />
      
      {isSimulating && (
        <div className="mono" style={{ 
          backgroundColor: "var(--dispute-amber)", color: "var(--void)", textAlign: "center", padding: "4px", fontWeight: "bold", letterSpacing: "1px", fontSize: "12px" 
        }}>
          SIMULATED SCENARIO — SYNTHETIC DATA
        </div>
      )}

      {/* Main Layout Area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* SHOONYA Left Sidebar */}
        <div style={{
          width: "240px",
          backgroundColor: "var(--panel-elevated)",
          borderRight: "1px solid var(--grid-line)",
          display: "flex",
          flexDirection: "column",
          padding: "16px 0",
          zIndex: 50,
          boxShadow: "4px 0 24px rgba(0,0,0,0.5)"
        }}>
          <div style={{ padding: "0 24px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Shield size={24} color="var(--signal-cyan)" />
            <span style={{ fontSize: "16px", fontWeight: "bold", color: "white" }}>SHOONYA</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "0 12px", flex: 1 }}>
            {[
              { id: "SENSE_MAP", label: "Command Center", icon: <MapIcon size={18} /> },
              { id: "ROUTE_ANALYSIS", label: "Route Analysis", icon: <MapIcon size={18} /> },
              { id: "RISK_ANALYTICS", label: "Risk Analytics", icon: <BarChart2 size={18} /> },
              { id: "DISPATCH", label: "Dispatch", icon: <Send size={18} /> },
              { id: "FLEET_STATUS", label: "Fleet Status", icon: <Truck size={18} /> },
              { id: "SAFETY_AUDITS", label: "Safety Audits", icon: <CheckSquare size={18} /> },
              { id: "SAFETY_ALERTS", label: "Safety Alerts", icon: <Bell size={18} /> },
              { id: "SAATHI_PROFILE", label: "Profile & Access", icon: <User size={18} /> },
              { id: "SETTINGS", label: "Settings", icon: <SettingsIcon size={18} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  backgroundColor: activeTab === tab.id ? "var(--signal-cyan)" : "transparent",
                  color: activeTab === tab.id ? "white" : "var(--ink-dim)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontWeight: activeTab === tab.id ? "bold" : "normal",
                  textAlign: "left",
                  transition: "all 0.2s"
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "16px 12px" }}>
            <button 
              onClick={() => setShowEmergencyContacts(true)}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid var(--critical-ember)",
                color: "var(--critical-ember)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              <AlertOctagon size={18} />
              Emergency SOS Response
            </button>
          </div>
        </div>
      
        {/* Main Map Container */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          
          {/* Permanent Tactical Map */}
          <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
            <TacticalMap 
              incidents={incidents}
              resources={[]} 
              darkZones={darkZones}
              roadDisputes={roadDisputes}
              emergingRiskZones={emergingRiskZones}
              shelters={state?.shelters || []}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={setSelectedIncidentId}
              mapCenter={mapCenter}
              showRoutes={activeTab === "ROUTE_ANALYSIS"}
              primaryIncidentCategory={primaryIncidentCategory}
            />
          </div>

          {/* SENSE MAP (Command Center) Feed Overlay */}
          {activeTab === "SENSE_MAP" && (
            <div style={{ 
              position: "absolute", top: 0, left: 0, bottom: 0, 
              width: "380px", borderRight: "1px solid var(--grid-line)", display: "flex", flexDirection: "column", 
              backgroundColor: "rgba(10, 15, 20, 0.85)", backdropFilter: "blur(12px)", zIndex: 10,
              boxShadow: "4px 0 24px rgba(0,0,0,0.5)"
            }}>
              
              <div style={{ padding: "16px", borderBottom: "1px solid var(--grid-line)", display: "flex", gap: "8px", flexDirection: "column" }}>
                <button 
                  className="mono"
                  style={{
                    padding: "8px 16px", backgroundColor: isSimulating ? "var(--ink-muted)" : "var(--signal-cyan)", 
                    color: isSimulating ? "var(--ink)" : "var(--void)", border: "none", cursor: isSimulating ? "not-allowed" : "pointer", fontWeight: "bold"
                  }}
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                >
                  {isSimulating ? "SIMULATING..." : "▶ RUN DEMO SIMULATION"}
                </button>
                <span style={{ fontSize: "10px", color: "var(--ink-dim)", textAlign: "center", marginTop: "-4px" }}>Generates synthetic incident data for testing</span>

                <button 
                  className="mono"
                  style={{
                    padding: "8px 16px", backgroundColor: "transparent", 
                    color: "var(--ink)", border: "1px solid var(--grid-line)", cursor: "pointer", fontWeight: "bold"
                  }}
                  onClick={handleResetDemo}
                >
                  ⟲ RESET DEMO
                </button>

                {simulationComplete && (
                  <button 
                    className="mono"
                    style={{
                      padding: "8px 16px", backgroundColor: "transparent", 
                      color: "var(--dispute-amber)", border: "1px solid var(--dispute-amber)", cursor: "pointer", fontWeight: "bold"
                    }}
                    onClick={handleRevealGroundTruth}
                  >
                    REVEAL GROUND TRUTH
                  </button>
                )}
              </div>

              {/* Incident Feed */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                <h3 className="mono" style={{ color: "var(--ink-dim)", marginBottom: "12px" }}>LIVE INCIDENT FEED ({incidents.length})</h3>
                
                {incidents
                  .sort((a: any, b: any) => b.priority_score - a.priority_score)
                  .map((inc: any) => (
                  <div 
                    key={inc.incident_id}
                    onClick={() => setSelectedIncidentId(inc.incident_id)}
                    style={{
                      padding: "12px",
                      marginBottom: "8px",
                      border: `1px solid ${selectedIncidentId === inc.incident_id ? "var(--signal-cyan)" : "var(--grid-line)"}`,
                      backgroundColor: "var(--panel-elevated)",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span className="mono" style={{ color: "var(--signal-cyan)" }}>Incident {inc.incident_id}</span>
                      <span className="mono" style={{ color: inc.priority_score >= 1.0 ? "var(--critical-ember)" : "var(--ink)" }}>
                        Severity: {Math.round(inc.priority_score * 100)}%
                      </span>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "bold" }}>{inc.category}</div>
                    
                  </div>
                ))}
              </div>

              {/* Incident Detail */}
              {selectedIncident && (
                <div style={{ height: "40%", borderTop: "1px solid var(--grid-line)", padding: "16px", overflowY: "auto", backgroundColor: "rgba(15, 20, 25, 0.95)" }}>
                  <h3 className="mono" style={{ color: "var(--signal-cyan)" }}>DETAIL: {selectedIncident.incident_id}</h3>
                  
                  {selectedIncident.dispute_flag ? (
                    <div style={{ marginTop: "12px", border: "1px solid var(--dispute-amber)", padding: "8px" }} className="hatched-amber">
                      <h4 className="mono" style={{ color: "var(--dispute-amber)", marginBottom: "8px" }}>⚠ DISPUTED</h4>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <div style={{ flex: 1, padding: "8px", backgroundColor: "var(--void)" }}>
                          <strong className="mono" style={{color: "var(--ink-dim)"}}>REPORT 1</strong>
                          <p style={{marginTop: "4px", fontSize: "12px"}}>Evidence extracted from social media indicates heavy flooding.</p>
                        </div>
                        <div style={{ flex: 1, padding: "8px", backgroundColor: "var(--void)" }}>
                          <strong className="mono" style={{color: "var(--ink-dim)"}}>REPORT 2</strong>
                          <p style={{marginTop: "4px", fontSize: "12px"}}>Ground saathi reports area is dry and clear.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: "12px" }}>
                      <p>Confidence: {selectedIncident.confidence_score.toFixed(2)}</p>
                      <p>Location: {selectedIncident.zone_id}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        {activeTab === "ROUTE_ANALYSIS" && (
          <div style={{ position: "absolute", top: 24, right: 24, zIndex: 20, width: "450px", maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
            <RouteAnalysis origin={locationName} incidents={incidents} />
          </div>
        )}

        {activeTab === "RISK_ANALYTICS" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 30, backgroundColor: "var(--void)", padding: "24px", overflowY: "auto" }}>
            <RiskAnalytics origin={locationName} incidents={incidents} />
          </div>
        )}

        {activeTab === "SAFETY_AUDITS" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 30, backgroundColor: "var(--void)", padding: "24px", overflowY: "auto" }}>
            <SafetyAudits audits={auditTimeline} location={locationName} incidents={incidents} />
          </div>
        )}

        {/* Other isolated tabs that replace map */}
        {activeTab === "NGO_TASKS" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 30, backgroundColor: "var(--void)" }}>
            <NgoTaskPanel needs={needs} acceptedTasks={new Set()} onAcceptTask={handleAcceptTask} />
          </div>
        )}

        {activeTab === "AMPLIFY_CARDS" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 30, backgroundColor: "var(--void)" }}>
            <AmplifyCardPreview cards={amplifyCards} onApproveCard={handleApproveCard} />
          </div>
        )}

        {activeTab === "SAATHI_PROFILE" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 30, backgroundColor: "var(--void)" }}>
            <SaathiProfile />
          </div>
        )}

        {activeTab === "IMPACT_BOARD" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 30, backgroundColor: "var(--void)" }}>
            <ImpactBoard />
          </div>
        )}

        {activeTab === "DISPATCH" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 30, backgroundColor: "var(--void)", padding: "24px", overflowY: "auto" }}>
            <DispatchPanel incidents={incidents} resources={resources} />
          </div>
        )}

        {activeTab === "FLEET_STATUS" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 30, backgroundColor: "var(--void)" }}>
            <FleetStatus fleet={fleetData} />
          </div>
        )}

        {activeTab === "SAFETY_ALERTS" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 30, backgroundColor: "var(--void)" }}>
            <SafetyAlerts location={locationName} incidents={incidents} />
          </div>
        )}

        {activeTab === "SETTINGS" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 30, backgroundColor: "var(--void)" }}>
            <Settings />
          </div>
        )}

      </div>
      </div>

      <EmergencyContacts 
        isOpen={showEmergencyContacts} 
        onClose={() => setShowEmergencyContacts(false)} 
        location={locationName} 
      />

      <CopilotModal 
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        selectedIncidentId={selectedIncidentId}
        onSelectIncident={setSelectedIncidentId}
        userLocation={locationName}
      />
    </div>
  );
};

export default SenseConsole;
