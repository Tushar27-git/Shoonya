import uuid
import time
import math
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from ..models.domain import (
    Coordinates,
    Incident,
    NotificationRecord,
    NotificationRecipient,
    ReverseSOSRequest,
    BroadcastRequest,
    NotificationSummaryResponse,
    utc_now
)
from ..models.enums import (
    NotificationChannel,
    NotificationStatus,
    AdvisoryType,
    AuditActionType
)
from ..audit.manager import audit_manager
from ..clustering.engine import cluster_engine
from .templates import AdvisoryTemplateEngine

class NotificationEngine:
    """
    Reverse SOS & Notification Engine for SHOONYA:
    1. Direct Reverse SOS to caller/citizen contacts in an incident cluster.
    2. Geofenced cell/SMS/radio broadcasts to ward populations.
    3. Multi-lingual micro-guidance rendering (EN, HI, HINGLISH).
    4. Immutable audit logging of all outbound civilian advisories.
    """
    def __init__(self):
        self._history: List[NotificationRecord] = []
        self._mock_contacts_db: List[NotificationRecipient] = [
            NotificationRecipient(recipient_id="REC-001", contact_handle="+91-9876543210", channel=NotificationChannel.SMS, ward="WARD-12", language_preference="HI"),
            NotificationRecipient(recipient_id="REC-002", contact_handle="+91-9876543211", channel=NotificationChannel.VOICE_IVR, ward="WARD-12", language_preference="HINGLISH"),
            NotificationRecipient(recipient_id="REC-003", contact_handle="+91-9876543212", channel=NotificationChannel.SMS, ward="WARD-14", language_preference="EN"),
            NotificationRecipient(recipient_id="REC-004", contact_handle="BROADCAST-CELL-W12", channel=NotificationChannel.CELL_BROADCAST, ward="WARD-12", language_preference="HI"),
            NotificationRecipient(recipient_id="REC-005", contact_handle="RADIO-CH-04", channel=NotificationChannel.RADIO, ward="WARD-12", language_preference="HI"),
        ]

    def send_reverse_sos(self, req: ReverseSOSRequest) -> List[NotificationRecord]:
        """
        Sends targeted Reverse SOS updates to all contacts and citizens tied to an incident cluster.
        """
        incidents = cluster_engine.get_all_incidents()
        target_inc = next((i for i in incidents if i.incident_id == req.incident_id), None)
        
        location_str = target_inc.location.raw_text if target_inc and target_inc.location and target_inc.location.raw_text else f"Incident {req.incident_id}"
        rendered_texts = AdvisoryTemplateEngine.render_advisory(
            advisory_type=req.advisory_type,
            location_str=location_str,
            resource_id=req.resource_id or "RESCUE-01",
            eta_min=req.eta_min or 15,
            custom_en=req.custom_guidance,
            custom_hi=req.custom_guidance,
            custom_hinglish=req.custom_guidance
        )

        sent_records: List[NotificationRecord] = []
        
        # Determine target recipient count (constituent report ids count or minimum 1)
        recipient_count = len(target_inc.constituent_report_ids) if target_inc and target_inc.constituent_report_ids else 3

        
        for channel in req.channels:
            record_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
            record = NotificationRecord(
                notification_id=record_id,
                incident_id=req.incident_id,
                advisory_type=req.advisory_type,
                channel=channel,
                target_recipient_count=recipient_count,
                ward=target_inc.location.ward if target_inc and target_inc.location else "WARD-12",
                target_radius_km=req.target_radius_km,
                message_text_en=rendered_texts["EN"],
                message_text_hi=rendered_texts["HI"],
                message_text_hinglish=rendered_texts["HINGLISH"],
                status=NotificationStatus.DELIVERED,
                sent_at=utc_now(),
                delivery_latency_ms=115.0 if channel == NotificationChannel.SMS else 240.0,
                commander_id=req.commander_id,
                rationale=req.operator_rationale
            )
            self._history.append(record)
            sent_records.append(record)

            # Immutably record in audit hash chain
            audit_manager.record_event(
                operator_id=req.commander_id,
                action_type=AuditActionType.REVERSE_SOS_SENT,
                entity_type="REVERSE_SOS",
                entity_id=record_id,
                new_state={
                    "incident_id": req.incident_id,
                    "channel": channel.value,
                    "advisory_type": req.advisory_type.value,
                    "target_recipients": recipient_count,
                    "message_en": rendered_texts["EN"]
                },
                operator_rationale=req.operator_rationale
            )

        return sent_records

    def send_geofenced_broadcast(self, req: BroadcastRequest) -> List[NotificationRecord]:
        """
        Pushes a regional emergency broadcast across specified geofence / ward and channels.
        """
        location_str = req.ward or f"Radius {req.radius_km}km of coordinates"
        rendered_texts = AdvisoryTemplateEngine.render_advisory(
            advisory_type=req.advisory_type,
            location_str=location_str,
            custom_en=req.custom_text_en,
            custom_hi=req.custom_text_hi,
            custom_hinglish=req.custom_text_hinglish
        )

        # Estimate affected ward population
        estimated_pop = int(math.pi * (req.radius_km ** 2) * 1200) # ~1200 people/km2 density
        
        sent_records: List[NotificationRecord] = []
        for channel in req.channels:
            record_id = f"BCAST-{uuid.uuid4().hex[:8].upper()}"
            record = NotificationRecord(
                notification_id=record_id,
                incident_id=None,
                advisory_type=req.advisory_type,
                channel=channel,
                target_recipient_count=estimated_pop,
                ward=req.ward,
                target_radius_km=req.radius_km,
                message_text_en=rendered_texts["EN"],
                message_text_hi=rendered_texts["HI"],
                message_text_hinglish=rendered_texts["HINGLISH"],
                status=NotificationStatus.DELIVERED,
                sent_at=utc_now(),
                delivery_latency_ms=85.0 if channel == NotificationChannel.CELL_BROADCAST else 150.0,
                commander_id=req.commander_id,
                rationale=req.operator_rationale
            )
            self._history.append(record)
            sent_records.append(record)

            # Immutably record in audit hash chain
            audit_manager.record_event(
                operator_id=req.commander_id,
                action_type=AuditActionType.REVERSE_SOS_SENT,
                entity_type="GEOFENCED_BROADCAST",
                entity_id=record_id,
                new_state={
                    "ward": req.ward,
                    "radius_km": req.radius_km,
                    "channel": channel.value,
                    "advisory_type": req.advisory_type.value,
                    "target_recipients": estimated_pop
                },
                operator_rationale=req.operator_rationale
            )

        return sent_records

    def get_summary(self) -> NotificationSummaryResponse:
        """Calculates aggregate delivery statistics and returns recent broadcast logs."""
        total_recipients = sum(r.target_recipient_count for r in self._history)
        channels_breakdown: Dict[str, int] = {}
        for r in self._history:
            ch_str = r.channel.value
            channels_breakdown[ch_str] = channels_breakdown.get(ch_str, 0) + 1

        return NotificationSummaryResponse(
            total_broadcasts_sent=len(self._history),
            total_recipients_reached=total_recipients,
            active_advisories_count=len([r for r in self._history if r.status in [NotificationStatus.SENT, NotificationStatus.DELIVERED]]),
            channels_breakdown=channels_breakdown,
            recent_broadcasts=list(reversed(self._history[-25:]))
        )

    def get_history(self, limit: int = 50) -> List[NotificationRecord]:
        return list(reversed(self._history[-limit:]))

notification_engine = NotificationEngine()
