# SHOONYA — SIMULATION, RESEARCH-POINT & VENUE SYSTEM
## Deep-Dive Design and Implementation Specification

> This document adds a simulation and evidence-grounding layer to SHOONYA.
> It does **not** replace `TECH_HANDOFF.md` or `DESIGN.md`.
> Existing formulas, API contracts, lifecycle rules, human-approval rules and build-order constraints remain authoritative.
>
> The purpose of this document is to make the SHOONYA demonstration behave like a coherent disaster-response environment rather than a collection of randomly generated rows.

---

# 1. PURPOSE

SHOONYA already defines a closed loop:

`ingestion → extraction → clustering → confidence/contradiction → priority → dispatch → human approval → outcome`

The simulation layer should make that loop produce a **living operational world**.

Instead of generating:

`300 random reports → dashboard`

generate:

`disaster scenario → environment state → people / facilities / roads / communications → observations → reports → evidence → SHOONYA decisions → outcomes`

The simulation is therefore not another feature sitting beside the intelligence engine.

It is the **controlled world in which the intelligence engine is tested**.

The simulation must answer:

- What caused reports to appear?
- Why are reports more frequent in one area?
- Why did a zone go dark?
- Why did a particular road close?
- Why did satellite evidence arrive at that time?
- Why is a shelter becoming overloaded?
- Why does an incident require a boat instead of an ambulance?
- Why did the priority score change?
- Why did the optimizer choose one resource over another?
- Why did the predicted outcome differ from the actual outcome?

Every important displayed number should have a causal path back into this world.

---

# 2. NON-NEGOTIABLE RELATIONSHIP WITH THE ORIGINAL SPEC

The simulation must **feed** the existing SHOONYA pipeline.

It must not bypass it.

The simulation is allowed to generate synthetic observations, but the production-style pipeline must still process them as if they arrived normally.

Required path:

```text
SIMULATION
    ↓
synthetic observation/event
    ↓
INGESTION
    ↓
DURABLE QUEUE
    ↓
NLP / CV / clustering
    ↓
CONFIDENCE + CONTRADICTION
    ↓
PRIORITY
    ↓
DISPATCH OPTIMIZATION
    ↓
HUMAN APPROVAL
    ↓
RESOURCE ACTION
    ↓
SIMULATION STATE UPDATE
    ↓
OUTCOME
    ↓
EVALUATION / CALIBRATION
```

Never create a "simulation-only shortcut" that directly sets the final UI state.

That would make the demonstration visually convincing but technically dishonest.

---

# 3. WHY ADD A SIMULATION LAYER?

The simulation solves four problems.

## 3.1 Data realism

Reports become observations of a changing environment instead of arbitrary strings.

## 3.2 Repeatability

The exact same disaster can be replayed using a fixed seed.

## 3.3 Evaluation

Because the simulator knows hidden ground truth, SHOONYA can be measured against it.

## 3.4 What-if testing

The same scenario can be run under different assumptions:

- faster or slower communication loss
- more or fewer resources
- different priority weights
- delayed satellite observation
- road closure
- resource failure
- larger population
- increased report noise

This is especially useful because the existing system already has human-adjustable priority weights and a dispatch what-if flow.

---

# 4. SIMULATION SCOPE — YAGNI

Do not build a high-fidelity city simulator.

SHOONYA does not need:

- physics simulation
- fluid dynamics
- structural finite-element simulation
- microscopic pedestrian simulation
- full national traffic simulation
- weather forecasting
- real-time orbital simulation
- epidemiological modeling
- autonomous-agent world simulation at human scale

The goal is **operational causality**, not scientific reconstruction of every physical process.

For the hackathon, implement a lightweight discrete-event / state-transition simulation.

A small Python event engine is sufficient.

If agent-based behavior materially improves the demonstration, a framework such as Mesa can be considered, but do not add it merely because "simulation" sounds more advanced. Current Mesa documentation supports seeded RNGs, model time, agents, scheduling and data collection; those capabilities can support a richer simulation if actually needed. citeturn485795search0turn485795search2

If traffic simulation becomes genuinely necessary, SUMO is a mature option whose core model represents road networks, vehicles and routes, but it is outside the default hackathon scope. citeturn485795search5turn485795search12

Default decision:

> **Start with a deterministic discrete-event simulator. Add a heavier simulator only when a specific SHOONYA requirement cannot be demonstrated without it.**

---

# 5. SIMULATION WORLD MODEL

The simulation world should contain five major layers.

```text
WORLD
├── Geography
├── Population
├── Infrastructure / Venues
├── Communication & sensing
└── Disaster dynamics
```

These layers should interact.

---

# 6. GEOGRAPHY MODEL

Create a coherent fictional district.

Minimum entities:

### Administrative

- district
- ward
- village
- neighborhood

### Natural

- river
- drainage channel
- low-lying basin
- elevated terrain
- floodplain

### Transport

- road
- bridge
- intersection
- access corridor

### Emergency facilities

- hospital
- fire station
- police station
- emergency operations center
- rescue staging area

### Public venues

- school
- community hall
- shelter
- stadium / public ground where useful
- relief distribution point

### Communication

- telecom tower
- radio relay
- internet/fiber segment where useful

All geographic entities must have coordinates or polygons.

---

# 7. VENUE SYSTEM

## 7.1 Definition

The "venue system" is the operational model of **places where people, resources, incidents, evidence and response operations meet**.

Venues are not decorative map POIs.

They are active operational objects.

Examples:

- school
- hospital
- shelter
- evacuation center
- bridge
- railway station
- market
- community hall
- fire station
- police station
- rescue staging area
- relief warehouse
- boat launch point
- helipad / landing area
- telecom tower

The venue system should answer:

> What is this place, who depends on it, what can happen here, and what operational constraints does it create?

---

# 8. VENUE DATA MODEL

Every venue should contain at least:

```text
venue_id
name
venue_type
location
zone_id
capacity
current_occupancy
status
criticality
available_services
accessibility
operational_hours
hazard_exposure
source
updated_at
```

Additional fields are allowed only when required by an actual workflow.

---

# 9. VENUE TYPES

Use a controlled vocabulary.

```text
HOSPITAL
PRIMARY_HEALTH_CENTER
SCHOOL
SHELTER
COMMUNITY_CENTER
POLICE_STATION
FIRE_STATION
EOC
RELIEF_CENTER
WAREHOUSE
BRIDGE
ROAD_JUNCTION
BOAT_LAUNCH
RESCUE_STAGING_AREA
TELECOM_TOWER
POWER_SUBSTATION
HELICOPTER_LANDING_AREA
OTHER
```

Do not create dozens of nearly identical types.

---

# 10. VENUE OPERATIONAL STATES

Venues can transition.

Example:

```text
OPEN
↓
AT_RISK
↓
DEGRADED
↓
INACCESSIBLE
↓
CLOSED
```

A shelter can also become:

```text
OPEN
↓
ACTIVE
↓
NEAR_CAPACITY
↓
FULL
↓
OVERFLOW
```

A hospital can become:

```text
OPERATIONAL
↓
SURGE
↓
CAPACITY_STRESSED
↓
OVER_CAPACITY
```

The current state should affect dispatch and the information shown to the officer.

---

# 11. VENUES MUST PARTICIPATE IN INCIDENTS

An incident should be able to reference nearby or involved venues.

Example:

```text
INC-014
location:
  venue_id: SCHOOL-07

venue state:
  FLOODED
  occupancy_estimate: 31
```

Or:

```text
INC-031
near:
  BRIDGE-04
  ROAD-R17
```

This is far more meaningful than displaying arbitrary labels such as "Zone A".

---

# 12. VENUES MUST PARTICIPATE IN ROUTING

A venue can provide:

- destination
- origin
- intermediate waypoint
- evacuation destination
- resource staging point
- medical destination

For example:

```text
BOAT-03
STAGING-02
      ↓
SCHOOL-07
      ↓
HOSPITAL-02
```

The system should understand the relationship.

---

# 13. VENUE CAPACITY SHOULD BE DYNAMIC

For shelters, hospitals and relief points:

```text
capacity
current_occupancy
incoming_people
available_capacity
```

When an incident is resolved or evacuees move, update occupancy.

This creates a meaningful downstream consequence:

A rescue operation can succeed at the incident level but overload the destination venue.

That is a realistic operational tradeoff.

---

# 14. VENUE NETWORK

Model relationships between venues.

Example:

```text
WARD-07
├── SCHOOL-07
├── HOSPITAL-02
├── SHELTER-03
├── BRIDGE-04
└── TELECOM-11
```

And transport relationships:

```text
SCHOOL-07
  ↕ ROAD-R17
BRIDGE-04
  ↕ ROAD-R11
HOSPITAL-02
```

Do not hardcode these relationships in frontend code.

They belong in the data model.

---

# 15. RESEARCH-POINT SYSTEM

## 15.1 Definition

A research point is a **documented external fact, technical assumption, operational benchmark, dataset reference or methodological source that grounds one part of the SHOONYA simulation or system design**.

A research point is not a random citation.

It must answer:

> Why did we model this thing this way?

---

# 16. RESEARCH POINT TYPES

Use:

```text
DISASTER_STATISTIC
COMMUNICATIONS
FLOOD_BEHAVIOR
POPULATION_EXPOSURE
EMERGENCY_FACILITY
ROAD_ACCESS
SATELLITE
REMOTE_SENSING
HUMANITARIAN_MAPPING
EVACUATION
RESOURCE_ALLOCATION
DISASTER_OPERATIONS
UNCERTAINTY
MACHINE_LEARNING
SIMULATION_METHOD
POLICY / GOVERNANCE
```

---

# 17. RESEARCH POINT DATA MODEL

```text
research_point_id
title
claim
source_organization
source_url
publication_date
accessed_at
source_type
source_tier
evidence_excerpt_or_summary
relevance_to_shoonya
parameter_influenced
real_or_synthetic
confidence_in_research_interpretation
```

Do not store unsupported claims.

---

# 18. RESEARCH POINT → PARAMETER MAPPING

This is one of the most important additions.

Each research finding must map to the thing it influences.

Example:

```text
Research point:
population-grid methodology

Influences:
venue.population_estimate
zone.exposure_index
dark_zone.priority_context
```

Another:

```text
Research point:
satellite observation limitations

Influences:
imagery.available
imagery.delay
visual_evidence_confidence
cloud_obscuration
```

Another:

```text
Research point:
emergency facility representation

Influences:
venue_types
hospital locations
staging locations
```

This prevents "research" from becoming a disconnected bibliography.

---

# 19. RESEARCH SOURCE HIERARCHY

Prefer:

### Tier 1

Official government, scientific, humanitarian and intergovernmental organizations.

Examples:

- NDMA
- MHA
- ISRO / NRSC
- IMD
- Central Water Commission
- Copernicus EMS
- ESA
- NASA
- USGS
- WMO
- WHO
- UN agencies
- World Bank
- FEMA for methodology where relevant

### Tier 2

Peer-reviewed or established research institutions.

### Tier 3

Humanitarian operational organizations such as HOT / IFRC / Red Cross.

### Tier 4

Other reputable technical references.

Avoid basing core simulation assumptions on random blogs.

---

# 20. RESEARCH REALISM EXAMPLES

## Population / exposure

GHSL provides gridded population datasets that can be used as a reference for realistic exposure structures.

Do not copy population values blindly into the fictional world.

Use the source to establish plausible density patterns.

## Emergency facilities

FEMA's Hazus inventory documentation demonstrates the use of spatial datasets for hospitals, fire stations and other emergency-response facilities. This supports representing emergency venues as geospatial operational objects rather than simple labels. citeturn485795search84

## Emergency mapping

Copernicus EMS examples demonstrate the use of flood hazard layers intersected with population and infrastructure to estimate potentially affected populations. citeturn485795search11

## Humanitarian mapping

HOT / HDX disaster-mapping workflows show how disaster mapping datasets can combine roads, buildings and other relevant OSM data within an event-specific priority area. citeturn485795search9

These should inform the simulation structure, not be presented as SHOONYA's live data unless actually integrated.

---

# 21. REAL / SYNTHETIC / SIMULATED LABELS

Every research-driven dataset object must distinguish:

```text
REAL_REFERENCE
SYNTHETIC
SIMULATED
```

Example:

```text
population density reference
→ REAL_REFERENCE

Ward-07 population
→ SYNTHETIC

Ward-07 flood begins at 04:20
→ SIMULATED
```

Never let the UI imply the fictional disaster is a real event.

---

# 22. DISASTER STATE MODEL

The simulator should maintain a global scenario state.

Example:

```text
simulation_time
rainfall_state
river_state
flood_extent
telecom_state
power_state
road_state
venue_state
resource_state
population_movement
report_generation_state
imagery_state
```

The global state produces local observations.

---

# 23. DISASTER DYNAMICS

Use simple causal rules.

Example:

```text
rainfall intensity increases
        ↓
river level rises
        ↓
low-lying zones become affected
        ↓
road accessibility falls
        ↓
reports increase
        ↓
some telecom infrastructure fails
        ↓
report volume falls in affected dark zones
        ↓
information gap increases
        ↓
satellite / drone evidence becomes more important
```

Do not simulate every physical mechanism.

Simulate the **operational consequences** that SHOONYA needs.

---

# 24. FLOOD MODEL

The flood model can be a simplified zone-based model.

For each zone:

```text
baseline_elevation
flood_susceptibility
river_distance
drainage_factor
population
infrastructure_exposure
```

Then calculate a simplified flood state.

Example conceptual rule:

```text
flood_risk =
    rainfall_factor
    × susceptibility
    × drainage_factor
    × river_proximity
```

This does not need to be a scientifically validated hydrological model.

It must be labeled as a simulation assumption.

---

# 25. STRUCTURAL INCIDENT MODEL

Structural incidents can be triggered using environmental and venue conditions.

Example:

```text
high flood exposure
+
building vulnerability
+
reported structural damage
=
increased collapse probability
```

For hackathon scope, keep it stochastic and explainable.

Do not claim engineering-grade structural prediction.

---

# 26. POPULATION MODEL

Do not simulate every individual human unless necessary.

Use population groups.

For each venue / zone:

```text
resident_population
children
elderly
injured
pregnant
disabled
mobile_population
evacuated_population
trapped_population
```

The proportions should be grounded in documented reference assumptions where available.

The values themselves may remain synthetic.

---

# 27. POPULATION MOVEMENT

Simulate meaningful movements:

```text
homes
 ↓
safe routes
 ↓
shelter / hospital / relief center
```

Population movement should respond to:

- road closures
- venue capacity
- evacuation order
- incident resolution
- shelter availability

Do not implement realistic pedestrian physics.

A simple flow model is enough.

---

# 28. INFORMATION GENERATION MODEL

The simulator generates observations, not truth.

For each incident:

```text
ground_truth
    ↓
source-specific observation
```

Different sources see different portions of reality.

---

# 29. SOURCE OBSERVATION MODEL

### Citizen SMS

High immediacy.

Low structure.

Possible location ambiguity.

### Voice report

More contextual.

May contain transcription errors.

### Radio

Short, operational.

Potentially more structured.

### Social-style report

High volume.

Higher duplication/noise.

### Satellite

Spatially useful.

Sparse.

Time-delayed.

### Drone

More localized.

More detailed.

Limited coverage.

This source behavior should influence confidence inputs.

---

# 30. REPORT GENERATION

For each incident generate:

- exact or approximate location
- observation timestamp
- channel
- language
- observed victim estimate
- observed severity
- observed accessibility
- observed hazard
- optional vulnerability
- optional micro-environment
- raw wording

Then deliberately introduce observation error.

---

# 31. OBSERVATION ERROR

Errors should be controlled, not random nonsense.

Examples:

True:

`8 trapped`

Possible reports:

`6 trapped`

`around 8`

`10 people`

`many children`

True:

`road blocked`

Possible reports:

`road open`

`cars cannot pass`

`only bikes getting through`

This creates realistic contradiction without making the dataset incoherent.

---

# 32. INFORMATION DELAY

Every source should have a delay model.

Examples:

```text
citizen report
→ near-immediate

radio
→ short delay

social post
→ near-immediate

satellite
→ delayed availability

manual verification
→ slower but stronger evidence
```

Do not hardcode exact real-world operational latencies unless supported.

Treat them as simulation assumptions.

---

# 33. TELECOM OUTAGE SIMULATION

Each telecom zone should have:

```text
channel_status
last_successful_report
outage_start
outage_reason
estimated_population
affected_area
```

State transitions:

```text
LIVE
↓
DEGRADED
↓
DARK
↓
PARTIAL_RECOVERY
↓
LIVE
```

The dark-zone logic in L4 must consume this state.

---

# 34. DARK-ZONE TEST CASES

Create at least:

### Dark + low population

Low operational concern.

### Dark + high population

High information-gap concern.

### Dark + satellite support

Unknown human reports but strong visual evidence.

### Dark + no imagery

Maximum uncertainty.

### Dark + stale imagery

Evidence exists but may no longer represent current conditions.

These cases should visibly differ.

---

# 35. VENUE-DRIVEN REPORT GENERATION

Venues should influence what people report.

Examples:

If:

```text
SCHOOL-07
occupancy = 180
flood_depth rises
```

then reports might emerge around:

- children trapped
- upper-floor evacuation
- road blockage
- parents attempting access

If:

```text
HOSPITAL-02
capacity_stressed = true
```

reports may concern:

- ambulance congestion
- medical supply requests
- emergency triage

This makes the dataset feel causally connected.

---

# 36. RESEARCH-POINT-DRIVEN PARAMETERS

Every important simulation parameter should have one of:

```text
research-backed
derived
synthetic assumption
```

Example:

```text
population density
→ research-informed structure

report duplicate rate
→ synthetic scenario parameter

satellite delay
→ research-informed range + synthetic realization

road closure timing
→ synthetic scenario event

venue capacity
→ synthetic but plausible
```

This distinction must be documented.

---

# 37. SCENARIO CONFIGURATION

Create a scenario configuration.

Example:

```yaml
scenario_id: MONSOON_FLASHFLOOD_01

duration_hours: 24

seed: 42

hazards:
  - flood
  - road_washout
  - structural_damage
  - telecom_outage

report_volume:
  baseline_per_hour: ...
  peak_per_hour: ...

communication:
  outage_probability: ...
  recovery_windows: ...

imagery:
  sources:
    - satellite
    - drone
  delay_distribution: ...

resources:
  boats: 6
  ambulances: 4
  excavators: 2
  medical_teams: 2

venues:
  hospitals: ...
  shelters: ...
  schools: ...
```

Use configuration rather than scattering scenario constants through code.

---

# 38. FIXED SEEDS

Every simulation run must be reproducible.

Store:

```text
scenario_id
seed
generator_version
configuration_version
```

The same input should produce the same world.

This is essential for debugging and judging.

---

# 39. MONTE CARLO / MULTI-RUN MODE

This is optional and should only be implemented after the deterministic demonstration works.

A useful future extension is:

```text
run scenario 100 times
with different seeds
compare:
  rescue rate
  response time
  resource utilization
  missed incidents
  false prioritization
```

Do not build this before the main closed loop works.

---

# 40. SCENARIO EVENT ENGINE

Use explicit events.

Examples:

```text
RAINFALL_INTENSIFIES
RIVER_RISE
ROAD_FLOODS
BRIDGE_BLOCKED
TELECOM_OUTAGE
NEW_INCIDENT
SATELLITE_CAPTURE_AVAILABLE
DRONE_DEPLOYED
SHELTER_NEAR_CAPACITY
RESOURCE_BREAKDOWN
ROAD_REOPENED
COMMUNICATIONS_RECOVERED
INCIDENT_RESOLVED
RESCUE_REOPENED
```

Events should have:

```text
event_id
event_type
simulation_time
location
cause
parameters
```

---

# 41. EVENT → OBSERVATION → REPORT

Every simulated event should be able to generate consequences.

Example:

```text
TELECOM_OUTAGE
      ↓
citizen reports decrease
      ↓
zone becomes DARK
      ↓
dark-zone flag appears
      ↓
priority context changes
      ↓
satellite evidence becomes relevant
```

Another:

```text
ROAD_FLOODS
      ↓
route feasibility changes
      ↓
candidate resources change
      ↓
optimizer chooses different resource
```

Another:

```text
SHELTER_FULL
      ↓
new destination unavailable
      ↓
routing changes
```

This is what makes the simulation useful.

---

# 42. GROUND TRUTH MUST REMAIN HIDDEN

Create:

```text
data/evaluation/ground_truth.json
```

The live intelligence pipeline must not see it.

Ground truth can contain:

```text
true incident location
true victim count
true hazard
true vulnerability
true accessibility
true venue state
true telecom state
true flood state
true final outcome
```

Use it only for offline evaluation and post-run scoring.

---

# 43. SIMULATION / SHOONYA SEPARATION

Keep these conceptually separate:

```text
SIMULATION TRUTH
     ↓
OBSERVATIONS
     ↓
SHOONYA
```

Never:

```text
SIMULATION TRUTH
     ↓
SHOONYA CONFIDENCE
```

Shoonya should earn confidence through observations.

---

# 44. DATA LINEAGE

Every generated observation should be traceable.

Example:

```text
simulation_event_id
        ↓
observation_id
        ↓
report_id
        ↓
incident_cluster_id
        ↓
evidence_state
        ↓
confidence_version
        ↓
priority_version
        ↓
dispatch_plan_id
        ↓
approval_id
        ↓
outcome_id
```

This should allow a developer or judge to inspect how the system arrived at a decision.

---

# 45. RESEARCH POINTS IN THE UI

Do not clutter the operational dashboard with citations.

Instead provide a methodology / provenance surface.

For example:

```text
SIMULATION BASIS

Population exposure
GHSL-derived reference structure

Emergency facility model
Hazus-style geospatial inventory concept

Flood mapping
Copernicus-style event extent / exposure methodology

Road + facility mapping
OSM / humanitarian mapping conventions
```

The operational dashboard stays clean.

The evidence basis remains inspectable.

---

# 46. VENUE UI

When an operator clicks a venue, show:

```text
VENUE
SCHOOL 07

TYPE
SCHOOL

STATUS
FLOODED

OCCUPANCY
31 / 240

ACCESS
ROAD CLOSED

NEARBY INCIDENTS
03

NEAREST SHELTER
SHELTER 03 · 1.4 km

LAST UPDATE
06:41
```

Only display information that affects operations.

---

# 47. VENUE MAP SYMBOLS

Do not add a different bright icon for every venue type.

That would create map clutter.

Use restrained classes.

For example:

- emergency facilities
- shelters
- critical infrastructure
- transport chokepoints
- public venues

Use small technical symbols.

Detailed type appears on click.

---

# 48. VENUE STATES CAN DRIVE PRIORITY CONTEXT

Example:

A school shelter has:

```text
children present
flooded
road blocked
```

The incident's vulnerability and accessibility context increases.

A low-occupancy warehouse with a minor leak should not behave similarly.

Again:

Do not manually set priority.

The simulation creates the inputs.

The existing priority formula produces the result.

---

# 49. RESEARCH POINT → DATA → UI EXAMPLE

Complete chain:

```text
RESEARCH

Emergency mapping commonly combines
hazard extent with exposed population
and infrastructure.

        ↓

DATA MODEL

zone.population
venue.location
flood_extent
infrastructure

        ↓

SIMULATION

flood expands over Zone 07

        ↓

EVIDENCE

satellite observation intersects
population + infrastructure

        ↓

SHOONYA

confidence changes

        ↓

PRIORITY

accessibility / vulnerability /
victim estimate affect urgency

        ↓

DISPATCH

resource selected

        ↓

OUTCOME

actual evacuation recorded
```

This is the target architecture.

---

# 50. VENUE SYSTEM + DISPATCH

Resources should be assigned in relation to venues.

Examples:

### Boat

origin:
`BOAT-LAUNCH-02`

destination:
`SCHOOL-07`

### Ambulance

origin:
`HOSPITAL-02`

destination:
`INC-031`

### Excavator

origin:
`STAGING-01`

destination:
`BUILDING-09`

This makes the route and ETA visually meaningful.

---

# 51. RESCUE OUTCOME MODEL

After a resource is approved and dispatched, the simulator should determine an outcome.

Factors:

```text
travel time
route accessibility
resource suitability
incident severity
staleness
victim condition
venue state
```

Keep it simple and explainable.

Do not create a pseudo-physics engine.

---

# 52. OUTCOME TYPES

Use:

```text
SUCCESSFUL
PARTIAL
DELAYED
FAILED
REASSIGNED
REOPENED
```

Each outcome should include:

```text
predicted_victims
actual_victims
predicted_eta
actual_eta
resource_used
cause_of_deviation
```

This feeds the existing outcome-feedback requirement.

---

# 53. SIMULATE REALISTIC IMPERFECTION

Not every recommended assignment should be perfect.

Some should:

- arrive late
- encounter a closed road
- require reassignment
- discover fewer victims
- discover more victims
- find the venue evacuated already
- require another resource

Otherwise the feedback loop has no purpose.

---

# 54. PRIORITY WEIGHT WHAT-IF

The simulation should make the weight sliders meaningful.

When the operator changes:

```text
Severity
Vulnerability
Victim Count
Recency
Accessibility
```

recalculate priorities from current simulation state.

Do not merely animate the numbers.

Show the ranking actually change.

The existing specification requires this.

---

# 55. SCENARIO REPLAY

Replay must advance the simulation clock.

Do not implement replay as a prerecorded video.

The engine should emit historical events in time order.

Example:

```text
00:00
initial state

01:10
first reports

02:40
flood expands

03:20
road closes

04:05
telecom outage

04:40
dark zone

05:10
satellite observation

06:00
dispatch

...
```

The frontend subscribes to those state changes.

---

# 56. REPLAY SPEED

For the demo:

```text
24 simulated hours
≈ 40 real seconds
```

But internally preserve the real simulation timeline.

For example:

```text
simulation_time = 06:42
playback_elapsed = 11.7 sec
```

The UI should display simulation time, not fake elapsed time.

---

# 57. REPLAY CHECKPOINTS

Create named checkpoints:

```text
T+00
T+04
T+08
T+12
T+16
T+20
T+24
```

This makes demo control reliable.

Do not rely on timing that must be performed perfectly by a human.

---

# 58. RESEARCH-BACKED SCENARIO DESIGN

Research should guide:

- where people live
- where facilities exist
- how exposure is represented
- how emergency facilities are modeled
- how satellite evidence is represented
- how humanitarian mapping workflows organize data
- how communication failure changes information availability

Research should NOT dictate every synthetic event.

The disaster itself is fictional.

The structure is research-informed.

---

# 59. TEST MATRIX

The simulation should automatically generate cases for:

### DATA

- clean report
- duplicate
- contradiction
- vague location
- multilingual duplicate

### INFORMATION

- low confidence
- high confidence
- dark zone
- dark high-population zone
- stale evidence

### OPERATIONS

- blocked route
- scarce resource
- wrong resource type
- shelter capacity exceeded
- hospital surge

### OPTIMIZATION

- optimal solve
- feasible but non-proven-optimal state where supported
- timeout / fallback

### HUMAN

- approve
- modify
- reject
- reopen

---

# 60. KEY SIMULATION METRICS

Track at least:

```text
reports_generated
reports_processed
reports_dropped
duplicate_detection_rate
contradiction_detection_rate
dark_zone_detection_rate
mean_ingestion_latency
mean_confidence_update_latency
dispatch_solve_time
fallback_count
resource_utilization
incident_resolution_time
predicted_vs_actual_victims
predicted_vs_actual_eta
human_override_rate
```

Do not invent performance values.

Calculate them.

---

# 61. SIMULATION QUALITY METRICS

Add:

### Event coverage

Did every required scenario event happen?

### State consistency

Are venue / road / telecom / resource states internally consistent?

### Evidence consistency

Does every displayed observation correspond to a generated observation?

### Ground-truth consistency

Does every evaluated incident map to the hidden truth?

### Replay determinism

Does seed 42 reproduce the same scenario?

---

# 62. SIMULATION VALIDATION

Before using the simulation for the UI, run automatic validation:

```text
[ ] every incident has a valid location
[ ] every venue belongs to a zone
[ ] every road joins valid endpoints
[ ] every resource has a valid home/staging location
[ ] every generated report maps to an observation
[ ] every observation references an event or source process
[ ] every contradiction references real reports
[ ] every dark zone has a defined communication state
[ ] every imagery record has a timestamp
[ ] every route uses valid road state
[ ] every outcome references a dispatched resource
```

---

# 63. DATA QUALITY FAIL-FAST

If the simulator creates impossible data, stop generation rather than silently repairing it.

Examples:

- resource assigned from nowhere
- hospital capacity negative
- road references a nonexistent node
- report timestamp before scenario start
- resolved incident receives no reopening reason
- venue occupancy exceeds capacity without overflow state

Log the failure.

Do not hide bad simulation data.

---

# 64. SIMULATION API

Prefer a simple interface such as:

```text
POST /simulation/start
POST /simulation/pause
POST /simulation/resume
POST /simulation/reset
POST /simulation/step
POST /simulation/speed
GET  /simulation/state
GET  /simulation/events
GET  /simulation/research-points
GET  /venues
GET  /venues/{id}
```

Only add endpoints actually required by the demo.

These endpoints should not bypass the existing ingestion / decision pipeline.

---

# 65. SIMULATION STATE VS. OPERATIONAL STATE

Maintain a distinction:

### Simulation state

What is actually happening in the fictional world.

### Operational state

What SHOONYA currently believes based on available evidence.

Example:

```text
GROUND TRUTH:
8 people trapped

SHOONYA ESTIMATE:
6–10 people

CONFIDENCE:
0.61
```

This difference is valuable.

It is how you demonstrate that SHOONYA operates under uncertainty.

---

# 66. DO NOT EXPOSE GROUND TRUTH DURING LIVE OPERATIONS

Do not show:

`TRUE VICTIMS: 8`

while the operator is making a decision.

Show what the system knows.

Ground truth is available only in:

- evaluation view
- post-run analytics
- developer/debug tooling
- offline testing

---

# 67. RESEARCH POINT PANEL

Create a methodology page or drawer, not a giant research dashboard.

Example:

```text
SCENARIO BASIS

POPULATION
Reference: GHSL-style population grids

FACILITIES
Reference: geospatial emergency-facility inventories

MAPPING
OSM / humanitarian mapping conventions

FLOOD EXPOSURE
Copernicus-style hazard × exposure approach

EARTH OBSERVATION
Sentinel / published remote-sensing methodology

SIMULATION
Deterministic discrete-event model

All incident data shown in this demo:
SYNTHETIC / SIMULATED
```

---

# 68. RESEARCH POINT CITATION POLICY

When an external source directly influences a displayed claim, retain the source.

For example:

```text
Population exposure method
Source: GHSL
```

Do not add citations to every operational number.

The distinction is:

```text
research basis = cited

synthetic realization = labeled
```

---

# 69. CURRENTLY VERIFIED RESEARCH DIRECTIONS

The following are useful starting points for further research:

### Copernicus EMS

Useful for event extent, flood mapping, infrastructure exposure and emergency mapping workflows. Real activation examples calculate exposure by intersecting hazard layers with population and infrastructure. citeturn485795search11

### Humanitarian OpenStreetMap

Useful for understanding disaster-event mapping workflows and event-specific datasets containing roads, buildings and related OSM data. citeturn485795search9

### FEMA Hazus

Useful as a reference for representing hospitals, fire stations and emergency-response spatial inventories. citeturn485795search84

### Mesa

Useful if SHOONYA later needs explicit agents, scheduling and model-level data collection. citeturn485795search0turn485795search10

### SUMO

Useful if detailed road/vehicle simulation becomes necessary; its current documentation models road networks, vehicles and routes explicitly. citeturn485795search5turn485795search12

---

# 70. WHAT NOT TO CLAIM

Do not say:

- "the simulation predicts exactly how a real disaster will behave"
- "the flood model is scientifically validated"
- "satellite is ground truth"
- "the simulator predicts human behavior"
- "the venue capacities are real"
- "these are live government disaster feeds"
- "the synthetic scenario represents actual Ward 7"
- "research proves this exact parameter value"

Use:

- simulation
- synthetic scenario
- research-informed assumption
- reference methodology
- evidence-backed estimate
- operational approximation

---

# 71. FINAL ARCHITECTURE

The intended combined system becomes:

```text
                 RESEARCH
                    │
                    ▼
            SCENARIO CONFIGURATION
                    │
                    ▼
             DISASTER SIMULATOR
          ┌─────────┼──────────┐
          ▼         ▼          ▼
      GEOGRAPHY  VENUES    POPULATION
          │         │          │
          └─────────┼──────────┘
                    ▼
            DISASTER DYNAMICS
                    │
          ┌─────────┼──────────────┐
          ▼         ▼              ▼
       PEOPLE     ROADS       COMMUNICATION
          │         │              │
          └─────────┼──────────────┘
                    ▼
              OBSERVATIONS
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
      SMS         RADIO       SATELLITE
      VOICE       SOCIAL      DRONE
       │            │            │
       └────────────┼────────────┘
                    ▼
                INGESTION
                    │
                 QUEUE
                    │
                    ▼
                  NLP
                    │
                    ▼
             CLUSTERING
                    │
                    ▼
            CONFIDENCE / DISPUTE
                    │
                    ▼
                 PRIORITY
                    │
                    ▼
              OPTIMIZATION
                    │
                    ▼
             HUMAN APPROVAL
                    │
                    ▼
              RESOURCE ACTION
                    │
                    ▼
                SIMULATOR
                    │
                    ▼
                 OUTCOME
                    │
                    ▼
              EVALUATION
```

This is the architecture to build toward.

---

# 72. MOST IMPORTANT DATA PRINCIPLE

The UI must never be the source of truth.

The simulator is the source of the fictional world's truth.

SHOONYA is the source of the operational interpretation.

Therefore:

```text
TRUTH ≠ PERCEPTION
```

The difference between those two is exactly where confidence, contradiction, information gaps and human decision-making become meaningful.

---

# 73. GOLDEN DEMO SCENARIO

The flagship scenario should contain the following chain:

```text
1. Rainfall intensifies

2. Low-lying Ward 07 begins flooding

3. School 07 becomes partially inaccessible

4. Citizens report children trapped

5. Multiple reports arrive in Hindi / Hinglish / English

6. Duplicate reports form a cluster

7. One report claims 10 victims
   another claims 6

8. Cluster becomes DISPUTED

9. Confidence remains separate from severity

10. Road R17 becomes inaccessible

11. Boat-03 becomes the best feasible resource

12. A telecom tower fails

13. Ward 09 goes DARK

14. Ward 09 has a large population

15. NO DATA — UNKNOWN STATUS appears

16. Satellite imagery becomes available

17. Visual evidence partially supports flooding

18. Confidence changes

19. Priority changes

20. Solver creates a plan

21. Solver status is shown

22. Officer modifies one assignment

23. Approval is recorded

24. Reverse SOS is generated

25. Rescue occurs

26. Actual victims differ from estimate

27. Outcome is recorded

28. Replay shows the entire story

29. Evaluation compares SHOONYA estimates
    against hidden simulation truth
```

This one scenario exercises nearly the entire SHOONYA architecture.

---

# 74. IMPLEMENTATION ORDER

Do not build everything simultaneously.

Recommended simulation-specific sequence:

### S1 — Scenario schema

World, zones, venues, roads, resources.

### S2 — Deterministic event engine

Simulation clock and events.

### S3 — Venue state engine

Occupancy, capacity, accessibility and operational states.

### S4 — Disaster state engine

Flood / infrastructure / communication transitions.

### S5 — Observation generator

Turn world state into source-specific observations.

### S6 — Research-point registry

Research claims and parameter mappings.

### S7 — Ground-truth/evaluation layer

Hidden truth and scoring.

### S8 — Integration

Feed observations through real SHOONYA ingestion.

### S9 — Replay

Historical simulation event stream.

### S10 — Evaluation

Compare operational estimates with truth.

Do not skip directly to S9 because replay looks impressive.

---

# 75. FINAL YAGNI RULE

If adding a simulation feature does not improve one of:

- evidence realism
- system testing
- operational decision-making
- replay
- evaluation
- demo credibility

do not build it.

The simulator is not a second product.

It exists to make SHOONYA's actual intelligence loop believable, measurable and repeatable.

---

# 76. DEFINITION OF DONE

The simulation layer is complete when:

- the same seed reproduces the same disaster
- venues are real operational entities in the synthetic world
- roads affect accessibility
- communication outages affect report availability
- population affects information-gap context
- incidents emerge from simulated conditions
- reports are imperfect observations
- contradictions are deliberate and traceable
- satellite/drone observations have delays and limitations
- resources have real constraints
- dispatch changes simulation state
- human approval remains mandatory
- outcomes feed evaluation
- replay uses the same event history
- every major displayed metric has a causal source
- research assumptions are documented
- synthetic values are not disguised as real facts
- the frontend shows operational state rather than simulator internals

---

# 77. FINAL PRINCIPLE

Do not make SHOONYA look real by inventing more believable numbers.

Make it believable by making the numbers **consequences of a coherent world**.

The correct pattern is:

```text
RESEARCH
   ↓
ASSUMPTION
   ↓
SCENARIO
   ↓
WORLD STATE
   ↓
OBSERVATION
   ↓
REPORT
   ↓
EVIDENCE
   ↓
CONFIDENCE
   ↓
PRIORITY
   ↓
RESOURCE DECISION
   ↓
HUMAN APPROVAL
   ↓
OUTCOME
   ↓
MEASURED ERROR
```

That closed causal chain is what will make the SHOONYA demonstration feel like an actual crisis-response system rather than a collection of AI-generated UI values.
