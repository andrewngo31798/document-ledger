# Document Ledger — Demo System Walkthrough

Talking points for explaining each module during the demo video. Each section follows the same structure so you can walk through the pipeline in order.

**Dual-path pipeline:**

| Path | Trigger | Flow |
| ---- | ------- | ---- |
| **Decision** | `decision_candidate_count ≥ 1` | Signal Intake → Event Bus → Knowledge Processing → Classification → Analysis → Review → Decision Ledger → Consumer API |
| **Discussion** | `discussion_signal = true`, no decision | Signal Intake → Event Bus → Knowledge Processing → **Forecast Engine** → Consumer API |

---

## How to use this document

| Section | What to say |
| ------- | ----------- |
| **One-liner** | Open with this — it sets the role of the module in one sentence |
| **Why** | Explain the problem this module solves |
| **What it does** | Walk through capabilities |
| **Questions it answers** | Tie back to real decisions the audience cares about |
| **Output** | What leaves this stage and who receives it |

---

## 1. Signal Intake Engine

### One-liner

Signal Intake is the front door. It receives a valid trigger, records who or what initiated it, captures the raw payload or reference, and hands the job off to the processing pipeline.

### Why

Something has to decide *when* the pipeline runs and *who* is responsible for starting it. Without a controlled entry point, you cannot trace decisions back to their source or enforce access and tenancy rules.

### Questions it answers

- **When should we run the flow?** — A meaningful change or explicit request has occurred.
- **Who initiated the trigger?** — A person, system, or integration is authenticated and attributed.

### What it does

- Validates the trigger and tenant context
- Normalizes the source type and payload reference
- Records auth / attribution for the initiator
- Creates a processing job and publishes the first pipeline event

### Example triggers

| Source | Trigger | Typical path |
| ------ | ------- | ------------ |
| Jira | A new ticket is created | Decision |
| Meetings | A transcript is uploaded | Decision |
| Confluence | A page is updated | Discussion |
| Manual | A user clicks **Analyze Document** | Either |

### Output

Processing job + `source.triggered` event → **Queue / Event Bus**

---

## 2. Queue / Event Bus

### One-liner

The Event Bus is the nervous system of Document Ledger. It moves events between independent modules so each stage can scale, retry, and evolve without breaking the rest of the pipeline.

### Why

Document Ledger is a multi-stage pipeline. Processing is not instantaneous — it may involve AI analysis, human review, and future integrations. The Event Bus keeps the overall process reliable while letting every stage work independently.

### What it does

- Buffers and routes job messages between modules
- Enables async processing and horizontal scaling
- Retries failed work and isolates dead-letter cases
- Preserves a traceable flow from signal to ledger or change preview

### Output

Job messages routed to the appropriate downstream consumer (e.g. Knowledge Processing Engine)

---

## 3. Knowledge Processing Engine

### One-liner

This is where conversations, documents, and tickets stop being raw content and start becoming structured decision knowledge — with routing to the **decision path** or **discussion path**.

### Why

Important decisions are often buried inside unstructured content. The system must first understand what is being discussed, whether a decision was made, and whether the content is a shifting discussion worth tracking before any analysis runs.

### What it does

- Fetches and normalizes source content
- Extracts meaningful information (entities, topics, decision signals)
- Detects **decision candidates** OR **discussion signals**
- Sets `routing.primary_path` — `decision`, `discussion`, or `none`

### Questions it answers

- Was a decision made, or is this still a discussion?
- What entities and topics are in play?
- Which downstream path should run?

### Output

Structured knowledge + `source.ingested` event → **Classification Engine** (decision) or **Forecast Engine** (discussion)

---

## 4. Classification Engine *(decision path only)*

### One-liner

The Classification Engine categorizes decisions using a standardized taxonomy so downstream analysis runs consistently.

### Why

The system must know *what kind* of decision it is before it can analyze it. A pricing change, an architecture decision, and a policy update need different treatment — but they must all be labeled the same way every time.

### What it does

- Identifies decision type from structured knowledge
- Applies taxonomy tags from the organization's decision taxonomy
- Assigns a confidence score to its classification so downstream stages know how reliable the labeling is
- Routes to Analysis Engine with enabled sub-engines: ledger diff, impact, recommendation

### Output

Classified decision + `decision.classified` event → **Analysis Engine**

---

## 5. Forecast Engine *(discussion path only — Module 09)*

### One-liner

The Forecast Engine tracks how discussions evolve over time and answers **"have we seen this before?"** — without requiring a closed decision.

### Why

Most organizational content is not a decision candidate. Confluence threads, design debates, and early-position language still matter. Teams lose track of shifts until someone asks "didn't we already decide this?" Forecast Engine surfaces evolving discussions before decisions are finalized, grounded in the Decision Ledger.

### Questions it answers

| Question | Answered by |
| -------- | ----------- |
| What's shifting in this thread? | Change Detector |
| Have we seen this before? | Precedent Engine |
| What outcomes have similar situations led to in the past? | Forward Projector (optional) |

### What it does

- **Change Detector** — detects emerging, reversing, or stable shifts vs baseline
- **Precedent Engine** — hybrid retrieval against approved ledger records
- **Forward Projector** — optional grounded forward signals from precedent only
- Publishes non-approved change insights (`change_preview`)

### Output

**Change Preview** + `change.preview.ready` event → **Consumer API**

---

## 6. Analysis Engine *(decision path only)*

### One-liner

The Analysis Engine is the decision analysis layer for **decisions**. It compares a new decision against approved knowledge, identifies what changed, assesses potential impact, and prepares a complete insight package for human review.

### Why

A decision only has meaning when compared to the organization's current state. Raw classification is not enough — reviewers need context, consequences, and recommendations before they can approve or reject.

### Questions it answers

| Question | Answered by |
| -------- | ----------- |
| What changed? | Ledger Diff Engine |
| What is affected? | Impact Engine |
| What actions should be considered next? | Recommendation Engine |

### What it does

- **Ledger Diff** — Determines what changed vs. the approved Decision Ledger
- **Impact** — Maps potentially affected teams, systems, and decisions
- **Recommendation** — Provides recommended next actions and governance steps
- Orchestrates three sub-engines into a single review-ready package

> Forecast is **not** part of Analysis. Discussion change capture lives in [Forecast Engine (Module 09)](../architecture/modules/09-forecast-engine/README.md).

### Output

**Insight Package** + `insight.ready` event → **Review & Approval Portal**

---

## 7. Review & Approval Portal *(decision path only)*

### One-liner

The Review & Approval Portal is the human validation boundary. It ensures AI-generated insights are validated by humans before they become part of the organization's governed decision record.

### Why

AI can prepare analysis and recommendations, but only humans can approve organizational decisions. Document Ledger does **not** automatically write everything into the ledger.

### What it does

- Presents the full Insight Package from the Analysis Engine
- Enables human review, edit, and rationale capture
- Approves or rejects the proposed change

### Output

Approved or rejected decision + `decision.approved` event → **Decision Ledger**

---

## 8. Decision Ledger *(decision path only)*

### One-liner

The Decision Ledger is the approved record of organizational decisions. It preserves approved decisions, maintains history and traceability, and transforms them into both system-ready data and AI-ready knowledge.

### Why

Organizations need a single approved record of decisions — with evidence, versioning, and audit trail. The Forecast Engine's Precedent Engine retrieves from here; Consumer API serves approved decision records from here.

### What it does

- Preserves approved decisions as the organization's governed decision record
- Maintains decision history and versioning
- Links evidence and maintains audit traceability
- Indexes knowledge for search, reporting, and AI consumption

### Output

Ledger records → **Consumer API**

---

## 9. Consumer API

### One-liner

This is where Document Ledger becomes useful beyond the portal — approved decisions and non-approved change insights power search, dashboards, agents, and future AI systems through a governed API.

### Why

Governed decision knowledge has no value if downstream systems cannot safely consume it. The Consumer API is the controlled exit with two trust tiers: **approved** (ledger) and **non-approved** (change insights).

### What it does

| Capability | Source | Trust tier |
| ---------- | ------ | ---------- |
| Search / retrieve decisions | Decision Ledger | Approved |
| RAG context for agents | Decision Ledger | Approved |
| Change insights | Forecast Engine | Non-approved |
| "Have we seen this before?" | Precedent query | Non-approved (ledger-grounded) |

### Output

Decision knowledge and change insight API responses → AI systems, search, agents, RAG, and internal tools

---

## Quick reference — event flow

| Event | From | To | Path |
| ----- | ---- | -- | ---- |
| `source.triggered` | Signal Intake Engine | Knowledge Processing Engine | Both |
| `source.ingested` | Knowledge Processing Engine | Classification Engine | Decision |
| `source.ingested` | Knowledge Processing Engine | Forecast Engine | Discussion |
| `decision.classified` | Classification Engine | Analysis Engine | Decision |
| `insight.ready` | Analysis Engine | Review & Approval Portal | Decision |
| `decision.approved` | Review & Approval Portal | Decision Ledger | Decision |
| `change.preview.ready` | Forecast Engine | Consumer API | Discussion |

---

## Suggested demo narratives

### Decision path (meeting transcript — ~8 minutes)

1. **Problem** — Decisions scattered across Jira, Confluence, meetings.
2. **Signal Intake** — Transcript upload; we know *when* and *who*.
3. **Knowledge Processing** — Decision candidate detected → decision path.
4. **Classification** — Taxonomy + confidence.
5. **Analysis** — Ledger diff, impact, recommendations (3 sub-engines).
6. **Review Portal** — Human validation boundary.
7. **Decision Ledger** — Approved organizational decision.
8. **Consumer API** — Approved decision with evidence.

### Discussion path (Confluence page — ~5 minutes)

1. **Signal Intake** — Confluence page updated.
2. **Knowledge Processing** — Discussion signal, no decision candidate → discussion path.
3. **Forecast Engine** — Change detector → precedent ("seen ADR-007 before") → forward signals.
4. **Consumer API** — Non-approved precedent Q&A; not an approved decision record.

---

## Canonical module names

| # | Canonical name | Short label |
| - | -------------- | ----------- |
| 01 | Signal Intake Engine | Signal Intake |
| 02 | Queue / Event Bus | Event Bus |
| 03 | Knowledge Processing Engine | Knowledge Processing |
| 04 | Classification Engine | Classification |
| 05 | Analysis Engine | Analysis |
| 06 | Review & Approval Portal | Review Portal |
| 07 | Decision Ledger | Decision Ledger |
| 08 | Consumer API | Consumer API |
| **09** | **Forecast Engine** | **Forecast** |

See [System Architecture](../architecture/overview/architecture.md) for full dual-path design.
