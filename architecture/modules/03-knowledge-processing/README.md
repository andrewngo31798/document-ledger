# Knowledge Processing Engine — Design

Module **03** in the Document Ledger pipeline. Converts raw source content into structured knowledge objects with embedded decision candidates **and discussion signals**, then routes to the **decision path** (Classification) or **discussion path** ([Forecast Engine](../09-forecast-engine/)).

Related docs: [System Architecture](../../overview/architecture.md) · [Responsibility Matrix](../../overview/module-responsibility-matrix.md) · [Signal Intake Engine](../01-signal-intake/) · [Classification Engine](../04-classification/)

---

## 1. Role

```
Knowledge Processing Engine = fetch raw content and produce structured, tenant-scoped knowledge
```

| Responsibility | Description |
| -------------- | ----------- |
| Consume jobs | Pull `source.triggered` events from Queue / Event Bus |
| Fetch source data | Retrieve raw content via source reference and adapter |
| Normalize text | Clean encoding, strip noise, unify format |
| Chunk content | Split into semantic segments for NLP |
| Extract entities | People, systems, projects, dates, links |
| Detect decision candidates | Identify closed decision signals in text |
| Detect discussion signals | Identify debate / change language without decision closure |
| Set routing hint | `routing.primary_path`: decision, discussion, both, or none |
| Enrich metadata | Attach tenant, source, timestamps, content hash |
| Persist knowledge | Store raw artifacts and structured records |
| Publish completion | Emit `source.ingested` for Classification **or** Forecast Engine |

### Scope boundaries

| In scope | Out of scope |
| -------- | -------------- |
| Fetching and normalizing source content | Business / technical classification |
| Entity, decision-candidate, and discussion-signal extraction | Classification, Analysis, or Forecast processing |
| Structured knowledge persistence | Human review and approval |
| Publishing `source.ingested` | Writing to Decision Ledger |

---

## 2. Architecture

```
Queue / Event Bus
  │ source.triggered
  ▼
┌─────────────────────────────────────────────────────────┐
│              Knowledge Processing Engine                 │
│                                                          │
│  Job Consumer ──► Pipeline Orchestrator                  │
│                         │                                │
│         ┌───────────────┼───────────────┐                │
│         ▼               ▼               ▼                │
│  Source Adapter   Processing Chain   Knowledge Store     │
│  Registry         (normalize →        Writer             │
│  (Jira, etc.)      chunk → extract →                     │
│                    detect candidates)                    │
│                         │                                │
│                    Audit Logger                          │
│                    Event Publisher                       │
└─────────┬───────────────────────┬───────────────────────┘
          │                       │
          ▼                       ▼
   PostgreSQL              Object Storage
   (structured records)    (raw content blobs)
          │
          ▼
   Queue / Event Bus ──► Classification Engine (decision path)
     source.ingested          Forecast Engine (discussion path)
                              change.preview.ready
```

### Processing chain (sequential)

```
Raw content
  → Text Normalizer
  → Content Chunker
  → Entity Extractor
  → Decision Candidate Detector
  → Metadata Enricher
  → Knowledge Store Writer
```

Each stage receives the output of the previous stage. The orchestrator tracks stage status for retry and audit.

---

## 3. Internal components

| Component | Purpose | Notes |
| --------- | ------- | ----- |
| **Job Consumer** | Subscribe to `source.triggered`, deserialize payload, ack/nack | Competing consumers; at-least-once delivery |
| **Pipeline Orchestrator** | Run processing chain, handle partial failure and stage retry | Idempotent on `job_id` + `content_hash` |
| **Source Adapter Registry** | Resolve adapter by `source_type` | Pluggable adapters per external system |
| **Source Fetcher** | Call adapter to retrieve raw content and source metadata | Uses tenant-scoped credentials |
| **Text Normalizer** | Strip HTML/markdown noise, fix encoding, collapse whitespace | Source-type aware rules |
| **Content Chunker** | Split into overlapping semantic chunks | Target ~512–1024 tokens per chunk |
| **Entity Extractor** | Extract NER + structured fields (people, systems, dates, URLs) | Rule + LLM hybrid (TBD) |
| **Decision Candidate Detector** | Score text spans for decision-like language | Outputs candidates with confidence + evidence span |
| **Metadata Enricher** | Attach tenant, job, source ref, timestamps, lineage | Links back to Signal Intake job |
| **Knowledge Store Writer** | Persist raw blob + structured knowledge record | Transactional write to PostgreSQL + object store |
| **Event Publisher** | Publish `source.ingested` on success | Includes `knowledge_id` reference |
| **Audit Logger** | Record stage timings, adapter calls, errors | Correlates with `job_id` and `trace_id` |

---

## 4. Event contracts

### Input: `source.triggered`

Consumed from Queue / Event Bus. Produced by Signal Intake Engine.

```json
{
  "event_type": "source.triggered",
  "event_id": "uuid",
  "occurred_at": "2026-06-10T12:00:00Z",
  "tenant_id": "tenant-abc",
  "job_id": "job-uuid",
  "trace_id": "trace-uuid",
  "payload": {
    "trigger_type": "webhook | manual | schedule | backfill | replay",
    "source_type": "jira | confluence | slack | github | meeting | file",
    "source_reference": {
      "external_id": "PROJ-123",
      "url": "https://jira.example.com/browse/PROJ-123",
      "version": "optional-content-version-or-etag"
    },
    "scope": {
      "project_id": "proj-uuid",
      "space_key": "optional"
    }
  }
}
```

### Output: `source.ingested`

Published on successful processing. Consumed by Classification Engine.

```json
{
  "event_type": "source.ingested",
  "event_id": "uuid",
  "occurred_at": "2026-06-10T12:01:30Z",
  "tenant_id": "tenant-abc",
  "job_id": "job-uuid",
  "trace_id": "trace-uuid",
  "payload": {
    "knowledge_id": "know-uuid",
    "source_type": "jira",
    "source_reference": {
      "external_id": "PROJ-123",
      "url": "https://jira.example.com/browse/PROJ-123"
    },
    "summary": {
      "title": "Migrate auth to OAuth2",
      "chunk_count": 4,
      "entity_count": 12,
      "decision_candidate_count": 2
    },
    "processing": {
      "content_hash": "sha256:…",
      "duration_ms": 4200,
      "stages_completed": ["fetch", "normalize", "chunk", "extract", "detect", "persist"]
    }
  }
}
```

Classification Engine loads the full structured knowledge record by `knowledge_id`.

---

## 5. Data model

### `knowledge_records` (PostgreSQL)

| Column | Type | Description |
| ------ | ---- | ----------- |
| `id` | UUID | Primary key (`knowledge_id`) |
| `tenant_id` | UUID | Tenant scope |
| `job_id` | UUID | Originating processing job |
| `source_type` | VARCHAR | jira, confluence, slack, etc. |
| `source_external_id` | VARCHAR | External system identifier |
| `source_url` | TEXT | Canonical source URL |
| `title` | TEXT | Extracted or fetched title |
| `content_hash` | VARCHAR | SHA-256 of normalized text |
| `raw_object_key` | VARCHAR | Object storage key for raw payload |
| `normalized_text` | TEXT | Full normalized text (or TOAST) |
| `metadata` | JSONB | Source-specific fields, fetch timestamps |
| `status` | VARCHAR | processing, completed, failed |
| `created_at` | TIMESTAMPTZ | Record creation |
| `updated_at` | TIMESTAMPTZ | Last update |

### `knowledge_chunks` (PostgreSQL)

| Column | Type | Description |
| ------ | ---- | ----------- |
| `id` | UUID | Chunk ID |
| `knowledge_id` | UUID | FK → knowledge_records |
| `sequence` | INT | Order within document |
| `text` | TEXT | Chunk content |
| `token_count` | INT | Approximate token count |
| `start_offset` | INT | Character offset in normalized text |
| `end_offset` | INT | Character offset end |

### `extracted_entities` (PostgreSQL)

| Column | Type | Description |
| ------ | ---- | ----------- |
| `id` | UUID | Entity ID |
| `knowledge_id` | UUID | FK → knowledge_records |
| `chunk_id` | UUID | FK → knowledge_chunks (nullable) |
| `entity_type` | VARCHAR | person, system, project, date, url, … |
| `value` | TEXT | Extracted value |
| `confidence` | FLOAT | 0.0–1.0 |
| `span_start` | INT | Evidence span start |
| `span_end` | INT | Evidence span end |

### `decision_candidates` (PostgreSQL)

| Column | Type | Description |
| ------ | ---- | ----------- |
| `id` | UUID | Candidate ID |
| `knowledge_id` | UUID | FK → knowledge_records |
| `chunk_id` | UUID | FK → knowledge_chunks |
| `text` | TEXT | Candidate decision text |
| `confidence` | FLOAT | Detection confidence |
| `signal_type` | VARCHAR | explicit_decision, implied_choice, requirement_change, … |
| `span_start` | INT | Evidence span start |
| `span_end` | INT | Evidence span end |
| `metadata` | JSONB | Model version, rationale snippet |

### Object storage layout

```
/{tenant_id}/raw/{source_type}/{yyyy}/{mm}/{knowledge_id}.json
```

Raw adapter response and original payload preserved for audit and reprocessing.

---

## 6. Source adapters

Each adapter implements a common interface:

```
fetch(source_reference, tenant_credentials) → RawSourceContent
```

| Source type | Adapter | Fetches | Auth |
| ----------- | ------- | ------- | ---- |
| **jira** | JiraAdapter | Issue fields, comments, description, labels | OAuth / API token per tenant |
| **confluence** | ConfluenceAdapter | Page body, title, labels, version | OAuth / API token per tenant |
| **slack** | SlackAdapter | Channel message thread, attachments | Bot token per tenant |
| **github** | GitHubAdapter | PR title, body, review comments | App installation token |
| **meeting** | MeetingAdapter | Transcript text, speakers, timestamps | File upload or integration API |
| **file** | FileAdapter | Uploaded document content | Internal object reference |

Adapter registry resolves `source_type` → adapter instance. Unknown types fail the job with a typed error (no retry).

---

## 7. Entity extraction & decision detection

Full research and rationale: [research/entity-extraction-and-decision-detection.md](research/entity-extraction-and-decision-detection.md).

### Entity extraction (recommended: hybrid tiered pipeline)

| Tier | Method | Handles |
| ---- | ------ | ------- |
| 1 | EntityRuler + tenant gazetteers | Jira keys, URLs, `@mentions`, known project/system names |
| 2 | GLiNER (or spaCy `en_core_web_trf`) | `person`, `team`, `system`, `technology`, `date` |
| 3 | LLM structured extraction | Ambiguous spans, entity-sparse chunks only |

Every entity record includes `extraction_source`, character offsets, and optional `evidence_text` verified against source text. Classical extraction runs first; results are returned even if LLM escalation fails.

### Decision candidate detection (recommended: two-stage)

| Stage | Method | Purpose |
| ----- | ------ | ------- |
| A — Retrieval | Lexical/discourse rules + source-specific cues | High recall candidate spans |
| B — Verification | Classifier or LLM with strict JSON schema | Precision, `signal_type`, structured fields |

| Signal type | Example pattern |
| ----------- | --------------- |
| `explicit_decision` | "We decided to…", "Approved approach:" |
| `implied_choice` | "We will use X instead of Y" |
| `requirement_change` | "Scope updated to include…" |
| `architecture_choice` | "Chose microservices over monolith" |
| `policy_change` | "New approval process requires…" |

Requirements:

1. Mandatory evidence span (`start_offset`, `end_offset`, verbatim quote)
2. Programmatic grounding check before persist
3. Default confidence threshold 0.65 (tenant-configurable)
4. Fail closed — ungrounded candidates are audited and dropped
5. ADR/MADR sources map to Structured MADR fields instead of free-form inference

Decision detection runs **after** entity extraction; candidates link to extracted entities (owners, systems, technologies) via shared `chunk_id`.

---

## 8. Reliability

| Concern | Strategy |
| ------- | -------- |
| Delivery | At-least-once from queue; consumer idempotent on `job_id` + `content_hash` |
| Duplicate jobs | Skip processing if completed record exists with same hash |
| Stage failure | Retry failed stage up to 3 times with backoff |
| Permanent failure | Mark job failed, write audit log, route to DLQ (no `source.ingested`) |
| Partial writes | Single DB transaction for structured records; object store write before commit |
| Source unavailable | Retry with exponential backoff; 429/5xx from adapters are retriable |
| Large documents | Stream fetch; chunk before loading full text into memory |

---

## 9. Observability

| Metric | Description |
| ------ | ----------- |
| `kpe_jobs_consumed_total` | Jobs pulled from queue |
| `kpe_jobs_completed_total` | Successful ingestions |
| `kpe_jobs_failed_total` | Failed jobs by error type |
| `kpe_stage_duration_seconds` | Per-stage latency histogram |
| `kpe_adapter_fetch_duration_seconds` | External API latency by source_type |
| `kpe_decision_candidates_detected` | Candidates per knowledge record |

Structured logs include `job_id`, `trace_id`, `tenant_id`, `source_type`, `knowledge_id`.

---

## 10. Security and tenancy

- All queries scoped by `tenant_id`
- Source credentials stored in tenant secret store; never logged
- Raw content encrypted at rest in object storage
- Adapter calls use tenant-scoped tokens only
- No cross-tenant knowledge access

---

## 11. Dependencies

| Dependency | Direction | Contract |
| ---------- | --------- | -------- |
| Queue / Event Bus | In | `source.triggered` |
| Queue / Event Bus | Out | `source.ingested` |
| Signal Intake Engine | Upstream | Creates jobs consumed here |
| Classification Engine | Downstream | Consumes `source.ingested`, loads by `knowledge_id` |
| PostgreSQL | Storage | Structured knowledge schema |
| Object Storage | Storage | Raw content blobs |
| External source APIs | Fetch | Jira, Confluence, Slack, GitHub, etc. |

---

## 12. Open decisions

| # | Decision | Recommendation | Status |
| - | -------- | -------------- | ------ |
| 1 | Chunking strategy | Fixed token window vs semantic splitter | TBD |
| 2 | Entity extraction | Hybrid: EntityRuler + gazetteers → GLiNER → LLM escalation with grounding | **Proposed** — see [research](research/entity-extraction-and-decision-detection.md) |
| 3 | Decision detection model | Two-stage: lexical retrieval → classifier/LLM verification with evidence spans | **Proposed** — see [research](research/entity-extraction-and-decision-detection.md) |
| 4 | Worker runtime | Node.js service vs Python worker vs serverless | TBD |
| 5 | Reprocessing | Re-run detection on stored normalized text vs full re-fetch | TBD |

---

## 13. Module layout (planned)

```
architecture/modules/03-knowledge-processing/
├── README.md                 ← this design
├── research/
│   └── entity-extraction-and-decision-detection.md
├── events/
│   ├── source.triggered.schema.json
│   └── source.ingested.schema.json
└── diagrams/
    └── processing-pipeline.mmd
```
