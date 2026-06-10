# Document Ledger — System Architecture

This document describes the end-to-end pipeline. For per-module inputs, processing, and outputs, see the [Module Responsibility Matrix](module-responsibility-matrix.md).

## Naming conventions

All documentation uses the **canonical module names** below. Short labels may appear in flow diagrams only.

| # | Canonical name | Short label (diagrams) | Spec |
| - | -------------- | ---------------------- | ---- |
| 01 | Signal Intake Engine | Signal Intake | [../modules/01-signal-intake](../modules/01-signal-intake/) |
| 02 | Queue / Event Bus | Queue | [../modules/02-queue-event-bus](../modules/02-queue-event-bus/) |
| 03 | Knowledge Processing Engine | Knowledge Processing | [../modules/03-knowledge-processing](../modules/03-knowledge-processing/) |
| 04 | Classification Engine | Classification | [../modules/04-classification](../modules/04-classification/) |
| 05 | Analysis Engine | Analysis | [../modules/05-analysis-engine](../modules/05-analysis-engine/) |
| 05a | ↳ Impact Engine | Impact | (within Analysis Engine) |
| 05b | ↳ Similarity Engine | Similarity | (within Analysis Engine) |
| 05c | ↳ Forecast Engine | Forecast | (within Analysis Engine) |
| 05d | ↳ Recommendation Engine | Recommendation | (within Analysis Engine) |
| 06 | Review & Approval Portal | Review Portal | [../modules/06-review-portal](../modules/06-review-portal/) |
| 07 | Decision Ledger | Decision Ledger | [../modules/07-decision-ledger](../modules/07-decision-ledger/) |
| 08 | Consumer API | Consumer API | [../modules/08-consumer-api](../modules/08-consumer-api/) |

**Note:** Decision candidate detection is a capability inside the Knowledge Processing Engine, not a separate pipeline module.

---

## 1. Overall architecture

```
External Sources
├── Manual Trigger
├── Scheduler
├── Webhook
├── Jira
├── Confluence
├── Meeting Transcript
├── Slack / Teams
└── GitHub / GitLab
        ↓
Signal Intake Engine
        ↓
Queue / Event Bus
        ↓
Knowledge Processing Engine
        ↓
Classification Engine
        ↓
Analysis Engine
   ├── Impact Engine
   ├── Similarity Engine
   ├── Forecast Engine
   └── Recommendation Engine
        ↓
Review & Approval Portal
        ↓
Decision Ledger
        ↓
Consumer API
        ↓
AI Systems / Search / Agent / RAG
```

---

## 2. Core architecture diagram

```
                 ┌──────────────────────────────┐
                 │        External Sources       │
                 │ Jira / Confluence / Meeting   │
                 │ Slack / GitHub / Manual / Cron│
                 └───────────────┬──────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────┐
│              Signal Intake Engine                  │
│----------------------------------------------------│
│ - Receive manual trigger                           │
│ - Receive webhook                                  │
│ - Run scheduled trigger                            │
│ - Validate source reference                        │
│ - Create processing job                            │
│ - Publish source.triggered event                   │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│                 Queue / Event Bus                  │
│----------------------------------------------------│
│ Kafka / SQS / RabbitMQ / BullMQ                    │
│ Events: source.triggered, source.ingested,         │
│         decision.classified, insight.ready,        │
│         decision.approved                          │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│            Knowledge Processing Engine             │
│----------------------------------------------------│
│ - Fetch raw data from source                       │
│ - Normalize text                                   │
│ - Chunk content                                    │
│ - Extract entities                                 │
│ - Detect decision candidates                       │
│ - Store raw + normalized knowledge                 │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│               Classification Engine                │
│----------------------------------------------------│
│ - Business / technical classification              │
│ - Decision type tagging                            │
│ - Confidence scoring                               │
│ - Routing to proper analysis path                  │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│                  Analysis Engine                   │
│----------------------------------------------------│
│ Impact Engine | Similarity Engine                  │
│ Forecast Engine | Recommendation Engine            │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│              Review & Approval Portal              │
│----------------------------------------------------│
│ - Human review                                     │
│ - Edit / approve / reject                          │
│ - Add rationale                                    │
│ - Confirm source of truth                          │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│                  Decision Ledger                   │
│----------------------------------------------------│
│ - Approved decisions                               │
│ - Version history                                  │
│ - Audit trail                                      │
│ - Evidence links                                   │
│ - AI-ready structured knowledge                    │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│                   Consumer API                     │
│----------------------------------------------------│
│ - Search decisions                                 │
│ - Retrieve by project / domain / system            │
│ - Feed AI agents / RAG / documentation systems     │
└────────────────────────────────────────────────────┘
```

---

## 3. Pipeline summary

| # | Module | Purpose | Input | Output |
| - | ------ | ------- | ----- | ------ |
| 01 | **Signal Intake Engine** | Receive and validate processing triggers | Manual trigger, schedule, webhook | Processing job |
| 02 | **Queue / Event Bus** | Decouple stages and scale async workers | Processing job event | Job message |
| 03 | **Knowledge Processing Engine** | Fetch raw data and build structured knowledge | Job message + source reference | Structured knowledge |
| 04 | **Classification Engine** | Classify business vs. technical decisions | Structured knowledge | Classified decision |
| 05 | **Analysis Engine** | Produce insight package from analysis sub-engines | Classified decision | Insight package |
| 06 | **Review & Approval Portal** | Human validation before ledger write | Insight package | Approved decision |
| 07 | **Decision Ledger** | Source of truth for approved decisions | Approved decision | Ledger record |
| 08 | **Consumer API** | Expose trusted knowledge to downstream systems | Ledger record | API response / RAG context |

See [module-responsibility-matrix.md](module-responsibility-matrix.md) for the full matrix, including Analysis Engine sub-components.
