# Research: Entity Extraction & Decision Detection

Research summary for **Knowledge Processing Engine** (module 03). Informs open decisions #2 and #3 in [README.md](../README.md).

Related: [Module Responsibility Matrix](../../../overview/module-responsibility-matrix.md) · [Structured MADR](https://smadr.dev/) · [AMI DecisionDetector](https://www.idiap.ch/webarchives/sites/publications.amiproject.org/lnai-hsueh-final-errata.pdf)

---

## Executive recommendation

Use a **tiered hybrid pipeline** for both capabilities:

| Capability | Tier 1 (fast, deterministic) | Tier 2 (semantic) | Tier 3 (escalation) |
| ---------- | ------------------------------ | ------------------- | ------------------- |
| **Entity extraction** | Regex + dictionaries (IDs, URLs, ticket keys) | GLiNER or spaCy transformer NER | LLM structured extraction on low-confidence chunks only |
| **Decision detection** | Lexical + discourse cues (decision phrases) | Span classifier / small encoder model | LLM extraction with evidence grounding |

Design principles shared by both:

1. **Extract structure with NLP; reason with LLM only when needed** — specialized models handle volume; LLMs handle ambiguity ([John Snow Labs hybrid pattern](https://www.johnsnowlabs.com/what-structured-nlp-does-that-llms-still-cant-precision-extraction-at-billion-document-scale/)).
2. **Every output must be grounded** — store character spans and verify evidence substrings exist in source text ([SafePassage](https://arxiv.org/html/2510.00276v1), [LangExtract source grounding](https://google-langextract-27.mintlify.app/concepts/source-grounding)).
3. **Never trust raw model confidence** — calibrate on a held-out labeled set from your own Jira/Confluence/meeting corpus ([KnodeGraph NER eval guidance](https://knodegraph.com/blog/extract-entities-from-documents/)).
4. **Fail closed on high-stakes fields** — drop or escalate ungrounded extractions; do not silently pass them downstream ([production IE patterns](https://llmbook.apartsin.com/part-7-retrieval-information-extraction-with-llms/module-34-structured-information-extraction-ner/section-34.4.html)).

---

## Part 1 — Entity extraction

### 1.1 Approach comparison

| Approach | Strengths | Weaknesses | Typical F1 | Cost / latency |
| -------- | --------- | ---------- | ---------- | -------------- |
| **Rule / regex / dictionary** | Highest precision for known patterns (Jira keys, `@handles`, ISO dates) | Poor recall on prose | High P, low R | Near zero |
| **spaCy (`en_core_web_trf`)** | Fast on CPU/GPU, deterministic, good for PERSON/ORG/DATE/GPE | Weak on domain entities (services, repos, internal codenames) | ~90–92% F1 on standard types | ~$0 / 1K docs |
| **GLiNER / GLiNER2** | Zero-shot custom labels at inference; unified entity + relation extraction | Slower than spaCy; needs GPU for throughput | ~80 F1 zero-shot; higher when labels match domain | Medium |
| **Fine-tuned transformer** | Best accuracy when 500+ labels per type exist | Requires labeling budget and retraining cycle | 93–96% in-domain | Medium (inference) |
| **LLM structured output** | Handles ambiguity, implicit entities, layout-aware fields | 100–1000× slower; non-deterministic; hallucination risk | 95%+ with grounding | High |

Sources: [LLMversus NER at scale](https://llmversus.com/use-case/named-entity-recognition), [spaCy vs Transformers vs LLM benchmarks](https://www.markaicode.com/vs/spacy-vs-transformers-vs-llm-ner-production/), [Inputo NER guide 2026](https://inputo.app/blog/named-entity-recognition-guide).

### 1.2 Production best practices

**Tiered pipeline (recommended pattern)**

```
Chunk text
  → Tier 1: EntityRuler + tenant dictionaries (project codes, service names)
  → Tier 2: GLiNER with Document Ledger label set
  → Tier 3: LLM extraction (only if Tier 2 confidence < threshold OR chunk is entity-sparse)
  → Merge spans (dedupe overlaps, prefer higher-precision source)
  → Grounding check (span exists in source)
  → Persist with source metadata
```

**Rules that matter in production**

| Practice | Why |
| -------- | --- |
| Run classical NER **first** and return its result even if LLM fails | Graceful degradation invariant ([§34.4 IE patterns](https://llmbook.apartsin.com/part-7-retrieval-information-extraction-with-llms/module-34-structured-information-extraction-ner/section-34.4.html)) |
| Tag every entity with `extraction_source`: `rule`, `gliner`, `llm` | Downstream can weight trust differently |
| Calibrate thresholds on **your** data | Confidence scores are not comparable across models |
| Evaluate with **strict span-level F1** (`seqeval`) | Boundary errors break downstream linking |
| Maintain tenant **gazetteers** | Project names, team names, internal systems |
| Store **character offsets**, not just values | Required for audit, review UI, and reprocessing |

**When to fine-tune vs stay zero-shot**

| Condition | Recommendation |
| ----------- | -------------- |
| < 500 labeled examples per entity type | GLiNER or LLM few-shot |
| ≥ 500 labeled examples, stable label set | Fine-tune spaCy or BERT |
| Entity types change frequently | GLiNER (label-driven) over retraining |
| > 100K documents/day | Avoid LLM-only; hybrid with ≤ 20% LLM escalation |

### 1.3 Entity types for Document Ledger

Align extraction schema with downstream Classification and Analysis engines:

| Entity type | Examples | Tier 1 | Tier 2 |
| ----------- | -------- | ------ | ------ |
| `person` | "Alice Chen", "@bob" | @mention rules | NER |
| `team` | "Platform team", "SRE" | Tenant dictionary | GLiNER |
| `system` | "payment-service", "Auth API" | Code/backtick patterns | GLiNER + LLM |
| `project` | "PROJ-123", "Project Atlas" | Jira key regex | GLiNER |
| `repository` | `org/repo` | GitHub URL/regex | GLiNER |
| `date` | "by Q3", "2026-06-10" | dateparser / regex | NER |
| `url` | Confluence/Jira links | URL regex | — |
| `technology` | "Kafka", "PostgreSQL" | Tech dictionary | GLiNER |
| `policy` | "SOC2", "GDPR" | Dictionary | GLiNER |

Relations (optional Phase 2): `person → owns → task`, `decision → affects → system` — GLiNER2 or LLM relation pass ([GLiNER2 unified extraction](https://helain-zimmermann.com/blog/gliner2-unified-entity-and-relation-extraction-in-one-framework)).

### 1.4 Recommended stack for module 03

**Phase 1 (demo / MVP)**

- spaCy `en_core_web_trf` + EntityRuler for Jira/Confluence/GitHub patterns
- Tenant JSON gazetteers for projects and systems
- GLiNER with fixed label list for `system`, `technology`, `team`

**Phase 2 (production)**

- Add LLM escalation path (GPT-4o-mini / Claude Haiku class) with strict JSON schema
- Evidence binding: each entity includes `evidence_text` verified as substring
- Label 200–500 sentences from real tenant data; measure strict F1; tune escalation threshold

**Phase 3 (scale)**

- Fine-tune GLiNER or small BERT on accumulated labels
- Reduce LLM escalation rate to < 10% of chunks

---

## Part 2 — Decision detection

### 2.1 What counts as a "decision"?

Document Ledger ingests heterogeneous sources. Decision signals differ by channel:

| Source | Decision signal examples |
| ------ | ------------------------ |
| Meeting transcript | "We agreed to…", "Let's go with option B", resolution after debate |
| Jira / Confluence | Explicit decision sections, approved design pages, status → Done with rationale |
| Slack / PR comments | "Ship it", "Approved", "We will migrate X" |
| ADR documents | Structured MADR/MADR sections with status Accepted |

Academic baseline: **AMI DecisionDetector** treats decision detection as identifying **decision-related dialogue acts (DDAs)** using lexical, prosodic, dialogue-act, and topical features, then grouping into decision segments ([Hsueh & Favre, 2008](https://www.idiap.ch/webarchives/sites/publications.amiproject.org/lnai-hsueh-final-errata.pdf)). Hierarchical models that distinguish *issue*, *alternative*, and *resolution* roles outperform flat classifiers ([Purver et al., 2008](https://aclanthology.org/W08-0125.pdf)).

### 2.2 Approach comparison

| Approach | Strengths | Weaknesses | Best for |
| -------- | --------- | ---------- | -------- |
| **Keyword / regex** | High precision on explicit phrases ("we decided", "approved") | Misses implicit decisions; false positives on hypotheticals | Tier 1 filter |
| **Binary utterance classifier** | Fast; proven on meeting corpora | Needs labeled data; weak cross-domain transfer | Meetings, Slack |
| **Hierarchical DDA tagging** | Captures decision structure (issue → options → resolution) | Complex to build and maintain | Meeting-heavy deployments |
| **LLM + structured schema** | Handles implicit decisions, multi-sentence context | Cost, latency, hallucination without grounding | Ambiguous spans |
| **ADR-aware parser** | High precision on structured docs | Only works when source is already ADR-shaped | Confluence ADR pages |

Lightweight academic/industry pipelines often combine **sentence classification + NER for owners/deadlines + keyword decision detection** ([organizational meeting extraction paper, 2026](https://iarjset.com/wp-content/uploads/2026/04/IARJSET.2026.13494-ORGANIZATIONAL.pdf)). That pattern is a valid MVP but **insufficient alone** for architecture-grade recall.

### 2.3 Production best practices

**Two-stage detection (recommended)**

```
Stage A — Candidate retrieval (high recall)
  • Lexical cues: decided, approved, agreed, will use, going with, resolution
  • Discourse cues: option A vs B, trade-off language, consensus markers
  • Source-specific rules (ADR frontmatter status=accepted, Jira "Decision" label)
  → Output: candidate spans with retrieval_score

Stage B — Verification & structuring (high precision)
  • Small classifier OR LLM with strict schema
  • Classify signal_type: explicit_decision | implied_choice | requirement_change | architecture_choice | policy_change
  • Extract fields: decision_text, options_considered, chosen_option, rationale (nullable)
  • Require evidence_text (verbatim quote) + char offsets
  → Drop if evidence fails grounding check OR confidence < threshold
```

**Grounding and hallucination control**

| Requirement | Implementation |
| ----------- | -------------- |
| Verbatim evidence | LLM must copy supporting span from chunk ([SafePassage](https://arxiv.org/html/2510.00276v1)) |
| Programmatic verify | `source_text[start:end] == evidence_text` or fuzzy align ([LangExtract WordAligner](https://google-langextract-27.mintlify.app/concepts/source-grounding)) |
| Structured outputs | OpenAI / Anthropic JSON schema mode with `strict: true` |
| Cross-field validation | e.g. `chosen_option` must appear in `options_considered` or evidence |
| Fail closed | Unverified candidates → `status: rejected` in audit, not passed to Classification |

**Do not rely on**

- LLM self-reported confidence alone — compute from grounding success, classifier margin, and rule match strength
- Single-sentence classification for meetings — use ±1 to ±5 utterance context (AMI findings)
- Treating "action items" as decisions — separate detectors; action items lack commitment closure

### 2.4 Target schema (decision candidate)

Align early with downstream Review & Approval Portal and eventual Structured MADR compatibility:

```json
{
  "decision_text": "Migrate authentication to OAuth2",
  "signal_type": "architecture_choice",
  "status": "candidate",
  "confidence": 0.82,
  "evidence": {
    "text": "we agreed to migrate auth to OAuth2 next quarter",
    "start_offset": 1042,
    "end_offset": 1091,
    "chunk_id": "uuid"
  },
  "structure": {
    "problem": "Legacy session auth does not support SSO",
    "options_considered": ["Keep sessions", "OAuth2", "SAML"],
    "chosen_option": "OAuth2",
    "rationale": "Better vendor support and mobile compatibility"
  },
  "detection": {
    "stage": "llm_verified",
    "model_version": "decision-v1",
    "rules_matched": ["lexical:agreed to"]
  }
}
```

For sources that are already ADRs, map directly to [Structured MADR](https://github.com/zircote/structured-madr/blob/main/SPECIFICATION.md) fields (`status`, `technologies`, `related`) instead of re-inferring from prose.

### 2.5 Recommended stack for module 03

**Phase 1 (demo / MVP)**

| Step | Method |
| ---- | ------ |
| Retrieval | Regex + keyword list (~40–60 patterns) + negation filter ("might decide", "should we") |
| Verification | Lightweight LLM pass with JSON schema on retrieved spans only |
| Grounding | Mandatory evidence substring check |
| Threshold | Default 0.65 confidence; tune on labeled set |

**Phase 2 (production)**

| Step | Method |
| ---- | ------ |
| Retrieval | Add source-specific rules (Jira labels, Confluence macros, MADR frontmatter) |
| Verification | Fine-tuned small encoder (e.g. DeBERTa) for binary + signal_type on spans |
| LLM escalation | Only spans where classifier margin < 0.15 |
| Evaluation | Precision/recall on span level; separate metrics per `source_type` |

**Phase 3 (quality)**

- Hierarchical tagging for meeting transcripts (issue / alternative / resolution)
- Duplicate detection against existing Decision Ledger entries (embedding similarity)
- Human-in-the-loop labeling feed from Review Portal rejections

### 2.6 Evaluation plan

Build a **gold set of 150–300 labeled spans** from real tenant exports:

| Metric | Target (MVP) | Target (production) |
| ------ | ------------ | ------------------- |
| Decision span recall | ≥ 0.75 | ≥ 0.85 |
| Decision span precision | ≥ 0.70 | ≥ 0.80 |
| Grounding pass rate | ≥ 0.95 | ≥ 0.98 |
| False positive rate on non-decisions | < 0.15 | < 0.08 |

Stratify evaluation by `source_type` — a model tuned on meetings will underperform on Jira tickets without per-source calibration.

---

## Part 3 — Combined pipeline interaction

Entity extraction and decision detection should **not be fully independent**:

```
Content Chunk
     │
     ├─► Entity Extractor ──► entities (people, systems, dates)
     │
     └─► Decision Retriever ──► candidate spans
              │
              ▼
         Decision Verifier (uses entities as hints)
              │
              ▼
         decision_candidates linked to entity IDs
```

Examples of cross-signal value:

- Decision mentions "OAuth2" → link to `technology` entity
- Decision assigns owner → link to `person` entity extracted in same chunk
- System entity frequency boosts `architecture_choice` prior

Processing order in Knowledge Processing Engine:

1. Normalize → Chunk
2. **Entity extraction** (Tier 1 → 2 → 3)
3. **Decision retrieval** (rules on chunk + entities)
4. **Decision verification** (classifier / LLM with grounding)
5. Persist both with shared `chunk_id` references

---

## Part 4 — Decision record for module 03

Resolves open decisions #2 and #3 in module README:

| # | Decision | Recommendation | Status |
| - | -------- | -------------- | ------ |
| 2 | Entity extraction | **Hybrid**: EntityRuler + gazetteers → GLiNER → LLM escalation with evidence grounding | **Proposed** |
| 3 | Decision detection | **Two-stage**: high-recall lexical retrieval → LLM/classifier verification with mandatory evidence spans | **Proposed** |

### Implementation priorities

1. Define label schemas and gold evaluation set (before tuning models)
2. Ship Tier 1 rules + grounding infrastructure (cheap, auditable baseline)
3. Add GLiNER for custom entities
4. Add LLM verification for decisions only on retrieved spans (controls cost)
5. Measure per-source-type metrics; fine-tune when labels exceed 500 examples

---

## References

| Topic | Source |
| ----- | ------ |
| NER at scale / hybrid | [LLMversus — NER 2026](https://llmversus.com/use-case/named-entity-recognition) |
| spaCy vs LLM benchmarks | [Markaicode production benchmarks](https://www.markaicode.com/vs/spacy-vs-transformers-vs-llm-ner-production/) |
| GLiNER2 unified extraction | [Hélain Zimmermann — GLiNER2](https://helain-zimmermann.com/blog/gliner2-unified-entity-and-relation-extraction-in-one-framework) |
| Production IE degradation | [LLM Book §34.4](https://llmbook.apartsin.com/part-7-retrieval-information-extraction-with-llms/module-34-structured-information-extraction-ner/section-34.4.html) |
| Evidence grounding | [SafePassage (arXiv)](https://arxiv.org/html/2510.00276v1), [LangExtract](https://google-langextract-27.mintlify.app/concepts/source-grounding) |
| Meeting decision detection | [AMI DecisionDetector](https://www.idiap.ch/webarchives/sites/publications.amiproject.org/lnai-hsueh-final-errata.pdf) |
| Hierarchical decision dialogue | [Purver et al. ACL 2008](https://aclanthology.org/W08-0125.pdf) |
| Structured ADR for AI | [Structured MADR spec](https://github.com/zircote/structured-madr/blob/main/SPECIFICATION.md) |
| Fact / decision extraction patterns | [Graphlit glossary — fact extraction](https://www.graphlit.com/glossary/fact-extraction) |
