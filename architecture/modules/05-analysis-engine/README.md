# Analysis Engine — Design

Module **05** in the Document Ledger pipeline. The core intelligence layer — transforms a classified decision into a grounded **insight package** for human review by orchestrating four analysis sub-engines.

Related docs: [System Architecture](../../overview/architecture.md) · [Responsibility Matrix](../../overview/module-responsibility-matrix.md) · [Classification Engine](../04-classification/) · [Review & Approval Portal](../06-review-portal/) · [Deep research](research/analysis-engine-deep-research.md)

---

## 1. Role

```
Analysis Engine = produce a grounded insight package from a classified decision
```

| Responsibility | Description |
| -------------- | ----------- |
| Consume classified decisions | Pull `decision.classified` events from Queue / Event Bus |
| Load analysis context | Fetch knowledge, entities, classification, and routing profile |
| Compute impact | Map technical and organizational blast radius |
| Find precedents | Retrieve similar and conflicting historical decisions |
| Forecast consequences | Predict risks, outcomes, and rollback considerations |
| Recommend actions | Suggest governance, documentation, and review steps |
| Aggregate insights | Merge sub-engine outputs into one review-ready package |
| Score quality | Rate completeness, grounding, and review priority |
| Publish completion | Emit `insight.ready` for Review & Approval Portal |

### Scope boundaries

| In scope | Out of scope |
| -------- | -------------- |
| Impact, similarity, forecast, recommendation analysis | Raw content fetch or decision detection |
| Insight package generation | Final approval or ledger write |
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
│         Impact Engine               Similarity Engine      │   │
│              │                             │              │   │
│              └──────────────┬──────────────┘              │   │
│                             ▼                             │   │
│                      Phase 2: Forecast Engine             │   │
│                             ▼                             │   │
│                   Phase 3: Recommendation Engine          │   │
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
Phase 1 (parallel):  Impact Engine ──┐
                     Similarity Engine ┘
                              │
Phase 2 (sequential): Forecast Engine  ← requires Impact + Similarity
                              │
Phase 3 (sequential): Recommendation Engine ← requires Impact + Similarity + Forecast
                              │
                     Insight Aggregator
```

Classification Engine's `routing.sub_engines` can **skip** sub-engines per profile, but cannot violate dependencies (Forecast requires Impact when enabled; Recommendation requires all enabled upstream outputs).

---

## 3. Internal components

| Component | Purpose | Notes |
| --------- | ------- | ----- |
| **Job Consumer** | Subscribe to `decision.classified` | Idempotent on `classified_decision_id` |
| **Context Loader** | Load classified decision, candidate, entities, chunks, evidence | Joins KPE + Classification tables |
| **Analysis Orchestrator** | Execute DAG per analysis profile | Handles partial failure, timeouts |
| **Profile Router** | Resolve which sub-engines run from `routing.sub_engines` | Honors Classification routing contract |
| **Impact Engine** | Blast radius + organizational impact | Graph traversal + risk scoring |
| **Similarity Engine** | Hybrid precedent retrieval | Vector + lexical + graph rerank |
| **Forecast Engine** | Consequence and risk forecasting | Grounded in impact + precedents |
| **Recommendation Engine** | Governance and next-step proposals | Rules + LLM synthesis |
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
| **Impact Engine** | What could this decision affect? | Knowledge graph traversal (2–3 hops) + org mapping | `impact_map` |
| **Similarity Engine** | What precedents exist? | Hybrid retrieval (vector + BM25 + graph) + rerank | `similar_decisions[]` |
| **Forecast Engine** | What may happen next? | Pattern analysis from precedents + risk dimensions | `forecast_report` |
| **Recommendation Engine** | What should the team do? | Governance rules + grounded LLM synthesis | `recommendations[]` |

---

## 6. Analysis profiles (from Classification Engine)

| Profile | Sub-engines | Behavior |
| ------- | ----------- | -------- |
| `full_analysis` | impact, similarity, forecast, recommendation | Full DAG execution |
| `standard_analysis` | impact, similarity, recommendation | Skip Forecast |
| `lightweight_analysis` | similarity, recommendation | Minimal impact; fast path |
| `review_first` | none | Empty analysis sections; high review priority; expedite human review |

`review_first` still produces an insight package with decision summary, provenance, and `quality.review_priority: urgent`.

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

Impact Engine traverses this graph. Similarity Engine uses `supersedes` / `conflicts_with` edges in reranking.

---

## 8. Grounding and trust model

Every insight claim must be traceable:

| Claim type | Grounding requirement |
| ---------- | --------------------- |
| Affected system | Graph edge or entity reference from KPE |
| Similar decision | Ledger record ID + similarity score |
| Forecast outcome | `grounded_in[]` references to precedents or impact facts |
| Recommendation | `evidence_refs[]` linking to package sections |

**Quality scores:**

| Score | Formula (conceptual) |
| ----- | -------------------- |
| `completeness_score` | % of expected sections populated for profile |
| `grounding_score` | % of claims with valid evidence refs |
| `review_priority` | Derived from classification confidence, blast radius, conflict detection |

Ungrounded LLM claims are dropped, not passed to Review Portal ([SafePassage pattern](../03-knowledge-processing/research/entity-extraction-and-decision-detection.md)).

---

## 9. Reliability

| Concern | Strategy |
| ------- | -------- |
| Delivery | At-least-once; idempotent on `classified_decision_id` |
| Sub-engine timeout | Per-engine timeout; partial package with `status: partial` |
| LLM failure | Return rule-based recommendations; lower grounding score |
| Graph unavailable | Impact Engine falls back to entity-only impact list |
| Ledger empty (cold start) | Similarity returns empty; Forecast uses impact-only patterns |
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
| `ae_similar_hits_total` | Precedents found per query |
| `ae_impact_nodes_traversed` | Graph traversal depth/count |

---

## 11. Dependencies

| Dependency | Direction | Use |
| ---------- | --------- | --- |
| Queue / Event Bus | In / Out | `decision.classified` / `insight.ready` |
| Classification Engine | Upstream | Routing profile and labels |
| Knowledge Processing Engine | Upstream | Knowledge, entities, evidence |
| Decision Ledger | Read | Approved precedents (Similarity, Forecast) |
| Decision Knowledge Graph | Read/Write | Impact traversal; relationship edges |
| Vector DB | Read | Similarity embeddings |
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
    └── analysis-orchestration.mmd
```
