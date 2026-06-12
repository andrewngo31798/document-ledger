# Document Ledger — Module Responsibility Matrix

This matrix defines what each module consumes, how it processes data, and what it produces. Module names match the [System Architecture](architecture.md) naming conventions.

## Pipeline modules

| # | Module | Purpose | Input | Processing | Output | Consumer |
| - | ------ | ------- | ----- | ---------- | ------ | -------- |
| 01 | **Signal Intake Engine** | Receive and validate triggers to start processing | Manual trigger, schedule, webhook, backfill, replay | Validate tenant and source, normalize trigger, create job, publish event | Processing job + `source.triggered` event | Queue / Event Bus |
| 02 | **Queue / Event Bus** | Decouple pipeline stages and enable async scaling | Processing job events | Buffer, route, retry, dead-letter failed messages | Job message to target consumer | Downstream pipeline module |
| 03 | **Knowledge Processing Engine** | Convert raw source content into structured knowledge | Job message, source reference, raw content | Fetch, normalize, chunk, extract entities, detect decision candidates **and discussion signals**, set routing hint | Structured knowledge + `source.ingested` event | Classification Engine **or** Forecast Engine |
| 04 | **Classification Engine** | Categorize **decision candidates** into domains | Structured knowledge with `routing.primary_path = decision` | Classification models, rule engine, confidence scoring | Classified decision + `decision.classified` event | Analysis Engine |
| 05 | **Analysis Engine** | Diff vs ledger and produce insight package for **decisions** | Classified decision | Coordinate Ledger Diff, Impact, and Recommendation sub-engines | Insight package + `insight.ready` event | Review & Approval Portal |
| 06 | **Review & Approval Portal** | Human validation and approval before ledger write | Insight package | Human review, edit, approve / reject, capture rationale | Approved or rejected decision + `decision.approved` event | Decision Ledger |
| 07 | **Decision Ledger** | Source of truth for approved decisions | Approved decision package | Versioning, indexing, audit trail, evidence linking | Ledger record | Consumer API; Forecast Engine (read precedents) |
| 08 | **Consumer API** | Expose trusted knowledge to downstream systems | Ledger records; change previews | Search, retrieval, filtering, RAG context building | Decision knowledge + change preview API response | AI Systems |
| **09** | **Forecast Engine** | Capture change and answer **"have we seen this before?"** for **discussions** | `source.ingested` where `routing.primary_path = discussion` | Change detection, precedent retrieval, forward projection | Change preview + `change.preview.ready` event | Consumer API |

---

## Analysis Engine sub-components (decision path only)

| Sub-component | Purpose | Input | Processing | Output | Aggregated by |
| ------------- | ------- | ----- | ---------- | ------ | ------------- |
| **Ledger Diff Engine** | Explain what changed vs approved ledger | Classified decision | Hybrid retrieval, structured field diff, change classification | Ledger diff | Analysis Engine |
| **Impact Engine** | Determine what may be affected by the decision | Classified decision | Dependency analysis, graph traversal | Impact map | Analysis Engine |
| **Recommendation Engine** | Suggest next actions and governance steps | Ledger diff, impact map | Reasoning, rule engine, LLM | Recommendations | Analysis Engine |

---

## Forecast Engine components (discussion path only — Module 09)

| Component | Purpose | Input | Processing | Output | Aggregated by |
| --------- | ------- | ----- | ---------- | ------ | ------------- |
| **Change Detector** | Identify what is shifting in the discussion | Structured knowledge, entities | Shift classification, baseline comparison | `detected_shifts[]` | Forecast Engine |
| **Precedent Engine** | Answer "have we seen this before?" | Discussion embedding, entities, Decision Ledger | Hybrid retrieval, rerank, outcome summary | `precedent_matches[]` | Forecast Engine |
| **Forward Projector** | Grounded watch-fors from shifts + precedents | Shifts + precedents | Template + LLM with `grounded_in[]` validation | `forward_signals` | Forecast Engine |

---

## Knowledge Processing Engine capabilities

| Capability | Purpose | Input | Processing | Output |
| ---------- | ------- | ----- | ---------- | ------ |
| **Decision Candidate Detection** | Identify closed decision signals | Normalized text chunks | NLP extraction, decision signal detection | Decision candidates |
| **Discussion Signal Detection** | Identify ongoing debate / change without decision closure | Normalized text chunks | Discourse cues, position language, thread patterns | `discussion_signal` flag |
| **Routing Hint** | Select downstream path | Candidate + discussion counts | Rule-based path selection | `routing.primary_path` |

---

## Event flow

| Event | Producer | Consumer |
| ----- | -------- | -------- |
| `source.triggered` | Signal Intake Engine | Knowledge Processing Engine |
| `source.ingested` | Knowledge Processing Engine | Classification Engine **or** Forecast Engine |
| `decision.classified` | Classification Engine | Analysis Engine |
| `insight.ready` | Analysis Engine | Review & Approval Portal |
| `decision.approved` | Review & Approval Portal | Decision Ledger |
| `change.preview.ready` | Forecast Engine | Consumer API |
