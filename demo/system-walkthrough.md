# Document Ledger — Demo System Walkthrough

Talking points for explaining each module during the demo video. Each section follows the same structure so you can walk through the pipeline in order.

**Pipeline flow:** Signal Intake → Event Bus → Knowledge Processing → Classification → Analysis → Review & Approval → Decision Ledger → Consumer API

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

| Source | Trigger |
| ------ | ------- |
| Jira | A new ticket is created |
| Meetings | A transcript is uploaded |
| Confluence | A page is updated |
| Manual | A user clicks **Analyze Document** |

### Output

Processing job + `source.triggered` event → **Queue / Event Bus**

---

## 2. Queue / Event Bus

### One-liner

The Event Bus is the nervous system of Document Ledger. It moves events between independent modules so each stage can scale, retry, and evolve without breaking the rest of the pipeline.

### Why

Document Ledger is a multi-stage pipeline. Decision processing is not instantaneous — it may involve AI analysis, human review, and future integrations. The Event Bus keeps the overall process reliable while letting every stage work independently.

Without it, a slow or failing stage would block everything upstream and downstream.

### What it does

- Buffers and routes job messages between modules
- Enables async processing and horizontal scaling
- Retries failed work and isolates dead-letter cases
- Preserves a traceable flow from signal to ledger

### Output

Job messages routed to the appropriate downstream consumer (e.g. Knowledge Processing Engine)

---

## 3. Knowledge Processing Engine

### One-liner

This is where conversations, documents, and tickets stop being raw content and start becoming organizational knowledge.

### Why

Organizational knowledge is buried inside unstructured content. A 20-page meeting transcript or a Jira ticket with 300 comments cannot go straight into the Decision Ledger.

The system must first understand:

- What is being discussed?
- Was a decision made?
- What was the rationale?
- Who decided?
- What is affected?

### What it does

- Fetches and normalizes source content
- Extracts meaningful information (entities, topics, decision signals)
- Detects decision candidates within unstructured text
- Produces a canonical structured knowledge object

### Output

Structured knowledge + `source.ingested` event → **Classification Engine**

---

## 4. Classification Engine

### One-liner

The Classification Engine identifies the type of decision and applies a standardized taxonomy so downstream analysis runs consistently.

### Why

The system must know *what kind* of decision it is before it can analyze it. A pricing change, an architecture decision, and a policy update need different treatment — but they must all be labeled the same way every time.

### What it does

- Identifies decision type from structured knowledge
- Applies taxonomy tags from the organization's decision taxonomy
- Scores confidence so downstream stages know how reliable the classification is

### Output

Classified decision + `decision.classified` event → **Analysis Engine**

---

## 5. Analysis Engine

### One-liner

The Analysis Engine is the intelligence layer. It compares a new decision against the organization's approved knowledge, explains what changed, evaluates impact, forecasts outcomes, and prepares a complete insight package for human review.

### Why

A decision only has meaning when compared to the organization's current state. Raw classification is not enough — reviewers need context, consequences, and recommendations before they can approve or reject.

### Questions it answers

| Question | Answered by |
| -------- | ----------- |
| What changed? | Ledger Diff Engine |
| What is affected? | Impact Engine |
| What are the risks? | Forecast Engine |
| What should we do next? | Recommendation Engine |

### What it does

- **Ledger Diff** — Determines what changed vs. the approved Decision Ledger
- **Impact** — Maps dependencies and affected areas
- **Forecast** — Predicts outcomes and surfaces warnings for the reviewer
- **Recommendation** — Suggests next actions and governance steps
- Orchestrates sub-engines into a single review-ready package

### Output

**Insight Package** + `insight.ready` event → **Review & Approval Portal**

---

## 6. Review & Approval Portal

### One-liner

The Review & Approval Portal is the trust boundary. It ensures AI-generated insights are validated by humans before they become part of the organization's source of truth.

### Why

AI can propose decisions, but only humans can establish organizational truth.

Document Ledger does **not** automatically write everything into the ledger. If it did:

- Hallucinations would enter the ledger
- Errors would be stored permanently
- AI would become the source of truth

That is the opposite of what this system is designed for. Every decision is validated by a human before it becomes trusted knowledge.

### What it does

- Presents the full Insight Package from the Analysis Engine
- Enables human review, edit, and rationale capture
- Approves or rejects the proposed change
- Decides whether the change becomes organizational truth

### Output

Approved or rejected decision + `decision.approved` event → **Decision Ledger**

---

## 7. Decision Ledger

### One-liner

The Decision Ledger is the trusted memory of the organization. It preserves approved decisions, maintains history and traceability, and transforms them into both system-ready data and AI-ready knowledge.

### Why

Organizations need a trusted foundation that both humans and AI can rely on. Without a single approved record of decisions — with evidence, versioning, and audit trail — every downstream system would be guessing.

### What it does

- Preserves approved decisions as the source of truth
- Maintains decision history and versioning
- Links evidence and maintains audit traceability
- Indexes knowledge for search, reporting, and AI consumption

### Output

Ledger records → **Consumer API**

---

## 8. Consumer API

### One-liner

This is where Document Ledger becomes useful beyond the portal — every approved decision can power search, dashboards, agents, and future AI systems through a trusted API.

### Why

Trusted knowledge has no value if downstream systems cannot safely consume it. The Consumer API is the controlled exit: same truth, different formats for different consumers.

### What it does

| Capability | Serves |
| ---------- | ------ |
| Expose trusted decisions | Any authorized downstream system |
| System-ready data | Dashboards, reporting, search UI, internal tools |
| AI-ready context | Agents, copilots, RAG systems |
| Protect access | Auth, tenancy, and policy enforcement |

### Output

Decision knowledge API responses → AI systems, search, agents, RAG, and internal tools

---

## Quick reference — event flow

| Event | From | To |
| ----- | ---- | -- |
| `source.triggered` | Signal Intake Engine | Knowledge Processing Engine |
| `source.ingested` | Knowledge Processing Engine | Classification Engine |
| `decision.classified` | Classification Engine | Analysis Engine |
| `insight.ready` | Analysis Engine | Review & Approval Portal |
| `decision.approved` | Review & Approval Portal | Decision Ledger |

---

## Suggested demo narrative (60–90 seconds per module)

1. **Start with the problem** — Decisions are scattered across Jira, Confluence, meetings, and chat. Nothing is connected; nothing is trusted at scale.
2. **Signal Intake** — Show a trigger (e.g. Jira ticket or uploaded transcript). Emphasize: we know *when* and *who*.
3. **Event Bus** — One sentence: async, reliable, each stage independent.
4. **Knowledge Processing** — Raw content → structured knowledge. Mention decision candidate detection.
5. **Classification** — Taxonomy tags and confidence score.
6. **Analysis Engine** — The “wow” moment: diff, impact, forecast, recommendations in the Insight Package.
7. **Review Portal** — Human in the loop. Approve or reject. This is the trust boundary.
8. **Decision Ledger** — Approved truth, versioned and traceable.
9. **Consumer API** — Same truth powers dashboards and AI agents.

---

## Canonical module names

Use these names consistently in the demo (see [System Architecture](../architecture/overview/architecture.md)):

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
