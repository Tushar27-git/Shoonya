import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { IncidentFeed } from "./components/IncidentFeed";
import { TacticalMap } from "./components/TacticalMap";
import { TimeReplaySlider } from "./components/TimeReplaySlider";
import { OperationalConsole } from "./components/OperationalConsole";
import { CopilotModal } from "./components/CopilotModal";
import type {
  Incident,
  Resource,
  DispatchPlanResponse,
  AuditRecord,
  SystemTelemetry,
} from "./types/domain";

const API_BASE = "http://127.0.0.1:8001";

export const App: React.FC = () => {
  // State management
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [dispatchPlan, setDispatchPlan] = useState<DispatchPlanResponse | null>(null);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // Copilot Modal state
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Replay timeline state
  const [isLive, setIsLive] = useState(true);
  const [replayMinutesAgo, setReplayMinutesAgo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Telemetry strip state
  const [telemetry, setTelemetry] = useState<SystemTelemetry>({
    queue_depth: 0,
    active_incidents: 0,
    disputed_incidents: 0,
    dark_zones: 1,
    solver_status: "READY",
    ingestion_to_map_latency_sec: 0.12,
    timestamp: new Date().toISOString(),
  });

  // Fetch live system state from backend
  const fetchLiveData = useCallback(async () => {
    try {
      // 1. Fetch telemetry
      const telRes = await fetch(`${API_BASE}/telemetry`);
      if (telRes.ok) {
        const telData = await telRes.json();
        setTelemetry(telData);
      }

      // 2. Fetch active incidents
      const incRes = await fetch(`${API_BASE}/clustering/incidents`);
      if (incRes.ok) {
        const incData: Incident[] = await incRes.json();
        if (incData.length > 0) {
          setIncidents(incData);
          if (!selectedIncidentId) {
            setSelectedIncidentId(incData[0].incident_id);
          }
        }
      }

      // 3. Fetch resources
      const resRes = await fetch(`${API_BASE}/dispatch/resources`);
      if (resRes.ok) {
        const resData: Resource[] = await resRes.json();
        setResources(resData);
      }

      // 4. Fetch audit records
      const audRes = await fetch(`${API_BASE}/audit/records`);
      if (audRes.ok) {
        const audData: AuditRecord[] = await audRes.json();
        setAuditRecords(audData);
      }
    } catch (e) {
      console.warn("Backend poll warning:", e);
    }
  }, [selectedIncidentId]);

  // Initial load and periodic live telemetry poll
  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(() => {
      if (isLive) {
        fetchLiveData();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchLiveData, isLive]);

  // Handlers for real API operations
  const handleApprovePlan = async (planId: string) => {
    try {
      const res = await fetch(`${API_BASE}/audit/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          decision: "APPROVED",
          operator_id: "COMMANDER-01",
          override_reason: "Optimal rescue allocation verified by EOC Commander.",
        }),
      });

      if (!res.ok) throw new Error(`Approval failed: HTTP ${res.status}`);
      const data = await res.json();
      await fetchLiveData();
      alert(`✓ Plan ${planId} APPROVED by EOC Command.\nAudit Record: ${data.audit_record_id}`);
    } catch (e: any) {
      alert(`✗ Error approving plan: ${e.message}`);
    }
  };

  const handleOverridePlan = async (planId: string, reason: string) => {
    try {
      const res = await fetch(`${API_BASE}/audit/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          decision: "OVERRIDDEN",
          operator_id: "COMMANDER-01",
          override_reason: reason,
        }),
      });

      if (!res.ok) throw new Error(`Override failed: HTTP ${res.status}`);
      const data = await res.json();
      await fetchLiveData();
      alert(`✎ Plan ${planId} OVERRIDDEN.\nMandatory Rationale Logged: "${reason}"\nAudit Record: ${data.audit_record_id}`);
    } catch (e: any) {
      alert(`✗ Error overriding plan: ${e.message}`);
    }
  };

  const handleGeneratePlan = async () => {
    try {
      const res = await fetch(`${API_BASE}/dispatch/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_travel_time_min: 60.0,
          budget_seconds: 3.5,
          commander_id: "COMMANDER-01",
        }),
      });

      if (!res.ok) throw new Error(`CP-SAT Solver error: HTTP ${res.status}`);
      const plan: DispatchPlanResponse = await res.json();
      setDispatchPlan(plan);
      await fetchLiveData();
    } catch (e: any) {
      alert(`✗ Dispatch solver error: ${e.message}`);
    }
  };

  const handleRecalculateWeights = async (weights: Record<string, number>) => {
    try {
      await fetch(`${API_BASE}/priority/recalculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          w1: weights.w1,
          w2: weights.w2,
          w3: weights.w3,
          w4: weights.w4,
          w5: weights.w5,
        }),
      });

      const res = await fetch(`${API_BASE}/dispatch/plan/what-if`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight_adjustments: weights,
        }),
      });

      if (!res.ok) throw new Error(`What-If solver error: HTTP ${res.status}`);
      const plan: DispatchPlanResponse = await res.json();
      setDispatchPlan(plan);
      await fetchLiveData();
      alert("✓ Incident priorities & dispatch plan dynamically recomputed with custom operator weights.");
    } catch (e: any) {
      alert(`✗ What-If calculation error: ${e.message}`);
    }
  };


  const handleVerifyAuditChain = async () => {
    try {
      const res = await fetch(`${API_BASE}/audit/verify`);
      if (!res.ok) throw new Error(`Audit verification error: HTTP ${res.status}`);
      const data = await res.json();
      const statusText = data.chain_valid ? "VALID & UNTAMPERED ✓" : "TAMPERING DETECTED ✗";
      alert(`CRYPTOGRAPHIC AUDIT CHAIN VERIFICATION:\n• Status: ${statusText}\n• Verified Blocks: ${data.verified_blocks}\n• Algorithm: SHA-256 with Canonical JSON Serialization`);
      await fetchLiveData();
    } catch (e: any) {
      alert(`✗ Error verifying audit chain: ${e.message}`);
    }
  };

  const handleTaskDrone = async (incidentId: string, lat: number, lng: number, reason: string) => {
    try {
      const res = await fetch(`${API_BASE}/cv/task-drone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: incidentId,
          target_lat: lat,
          target_lng: lng,
          reason: reason,
        }),
      });

      if (!res.ok) throw new Error(`Drone tasking failed: HTTP ${res.status}`);
      const task = await res.json();
      await fetchLiveData();
      alert(`🚁 Aerial Recon Drone Task Dispatched:\n• Task ID: ${task.task_id}\n• Target: (${task.target_coordinates.lat}, ${task.target_coordinates.lng})\n• Status: ${task.status}`);
    } catch (e: any) {
      alert(`✗ Error tasking drone: ${e.message}`);
    }
  };

  const handleVerifyCV = async (incidentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/cv/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: incidentId,
          sensor_type: "SENTINEL-2_OPTICAL",
          water_index_ndwi: 0.74,
          cloud_cover_pct: 8.5,
        }),
      });

      if (!res.ok) throw new Error(`Satellite/SAR verification failed: HTTP ${res.status}`);
      const updatedInc: Incident = await res.json();
      await fetchLiveData();
      alert(`🛰 Multi-Spectral Satellite Evidence Fused:\n• Incident: ${updatedInc.incident_id}\n• Updated Confidence (C_i): ${updatedInc.confidence_score.toFixed(2)}\n• Recalculated Priority (P_i): ${updatedInc.priority_score.toFixed(2)}`);
    } catch (e: any) {
      alert(`✗ Error running CV verification: ${e.message}`);
    }
  };

  const handleSplitIncident = async (incidentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/clustering/split/${incidentId}`, {
        method: "POST",
      });

      if (!res.ok) throw new Error(`Cluster split failed: HTTP ${res.status}`);
      const splitIncidents: Incident[] = await res.json();
      await fetchLiveData();
      alert(`✂ Incident Cluster ${incidentId} split into ${splitIncidents.length} constituent single-report incidents without evidence loss.`);
    } catch (e: any) {
      alert(`✗ Error splitting cluster: ${e.message}`);
    }
  };

  const handleAdvanceSimTick = async () => {
    try {
      const res = await fetch(`${API_BASE}/simulation/tick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta_minutes: 15 }),
      });

      if (!res.ok) throw new Error(`Simulation tick failed: HTTP ${res.status}`);
      const tick = await res.json();
      await fetchLiveData();
      setReplayMinutesAgo((prev) => Math.max(0, prev - 15));
      alert(`⏱ Simulation Advanced: T+${tick.sim_time_minutes} min (Tick #${tick.tick_index})\n• Synthetic Reports Generated: ${tick.reports_generated}\n• Active Venue Threats: ${tick.venue_threats.length}`);
    } catch (e: any) {
      alert(`✗ Error advancing simulation: ${e.message}`);
    }
  };

  const handleResetSim = async () => {
    try {
      const res = await fetch(`${API_BASE}/simulation/reset`, { method: "POST" });
      if (!res.ok) throw new Error(`Simulation reset failed: HTTP ${res.status}`);
      await fetchLiveData();
      setReplayMinutesAgo(0);
      setIsLive(true);
      alert(`⟲ Disaster Simulation Reset to T = 0 initial baseline.`);
    } catch (e: any) {
      alert(`✗ Error resetting simulation: ${e.message}`);
    }
  };

  const selectedIncident = incidents.find((i) => i.incident_id === selectedIncidentId) || (incidents.length > 0 ? incidents[0] : null);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw" }}>
      {/* Top Header Strip */}
      <Header
        telemetry={telemetry}
        isLive={isLive}
        onToggleLive={() => {
          setIsLive(!isLive);
          if (!isLive) setReplayMinutesAgo(0);
        }}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* Main 3-Column Tactical Command Grid */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Column: Triage & Incident Feed */}
        <IncidentFeed
          incidents={incidents}
          selectedIncidentId={selectedIncident?.incident_id || null}
          onSelectIncident={setSelectedIncidentId}
        />

        {/* Center Column: Tactical Geospatial Map */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
          <TacticalMap
            incidents={incidents}
            resources={resources}
            selectedIncidentId={selectedIncident?.incident_id || null}
            onSelectIncident={setSelectedIncidentId}
          />

          {/* Bottom Timeline Replay Slider */}
          <TimeReplaySlider
            replayMinutesAgo={replayMinutesAgo}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onSeek={(mins) => {
              setReplayMinutesAgo(mins);
              setIsLive(mins === 0);
            }}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onChangeSpeed={setPlaybackSpeed}
            onResetToLive={() => {
              setReplayMinutesAgo(0);
              setIsLive(true);
              setIsPlaying(false);
            }}
            onAdvanceSimTick={handleAdvanceSimTick}
            onResetSim={handleResetSim}
          />
        </div>

        {/* Right Column: Multi-Tab Operational Console */}
        <OperationalConsole
          selectedIncident={selectedIncident}
          dispatchPlan={dispatchPlan}
          resources={resources}
          auditRecords={auditRecords}
          onApprovePlan={handleApprovePlan}
          onOverridePlan={handleOverridePlan}
          onRecalculateWeights={handleRecalculateWeights}
          onVerifyAuditChain={handleVerifyAuditChain}
          onGeneratePlan={handleGeneratePlan}
          onTaskDrone={handleTaskDrone}
          onVerifyCV={handleVerifyCV}
          onSplitIncident={handleSplitIncident}
        />
      </div>

      {/* Interactive EOC Copilot Modal */}
      <CopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        selectedIncidentId={selectedIncident?.incident_id || null}
        onSelectIncident={(id) => {
          setSelectedIncidentId(id);
          setIsCopilotOpen(false);
        }}
      />
    </div>
  );
};

export default App;
