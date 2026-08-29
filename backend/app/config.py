from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "SHOONYA (शून्य)"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    
    # Database & Redis Settings
    DATABASE_URL: str = "sqlite+aiosqlite:///./shoonya.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Priority Formula Weights (Load-bearing: Base Urgency U_i)
    WEIGHT_SEVERITY: float = Field(default=0.35, description="w1: Severity weight")
    WEIGHT_VULNERABILITY: float = Field(default=0.25, description="w2: Vulnerability weight")
    WEIGHT_VICTIM_COUNT: float = Field(default=0.20, description="w3: Victim count log-term weight")
    WEIGHT_RECENCY: float = Field(default=0.10, description="w4: Recency weight")
    WEIGHT_ACCESSIBILITY: float = Field(default=0.10, description="w5: Accessibility risk weight")
    
    # Confidence Modifier Settings (Load-bearing: Invariant M(0)=0.4)
    CONFIDENCE_MIN_FLOOR: float = Field(default=0.4, description="c_min floor ensuring low-conf incidents remain visible")
    
    # Bounded Confidence Formula Weights (Load-bearing: C_i)
    CONF_BASELINE_PRIOR: float = Field(default=0.20, description="b: Baseline prior")
    CONF_WEIGHT_SOURCE: float = Field(default=0.30, description="w_s: Cross-channel source corroboration weight")
    CONF_WEIGHT_GEO: float = Field(default=0.20, description="w_g: Geospatial consistency weight")
    CONF_WEIGHT_TEMPORAL: float = Field(default=0.15, description="w_t: Temporal consistency/recency weight")
    CONF_WEIGHT_VISUAL: float = Field(default=0.25, description="w_v: Visual/sensor evidence weight")
    CONF_WEIGHT_CONTRADICTION: float = Field(default=0.35, description="w_c: Contradiction penalty weight")
    
    # Merge Confidence Thresholds (Load-bearing: L3 clustering)
    MERGE_THRESHOLD_AUTO: float = Field(default=0.85, description="Auto-merge confidence threshold")
    MERGE_THRESHOLD_REVIEW: float = Field(default=0.55, description="Provisional merge threshold (needs_review)")
    
    # Solver Budget & Constraints (Load-bearing: L6 Optimization)
    SOLVER_TIMEOUT_SECONDS: float = Field(default=4.0, description="Solver hard budget (3-5s range)")
    MAX_TRAVEL_TIME_MINUTES: float = Field(default=60.0, description="Maximum feasible travel time cutoff T_max")
    
    # Dark Zone Settings
    DARK_ZONE_SILENCE_MINUTES: float = Field(default=45.0, description="No-report window triggering DARK status")
    
    # Security & Audit
    HASH_CHAIN_GENESIS: str = "0000000000000000000000000000000000000000000000000000000000000000"

    model_config = SettingsConfigDict(env_prefix="SHOONYA_", case_sensitive=True)

settings = Settings()

