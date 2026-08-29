import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
from ..models.domain import AuditRecord
from ..models.enums import AuditActionType
from .hasher import AuditHasher

class AuditManager:
    """
    Append-only immutable audit log with cryptographic SHA-256 hash chaining.
    Every operational decision and state transition is immutably recorded.
    """
    def __init__(self):
        self._chain: List[AuditRecord] = []
        self._last_hash: str = AuditHasher.GENESIS_HASH

    def record_event(
        self,
        operator_id: str,
        action_type: AuditActionType,
        entity_type: str,
        entity_id: str,
        previous_state: Optional[Dict[str, Any]] = None,
        new_state: Optional[Dict[str, Any]] = None,
        operator_rationale: Optional[str] = None
    ) -> AuditRecord:
        """
        Appends a new tamper-evident audit record to the cryptographic hash chain.
        """
        record_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"
        ts = datetime.now(timezone.utc)
        prev_h = self._last_hash

        record_data = {
            "record_id": record_id,
            "timestamp": ts.isoformat(),
            "operator_id": operator_id,
            "action_type": action_type.value,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "previous_state": previous_state or {},
            "new_state": new_state or {},
            "operator_rationale": operator_rationale or ""
        }

        current_h = AuditHasher.hash_record(record_data, prev_h)

        record = AuditRecord(
            record_id=record_id,
            timestamp=ts,
            action_type=action_type,
            actor_id=operator_id,
            actor_role="OPERATOR",
            target_entity_type=entity_type,
            target_entity_id=entity_id,
            previous_state=previous_state or {},
            new_state=new_state or {},
            operator_rationale=operator_rationale,
            prev_hash=prev_h,
            record_hash=current_h
        )


        self._chain.append(record)
        self._last_hash = current_h
        return record

    def get_records(
        self,
        entity_id: Optional[str] = None,
        operator_id: Optional[str] = None,
        action_type: Optional[AuditActionType] = None
    ) -> List[AuditRecord]:
        """Queries audit records with optional filters."""
        results = self._chain
        if entity_id:
            results = [r for r in results if r.entity_id == entity_id]
        if operator_id:
            results = [r for r in results if r.operator_id == operator_id]
        if action_type:
            results = [r for r in results if r.action_type == action_type]
        return results

    def get_chain(self) -> List[AuditRecord]:
        return self._chain

    def verify_integrity(self) -> Tuple[bool, int, Optional[str]]:

        """
        Cryptographically validates the entire audit hash chain from genesis to head.
        Returns (is_valid, verified_blocks_count, error_message_if_tampered).
        """
        if not self._chain:
            return True, 0, None

        expected_prev_hash = AuditHasher.GENESIS_HASH

        for i, rec in enumerate(self._chain):
            # 1. Verify previous hash pointer matches previous block's current hash
            if rec.prev_hash != expected_prev_hash:
                return False, i, f"Hash pointer broken at block index {i} ({rec.record_id}): expected prev_hash {expected_prev_hash}, got {rec.prev_hash}"

            # 2. Re-compute current hash from record payload
            record_data = {
                "record_id": rec.record_id,
                "timestamp": rec.timestamp.isoformat(),
                "operator_id": rec.operator_id,
                "action_type": rec.action_type.value,
                "entity_type": rec.entity_type,
                "entity_id": rec.entity_id,
                "previous_state": rec.previous_state,
                "new_state": rec.new_state,
                "operator_rationale": rec.operator_rationale or ""
            }
            computed_hash = AuditHasher.hash_record(record_data, rec.prev_hash)

            if computed_hash != rec.current_hash:
                return False, i, f"Payload tampering detected at block index {i} ({rec.record_id}): computed {computed_hash}, got {rec.current_hash}"

            expected_prev_hash = rec.current_hash

        return True, len(self._chain), None

audit_manager = AuditManager()
AuditLogManager = AuditManager

