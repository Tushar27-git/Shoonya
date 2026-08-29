# SHOONYA — Architecture, Tech Stack & System Contract

## 1. Product Definition

**SHOONYA (शून्य)** is a closed-loop Crisis Intelligence and Decision Support System for the combined failure mode of:

- PS5: post-disaster information fog
- PS2: ground-zero communication blackout

The system converts fragmented, multilingual, contradictory and occasionally adversarial reports into structured evidence, uncertainty-aware priorities, resource recommendations and human-approved dispatch decisions.

Core principles:

1. Severity ≠ Confidence.
2. Disagreement and silence are signals.
3. AI recommends; humans decide.

The operational architecture is:

```text
Multi-channel observations
        ↓
Durable ingestion queue
        ↓
NLP / structured extraction
        ↓
Spatio-temporal + semantic clustering
        ↓
Confidence / contradiction / dark-zone engine
        ↓
Priority calculation
        ↓
Resource optimization
        ↓
Human approval
        ↓
Dispatch + reverse SOS
        ↓
Outcome feedback
```

Observability and audit operate across all layers.

---

## 2. Architecture Layers

### L1 — Multi-Channel Ingestion

Inputs:

- SMS/webhook
- web form
- simulated social text
- voice message
- radio transcript
- satellite/drone imagery upload

Required behavior:

- create an immutable raw-report/event record
- preserve source channel
- preserve original evidence
- normalize timestamps
- resolve location to the highest reliable precision
- place work on a durable queue
- expose queue depth and processing state

### Zone sensing-mode state

Each zone tracks channel status such as:

`LIVE` / `DARK`

When text/voice activity disappears for a configurable window:

- mark the zone dark
- preserve the last known contact time
- allow imagery to become the primary evidence source
- surface the dark-zone condition to L4/L5

### Vague locations

A phrase such as `near the old tree` must not be turned into a fake precise point.

Resolve to the coarsest reliable administrative/operational geometry and mark:

`location_precision = LOW`

Render as an approximate polygon/area where possible.

---

### L2 — Multilingual NLP Extraction

Input:

Raw text, including STT transcription when voice is used.

Potential implementation:

- IndicBERT-family / mBERT-class extraction
- or an LLM structured extractor with strict schema if faster and more reliable for the demo
- Whisper/faster-whisper or Bhashini for STT, subject to current API verification and credentials

Mandatory extracted fields:

```text
location
victim_count
vulnerable_present
hazard_type
urgency
micro_environment_tag
source_channel
raw_evidence_text
```

Micro-environment tags are the direct PS5↔PS2 bridge, for example:

- `ROOFTOP_STRANDED`
- `DROWNING_RISK`
- `DEBRIS_TRAPPED`
- `CRUSH_INJURY`

The extractor should not manufacture certainty that was absent from the source.

Null/unknown values must remain representable.

---

### L3 — Deduplication & Geospatial Clustering

Preferred method:

- HDBSCAN for spatio-temporal grouping
- Sentence Transformers / SBERT embeddings for semantic similarity

Current Sentence Transformers documentation supports embedding-based semantic similarity and cosine similarity as a standard path. Verify the selected model and API before implementation. 

Cluster severity formula:

```text
Cluster Severity Score = Σ(Report Weight) × log10(Report Count + 1)
```

The logarithmic term is mandatory.

Merge confidence thresholds:

```text
>= 0.85       auto-merge
0.55–<0.85    provisional merge + needs_review
< 0.55       separate incidents
```

Raw reports are never deleted during a merge.

Every incident cluster retains constituent report IDs and provenance so the cluster can be reversed.

---

### L4 — Contradiction-Aware Confidence Engine

Formula:

```text
Cᵢ = clip(
      b
      + wₛ·Sᵢ
      + w_g·Gᵢ
      + w_t·Tᵢ
      + w_v·Vᵢ
      − w_c·Kᵢ,
      0,
      1
    )
```

Where:

- `Sᵢ` = source/cross-channel corroboration
- `Gᵢ` = geospatial consistency
- `Tᵢ` = temporal consistency / recency
- `Vᵢ` = visual/sensor evidence
- `Kᵢ` = contradiction penalty
- `b` = baseline prior

Weights must be runtime configuration, not hardcoded constants.

Cross-channel corroboration must be materially more valuable than repeated same-channel duplication.

### Contradiction logic

When materially conflicting claims exist:

- do not average them
- set `dispute_flag = true`
- surface both claims and raw source text
- require verification / human attention

### Dark-zone logic

For a configured no-report window:

`NO DATA — UNKNOWN STATUS`

Evaluate alongside:

- population exposure
- telecom status
- time since last report
- available imagery

### Trust / abuse

Track:

- per-source reporting velocity
- source history / verification / corroboration

Use these to adjust evidence weighting or contradiction penalties; do not silently delete low-trust reports.

---

### L5 — CV Verification

Scope is intentionally constrained.

Build a small pretrained/lightly fine-tuned proof of concept using approximately 10–15 curated sample images:

- flooded
- collapsed/damaged
- undamaged control

Do not build a full change-detection training program for the hackathon.

### Asynchronous behavior

Initial confidence must be calculated without waiting for imagery.

Then:

```text
L4 confidence
visual_evidence = null
        ↓
CV finishes asynchronously
        ↓
visual_evidence populated
        ↓
confidence recomputed
```

Imagery is evidence, not absolute truth.

Suggested output framing:

```text
Satellite Evidence
Flood detected: YES
Estimated inundated area: 62%
Road accessibility: LOW
Confidence: 81%
```

Every model/output should retain source/model/version/timestamp metadata.

---

### L6 — Priority & Dispatch

#### Base urgency

```text
Uᵢ = w₁·Sᵢ
   + w₂·Vᵢ
   + w₃·log(1+Nᵢ)
   + w₄·Rᵢ
   + w₅·Aᵢ
```

Defaults:

```text
w₁ = 0.35  severity
w₂ = 0.25  vulnerability
w₃ = 0.20  victim count
w₄ = 0.10  recency
w₅ = 0.10  accessibility risk
```

#### Confidence modifier

```text
M(cᵢ) = c_min + (1 − c_min)·cᵢ
c_min = 0.4
```

#### Final priority

```text
Pᵢ = Uᵢ · M(cᵢ)
```

All weights and `c_min` are runtime-adjustable configuration.

### Critical property

At `cᵢ = 0`:

```text
M(0) = 0.4
```

Therefore low-confidence severe incidents remain visible and cannot be zeroed out by confidence.

---

## 3. Dispatch Optimization Contract

Sets:

- `I` = active incidents
- `R` = available resources

Decision variable:

`xᵣ,ᵢ ∈ {0,1}`

Served-demand fraction:

`yᵢ ∈ [0,1]`

Objective:

```text
max Σ Pᵢ·yᵢ
```

Constraints:

```text
yᵢ ≤ Σ aᵣ,ᵢ·xᵣ,ᵢ
Σᵢ xᵣ,ᵢ ≤ 1              ∀r
xᵣ,ᵢ ≤ availᵣ              ∀r,i
xᵣ,ᵢ ≤ feasibleᵣ,ᵢ         ∀r,i
tᵣ,ᵢ·xᵣ,ᵢ ≤ T_max          ∀r,i
```

The implementation may use OR-Tools CP-SAT or PuLP/CBC, subject to current official API verification.

### Solver fallback

Hard solve budget:

`3–5 seconds`

Fallback sequence:

```text
solver starts
   ↓
feasible / optimal solution within budget?
   ├─ yes → return solver result
   └─ timeout/failure
        ↓
best incumbent available?
   ├─ yes → return best incumbent
   └─ no
        ↓
greedy nearest-resource / highest-priority heuristic
```

UI state:

`PLAN QUALITY: HEURISTIC (FALLBACK)`

Reoptimization triggers:

- new high-priority incident
- resource availability change
- what-if request
- safety-net cadence

Where the solver supports it, use the prior solution as a warm start.

---

## 4. Routing Overlay

Hackathon scope:

- mock road network
- flood/damage overlays
- accessibility state
- basic travel-time estimates

Road closure observations must decay in reliability.

A sufficiently old closure should move to:

`ROAD STATUS STALE — RECONFIRM`

Do not treat an old closure observation as permanent truth.

---

## 5. L7 — Human Approval

Required flow:

```text
AI Recommendation
→ Evidence & Explanation
→ Officer Review
→ Approve / Modify / Reject
→ Dispatch
```

Server-side rule:

The actual resource-assignment operation must require explicit approval context, including the required approver identity/timestamp from the technical contract.

Audit log:

- append-only
- tamper-evident
- hash-chained table is sufficient

If a copilot exists:

`proposed_actions` is the most it can write to; it may never directly mutate `assigned_resources`.

---

## 6. L8 — Lifecycle, Reverse SOS, Feedback

Lifecycle:

```text
REPORTED
→ CORROBORATING
→ PRIORITIZED
→ VERIFIED
→ RESOURCE ASSIGNED
→ RESCUE IN PROGRESS
→ RESOLVED
```

Reversible transitions are explicit and must be validated server-side.

Examples:

- `RESOLVED → PRIORITIZED` after incomplete rescue evidence
- `RESOURCE ASSIGNED → PRIORITIZED` after reassignment

Every transition records a reason code.

### Reverse SOS

Mock notification is acceptable.

Example:

`Boat #3 dispatched to Ward 7 · ETA 15 min`

### Outcome feedback

Store:

- predicted victims rescued
- actual victims rescued
- predicted ETA
- actual ETA

Use this for measured calibration / evaluation.

Do not describe it as autonomous online learning.

---

## 7. API Contract

Required endpoints:

```text
POST /reports
GET  /incidents
GET  /incidents/{id}
POST /incidents/{id}/merge-review
POST /dispatch/plan
POST /dispatch/plan/what-if
POST /copilot/query          (optional)
WS   /ws/live-updates
```

The canonical incident schema must include the fields defined in `TECH_HANDOFF.md` §10, including:

- incident ID
- status
- location + precision + zone
- created/updated timestamps
- category
- micro-environment
- victim estimate
- vulnerability
- priority
- confidence
- confidence floor
- evidence summary
- assigned resources
- merge-review state
- trust state

Do not add or remove mandatory API-contract fields without logging it in `NOTE_TO_TEAM.md`.

---

## 8. Recommended Repository Structure

```text
shoonya/
├── backend/
│   ├── app/
│   │   ├── ingestion/
│   │   ├── nlp/
│   │   ├── clustering/
│   │   ├── confidence/
│   │   ├── cv/
│   │   ├── dispatch/
│   │   ├── approval/
│   │   ├── lifecycle/
│   │   ├── models/
│   │   └── main.py
│   ├── data/
│   └── tests/
├── frontend/
├── docker-compose.yml
├── TECH_HANDOFF.md
├── DESIGN.md
└── NOTE_TO_TEAM.md
```

Keep it flat unless a real need requires otherwise.

---

## 9. Tech Stack

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS for implementation utility, not for default visual design
- MapLibre GL JS preferred where open map rendering is sufficient
- ECharts or Recharts for the limited operational charts

Current MapLibre documentation describes GL JS as a WebGL-based TypeScript map library using vector-tile sources and style documents; the v6 line is ESM-based, so verify the exact installed version and Next.js integration before coding. citeturn987427search1turn987427search4

### Backend

- Python 3.12+
- FastAPI
- Pydantic v2

### Realtime

- FastAPI WebSockets
- Redis Streams for durable ingestion

Redis Streams consumer groups provide partitioned consumption and retain group state across consumer disconnects, which fits the queue/worker model for this demo. citeturn987427search8

### Workers

- RQ or Celery
- prefer RQ if Redis is already the queue backbone and no Celery-only feature is required

### NLP / AI

- Hugging Face Transformers where needed
- IndicBERT-family / mBERT-class extraction or an LLM structured extractor
- faster-whisper / Whisper or Bhashini for speech transcription
- Sentence Transformers for semantic embeddings

Sentence Transformers officially supports embedding generation and similarity calculation, including cosine similarity, which maps directly to the semantic-dedup requirement. citeturn987427search2

### Clustering

- HDBSCAN
- geospatial preprocessing around a defined spatial/temporal window

### Database

- PostgreSQL
- PostGIS for geographic queries
- Redis for streaming / optional cache

### Computer Vision

- PyTorch
- pretrained/lightly fine-tuned segmentation or classification model
- OpenCV where preprocessing is actually required

Select models from current Hugging Face model cards and verify license/input requirements before use.

### Optimization

- OR-Tools CP-SAT preferred
- PuLP/CBC acceptable alternative

Verify current official API and solver timeout/status behavior before implementation.

### Observability

- structured JSON logs
- per-stage latency metrics
- queue depth
- pending/retry counts
- solver duration
- fallback count

Grafana/Loki are optional only if time permits and only if they materially improve the demo; an in-app health strip is acceptable.

### Deployment

Single `docker-compose.yml`:

- Postgres
- Redis
- backend
- frontend

No Kubernetes.

---

## 10. External / Research Data Sources

Use these as references where appropriate:

- OpenStreetMap / Overpass for geographic objects and road context
- GHSL for population exposure structure
- Copernicus EMS for emergency mapping concepts and event/infrastructure products
- ISRO / NRSC for Indian earth-observation and flood-response references
- Sentinel / Earth-observation sources for CV research and imagery concepts
- authoritative disaster agencies for operational context

Keep reference data distinct from synthetic operational records.

---

## 11. Required Dataset

Build:

- 150–300 pre-generated reports
- deliberate duplicates
- deliberate contradictions
- multiple languages / code-switching
- 30–50 named wards/villages/landmarks
- 10–15 curated imagery samples
- several silent/dark zones
- 24-hour synthetic replay timeline
- 500 reports in 30 seconds stress-test dataset

The dataset must be deterministic and reproducible.

---

## 12. Correctness Tests

At minimum test:

1. `log10` severity dampening prevents low-quality report volume from beating high-quality low-volume evidence under the designed test conditions.
2. `M(0) = 0.4`.
3. High-severity / low-confidence incident remains visible above an appropriate low-severity / high-confidence request.
4. Merge is reversible with no raw-data loss.
5. 500-report burst produces no silent drops.
6. Solver timeout still produces a valid labeled plan.
7. Contradictions create `dispute_flag` and preserve conflicting raw evidence.
8. Dark zones are not rendered safe.
9. visual evidence can arrive asynchronously and recompute confidence.
10. no dispatch is possible without human approval.

---

## 13. Current Version Verification Record

Do not copy a version here from memory.

At implementation time record:

```text
Node / Next.js:
React:
Python:
FastAPI:
Pydantic:
Redis client:
HDBSCAN:
Sentence Transformers:
MapLibre GL JS:
OR-Tools:
Selected HF models:
Whisper / faster-whisper:
```

As of the current research pass, the official Next.js site lists Next.js 16.3.3 as Active LTS in its August 25, 2026 security release. Verify again immediately before installation because version numbers change. citeturn987427search6
