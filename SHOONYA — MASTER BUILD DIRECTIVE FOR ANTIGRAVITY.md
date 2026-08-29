# SHOONYA — MASTER BUILD DIRECTIVE FOR ANTIGRAVITY

You are building **SHOONYA (शून्य)**, an emergency-operations crisis intelligence and rescue optimization system.

This repository already contains the team's completed technical and visual design specifications:

- `TECH_HANDOFF.md` — architecture, formulas, data contracts, constraints, failure handling, build order and scope
- `DESIGN.md` — visual system, interaction rules, typography, copy rules and anti-AI-slop constraints

These two files are the primary source of truth.

Do not redesign SHOONYA's architecture.
Do not replace its formulas with something "more practical."
Do not simplify load-bearing mechanisms.
Do not turn this into a generic AI dashboard.
Do not generate a visually polished shell around fake-looking data.

The objective is:

> **Build a believable emergency-operations system whose data, behavior, evidence chain, visual hierarchy and failure modes make it feel like an actual crisis-management instrument rather than a hackathon dashboard.**

---

## 0. OPERATING MODE

### 0.1 Planning-first interaction model

Work in explicit task checkpoints.

**FIRST RESPONSE ONLY:**
Read `TECH_HANDOFF.md` fully and then `DESIGN.md` fully.

Do not create code.
Do not modify the repository.
Do not scaffold the application.
Do not "get started" on implementation.

Instead, produce the complete ordered task plan described below.

Then STOP.

Wait for explicit approval.

After approval:

1. Work on exactly one task.
2. Before implementation, explain:
   - what the specification says
   - which exact section governs the task
   - the smallest implementation satisfying it
   - what would silently break if implemented incorrectly
3. Implement only that task.
4. Verify it.
5. Report exactly one status:
   - `DONE`
   - `BLOCKED`
   - `NEEDS REVIEW`
6. STOP.

Never automatically continue to the next task.

---

# 1. SOURCE-OF-TRUTH RULES

`TECH_HANDOFF.md` and `DESIGN.md` are binding.

`TECH_HANDOFF.md` explicitly requires the implementation order:

1. data schema + API contract
2. ingestion + queue
3. NLP extraction
4. deduplication / clustering
5. confidence / contradiction engine
6. priority formula
7. MILP + fallback
8. human approval
9. dashboard / map / replay
10. CV
11. stress-test + reverse-SOS polish

The same document says to build the closed loop before polishing isolated features. Follow that order exactly.

`DESIGN.md` is equally binding for frontend work.

Every frontend component must be checked against it before implementation.

---

# 2. CURRENT-TECHNOLOGY VERIFICATION

Before integrating any external library, model, API or service:

**Search the current official documentation first.**

Do not trust remembered APIs or package versions.

At minimum verify:

- Next.js
- React
- FastAPI
- Pydantic
- Redis / redis-py Streams
- HDBSCAN / scikit-learn
- Sentence Transformers
- MapLibre or Mapbox
- PostGIS
- OR-Tools
- Whisper / faster-whisper
- Bhashini
- Hugging Face models
- the selected CV model
- any geospatial API being used

Prefer official documentation and official model cards.

Record the version actually selected in the repository.

Do not claim a version is current without checking it.

Current research indicates, for example, that Next.js 16.3.3 is in Active LTS, FastAPI 0.141.1 is a current release, and MapLibre GL JS is on the 6.x line. These numbers are examples of facts to verify at build time, not permanent constants.

For OR-Tools, verify the actual current CP-SAT API and solve-status behavior. Official documentation currently distinguishes `OPTIMAL`, `FEASIBLE`, `INFEASIBLE`, `MODEL_INVALID`, and `UNKNOWN`.

---

# 3. DO NOT BUILD "RANDOM SYNTHETIC DATA"

This is one of the highest-priority requirements.

The dataset must be **synthetic but operationally plausible**.

Do NOT generate:

- random locations
- random victim counts
- random timestamps
- random priorities
- identical-looking reports
- uniformly distributed incidents
- arbitrary confidence percentages
- disconnected satellite evidence
- meaningless road closures
- resources that magically fit every incident

Instead construct a coherent disaster world with causal relationships.

The data must behave as if many independent people, channels and sensors are observing the same evolving disaster.

---

# 4. CREATE A SINGLE COHERENT DISASTER SCENARIO

Build the synthetic demonstration around one evolving disaster rather than many disconnected examples.

Recommended scenario structure:

### Phase A — Initial impact

Examples:

- flash flooding
- river overflow
- road washout
- localized building collapse
- power / telecom outage

Reports begin sparsely.

### Phase B — information overload

Report volume rapidly increases.

Now introduce:

- duplicate reports
- paraphrases
- Hinglish
- Hindi
- incomplete locations
- stale information
- repeated social posts
- voice-transcribed reports
- radio-style reports

### Phase C — information conflict

Create deliberately contradictory clusters.

For example:

Report A:
> "School ke andar paani kamar tak hai, 10 bachche fase hue hain."

Report B:
> "Paani sirf road tak aaya hai, school safe hai."

Report C:
> "Third floor pe students hain, ground floor flooded."

Do not collapse these into one average narrative.

The system should surface the disagreement.

### Phase D — communications blackout

Take several geographically meaningful zones dark.

Do NOT simply set `reports = 0`.

Instead create a plausible reason:

- tower outage
- fiber outage
- power loss
- bridge isolation
- inaccessible terrain

Then make population density matter.

A silent village with ~150 residents should not visually imply the same risk as a silent settlement with ~9,000 residents.

### Phase E — alternate sensing

Introduce satellite/drone evidence to the dark zones.

Some imagery should:

- support the reports
- partially support the reports
- contradict the reports
- be inconclusive
- be unavailable

This is essential.

Perfect satellite agreement is unrealistic and makes the system look staged.

### Phase F — resource scarcity

Create fewer available resources than active incidents.

Example resource pool:

- rescue boats
- ambulances
- excavators
- medical teams
- high-clearance vehicles
- rescue helicopters

Every resource should have capabilities and geographic constraints.

A boat should not be assignable to a debris-collapse incident simply because that incident has the highest priority.

### Phase G — resolution and feedback

Some incidents get:

- assigned
- rescued
- partially resolved
- reopened
- reassigned

The actual outcomes should differ from predictions in several cases.

That gives the feedback loop something real to measure.

---

# 5. DATA SHOULD HAVE A CAUSAL GRAPH

Do not think of the dataset as rows.

Think of it as:

**event → observations → reports → extraction → clusters → evidence → confidence → priority → resources → human decision → outcome**

Every significant incident should have a traceable chain.

For example:

`INC-014`

can have:

- 8 raw reports
- 3 source channels
- 2 languages
- 1 contradictory report
- 1 vague location
- 1 satellite observation
- 1 road closure
- 3 candidate resources
- 1 recommended resource
- 1 human modification
- 1 final dispatch
- 1 outcome

The UI should make this trace possible.

---

# 6. MAKE THE REPORTS SOUND REAL

Reports must not all sound like clean database entries.

Generate realistic source-specific language.

### SMS

Short, fragmented:

> "Paani ghar ke andar aa gaya. 2nd floor pe hain. 5 log."

### Hindi

> "Nadi ka paani bahut badh gaya hai, school ke paas log fase hue hain."

### Hinglish

> "Road pura cut ho gaya hai bhai, udhar 8-10 log hain."

### Voice transcript

Include natural speech artifacts:

> "Haan ji... ward seven ke paas jo purana school hai na... wahan paani aa gaya hai... bachche upar hain..."

### Radio transcript

Use concise dispatcher language:

> "Unit 4 reports structural collapse near bridge approach. Access blocked from east."

### Social-style report

Can be noisy:

> "PLEASE HELP!!! hospital road underwater!!! nobody coming"

Do not make every message grammatically perfect.

---

# 7. MULTILINGUAL DATA DISTRIBUTION

Do not create a dataset that is 95% English with a couple Hindi examples.

Use a meaningful mixture:

- English
- Hindi
- Hinglish
- short transliterated Hindi
- radio-style English
- partial code-switching
- multilingual duplicates referring to the same incident

At least several incident clusters should have the same event represented differently across languages.

The important thing is not language count.

The important thing is **cross-language semantic deduplication**.

---

# 8. LOCATIONS MUST BE GEOGRAPHICALLY BELIEVABLE

Never fabricate coordinates independently.

Create a fictional operational district as required by the specification, but make its geography internally coherent.

Define:

- wards
- villages
- schools
- hospitals
- bridges
- shelters
- roads
- river / drainage corridors
- telecom zones
- high-population areas
- isolated settlements

Each object needs a relationship to other objects.

For example:

`Ward 07`
→ contains `Govt School`
→ served by `Road R17`
→ adjacent to `River Segment R3`
→ nearest hospital `H02`
→ population ~4,800
→ tower `T11`
→ tower outage begins at T+02:40

Use proper geospatial structures.

A vague location such as:

> "near the old banyan tree"

must resolve to an administrative polygon / coarse area rather than inventing a pin.

This follows the technical specification and its explicit LOW precision requirement.

---

# 9. USE REAL GEOSPATIAL CONVENTIONS WHERE HELPFUL

The incident information can remain synthetic while the underlying geospatial logic follows real-world data structures.

Useful sources to research:

- OpenStreetMap
- Overpass
- GHSL population grids
- Copernicus EMS
- ISRO / NRSC flood products
- Sentinel-style Earth observation products

GHSL provides gridded population counts at 100 m resolution, making it a useful reference for realistic population-density priors.

OpenStreetMap's Overpass API is intended for querying selected geospatial data, which is appropriate when creating realistic roads/facilities instead of inventing disconnected geometry.

ISRO/NRSC provides Indian flood-related satellite layers intended for planning, rescue and relief, making it a particularly useful reference for the Indian disaster-response context.

Copernicus EMS Rapid Mapping explicitly deals with event extent and infrastructure damage products for emergency response.

Do not pretend these are live feeds unless they actually are.

Clearly distinguish:

- live external data
- imported static reference data
- synthetic operational data
- mocked disaster signals

---

# 10. INCIDENT DATA DISTRIBUTION MUST HAVE STRUCTURE

For the 150–300 report dataset required by the spec, intentionally create:

### High-confidence incidents

Multiple independent channels agree.

Example:

- SMS
- radio
- satellite

### Low-confidence high-severity incidents

One report claims:

> 20 children trapped

but there is no corroboration yet.

This incident must remain prominent because of the priority floor.

### Contradictory incidents

At least several clusters should contain materially incompatible claims.

Examples:

- victim count disagreement
- severity disagreement
- location disagreement
- accessibility disagreement
- status disagreement

### Dark zones

Several zones:

- have zero reports
- have telecom outage information
- have known populations
- may have imagery

### False-volume cluster

One zone must receive dozens of low-quality same-channel duplicates.

This demonstrates why report count alone is insufficient.

### High-quality low-volume cluster

Another zone should have only 2–3 strong reports.

This demonstrates quality vs. volume.

---

# 11. DESIGN DATA TO TEST THE FORMULAS

Do not merely implement the formulas.

Design test records specifically to expose whether they work.

### Cluster severity

Create:

- many low-weight duplicate reports
- few high-weight corroborated reports

Then verify the log10 dampening property defined by the spec.

### Priority floor

Create:

A:
- very severe
- zero corroboration

B:
- low severity
- strong corroboration

Verify the required ordering.

The formula is:

`Uᵢ = w₁·Sᵢ + w₂·Vᵢ + w₃·log(1+Nᵢ) + w₄·Rᵢ + w₅·Aᵢ`

then:

`M(cᵢ) = c_min + (1 − c_min)·cᵢ`

with:

`c_min = 0.4`

then:

`Pᵢ = Uᵢ · M(cᵢ)`

These are load-bearing mechanisms, not implementation suggestions.

---

# 12. EVIDENCE SHOULD BE VISIBLE, NOT JUST STORED

For every incident, distinguish:

### Raw evidence

What the reporter actually said.

### Extracted interpretation

What the NLP layer inferred.

### Cluster evidence

Why reports were considered the same incident.

### Confidence evidence

Why confidence increased or decreased.

### Contradiction evidence

Exactly which claims disagree.

### Visual evidence

What the satellite/drone result actually observed.

### Operational evidence

Road accessibility, resource distance, estimated ETA.

### Decision evidence

Why the optimizer selected a resource.

### Human evidence

What the officer changed.

This chain is the product.

Do not hide it behind one percentage.

---

# 13. CONFIDENCE MUST NEVER BECOME A FAKE "TRUTH SCORE"

The UI must never imply:

`87% confidence = 87% probability that reality is exactly this`

unless the model actually represents that probability.

Instead present confidence as an evidence-combination state.

Show its components where useful:

- source corroboration
- geospatial consistency
- temporal consistency
- visual evidence
- contradiction penalty

The formula must remain:

`Cᵢ = clip(b + wₛSᵢ + w_gGᵢ + w_tTᵢ + w_vVᵢ − w_cKᵢ, 0, 1)`

with configurable weights.

---

# 14. CONTRADICTIONS MUST FEEL LIKE REAL OPERATIONS DATA

Do not merely add a red "CONFLICT" badge.

When a contradiction exists, show:

**CLAIM A**
source
time
raw report
interpreted value

versus

**CLAIM B**
source
time
raw report
interpreted value

Then show:

`DISPUTED — verification required`

Do not generate a synthetic average.

The contradictory evidence must remain visible.

---

# 15. DARK ZONES MUST FEEL DIFFERENT FROM EMPTY MAP SPACE

A dark zone is not "no incidents displayed."

It is an information state.

Show:

`NO DATA — UNKNOWN STATUS`

plus:

- last known channel state
- time since reports stopped
- population estimate
- telecom status
- last imagery timestamp
- whether visual evidence exists
- recommended investigation action

A high-population dark zone should therefore feel operationally important even though its marker is visually restrained.

This directly implements the design's "absence rather than alarm" approach.

---

# 16. SATELLITE / CV DATA MUST HAVE LIMITATIONS

Never build a CV demo where:

`Satellite image → perfect flood mask → 100% agreement`

That looks fake.

Create several evidence outcomes:

1. Strong visual support
2. Partial support
3. Ambiguous visual signal
4. No usable imagery
5. Imagery contradicts report

Show:

- detected flood
- estimated inundated area
- road accessibility
- visual confidence
- imagery timestamp
- data source
- limitations

The technical spec explicitly says visual evidence supports confidence but does not establish absolute truth.

Published current examples include IBM/NASA's Prithvi-EO-2.0 Sen1Floods11 checkpoint, while other published flood segmentation models have different licenses and input assumptions. Verify the actual model card before selecting one.

---

# 17. RESOURCE DATA MUST BE AS RIGOROUS AS INCIDENT DATA

Every resource needs:

- ID
- type
- current location
- availability
- capacity
- capabilities
- maximum operating range if relevant
- hazard compatibility
- travel-time estimate
- current assignment
- status

Example:

`BOAT-03`

Capabilities:
- flood rescue
- 8-person capacity
- shallow water

Not capable of:
- structural-collapse extraction

Example:

`EXC-02`

Capabilities:
- debris clearance
- collapse access

Not capable of:
- open-water rescue

This makes the optimizer meaningful.

---

# 18. ROAD NETWORK SHOULD ACTUALLY MATTER

Do not draw decorative roads.

Roads must affect dispatch.

Each important road segment should have:

- travel time
- accessibility state
- closure reason
- confidence in closure report
- last updated time

A flood report from two hours ago should not behave exactly like a road closure observed thirty seconds ago.

The technical specification requires stale closure information to decay and trigger re-confirmation.

---

# 19. MAKE THE MILP DEMO INTELLIGIBLE

The optimizer should answer an operational question:

> "Given these incidents, these available resources, and these constraints, what should we send where?"

Show:

- selected assignments
- unserved incidents
- reason for assignment
- resource constraints
- solve time
- solution status
- objective value where useful

Never hide solver failure.

If the solver reaches a usable feasible solution within the time budget but not proven optimal, distinguish that from an actual proven optimum.

The official CP-SAT API distinguishes `OPTIMAL` from `FEASIBLE`; use the actual solver status rather than inventing a simplified status.

For fallback:

`PLAN QUALITY: HEURISTIC (FALLBACK)`

must appear exactly as required.

---

# 20. HUMAN APPROVAL MUST BE A REAL SYSTEM BOUNDARY

Do not implement approval as a frontend-only modal.

The backend must enforce:

`proposed plan → explicit approval → dispatch`

No direct dispatch route may work without the approval context required by the specification.

The audit log must record:

- actor
- action
- incident
- resource
- previous state
- resulting state
- timestamp
- reason if supplied
- integrity/hash information

An officer modifying a recommendation should produce a visibly different audit entry from approving the recommendation unchanged.

---

# 21. DASHBOARD DESIGN — DO NOT BUILD A GENERIC SaaS DASHBOARD

The product is an **emergency operations console**.

It should feel closer to:

- mission control
- emergency command-and-control
- aviation operations
- geospatial intelligence tooling
- radio dispatch systems

than:

- Notion
- Linear
- Stripe
- modern SaaS admin panels
- startup landing pages
- generic Tailwind dashboards

`DESIGN.md` is explicit about this.

---

# 22. MAP IS THE VISUAL HERO

The map should occupy the greatest visual area.

Around it:

### Persistent header

Show:

- QUEUE
- ACTIVE INCIDENTS
- DISPUTED
- DARK ZONES
- SOLVER
- INGEST→MAP latency

### Ingestion rail

Dense.

Monospaced.

Fast-moving.

Like a radio / telemetry stream.

### Incident detail panel

Opens beside the map.

Never permanently bury the map underneath cards.

### Optional lower information rail

Use only when it provides actual operational value.

Do not fill every empty space with widgets.

---

# 23. USE DESIGN TOKENS EXACTLY

Use the specified tokens:

- `--void: #0B0E11`
- `--panel: #141920`
- `--grid-line: #232B33`
- `--signal-cyan: #4FD8C4`
- `--dispute-amber: #E8A33D`
- `--critical-ember: #D6553C`
- `--dark-zone-grey: #5A6472`
- `--ink: #E4E8EC`
- `--ink-dim: #8A93A0`

No purple.

No pink.

No purple-blue gradient.

No neon SaaS aesthetic.

No decorative glassmorphism.

No gradient blobs.

No giant rounded cards.

No excessive shadows.

These are explicit design constraints.

---

# 24. TYPOGRAPHY MUST MAKE THE SYSTEM LOOK LIKE AN INSTRUMENT

Use three distinct type roles:

### Display / headers

Archivo or Barlow Condensed.

### UI / body

Public Sans or IBM Plex Sans.

### Data / telemetry

IBM Plex Mono or JetBrains Mono.

All of these must have a real hierarchy.

Coordinates, timestamps, confidence, incident IDs, queue counts and logs should look like instrument data.

Do not use one typeface everywhere.

The design document explicitly calls for this distinction.

---

# 25. ZERO GAUGE IS A PRODUCT SIGNATURE

Do not treat the Zero Gauge as decoration.

Every place confidence is displayed should use the same visual language.

The gauge:

- begins at zero
- visibly fills toward 1.0
- updates smoothly
- uses the permitted functional gradient only inside the gauge
- always has the numeric confidence value nearby

Severity must remain visually separate.

Do not create:

`Priority 87`
`Confidence 87%`

as two visually indistinguishable numbers.

The whole point is:

**severity and confidence are different dimensions.**

The Zero Gauge is explicitly the signature element of the design.

---

# 26. DATA DENSITY WITHOUT VISUAL CHAOS

Dense does not mean cramped.

Use:

- consistent 8 px spacing
- strong alignment
- deliberate whitespace
- hairline dividers
- compact rows
- restrained typography
- fixed-width numeric columns

Avoid:

- 20 cards on screen
- nested cards inside cards inside cards
- giant headings
- huge empty hero sections
- excessive iconography
- random badges
- decorative charts

The screen should feel information-dense because the information is important, not because every component was squeezed together.

---

# 27. MAP SYMBOLS MUST CARRY SEMANTIC MEANING

Use the design's four zone states:

### Normal

Small cyan dot.

### Disputed

Amber marker with the one deliberate recurring pulse.

### Dark zone

Grey hollow ring.

### Critical

Ember marker with priority rank.

Do not rely on color alone.

Shape + label + position + state should communicate meaning.

Vague locations must appear as area polygons, not fake exact coordinates.

This is explicitly specified in `DESIGN.md`.

---

# 28. ANIMATION MUST BE RARE

Allowed:

1. disputed marker pulse
2. Zero Gauge confidence transition
3. small numeric count transitions
4. replay-mode map transition

Everything else should be almost still.

No:

- page load fades
- floating card entrances
- bouncing buttons
- excessive hover animations
- confetti
- decorative motion

Respect `prefers-reduced-motion`.

This is a functional emergency console, not an interactive marketing page.

---

# 29. COPY MUST SOUND LIKE AN OFFICER'S CONSOLE

Use concrete wording.

Good:

`NO DATA — UNKNOWN STATUS`

`Population estimate: ~4,200`

`Investigate`

`CONFIDENCE DROPPED`

`New contradictory report received`

`PLAN QUALITY: HEURISTIC (FALLBACK)`

`SOLVE: 2.4s / 5.0s BUDGET`

Avoid vague marketing copy.

Do not use any banned terms from `DESIGN.md`.

Before shipping any frontend screen, grep the entire frontend for the banned terminology list.

The design spec explicitly requires this.

---

# 30. MAKE THE "WHY" PANEL DYNAMIC

Never hardcode:

> "Ranked #1 because it has many reports."

Generate the explanation from actual evidence.

Example:

`RANKED #1`

`3 corroborating reports`

`2 text · 1 satellite`

`Children + elderly reported`

`Road access: LOW`

`No update for 41 min`

This component must change when the underlying evidence changes.

---

# 31. REPLAY MODE MUST TELL A STORY

The 24-hour replay is not a video-player feature.

It should visually demonstrate:

`ZERO / FOG`

↓

first reports appear

↓

clusters emerge

↓

confidence develops

↓

disputed zones appear

↓

communication blackouts occur

↓

dark zones become visible

↓

imagery arrives

↓

priorities form

↓

resources move

↓

incidents resolve

The grey-to-information transition is the narrative.

The replay should make the core SHOONYA philosophy visible without requiring verbal explanation.

---

# 32. BUILD THE DATA GENERATOR AS A FIRST-CLASS DEVELOPMENT TOOL

Create a deterministic synthetic-data generator.

Requirements:

- fixed seed option
- scenario seed
- controllable report volume
- controlled duplicates
- controlled contradictions
- controlled dark zones
- controlled outage windows
- controlled imagery arrival times
- controlled resource scarcity
- controlled stress-test burst

The generator must be able to reproduce the exact same demo.

Do not depend on live LLM generation during the demo.

---

# 33. CREATE EXPLICIT DEMO SCENARIOS

At minimum:

### Scenario 01 — High-severity / low-confidence

Purpose:
prove severity ≠ confidence and priority floor.

### Scenario 02 — Duplicate flood of reports

Purpose:
prove volume damping.

### Scenario 03 — Contradictory school incident

Purpose:
prove dispute behavior.

### Scenario 04 — Dark high-population ward

Purpose:
prove silence is information.

### Scenario 05 — Satellite confirmation

Purpose:
prove asynchronous evidence upgrade.

### Scenario 06 — Satellite ambiguity

Purpose:
prove CV is evidence, not truth.

### Scenario 07 — Resource scarcity

Purpose:
prove optimization.

### Scenario 08 — Solver fallback

Purpose:
prove graceful degradation.

### Scenario 09 — Officer override

Purpose:
prove human authority.

### Scenario 10 — 500 reports / 30 seconds

Purpose:
prove ingestion resilience.

---

# 34. STRESS TEST SHOULD BE REAL

Do not visually fake the queue chart.

Actually enqueue 500 reports in 30 seconds.

Track:

- produced
- pending
- processing
- acknowledged
- failed
- retried
- completed

The dashboard should remain responsive.

Redis Streams supports consumer groups, pending-entry tracking, acknowledgement and recovery of stuck deliveries, which maps naturally to this requirement.

The correctness property is:

`reports received == reports eventually processed`

with delay allowed but silent loss not allowed.

---

# 35. OBSERVABILITY IS PART OF THE PRODUCT

Expose actual system values:

- queue depth
- processing rate
- ingestion-to-map latency
- NLP latency
- clustering latency
- confidence computation latency
- CV evidence latency
- solver duration
- fallback frequency
- pending reports
- failed / retried jobs

Do not display invented "healthy" percentages.

A system-health number should correspond to something measurable.

---

# 36. FAILURE STATES MUST BE DESIGNED, NOT PATCHED LATER

Every important dependency should have a visible degraded state.

Examples:

### STT unavailable

`TRANSLATION PENDING`

Original language remains visible.

### NLP worker overloaded

`PENDING TRIAGE: 37`

Raw reports remain accessible.

### Satellite unavailable

`VISUAL EVIDENCE: UNAVAILABLE`

Confidence still computed from available evidence.

### Solver timeout

`PLAN QUALITY: HEURISTIC (FALLBACK)`

### Zone dark

`NO DATA — UNKNOWN STATUS`

### Stale road closure

`ROAD STATUS STALE — RECONFIRM`

Never show a blank panel.

---

# 37. DO NOT OVERBUILD

Follow the Build-for-Real table.

Build the specified mechanisms.

Do not start building:

- LoRaWAN
- ESP32 mesh
- national-scale federation
- predictive disaster spread
- a giant authentication system
- enterprise admin features
- Kubernetes
- unnecessary microservices
- complex multi-tenancy
- full production-grade MLOps

The spec explicitly marks several of these as roadmap/out-of-scope.

---

# 38. FINAL QUALITY STANDARD

Before considering SHOONYA finished, ask:

### DATA

Does the data look like a disaster actually unfolding?

### GEOGRAPHY

Do locations, roads, settlements and resources make spatial sense?

### EVIDENCE

Can every important number be traced back to an actual evidence chain?

### ALGORITHM

Can the priority / confidence / clustering behaviors be demonstrated with explicit test cases?

### TRUST

Can an officer see why the system reached a conclusion?

### FAILURE

Can the system visibly degrade without hiding information?

### HUMAN CONTROL

Can an AI-generated recommendation be overridden?

### VISUAL DESIGN

Would the interface still look generic if the SHOONYA data were removed?

If yes, redesign the screen.

This directly follows the `DESIGN.md` self-check.

---

# 39. FIRST RESPONSE REQUIREMENT

Your first response must contain:

## A. "SPEC READ"

Confirm that you read both complete documents.

## B. "IMPLEMENTATION ORDER"

Provide a numbered task list matching:

1. Schema/API
2. Ingestion/queue
3. NLP
4. Clustering
5. Confidence/contradiction
6. Priority
7. MILP/fallback
8. Human approval
9. Dashboard/map/replay
10. CV
11. Stress-test/reverse-SOS/polish
12. Final design QA

## C. EACH TASK MUST HAVE

- objective
- exact scope
- inputs
- outputs
- tests / verification
- dependencies
- explicit "not included"

## D. DATA PLAN

Before implementation starts, define:

- synthetic disaster scenario
- geography model
- incident taxonomy
- source distribution
- duplicate strategy
- contradiction strategy
- dark-zone strategy
- satellite evidence strategy
- resource model
- replay timeline
- stress-test dataset

## E. RESEARCH NOTES

List the external technologies/models that need current-version verification before implementation.

Then STOP.

Do not create files.
Do not write code.
Do not scaffold.
Do not move to Task 1.

Wait for explicit approval.

---

# FINAL PRINCIPLE

**Do not optimize for "more features."**

Optimize for:

> **A believable crisis unfolding on the screen, with every recommendation traceable to evidence, every uncertainty visible, every failure recoverable, and every consequential decision remaining with the human officer.**

SHOONYA should feel like an operational instrument that happens to use AI, not an AI application wearing an emergency-response theme.