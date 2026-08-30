import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from ..models.domain import CopilotMessageResponse, ProposedAction, Incident
from ..models.enums import ProposedActionType
from ..clustering.engine import clustering_engine
from ..simulation.venues import venue_manager
from ..ingestion.processor import zone_tracker
from ..dispatch.router import active_resources

def format_enum_val(val: Any) -> str:
    """Formats enum or string nicely for clean UI output without class prefixes."""
    if val is None:
        return "NONE"
    s = str(val)
    if "." in s:
        s = s.split(".")[-1]
    return s.replace("_", " ").title()

def is_hindi_query(query: str) -> bool:
    """Detects if query is in Hindi (Devanagari script) or common Hinglish phonetics."""
    if any("\u0900" <= c <= "\u097f" for c in query):
        return True
    hinglish_keywords = ["kya", "kaun", "kitne", "kitni", "kahan", "bachao", "madad", "rahat", "karo", "karein", "hai", "hain", "stithi", "asptal", "aspatal", "paani", "pani", "chhat", "fashe", "fase"]
    q_words = set(re.findall(r"\b\w+\b", query.lower()))
    return len(q_words.intersection(hinglish_keywords)) > 0

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
        is_hindi = is_hindi_query(query)

        incidents = clustering_engine.list_incidents()
        venues = venue_manager.list_venues()
        dark_zones = zone_tracker.get_dark_zones()
        resources = list(active_resources)

        citations: List[str] = []
        caveats: List[str] = []
        proposed_actions: List[ProposedAction] = []
        content_lines: List[str] = []

        # ---------------------------------------------------------------------
        # 1. Query regarding Specific Incident (ID, Ward, Landmark or Context)
        # ---------------------------------------------------------------------
        target_inc: Optional[Incident] = None
        if incident_context_id:
            target_inc = clustering_engine.get_incident(incident_context_id)
        elif "inc-" in q_lower:
            match = re.search(r"inc-[a-z0-9\-]+", q_lower)
            if match:
                target_inc = clustering_engine.get_incident(match.group(0).upper())

        # Check landmarks if not matched by ID
        if not target_inc:
            for inc in incidents:
                addr = (inc.location.address or "").lower()
                zone = inc.zone_id.lower()
                cat = format_enum_val(inc.category).lower()
                micro = format_enum_val(inc.micro_environment).lower()

                if "school" in q_lower and ("school" in addr or "w07" in inc.incident_id.lower() or "07" in zone):
                    target_inc = inc
                    break
                elif "market" in q_lower and ("market" in addr or "w04" in inc.incident_id.lower() or "04" in zone):
                    target_inc = inc
                    break
                elif "bridge" in q_lower and ("bridge" in addr or "w12" in inc.incident_id.lower() or "12" in zone):
                    target_inc = inc
                    break
                elif "ward 7" in q_lower or "ward 07" in q_lower:
                    if "07" in zone:
                        target_inc = inc
                        break
                elif "ward 4" in q_lower or "ward 04" in q_lower:
                    if "04" in zone:
                        target_inc = inc
                        break
                elif "ward 12" in q_lower:
                    if "12" in zone:
                        target_inc = inc
                        break

        if target_inc:
            citations.append(target_inc.incident_id)
            cat_display = format_enum_val(target_inc.category)
            micro_display = format_enum_val(target_inc.micro_environment)
            vic_min = target_inc.victim_estimate.min_victims
            vic_max = target_inc.victim_estimate.max_victims
            vic_guess = target_inc.victim_estimate.best_guess

            if is_hindi:
                content_lines.append(f"सामरिक स्थिति विवरण // घटना [{target_inc.incident_id}]")
                content_lines.append(f"• आपदा प्रकार: {cat_display} (सूक्ष्म-स्थिति: {micro_display})")
                content_lines.append(f"• स्थान: {target_inc.location.address or target_inc.zone_id} (वार्ड {target_inc.zone_id})")
                content_lines.append(f"• फंसे पीड़ितों का अनुमान: [{vic_min}..{vic_max}] व्यक्ति (संभावित: {vic_guess})")
                content_lines.append(f"• प्राथमिकता स्कोर: {target_inc.priority_score:.2f} | विश्वसनीयता: {target_inc.confidence_score:.2f}")
                if target_inc.vulnerability_tags:
                    vuln_str = ", ".join(format_enum_val(v) for v in target_inc.vulnerability_tags)
                    content_lines.append(f"• विशेष जोखिम समूह: {vuln_str}")
            else:
                content_lines.append(f"TACTICAL DOSSIER // INCIDENT [{target_inc.incident_id}]")
                content_lines.append(f"• Hazard: {cat_display} (Micro-Tag: {micro_display})")
                content_lines.append(f"• Sector: Ward {target_inc.zone_id} | Location: {target_inc.location.address or 'Sector Zone'}")
                content_lines.append(f"• Victim Estimate: [{vic_min}..{vic_max}] individuals (Best Guess: {vic_guess})")
                content_lines.append(f"• Priority Score (P_i): {target_inc.priority_score:.2f} | Confidence (C_i): {target_inc.confidence_score:.2f}")
                if target_inc.vulnerability_tags:
                    vuln_str = ", ".join(format_enum_val(v) for v in target_inc.vulnerability_tags)
                    content_lines.append(f"• Vulnerabilities: {vuln_str}")

            if target_inc.dispute_flag:
                caveat_msg = f"MATERIAL CONTRADICTION: Conflicting reports on [{target_inc.incident_id}]." if not is_hindi else f"महत्वपूर्ण विरोधाभास: [{target_inc.incident_id}] पर रिपोर्टों में मतभेद पाया गया है।"
                caveats.append(caveat_msg)
                for d in target_inc.disputes:
                    content_lines.append(f"  ⚠ DISPUTE ({d.field_disputed}): \"{d.claim_a_text}\" VS \"{d.claim_b_text}\"")
                    citations.append(d.contradiction_id)

            if target_inc.confidence_score < 0.60:
                low_conf_msg = f"LOW CONFIDENCE ({target_inc.confidence_score:.2f}): Unverified reports require aerial reconnaissance." if not is_hindi else f"कम विश्वसनीयता ({target_inc.confidence_score:.2f}): ड्रोन पुष्टि आवश्यक है।"
                caveats.append(low_conf_msg)
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
                    description=f"Deploy priority rescue unit to [{target_inc.incident_id}] in Ward {target_inc.zone_id}.",
                    parameters={"incident_id": target_inc.incident_id, "priority": target_inc.priority_score}
                )
            )

        # ---------------------------------------------------------------------
        # 2. Query regarding Fleet / Boats / Resources / Vehicles
        # ---------------------------------------------------------------------
        elif any(k in q_lower for k in ["boat", "ambulance", "excavator", "fleet", "resource", "vehicle", "available", "dispatch", "nau", "gadi", "sadhan", "sena"]):
            if is_hindi:
                content_lines.append("आपातकालीन राहत बेड़ा // संसाधन स्थिति विवरण")
                content_lines.append(f"कुल पंजीकृत राहत इकाइयाँ: {len(resources)}")
                for r in resources:
                    r_type = format_enum_val(r.type)
                    citations.append(r.resource_id)
                    content_lines.append(f"• [{r.resource_id}] {r.name or r_type}: स्थिति = {r.availability_status} | गति = {r.travel_speed_kmh} km/h")
                content_lines.append("\nसलाह: प्राथमिकता के अनुसार नाव और एम्बुलेंस को MILP CP-SAT सॉल्वर के माध्यम से डिस्पैच करें।")
            else:
                content_lines.append("EMERGENCY FLEET & RESOURCE STATUS // DISTRICT INVENTORY")
                content_lines.append(f"Total Registered Fleet Units: {len(resources)}")
                for r in resources:
                    r_type = format_enum_val(r.type)
                    citations.append(r.resource_id)
                    content_lines.append(f"• [{r.resource_id}] {r.name or r_type} ({r_type}): Status = {r.availability_status} | Max Speed = {r.travel_speed_kmh} km/h")
                content_lines.append("\nRecommendation: Trigger MILP CP-SAT solver for optimal multi-vehicle routing.")

            proposed_actions.append(
                ProposedAction(
                    action_type=ProposedActionType.DISPATCH_RESOURCE,
                    target_id="FLEET_OPTIMIZER",
                    description="Run MILP CP-SAT dispatch solver to optimize rescue assignments.",
                    parameters={"budget_seconds": 3.5}
                )
            )

        # ---------------------------------------------------------------------
        # 3. Query regarding Casualties, Victims & Vulnerability Statistics
        # ---------------------------------------------------------------------
        elif any(k in q_lower for k in ["victim", "casualty", "casualties", "injured", "children", "elderly", "trapped", "stranded", "people", "log", "bachhe", "fase", "fashe"]):
            total_min = sum(i.victim_estimate.min_victims for i in incidents)
            total_max = sum(i.victim_estimate.max_victims for i in incidents)
            total_guess = sum(i.victim_estimate.best_guess for i in incidents)
            children_count = sum(i.victim_estimate.best_guess for i in incidents if any("CHILD" in str(v).upper() for v in i.vulnerability_tags))
            injured_count = sum(i.victim_estimate.best_guess for i in incidents if any("INJUR" in str(v).upper() for v in i.vulnerability_tags))
            elderly_count = sum(i.victim_estimate.best_guess for i in incidents if any("ELDER" in str(v).upper() for v in i.vulnerability_tags))

            if is_hindi:
                content_lines.append("आपदा पीड़ित एवं हताहत विश्लेषण रिपोर्ट")
                content_lines.append(f"• कुल अनुमानित पीड़ित: [{total_min} .. {total_max}] व्यक्ति (संभावित औसत: {total_guess})")
                content_lines.append(f"• फंसे बच्चे: ~{children_count} (वार्ड 07 स्कूल मुख्य केंद्र)")
                content_lines.append(f"• मलबे में घायल: ~{injured_count} (वार्ड 04 मार्केट संकुल)")
                content_lines.append(f"• बुजुर्ग/असमर्थ व्यक्ति: ~{elderly_count} (वार्ड 12 कलिना पुल संपर्क मार्ग)")
                content_lines.append("\nसक्रिय घटनावार सूची:")
                for inc in incidents:
                    citations.append(inc.incident_id)
                    content_lines.append(f"  - [{inc.incident_id}] {inc.location.address or inc.zone_id}: {inc.victim_estimate.best_guess} व्यक्ति ({format_enum_val(inc.micro_environment)})")
            else:
                content_lines.append("CASUALTY & VICTIM POPULATION ASSESSMENT")
                content_lines.append(f"• Total Estimated Stranded/Casualties: [{total_min} .. {total_max}] (Best Guess: {total_guess})")
                content_lines.append(f"• High Vulnerability Breakdown: ~{children_count} Children, ~{injured_count} Injured, ~{elderly_count} Elderly")
                content_lines.append("\nActive Incident Breakdown:")
                for inc in incidents:
                    citations.append(inc.incident_id)
                    vic_b = inc.victim_estimate
                    content_lines.append(f"  - [{inc.incident_id}] {inc.location.address or inc.zone_id}: [{vic_b.min_victims}..{vic_b.max_victims}] ({format_enum_val(inc.micro_environment)})")

            if total_guess > 0:
                proposed_actions.append(
                    ProposedAction(
                        action_type=ProposedActionType.DISPATCH_RESOURCE,
                        target_id="MASS_RESCUE",
                        description="Authorize immediate multi-unit rescue dispatch for high-density victim clusters.",
                        parameters={"best_guess_total": total_guess}
                    )
                )

        # ---------------------------------------------------------------------
        # 4. Query regarding Dark Zones / Telecom Blackouts
        # ---------------------------------------------------------------------
        elif any(k in q_lower for k in ["dark zone", "silent", "unmonitored", "blackout", "telecom", "offline", "tower", "ward 9", "ward 09", "connectivity"]):
            if is_hindi:
                content_lines.append("दूरसंचार डार्क जोन // मौन क्षेत्र निगरानी रिपोर्ट")
                if dark_zones:
                    for dz in dark_zones:
                        z_id = dz.get("zone_id", "WARD-09") if isinstance(dz, dict) else getattr(dz, "zone_id", "WARD-09")
                        z_name = dz.get("zone_name", "मौन क्षेत्र") if isinstance(dz, dict) else getattr(dz, "zone_name", "मौन क्षेत्र")
                        pop = dz.get("population", 8600) if isinstance(dz, dict) else getattr(dz, "estimated_population", 8600)
                        citations.append(z_id)
                        content_lines.append(f"• ज़ोन [{z_id}] ({z_name}): स्थिति = कोई डेटा नहीं (साइलेंट)। अनुमानित आबादी = {pop:,} नागरिक।")
                        caveats.append(f"डार्क जोन [{z_id}] में रिपोर्ट न मिलने का मतलब सुरक्षा नहीं है; बाढ़ की पुष्टि हेतु ड्रोन आवश्यक है।")
                        proposed_actions.append(
                            ProposedAction(
                                action_type=ProposedActionType.REQUEST_INFO,
                                target_id=z_id,
                                description=f"डार्क जोन [{z_id}] में तत्काल थर्मल ड्रोन सर्वेक्षण भेजें।",
                                parameters={"zone_id": z_id, "mode": "SWEEP"}
                            )
                        )
                else:
                    content_lines.append("वर्तमान में सभी सेक्टरों से निरंतर दूरसंचार टेलीमेट्री प्राप्त हो रही है।")
            else:
                content_lines.append("TELECOM DARK ZONE SURVEILLANCE REPORT")
                if dark_zones:
                    for dz in dark_zones:
                        z_id = dz.get("zone_id", "WARD-09") if isinstance(dz, dict) else getattr(dz, "zone_id", "WARD-09")
                        z_name = dz.get("zone_name", "Silent Sector") if isinstance(dz, dict) else getattr(dz, "zone_name", "Silent Sector")
                        pop = dz.get("population", 8600) if isinstance(dz, dict) else getattr(dz, "estimated_population", 8600)
                        citations.append(z_id)
                        content_lines.append(f"• Zone [{z_id}] ({z_name}): SILENT. Population at Risk: {pop:,} residents. Status: NO DATA.")
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

        # ---------------------------------------------------------------------
        # 5. Query regarding Hospital / Shelter Surge
        # ---------------------------------------------------------------------
        elif any(k in q_lower for k in ["hospital", "bed", "icu", "shelter", "camp", "trauma", "doctor", "asptal", "aspatal"]):
            if is_hindi:
                content_lines.append("महत्वपूर्ण बुनियादी ढांचा स्थिति // अस्पताल एवं राहत शिविर")
                for v in venues:
                    citations.append(v.venue_id)
                    surge = venue_manager.evaluate_surge_status(v)
                    pct = round((v.capacity_current / max(1, v.capacity_total)) * 100)
                    content_lines.append(f"• [{v.venue_id}] {v.name}: स्थिति = {surge} ({v.capacity_current}/{v.capacity_total} बेड - {pct}%)")
                    if surge in ["NEAR_CAPACITY", "OVER_CAPACITY"]:
                        caveats.append(f"[{v.name}] अपनी अधिकतम क्षमता ({pct}%) पर पहुंच रहा है।")
            else:
                content_lines.append("CRITICAL INFRASTRUCTURE STATUS // HOSPITALS & RELIEF SHELTERS")
                for v in venues:
                    citations.append(v.venue_id)
                    surge = venue_manager.evaluate_surge_status(v)
                    pct = round((v.capacity_current / max(1, v.capacity_total)) * 100)
                    content_lines.append(f"• [{v.venue_id}] {v.name}: Status = {surge} ({v.capacity_current}/{v.capacity_total} beds - {pct}%) | Power: {v.power_status}")
                    if surge in ["NEAR_CAPACITY", "OVER_CAPACITY"]:
                        caveats.append(f"[{v.name}] is operating near/over nominal capacity ({pct}% full).")
                        proposed_actions.append(
                            ProposedAction(
                                action_type=ProposedActionType.ESCALATE_ALERT,
                                target_id=v.venue_id,
                                description=f"Divert incoming casualties from [{v.name}] to backup medical staging depot.",
                                parameters={"venue_id": v.venue_id, "surge": surge}
                            )
                        )

        # ---------------------------------------------------------------------
        # 6. Query regarding SOPs / Emergency Procedures / Protocols
        # ---------------------------------------------------------------------
        elif any(k in q_lower for k in ["sop", "protocol", "what to do", "procedure", "how to", "steps", "kya karein", "guideline"]):
            if is_hindi:
                content_lines.append("आपदा मानक संचालन प्रक्रियाएं (EOC SOPs)")
                content_lines.append("1. छत पर फंसे लोगों हेतु (Rooftop Flood): इन्फ्लेटेबल बोट dispatch करें, रात में टॉर्च/कपड़ा सिग्नल का निर्देश दें।")
                content_lines.append("2. इमारत ढहने पर (Building Collapse): जेसीबी/हाइड्रोलिक कटर तैनात करें, पास के अस्पताल में ट्रॉमा अलर्ट जारी करें।")
                content_lines.append("3. जल संदूषण (Water Contamination): तुरंत रिवर्स एसओएस के माध्यम से नागरिकों को कच्चा पानी न पीने की चेतावनी भेजें।")
                content_lines.append("4. डार्क ज़ोन (Dark Zones): बिना सिग्नल वाले क्षेत्रों में तुरंत टोही ड्रोन भेजकर जलस्तर मापें।")
            else:
                content_lines.append("EMERGENCY STANDARD OPERATING PROCEDURES (EOC SOP)")
                content_lines.append("1. Rooftop Flood Isolation: Dispatch shallow-draft rescue boat; issue reverse SOS to deploy visual markers.")
                content_lines.append("2. Structural Collapse: Deploy heavy hydraulic excavator + paramedic triage team; alert trauma ICU.")
                content_lines.append("3. Water Contamination: Broadcast immediate Reverse SOS boiling/bottled water advisory over SMS & IVR.")
                content_lines.append("4. Telecom Blackouts: Initiate automated drone surveillance sweep to verify uncorroborated levee breach.")

        # ---------------------------------------------------------------------
        # 7. General Situation Briefing (Fallback)
        # ---------------------------------------------------------------------
        else:
            top_inc = sorted(incidents, key=lambda x: x.priority_score, reverse=True)[:3]
            if is_hindi:
                content_lines.append("सामरिक स्थिति संक्षिप्त विवरण // शीर्ष प्राथमिकता की घटनाएं")
                if top_inc:
                    for inc in top_inc:
                        citations.append(inc.incident_id)
                        cat_str = format_enum_val(inc.category)
                        micro_str = format_enum_val(inc.micro_environment)
                        content_lines.append(
                            f"• [{inc.incident_id}] वार्ड {inc.zone_id} | {cat_str} ({micro_str}) | "
                            f"प्राथमिकता: {inc.priority_score:.2f} | पीड़ित: [{inc.victim_estimate.min_victims}..{inc.victim_estimate.max_victims}]"
                        )
                else:
                    content_lines.append("वर्तमान में कोई सक्रिय आपातकालीन घटना दर्ज नहीं है।")

                if dark_zones:
                    caveats.append(f"{len(dark_zones)} मौन डार्क ज़ोन (वार्ड 09) में निरंतर निगरानी की आवश्यकता है।")
            else:
                content_lines.append("OPERATIONAL SITUATION BRIEFING // TOP PRIORITY INCIDENTS")
                if top_inc:
                    for inc in top_inc:
                        citations.append(inc.incident_id)
                        cat_str = format_enum_val(inc.category)
                        micro_str = format_enum_val(inc.micro_environment)
                        content_lines.append(
                            f"• [{inc.incident_id}] Ward {inc.zone_id} | {cat_str} ({micro_str}) | "
                            f"Priority: {inc.priority_score:.2f} | Confidence: {inc.confidence_score:.2f} | "
                            f"Victims: [{inc.victim_estimate.min_victims}..{inc.victim_estimate.max_victims}]"
                        )
                else:
                    content_lines.append("No active triage incidents currently queued.")

                if dark_zones:
                    caveats.append(f"{len(dark_zones)} telecom dark zone(s) require persistent surveillance.")

        response_text = "\n".join(content_lines)

        return CopilotMessageResponse(
            message_id=f"COPILOT-{uuid.uuid4().hex[:8].upper()}",
            timestamp=now,
            query=query,
            content=response_text,
            citations=list(set(citations)),
            confidence_caveats=caveats,
            proposed_actions=proposed_actions,
            language_detected="HI" if is_hindi else "EN"
        )

copilot_engine = EOCCopilotEngine()
