# Research: Classification Taxonomy & Models

Investigation summary for **Classification Engine** (module 04). Informs taxonomy design, model selection, confidence scoring, and analysis routing.

Related: [Module README](../README.md) · [Decision Taxonomy](../taxonomy/decision-taxonomy.json) · [Knowledge Processing research](../03-knowledge-processing/research/entity-extraction-and-decision-detection.md)

---

## Executive recommendation

Use a **3-tier classification cascade** aligned with module 03's extraction pattern:

| Tier | Method | Handles |
| ---- | ------ | ------- |
| 1 | Rule Engine + signal/entity hints | High-precision cases (ADR pages, `architecture_choice`, policy signals) |
| 2 | Embedding classifier (multi-label) | Domain + category assignment for typical prose |
| 3 | LLM structured classifier | Ambiguous hybrid decisions, low Tier 2 confidence |

Apply a **hierarchical multi-label taxonomy** (domain → categories → tags), calibrate confidence on tenant-labeled data, and route to Analysis Engine profiles based on domain + category + confidence — not a flat business/technical binary alone.

---

## Part 1 — What to classify

### 1.1 Inputs available from Knowledge Processing

Classification should exploit structured upstream output, not re-parse raw text blindly:

| Field | Classification use |
| ----- | ------------------ |
| `decision_candidate.text` + evidence span | Primary classification text |
| `decision_candidate.signal_type` | Strong prior (architecture vs policy) |
| `extracted_entities` | Technology/system → technical; budget/date → business hints |
| `source_type` | Confluence ADR vs Jira epic vs Slack thread |
| `source_reference` | Path/label patterns (ADR-*, `/decisions/`) |
| Structured MADR frontmatter (if present) | Direct map to categories, status, technologies |

### 1.2 Classification outputs required by downstream modules

| Output | Consumer | Purpose |
| ------ | -------- | ------- |
| `domain` | Analysis Engine, Review Portal | Lens for impact/forecast interpretation |
| `categories[]` | Analysis Engine, Decision Ledger | Filtering, ADR catalog alignment |
| `tags[]` | Consumer API, search | Cross-cutting discovery |
| `confidence` | Analysis Router, Review Portal | Escalation and review priority |
| `analysis_profile` | Analysis Engine | Which sub-engines to run |

---

## Part 2 — Taxonomy design

### 2.1 Why not binary business/technical only?

Organizational decisions rarely fit a single binary label. ADR practice distinguishes **architecturally significant** decisions affecting structure, NFRs, dependencies, interfaces, and construction techniques ([AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/), [Microsoft Well-Architected ADR guidance](https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record)).

Recommended hierarchy:

```
Level 1 — Domain (exclusive):     business | technical | hybrid
Level 2 — Categories (multi-label): architecture, security_compliance, product_scope, …
Level 3 — Tags (multi-label, free): oauth2, microservices, q3-roadmap, …
```

**Hybrid domain** captures decisions like "migrate to OAuth2 by Q3" — technical implementation with business deadline and customer commitment.

### 2.2 Mapping to ADR / Structured MADR

| Document Ledger field | Structured MADR / ADR equivalent |
| --------------------- | -------------------------------- |
| `categories` | `category`, impact area |
| `tags` | `tags`, `technologies` |
| `domain` | inferred from category + content |
| `confidence` | decision certainty (document separately in Review) |
| ADR status | Not classified here — belongs to Review & Approval Portal |

When Knowledge Processing detects Structured MADR frontmatter, Classification Engine should **map fields directly** rather than re-infer categories from prose ([Structured MADR spec](https://github.com/zircote/structured-madr/blob/main/SPECIFICATION.md)).

### 2.3 Category design principles

| Principle | Rationale |
| --------- | --------- |
| Flat category list, not deep nesting | ADR catalogs use flat or shallow folders ([Milanović ADR guide](https://medium.com/@techworldwithmilan/a-practical-guide-to-architecture-decision-records-adrs-10340910cb2f)) |
| Multi-label allowed | Decisions span security + architecture + integration |
| `adr_significant` flag per category | Drives full vs lightweight analysis routing |
| Version taxonomy (`1.0.0`) | Enables re-classification batch jobs on taxonomy bump |
| Tenant extension via tags | Categories stable; tenants add tags without schema churn |

Canonical v1 taxonomy: [decision-taxonomy.json](../taxonomy/decision-taxonomy.json).

---

## Part 3 — Classification model approaches

### 3.1 Approach comparison

| Approach | Strengths | Weaknesses | Best for |
| -------- | --------- | ---------- | -------- |
| **Rules / keywords** | Deterministic, auditable, zero cost | Brittle; poor recall | ADR paths, signal_type mapping |
| **Zero-shot LLM** | Flexible; no training data | Cost; uncalibrated confidence | Prototyping |
| **Embedding + linear/XGBoost** | Fast; 99%+ F1 on intent routing in production stacks ([Nexus-ai-resolution](https://github.com/Venkata1345/Nexus-ai-resolution)) | Needs labeled data | Production Tier 2 |
| **Fine-tuned encoder (DeBERTa)** | Strong multi-label performance | Training pipeline | Scale phase |
| **Hierarchical multi-label (HiClass-style)** | Correct multi-path labels ([HiClass docs](https://hiclass.readthedocs.io/en/v4.9.0/algorithms/multi_label.html)) | More complex evaluation | Category assignment |
| **LLM Tier 3 escalation** | Handles hybrid/ambiguous | Latency | ≤ 15–20% of candidates |

### 3.2 Recommended 3-tier cascade

Mirrors production routing patterns ([3-Tier Routing Cascade](https://blog.meganova.ai/the-3-tier-routing-cascade-rule-based-semantic-llm/), [RouteNLP conformal cascading](https://arxiv.org/html/2604.23577)):

```
Candidate + context
  → Tier 1 Rule Engine
       confidence >= 0.90? → assign labels, exit
  → Tier 2 Domain Classifier (sentence-transformer embedding + multi-label head)
       confidence >= 0.80? → assign labels, exit
  → Tier 3 LLM Classifier (structured JSON, small/fast model)
       → assign labels + rationale
  → Confidence Calibrator → Analysis Router
```

**Design rules:**

- LLM is **classification only**, not analysis — same separation as Nova OS Tier 3 ([routing cascade article](https://blog.meganova.ai/the-3-tier-routing-cascade-rule-based-semantic-llm/))
- Hard routing uses **discrete labels** for security gates and analytics ([Nexus pattern](https://github.com/Venkata1345/Nexus-ai-resolution))
- Low-confidence cases → `review_first` profile, not silent default to technical

### 3.3 Feature set for Tier 2 classifier

| Feature group | Examples |
| ------------- | -------- |
| Text embedding | Decision candidate text + ±1 chunk context |
| Signal type | One-hot `signal_type` |
| Source type | One-hot `source_type` |
| Entity counts | `#system`, `#technology`, `#person`, `#date` |
| Entity presence flags | has_security_tech, has_budget_terms |
| Source metadata | is_adr_path, is_jira_epic, label keywords |

Training target: multi-label category vector + single domain label.

---

## Part 4 — Confidence scoring

### 4.1 Why raw model probability fails

Neural classifiers and LLMs produce **uncalibrated** confidence — 0.95 from one model ≠ 0.95 from another ([module 03 research](../03-knowledge-processing/research/entity-extraction-and-decision-detection.md)). Production systems need calibrated scores for routing thresholds.

### 4.2 Recommended calibration methods

| Method | Use |
| ------ | --- |
| **Isotonic regression** | Map raw classifier scores → calibrated probability on held-out set |
| **Conformal prediction (ICP/LP-ICP)** | Prediction sets with distribution-free error guarantees ([arXiv 2312.09304](https://arxiv.org/html/2312.09304v1)) |
| **Active learning queue** | Human-label low-confidence cases; retrain Tier 2 ([Casca Auto-Learn flywheel](https://github.com/jewanchen/casca/blob/main/casca-technical-article.md)) |

### 4.3 Routing thresholds (defaults)

| Calibrated confidence | Action |
| --------------------- | ------ |
| ≥ 0.80 | Accept classification; route to analysis profile |
| 0.60 – 0.79 | Accept with `priority: high`; run full analysis |
| < 0.60 | `review_first` — minimal analysis, expedite human review |

Thresholds are tenant-configurable. Calibrate on **per-source-type** slices where performance diverges (meetings vs Jira vs Confluence ADRs).

---

## Part 5 — Analysis routing logic

Analysis Engine sub-engines have different value by decision type:

| Sub-engine | High value when | Lower value when |
| ---------- | --------------- | ---------------- |
| Impact | Technical/architecture, dependency-rich | Pure organizational staffing |
| Similarity | All types — historical precedent matters | — |
| Forecast | Architecture, infrastructure, policy with rollout risk | One-off administrative decisions |
| Recommendation | Governance gaps, ambiguous hybrid decisions | Clear, low-risk operational choices |

Routing matrix (default):

| Domain | ADR-significant category | Profile |
| ------ | ------------------------ | ------- |
| technical | yes | `full_analysis` |
| hybrid | yes | `full_analysis` |
| business | any | `standard_analysis` |
| any | low-risk category only | `lightweight_analysis` |
| any | confidence < 0.60 | `review_first` |

Analysis Engine must treat `routing.sub_engines` as authoritative — Classification Engine owns routing policy.

---

## Part 6 — Evaluation plan

### 6.1 Gold dataset

Label **200–400 decision candidates** from tenant exports:

| Field | Label |
| ----- | ----- |
| `domain` | business / technical / hybrid |
| `categories[]` | Multi-label from taxonomy |
| `analysis_profile` | Expected routing (derived or explicit) |

Stratify by `source_type` and `signal_type`.

### 6.2 Metrics

| Metric | Target (MVP) | Target (production) |
| ------ | ------------ | ------------------- |
| Domain accuracy | ≥ 0.80 | ≥ 0.90 |
| Category macro-F1 (multi-label) | ≥ 0.65 | ≥ 0.75 |
| Routing agreement with expert | ≥ 0.75 | ≥ 0.85 |
| Tier 1 coverage (% exiting at rules) | ≥ 25% | ≥ 40% |
| LLM escalation rate | ≤ 25% | ≤ 15% |
| Calibration ECE | < 0.10 | < 0.05 |

Use hierarchical precision/recall for multi-label categories ([HiClass metrics](https://hiclass.readthedocs.io/en/v4.9.0/algorithms/multi_label.html)).

### 6.3 Closed-loop improvement

Adopt Casca/RouteNLP-style flywheel:

1. Route production traffic through cascade
2. Queue confidence < 0.80 for human relabeling (active learning — most uncertain first)
3. Periodically retrain Tier 2 classifier
4. Shift traffic from Tier 3 → Tier 2 as accuracy improves

---

## Part 7 — Anti-patterns to avoid

| Anti-pattern | Why it fails | Correct approach |
| ------------ | ------------ | ---------------- |
| LLM-only classification | Cost, latency, uncalibrated confidence | 3-tier cascade |
| Binary business/technical only | Loses ADR category nuance | Domain + multi-label categories |
| Classifying without decision candidates | No decision to classify | Skip records with zero candidates |
| Routing all decisions to full analysis | Wastes compute on low-risk items | Profile-based sub-engine selection |
| Bypassing Analysis Engine for "business" | Breaks pipeline contract | Always publish `decision.classified`; router controls sub-engines |
| Re-fetching raw source | Duplicates Knowledge Processing | Load by `knowledge_id` only |

**Historical note:** An earlier container diagram showed Classification routing directly to Review Portal. The canonical pipeline requires **Classification → Analysis → Review**. Low-confidence routing uses `review_first` analysis profile, not a pipeline bypass.

---

## Part 8 — Phased implementation

| Phase | Scope |
| ----- | ----- |
| **Phase 1 — MVP** | Taxonomy v1; Tier 1 rules; LLM Tier 3 fallback; static routing matrix |
| **Phase 2 — Production** | Train Tier 2 embedding classifier; isotonic calibration; per-source metrics |
| **Phase 3 — Scale** | Conformal prediction sets; active learning loop; taxonomy v2 with tenant extensions |

---

## References

| Topic | Source |
| ----- | ------ |
| ADR significance criteria | [AWS ADR Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/) |
| ADR lifecycle and structure | [Microsoft Well-Architected — ADR](https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record) |
| Structured MADR metadata | [Structured MADR spec](https://github.com/zircote/structured-madr/blob/main/SPECIFICATION.md) |
| ADR catalog & traceability | [ArchMan ADR catalog](https://archman.dev/docs/documentation-and-modeling/architecture-decision-records-adr/catalog-and-traceability) |
| 3-tier routing cascade | [MegaNova routing cascade](https://blog.meganova.ai/the-3-tier-routing-cascade-rule-based-semantic-llm/) |
| Conformal cascading | [RouteNLP (arXiv)](https://arxiv.org/html/2604.23577) |
| ML intent router production | [Nexus-ai-resolution](https://github.com/Venkata1345/Nexus-ai-resolution) |
| Multi-label calibration | [ICP for multi-label TC (arXiv)](https://arxiv.org/html/2312.09304v1) |
| Hierarchical multi-label | [HiClass documentation](https://hiclass.readthedocs.io/en/v4.9.0/algorithms/multi_label.html) |
| Active learning flywheel | [Casca technical article](https://github.com/jewanchen/casca/blob/main/casca-technical-article.md) |
