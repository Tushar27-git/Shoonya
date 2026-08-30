import pytest
from app.simulation.generator import SimulationGenerator

def test_simulation_determinism():
    # Generate two scenarios with the exact same seed (42)
    gen1 = SimulationGenerator(seed=42)
    scenario1 = gen1.generate_scenario()
    
    gen2 = SimulationGenerator(seed=42)
    scenario2 = gen2.generate_scenario()
    
    # Assert they produce the exact same length
    assert len(scenario1) == len(scenario2)
    
    # Assert they produce >100 reports
    assert len(scenario1) > 100
    
    # Assert deep equality (deterministic reproducibility)
    for ev1, ev2 in zip(scenario1, scenario2):
        assert ev1["time_offset_minutes"] == ev2["time_offset_minutes"]
        assert ev1["report"]["text"] == ev2["report"]["text"]

def test_expected_checkpoints():
    gen = SimulationGenerator(seed=42)
    scenario = gen.generate_scenario()
    
    checkpoints = [ev["checkpoint"] for ev in scenario if ev["checkpoint"] is not None]
    
    assert "T+02:00 Initial Flooding Cluster" in checkpoints
    assert "T+06:00 Infrastructure Contradiction" in checkpoints
    assert "T+08:00 Emerging Risk Zone (Weak Signals)" in checkpoints
    assert "T+10:00 Shelter Utility Failure" in checkpoints
    assert "T+14:00 Silence Risk Triggers (Dark Zone in WARD-09)" in checkpoints
