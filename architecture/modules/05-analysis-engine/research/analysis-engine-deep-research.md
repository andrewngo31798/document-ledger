# Deep Research: Analysis Engine

Comprehensive investigation for **Analysis Engine** (module 05) — the **decision-path** intelligence layer. Covers orchestration, three sub-engines (Ledger Diff, Impact, Recommendation), grounding, evaluation, and phased implementation.

> **Forecast Engine** (change capture, precedent Q&A for discussions) is **module 09** — see [09-forecast-engine/README.md](../../09-forecast-engine/README.md). It is not an Analysis sub-engine.

Related: [Module README](../README.md) · [Classification routing](../04-classification/README.md) · [Insight package schema](../schemas/insight-package.schema.json)

---

## Executive summary

The Analysis Engine is not a single LLM call. Its **primary job** is to answer:

> **What changes compared to the current Decision Ledger?**

Production-grade decision analysis requires:

1. **Ledger diff first** — structured comparison against approved records before impact analysis
2. **Deterministic retrieval and graph traversal** — impact discovery must be auditable
3. **LLM synthesis second** — only for diff summarization and recommendation drafting grounded in retrieved facts
4. **DAG orchestration** — Ledger Diff + Impact in parallel → Recommendation
5. **Profile-based execution** — Classification Engine controls cost/latency via `routing.sub_engines`
6. **Grounded insight packages** — every claim traceable; Review Portal is the trust gate, not the model

Recommended architecture: **Ledger-centric diff** with hybrid retrieval against the Decision Ledger, GraphRAG for impact, and governance-oriented recommendation synthesis.

---

## Part 1 — Orchestration architecture

### 1.1 Why DAG, not parallel fan-out

The three sub-engines are **not independent**:

| Sub-engine | Depends on |
| ---------- | ---------- |
| Ledger Diff | Context loader + Decision Ledger (read) |
| Impact | Context loader only |
| Recommendation | Ledger diff + Impact (+ rules) |

**Recommended DAG:**

```
decision.classified
       │
       ├─► [Phase 1] Ledger Diff Engine ─────┐   ← primary output: ledger_diff
       │                                    │
       └─► [Phase 1] Impact Engine ────────┤
                                            ▼
                         [Phase 2] Recommendation Engine
                                            │
                                            ▼
                              Insight Aggregator → Quality Scorer
```

Phase 1 parallelizes ledger comparison (I/O-heavy retrieval + diff) alongside impact traversal. Phase 2 synthesizes governance recommendations grounded in both.

**Discussion-path precedent and change capture** → [Forecast Engine (module 09)](../../09-forecast-engine/README.md).

### 1.2 Profile-based routing

Classification Engine passes `routing.sub_engines`. Analysis Orchestrator validates and maps to DAG nodes:

| Profile | Enabled nodes | Skip |
| ------- | ------------- | ---- |
| `full_analysis` | ledger_diff, impact, recommendation | — |
| `standard_analysis` | ledger_diff, impact, recommendation | — |
| `lightweight_analysis` | ledger_diff, recommendation | impact (optional stub) |
| `review_first` | none | all sub-engines |

**Dependency rules:**
- If `impact` enabled → `ledger_diff` MUST be enabled
- If `recommendation` enabled → `ledger_diff` MUST be enabled
- Violations → reject job to DLQ with audit error

### 1.3 Orchestration patterns (production)

| Pattern | When to use |
| ------- | ----------- |
| **In-process async DAG** | MVP/demo; single worker service |
| **Workflow engine (Temporal, Cadence)** | Production; durable timers, retries, human signals for re-analysis |
| **Event-driven choreography** | Each sub-engine as separate consumer on internal topics — higher ops cost |

For Document Ledger MVP: **in-process DAG** with stage-level retry. Migrate to Temporal when re-analysis from Review Portal (`Revision` outcome) requires durable workflows.

### 1.4 Partial failure strategy

| Failed stage | Behavior |
| ------------ | -------- |
| Ledger Diff fails | Job fails or `ledger_diff.change_classification: no_ledger_match` with warning; no insight without headline |
| Impact fails | Continue with empty impact_map; lower grounding score; warn in package |
| Recommendation fails | Return package with analysis sections but empty recommendations |
| Aggregator/schema fail | Job fails; no `insight.ready`; DLQ |

Never publish an insight package with `status: completed` if decision summary is missing.

### 1.5 Token and cost budget

| Profile | LLM budget (target) | Graph/vector queries |
| ------- | ------------------- | -------------------- |
| `full_analysis` | 2–3 calls, ~6K output tokens | 5–15 |
| `standard_analysis` | 1–2 calls | 3–8 |
| `lightweight_analysis` | 0–1 calls | 1–3 |
| `review_first` | 0 calls | 0 |

LLM calls are reserved for diff/recommendation synthesis — not for retrieval. Discussion precedent Q&A is handled by Forecast Engine (module 09).

---

## Part 2 — Impact Engine

### 2.1 Problem definition

Given a classified decision, answer: **What systems, teams, contracts, and business capabilities could be affected if this decision is adopted or if it fails?**

This is a **change impact assessment (CIA)** problem applied to organizational decisions, not just code changes ([Tricentis CIA guide](https://www.tricentis.com/learn/change-impact-assessment), [Virima blast radius](https://virima.com/blog/change-risk-assessment-in-it)).

### 2.2 Blast radius dimensions

Adopt NILUS microservices blast-radius framework ([NILUS Consulting](https://www.nilus.be/blog/architecture_change_blast_radius_in_microservices/)):

| Dimension | What it measures | Document Ledger source |
| --------- | ---------------- | ---------------------- |
| **Code blast radius** | Repos/services touched | GitHub entities, tags |
| **Contract blast radius** | APIs, events, schemas | integration_api category, entities |
| **Runtime blast radius** | Live request paths affected | Service catalog graph |
| **Semantic blast radius** | Business meaning changes | Decision text + domain |
| **Organizational blast radius** | Teams, roadmaps, SLAs | Team nodes, ownership edges |

Most tools stop at technical blast radius. Pass 4-style **organizational mapping** is critical — a low technical risk decision can have high organizational impact ([Blast Radius Analyzer](https://github.com/amitgambhir/blast-radius-analyzer)).

### 2.3 Recommended approach

**Three-pass impact analysis:**

```
Pass 1 — Seed identification
  • Extract seed entities from decision candidate + KPE entities
  • Map technologies/systems mentioned to graph nodes
  • Apply category hints (architecture → expand to dependent systems)

Pass 2 — Graph traversal (2–3 hops)
  • Traverse depends_on, owned_by, integrates_with edges
  • Depth 2 default; depth 3 for infrastructure/security categories
  • Score nodes by hop distance + betweenness centrality

Pass 3 — Organizational + risk synthesis
  • Map affected systems → owning teams
  • Score 3 risk dimensions: technical, delivery, people
  • Skip compliance and financial for now (may involve confidential data; deferred to Phase 2+)
  • LLM summarizes ONLY from structured traversal results (no free-form guessing)
```

GraphRAG pattern: *"Which components are affected if the authentication service fails?"* is answered by graph traversal, not vector search ([PuppyGraph GraphRAG](https://www.puppygraph.com/blog/graphrag-architecture)).

### 2.4 Data sources (priority order)

| Source | Trust | Availability |
| ------ | ----- | ------------ |
| Extracted entities (KPE) | Medium | Always |
| Decision Knowledge Graph | Medium–High | Grows over time |
| Approved Decision Ledger (related systems) | High | After initial approvals |
| Tenant service catalog (CMDB) | High | Phase 2 integration |
| Code dependency graphs | High | Phase 3 (GitHub integration) |

Cold start (empty graph): Impact Engine returns entity-only impact list with low blast_radius_score and warning `graph_coverage: sparse`.

### 2.5 Impact map schema highlights

```json
{
  "summary": "OAuth2 migration affects auth-service and 4 downstream consumers",
  "blast_radius_score": 0.72,
  "affected_systems": [
    {
      "name": "payment-service",
      "impact_level": "indirect",
      "hop_distance": 2,
      "evidence": "depends_on auth-service (graph edge id: e-142)"
    }
  ],
  "affected_teams": [
    {
      "name": "Platform",
      "impact_type": "implementation",
      "rationale": "owns auth-service"
    }
  ],
  "risk_dimensions": {
    "technical": 0.7,
    "delivery": 0.5,
    "people": 0.4
  }
}
```

### 2.6 Anti-patterns

| Anti-pattern | Problem |
| ------------ | ------- |
| LLM-only impact guessing | Hallucinated dependencies |
| Unlimited graph depth | Noise explosion, latency |
| Ignoring organizational pass | Misses high-risk low-technical changes |
| Static architecture docs | Stale dependency maps ([Tricentis](https://www.tricentis.com/learn/change-impact-assessment)) |

---

## Part 3 — Ledger Diff Engine

### 3.1 Problem definition

Given a classified decision candidate, answer the **primary Analysis Engine question**:

> **What changes compared to the current Decision Ledger?**

This is not "find similar documents." It is **structured comparison** against approved organizational decisions — analogous to diffing a proposed change against the canonical record.

Reviewers should see, in order:
1. **Headline** — one sentence: what changed vs ledger
2. **Change classification** — first_of_kind | extends | amends | supersedes | conflicts | reaffirms | duplicate
3. **Field-level deltas** — scope, technology, constraints, policy, timeline, ownership
4. **Primary ledger reference** — which approved record is the baseline for comparison

### 3.2 Why retrieval alone is insufficient

Hybrid retrieval finds *related* ledger records. The Ledger Diff Engine must go further:

| Stage | Output | Reviewer value |
| ----- | ------ | -------------- |
| Retrieval | Top-N ledger candidates | "These might be relevant" |
| Relationship classification | supersedes_target, conflicts_with, … | "This is the record to compare against" |
| **Structured diff** | `changes[]` with candidate vs ledger values | **"OAuth2 replaces SAML on auth-api"** |
| Change classification | `conflicts` | **"Cannot approve without resolving ADR-0042"** |

### 3.3 Recommended pipeline

```
Stage 1 — Ledger candidate retrieval (parallel)
  ├── Vector search (candidate embedding vs ledger embeddings) → top 30
  ├── BM25 / metadata filter (categories, tags, domain, technologies) → top 30
  └── Graph expand (supersedes, conflicts_with, references shared systems) → top 20

Stage 2 — Fusion + rerank
  └── RRF (k=60) → cross-encoder rerank → top 5 ledger records

Stage 3 — Primary reference selection
  └── Pick baseline record (highest rerank + graph relationship to same scope/system)

Stage 4 — Structured diff (deterministic + LLM-assisted)
  ├── Extract comparable dimensions from candidate + primary ledger record
  ├── Diff each dimension: added | removed | modified | replaced | unchanged
  ├── Ground each delta with evidence_candidate + evidence_ledger spans
  └── LLM synthesizes headline + summary ONLY from structured diff

Stage 5 — Change classification
  └── Map diff pattern → first_of_kind | extends | amends | supersedes | conflicts | reaffirms | duplicate
```

### 3.4 Comparable dimensions

| Dimension | Candidate source | Ledger source |
| --------- | ---------------- | ------------- |
| `scope` | Entities (systems, projects) | Ledger record scope metadata |
| `technology` | Technology entities | Ledger technology choices |
| `constraint` | Decision text (must, shall, require) | Prior constraints |
| `policy` | Compliance/security categories | Prior policy decisions |
| `timeline` | Dates, milestones in source | Ledger effective dates |
| `ownership` | Team entities | Ledger owning team |
| `status` | Proposed vs deprecated language | Ledger record status |
| `rationale` | Evidence span reasoning | Prior rationale section |

### 3.5 Embedding and indexing

Re-index Decision Ledger on every approved write (module 07 → Analysis Engine read path). Embed decision candidate text, categories, tags, and approved ledger summaries.

### 3.6 Trust tiers for ledger reads

| Source | Trust weight | Use |
| ------ | ------------ | --- |
| Approved Decision Ledger | 1.0 | **Only source for diff baseline** |
| Pending insight packages | 0.0 | Never used for diff |
| Raw knowledge records | 0.0 | Never used for diff |

### 3.7 Cold start behavior

When ledger is empty:
- `ledger_diff.change_classification: first_of_kind`
- `ledger_diff.headline`: "No approved decisions in ledger — this would establish a new baseline"
- Add quality warning `no_ledger_baseline`
- Recommendation Engine adds `document_as_first_adr` with `ledger_action: approve_new`

### 3.8 Conflict and supersession detection

| Diff pattern | Classification | Recommendation hint |
| ------------ | -------------- | ------------------- |
| Same scope + replaced technology | `supersedes` or `conflicts` | `approve_supersedes` or `resolve_conflict` |
| Same scope + added constraint | `amends` | `approve_amendment` |
| Same scope + no material delta | `reaffirms` | Fast-track |
| High similarity, same scope | `duplicate` | `reject_duplicate` |
| New scope/system | `extends` or `first_of_kind` | `approve_new` |

Graph `supersedes` / `conflicts_with` edges boost conflict/supersedes classification.

### 3.9 Anti-patterns

| Anti-pattern | Problem |
| ------------ | ------- |
| Similarity list without diff | Reviewers still ask "so what changed?" |
| LLM-only diff | Hallucinated deltas vs ledger |
| Diff against unapproved records | Compares to draft noise |
| Missing primary reference | Cannot audit baseline |

---

## Part 4 — Forecast Engine (moved to Module 09)

Forecast is **no longer an Analysis sub-engine**. It runs on the **discussion path** when Knowledge Processing detects a `discussion_signal` without a decision candidate.

| Concern | Owner module |
| ------- | -------------- |
| What's shifting in a thread? | Forecast — Change Detector |
| Have we seen this before? | Forecast — Precedent Engine |
| Optional forward signals | Forecast — Forward Projector |
| Decision diff vs ledger | Analysis — Ledger Diff |
| Blast radius for a **decision** | Analysis — Impact |

Full design, schemas, and diagrams: **[09-forecast-engine/README.md](../../09-forecast-engine/README.md)**.

---

## Part 5 — Recommendation Engine

### 5.1 Problem definition

Given full analysis context, answer: **What governance, documentation, communication, and implementation actions should the team consider before approving this decision?**

Recommendations are **proposals for human review**, not autonomous actions. This aligns with HITL governance patterns ([Cordum HITL patterns](https://cordum.io/blog/human-in-the-loop-ai-patterns), [Agent Native approval flow](https://www.agentnative.dev/patterns/human-in-the-loop-approval-flow-pattern)).

### 5.2 Recommendation types

| Type | Examples |
| ---- | -------- |
| `governance` | Require architecture review, security sign-off, CAB approval |
| `documentation` | Create/update ADR, Structured MADR, Confluence page |
| `review` | Escalate to Security team, legal review for compliance category |
| `implementation` | Spike, POC, phased rollout, feature flag |
| `communication` | Notify affected teams, update roadmap stakeholders |
| `rollback_plan` | Document revert procedure before approval |

### 5.3 Two-layer synthesis

```
Layer 1 — Rule engine (deterministic, always runs)
  • IF category=architecture AND no similar ADR → recommend create_adr (required)
  • IF blast_radius_score > 0.7 → recommend cab_review (required)
  • IF similar decision conflicts → recommend conflict_resolution (required)
  • IF domain=security_compliance → recommend security_review (required)
  • IF classification.confidence < 0.65 → recommend manual_reclassification (recommended)

Layer 2 — LLM synthesis (optional enrichment)
  • Input: impact_map + ledger_diff + rule outputs
  • Output: additional recommended/optional items with rationale
  • MUST NOT override required rule items
  • MUST include evidence_refs for each item
```

Runtime governance principle: policy decisions live **outside** the model ([AI Pattern Book — runtime governance](https://www.aipatternbook.com/runtime-governance.md)). Rules are version-controlled; LLM enriches but does not gate.

### 5.4 Priority levels

| Priority | Meaning in Review Portal |
| -------- | ------------------------ |
| `required` | Blocker checklist item before approval |
| `recommended` | Strong suggestion; reviewer may waive with rationale |
| `optional` | Nice-to-have |

### 5.5 Anti-patterns

| Anti-pattern | Problem |
| ------------ | ------- |
| LLM-only recommendations | Non-deterministic governance gaps |
| Actionable execution (auto-create Jira) | Violates Review Portal gate |
| Generic "consider impact" items | Noise; reviewers ignore package |
| Missing evidence_refs | Cannot audit why recommendation appeared |

---

## Part 6 — Insight aggregation and quality

### 6.1 Insight package assembly

Insight Aggregator:
1. Validates all sections against [insight-package.schema.json](../schemas/insight-package.schema.json)
2. Stamps `provenance` (sub-engines run, model versions, query counts, duration)
3. Computes quality scores
4. Sets `review_priority`

### 6.2 Quality scoring

| Score | Computation |
| ----- | ----------- |
| `completeness_score` | Weighted section presence for profile (full_analysis expects ledger_diff + impact + recommendations) |
| `grounding_score` | % claims with valid evidence in ledger_diff, impact, recommendations |
| `review_priority` | Base from Classification `routing.priority`; upgrade on `ledger_diff.change_classification: conflicts`, high blast radius, or low grounding |

| Condition | review_priority |
| --------- | --------------- |
| `review_first` profile | urgent |
| `ledger_diff.change_classification: conflicts` | urgent |
| `ledger_diff.change_classification: supersedes` | high |
| blast_radius_score > 0.8 | high |
| grounding_score < 0.5 | high |
| Default | normal |

### 6.3 Review Portal contract

Review Portal expects:
- **`ledger_diff` rendered first** — headline, change badge, field-level delta table
- Renderable sections per sub-engine output
- Provenance expandable (which model, which ledger IDs)
- Required recommendations flagged as checklist
- Edit/revision triggers re-analysis event (future: `decision.reanalyze` → Analysis Engine)

---

## Part 7 — Decision Knowledge Graph

### 7.1 Role in Analysis Engine

The graph is the **shared substrate** for Impact and Ledger Diff:

| Engine | Graph use |
| ------ | --------- |
| Ledger Diff | supersedes/conflicts_with edges, shared system overlap for baseline selection |
| Impact | Multi-hop dependency traversal |
| Recommendation | Conflict detection |

Forecast Engine (module 09) reads the same ledger for **discussion precedent** — separate path.

### 7.2 MVP graph (PostgreSQL)

Tables: `graph_nodes`, `graph_edges` with tenant_id scoping.

Population sources:
- KPE extracted entities → system, team, technology nodes
- Approved ledger records → decision nodes + reference edges
- Manual tenant catalog import → depends_on edges

Phase 2: Neo4j or FalkorDB when traversal latency or multi-tenant isolation requires ([FalkorDB GraphRAG SDK](https://www.falkordb.com/blog/graphrag-sdk-knowledge-graph/)).

### 7.3 Ontology (minimal v1)

**Nodes:** system, team, technology, project, decision

**Edges:** depends_on, owned_by, references, supersedes, conflicts_with, implements

Extend incrementally — poorly designed ontologies produce sparse noisy graphs ([FalkorDB](https://www.falkordb.com/blog/graphrag-sdk-knowledge-graph/)).

### 7.4 GraphRAG routing strategy

| Query shape | Strategy |
| ----------- | -------- |
| "What does this affect?" | Local search: seed entities + 2-hop traversal |
| "Related past decisions?" | Hybrid: vector seeds + graph edge boost |
| Portfolio themes | Global community summaries (Phase 3) |

Do not run full GraphRAG on every decision — 80% of queries need local traversal only ([Atlan GraphRAG guidance](https://atlan.com/know/what-is-graphrag/)).

---

## Part 8 — LLM usage policy

### 8.1 Where LLM adds value

| Sub-engine | LLM role |
| ---------- | -------- |
| Ledger Diff | Reranker + headline/summary synthesis from structured diff |
| Impact | Summarize traversal results (optional) |
| Recommendation | Enrich rule output with contextual suggestions |

### 8.2 Where LLM must NOT be used alone

- Dependency discovery (use graph)
- Precedent retrieval (use hybrid search)
- Required governance rules (use rule engine)
- Confidence scores (use calibration)

### 8.3 Structured output requirements

All LLM calls use JSON schema mode with:
- `grounded_in[]` or `evidence_refs[]` on every generative claim
- Post-validation: substring/graph/ledger ID verification
- Fail closed: drop ungrounded items

DRAFT + SafePassage patterns from module 03 apply here.

### 8.4 Model tiering

| Task | Model tier |
| ---- | ---------- |
| Recommendation enrichment | Small/fast |
| Cross-encoder rerank | Dedicated reranker model (no generative LLM) |
| Complex hybrid decisions | Escalate to larger model (≤5% of jobs) |

RouteNLP-style cascading reduces cost 40–85% while maintaining quality ([arXiv:2604.23577](https://arxiv.org/html/2604.23577)).

---

## Part 9 — Evaluation framework

### 9.1 Gold dataset

Label **100–200 insight packages** with expert review:

| Dimension | Labels |
| --------- | ------ |
| Impact accuracy | Correct affected systems (precision/recall vs expert) |
| Ledger diff accuracy | Correct change_classification + field deltas vs expert |
| Ledger retrieval relevance | NDCG@5 on primary reference selection |
| Recommendation completeness | Required governance items captured |
| Grounding | % claims with valid evidence |

### 9.2 Metrics (MVP targets)

| Metric | MVP | Production |
| ------ | --- | ---------- |
| Impact system precision | ≥ 0.70 | ≥ 0.85 |
| Ledger diff classification accuracy | ≥ 0.75 | ≥ 0.90 |
| Ledger retrieval NDCG@5 | ≥ 0.60 | ≥ 0.75 |
| Required recommendation recall | ≥ 0.90 | ≥ 0.95 |
| Grounding score (automated) | ≥ 0.80 | ≥ 0.90 |
| P95 latency full_analysis | < 30s | < 15s |
| LLM calls per full_analysis | ≤ 4 | ≤ 2 |

### 9.3 DAG evaluation

Adopt decision-based evaluation (DeepEval DAG metric concept): each sub-engine output is a node; evaluation traverses expected reasoning path ([LinkedIn — DAG metric](https://www.linkedin.com/posts/jeffreyipp_if-your-llm-as-a-judge-evaluation-metrics-activity-7300247157406609408-kG2N)).

---

## Part 10 — Phased implementation

### Phase 1 — MVP (demo)

| Component | Implementation |
| --------- | -------------- |
| Orchestrator | In-process DAG |
| Impact | Entity → static tenant graph (JSON); 2-hop traversal |
| Ledger Diff | pgvector + category filter; rule-based field diff; no rerank |
| Recommendation | Rule engine only (10–15 rules) |
| Graph | PostgreSQL adjacency tables |

### Phase 2 — Production

| Component | Implementation |
| --------- | -------------- |
| Impact | CMDB integration; org mapping pass; risk dimension scoring |
| Ledger Diff | Hybrid RRF + cross-encoder rerank; structured dimension diff |
| Recommendation | Rules + LLM enrichment |
| Graph | Neo4j/FalkorDB; incremental merge on ledger write |

### Phase 3 — Scale

| Component | Implementation |
| --------- | -------------- |
| Orchestrator | Temporal workflows; re-analysis support |
| Ledger Diff | Graph edge boost for conflict/supersedes classification |
| Evaluation | Continuous active learning from Review Portal edits |

---

## Part 11 — Open decisions (resolved proposals)

| # | Decision | Recommendation |
| - | -------- | -------------- |
| 1 | Graph store | PostgreSQL adjacency MVP → graph DB at scale |
| 2 | Vector DB | pgvector co-located with PostgreSQL |
| 3 | LLM usage | Synthesis only; retrieval deterministic |
| 4 | Execution order | DAG: parallel Ledger Diff+Impact → Recommendation; discussions → Forecast Engine (09) |
| 5 | Conflict handling | Ledger Diff detects; Recommendation requires resolution; Review priority urgent |

---

## Part 12 — Anti-patterns summary

| Anti-pattern | Correct approach |
| ------------ | ---------------- |
| Single LLM prompt for "analyze this decision" | Three sub-engines with grounded retrieval |
| Skipping ledger diff on cold start without warning | `first_of_kind` classification + explicit quality warnings |
| Similarity list without structured diff | Ledger Diff Engine with field-level `changes[]` |
| Recommendations that auto-execute | Proposals only; Review Portal approves |
| Discussion change treated as decision analysis | Route to Forecast Engine (09) |
| Parallel all sub-engines ignoring dependencies | DAG orchestration |
| Vector-only ledger retrieval | Hybrid RRF + rerank + structured diff |
| Impact from LLM guessing | Graph traversal + org mapping |
| Bypass Review Portal for high-confidence analysis | All packages go to Review; confidence affects priority only |

---

## References

| Topic | Source |
| ----- | ------ |
| Change impact assessment | [Tricentis CIA guide](https://www.tricentis.com/learn/change-impact-assessment) |
| Blast radius in IT | [Virima](https://virima.com/blog/change-risk-assessment-in-it) |
| Multi-pass impact analysis | [Blast Radius Analyzer](https://github.com/amitgambhir/blast-radius-analyzer) |
| Microservices blast radius | [NILUS Consulting](https://www.nilus.be/blog/architecture_change_blast_radius_in_microservices/) |
| Hybrid retrieval RAG | [InfoQ](https://www.infoq.com/articles/vector-search-hybrid-retrieval-rag/) |
| Enterprise hybrid search | [Glean](https://www.glean.com/blog/hybrid-vs-rag-vector) |
| GraphRAG architecture | [PuppyGraph](https://www.puppygraph.com/blog/graphrag-architecture), [Atlan](https://atlan.com/know/what-is-graphrag/) |
| GraphRAG routing | [Graph Praxis comparison](https://medium.com/graph-praxis/graphrag-vs-hipporag-vs-pathrag-vs-og-rag-choosing-the-right-architecture-for-your-knowledge-graph-a4745e8b125f) |
| ADR generation RAG | [DRAFT arXiv:2504.08207](https://arxiv.org/abs/2504.08207) |
| Structured MADR risks | [Structured MADR](https://github.com/zircote/structured-madr) |
| HITL governance | [Cordum](https://cordum.io/blog/human-in-the-loop-ai-patterns), [Agent Native](https://www.agentnative.dev/patterns/human-in-the-loop-approval-flow-pattern) |
| LLM cost cascading | [RouteNLP arXiv](https://arxiv.org/html/2604.23577) |
| Grounding / evidence | [Module 03 SafePassage research](../03-knowledge-processing/research/entity-extraction-and-decision-detection.md) |
