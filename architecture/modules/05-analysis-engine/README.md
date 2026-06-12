# Analysis Engine — Design

Module **05** in the Document Ledger pipeline. The **decision-path** intelligence layer — answers **what changes compared to the current Decision Ledger**, then produces a grounded **insight package** for human review by orchestrating three sub-engines.

> **Forecast Engine (module 09)** handles **discussions** (non-decision knowledge): change capture and "have we seen this before?" — see [../09-forecast-engine/README.md](../09-forecast-engine/README.md).

Related docs: [System Architecture](../../overview/architecture.md) · [Responsibility Matrix](../../overview/module-responsibility-matrix.md) · [Classification Engine](../04-classification/) · [Review & Approval Portal](../06-review-portal/) · [Deep research](research/analysis-engine-deep-research.md) · [Architecture diagrams](diagrams/README.md)

---

## 1. Role

```
Analysis Engine = explain what this decision changes vs the current ledger, then package the full analysis for review
```

**Primary question (north star):** Given a new decision candidate, **what is different from what the organization has already approved in the Decision Ledger?** Every insight package must lead with a grounded `ledger_diff` — not a generic similarity list.

| Responsibility | Description |
| -------------- | ----------- |
| Consume classified decisions | Pull `decision.classified` events from Queue / Event Bus |
| Load analysis context | Fetch knowledge, entities, classification, and routing profile |
| **Compare to ledger** | **Diff candidate against approved ledger records; classify change type and field-level deltas** |
| Compute impact | Map technical and organizational blast radius of the *change* |
| Recommend actions | Suggest governance steps (e.g., supersede ADR-0042, resolve conflict) |
| Aggregate insights | Merge sub-engine outputs into one review-ready package |
| Score quality | Rate completeness, grounding, and review priority |
| Publish completion | Emit `insight.ready` for Review & Approval Portal |

### Scope boundaries

| In scope | Out of scope |
| -------- | -------------- |
| Ledger diff, impact, recommendation analysis (**decision path only**) | Raw content fetch, discussion routing, or forecast |
| Insight package generation (ledger diff first) | Final approval or ledger write |
| Analysis routing per Classification profile | Re-classification |
| Grounded recommendations (proposals) | Autonomous execution of recommendations |
| Publishing `insight.ready` | Consumer API exposure |

**Unit of work:** one insight package per `decision.classified` event (one classified decision candidate).

---

## 2. Architecture

```
Queue / Event Bus
  │ decision.classified
  ▼
┌──────────────────────────────────────────────────────────────┐
│                     Analysis Engine                           │
│                                                               │
│  Job Consumer ──► Context Loader ──► Analysis Orchestrator    │
│                                            │                  │
│                                     Profile Router            │
│                                            │                  │
│              ┌─────────────────────────────┼──────────────┐   │
│              ▼                             ▼              │   │
│         Phase 1 (parallel)          Phase 1 (parallel)   │   │
│         Ledger Diff Engine          Impact Engine        │   │
│              │                             │              │   │
│              └──────────────┬──────────────┘              │   │
│                             ▼                             │   │
│                   Phase 2: Recommendation Engine          │   │
│                             ▼                             │   │
│                   Insight Aggregator                      │   │
│                             ▼                             │   │
│                   Quality Scorer ──► Insight Store Writer │   │
│                             ▼                             │   │
│                   Event Publisher ──► Audit Logger          │   │
└──────────────┬────────────────────────────────────────────┘
               │
               ▼
        PostgreSQL (insight_packages)
               │
               ▼
   Queue / Event Bus ──► Review & Approval Portal
     insight.ready
```

### Execution DAG (default)

Sub-engine order is a **directed acyclic graph**, not arbitrary parallel execution:

```
Phase 1 (parallel):  Ledger Diff Engine ──┐   ← primary: diff vs Decision Ledger
                     Impact Engine        ┘
                              │
Phase 2 (sequential): Recommendation Engine ← requires Ledger Diff (+ Impact when enabled)
                              │
                     Insight Aggregator
```

Classification Engine's `routing.sub_engines` can **skip** sub-engines per profile. Recommendation requires `ledger_diff` when enabled.

**Out of scope:** discussion change capture and precedent matching → [Forecast Engine](../09-forecast-engine/).

Detailed diagrams: [internal architecture](diagrams/analysis-internal-architecture.mmd) · [AI layer](diagrams/analysis-ai-layer.mmd) · [sub-engine DAG](diagrams/analysis-subengine-dag.mmd) · [grounding pipeline](diagrams/analysis-grounding-pipeline.mmd)

---

## 3. Internal components

| Component | Purpose | Notes |
| --------- | ------- | ----- |
| **Job Consumer** | Subscribe to `decision.classified` | Idempotent on `classified_decision_id` |
| **Context Loader** | Load classified decision, candidate, entities, chunks, evidence | Joins KPE + Classification tables |
| **Analysis Orchestrator** | Execute DAG per analysis profile | Handles partial failure, timeouts |
| **Profile Router** | Resolve which sub-engines run from `routing.sub_engines` | Honors Classification routing contract |
| **Ledger Diff Engine** | **What changed vs approved ledger** | Hybrid retrieval + structured field diff + change classification |
| **Impact Engine** | Blast radius of the change | Graph traversal + risk scoring |
| **Recommendation Engine** | Governance and next-step proposals | Rules + LLM synthesis (e.g., supersede, resolve conflict) |
| **Insight Aggregator** | Merge outputs into insight package schema | Validates against JSON schema |
| **Quality Scorer** | Completeness, grounding, review priority | Drives Review Portal queue ordering |
| **Insight Store Writer** | Persist full insight package | PostgreSQL JSONB + indexed fields |
| **Event Publisher** | Publish `insight.ready` | Summary payload; full package by ID |
| **Audit Logger** | Trace sub-engine timings, queries, LLM calls | Full provenance for compliance |

---

## 4. Event contracts

### Input: `decision.classified`

Schema: [../04-classification/events/decision.classified.schema.json](../04-classification/events/decision.classified.schema.json)

Analysis Engine reads:
- `classified_decision_id`, `knowledge_id`, `decision_candidate_id`
- `classification.domain`, `categories`, `tags`, `confidence`
- `routing.analysis_profile`, `routing.sub_engines`, `routing.priority`

### Output: `insight.ready`

Schema: [events/insight.ready.schema.json](events/insight.ready.schema.json)

Full insight package schema: [schemas/insight-package.schema.json](schemas/insight-package.schema.json)

Review Portal loads the complete package by `insight_package_id`.

---

## 5. Sub-engines (summary)

Deep research per sub-engine: [research/analysis-engine-deep-research.md](research/analysis-engine-deep-research.md)

| Sub-engine | Primary question | Key technique | Output |
| ---------- | ---------------- | ------------- | ------ |
| **Ledger Diff Engine** | **What changes vs the current ledger?** | Retrieve closest ledger records → structured field diff → change classification | `ledger_diff` |
| **Impact Engine** | What could this change affect? | Knowledge graph traversal (2–3 hops) + org mapping | `impact_map` |
| **Recommendation Engine** | What should the team do about this delta? | Governance rules + grounded LLM synthesis | `recommendations[]` |

### Impact map `risk_dimensions` (Phase 1 scope)

| Dimension | Scored | Notes |
| --------- | ------ | ----- |
| `technical` | Yes | Systems, integration, migration complexity |
| `delivery` | Yes | Timeline, cross-team coordination |
| `people` | Yes | Ownership, training, on-call burden |
| `compliance` | **Deferred** | May involve confidential data |
| `financial` | **Deferred** | May involve confidential data |

### Ledger diff change classifications

| Classification | Meaning | Typical reviewer action |
| -------------- | ------- | ----------------------- |
| `first_of_kind` | No related ledger records | Approve as new baseline |
| `extends` | Adds scope without contradicting ledger | Approve; link as related |
| `amends` | Modifies a specific aspect of an existing decision | Approve amendment; version ledger record |
| `supersedes` | Replaces an outdated ledger decision | Approve; mark prior record superseded |
| `conflicts` | Contradicts an active ledger decision | Resolve before approval |
| `reaffirms` | Restates ledger position with no material change | Fast-track or skip |
| `duplicate` | Near-duplicate of existing ledger entry | Reject or merge |
| `no_ledger_match` | Retrieval ran but no confident reference | Review as new; note cold-start |

---

## 6. Analysis profiles (from Classification Engine)

| Profile | Sub-engines | Behavior |
| ------- | ----------- | -------- |
| `full_analysis` | ledger_diff, impact, recommendation | Full DAG; complete field-level diff |
| `standard_analysis` | ledger_diff, impact, recommendation | Same sub-engines; lighter impact templates |
| `lightweight_analysis` | ledger_diff, recommendation | Ledger diff + governance only; minimal impact |
| `review_first` | none | No automated diff; human compares to ledger manually |

`ledger_diff` is always the first section reviewers see when the sub-engine runs. `review_first` still produces an insight package with decision summary, provenance, and `quality.review_priority: urgent`.

---

## 7. Data model

### `insight_packages` (PostgreSQL)

| Column | Type | Description |
| ------ | ---- | ----------- |
| `id` | UUID | `insight_package_id` |
| `tenant_id` | UUID | Tenant scope |
| `classified_decision_id` | UUID | FK → classified_decisions |
| `knowledge_id` | UUID | FK → knowledge_records |
| `decision_candidate_id` | UUID | FK → decision_candidates |
| `analysis_profile` | VARCHAR | Profile used |
| `package` | JSONB | Full insight package (schema-validated) |
| `completeness_score` | FLOAT | 0.0–1.0 |
| `grounding_score` | FLOAT | 0.0–1.0 |
| `review_priority` | VARCHAR | low, normal, high, urgent |
| `status` | VARCHAR | completed, partial, failed |
| `created_at` | TIMESTAMPTZ | Creation time |

### Decision Knowledge Graph (supporting store)

Built incrementally from entities, approved ledger records, and tenant service catalog:

| Node type | Examples |
| --------- | -------- |
| `system` | payment-service, auth-api |
| `team` | Platform, Security |
| `decision` | Ledger record references |
| `technology` | Kafka, PostgreSQL |
| `project` | PROJ-123 |

| Edge type | Meaning |
| --------- | ------- |
| `depends_on` | System → system |
| `owned_by` | System → team |
| `supersedes` | Decision → decision |
| `conflicts_with` | Decision → decision |
| `references` | Decision → system/technology |

Ledger Diff Engine uses graph `supersedes` / `conflicts_with` edges to classify change type. Impact Engine traverses dependency edges for blast radius.

---

## 8. Grounding and trust model

Every insight claim must be traceable:

| Claim type | Grounding requirement |
| ---------- | --------------------- |
| Ledger diff field | `evidence_candidate` + `evidence_ledger` spans or ledger record ID |
| Change classification | Primary ledger reference + relationship rationale |
| Affected system | Graph edge or entity reference from KPE |
| Recommendation | `evidence_refs[]` linking to `ledger_diff` and other sections |

**Quality scores:**

| Score | Formula (conceptual) |
| ----- | -------------------- |
| `completeness_score` | % of expected sections populated for profile |
| `grounding_score` | % of claims with valid evidence refs |
| `review_priority` | Derived from `ledger_diff.change_classification` (conflicts → urgent), blast radius, grounding |

Ungrounded LLM claims are dropped, not passed to Review Portal ([SafePassage pattern](../03-knowledge-processing/research/entity-extraction-and-decision-detection.md)).

---

## 9. Reliability

| Concern | Strategy |
| ------- | -------- |
| Delivery | At-least-once; idempotent on `classified_decision_id` |
| Sub-engine timeout | Per-engine timeout; partial package with `status: partial` |
| LLM failure | Return rule-based recommendations; lower grounding score |
| Graph unavailable | Impact Engine falls back to entity-only impact list |
| Ledger empty (cold start) | `ledger_diff.change_classification: first_of_kind`; lower impact confidence |
| `review_first` profile | Skip sub-engines; complete in < 100ms |

---

## 10. Observability

| Metric | Description |
| ------ | ----------- |
| `ae_jobs_consumed_total` | `decision.classified` events processed |
| `ae_insights_completed_total` | Successful insight packages |
| `ae_subengine_duration_seconds` | Per sub-engine latency |
| `ae_llm_calls_total` | LLM invocations by sub-engine |
| `ae_grounding_score_histogram` | Grounding quality distribution |
| `ae_ledger_diff_classifications_total` | Count by change_classification |
| `ae_ledger_records_compared` | Ledger records retrieved per diff |
| `ae_impact_nodes_traversed` | Graph traversal depth/count |

---

## 11. Dependencies

| Dependency | Direction | Use |
| ---------- | --------- | --- |
| Queue / Event Bus | In / Out | `decision.classified` / `insight.ready` |
| Classification Engine | Upstream | Routing profile and labels |
| Knowledge Processing Engine | Upstream | Knowledge, entities, evidence |
| Decision Ledger | Read | **Primary input for Ledger Diff Engine** |
| Forecast Engine | Sibling module | Consumes discussions; reads same ledger for precedents — not a sub-engine |
| Decision Knowledge Graph | Read/Write | Impact traversal; relationship edges |
| Vector DB | Read | Ledger record embeddings for diff retrieval |
| Review & Approval Portal | Downstream | Consumes insight packages |

---

## 12. Open decisions

| # | Decision | Recommendation | Status |
| - | -------- | -------------- | ------ |
| 1 | Graph store | PostgreSQL adjacency + application layer for MVP; Neo4j at scale | **Proposed** |
| 2 | Vector DB | pgvector co-located with PostgreSQL for MVP | **Proposed** |
| 3 | LLM usage | Sub-engine synthesis only; retrieval deterministic | **Proposed** |
| 4 | Orchestration | In-process DAG executor; Temporal/Cadence at scale | TBD |
| 5 | Service catalog integration | Optional tenant CMDB feed for Impact Engine Phase 2 | TBD |

See [research/analysis-engine-deep-research.md](research/analysis-engine-deep-research.md) for full rationale.

---

## 13. Module layout

```
architecture/modules/05-analysis-engine/
├── README.md
├── research/
│   └── analysis-engine-deep-research.md
├── schemas/
│   └── insight-package.schema.json
├── events/
│   └── insight.ready.schema.json
└── diagrams/
    ├── README.md                      ← diagram index + AI layer design notes
    ├── analysis-orchestration.mmd     ← pipeline overview
    ├── analysis-internal-architecture.mmd
    ├── analysis-ai-layer.mmd
    ├── analysis-subengine-dag.mmd
    └── analysis-grounding-pipeline.mmd
```
