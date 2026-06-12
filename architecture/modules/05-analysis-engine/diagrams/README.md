# Analysis Engine — Architecture Diagrams

Detailed design diagrams for module **05**. Complements the [module README](../README.md), [deep research](../research/analysis-engine-deep-research.md), and C4 L3 diagram at [`architecture/diagrams/c4/c4-component-analysis-engine.mmd`](../../../diagrams/c4/c4-component-analysis-engine.mmd).

---

## Diagram index

| Diagram | File | What it shows |
| ------- | ---- | ------------- |
| **Pipeline orchestration** | [analysis-orchestration.mmd](analysis-orchestration.mmd) | End-to-end flow: inputs, phases, stores, `insight.ready` output |
| **Internal architecture** | [analysis-internal-architecture.mmd](analysis-internal-architecture.mmd) | All layers: ingress, orchestration, sub-engine internals, egress |
| **Sub-engine DAG** | [analysis-subengine-dag.mmd](analysis-subengine-dag.mmd) | Profile routing, phase dependencies, outputs per sub-engine |
| **AI layer** | [analysis-ai-layer.mmd](analysis-ai-layer.mmd) | Deterministic vs LLM responsibilities, AI gateway, model policy |
| **Grounding pipeline** | [analysis-grounding-pipeline.mmd](analysis-grounding-pipeline.mmd) | Sequence: facts → LLM → verify → aggregate → Review Portal |

---

## 1. Internal architecture (layers)

```
Ingress          Orchestration       Sub-engines (DAG)              Egress
────────         ─────────────       ─────────────────              ──────
Job Consumer  →  Orchestrator    →   Phase 1: Ledger Diff      →  Aggregator
Context Loader   Profile Router      Phase 1: Impact           →  Quality Scorer
                                      Phase 2: Recommendation   →  Store + Publisher
                                                                  →  Audit Logger
```

See [analysis-internal-architecture.mmd](analysis-internal-architecture.mmd).

### Ingress layer

| Component | Role |
| --------- | ---- |
| **Job Consumer** | At-least-once delivery; idempotent on `classified_decision_id` |
| **Context Loader** | Read-only join across KPE tables + `classified_decisions` + routing profile |

### Orchestration layer

| Component | Role |
| --------- | ---- |
| **Analysis Orchestrator** | Executes DAG; per-stage timeout and retry; partial failure handling |
| **Profile Router** | Maps `routing.sub_engines` to enabled nodes; enforces dependency rules |

### Egress layer

| Component | Role |
| --------- | ---- |
| **Insight Aggregator** | Merges sub-engine outputs; validates against `insight-package.schema.json` |
| **Quality Scorer** | `completeness_score`, `grounding_score`, `review_priority` |
| **Insight Store Writer** | Persists full package to `insight_packages` (JSONB) |
| **Event Publisher** | Publishes lightweight `insight.ready`; portal loads by `insight_package_id` |
| **Audit Logger** | Sub-engine timings, retrieval counts, LLM call log |

---

## 2. Sub-engine DAG and profiles

See [analysis-subengine-dag.mmd](analysis-subengine-dag.mmd).

```
Phase 1 (parallel):  ledger_diff ──┐
                     impact       ──┤
                                    ▼
Phase 2:             recommendation ← requires diff + impact
                                    ▼
                     insight_aggregator
```

> **Forecast** is module 09 — discussion path only. See [09-forecast-engine](../../09-forecast-engine/).

| Profile | Sub-engines | LLM budget (target) |
| ------- | ----------- | ------------------- |
| `full_analysis` | diff, impact, recommendation | 2–3 calls, ~6K output tokens |
| `standard_analysis` | diff, impact, recommendation | 1–2 calls |
| `lightweight_analysis` | diff, recommendation | 0–1 calls |
| `review_first` | none | 0 calls |

**Hard dependency rules:**
- `impact` enabled → `ledger_diff` must be enabled
- `recommendation` enabled → `ledger_diff` must be enabled
- Violations → job rejected to DLQ

---

## 3. AI layer design

See [analysis-ai-layer.mmd](analysis-ai-layer.mmd).

### Design principle

> **Retrieval and reasoning paths are deterministic. LLM is synthesis second.**

The Analysis Engine is **not** a single end-to-end LLM prompt. AI is confined to narrating and enriching facts already retrieved or computed.

### Two-layer intelligence model

| Layer | Technology | Responsibilities |
| ----- | ---------- | ---------------- |
| **Deterministic** | Vector DB, BM25, graph traversal, rules, field diff, calibration | Retrieval, diff, impact, precedent patterns, required recommendations, scores |
| **Generative (LLM)** | Model router + JSON schema + grounding verifier | Headlines, summaries, outcome narratives, optional recommendation enrichment |

### LLM usage per sub-engine

| Sub-engine | Deterministic core | LLM role (if enabled) |
| ---------- | ------------------ | --------------------- |
| **Ledger Diff** | Hybrid retrieval, RRF, field diff, change classification | Headline + summary **only from** structured `changes[]` |
| **Impact** | Graph traversal, risk dimension scoring | Optional `summary` from traversal facts |
| **Recommendation** | Rule engine (required items) | Additional `recommended` / `optional` items; **cannot override** required rules |

> **Precedent / change capture for discussions** → [Forecast Engine (module 09)](../../09-forecast-engine/README.md), not Analysis.

### Where LLM must NOT be used

- Dependency / blast-radius discovery (use graph)
- Ledger candidate retrieval (use hybrid search)
- Required governance gates (use rule engine)
- Confidence and quality scores (use calibration formulas)
- Change classification mapping (use deterministic diff patterns + graph boost)

### AI gateway components

```
Model Router → JSON Schema Validator → Grounding Verifier → Fail-Closed Filter
```

| Component | Function |
| --------- | -------- |
| **Model Router** | Default fast tier (Haiku / GPT-4o-mini class); escalate to larger model for ≤5% complex hybrid jobs |
| **JSON Schema Validator** | Structured output mode on every LLM call |
| **Grounding Verifier** | SafePassage / DRAFT pattern — verify `evidence_refs`, `grounded_in`, ledger IDs, graph edges |
| **Fail-Closed Filter** | Drop any claim that fails verification; never pass hallucinated deltas to Review Portal |

### Model tiering

| Task | Model tier |
| ---- | ---------- |
| Recommendation enrichment | Small / fast |
| Cross-encoder rerank | Dedicated reranker (non-generative) |
| Complex hybrid decisions | Large model escalation (≤5% of jobs) |

### Phase 1 (MVP) AI scope

| Component | AI usage |
| --------- | -------- |
| Ledger Diff | Rule-based diff; optional headline LLM; no rerank |
| Impact | Graph traversal only; optional summary LLM |
| Recommendation | **Rule engine only** (10–15 rules) |

Forecast Engine (module 09) is a separate service — see [09-forecast-engine](../../09-forecast-engine/README.md).

---

## 4. Grounding and trust flow

See [analysis-grounding-pipeline.mmd](analysis-grounding-pipeline.mmd).

Every generative claim must be traceable:

| Claim type | Evidence required |
| ---------- | ----------------- |
| Ledger diff field | `evidence_candidate` + `evidence_ledger` or ledger record ID |
| Change classification | Primary ledger reference + relationship rationale |
| Affected system | Graph edge ID or KPE entity reference |
| Recommendation | `evidence_refs[]` → `ledger_diff`, `impact_map`, etc. |

**Quality scores:**
- `grounding_score` = % of claims with valid evidence
- `review_priority` upgraded on `conflicts`, high blast radius, low grounding

---

## 5. Ledger Diff Engine — internal pipeline

Embedded in [analysis-internal-architecture.mmd](analysis-internal-architecture.mmd) (Ledger Diff subgraph):

```
Stage 1 — Hybrid retrieval (parallel)
  vector search → top 30
  BM25 / metadata filter → top 30
  graph expand (supersedes, conflicts_with) → top 20

Stage 2 — Fusion + rerank
  RRF (k=60) → cross-encoder → top 5

Stage 3 — Primary reference selection
  baseline ledger record for diff

Stage 4 — Structured field diff
  8 dimensions: scope, technology, constraint, policy, timeline, ownership, status, rationale

Stage 5 — Change classification
  first_of_kind | extends | amends | supersedes | conflicts | reaffirms | duplicate
```

**Trust rule:** only **approved** Decision Ledger records (weight 1.0) may be diff baselines.

---

## 6. Impact Engine — internal pipeline

```
Pass 1 — Seed identification (KPE entities → graph nodes)
Pass 2 — Graph traversal (2–3 hops: depends_on, owned_by)
Pass 3 — Org mapping + risk scoring (technical, delivery, people)
```

Phase 1 risk dimensions exclude `compliance` and `financial` (deferred — confidential data).

---

## 7. Data stores used by Analysis Engine

| Store | Read / Write | Used by |
| ----- | ------------ | ------- |
| Knowledge Processing tables | Read | Context Loader, Impact seeds |
| `classified_decisions` | Read | Context Loader, routing |
| Decision Ledger | Read | Ledger Diff |
| Vector DB (pgvector) | Read | Ledger Diff retrieval |
| Decision Knowledge Graph | Read / Write | Ledger Diff (relationships), Impact (traversal) |
| `insight_packages` | Write | Insight Store Writer |

---

## Render diagrams

From repo root or this directory:

```bash
npx @mermaid-js/mermaid-cli -i analysis-internal-architecture.mmd -o analysis-internal-architecture.png -b transparent
npx @mermaid-js/mermaid-cli -i analysis-ai-layer.mmd -o analysis-ai-layer.png -b transparent
```

Or use the C4 render script at [`architecture/diagrams/c4/render.sh`](../../../diagrams/c4/render.sh).
