export type LocationPrecision = "HIGH" | "MEDIUM" | "LOW";

export type IncidentStatus = "REPORTED" | "TRIAGED" | "DISPATCHED" | "ON_SCENE" | "RESOLVED" | "CLOSED";

export type HazardType = 
  | "FLOOD" 
  | "BUILDING_COLLAPSE" 
  | "ROAD_WASHOUT" 
  | "BRIDGE_FAILURE" 
  | "ELECTRICAL_FAULT" 
  | "MEDICAL_EMERGENCY" 
  | "LANDSLIDE" 
  | "OTHER";

export type MicroEnvironmentTag = 
  | "ROOFTOP_STRANDED" 
  | "DROWNING_RISK" 
  | "DEBRIS_TRAPPED" 
  | "CRUSH_INJURY" 
  | "CUT_OFF_ACCESS" 
  | "ELECTRICAL_HAZARD" 
  | "NONE";

export type VulnerabilityTag = "CHILDREN" | "ELDERLY" | "PREGNANT" | "DISABLED" | "INJURED";

export type MergeReviewState = "AUTO_MERGED" | "NEEDS_REVIEW" | "SEPARATE";

export type PlanQuality = "PLAN QUALITY: OPTIMAL" | "PLAN QUALITY: FEASIBLE" | "PLAN QUALITY: HEURISTIC (FALLBACK)";

export type ResourceType = "BOAT" | "AMBULANCE" | "EXCAVATOR" | "MEDICAL_TEAM" | "HIGH_CLEARANCE_VEHICLE" | "RESCUE_HELICOPTER";

export type ResourceStatus = "AVAILABLE" | "ASSIGNED" | "EN_ROUTE" | "ON_SITE" | "MAINTENANCE";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationInfo {
  lat: number;
  lng: number;
  address?: string;
  ward_id?: string;
  precision: LocationPrecision;
  bounding_box?: [number, number, number, number];
}

export interface VictimEstimate {
  min_victims: number;
  max_victims: number;
  best_guess: number;
  is_exact: boolean;
}

export interface ConfidenceFactors {
  source_corroboration: number;
  geospatial_consistency: number;
  temporal_consistency: number;
  visual_evidence?: number | null;
  contradiction_penalty: number;
  baseline_prior: number;
  score: number;
}

export interface PriorityFactors {
  severity_score: number;
  vulnerability_score: number;
  victim_count_term: number;
  recency_score: number;
  accessibility_risk_score: number;
  base_urgency: number;
  confidence_modifier: number;
  final_priority: number;
}

export interface DisputeRecord {
  contradiction_id: string;
  incident_id: string;
  field_disputed: string;
  claim_a_text: string;
  claim_a_source: string;
  claim_a_time: string;
  claim_b_text: string;
  claim_b_source: string;
  claim_b_time: string;
  materiality: number;
  resolved: boolean;
}

export interface Incident {
  incident_id: string;
  status: IncidentStatus;
  location: LocationInfo;
  location_precision: LocationPrecision;
  zone_id: string;
  venue_id?: string | null;
  created_at: string;
  updated_at: string;
  category: HazardType;
  micro_environment: MicroEnvironmentTag;
  victim_estimate: VictimEstimate;
  vulnerability_tags: VulnerabilityTag[];
  priority_score: number;
  urgency_score: number;
  confidence_score: number;
  confidence_floor: number;
  confidence_factors?: ConfidenceFactors;
  priority_factors?: PriorityFactors;
  dispute_flag: boolean;
  disputes: DisputeRecord[];
  evidence_summary: string[];
  constituent_report_ids: string[];
  merge_review_state?: MergeReviewState;
}

export interface Resource {
  resource_id: string;
  name: string;
  type: ResourceType;
  current_location: LocationInfo;
  availability_status: ResourceStatus;
  travel_speed_kmh: number;
  current_assignment?: string | null;
}

export interface AssignmentDetail {
  incident_id: string;
  resource_id: string;
  estimated_travel_time_min: number;
  served_fraction: number;
  reason: string;
}

export interface DispatchPlanResponse {
  plan_id: string;
  plan_quality: PlanQuality;
  solver_duration_seconds: number;
  solver_status: string;
  objective_value: number;
  assignments: AssignmentDetail[];
  unserved_incidents: string[];
  created_at: string;
}

export interface AuditRecord {
  record_id: string;
  timestamp: string;
  action_type: string;
  actor_id: string;
  actor_role: string;
  target_entity_type: string;
  target_entity_id: string;
  previous_state: Record<string, any>;
  new_state: Record<string, any>;
  operator_rationale?: string | null;
  prev_hash: string;
  record_hash: string;
}

export interface SystemTelemetry {
  queue_depth: number;
  active_incidents: number;
  disputed_incidents: number;
  dark_zones: number;
  solver_status: string;
  ingestion_to_map_latency_sec: number;
  timestamp: string;
}

export type NotificationChannel = "SMS" | "VOICE_IVR" | "CELL_BROADCAST" | "RADIO" | "WEB_PUSH";
export type AdvisoryType = "FLOOD_RISING" | "BOAT_INBOUND" | "EVACUATION_ORDER" | "WATER_CONTAMINATION" | "SHELTER_AVAILABLE" | "GENERAL_ALERT";

export interface NotificationRecord {
  notification_id: string;
  incident_id?: string | null;
  advisory_type: AdvisoryType;
  channel: NotificationChannel;
  target_recipient_count: number;
  ward?: string | null;
  target_radius_km?: number | null;
  message_text_en: string;
  message_text_hi: string;
  message_text_hinglish: string;
  status: string;
  sent_at: string;
  delivery_latency_ms: number;
  commander_id: string;
  rationale?: string | null;
}

export interface CopilotAction {
  label: string;
  action_id: string;
  payload?: Record<string, any>;
}

export interface CopilotMessageResponse {
  query_id: string;
  content: string;
  citations: string[];
  caveats: string[];
  proposed_actions: CopilotAction[];
  certainty_score: number;
  timestamp: string;
}

export interface SitrepResponse {
  sitrep_id: string;
  generated_at: string;
  reporting_officer: string;
  district_name: string;
  total_active_incidents: number;
  disputed_incidents_count: number;
  casualty_bounds: {
    min: number;
    max: number;
    best_guess: number;
  };
  dark_zones_count: number;
  critical_venues_at_risk: any[];
  fleet_status: {
    total_resources: number;
    assigned_resources: number;
    available_resources: number;
    fleet_utilization_pct: number;
  };
}


