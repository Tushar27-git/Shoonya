# SHOONYA — DATA, RESEARCH & EVIDENCE REALISM DIRECTIVE

This directive governs the **data, evidence, research, metrics, demo scenarios and displayed numbers** inside SHOONYA.

It does NOT change the architecture or formulas in `TECH_HANDOFF.md`.

It exists because a visually excellent emergency-operations interface will still look fake if the underlying numbers, locations, reports, satellite observations, resource constraints and operational behavior are arbitrary.

The goal is:

> **Make SHOONYA's synthetic operational world behave like a plausible real disaster, while being completely honest about which information is real-world reference data, which is synthetic, and which is simulated for the demonstration.**

Do not fabricate "real-world facts" and present them as real.

Do not use random numbers merely to fill UI space.

Do not generate disconnected synthetic rows.

Build a coherent evidence system.

---

# 1. FIRST PRINCIPLE — RESEARCH BEFORE FABRICATION

Before creating the demo dataset, research how real disaster-response systems represent:

- incidents
- reports
- locations
- affected populations
- vulnerability
- evacuation
- road accessibility
- emergency resources
- satellite observations
- telecom outages
- disaster timelines
- uncertainty
- source reliability
- response times
- rescue outcomes

Use authoritative sources whenever possible.

Preferred source hierarchy:

### Tier 1 — Government / intergovernmental / scientific

Examples:

- NDMA
- MHA
- IMD
- ISRO / NRSC
- Central Water Commission
- Ministry of Jal Shakti
- Census / official demographic sources
- Copernicus EMS
- ESA
- NASA
- USGS
- WMO
- UNDRR
- WHO
- World Bank
- OpenStreetMap / HOT
- official disaster-management agencies

### Tier 2 — Academic / research organizations

Use:

- peer-reviewed papers
- established research datasets
- university research
- technical reports

### Tier 3 — reputable operational organizations

Examples:

- IFRC
- Red Cross / Red Crescent
- humanitarian mapping organizations
- Humanitarian OpenStreetMap Team

### Tier 4 — general web sources

Use only when necessary.

Never build critical claims from an unverified blog simply because it appears first in search results.

---

# 2. EVERY RESEARCH FACT NEEDS PROVENANCE

Whenever research produces a fact that will influence:

- a displayed statistic
- a dataset parameter
- a model assumption
- a scenario assumption
- a pitch claim
- a resource value
- a population estimate
- a disaster statistic

record:

```text
claim
source
source_type
publication_date
access_date
url
why_it_is_relevant
```

Create:

`data/research_sources.md`

containing the research provenance.

Do not bury research assumptions inside code.

---

# 3. DISTINGUISH THREE TYPES OF INFORMATION

Every data point used by SHOONYA must belong to exactly one category:

### REAL REFERENCE

A fact taken from a real source.

Example:

A published disaster statistic.

### SYNTHETIC OPERATIONAL DATA

Invented specifically for the SHOONYA simulation but grounded in real-world ranges / patterns.

Example:

`Ward 07 population = 4,820`

The ward itself is fictional, but the population size is intentionally plausible.

### LIVE EXTERNAL DATA

Actually retrieved from an external source during operation.

Do NOT label static synthetic data as live.

Do NOT label imported historical data as real-time.

Do NOT imply that an external satellite feed exists when it does not.

Every data layer should be identifiable.

---

# 4. NEVER RANDOMIZE IMPORTANT NUMBERS

Do not use random generation independently for:

- victim count
- confidence
- severity
- coordinates
- ETA
- population
- flood extent
- road accessibility
- resource availability
- report count
- telecom outages

Instead establish causal rules.

For example:

```text
heavier rainfall
↓
river level rise
↓
low-lying wards affected
↓
roads become inaccessible
↓
reports increase
↓
telecom outages occur
↓
reports decrease in dark zones
↓
satellite evidence becomes more important
↓
resource travel time increases
↓
priority changes
```

Numbers must emerge from the scenario.

---

# 5. BUILD A DISASTER WORLD, NOT A DATA TABLE

Create a coherent fictional district.

Define:

### Geography

- district
- wards
- villages
- river
- drainage channels
- bridges
- roads
- schools
- hospitals
- shelters
- police / fire stations
- telecom towers
- high-ground areas

### Population

Each settlement should have:

- population estimate
- density category
- vulnerable-population estimate
- urban / rural classification

### Infrastructure

Each important infrastructure object should have:

- type
- location
- operational state
- accessibility
- dependencies

### Hazards

Track:

- flood depth / extent where applicable
- structural collapse
- road washout
- blocked routes
- telecom failure
- power failure
- secondary hazards

All relationships should be spatially and temporally coherent.

---

# 6. USE REAL GIS CONVENTIONS

Study how real geospatial emergency systems represent:

- points
- lines
- polygons
- administrative boundaries
- road segments
- flood extents
- affected buildings
- exposure
- population grids
- event footprints

Useful research sources include:

### OpenStreetMap

For roads, buildings, schools, hospitals, bridges and other geographic features.

### GHSL

For realistic population-density structures.

### Copernicus EMS

For understanding how event extent and infrastructure damage are represented in emergency mapping.

Copernicus EMS explicitly produces event-extent and infrastructure-damage information for emergency-management workflows.

### ISRO / NRSC

For Indian flood / earth-observation response concepts.

Do not use the existence of these sources as evidence that SHOONYA has live access.

They are references unless actually integrated.

---

# 7. POPULATION MUST MATTER TO THE MODEL

Do not treat:

`0 reports = safe`

Instead use:

```text
silence
+
population exposure
+
telecom status
+
time since last communication
+
available visual evidence
```

to reason about the information gap.

Create deliberate examples:

### Zone A

Population ~180

No reports.

Telecom offline.

Low information-gap significance.

### Zone B

Population ~8,600

No reports.

Telecom offline.

High information-gap significance.

Both should display as:

`NO DATA — UNKNOWN STATUS`

but the operational context must distinguish them.

GHSL provides population-grid products that can be used as a reference for plausible exposure modeling.

---

# 8. MODEL COMMUNICATION FAILURE AS A TIME SERIES

Do not simply set:

`channel_status = DARK`

from the beginning.

Create:

```text
LIVE
↓
report frequency decreases
↓
last contact
↓
outage detected
↓
DARK
↓
imagery becomes primary evidence
↓
communications recover
↓
LIVE
```

Store:

- last report timestamp
- estimated outage start
- outage reason
- channel type
- population affected
- confidence in outage state

This makes the dark-zone feature believable.

---

# 9. REPORT GENERATION MUST BE INCIDENT-CENTRIC

Create incidents first.

Then generate reports observing those incidents.

Do NOT generate reports first and hope clustering discovers a story.

For each synthetic incident define hidden ground truth:

```text
incident_id
true_location
true_hazard
true_victim_count
true_vulnerability
true_accessibility
true_start_time
true_evolution
```

The system should NOT see all of this.

Ground truth exists only for evaluation.

Then generate noisy observations around it.

This allows the system to be measured honestly.

---

# 10. REPORTS SHOULD BE OBSERVATIONS, NOT TRUTH

Each report should be an imperfect observation.

Example hidden truth:

```text
victims = 8
```

Reports might say:

```text
6 people
8 people
10 people
"around 8"
"many children"
```

These differences are intentional.

The system must infer rather than receive perfect labels.

---

# 11. CREATE REALISTIC SOURCE BIASES

Different channels should behave differently.

### SMS

Short, direct, incomplete.

### Voice

More contextual, occasionally messy, speech artifacts.

### Radio

Operational and terse.

### Social-style posts

Fast but noisier, more emotional, more duplication.

### Satellite

Sparse but spatially informative.

### Drone

Local, high-resolution, but limited spatial coverage.

Do not make every source equally reliable.

This is important because the confidence engine specifically depends on source corroboration and cross-channel evidence.

---

# 12. DUPLICATES MUST BE REALISTIC

Create multiple categories.

### Exact duplicates

Same text repeated.

### Minor edits

Different punctuation / spelling.

### Paraphrases

Different wording, same event.

### Cross-language duplicates

Hindi and English describing the same event.

### Partial duplicates

Two reports referring to the same incident but emphasizing different aspects.

### Temporal duplicates

Same event reported several times as the situation changes.

### False duplicate

Two nearby but genuinely different incidents.

This allows HDBSCAN + semantic similarity to actually be tested.

---

# 13. CONTRADICTIONS MUST BE STRUCTURED

Do not insert random contradictory sentences.

Create meaningful contradiction types.

### Victim count

`8 people` vs `15 people`

### Severity

`waterlogging` vs `second-floor inundation`

### Accessibility

`road open` vs `road fully blocked`

### Location

`school entrance` vs `school rear building`

### Status

`rescued` vs `still trapped`

### Hazard

`building damaged` vs `building collapsed`

For each contradiction store:

```text
contradiction_id
incident_id
claim_a
claim_b
source_a
source_b
timestamp_a
timestamp_b
materiality
resolved
resolution_method
```

This creates a proper evidence trail.

---

# 14. CONTRADICTIONS SHOULD SOMETIMES REMAIN UNRESOLVED

Do not resolve every contradiction.

Some should stay:

`DISPUTED — VERIFICATION REQUIRED`

This is critical.

A system where AI eventually finds an answer to everything is less believable than a system that correctly identifies uncertainty.

---

# 15. CREATE SOURCE TRUST AS HISTORY

Do not simply assign:

`source_trust = 0.92`

randomly.

Build it from simulated history.

For example:

Source S014:

```text
reports submitted: 14
later corroborated: 10
verified incorrect: 2
partially correct: 2
```

Then derive the trust-related input.

A first-time source should have:

`history = insufficient`

not:

`trust = 0`

This follows the architecture's requirement that low-history sources not be silently discarded.

---

# 16. REPORT VELOCITY SHOULD HAVE CONTEXT

A source producing:

`20 reports in 10 minutes`

may be suspicious.

But a field responder or radio operator might legitimately produce that volume.

Therefore research and design a plausible source-role model.

For each source optionally know:

- anonymous citizen
- field responder
- radio operator
- verified institution
- public social source

Do not let velocity automatically mean malicious.

It should become a review signal.

---

# 17. CREATE TRUE POSITIVE / FALSE POSITIVE / FALSE NEGATIVE CASES

The dataset needs known evaluation labels.

At minimum include:

### TRUE POSITIVE

System should identify an actual incident.

### FALSE POSITIVE

Reports suggest an incident but ground truth says otherwise.

### FALSE NEGATIVE

Incident exists but reports are sparse / absent.

### PARTIALLY OBSERVED

Some properties are known, others uncertain.

### DELAYED CONFIRMATION

Incident initially uncertain, later supported by another channel.

This allows the system's behavior to be evaluated rather than merely demonstrated.

---

# 18. CV DATA SHOULD FOLLOW SENSOR LIMITATIONS

Satellite imagery is not magical.

Research:

- revisit limitations
- cloud cover
- spatial resolution
- sensor differences
- optical vs radar considerations
- image timestamps
- coverage gaps
- preprocessing limitations

Copernicus EMS uses satellite and other geospatial data for event extent and infrastructure assessment, but emergency mapping products still depend on available observation conditions.

Therefore create:

### IMAGE AVAILABLE

Useful evidence.

### IMAGE CLOUD-OBSCURED

Weak evidence.

### IMAGE OLD

Stale evidence.

### IMAGE PARTIAL

Only part of the incident visible.

### IMAGE CONTRADICTS REPORT

Important evidence conflict.

### NO IMAGE

No visual evidence.

Do NOT make every image agree with text.

---

# 19. STORE IMAGE METADATA

Every imagery evidence record should contain:

```text
image_id
incident_or_zone_id
capture_timestamp
ingestion_timestamp
sensor_type
coverage_area
resolution_class
cloud_or_visibility_state
model_name
model_version
predicted_class
estimated_inundated_area
road_accessibility_estimate
visual_confidence
limitations
```

The UI can then explain where the evidence came from.

---

# 20. NEVER CALL SATELLITE DATA "GROUND TRUTH"

Use:

`VISUAL EVIDENCE`

or:

`SATELLITE EVIDENCE`

not:

`GROUND TRUTH`

unless the actual dataset establishes ground truth.

The current architecture specifically requires visual evidence to support confidence rather than prove a report true.

---

# 21. RESOURCE MODEL SHOULD BE PHYSICALLY PLAUSIBLE

Define resources with:

```text
resource_id
type
location
capacity
capabilities
availability
travel_speed
operational_range
hazard_constraints
current_assignment
```

Example:

```text
BOAT-03
capacity: 8
capability: flood_rescue
status: AVAILABLE
```

```text
EXC-02
capability: debris_clearance
status: AVAILABLE
```

The optimizer should have real constraints to work with.

---

# 22. MAKE RESOURCE SCARCITY PURPOSEFUL

Do not create 50 resources for 20 incidents.

Create scarcity.

Example:

```text
17 active incidents
6 boats
3 ambulances
2 excavators
1 medical team
```

Now optimization matters.

Different incidents should compete for the same scarce resources.

---

# 23. MAKE ROUTES CHANGE OVER TIME

A road can transition:

```text
OPEN
↓
FLOODED
↓
PARTIALLY PASSABLE
↓
CLOSED
↓
REOPENED
```

Each road-state observation should have:

- timestamp
- source
- confidence
- expiry / staleness
- reason

This makes route planning meaningful.

---

# 24. ETA MUST BE DERIVED

Do not write:

`ETA = 15 min`

because it looks nice.

Derive it from:

```text
resource location
+
incident location
+
road network
+
road state
+
travel speed
+
routing constraints
```

Then add clearly stated assumptions for the synthetic model.

---

# 25. PRIORITY DATA MUST EMERGE FROM THE SPEC

Never manually assign:

`priority_score = 9.6`

unless it is explicitly test data.

The actual score must be calculated from the required formula:

```text
Uᵢ = w₁·Sᵢ
   + w₂·Vᵢ
   + w₃·log(1+Nᵢ)
   + w₄·Rᵢ
   + w₅·Aᵢ
```

then:

```text
M(cᵢ) = c_min + (1 − c_min)cᵢ
```

with:

```text
c_min = 0.4
```

then:

```text
Pᵢ = Uᵢ · M(cᵢ)
```

The displayed priority should always be reproducible from displayed inputs.

---

# 26. CONFIDENCE DATA MUST ALSO BE DERIVED

Never fabricate confidence values just to create a visual gradient.

The confidence must come from:

```text
Cᵢ = clip(
 b
 + wₛSᵢ
 + w_gGᵢ
 + w_tTᵢ
 + w_vVᵢ
 − w_cKᵢ,
 0,
 1
)
```

and the UI should be capable of showing why it changed.

---

# 27. CREATE "BEFORE / AFTER EVIDENCE" CASES

This is especially important for the Zero Gauge.

Create an incident timeline:

```text
06:14
1 SMS
Confidence: 0.31

06:17
2nd independent report
Confidence: 0.48

06:22
Radio corroboration
Confidence: 0.67

06:31
Satellite evidence
Confidence: 0.81
```

The Zero Gauge should visibly reproduce that evidence evolution.

Now the visual has a real meaning.

---

# 28. BUILD A 24-HOUR STORY

The replay dataset should not simply advance timestamps.

The event should evolve.

Example:

```text
00:00
quiet

02:00
rain intensifies

03:00
first flood reports

04:00
road failures

05:00
report spike

06:00
telecom outage

07:00
dark zones emerge

08:00
satellite evidence arrives

09:00
resource scarcity

10:00
rescue operations

...
```

Make the timing internally consistent.

The exact timings are synthetic.

The causal structure should feel real.

---

# 29. CREATE REALISTIC DATA VOLUMES

The technical specification calls for:

- 150–300 reports
- 30–50 geography entities
- 10–15 imagery samples
- 500-report/30-second stress test

Use those values as the baseline.

But distribute them meaningfully.

Do not make:

`300 reports = 300 incidents`

Instead something like:

```text
300 raw reports
↓
~80–120 incident candidates
↓
~40–70 meaningful clusters
↓
some merged
↓
some disputed
↓
some dark / unreported
```

The exact resulting values should emerge from the dataset.

---

# 30. CREATE A GROUND-TRUTH EVALUATION FILE

Create:

`data/evaluation/ground_truth.json`

containing information the live system does not see.

For example:

```json
{
  "incident_id": "INC-014",
  "true_victim_count": 8,
  "true_hazard": "FLOOD_TRAPPED",
  "true_location": {...},
  "true_accessibility": "LOW",
  "true_status": "ACTIVE"
}
```

This allows evaluation of:

- extraction
- clustering
- confidence behavior
- information-gap detection
- dispatch quality

without exposing ground truth to the dashboard.

---

# 31. BUILD A DATA QUALITY REPORT

Generate:

`data/DATASET_REPORT.md`

Include:

- number of reports
- number of unique incidents
- duplicate rate
- contradiction count
- language distribution
- source distribution
- percentage vague locations
- number dark zones
- number high-population dark zones
- imagery coverage
- false-positive examples
- false-negative examples
- resource counts
- average reports per incident
- timeline coverage

This is useful for both engineering and judging.

---

# 32. BUILD A RESEARCH EVIDENCE TABLE

Create:

`data/research_sources.md`

with sections:

### Disaster statistics

### Information overload / communications

### Earth observation

### Population exposure

### Emergency mapping

### Disaster response

### Resource allocation

### Human-in-the-loop decision making

### Uncertainty / confidence

### Indian disaster-response context

For every source:

```text
Source:
Organization:
Publication:
Date:
URL:
Relevant finding:
How SHOONYA uses it:
Real or synthetic:
```

---

# 33. RESEARCH THESE TYPES OF QUESTIONS

Do not search only for "disaster statistics."

Research questions such as:

### INFORMATION

How quickly can disaster information volume increase?

How are citizen reports represented operationally?

What makes crowd-sourced disaster reports unreliable?

### COMMUNICATION FAILURE

How do telecom outages affect situational awareness?

How do emergency organizations reason about communication gaps?

### GEOSPATIAL

How are affected areas represented?

How are population exposure and infrastructure exposure modeled?

### EARTH OBSERVATION

What can satellite imagery actually detect?

What can it not detect reliably?

How quickly is imagery available?

### OPERATIONS

What makes a rescue assignment feasible?

How does accessibility change response time?

What resource capabilities matter?

### HUMAN DECISION MAKING

How do emergency command centers handle uncertain information?

Why is evidence provenance important?

These questions should drive the dataset design.

---

# 34. USE REAL DISASTER CASES AS PATTERN REFERENCES

Research actual historical disasters.

The goal is NOT to copy an event.

The goal is to identify realistic patterns such as:

- report surges
- infrastructure failures
- communication loss
- evacuation bottlenecks
- conflicting casualty reports
- delayed imagery
- changing road accessibility
- rescue-resource scarcity

WMO's disaster atlas, for example, documents thousands of weather-, climate- and water-related disasters and their human/economic impacts across decades. It reports 11,778 such disasters between 1970 and 2021, over two million deaths and US$4.3 trillion in losses. Use such statistics as background/pitch evidence, not as synthetic incident data.

---

# 35. DO NOT TURN RESEARCH INTO MARKETING CLAIMS

A research source saying:

"satellite imagery can support flood mapping"

does NOT justify:

"Shoonya knows exactly where everyone is trapped."

A source saying:

"early warning systems reduce mortality"

does NOT justify:

"Shoonya saves lives."

Be precise.

The UI and pitch should reflect what the system actually demonstrates.

---

# 36. CREATE RESEARCH-BASED UI FACTS

Where useful, the UI/pitch may display carefully sourced context such as:

```text
GLOBAL WEATHER / CLIMATE / WATER DISASTERS
11,778 recorded events · 1970–2021
```

with a source attribution.

But do not inject unrelated statistics into the operational dashboard.

A live EOC dashboard should prioritize current operational state.

Research statistics belong in:

- onboarding / context
- system information
- presentation
- methodology
- documentation

not everywhere.

---

# 37. DISTINGUISH OPERATIONAL METRICS FROM RESEARCH STATISTICS

### Operational

`247 reports / 10 min`

`03 disputed clusters`

`05 dark zones`

`11.8s ingest→map`

`2.4s solver`

These come from SHOONYA.

### Research

`11,778 disasters`

`2M+ deaths`

`US$4.3T losses`

These come from external sources.

Never visually make them look like the same type of evidence.

---

# 38. NEVER DISPLAY A NUMBER WITHOUT A SEMANTIC REASON

Before displaying any number ask:

> What decision does this number help the officer make?

Good:

`8 victims`

`Confidence 0.61`

`Road access LOW`

`43 min since last update`

Bad:

`AI Score 83`

`Threat 91`

`Efficiency +42%`

unless those metrics have an actual defined meaning.

---

# 39. ALL GENERATED DATA MUST BE DETERMINISTIC

The demo dataset should be reproducible.

Provide:

```text
seed
scenario
randomization controls
generator version
generation timestamp
```

Running:

```bash
python generate_dataset.py --seed 42
```

should reproduce the same demo world.

This prevents the demo from changing unexpectedly.

---

# 40. MAKE THE DATA DEMO-READY

The dataset must intentionally contain every visual state the UI needs:

- normal
- critical
- disputed
- dark
- low confidence
- high confidence
- high severity / low confidence
- low severity / high confidence
- vague location
- satellite-supported
- satellite-unavailable
- stale route
- solver optimal
- solver feasible / non-optimal if applicable
- heuristic fallback
- human override
- resolved
- reopened

Never allow the dashboard to look polished simply because all incidents happen to be clean.

---

# 41. DATA SHOULD EXPLAIN THE UI

Every major visual element should correspond to real data.

Examples:

### Zero Gauge

confidence score

### Amber pulse

dispute flag

### Grey ring

dark-zone status

### Ember marker

critical priority

### queue graph

actual queue measurements

### route line

actual resource-to-incident path

### "why"

actual evidence fields

### approval audit

actual action history

Nothing should exist purely because it "looks nice."

---

# 42. FINAL DATA REALISM TEST

Before shipping, ask:

### Question 1

Could these numbers plausibly coexist in the same disaster?

### Question 2

Do timestamps and causal relationships make sense?

### Question 3

Do geographic relationships make sense?

### Question 4

Would the reports actually produce the displayed clusters?

### Question 5

Would those clusters produce the displayed confidence?

### Question 6

Would the confidence and urgency actually produce the displayed priority?

### Question 7

Would the available resources actually permit the displayed dispatch?

### Question 8

Does the map reflect the same state as the incident panel?

### Question 9

Can every major claim be traced to either evidence or documented synthetic assumptions?

### Question 10

Could a technically knowledgeable judge find an obviously impossible number?

If yes, fix the underlying data model.

Do not hide it with UI polish.

---

# 43. DO NOT OVERRESEARCH THE WRONG THINGS

Research should improve:

- data realism
- model assumptions
- system credibility
- operational semantics
- evaluation

Do not spend hours researching irrelevant technology merely because it sounds sophisticated.

YAGNI applies to research too.

Only research something if it materially affects SHOONYA's implementation, demonstration, evaluation or credibility.

---

# 44. FINAL OUTPUTS FROM THIS DIRECTIVE

Before calling the data layer complete, the repository should contain:

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

Adapt the structure to the existing repository if necessary.

Do not create unnecessary abstractions.

---

# 45. MOST IMPORTANT RULE

Do not try to make SHOONYA look realistic by adding more numbers.

Make it realistic by making the numbers **related**.

A believable system is:

```text
population
   ↓
exposure
   ↓
incident likelihood
   ↓
reports
   ↓
communication state
   ↓
evidence availability
   ↓
confidence
   ↓
priority
   ↓
resource feasibility
   ↓
dispatch
   ↓
outcome
```

The same underlying world should explain everything the operator sees.

That is the standard.

Not "more data."

**Better-connected data.**