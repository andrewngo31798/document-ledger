# Deep Research: Analysis Engine

Comprehensive investigation for **Analysis Engine** (module 05) — the pipeline's core intelligence layer. Covers orchestration, all four sub-engines, grounding, evaluation, and phased implementation.

Related: [Module README](../README.md) · [Classification routing](../04-classification/README.md) · [Insight package schema](../schemas/insight-package.schema.json)

---

## Executive summary

The Analysis Engine is not a single LLM call. Production-grade decision analysis requires:

1. **Deterministic retrieval and graph traversal first** — impact and precedent discovery must be auditable
2. **LLM synthesis second** — only for summarization, forecasting language, and recommendation drafting grounded in retrieved facts
3. **DAG orchestration** — Impact + Similarity in parallel → Forecast → Recommendation
4. **Profile-based execution** — Classification Engine controls cost/latency via `routing.sub_engines`
5. **Grounded insight packages** — every claim traceable; Review Portal is the trust gate, not the model

Recommended architecture: **Hybrid GraphRAG + rules** with a Decision Knowledge Graph, hybrid precedent retrieval, and governance-oriented recommendation synthesis.

---

## Part 1 — Orchestration architecture

### 1.1 Why DAG, not parallel fan-out

The four sub-engines are **not independent**:

| Sub-engine | Depends on |
| ---------- | ---------- |
| Impact | Context loader only |
| Similarity | Context loader only |
| Forecast | Impact map + similar decisions + classified decision |
| Recommendation | Impact + Similarity + Forecast (+ rules) |

Running all four in pure parallel wastes compute (Forecast/Recommendation would wait anyway) or produces lower-quality output (Forecast without impact context).

**Recommended DAG:**

```
decision.classified
       │
       ├─► [Phase 1] Impact Engine ────────┐
       │                                    │
       └─► [Phase 1] Similarity Engine ────┤
                                            ▼
                              [Phase 2] Forecast Engine
                                            │
                                            ▼
                         [Phase 3] Recommendation Engine
                                            │
                                            ▼
                              Insight Aggregator → Quality Scorer
```

Phase 1 parallelizes the two I/O-heavy, independent retrieval engines. Phase 2 and 3 are sequential synthesis stages.

### 1.2 Profile-based routing

Classification Engine passes `routing.sub_engines`. Analysis Orchestrator validates and maps to DAG nodes:

| Profile | Enabled nodes | Skip |
| ------- | ------------- | ---- |
| `full_analysis` | impact, similarity, forecast, recommendation | — |
| `standard_analysis` | impact, similarity, recommendation | forecast |
| `lightweight_analysis` | similarity, recommendation | impact, forecast (impact optional stub) |
| `review_first` | none | all sub-engines |

**Dependency rules:**
- If `forecast` enabled → `impact` MUST be enabled
- If `recommendation` enabled → `similarity` MUST be enabled
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
| Impact fails | Continue with empty impact_map; lower grounding score; warn in package |
| Similarity fails | Continue; Forecast uses impact-only; Recommendation uses rules-only |
| Forecast fails | Continue; Recommendation skips forecast-informed items |
| Recommendation fails | Return package with analysis sections but empty recommendations |
| Aggregator/schema fail | Job fails; no `insight.ready`; DLQ |

Never publish an insight package with `status: completed` if decision summary is missing.

### 1.5 Token and cost budget

| Profile | LLM budget (target) | Graph/vector queries |
| ------- | ------------------- | -------------------- |
| `full_analysis` | 2–4 calls, ~8K output tokens | 5–15 |
| `standard_analysis` | 1–2 calls | 3–8 |
| `lightweight_analysis` | 0–1 calls | 1–3 |
| `review_first` | 0 calls | 0 |

LLM calls are reserved for Forecast summary and Recommendation synthesis — not for retrieval.

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
  • Score 5 risk dimensions: technical, delivery, people, compliance, financial
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
    "people": 0.4,
    "compliance": 0.6,
    "financial": 0.2
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

## Part 3 — Similarity Engine

### 3.1 Problem definition

Given a classified decision, answer: **What approved or pending decisions in our history are precedents, conflicts, duplicates, or relevant analogies?**

This is **precedent retrieval**, analogous to legal case retrieval — semantic similarity alone is insufficient ([InfoQ hybrid retrieval](https://www.infoq.com/articles/vector-search-hybrid-retrieval-rag/)).

### 3.2 Why vector search alone fails

| Query need | Vector search | BM25 / metadata | Graph |
| ---------- | ------------- | --------------- | ----- |
| "OAuth2 migration" semantic analog | Strong | Weak | Medium |
| Exact tech tag `PROJ-123` | Weak | Strong | Medium |
| "Conflicts with ADR-0042" | Weak | Medium | Strong |
| Cross-document precedent chains | Weak | Weak | Strong |

Production RAG converged on **hybrid retrieval + rerank** ([InfoQ](https://www.infoq.com/articles/vector-search-hybrid-retrieval-rag/), [Glean enterprise search](https://www.glean.com/blog/hybrid-vs-rag-vector)).

### 3.3 Recommended retrieval pipeline

```
Stage 1 — Candidate generation (parallel)
  ├── Vector search (decision embedding vs ledger embeddings) → top 30
  ├── BM25 / metadata filter (categories, tags, domain, technologies) → top 30
  └── Graph expand (supersedes, conflicts_with, references shared systems) → top 20

Stage 2 — Fusion
  └── Reciprocal Rank Fusion (RRF, k=60) → merged top 20

Stage 3 — Rerank
  └── Cross-encoder or LLM pairwise on decision text (not whole doc) → top 5

Stage 4 — Relationship classification
  └── Classify each hit: precedent | conflicts | supersedes_candidate | duplicate_risk | related
```

RRF formula: `RRF(d) = Σ 1/(k + rank)` — avoids normalizing incompatible scores ([InfoQ hybrid retrieval](https://www.infoq.com/articles/vector-search-hybrid-retrieval-rag/)).

### 3.4 Embedding strategy

| Field embedded | Purpose |
| -------------- | ------- |
| Decision candidate text | Primary semantic match |
| Categories + tags | Weighted metadata boost |
| Evidence span | Grounding verification |
| Approved ledger summary (for index) | Historical precedent index |

Re-index Decision Ledger on every approved write (module 07 → Analysis Engine read path).

### 3.5 Trust tiers for historical matches

| Source | Trust weight | Use |
| ------ | ------------ | --- |
| Approved Decision Ledger | 1.0 | Primary precedent store |
| Pending insight packages | 0.3 | Flag as unapproved; do not treat as precedent |
| Raw knowledge records | 0.1 | Context only |

Similarity Engine queries **approved ledger only** for precedent relationship classification.

### 3.6 Cold start behavior

When ledger is empty:
- Return `similar_decisions: []`
- Add quality warning `no_precedents_available`
- Forecast Engine shifts to category-based generic risk patterns
- Recommendation Engine adds `document_as_first_adr` recommendation

### 3.7 Graph-augmented similarity (Phase 2)

When Decision Knowledge Graph has `supersedes` / `conflicts_with` edges between ledger records, boost or demote retrieval candidates accordingly ([GraphRAG hybrid routing](https://medium.com/graph-praxis/graphrag-vs-hipporag-vs-pathrag-vs-og-rag-choosing-the-right-architecture-for-your-knowledge-graph-a4745e8b125f)).

Local search: vector seeds → 2-hop graph expansion. Use global community summaries only for portfolio-level analysis (Phase 3).

---

## Part 4 — Forecast Engine

### 4.1 Problem definition

Given impact map + similar decisions + current classified decision, answer: **What outcomes and risks are likely, and on what horizon?**

Forecasting organizational decisions is **not prediction** — it is **structured consequence analysis** grounded in evidence, aligned with ADR consequence sections ([Structured MADR](https://github.com/zircote/structured-madr), [AWS ADR guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/)).

### 4.2 Recommended approach

**Evidence-based forecast synthesis (not free-form LLM prediction):**

```
Input assembly
  • Classified decision + evidence span
  • Impact map (affected systems, risk dimensions)
  • Similar decisions (outcomes from ledger metadata if available)
  • Category-specific forecast templates

Pattern extraction (deterministic)
  • Match similar decision outcomes (e.g., 2/3 OAuth migrations had rollout delays)
  • Map impact risk dimensions to forecast categories
  • Apply domain templates (security_compliance → audit/regulatory items)

LLM synthesis (grounded)
  • Structured JSON output: predicted_outcomes[]
  • Each outcome MUST include grounded_in[] refs
  • Use likelihood bands, not false precision: unlikely | possible | likely | very_likely
  • Include rollback_considerations (required for technical decisions)

Validation
  • Drop outcomes without grounded_in refs
  • Cap at 5 outcomes per package
```

DRAFT research (Domain Specific Retrieval Augmented Few-Shot Fine-Tuning for ADRs) shows RAG + fine-tuning improves ADD generation quality ([arXiv:2504.08207](https://arxiv.org/abs/2504.08207)). For Forecast, **RAG over similar ADRs** is the highest-ROI starting point before fine-tuning.

### 4.3 Risk dimensions (from impact + category)

| Dimension | Forecast triggers |
| --------- | ------------------- |
| Technical | Integration breakage, migration complexity, tech debt |
| Delivery | Timeline slip, cross-team coordination |
| People | Training, ownership shift, on-call burden |
| Compliance | Audit, regulatory, data residency |
| Financial | License cost, infra cost, vendor lock-in |

Align with Structured MADR per-option risk assessment (technical, schedule, ecosystem).

### 4.4 Confidence bands

Do not emit point probabilities. Use:

| Band | Meaning |
| ---- | ------- |
| `high` | ≥2 similar precedents with documented outcomes |
| `medium` | Impact map strong; limited precedent |
| `low` | Cold start or sparse graph; template-based only |

Review Portal displays band prominently — not false actuarial precision.

### 4.5 Rollback considerations

Required for `technical` and `hybrid` domains when impact_map.blast_radius_score > 0.5.

Content: what to revert, order, expected recovery time — grounded in similar decision rollback notes or explicit "rollback plan not found in precedents" flag ([Virima rollback planning](https://virima.com/blog/change-risk-assessment-in-it)).

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
  • Input: impact_map + similar_decisions + forecast + rule outputs
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
| `completeness_score` | Weighted section presence for profile (e.g., full_analysis expects all 4 sections) |
| `grounding_score` | % claims with valid evidence in impact, similar, forecast, recommendations |
| `review_priority` | Base from Classification `routing.priority`; upgrade if conflict detected, high blast radius, or low grounding |

| Condition | review_priority |
| --------- | --------------- |
| `review_first` profile | urgent |
| Conflict detected in similar decisions | urgent |
| blast_radius_score > 0.8 | high |
| grounding_score < 0.5 | high |
| Default | normal |

### 6.3 Review Portal contract

Review Portal expects:
- Renderable sections per sub-engine output
- Provenance expandable (which model, which ledger IDs)
- Required recommendations flagged as checklist
- Edit/revision triggers re-analysis event (future: `decision.reanalyze` → Analysis Engine)

---

## Part 7 — Decision Knowledge Graph

### 7.1 Role in Analysis Engine

The graph is the **shared substrate** for Impact and Similarity:

| Engine | Graph use |
| ------ | --------- |
| Impact | Multi-hop dependency traversal |
| Similarity | supersedes/conflicts_with edges, shared system overlap |
| Forecast | Precedent outcome paths (Phase 2) |
| Recommendation | Conflict detection |

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
| Impact | Summarize traversal results (optional) |
| Similarity | Reranker only (Phase 2) |
| Forecast | Synthesize outcome narratives from structured inputs |
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
| Forecast synthesis | Small/fast (Haiku, GPT-4o-mini class) |
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
| Similarity relevance | NDCG@5 on precedent ranking |
| Forecast usefulness | Expert rating 1–5 (not accuracy of prediction) |
| Recommendation completeness | Required governance items captured |
| Grounding | % claims with valid evidence |

### 9.2 Metrics (MVP targets)

| Metric | MVP | Production |
| ------ | --- | ---------- |
| Impact system precision | ≥ 0.70 | ≥ 0.85 |
| Similarity NDCG@5 | ≥ 0.60 | ≥ 0.75 |
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
| Similarity | pgvector + category filter; no rerank |
| Forecast | Template + LLM synthesis with grounded_in validation |
| Recommendation | Rule engine only (10–15 rules) |
| Graph | PostgreSQL adjacency tables |

### Phase 2 — Production

| Component | Implementation |
| --------- | -------------- |
| Impact | CMDB integration; org mapping pass; risk dimension scoring |
| Similarity | Hybrid RRF + cross-encoder rerank |
| Forecast | Precedent outcome extraction from ledger metadata |
| Recommendation | Rules + LLM enrichment |
| Graph | Neo4j/FalkorDB; incremental merge on ledger write |

### Phase 3 — Scale

| Component | Implementation |
| --------- | -------------- |
| Orchestrator | Temporal workflows; re-analysis support |
| Similarity | Graph edge relationship classifier |
| Forecast | Fine-tuned forecast summarizer (DRAFT-style RAG+FT) |
| Evaluation | Continuous active learning from Review Portal edits |

---

## Part 11 — Open decisions (resolved proposals)

| # | Decision | Recommendation |
| - | -------- | -------------- |
| 1 | Graph store | PostgreSQL adjacency MVP → graph DB at scale |
| 2 | Vector DB | pgvector co-located with PostgreSQL |
| 3 | LLM usage | Synthesis only; retrieval deterministic |
| 4 | Execution order | DAG: parallel Impact+Similarity → Forecast → Recommendation |
| 5 | Conflict handling | Similarity detects; Recommendation requires resolution; Review priority urgent |

---

## Part 12 — Anti-patterns summary

| Anti-pattern | Correct approach |
| ------------ | ---------------- |
| Single LLM prompt for "analyze this decision" | Four sub-engines with grounded retrieval |
| Skipping Similarity on cold start without warning | Explicit quality warnings in package |
| Recommendations that auto-execute | Proposals only; Review Portal approves |
| Forecast as point probability | Likelihood bands + confidence band |
| Parallel all sub-engines ignoring dependencies | DAG orchestration |
| Vector-only precedent search | Hybrid RRF + rerank |
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
