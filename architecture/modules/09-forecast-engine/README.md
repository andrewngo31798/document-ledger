# Forecast Engine — Design

Module **09** in the Document Ledger pipeline. A **standalone intelligence module** for **discussions and non-decision knowledge** — not a sub-engine of Analysis.

Related docs: [System Architecture](../../overview/architecture.md) · [Responsibility Matrix](../../overview/module-responsibility-matrix.md) · [Knowledge Processing Engine](../03-knowledge-processing/) · [Analysis Engine](../05-analysis-engine/) · [Consumer API](../08-consumer-api/)

---

## 1. Role

```
Forecast Engine = capture what is changing in a discussion, and answer "have we seen this before?"
```

**North-star questions:**

| Question | Who asks it | Forecast output |
| -------- | ----------- | --------------- |
| **What is changing?** | PM, architect, operator watching a thread | `detected_shifts[]`, `change_summary` |
| **Have we seen this before?** | Anyone before reacting to a meeting note or design thread | `precedent_matches[]` with ledger evidence |
| **What should we watch for?** | Risk-aware teams (optional) | `forward_signals` grounded in precedents + entities |

**Unit of work:** one `change_preview` package per `source.ingested` event where `routing.primary_path = discussion`.

**Does NOT run on:** classified decision candidates — those follow the **decision path** (Classification → Analysis → Review → Ledger). Forecast and Analysis are **sibling paths**, not nested.

### Why a separate module

| Problem today (without Forecast) | Forecast Engine response |
| -------------------------------- | ------------------------ |
| Meeting notes and design threads are not decision candidates | Pipeline still produces value via change + precedent preview |
| `decision_candidate_count = 0` stops the pipeline | Discussion path continues to Forecast |
| "I've seen this before" is asked ad hoc in Slack | Precedent retrieval is first-class, grounded in Decision Ledger |
| Change is invisible until someone writes an ADR | Shifts are detected early from discussion signals |

---

## 2. Dual-path pipeline

Knowledge Processing emits `source.ingested` with a **routing hint**. The Queue routes to one of two paths:

```
source.ingested
       │
       ├── routing.primary_path = decision
       │         │
       │         ▼
       │   Classification Engine
       │         │ decision.classified
       │         ▼
       │   Analysis Engine (Ledger Diff · Impact · Recommendation)
       │         │ insight.ready
       │         ▼
       │   Review & Approval Portal → Decision Ledger
       │
       └── routing.primary_path = discussion
                 │
                 ▼
           Forecast Engine  ← this module
                 │ change.preview.ready
                 ▼
           Consumer API / dashboards / optional alerts
```

See [dual-path-pipeline.mmd](../../overview/dual-path-pipeline.mmd).

### Routing rules (from Knowledge Processing)

| Condition | `primary_path` | Downstream |
| --------- | -------------- | ---------- |
| `decision_candidate_count ≥ 1` | `decision` | Classification (one event per candidate) |
| `decision_candidate_count = 0` AND `discussion_signal = true` | `discussion` | Forecast Engine |
| `decision_candidate_count = 0` AND no discussion signal | `none` | Audit only; no downstream job |
| Mixed: candidates + ongoing debate | `decision` + `discussion` | **Both** paths (parallel jobs on same `knowledge_id`) |

---

## 3. Architecture

```
Queue / Event Bus
  │ source.ingested (routing.primary_path = discussion)
  ▼
┌──────────────────────────────────────────────────────────────┐
│                     Forecast Engine                           │
│                                                               │
│  Job Consumer ──► Context Loader ──► Forecast Orchestrator    │
│                                            │                  │
│              ┌─────────────────────────────┼──────────────┐   │
│              ▼                             ▼              │   │
│         Phase 1 (parallel)          Phase 1 (parallel)   │   │
│         Change Detector           Precedent Engine       │   │
│         (what's shifting)         ("seen this before")   │   │
│              │                             │              │   │
│              └──────────────┬──────────────┘              │   │
│                             ▼                             │   │
│                   Phase 2: Forward Projector              │   │
│                   (optional; grounded outcomes)           │   │
│                             ▼                             │   │
│                   Preview Aggregator ──► Quality Scorer     │   │
│                             ▼                             │   │
│                   Preview Store Writer ──► Event Publisher  │   │
└──────────────┬────────────────────────────────────────────┘
               │
               ▼
        PostgreSQL (change_previews)
               │
               ▼
   Queue / Event Bus ──► Consumer API
     change.preview.ready
```

Diagrams: [forecast-pipeline.mmd](diagrams/forecast-pipeline.mmd) · [forecast-internal-architecture.mmd](diagrams/forecast-internal-architecture.mmd)

### Execution DAG

```
Phase 1 (parallel):  Change Detector ──┐
                     Precedent Engine ──┤
                              │
Phase 2 (sequential): Forward Projector ← requires Change + Precedent
                              │
                     Preview Aggregator
```

**Dependency rules:**
- Forward Projector requires both Change Detector and Precedent Engine
- Precedent Engine may run with empty ledger (cold start) — returns `precedent_matches: []` with warning
- Change Detector always runs when discussion path is triggered

---

## 4. Internal components

| Component | Purpose | Primary question |
| --------- | ------- | ---------------- |
| **Job Consumer** | Subscribe to `source.ingested` where `routing.primary_path = discussion` | — |
| **Context Loader** | Load knowledge record, chunks, entities, source metadata | — |
| **Forecast Orchestrator** | Execute DAG, timeouts, partial failure | — |
| **Change Detector** | Identify shifts vs org baseline / recent context | **What is changing?** |
| **Precedent Engine** | Hybrid retrieval over Decision Ledger + past discussions | **Have we seen this before?** |
| **Forward Projector** | Grounded outcome signals from precedents + detected shifts | What to watch for |
| **Preview Aggregator** | Merge into `change_preview` schema | — |
| **Quality Scorer** | Grounding score, novelty score, alert priority | — |
| **Preview Store Writer** | Persist to `change_previews` | — |
| **Event Publisher** | Emit `change.preview.ready` | — |
| **Audit Logger** | Timings, retrieval queries, LLM calls | — |

### Change Detector (Phase 1)

Detects **material shifts** in discussion content without requiring a decision candidate:

| Shift type | Examples | Technique |
| ---------- | -------- | --------- |
| `scope` | New system mentioned, scope expansion language | Entity delta vs recent knowledge on same source |
| `technology` | "Moving to Kafka", "evaluating Rust" | Technology entity extraction + ledger tech baseline |
| `constraint` | New SLA, compliance mention | Constraint phrase patterns |
| `timeline` | Dates, milestones, "by Q3" | Date extraction |
| `position` | "Leaning toward", "likely going with" | Discourse cues (not decision closure) |

Output: `detected_shifts[]` with `shift_type`, `evidence_span`, `confidence`, `direction` (`emerging` | `reversing` | `unclear`).

### Precedent Engine (Phase 1) — "Seen this before"

This is the core retrieval job for institutional memory:

```
Stage 1 — Discussion embedding + entity seeds
Stage 2 — Hybrid ledger retrieval (vector + BM25 + shared entities)
Stage 3 — Rerank + relationship typing (similar_debate | prior_decision | related_adr | same_scope)
Stage 4 — Outcome summary from approved ledger metadata (what happened last time)
```

Output: `precedent_matches[]` with `ledger_record_id`, `title`, `similarity_score`, `relationship`, `what_happened`, `evidence_refs[]`.

Trust tier: **approved Decision Ledger only** for precedent facts (same rule as Ledger Diff Engine).

### Forward Projector (Phase 2)

Synthesizes `forward_signals` only from:
- `detected_shifts[]`
- `precedent_matches[].what_happened`
- Entity/graph context (lightweight, no full Impact Engine traversal)

Each outcome requires `grounded_in[]`. Ungrounded claims dropped.

---

## 5. Event contracts

### Input: `source.ingested` (discussion path)

Schema: [../03-knowledge-processing/events/source.ingested.schema.json](../03-knowledge-processing/events/source.ingested.schema.json)

Forecast reads:
- `knowledge_id`, `summary.knowledge_kind`, `summary.discussion_signal`
- `routing.primary_path` (must be `discussion` for this consumer)
- `summary.decision_candidate_count` (expected 0 for pure discussion jobs)

### Output: `change.preview.ready`

Schema: [events/change.preview.ready.schema.json](events/change.preview.ready.schema.json)

Package schema: [schemas/change-preview.schema.json](schemas/change-preview.schema.json)

---

## 6. Data model

### `change_previews` (PostgreSQL)

| Column | Type | Description |
| ------ | ---- | ----------- |
| `id` | UUID | `change_preview_id` |
| `tenant_id` | UUID | Tenant scope |
| `knowledge_id` | UUID | FK → knowledge_records |
| `source_type` | VARCHAR | jira, confluence, meeting, … |
| `package` | JSONB | Full change preview (schema-validated) |
| `shift_count` | INT | Number of detected shifts |
| `precedent_count` | INT | Number of precedent matches |
| `grounding_score` | FLOAT | 0.0–1.0 |
| `alert_priority` | VARCHAR | low, normal, high |
| `status` | VARCHAR | completed, partial, failed |
| `created_at` | TIMESTAMPTZ | Creation time |

---

## 7. Relationship to other modules

| Module | Relationship |
| ------ | ------------ |
| **Knowledge Processing** | Upstream; provides `knowledge_kind`, `discussion_signal`, routing hint |
| **Classification** | **Not used** on pure discussion path |
| **Analysis Engine** | **Sibling**, not parent; Analysis handles decision candidates only |
| **Decision Ledger** | Read-only precedent source for Precedent Engine |
| **Vector DB** | Read — ledger embeddings + discussion embeddings |
| **Consumer API** | Primary downstream; exposes change previews and precedent Q&A |
| **Review Portal** | Optional escalation when `alert_priority: high` or policy match |

### Analysis Engine (updated scope)

Analysis sub-engines are now **three**, not four:

| Sub-engine | Decision path only |
| ---------- | ------------------ |
| Ledger Diff | Yes |
| Impact | Yes |
| Recommendation | Yes |
| ~~Forecast~~ | **Moved to module 09** |

---

## 8. Grounding model

| Claim type | Grounding requirement |
| ---------- | --------------------- |
| Detected shift | `evidence_span` in source text |
| Precedent match | `ledger_record_id` + `evidence_refs[]` |
| Forward signal | `grounded_in[]` → shift or precedent ID |
| "Seen this before" headline | At least one `precedent_match` OR explicit `no_precedent_found` |

---

## 9. Reliability

| Concern | Strategy |
| ------- | -------- |
| Delivery | At-least-once; idempotent on `knowledge_id` + `content_hash` |
| Empty ledger (cold start) | Change Detector still runs; Precedent returns empty with warning |
| Precedent Engine fails | Continue with shifts only; `status: partial` |
| Forward Projector fails | Package without `forward_signals` |
| Mixed path | Decision and discussion jobs independent; shared `knowledge_id` in audit |

---

## 10. Observability

| Metric | Description |
| ------ | ----------- |
| `fe_jobs_consumed_total` | Discussion-path `source.ingested` events |
| `fe_previews_completed_total` | Successful change previews |
| `fe_precedent_matches_histogram` | Matches per preview |
| `fe_shifts_detected_histogram` | Shifts per preview |
| `fe_cold_start_previews_total` | Previews with zero precedents |
| `fe_grounding_score_histogram` | Grounding quality |

---

## 11. Module layout

```
architecture/modules/09-forecast-engine/
├── README.md
├── schemas/
│   └── change-preview.schema.json
├── events/
│   └── change.preview.ready.schema.json
└── diagrams/
    ├── forecast-pipeline.mmd
    └── forecast-internal-architecture.mmd
```
