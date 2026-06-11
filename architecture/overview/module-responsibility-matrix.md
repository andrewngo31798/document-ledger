# Document Ledger — Module Responsibility Matrix

This matrix defines what each module consumes, how it processes data, and what it produces. Module names match the [System Architecture](architecture.md) naming conventions.

## Pipeline modules

| # | Module | Purpose | Input | Processing | Output | Consumer |
| - | ------ | ------- | ----- | ---------- | ------ | -------- |
| 01 | **Signal Intake Engine** | Receive and validate triggers to start processing | Manual trigger, schedule, webhook, backfill, replay | Validate tenant and source, normalize trigger, create job, publish event | Processing job + `source.triggered` event | Queue / Event Bus |
| 02 | **Queue / Event Bus** | Decouple pipeline stages and enable async scaling | Processing job events | Buffer, route, retry, dead-letter failed messages | Job message to target consumer | Downstream pipeline module |
| 03 | **Knowledge Processing Engine** | Convert raw source content into structured knowledge | Job message, source reference, raw content (transcript, ticket, page, PR comment) | Fetch, normalize, chunk, extract entities, detect decision candidates, persist | Structured knowledge + `source.ingested` event | Classification Engine |
| 04 | **Classification Engine** | Categorize decisions into business and technical domains | Structured knowledge | Classification models, rule engine, confidence scoring | Classified decision + `decision.classified` event | Analysis Engine |
| 05 | **Analysis Engine** | Diff vs ledger and orchestrate analysis sub-engines into an insight package | Classified decision | Coordinate Ledger Diff, Impact, Forecast, and Recommendation sub-engines | Insight package + `insight.ready` event | Review & Approval Portal |
| 06 | **Review & Approval Portal** | Human validation and approval before ledger write | Insight package | Human review, edit, approve / reject, capture rationale | Approved or rejected decision + `decision.approved` event | Decision Ledger |
| 07 | **Decision Ledger** | Source of truth for approved decisions | Approved decision package | Versioning, indexing, audit trail, evidence linking | Ledger record | Consumer API |
| 08 | **Consumer API** | Expose trusted knowledge to downstream systems | Ledger records | Search, retrieval, filtering, RAG context building | Decision knowledge API response | AI Systems |

---

## Analysis Engine sub-components

These run inside the **Analysis Engine** (module 05). They are not separate pipeline stages.

| Sub-component | Purpose | Input | Processing | Output | Aggregated by |
| ------------- | ------- | ----- | ---------- | ------ | ------------- |
| **Impact Engine** | Determine what may be affected by the decision | Classified decision | Dependency analysis, graph traversal | Impact map | Analysis Engine |
| **Ledger Diff Engine** | Explain what changed vs approved ledger | Classified decision | Hybrid retrieval, structured field diff, change classification | Ledger diff | Analysis Engine |
| **Forecast Engine** | Predict future consequences and risks | Classified decision, historical decisions, impact map | Pattern analysis, risk prediction | Forecast report | Analysis Engine |
| **Recommendation Engine** | Suggest next actions and governance steps | Impact map, similar decisions list, forecast report | Reasoning, rule engine, LLM | Recommendations | Analysis Engine |

---

## Knowledge Processing Engine capabilities

Decision candidate detection is implemented as a capability within the **Knowledge Processing Engine**, not as a standalone module.

| Capability | Purpose | Input | Processing | Output |
| ---------- | ------- | ----- | ---------- | ------ |
| **Decision Candidate Detection** | Identify decision signals in unstructured content | Normalized text chunks | NLP extraction, decision signal detection | Decision candidates (embedded in structured knowledge) |

---

## Event flow

| Event | Producer | Consumer |
| ----- | -------- | -------- |
| `source.triggered` | Signal Intake Engine | Knowledge Processing Engine |
| `source.ingested` | Knowledge Processing Engine | Classification Engine |
| `decision.classified` | Classification Engine | Analysis Engine |
| `insight.ready` | Analysis Engine | Review & Approval Portal |
| `decision.approved` | Review & Approval Portal | Decision Ledger |
