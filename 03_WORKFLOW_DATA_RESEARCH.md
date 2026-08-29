# SHOONYA — End-to-End Workflow, Data Model, Research & Demo Behavior

## 1. Purpose

This file describes how information moves through SHOONYA from first observation to human-approved outcome.

It also defines how the synthetic disaster world must be researched and generated so the resulting dashboard contains believable data instead of arbitrary numbers.

The goal is not to create more data.

The goal is to create **connected data**.

---

## 2. Operational Mental Model

Treat every incident as an evolving evidence graph:

```text
REAL-WORLD EVENT (hidden synthetic ground truth)
        ↓
OBSERVATIONS
        ↓
RAW REPORTS / SENSOR OBSERVATIONS
        ↓
EXTRACTION
        ↓
CLUSTERING
        ↓
EVIDENCE GRAPH
        ↓
CONFIDENCE
        ↓
PRIORITY
        ↓
RESOURCE FEASIBILITY
        ↓
OPTIMIZED PLAN
        ↓
HUMAN DECISION
        ↓
DISPATCH
        ↓
OUTCOME
        ↓
CALIBRATION / EVALUATION
```

The live system must not see the full hidden ground truth.

Ground truth exists only for evaluation.

---

# 3. Synthetic Disaster World

## 3.1 World objects

Create one coherent fictional district containing:

- wards
- villages
- landmarks
- schools
- hospitals
- shelters
- bridges
- roads
- river/drainage corridors
- telecom towers
- emergency stations
- high-ground areas

Every object has a geographic relationship to other objects.

Avoid randomly scattered coordinates.

---

## 3.2 Population model

For each settlement/ward define:

- population
- density category
- approximate vulnerable population
- urban/rural classification
- key infrastructure

The exact fictional population values are synthetic, but they should be grounded in realistic settlement scales.

Population becomes important when interpreting silence.

---

## 3.3 Hidden ground truth

For evaluation only, define:

```text
incident_id
true_location
true_hazard
true_victim_count
true_vulnerability
true_accessibility
true_start_time
true_evolution
true_resolution
```

Do not expose the hidden ground truth to the live UI.

---

# 4. Disaster Timeline

Construct a 24-hour timeline.

Example causal progression:

```text
T+00:00  normal baseline
T+01:00  rainfall / hazard begins
T+02:00  first incidents
T+03:00  road accessibility degrades
T+04:00  report volume rises
T+05:00  duplicates begin
T+06:00  contradictory reports appear
T+07:00  telecom outage begins in selected zones
T+08:00  dark-zone conditions become visible
T+09:00  imagery becomes available for some zones
T+10:00  resource competition increases
T+11:00  dispatch decisions
...
T+24:00  recovery / unresolved cases
```

The exact times are synthetic.

The causal structure should remain coherent.

---

# 5. Report Generation Workflow

## Step 1 — Create incidents first

Define the underlying incident scenario.

Example:

```text
INC-014
location = Ward 07 school
hazard = flood trapped
victims = 8
vulnerability = children
accessibility = low
start = T+03:12
```

Then create imperfect observations of this event.

Do not create hundreds of random reports and hope the clustering layer discovers the intended story.

---

## Step 2 — Generate source-specific observations

### SMS

Short, direct, incomplete.

Example:

`Paani 2nd floor tak aa gaya. 6 log hain.`

### Hindi

`School ke paas paani bahut badh gaya hai, log fase hue hain.`

### Hinglish

`Road pura cut ho gaya hai bhai, udhar 8-10 log hain.`

### Voice transcript

Natural speech, pauses and context.

### Radio

Concise operational language.

### Social-style report

Fast, noisy, duplicate-prone.

Do not make every report grammatically perfect.

---

# 6. Report Imperfection Model

Reports are observations, not truth.

For hidden victim count `8`, observed reports may say:

- 6
- 8
- 9
- 10
- "around 8"
- "many children"

For a hidden location, some reports may provide:

- exact location
- landmark
- road name
- school name
- ward only
- vague reference

For severity, some reports may understate or overstate the situation.

---

# 7. Language / Channel Distribution

The dataset should contain a meaningful mixture of:

- English
- Hindi
- Hinglish
- transliterated Hindi
- radio English
- code-switched reports

Several incidents must be observed across multiple languages.

The purpose is to test semantic clustering, not simply to decorate the feed with different languages.

---

# 8. Duplicate Design

Include:

### Exact duplicate

Same message repeated.

### Minor mutation

Punctuation / spelling changes.

### Paraphrase

Different sentence, same incident.

### Cross-language duplicate

Hindi vs English description of the same event.

### Partial duplicate

Different aspects of the same incident.

### Temporal duplicate

Repeated update as the same incident evolves.

### False merge candidate

Nearby but genuinely distinct incidents.

This is the test bed for HDBSCAN + semantic similarity + merge confidence.

---

# 9. Contradiction Design

Contradictions must be meaningful.

Create several types:

### Victim disagreement

`8 people` vs `15 people`

### Severity disagreement

`minor waterlogging` vs `second-floor inundation`

### Accessibility disagreement

`road open` vs `road blocked`

### Location disagreement

`school entrance` vs `school rear building`

### Status disagreement

`rescued` vs `still trapped`

### Hazard disagreement

`building damaged` vs `building collapsed`

Some contradictions should later resolve.
Some should remain disputed.

---

# 10. Source Trust History

Do not assign arbitrary trust values.

Build trust-related evidence from simulated history.

Example:

```text
SOURCE-014
reports = 14
corroborated = 10
incorrect = 2
partial = 2
```

A first-time source has insufficient history.

Do not equate unknown history with untrustworthy.

---

# 11. Report Velocity / Abuse Signals

Create source behavior patterns such as:

- normal citizen activity
- responder burst
- suspicious high-volume source
- repeated same-location reports

Velocity should create a review signal, not automatic deletion.

Context matters.

---

# 12. Communication Blackout Workflow

For selected zones:

```text
LIVE
↓
report frequency drops
↓
last contact
↓
telecom outage
↓
DARK
↓
visual evidence becomes more important
↓
communication recovers
```

Track:

- last report
- outage start
- outage reason
- affected population
- channel status
- evidence available during outage

---

# 13. Dark-Zone Cases

Create several deliberately different silent zones.

### Case A — Low population

```text
population ≈ 150
no reports
telecom offline
no imagery
```

### Case B — High population

```text
population ≈ 8,000+
no reports
telecom offline
no imagery
```

### Case C — High population + imagery

```text
population high
communications dark
imagery shows flooding
```

### Case D — High population + ambiguous imagery

Visual evidence is inconclusive.

The system must preserve uncertainty.

---

# 14. CV / Satellite Evidence Workflow

For each imagery sample record:

```text
image_id
zone_id / incident_id
capture_time
ingestion_time
sensor_type
coverage
resolution_class
visibility/cloud state
model_name
model_version
prediction
inundated_area_estimate
road_accessibility_estimate
visual_confidence
limitations
```

Create different evidence conditions:

1. strong support
2. partial support
3. ambiguous
4. stale image
5. unavailable image
6. visual disagreement

The confidence engine should upgrade when useful evidence arrives, not blindly increase confidence whenever imagery exists.

---

# 15. Real-World Research Program

The purpose of external research is to calibrate **patterns, assumptions and representations**, not to populate the synthetic dashboard with copied facts.

Research these topics.

## Disaster reporting

Study how disaster/crowd reports differ by channel, source and urgency.

## Communications failure

Study the operational effects of telecom and power outages on situational awareness.

## Population exposure

Study how population grids and settlement density are represented.

## Earth observation

Study:

- optical vs radar observation
- revisit limitations
- cloud effects
- spatial resolution
- event extent mapping
- infrastructure damage products

## Routing

Study:

- accessibility constraints
- bridge/road closure effects
- changing travel times
- stale route information

## Emergency operations

Study:

- resource scarcity
- triage
- dispatch constraints
- incident verification
- human approval workflows

## Uncertainty

Study how uncertainty and conflicting reports are represented without manufacturing false certainty.

---

# 16. Research Source Hierarchy

Prefer:

1. Indian government / scientific agencies
2. international intergovernmental/scientific agencies
3. peer-reviewed research
4. established humanitarian organizations
5. reputable technical documentation
6. general web sources only when necessary

Useful sources to investigate include:

- NDMA
- MHA
- IMD
- ISRO / NRSC
- Central Water Commission
- Ministry of Jal Shakti
- Census and official demographic sources
- Copernicus EMS
- ESA
- NASA
- USGS
- WMO
- UNDRR
- WHO
- World Bank
- OpenStreetMap / HOT

---

# 17. Geospatial Research

Where real geography is needed, use established structures instead of hand-drawn arbitrary data.

### OpenStreetMap / Overpass

Use for:

- roads
- bridges
- schools
- hospitals
- shelters
- other mapped infrastructure

### GHSL

Use as a reference for population-density modeling.

### Copernicus EMS

Use as a reference for:

- event extent
- damage mapping
- emergency mapping products

### ISRO / NRSC

Use as a reference for Indian earth-observation and flood/inundation response concepts.

Never imply that reference data is a live SHOONYA feed unless actually integrated.

---

# 18. Research Provenance File

Create:

`data/research_sources.md`

Format each source as:

```text
Source:
Organization:
Publication / dataset:
Publication date:
URL:
Relevant finding:
How it informs SHOONYA:
Data class: REAL REFERENCE / SYNTHETIC ASSUMPTION / LIVE INPUT
Access date:
```

This allows the team to defend assumptions to judges.

---

# 19. Research Claims vs Product Metrics

Keep these separate.

### External research claim

Example:

`11,778 weather/climate/water-related disasters were recorded globally between 1970 and 2021.`

### SHOONYA operational metric

Example:

`247 reports in the last 10 minutes`

The first needs external citation.
The second comes from the system simulation.

Do not present them as the same category of evidence.

---

# 20. Resource World

Create fewer resources than demand.

Each resource contains:

```text
resource_id
type
location
capacity
capabilities
availability
travel_speed
range / limits
hazard_constraints
current_assignment
```

Example capability model:

### Boat

Good for flood rescue.

### Excavator

Good for debris / collapse access.

### Ambulance

Good for medical transport.

### Medical team

Good for on-site treatment.

A resource must not be assignable simply because an incident is high-priority.

Feasibility must matter.

---

# 21. Route State Model

Road segments can evolve:

```text
OPEN
→ FLOODED
→ PARTIALLY_PASSABLE
→ CLOSED
→ REOPENED
```

Every road observation should record:

- source
- timestamp
- confidence
- reason
- staleness

ETA should be derived from the route/resource state where the demo permits.

---

# 22. Priority Evolution Example

An incident might evolve like:

```text
06:14
1 report
high severity
confidence 0.31
priority remains visible

06:17
independent report
confidence 0.48

06:24
radio corroboration
confidence 0.67

06:31
visual evidence
confidence 0.81

06:32
road becomes inaccessible
accessibility risk rises
priority changes
```

The dashboard should show this as a genuine state evolution, not a scripted label swap.

---

# 23. Evidence Graph Per Incident

For high-value demo incidents, maintain:

```text
INCIDENT
├── raw report 01
├── raw report 02
├── voice transcript
├── radio observation
├── semantic similarity links
├── merge decision
├── contradiction pair
├── confidence inputs
├── visual evidence
├── road evidence
├── resource candidates
├── solver decision
├── officer decision
└── final outcome
```

The UI should be able to drill into this chain.

---

# 24. Demo Scenarios

Build explicit cases for:

### Scenario 01 — High severity / low confidence

Tests severity-confidence separation and priority floor.

### Scenario 02 — Duplicate volume

Tests log dampening.

### Scenario 03 — Contradictory school incident

Tests disputed state.

### Scenario 04 — Dark high-population ward

Tests silence + exposure.

### Scenario 05 — Visual confirmation

Tests async confidence upgrade.

### Scenario 06 — Visual ambiguity

Tests honest uncertainty.

### Scenario 07 — Resource scarcity

Tests optimization.

### Scenario 08 — Solver timeout

Tests fallback.

### Scenario 09 — Officer modification

Tests human authority.

### Scenario 10 — 500 reports / 30 seconds

Tests queue resilience.

---

# 25. Replay Workflow

The 24-hour replay should compress into approximately 40 seconds for the demo.

Narrative:

```text
FOG / ZERO
↓
first reports
↓
cluster formation
↓
confidence growth
↓
disputes appear
↓
communications fail
↓
dark zones emerge
↓
visual evidence arrives
↓
priorities stabilize
↓
resources assigned
↓
rescue outcomes
```

Do not make replay a generic video-player animation.

---

# 26. Frontend Data States

Every major component should be testable with at least:

- known
- disputed
- unknown
- degraded
- loading/pending where operationally meaningful

### Map

- normal/reporting
- disputed
- dark
- critical

### Incident panel

- low confidence
- high confidence
- disputed evidence
- stale evidence
- awaiting imagery

### Dispatch panel

- optimal
- feasible/non-proven optimal if applicable
- fallback
- human modified

---

# 27. Dataset Outputs

Create a reproducible dataset generator and produce:

```text
data/
├── scenario/
│   ├── district.json
│   ├── wards.json
│   ├── roads.json
│   ├── infrastructure.json
│   ├── telecom_zones.json
│   └── resources.json
│
├── reports/
│   ├── reports.jsonl
│   └── stress_500_reports.jsonl
│
├── imagery/
│   └── metadata.json
│
├── evaluation/
│   └── ground_truth.json
│
├── research_sources.md
├── DATASET_REPORT.md
└── generator_config.json
```

Adapt only as required by the existing repository structure.

---

# 28. Dataset Quality Report

`DATASET_REPORT.md` should contain:

- report count
- unique hidden incidents
- resulting candidate clusters
- duplicate rate
- contradiction count
- language distribution
- source-channel distribution
- vague-location rate
- dark-zone count
- high-population dark-zone count
- imagery coverage
- false-positive cases
- false-negative cases
- resources by type
- average reports per incident
- timeline coverage

---

# 29. Evaluation Metrics

Instrument the actual build for:

- deduplication precision / recall
- ingestion-to-map latency
- queue loss under burst
- information-gap detection rate
- solver solve time
- fallback rate
- human override rate
- extraction quality on the hand-built evaluation subset

Do not turn these into vanity metrics.

A metric must have a test definition.

---

# 30. UI Data Honesty Rules

Do not display:

`87%` because the gauge needs a value.

Display `87%` only if the model actually produced that value.

Do not display:

`1,284 active incidents`

unless that count exists in the current dataset/state.

Do not display:

`Satellite verified`

if the model only produced supporting evidence.

Prefer:

`Flood detected: YES`
`Visual confidence: 0.81`
`Evidence timestamp: 06:31`

---

# 31. Frontend Workflow

The frontend consumes system state rather than inventing it.

Recommended information path:

```text
system strip
    ↓
map
    ↓
selected incident
    ↓
evidence
    ↓
why-ranked-here
    ↓
dispatch recommendation
    ↓
human action
```

The live map is the centerpiece.

The incident panel opens contextually.

The ingestion feed remains dense and operational.

Do not turn each stage into another dashboard page unless the task actually requires navigation.

---

# 32. Final Validation Sequence

Before demo readiness:

### Data

Can every major UI number be traced to source data or a documented synthetic rule?

### Geography

Do locations and routes make spatial sense?

### Evidence

Can a judge follow raw report → cluster → evidence → confidence?

### Confidence

Does the formula produce the shown value?

### Priority

Does the shown ranking follow the exact formula?

### Optimization

Are resource assignments feasible?

### Human control

Can an API caller bypass approval?

### Failure

Does the system reveal degradation rather than silently hiding it?

### Replay

Does the 24-hour scenario tell one coherent story?

### UI

Does the screen still look specific to SHOONYA rather than a generic dashboard template?

---

# 33. Final Principle

SHOONYA should not look realistic because it contains many numbers.

It should look realistic because the numbers are related.

The target is:

```text
hazard
→ geography
→ exposure
→ communication state
→ reports
→ evidence
→ confidence
→ urgency
→ resource feasibility
→ human decision
→ outcome
```

Every important visible state should have a reason.

That is the definition of a believable SHOONYA demo.
