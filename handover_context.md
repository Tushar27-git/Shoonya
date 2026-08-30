# SHOONYA: Complete Project Handover Context

**What is this document?**
This is a ground-up explanation of the entire "SHOONYA" project. You can upload this file to any LLM (like Gemini) to instantly give it full context on what this project is, what problem it solves, how it works, and what the code does.

---

## 1. The Core Problem

Imagine a massive natural disaster strikes a region (e.g., a catastrophic flood or earthquake). The government's Emergency Operations Center (EOC) suddenly starts receiving thousands of SOS messages via SMS, WhatsApp, and radio. 

**The chaos they face:**
1. **Noise & Spam:** 50 different people text about the *same* collapsed bridge. The map gets spammed with 50 pins instead of 1.
2. **Language Barriers:** People text in English, Hindi, and code-switched "Hinglish" (e.g., *"paani bahut tezi se badh raha hai"*).
3. **Contradictions:** One person texts "Road A is open", another texts "Road A is closed". Standard software averages this out, which is incredibly dangerous.
4. **Cloud Failures:** Most modern AI tools rely on internet connectivity (like calling OpenAI or Gemini APIs). In a real disaster, internet cables are cut, and cell towers go down. Cloud AI becomes useless.

## 2. The Solution: What is SHOONYA?

**SHOONYA** (meaning "Zero" in Hindi/Sanskrit) is a **Crisis Intelligence and Dispatch System**. 

It is designed to ingest massive amounts of chaotic, multilingual disaster reports and transform them into a clean, prioritized, actionable dashboard for a human commander. 

**The Golden Rule of SHOONYA (Zero-Deviation Scope):**
Unlike typical modern apps, SHOONYA is built to be **fully deterministic**. It does not use hallucinatory generative AI or heavy cloud-based Transformers for its core logic. Everything runs on strict mathematical formulas, rule-based extraction, and rock-solid heuristics. If the internet goes down, SHOONYA keeps working.

---

## 3. How It Works (The 8 Core Pillars)

Over the course of 14 development phases, we built the following architectural pillars to solve the disaster problem:

### Pillar 1: Multilingual NLP Ingestion
- **What it does:** Reads incoming raw texts (English, Hindi, Hinglish) and uses strict rule-based dictionaries and regex to extract facts.
- **Example:** It reads *"3 log dube hue hain, jaldi aao"* and deterministically extracts: Hazard = `FLOOD`, Victim Count = `3`, Urgency = `HIGH`. No cloud AI required.

### Pillar 2: Clustering & Deduplication
- **What it does:** Prevents map spam. If 50 texts come in from the same 1km radius about a "bridge collapse" within 10 minutes, SHOONYA groups them into a single "Cluster Incident".
- **The Math:** To prevent 50 spam texts from making an incident look 50x worse than it is, it applies a `log10` dampening formula. **50 reposts ≠ 50 confirmations.**

### Pillar 3: Contradiction Handling (No Averaging)
- **What it does:** If Source A says "Road OPEN" and Source B says "Road CLOSED", standard systems might average the confidence. SHOONYA strictly forbids averaging ground truth. 
- **How it handles it:** It throws a `DISPUTE FLAG` and displays both claims side-by-side in a hatched amber warning box, forcing the human commander to review the raw evidence.

### Pillar 4: Dark Zone Detection (Silence is not Safety)
- **What it does:** If a highly populated district (e.g., 5,000 people) suddenly stops sending reports during a cyclone, SHOONYA does not assume they are safe. 
- **How it handles it:** It calculates Population vs. Communication Silence and flags the area as a **DARK ZONE** (`NO DATA — UNKNOWN STATUS`), recommending immediate drone reconnaissance.

### Pillar 5: Weak Signal Correlator (Early Warning)
- **What it does:** Looks for isolated, minor reports that aren't emergencies on their own (e.g., 1 text about a "ground tremor", 1 text about a "minor crack", 1 text about "water rising" near a Dam).
- **How it handles it:** It connects the dots. If these weak signals co-occur near critical infrastructure, it creates an `EMERGING RISK ZONE` alert to warn the commander *before* the dam breaks.

### Pillar 6: Bounded Priority Engine
- **What it does:** Ranks all incidents based on Severity, Vulnerability (e.g., children/elderly involved), Victim Count, and Accessibility.
- **The Catch:** It enforces a Confidence Floor of `0.4`. Even if a highly severe report is totally unverified (0% confidence), SHOONYA will not drop it from the queue. High-stakes rumors are triaged, not deleted.

### Pillar 7: Heuristic Dispatch & Cryptographic Audit
- **What it does:** The system looks at available resources (Boats, Ambulances, Excavators) and matches them to the highest priority incidents, routing around closed roads.
- **Human-in-the-loop:** The AI only *recommends*. A human must click `AUTHORIZE PLAN`.
- **Accountability:** Every decision the human makes is etched into an append-only, SHA-256 Cryptographic Audit Log. This ensures that post-disaster, every life-and-death decision can be mathematically proven and audited.

### Pillar 8: Anti-AI-Slop UI (The Frontend)
- **What it does:** The user interface is built to look like a military instrumentation panel.
- **Design Rules:** No purple/pink marketing gradients, no glassmorphism, no rounded corners (0-2px border radius maximum). It uses harsh contrasts (`--void` black, `--signal-cyan`, `--critical-ember`) and Monospace fonts for ultimate legibility in stressful, sleep-deprived environments.

---

## 4. Current State of the Codebase

The project is built with:
- **Backend:** Python (FastAPI). It houses the ingestion queues, priority engines, NLP regex extractors, and cryptographic audit log.
- **Frontend:** React (TypeScript) + Vite. It houses the Tactical Map, the Dispatch Console, and the Live Telemetry headers.

**To see the project in action right now:**
Both servers are currently running in the background. Open a web browser on your machine and go to:
**http://localhost:5173**

You will see the live SHOONYA dashboard, processing a simulated burst of 500 disaster reports in real time.
