import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from ..models.domain import CopilotMessageResponse, ProposedAction, Incident
from ..models.enums import ProposedActionType
from ..clustering.engine import clustering_engine
from ..simulation.venues import venue_manager
from ..ingestion.processor import zone_tracker

class EOCCopilotEngine:
    """
    Tactical conversational decision-support copilot for Emergency Operations Centre operators.
    Provides multilingual query handling, grounded tactical assessments with strict entity citations,
    explicit confidence caveats, and executable proposed action payloads.
    """
    @staticmethod
    def process_query(query: str, incident_context_id: Optional[str] = None) -> CopilotMessageResponse:
        q_lower = query.lower()
        now = datetime.now(timezone.utc)

        incidents = clustering_engine.list_incidents()
        venues = venue_manager.list_venues()
        dark_zones = zone_tracker.get_dark_zones()

        citations: List[str] = []
        caveats: List[str] = []
        proposed_actions: List[ProposedAction] = []
        content_lines: List[str] = []

        # 1. Query regarding Specific Incident Context
        target_inc = None
        if incident_context_id:
            target_inc = clustering_engine.get_incident(incident_context_id)
        elif "inc-" in q_lower:
            match = re.search(r"inc-[a-z0-9\-]+", q_lower)
            if match:
                target_inc = clustering_engine.get_incident(match.group(0).upper())

        if target_inc:
            citations.append(target_inc.incident_id)
            content_lines.append(f"TACTICAL DOSSIER // INCIDENT [{target_inc.incident_id}]")
            content_lines.append(f"Hazard: {target_inc.category} (Micro-Tag: {target_inc.micro_environment})")
            content_lines.append(f"Sector: Ward {target_inc.zone_id} | Location Precision: {target_inc.location_precision}")
            content_lines.append(
                f"Victim Estimate: [{target_inc.victim_estimate.min_victims}..{target_inc.victim_estimate.max_victims}] "
                f"(Best Guess: {target_inc.victim_estimate.best_guess})"
            )
            content_lines.append(f"Priority Score: {target_inc.priority_score:.2f} | Confidence: {target_inc.confidence_score:.2f}")

            if target_inc.dispute_flag:
                caveats.append(f"CRITICAL DISPUTE: Material contradiction detected between constituent reports on [{target_inc.incident_id}].")
                for d in target_inc.disputes:
                    content_lines.append(f"  ⚠ DISPUTE ({d.field_disputed}): {d.claim_a_text} VS {d.claim_b_text}")
                    citations.append(d.contradiction_id)

            if target_inc.confidence_score < 0.60:
                caveats.append(f"LOW CONFIDENCE ({target_inc.confidence_score:.2f}): Unverified constituent reports require ground reconnaissance.")
                proposed_actions.append(
                    ProposedAction(
                        action_type=ProposedActionType.REQUEST_INFO,
                        target_id=target_inc.incident_id,
                        description=f"Task autonomous drone reconnaissance to verify [{target_inc.incident_id}] coordinates.",
                        parameters={"lat": target_inc.location.lat, "lng": target_inc.location.lng}
                    )
                )

            # Proposed dispatch action
            proposed_actions.append(
                ProposedAction(
                    action_type=ProposedActionType.DISPATCH_RESOURCE,
                    target_id=target_inc.incident_id,
                    description=f"Deploy priority response unit to [{target_inc.incident_id}] in Ward {target_inc.zone_id}.",
                    parameters={"incident_id": target_inc.incident_id, "priority": target_inc.priority_score}
                )
            )

        # 2. Query regarding Dark Zones / Unmonitored Sectors
        elif "dark zone" in q_lower or "silent" in q_lower or "unmonitored" in q_lower or "blackout" in q_lower or "अज्ञात" in q_lower or "ward 9" in q_lower or "ward 09" in q_lower:
            content_lines.append("SURVEILLANCE REPORT // TELECOM DARK ZONES")
            if dark_zones:
                for dz in dark_zones:
                    z_id = dz.get("zone_id", "WARD-09") if isinstance(dz, dict) else dz.zone_id
                    z_name = dz.get("zone_name", "Silent Sector") if isinstance(dz, dict) else dz.zone_name
                    pop = dz.get("population", 1000) if isinstance(dz, dict) else dz.estimated_population
                    citations.append(z_id)
                    content_lines.append(
                        f"Zone [{z_id}] ({z_name}): SILENT. Estimated Population: {pop:,} residents. "
                        f"Status: NO DATA — UNKNOWN STATUS."
                    )
                    caveats.append(f"Dark zone [{z_id}] represents unmonitored risk; lack of reports does not indicate safety.")
                    proposed_actions.append(
                        ProposedAction(
                            action_type=ProposedActionType.REQUEST_INFO,
                            target_id=z_id,
                            description=f"Task aerial drone reconnaissance sweep across silent sector [{z_id}].",
                            parameters={"zone_id": z_id, "mode": "SWEEP"}
                        )
                    )
            else:
                content_lines.append("All district telecommunication sectors currently report nominal heartbeat telemetry.")


        # 3. Query regarding Hospital / Venue Surge
        elif "hospital" in q_lower or "bed" in q_lower or "icu" in q_lower or "shelter" in q_lower or "अस्पताल" in q_lower or "trauma" in q_lower:
            content_lines.append("CRITICAL INFRASTRUCTURE STATUS // VENUE NETWORK")
            for v in venues:
                citations.append(v.venue_id)
                surge = venue_manager.evaluate_surge_status(v)
                content_lines.append(
                    f"[{v.venue_id}] {v.name}: {surge} ({v.capacity_current}/{v.capacity_total} capacity). "
                    f"Power: {v.power_status}, Supplies: {v.medical_supply_level}."
                )
                if surge in ["NEAR_CAPACITY", "OVER_CAPACITY"]:
                    caveats.append(f"[{v.venue_id}] is operating at {v.capacity_current}/{v.capacity_total} capacity.")
                    proposed_actions.append(
                        ProposedAction(
                            action_type=ProposedActionType.ESCALATE_ALERT,
                            target_id=v.venue_id,
                            description=f"Divert casualty transport from [{v.venue_id}] to backup medical staging depot.",
                            parameters={"venue_id": v.venue_id, "surge": surge}
                        )
                    )

        # 4. General / Hindi / Hinglish Triage Summary Query
        else:
            top_inc = sorted(incidents, key=lambda x: x.priority_score, reverse=True)[:3]
            content_lines.append("OPERATIONAL SITUATION BRIEFING // TOP PRIORITY INCIDENTS")
            if top_inc:
                for inc in top_inc:
                    citations.append(inc.incident_id)
                    content_lines.append(
                        f"• [{inc.incident_id}] Ward {inc.zone_id} | {inc.category} ({inc.micro_environment}) | "
                        f"Priority: {inc.priority_score:.2f} | Conf: {inc.confidence_score:.2f} | "
                        f"Victims: [{inc.victim_estimate.min_victims}..{inc.victim_estimate.max_victims}]"
                    )
            else:
                content_lines.append("No active triage incidents currently queued.")

            if dark_zones:
                caveats.append(f"{len(dark_zones)} telecom dark zones require persistent surveillance.")

        response_text = "\n".join(content_lines)

        return CopilotMessageResponse(
            message_id=f"COPILOT-{uuid.uuid4().hex[:8].upper()}",
            timestamp=now,
            query=query,
            content=response_text,
            citations=list(set(citations)),
            confidence_caveats=caveats,
            proposed_actions=proposed_actions,
            language_detected="HI" if any(ord(c) > 128 for c in query) else "EN"
        )

copilot_engine = EOCCopilotEngine()
