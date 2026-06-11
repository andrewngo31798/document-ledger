# Classification Engine — Design

Module **04** in the Document Ledger pipeline. Classifies decision candidates from structured knowledge into business/technical domains, applies taxonomy tags, scores confidence, and routes each decision to the appropriate Analysis Engine profile.

Related docs: [System Architecture](../../overview/architecture.md) · [Responsibility Matrix](../../overview/module-responsibility-matrix.md) · [Knowledge Processing Engine](../03-knowledge-processing/) · [Analysis Engine](../05-analysis-engine/)

---

## 1. Role

```
Classification Engine = assign domain, category, and analysis routing to each decision candidate
```

| Responsibility | Description |
| -------------- | ----------- |
| Consume ingested knowledge | Pull `source.ingested` events from Queue / Event Bus |
| Load decision candidates | Fetch knowledge record, candidates, entities, and evidence spans |
| Classify domain | Assign `business`, `technical`, or `hybrid` |
| Assign categories | Apply taxonomy labels (architecture, security, product scope, …) |
| Score confidence | Produce calibrated confidence per classification |
| Route analysis | Select Analysis Engine profile and sub-engine set |
| Persist classification | Store classified decision records |
| Publish completion | Emit `decision.classified` per candidate for Analysis Engine |

### Scope boundaries

| In scope | Out of scope |
| -------- | -------------- |
| Domain and category classification | Fetching raw source content |
| Tag assignment and confidence scoring | Entity extraction or decision detection |
| Analysis routing profile selection | Ledger diff, impact, forecast computation |
| Publishing `decision.classified` | Human review or ledger write |

**Unit of work:** one `decision.classified` event per **decision candidate**, not per knowledge record. A knowledge record with three candidates produces three classified decisions.

---

## 2. Architecture

```
Queue / Event Bus
  │ source.ingested
  ▼
┌─────────────────────────────────────────────────────────┐
│                 Classification Engine                    │
│                                                          │
│  Job Consumer ──► Knowledge Loader                       │
│                         │                                │
│                         ▼                                │
│              Classification Orchestrator                 │
│                         │                                │
│         ┌───────────────┼───────────────┐                │
│         ▼               ▼               ▼                │
│    Rule Engine    Domain Classifier   LLM Classifier     │
│    (Tier 1)       (Tier 2)            (Tier 3)           │
│                         │                                │
│                         ▼                                │
│              Tag Assigner ──► Confidence Calibrator      │
│                         │                                │
│                         ▼                                │
│                   Analysis Router                        │
│                         │                                │
│              Classification Store Writer                 │
│              Event Publisher ──► Audit Logger            │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼
   PostgreSQL (classified_decisions)
          │
          ▼
   Queue / Event Bus ──► Analysis Engine
     decision.classified
```

### Classification cascade (per candidate)

```
Decision candidate + entities + source metadata
  → Tier 1: Rule Engine (source_type, signal_type, keywords, entity hints)
  → Tier 2: Domain Classifier (embedding + multi-label model)
  → Tier 3: LLM Classifier (ambiguous cases only)
  → Tag Assigner (categories + tags)
  → Confidence Calibrator
  → Analysis Router
  → Persist + publish
```

Exit early when Tier 1 or Tier 2 confidence ≥ threshold (default 0.80). Full research: [research/classification-taxonomy-and-models.md](research/classification-taxonomy-and-models.md).

---

## 3. Internal components

| Component | Purpose | Notes |
| --------- | ------- | ----- |
| **Job Consumer** | Subscribe to `source.ingested`, deserialize payload | At-least-once; idempotent on `knowledge_id` + `decision_candidate_id` |
| **Knowledge Loader** | Load knowledge record, candidates, entities, chunks by `knowledge_id` | Read-only from Knowledge Processing tables |
| **Classification Orchestrator** | Iterate candidates, run cascade, handle partial failure | One candidate failure does not block others |
| **Rule Engine** | Tier 1 deterministic classification | Source rules, signal_type hints, keyword lists |
| **Domain Classifier** | Tier 2 ML multi-label classifier | Embedding + linear/gradient boosting or fine-tuned encoder |
| **LLM Classifier** | Tier 3 semantic classification | Structured JSON output; escalation only |
| **Tag Assigner** | Map classifier output to taxonomy categories and tags | Uses [decision-taxonomy.json](taxonomy/decision-taxonomy.json) |
| **Confidence Calibrator** | Map raw scores to calibrated confidence | Isotonic regression or conformal prediction on held-out set |
| **Analysis Router** | Select `analysis_profile` and enabled sub-engines | See routing matrix in §7 |
| **Classification Store Writer** | Persist `classified_decisions` rows | Transactional write |
| **Event Publisher** | Publish one `decision.classified` per candidate | Includes `classified_decision_id` |
| **Audit Logger** | Record tier used, scores, routing rationale | Correlates with `job_id`, `trace_id` |

---

## 4. Event contracts

### Input: `source.ingested`

Consumed from Queue / Event Bus. Produced by Knowledge Processing Engine. Schema: [../03-knowledge-processing/events/source.ingested.schema.json](../03-knowledge-processing/events/source.ingested.schema.json).

Classification Engine loads the full knowledge object by `payload.knowledge_id`. It does not re-fetch raw source content.

### Output: `decision.classified`

Published once per classified decision candidate. Consumed by Analysis Engine.

Schema: [events/decision.classified.schema.json](events/decision.classified.schema.json)

```json
{
  "event_type": "decision.classified",
  "event_id": "uuid",
  "occurred_at": "2026-06-10T12:02:00Z",
  "tenant_id": "tenant-abc",
  "job_id": "job-uuid",
  "trace_id": "trace-uuid",
  "payload": {
    "classified_decision_id": "cd-uuid",
    "knowledge_id": "know-uuid",
    "decision_candidate_id": "dc-uuid",
    "classification": {
      "domain": "technical",
      "categories": ["architecture", "security_compliance"],
      "tags": ["authentication", "oauth2"],
      "confidence": 0.87,
      "method": "hybrid",
      "rationale": "Architecture choice with auth/security entities present",
      "taxonomy_version": "1.0.0"
    },
    "routing": {
      "analysis_profile": "full_analysis",
      "sub_engines": ["ledger_diff", "impact", "forecast", "recommendation"],
      "priority": "normal"
    },
    "source_context": {
      "source_type": "confluence",
      "source_external_id": "ADR-0042",
      "signal_type": "architecture_choice"
    }
  }
}
```

---

## 5. Data model

### `classified_decisions` (PostgreSQL)

| Column | Type | Description |
| ------ | ---- | ----------- |
| `id` | UUID | Primary key (`classified_decision_id`) |
| `tenant_id` | UUID | Tenant scope |
| `job_id` | UUID | Originating job |
| `knowledge_id` | UUID | FK → knowledge_records |
| `decision_candidate_id` | UUID | FK → decision_candidates |
| `domain` | VARCHAR | business, technical, hybrid |
| `categories` | JSONB | Array of taxonomy category IDs |
| `tags` | JSONB | Free-form tags |
| `confidence` | FLOAT | Calibrated 0.0–1.0 |
| `classification_method` | VARCHAR | rule, classifier, llm, hybrid |
| `analysis_profile` | VARCHAR | full_analysis, standard_analysis, … |
| `sub_engines` | JSONB | Enabled Analysis sub-engines |
| `priority` | VARCHAR | low, normal, high |
| `rationale` | TEXT | Human-readable classification reason |
| `taxonomy_version` | VARCHAR | Taxonomy version used |
| `status` | VARCHAR | classified, failed, skipped |
| `created_at` | TIMESTAMPTZ | Record creation |

Candidates with `decision_candidate_count = 0` on a knowledge record produce no `decision.classified` events; the job completes with audit note `no_candidates`.

---

## 6. Classification taxonomy

Canonical taxonomy: [taxonomy/decision-taxonomy.json](taxonomy/decision-taxonomy.json)

### Domain (mutually exclusive)

| Domain | Description |
| ------ | ----------- |
| `business` | Product, budget, organizational, policy decisions |
| `technical` | Architecture, infrastructure, security, data, integration decisions |
| `hybrid` | Material business and technical consequences |

### Categories (multi-label)

| Category ID | Typical domain | ADR-significant |
| ----------- | -------------- | --------------- |
| `architecture` | technical, hybrid | Yes |
| `infrastructure` | technical | Yes |
| `security_compliance` | technical, hybrid | Yes |
| `data_storage` | technical | Yes |
| `integration_api` | technical | Yes |
| `product_scope` | business, hybrid | No |
| `process_governance` | business, hybrid | No |
| `financial_budget` | business | No |
| `organizational` | business | No |
| `vendor_procurement` | business, hybrid | Sometimes |

Categories align with ADR impact areas ([AWS ADR guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/), [Structured MADR tags](https://smadr.dev/)).

---

## 7. Analysis routing

| Condition | Analysis profile | Sub-engines enabled |
| --------- | ---------------- | ------------------- |
| `technical` or `hybrid` + ADR-significant category + confidence ≥ 0.75 | `full_analysis` | ledger_diff, impact, forecast, recommendation |
| `business` domain + confidence ≥ 0.75 | `standard_analysis` | ledger_diff, impact, recommendation |
| Low-risk category (`organizational`, `process_governance`) + confidence ≥ 0.80 | `lightweight_analysis` | ledger_diff, recommendation |
| Confidence < 0.60 | `review_first` | none (skip automated analysis) |
| Confidence 0.60–0.74 | `full_analysis` + `priority: high` | all; flag for Review Portal attention |

Rules are tenant-configurable overrides on top of defaults. Analysis Engine reads `routing.sub_engines` from the event payload.

---

## 8. Tier 1 rule examples

| Rule | Condition | Output |
| ---- | --------- | ------ |
| ADR page | `source_type=confluence` + path/label contains `ADR` or Structured MADR frontmatter | domain=`technical`, categories=`[architecture]` |
| Architecture signal | `signal_type=architecture_choice` | domain=`technical`, categories=`[architecture]` |
| Policy signal | `signal_type=policy_change` | domain=`business`, categories=`[process_governance]` |
| Security entities | entities include `technology` matching security keywords | add `security_compliance` |
| GitHub PR | `source_type=github` + infra/terraform paths in entities | categories=`[infrastructure]` |
| Budget keywords | text contains budget/spend/cost approval phrases | domain=`business`, categories=`[financial_budget]` |

Rules produce `method: rule` and short-circuit when confidence ≥ 0.90.

---

## 9. Reliability

| Concern | Strategy |
| ------- | -------- |
| Delivery | At-least-once from queue; idempotent on `decision_candidate_id` + `taxonomy_version` |
| Zero candidates | Complete job with audit; no events published |
| Partial candidate failure | Classify remaining candidates; failed ones logged and DLQ optional |
| Tier 3 unavailable | Fall back to Tier 2 result with `method: classifier`; lower confidence flag |
| Taxonomy upgrade | Re-classification job replays stored candidates with new taxonomy version |

---

## 10. Observability

| Metric | Description |
| ------ | ----------- |
| `ce_jobs_consumed_total` | `source.ingested` events processed |
| `ce_candidates_classified_total` | Candidates classified successfully |
| `ce_candidates_skipped_total` | Candidates skipped (zero candidates, failed) |
| `ce_tier_usage_total` | Count by tier (rule, classifier, llm) |
| `ce_confidence_histogram` | Calibrated confidence distribution |
| `ce_routing_profile_total` | Count by analysis_profile |

Structured logs include `knowledge_id`, `decision_candidate_id`, `classified_decision_id`, `domain`, `analysis_profile`.

---

## 11. Dependencies

| Dependency | Direction | Contract |
| ---------- | --------- | -------- |
| Queue / Event Bus | In | `source.ingested` |
| Queue / Event Bus | Out | `decision.classified` |
| Knowledge Processing Engine | Upstream | Provides knowledge records and decision candidates |
| Analysis Engine | Downstream | Consumes `decision.classified` |
| PostgreSQL | Storage | Reads knowledge tables; writes classified_decisions |

---

## 12. Open decisions

| # | Decision | Recommendation | Status |
| - | -------- | -------------- | ------ |
| 1 | Taxonomy scope | 3 domains, 10 categories (v1.0) — see taxonomy file | **Proposed** |
| 2 | Classification model | 3-tier cascade: rules → embedding classifier → LLM | **Proposed** — see [research](research/classification-taxonomy-and-models.md) |
| 3 | Confidence calibration | Isotonic regression on held-out labeled set; threshold 0.80 exit / 0.60 review-first | **Proposed** |
| 4 | Multi-label strategy | Hierarchical multi-label with threshold per category | TBD |
| 5 | Re-classification | Batch replay when taxonomy version bumps | TBD |

---

## 13. Module layout

```
architecture/modules/04-classification/
├── README.md                              ← this design
├── research/
│   └── classification-taxonomy-and-models.md
├── taxonomy/
│   └── decision-taxonomy.json
├── events/
│   └── decision.classified.schema.json
└── diagrams/
    └── classification-pipeline.mmd
```
