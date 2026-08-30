import json
import pytest
from pydantic import ValidationError
from app.models.domain import (
    IncidentRecord, RawReport, RoadSegment, WeakSignal,
    ShelterUtilityStatus, SMS_CODE_MAP, Location
)
from app.models.enums import (
    IncidentCategory, MicroEnvironment, ReportChannel, ObservationModality,
    RoadStatus, SignalType, WaterStatus
)
from datetime import datetime

def test_incident_record_schema():
    # Valid record
    record = IncidentRecord(
        incident_id="INC_001",
        location=Location(centroid=(28.6139, 77.2090), precision="HIGH", radius=10.0),
        category=IncidentCategory.FLOOD,
        micro_environment=MicroEnvironment.ROOFTOP_STRANDED,
        victim_estimate={"value": 5, "range_low": 3, "range_high": 7},
        priority_score=0.9
    )
    assert record.category == IncidentCategory.FLOOD
    assert record.trust_flag is True

    # Invalid category
    with pytest.raises(ValidationError):
        IncidentRecord(
            incident_id="INC_002",
            location=Location(centroid=(28.6139, 77.2090)),
            category="NOT_A_CATEGORY"
        )

def test_raw_report_immutable_evidence():
    report = RawReport(
        report_id="R_001",
        raw_evidence_text="Water is rising rapidly.",
        channel=ReportChannel.SMS,
        source_id="SRC_01"
    )
    assert report.raw_evidence_text == "Water is rising rapidly."

    with pytest.raises(ValidationError):
        report.raw_evidence_text = "Modified text."

def test_gazetteer_schema(tmp_path):
    import os
    file_path = os.path.join(os.path.dirname(__file__), "..", "app", "data", "gazetteer.json")
    with open(file_path, "r") as f:
        data = json.load(f)
    
    assert len(data) >= 30
    # Validate structure implicitly or explicitly
    first = data[0]
    assert "id" in first
    assert "name" in first
    assert "coordinates" in first
    assert "lat" in first["coordinates"]
    assert "lon" in first["coordinates"]
    assert "road_segments" in first
    assert "shelters" in first

def test_sms_code_map_roundtrip():
    code = "911"
    assert code in SMS_CODE_MAP
    mapping = SMS_CODE_MAP[code]
    
    # Simulate converting mapping into an IncidentRecord skeleton
    record = IncidentRecord(
        incident_id="INC_SMS_001",
        location=Location(centroid=(0.0, 0.0), precision="UNKNOWN"),
        category=mapping["category"],
        micro_environment=mapping["micro_environment"],
        priority_score=mapping["urgency_default"]
    )
    
    assert record.category == IncidentCategory.FLOOD
    assert record.micro_environment == MicroEnvironment.ROOFTOP_STRANDED
    assert record.priority_score == 0.95