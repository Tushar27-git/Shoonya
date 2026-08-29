# SHOONYA — DESIGN OVERRIDE / ANTI-AI-SLOP MASTER PROMPT

This is a **design directive**, not a request for decorative polish.

The current SHOONYA frontend is visually weak, generic, congested, and too close to the visual patterns produced by AI-generated dashboard templates.

Your job is to **redesign the frontend as a serious emergency-operations instrument** while preserving the architecture, data model, formulas, states, workflow, and functional requirements already defined in `TECH_HANDOFF.md` and `DESIGN.md`.

Do NOT redesign the product concept.

Do NOT redesign the backend architecture.

Do NOT change formulas.

Do NOT invent features.

Do NOT add decorative UI just to make the screen look "modern."

You are redesigning **how the existing system communicates information to a human operator.**

---

# 1. READ BEFORE TOUCHING THE FRONTEND

Before changing a single frontend file:

1. Read `TECH_HANDOFF.md` completely.
2. Read `DESIGN.md` completely.
3. Inspect the entire existing frontend.
4. Inspect the current screenshots/browser rendering.
5. Identify what currently makes the interface look generic, AI-generated, congested, or amateur.
6. Identify what information actually matters operationally.
7. Map the information hierarchy before changing layout.

Do not start by editing CSS.

Do not start by adding components.

Do not start by installing a UI library.

First understand the existing product.

---

# 2. DESIGN MINDSET

Use the following design philosophies as **reference frameworks**, not as excuses to overwrite SHOONYA's design specification:

- Impeccable
- Taste
- Anthropic Frontend Design
- production-grade information architecture
- command-and-control / mission-control interfaces
- aviation / emergency dispatch consoles
- geospatial intelligence interfaces
- technical instrumentation
- editorial information hierarchy
- restrained industrial software

If the repository already contains these skills, read and use them.

Look for:

- `impeccable`
- `taste`
- `redesign`
- `frontend-design`
- `design-audit`
- `web-design-guidelines`
- similar installed skills

If a suitable skill is installed locally, use its methodology rather than approximating it from memory.

Do not merely mention these skills in the final response.

Actually apply their principles.

---

# 3. THE CORE VISUAL GOAL

SHOONYA should feel like:

> **A real emergency operations console built by a small elite product-design team.**

It should NOT feel like:

- a SaaS admin template
- a Tailwind starter
- a startup landing page
- a cybersecurity dashboard cliché
- an AI-generated analytics dashboard
- a Figma community dashboard
- a Notion clone
- a Linear clone
- a Stripe clone
- a "futuristic AI" interface
- a generic dark-mode dashboard

The desired emotional response is:

**calm → precise → serious → information-dense → trustworthy → operational**

Not:

**flashy → futuristic → overly animated → neon → decorative → "AI".**

---

# 4. DO NOT TRUST THE CURRENT UI

Assume the current implementation is wrong until proven otherwise.

Perform a visual audit before redesigning.

Look specifically for:

- excessive cards
- card-inside-card layouts
- too many borders
- excessive rounded corners
- excessive padding
- weak hierarchy
- inconsistent spacing
- giant headings
- oversized numbers
- decorative icons
- generic status badges
- unnecessary pills
- excessive whitespace in some areas
- cramped information in others
- repeated labels
- low-value widgets
- charts that do not answer operational questions
- weak map hierarchy
- map competing with panels
- panels competing with each other
- too many colors
- excessive cyan
- excessive red
- typography without hierarchy
- identical font treatment for everything
- UI that resembles a component library demo

Then fix the **highest-impact structural problems first**.

Do not polish low-level details while the information architecture is still wrong.

---

# 5. DESIGN FROM INFORMATION PRIORITY, NOT COMPONENT COUNT

Before designing a screen, classify every visible item as:

### PRIMARY

The operator must notice this immediately.

Examples:

- map
- critical incidents
- disputed zones
- dark zones
- system status
- current dispatch state

### SECONDARY

Important when investigating something.

Examples:

- evidence
- confidence factors
- source reports
- resource availability
- route status
- solver output

### TERTIARY

Useful but not continuously prominent.

Examples:

- timestamps
- metadata
- technical IDs
- processing details
- historical information

### HIDDEN UNTIL NEEDED

Do not permanently occupy visual space.

Examples:

- full raw report
- complete audit trail
- verbose explanations
- advanced details

Every screen must have a clear visual hierarchy:

**one primary focal point → several secondary layers → supporting detail.**

Do not make every component visually loud.

---

# 6. DESIGN THE MAP AS THE CENTER OF GRAVITY

The map is not a card on the dashboard.

The map IS the operational workspace.

It should visually dominate the interface.

Around it, arrange supporting instruments.

Do not place six equally sized cards beside it and call that a dashboard.

The map should provide:

- geographic context
- incident density
- priority
- uncertainty
- dark zones
- disputed areas
- road accessibility
- resource positions
- routes where relevant

Use overlays sparingly.

Do not turn the map into a multicolored Christmas tree.

---

# 7. COMMAND-CONSOLE COMPOSITION

Prefer a composition resembling:

```text
┌──────────────────────────────────────────────────────────────────┐
│ SYSTEM STATUS / QUEUE / INCIDENTS / DISPUTED / DARK / SOLVER   │
├──────────────┬─────────────────────────────────┬─────────────────┤
│ LIVE INTAKE  │                                 │                 │
│              │                                 │                 │
│ report       │                                 │ INCIDENT        │
│ report       │             MAP                 │ DETAIL /        │
│ report       │                                 │ EVIDENCE        │
│ report       │                                 │                 │
│              │                                 │                 │
├──────────────┴─────────────────────────────────┴─────────────────┤
│ optional contextual instrument / replay / dispatch / evidence   │
└──────────────────────────────────────────────────────────────────┘
```

This is a structural reference, not a mandatory pixel-perfect layout.

The important idea is:

**map first, instruments around it.**

Do not create a conventional "sidebar + header + twelve cards" dashboard.

---

# 8. DESIGN WITH FEWER, BETTER SURFACES

Reduce the number of containers aggressively.

Prefer:

- one large map surface
- one ingestion rail
- one contextual incident panel
- a small number of instrument strips
- thin dividers
- typographic hierarchy

over:

- dozens of cards
- nested cards
- floating cards
- cards containing miniature cards
- decorative boxes around every number

A piece of information does not need a card simply because it exists.

Use spacing, alignment, typography and dividers to create structure.

---

# 9. SQUARE / INDUSTRIAL GEOMETRY

Honor `DESIGN.md`.

This is an operations interface.

Default geometry should be:

- 0–2 px radius for primary panels
- tight corners
- hairline borders
- disciplined spacing
- rectangular controls
- deliberate alignment

Use 6–8 px radius only where the specification explicitly allows it, such as:

- approval modal
- reverse-SOS toast
- similarly human-facing transient elements

Do not turn every control into a pill.

Do not use giant 16–24 px corner radii.

---

# 10. COLOR DISCIPLINE

Use SHOONYA's existing tokens.

Do not replace them with a new palette.

Core palette:

```text
--void          #0B0E11
--panel         #141920
--grid-line     #232B33
--signal-cyan   #4FD8C4
--dispute-amber #E8A33D
--critical-ember #D6553C
--dark-zone-grey #5A6472
--ink           #E4E8EC
--ink-dim       #8A93A0
```

Color is semantic, not decorative.

Use cyan for:

- healthy signal
- corroborated / stronger evidence
- active system state

Use amber for:

- dispute
- attention
- review required
- heuristic fallback

Use ember for:

- critical severity

Use grey for:

- dark zone / unavailable information

Do not add six additional accent colors because the dashboard "needs more visual interest."

The scarcity of color is part of the visual language.

---

# 11. ABSOLUTELY NO GENERIC AI VISUAL LANGUAGE

Do not use:

- purple gradients
- blue-purple gradients
- pink gradients
- glossy buttons
- glassmorphism everywhere
- giant translucent cards
- gradient blobs
- glowing borders
- excessive neon
- floating particles
- sci-fi hologram effects
- decorative grid backgrounds
- abstract AI imagery
- giant glowing circles
- gradient text
- ornamental "AI" motifs

Do not try to communicate intelligence through visual effects.

SHOONYA should look intelligent because its information architecture is intelligent.

---

# 12. TYPOGRAPHY IS A MAJOR PART OF THE DESIGN

Use three clearly differentiated typographic roles.

### DISPLAY

Archivo / Barlow Condensed or an equivalent approved condensed grotesk.

Use for:

- major section labels
- incident identifiers
- instrument titles
- important operational headings

### BODY

Public Sans / IBM Plex Sans or equivalent.

Use for:

- descriptions
- labels
- actions
- explanatory copy

### DATA

IBM Plex Mono / JetBrains Mono or equivalent.

Use for:

- timestamps
- coordinates
- incident IDs
- percentages
- queue counts
- solver duration
- telemetry
- event log
- technical values

Never style all text the same.

Numbers should visibly look like instrumentation.

---

# 13. REMOVE "UI NOISE"

Audit every component.

Ask:

> "Does this help an officer decide, investigate, understand uncertainty, or act?"

If not, remove it.

Do not keep a component because it makes the screen feel "full."

Do not add:

- decorative KPI cards
- arbitrary trend arrows
- fake percentage changes
- meaningless charts
- decorative iconography
- "AI confidence" labels that duplicate existing information
- repeated summaries
- redundant badges

YAGNI applies to design as strongly as it applies to backend architecture.

---

# 14. SEVERITY AND CONFIDENCE MUST BE VISUALLY DISTINCT

This is one of the most important SHOONYA design rules.

Never create a single large "score" that mixes:

- severity
- confidence
- priority

Instead clearly separate:

### SEVERITY

"What could happen / how serious is the reported situation?"

### CONFIDENCE

"How strongly is the available evidence supporting this interpretation?"

### PRIORITY

"What should the system consider first under the current configuration?"

Use different visual treatments.

The Zero Gauge belongs to confidence.

Do not use a generic circular percentage widget for every metric.

---

# 15. ZERO GAUGE — MAKE IT ICONIC, NOT GIMMICKY

The Zero Gauge is SHOONYA's signature visual instrument.

It should feel like an actual piece of instrumentation.

Requirements:

- circular
- restrained
- technical
- readable at small sizes
- starts at zero
- fills toward 1.0
- numeric value remains visible
- subtle functional gradient only inside the gauge
- smooth transition when confidence changes

Do not:

- surround it with decorative glows
- add sparkles
- make it huge everywhere
- animate it constantly

It should become recognizable through consistency.

---

# 16. INCIDENT DETAIL SHOULD FEEL LIKE AN EVIDENCE FILE

When an officer opens an incident, do not present a generic card stack.

Structure the panel as an investigative hierarchy.

Suggested order:

```text
INCIDENT ID / ZONE / STATUS

SEVERITY                  CONFIDENCE
CRITICAL                  [ZERO GAUGE]

MICRO-ENVIRONMENT
ROOFTOP STRANDED

CURRENT PRIORITY
#01

WHY THIS IS RANKED HERE
...

EVIDENCE
────────────────────
06:14  SMS
06:17  RADIO
06:19  VOICE
06:24  SATELLITE

CONTRADICTION
────────────────────
CLAIM A             CLAIM B
...

OPERATIONAL STATUS
ROAD ACCESS: LOW
RESOURCE: BOAT-03
ETA: 15 MIN

APPROVAL
[APPROVE] [MODIFY] [REJECT]
```

This is a reference hierarchy.

Use actual data from the backend.

Do not hardcode the example content.

---

# 17. RAW EVIDENCE SHOULD FEEL RAW

Do not turn every report into a polished AI sentence.

Show the original report.

Preserve:

- language
- wording
- imperfect grammar
- timestamp
- source
- extraction state

The system becomes believable when the operator can see:

**raw signal → interpretation → cluster → evidence → decision**

rather than only seeing the final AI summary.

---

# 18. CONTRADICTIONS NEED VISUAL SPACE

A contradiction should not merely be a badge.

Create a distinct evidence state.

Example:

```text
DISPUTED

CLAIM A
"School fully flooded.
10 children trapped."

SOURCE: SMS
06:14

VS.

CLAIM B
"Water only on road.
School accessible."

SOURCE: RADIO
06:17
```

Use amber sparingly.

The contradiction itself should create the visual tension.

Do not use animated flashing warnings.

The disputed marker's pulse is sufficient.

---

# 19. DARK ZONES SHOULD FEEL QUIET, NOT EMPTY

A dark zone is a meaningful absence of information.

It should visually recede rather than scream.

Use:

```text
NO DATA
UNKNOWN STATUS

POPULATION ~4,200
LAST REPORT 02:17 AGO
TELECOM: OFFLINE

INVESTIGATE
```

The grey hollow-ring map marker should communicate absence.

Do not make dark zones green.

Do not make them bright red merely because they are uncertain.

---

# 20. THE INGESTION FEED SHOULD LOOK LIKE TELEMETRY

No avatars.

No social-media layout.

No profile images.

No cards for every report.

No hearts.

No reactions.

No rounded social-feed bubbles.

Make it resemble:

- radio dispatch
- server logs
- telemetry
- operational intake

Example:

```text
06:14:02  SMS      Ward 07          EXTRACTED
06:14:05  VOICE    Ward 07          PENDING
06:14:07  RADIO    Bridge East      CLUSTERED
06:14:11  SOCIAL   School Road      EXTRACTED
```

Dense but readable.

---

# 21. HEADER = INSTRUMENT CLUSTER

Do not make the header a branded navbar.

The top strip should function like cockpit instrumentation.

Show only meaningful system values:

```text
QUEUE       184
ACTIVE      47
DISPUTED    03
DARK        05
SOLVER      READY
INGEST→MAP  11.8s
```

Use monospace.

Keep it compact.

The operator should understand system condition in seconds.

---

# 22. SOLVER STATUS MUST LOOK TECHNICAL, NOT MARKETING-LIKE

Use:

`PLAN QUALITY: OPTIMAL`

or:

`PLAN QUALITY: HEURISTIC (FALLBACK)`

and:

`SOLVE: 2.4s / 5.0s BUDGET`

Do not write:

- "Smart Plan Ready"
- "AI Optimized"
- "Best Route"
- "Intelligent Allocation"

Use the actual operational language from the specification.

---

# 23. CHARTS MUST EARN THEIR SPACE

Only show charts when they communicate an operational behavior.

The queue-depth chart should answer:

> Is the system absorbing the incoming burst?

The graph should visibly show:

`spike → queue growth → worker processing → drain`

Do not add:

- generic line charts
- fake analytics
- arbitrary trend percentages
- ornamental mini charts

One useful chart is better than six meaningless ones.

---

# 24. MAP MARKERS MUST FEEL LIKE AN OPERATIONAL SYMBOL SET

Create a coherent marker language.

NORMAL:
small cyan dot.

DISPUTED:
amber marker + restrained pulse.

DARK:
grey hollow ring.

CRITICAL:
ember marker + priority rank.

Do not use:

- random map-pin icons
- emoji
- giant circular bubbles
- cartoon icons
- Google Maps-style colorful markers

Every symbol should look as though it belongs to the same operational system.

---

# 25. ICONS MUST BE RESTRAINED

Use icons only when they improve recognition.

Prefer:

- simple line icons
- technical symbols
- consistent stroke weight

Avoid:

- colorful illustrations
- giant icons above headings
- rounded gradient icon tiles
- emoji
- decorative icon collections

A label should not need an icon merely because the card looks empty.

---

# 26. NO "DASHBOARD CARD" HABIT

This is extremely important.

Do not solve every design problem with:

```text
[ rounded card ]
[ icon ]
[ title ]
[ number ]
```

That pattern is the source of much of the current AI-generated look.

Instead use:

- alignment
- typography
- dividers
- whitespace
- horizontal rules
- vertical rhythm
- shared baselines
- contextual emphasis

The interface should feel **composed**, not assembled from cards.

---

# 27. SPACING SYSTEM

Use the 8 px base grid.

But do not interpret that as "everything needs huge whitespace."

Use:

- 4 px for micro relationships where necessary
- 8 px as base
- 16 px for related groups
- 24 px for section separation
- 32 px for major structural separation

Keep related data close.

Separate unrelated concepts strongly.

Avoid both:

- cramped everything
- giant empty spaces

---

# 28. VISUAL RHYTHM

Create repeated structures.

For example:

```text
LABEL
DATA

LABEL
DATA

LABEL
DATA
```

or:

```text
SOURCE     TIME        STATUS
SMS        06:14       EXTRACTED
VOICE      06:16       PENDING
RADIO      06:17       CLUSTERED
```

Consistent rhythm makes a dense interface calm.

---

# 29. RESPONSIVE DESIGN

Do not simply stack desktop cards vertically on mobile.

Preserve the hierarchy.

Desktop:

**map → intake → detail**

Tablet:

**map → detail / intake**

Mobile:

**status → map → selected incident → evidence**

The map remains central.

Do not create a mobile version that becomes an unrelated generic list application.

---

# 30. MOTION

Follow `DESIGN.md`.

Motion should communicate state.

Allowed:

- disputed marker pulse
- Zero Gauge transition
- small number updates
- replay mode

Everything else remains restrained.

No:

- page-load animations
- floating entrance animations
- bouncing buttons
- dramatic modal transitions
- decorative parallax
- hover effects everywhere
- confetti

Respect `prefers-reduced-motion`.

---

# 31. REAL DATA FIRST

The UI must be driven by actual application data.

Do not create fake placeholder values such as:

`87%`

`+23%`

`142 active`

`99.9% uptime`

just because a component needs content.

Every displayed value should answer:

> Where does this number come from?

If it does not come from the system, omit it or explicitly label it as simulated demo data.

---

# 32. DEMO DATA SHOULD FEEL OPERATIONAL

The design becomes much stronger when the content is credible.

Examples:

Instead of:

`Incident #1 — High Priority`

use:

`INC-014`

`WARD 07`

`ROOFTOP STRANDED`

`SEVERITY CRITICAL`

`CONFIDENCE 0.61`

`NO UPDATE 41 MIN`

Instead of:

`Multiple reports`

use:

`7 REPORTS · 3 CHANNELS`

Instead of:

`High risk`

use:

`ROAD ACCESS: LOW`

Numbers should communicate the situation.

---

# 33. DESIGN FOR THE THREE CORE STATES

Every major UI should be designed around:

### KNOWN

Clear evidence.

### DISPUTED

Conflicting evidence.

### UNKNOWN

Information gap / dark zone.

This should produce three different visual rhythms without creating three completely different interfaces.

---

# 34. APPROVAL SHOULD FEEL SERIOUS

The human approval action is consequential.

Do not gamify it.

The approval area should feel visually distinct through:

- stronger hierarchy
- more deliberate spacing
- restrained emphasis
- clear consequences

Example:

`APPROVE DISPATCH`

`BOAT-03 → WARD 07`

`ETA 15 MIN`

`3 supporting reports · satellite evidence available`

Then:

`APPROVE`

`MODIFY`

`REJECT`

No confetti.

No success explosion.

No giant green checkmark.

---

# 35. DESIGN THE EMPTY / DEGRADED STATES

Do not leave empty areas looking like broken UI.

Examples:

### NO DATA

`NO DATA — UNKNOWN STATUS`

`POPULATION ~4,200`

`TELECOM OFFLINE`

`INVESTIGATE`

### NLP PENDING

`PENDING TRIAGE`

`RAW REPORT PRESERVED`

### SATELLITE UNAVAILABLE

`VISUAL EVIDENCE UNAVAILABLE`

`CONFIDENCE COMPUTED FROM AVAILABLE SIGNALS`

### SOLVER FALLBACK

`PLAN QUALITY: HEURISTIC (FALLBACK)`

The interface should remain useful even when degraded.

---

# 36. DESIGN THE REPLAY AS A VISUAL NARRATIVE

Replay should visually demonstrate SHOONYA's philosophy.

Start near:

**ZERO INFORMATION**

Then gradually reveal:

- reports
- clusters
- priorities
- disputes
- dark zones
- satellite evidence
- routes
- assignments
- resolutions

Do not make it feel like a video player.

The scrubber should look like an operational timecode instrument.

---

# 37. ACCESSIBILITY IS PART OF THE VISUAL SYSTEM

Never rely on color alone.

For example:

DISPUTED = amber + shape + label + pulse

DARK = grey + hollow ring + label

CRITICAL = ember + larger marker + rank

Ensure:

- readable contrast
- keyboard focus
- reduced motion
- logical tab order
- visible focus states
- accessible names

Do not sacrifice usability for aesthetic minimalism.

---

# 38. FRONTEND LIBRARIES — USE THEM AS TOOLS, NOT AS THE DESIGN

You may use mature libraries such as:

- Radix primitives
- shadcn/ui primitives where useful
- Lucide or another restrained icon set
- MapLibre GL
- ECharts / Recharts
- TanStack utilities
- motion primitives only where justified
- established accessibility primitives

But:

**the library must disappear into SHOONYA's visual language.**

Do not use a library's default theme.

Do not let shadcn defaults become the entire visual identity.

Do not blindly import complete dashboard templates.

Use primitives.

Customize them.

Remove what SHOONYA does not need.

YAGNI applies to dependencies too.

Before adding a dependency:

1. Check whether the existing stack already solves it.
2. Check the current official documentation/version.
3. Ask whether it materially improves the product.
4. If not, do not install it.

---

# 39. DO NOT REBUILD THE WORLD

You are NOT being asked to create:

- a design system website
- a giant component library
- dozens of reusable abstractions
- theme engines
- animation frameworks
- configuration systems
- a separate design playground

Build only what SHOONYA actually needs.

Prefer:

**10 excellent components**

over:

**60 generic components.**

---

# 40. USE REAL BROWSER ITERATION

For each major screen:

1. Render it.
2. Inspect it visually.
3. Compare hierarchy.
4. Identify the three biggest visual problems.
5. Fix those.
6. Render again.
7. Repeat.

Do not assume the code "looks good" because the JSX/CSS is clean.

Judge the actual browser output.

---

# 41. DESIGN REVIEW CHECKLIST

Before considering the frontend finished, evaluate the screen using these questions.

### Hierarchy

Can I identify the most important thing within 1 second?

### Density

Is the screen information-rich without becoming cluttered?

### Alignment

Do numbers, labels and controls share meaningful baselines?

### Typography

Can I distinguish prose from instrumentation immediately?

### Color

Does every color communicate a clear operational state?

### Map

Does the map remain the center of attention?

### Confidence

Can I distinguish confidence from severity instantly?

### Evidence

Can I trace a major decision back to evidence?

### Uncertainty

Does unknown information look unknown rather than safe?

### Trust

Can I understand why the system recommended something?

### Action

Can the officer identify the next useful action?

### Genericness

Would this still look like the same UI if the data were replaced by finance / sales / analytics data?

If yes:

**the design is not specific enough to SHOONYA.**

---

# 42. ANTI-AI-SLOP FINAL AUDIT

Before shipping any screen, explicitly search for:

- purple gradients
- generic SaaS cards
- unnecessary pills
- glassmorphism
- decorative icons
- excessive shadows
- over-animation
- generic KPI cards
- repeated components
- meaningless charts
- huge headings
- giant rounded panels
- emoji
- marketing copy
- vague AI terminology
- excessive cyan
- fake data
- duplicated information

Then run the banned-word check from `DESIGN.md`.

Do not ship if any banned copy remains.

---

# 43. CRITICAL RULE — DO NOT CONFUSE "PREMIUM" WITH "DECORATED"

A premium interface is not achieved by:

- gradients
- glow
- blur
- shadows
- oversized typography
- rounded cards
- animations

SHOONYA should look premium through:

- proportion
- hierarchy
- typography
- spacing
- restraint
- consistency
- precision
- information design
- excellent micro-interactions
- believable data

The design should feel expensive because it is **considered**, not because it is flashy.

---

# 44. CRITICAL RULE — LESS UI, MORE INFORMATION

When deciding between:

A.
`more components + more decoration`

and

B.
`fewer components + stronger hierarchy`

choose B.

When deciding between:

A.
`another card`

and

B.
`a divider + typography + spacing`

choose B unless the card meaningfully creates a new interaction surface.

When deciding between:

A.
`animation`

and

B.
`clear information hierarchy`

choose B.

When deciding between:

A.
`beautiful abstraction`

and

B.
`actual operational data`

choose B.

---

# 45. DO NOT HIDE THE COMPLEXITY — ORGANIZE IT

SHOONYA is a complex system.

Do not simplify it into a generic clean dashboard merely because "minimalism" looks good.

Instead:

**organize the complexity.**

The operator should progressively see:

```text
SIGNAL
  ↓
REPORT
  ↓
EXTRACTION
  ↓
CLUSTER
  ↓
EVIDENCE
  ↓
CONFIDENCE
  ↓
PRIORITY
  ↓
RESOURCE
  ↓
HUMAN DECISION
```

The visual architecture should make that chain understandable.

That is more important than decoration.

---

# 46. WHEN YOU SEE SOMETHING UGLY, DO NOT PATCH IT

Do not fix bad design by adding another wrapper.

Do not fix weak hierarchy by making everything larger.

Do not fix emptiness with more cards.

Do not fix blandness with gradients.

Do not fix clutter by shrinking everything.

Instead ask:

**What information relationship is wrong?**

Then fix the underlying composition.

---

# 47. IMPLEMENTATION PROCESS FOR EACH FRONTEND SCREEN

For every screen/component:

### BEFORE CODING

Write internally:

1. What is this screen trying to help the officer do?
2. What is the primary visual element?
3. What information is secondary?
4. What can remain hidden until interaction?
5. Which DESIGN.md rules apply?
6. Which existing anti-patterns must be removed?
7. Which data actually drives this UI?
8. What happens in known / disputed / unknown / degraded states?
9. What is the smallest interface that communicates this correctly?

Do not expose hidden chain-of-thought.

Instead record only the resulting design decisions when useful.

### DURING CODING

Build the smallest implementation.

### AFTER CODING

Render it.

Critique it.

Fix the highest-impact issue.

Render again.

Do not stop after the first pass.

---

# 48. DO NOT BREAK THE PRODUCT WHILE REDESIGNING IT

All existing behavior must remain intact.

Do not alter:

- API contracts
- incident schema
- confidence formula
- priority formula
- lifecycle
- solver semantics
- approval semantics
- evidence provenance
- queue behavior
- replay behavior

The redesign changes presentation and interaction quality, not system truth.

---

# 49. FINAL DESIGN TARGET

When complete, the first impression should be:

> "This looks like software an emergency operations center would actually use."

Not:

> "This looks like a very nice AI dashboard."

That distinction is the entire point.

SHOONYA's visual identity should come from its operational philosophy:

**start from zero → collect signals → preserve uncertainty → surface contradictions → build evidence → rank urgency → optimize resources → keep humans in control.**

Make that philosophy visible through the interface itself.

Do not decorate it.

---

# 50. STOP CONDITIONS

Do not declare the design finished merely because:

- the UI compiles
- the page looks "modern"
- the colors match
- the components are aligned
- the cards are responsive

It is finished only when:

1. The information hierarchy is clear.
2. The map is the visual center.
3. Severity and confidence are unmistakably separate.
4. Zero Gauge is consistently implemented.
5. Disputed and dark zones are visually distinct.
6. Evidence is traceable.
7. The dashboard does not resemble a generic SaaS template.
8. The UI contains no unnecessary decoration.
9. Real data drives the visual states.
10. The interface remains usable under overload and degraded conditions.
11. The result survives the `DESIGN.md` anti-AI-slop checklist.
12. A human reviewer looking only at the UI can understand what SHOONYA is for.

**Do not aim for "pretty."**

Aim for:

**precise, restrained, distinctive, operational, credible.**