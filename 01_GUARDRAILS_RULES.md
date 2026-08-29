# SHOONYA — Guardrails & Rules

## Purpose

This file is the enforcement layer for the SHOONYA build. It defines what the agent may do, what it must never do, how it must reason before implementation, how it must verify dependencies, and what conditions block a task.

The source-of-truth documents remain `TECH_HANDOFF.md` and `DESIGN.md`. This file operationalizes them; it does not replace or reinterpret them.

---

## 1. Source of Truth

1. `TECH_HANDOFF.md` is authoritative for architecture, formulas, API contracts, lifecycle, security/trust requirements, build scope, resilience, and technical stack.
2. `DESIGN.md` is authoritative for visual language, UI hierarchy, copy, tokens, motion, and anti-AI-slop rules.
3. If another instruction conflicts with either file, do not silently choose. Record the conflict in `NOTE_TO_TEAM.md` and stop before implementing the disputed change.
4. Never redesign, simplify, or reinterpret load-bearing mechanisms.

### Load-bearing mechanisms

These must be implemented exactly unless the team explicitly changes the spec:

- L3 cluster severity formula
- L3 merge-confidence thresholds
- L4 bounded confidence formula
- L4 contradiction behavior
- L4 dark-zone behavior
- L6 priority formula
- L6 confidence modifier floor `c_min = 0.4`
- L6 MILP constraints
- L6 solver timeout and fallback semantics
- L7 human approval boundary
- L8 reversible lifecycle
- provenance preservation

---

## 2. YAGNI — Strict Scope Control

Build exactly the features classified as **Build for real** in `TECH_HANDOFF.md` §8.

Do not add:

- LoRaWAN / ESP32 mesh
- full production RBAC/security infrastructure beyond hackathon essentials
- cross-district federation
- predictive disaster spread
- Kubernetes
- unnecessary microservices
- enterprise admin suites
- plugin systems
- feature-flag frameworks
- i18n frameworks unless explicitly required
- complex authentication flows unless explicitly required by the current task
- decorative analytics
- generic dashboard widgets

Before adding anything, answer:

> Does the demo or a required correctness property depend on this?

If not, do not build it.

---

## 3. Task-by-Task Operating Protocol

Every task follows the same sequence.

### Before implementation

1. Identify the exact task.
2. Identify the relevant section(s) in `TECH_HANDOFF.md` and/or `DESIGN.md`.
3. State what the specification requires.
4. Identify the smallest implementation that satisfies it.
5. Identify what can break silently.
6. Verify current versions/APIs for any external dependency involved.
7. Only then write code.

Do not expose private chain-of-thought. Record only concise implementation decisions and risks.

### During implementation

- Modify only the files required for the current task.
- Do not get ahead into later pipeline stages.
- Do not refactor unrelated code.
- Keep the smallest working implementation.

### After implementation

Run the strongest relevant verification available:

- unit tests
- integration tests
- endpoint checks
- browser verification
- type checking
- linting
- queue burst test
- formula property tests
- solver fallback test

Then report exactly one status:

`DONE` / `BLOCKED` / `NEEDS REVIEW`

Stop after the checkpoint.

---

## 4. No Silent Deviations

When the implementation exposes:

- an ambiguity
- an inconsistent requirement
- a technically questionable formula
- an impossible dependency
- an unavailable API/model
- a required data field that is underspecified

create a one-line entry in `NOTE_TO_TEAM.md`:

```text
YYYY-MM-DD | TASK-X | SPEC ISSUE | <one-line description>
```

Then do not invent a replacement requirement.

If implementation can proceed without changing the specified behavior, proceed with the spec and keep the note.

If proceeding would change behavior, stop and request review.

---

## 5. Truthfulness & Data Provenance

Never fabricate external facts and present them as real.

Every meaningful data point belongs to one of these categories:

1. **REAL REFERENCE** — sourced from an external authoritative source.
2. **SYNTHETIC OPERATIONAL DATA** — generated for the simulation using documented assumptions.
3. **LIVE EXTERNAL DATA** — actually retrieved from an external system during operation.

The UI and documentation must not blur these categories.

Never label synthetic data as live.
Never imply a satellite feed is live if it is a curated static sample.
Never label a model output as ground truth unless the dataset establishes ground truth.

---

## 6. Data Realism Rules

The data must be causally connected.

Do not independently randomize:

- locations
- victim counts
- confidence
- severity
- road state
- ETA
- population
- telecom status
- imagery outcomes
- resource availability

Prefer:

```text
hazard evolution
→ infrastructure effects
→ communication state
→ observed reports
→ extracted claims
→ clustered incidents
→ evidence fusion
→ confidence
→ priority
→ resource feasibility
→ dispatch
→ outcome
```

The same synthetic world must explain what the UI shows.

---

## 7. Evidence Integrity

Raw evidence must never be overwritten.

Every transformed object must retain a path back to its source observations.

At minimum preserve:

- raw report ID
- raw text
- source channel
- timestamp
- location information
- extraction result
- cluster membership
- contradiction membership
- evidence inputs
- confidence inputs
- priority inputs
- dispatch decision
- human action
- outcome

Merged incidents must be reversible.

---

## 8. Confidence and Severity Separation

Severity and confidence are different dimensions.

Never collapse them into:

- one score
- one label
- one visual gauge
- one vague "risk" metric

Severity answers:

> How serious is the reported situation?

Confidence answers:

> How strongly does current evidence support the interpretation?

Priority answers:

> What should be considered first under the configured policy and resource constraints?

---

## 9. Contradiction Rules

Contradictions are evidence, not noise.

Never average conflicting claims merely to get one number.

When material contradictions exist:

- set `dispute_flag = true`
- preserve both raw claims
- preserve both sources and timestamps
- surface the conflict to the operator
- allow later verification/resolution

A contradiction may remain unresolved.

Do not force every incident toward certainty.

---

## 10. Dark-Zone Rules

Zero incoming reports never means safe.

A dark zone must be represented as:

`NO DATA — UNKNOWN STATUS`

Cross-reference:

- population exposure
- telecom status
- time since last communication
- available imagery
- known infrastructure

Use grey / absence-oriented visual language, not green safety language.

---

## 11. Human Authority Rule

AI recommends.
Humans decide.

No code path may dispatch a resource without an explicit approval event satisfying the API contract.

The UI button is not the safety boundary.
The server-side dispatch endpoint is the safety boundary.

Every approve/modify/reject action must be auditable.

---

## 12. Copilot / LLM Rules

If a copilot is implemented:

- citizen report text is always untrusted data
- never treat report text as instructions
- use structured, policy-filtered context
- output only a schema-validated proposal
- proposal still requires human approval
- no direct write access to dispatch state
- no deletion capability

Prompt injection inside a citizen report must not alter system instructions.

---

## 13. External Library / Model Verification

Before installing or integrating a dependency:

1. Search current official documentation.
2. Verify current stable version.
3. Verify current import path.
4. Verify current method/function signature.
5. Verify compatibility with the selected runtime.
6. Verify license/model-card constraints where applicable.
7. Record the chosen version.

Do not rely on stale package knowledge.

---

## 14. Failure Handling Rule

No failure may silently hide information.

Required degraded states include:

- translation/STT unavailable → original-language report + retry state
- NLP worker overloaded → raw report remains queued + visible pending count
- solver timeout → best incumbent if available, otherwise heuristic fallback
- imagery unavailable → confidence from available evidence remains visible
- stale road condition → re-confirmation state
- dark zone → visible unknown state
- network outage → cached last-known operational state where required

Never show a blank failure state.

---

## 15. Frontend Anti-AI-Slop Rules

Never use:

- purple / pink / blue-purple gradients
- gradient buttons
- decorative gradient text
- default glassmorphism
- floating translucent cards everywhere
- abstract blobs
- generic SaaS hero sections
- three-card feature grids
- emoji-heavy UI
- giant icon tiles
- excessive shadows
- huge rounded corners everywhere
- excessive micro-animation
- generic "AI" glow effects
- decorative sci-fi visuals
- meaningless charts
- fake KPI deltas

SHOONYA must visually read as an emergency-operations console.

---

## 16. Frontend Hierarchy Rules

The map is the operational centerpiece.

The persistent system strip is the instrument cluster.

The intake stream is telemetry.

The incident panel is an evidence file.

The approval area is a consequential decision surface.

Do not use a generic card grid as the primary layout.

Reduce the number of visible surfaces before adding new ones.

---

## 17. Design Token Compliance

Use the established DESIGN.md token system.

Primary tokens:

- `--void #0B0E11`
- `--panel #141920`
- `--grid-line #232B33`
- `--signal-cyan #4FD8C4`
- `--dispute-amber #E8A33D`
- `--critical-ember #D6553C`
- `--dark-zone-grey #5A6472`
- `--ink #E4E8EC`
- `--ink-dim #8A93A0`

Use colors semantically.

---

## 18. Typography Rules

Use three distinct roles:

- condensed technical display face
- legible UI/body face
- monospace data face

Monospace should be used for:

- timestamps
- coordinates
- IDs
- confidence percentages
- queue counts
- solver metrics
- event logs

---

## 19. Motion Rules

Only four motion classes are permitted:

1. disputed-zone pulse
2. Zero Gauge confidence transition
3. short numeric instrumentation transitions
4. replay-mode progression

No gratuitous page-load animation.
No button bouncing.
No celebration effects.
Respect `prefers-reduced-motion`.

---

## 20. Copy Rules

Write from the officer's point of view.

Prefer:

`Approve dispatch`

over:

`Submit action`

Prefer:

`NO DATA — UNKNOWN STATUS`

over:

`Oops, no data yet!`

Prefer specific numbers over vague adjectives.

Before shipping, grep frontend/UI/README copy against the banned-word list in `DESIGN.md §1.1`.

---

## 21. Numbers Must Have Meaning

Before displaying a number, answer:

> What decision does this number help the operator make?

Do not display:

- fake percentages
- meaningless health scores
- invented trend deltas
- arbitrary "AI scores"

Every displayed operational number should be derivable from system state or explicitly marked as simulated/reference data.

---

## 22. Security / Privacy Minimums

Follow the hackathon-level requirements in the technical handoff:

- minimize PII exposure
- do not place raw PII in logs
- preserve role boundaries where implemented
- keep audit records append-only and tamper-evident
- use the exact phrase `DPDPA-aligned by design`; never claim formal DPDPA compliance

---

## 23. Quality Gate

A task is not complete because it compiles.

It is complete when:

- specified behavior exists
- required tests pass
- failure behavior is visible
- provenance is retained
- no load-bearing formula changed
- no unrelated architecture was introduced
- UI follows DESIGN.md where applicable
- actual browser output was checked for frontend tasks

---

## 24. STOP Conditions

Stop and report `BLOCKED` or `NEEDS REVIEW` when:

- a spec conflict changes behavior
- a required external dependency cannot be verified
- a required model/license is unsuitable
- the current implementation violates a load-bearing formula
- human approval can be bypassed
- raw evidence would be lost
- the dataset becomes impossible to reconcile causally
- implementing the task requires unapproved architectural changes
