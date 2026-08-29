import hashlib
import json
from typing import Dict, Any

class AuditHasher:
    """
    Computes cryptographic SHA-256 hashes for immutable audit chain blocks.
    Uses canonical JSON serialization with sorted keys.
    """
    GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

    @staticmethod
    def hash_record(data: Dict[str, Any], prev_hash: str) -> str:
        # Exclude existing hash fields if present
        payload = {k: v for k, v in data.items() if k not in ["current_hash", "prev_hash"]}
        payload["prev_hash"] = prev_hash

        canonical_json = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()

CanonicalHasher = AuditHasher

