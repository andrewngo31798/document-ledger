# Document Ledger — System Architecture

This document describes the end-to-end pipeline including the **dual-path model**: decisions vs. discussions. For per-module inputs, processing, and outputs, see the [Module Responsibility Matrix](module-responsibility-matrix.md).

## Naming conventions

| # | Canonical name | Short label (diagrams) | Spec |
| - | -------------- | ---------------------- | ---- |
| 01 | Signal Intake Engine | Signal Intake | [../modules/01-signal-intake](../modules/01-signal-intake/) |
| 02 | Queue / Event Bus | Queue | [../modules/02-queue-event-bus](../modules/02-queue-event-bus/) |
| 03 | Knowledge Processing Engine | Knowledge Processing | [../modules/03-knowledge-processing](../modules/03-knowledge-processing/) |
| 04 | Classification Engine | Classification | [../modules/04-classification](../modules/04-classification/) |
| 05 | Analysis Engine | Analysis | [../modules/05-analysis-engine](../modules/05-analysis-engine/) |
| 05a | ↳ Impact Engine | Impact | (within Analysis Engine) |
| 05b | ↳ Ledger Diff Engine | Ledger Diff | (within Analysis Engine) |
| 05c | ↳ Recommendation Engine | Recommendation | (within Analysis Engine) |
| 06 | Review & Approval Portal | Review Portal | [../modules/06-review-portal](../modules/06-review-portal/) |
| 07 | Decision Ledger | Decision Ledger | [../modules/07-decision-ledger](../modules/07-decision-ledger/) |
| 08 | Consumer API | Consumer API | [../modules/08-consumer-api](../modules/08-consumer-api/) |
| **09** | **Forecast Engine** | **Forecast** | [../modules/09-forecast-engine](../modules/09-forecast-engine/) |

**Notes:**
- Decision candidate detection is a capability inside Knowledge Processing Engine, not a separate module.
- **Forecast Engine (09) is a standalone pipeline module** for discussions — not a sub-engine of Analysis.

---

## 1. Dual-path overview

Not all ingested content is a decision. Meetings and design threads often contain **change signals** and **debate** without a closed decision candidate. The pipeline forks after Knowledge Processing:

```
Knowledge Processing Engine
            │
            ▼
     source.ingested
            │
     ┌──────┴──────┐
     │             │
 decision      discussion
  path            path
     │             │
     ▼             ▼
Classification   Forecast Engine (09)
     │             │
     ▼             ▼
Analysis         change.preview.ready
(Ledger Diff,         │
 Impact,              ▼
 Recommend)      Consumer API
     │
     ▼
Review → Ledger → Consumer API
```

Diagram: [dual-path-pipeline.mmd](dual-path-pipeline.mmd)

### Path comparison

| | Decision path | Discussion path |
| - | ------------- | --------------- |
| **Trigger** | `decision_candidate_count ≥ 1` | `discussion_signal = true`, no decision candidate |
| **Primary question** | What changes vs the approved ledger? | What is changing? Have we seen this before? |
| **Modules** | Classification → Analysis → Review → Ledger | Forecast Engine |
| **Output** | `insight_package` | `change_preview` |
| **Event** | `insight.ready` | `change.preview.ready` |
| **Human gate** | Review & Approval Portal | Optional (high-priority alerts only) |

---

## 2. Overall architecture

```
External Sources
        ↓
Signal Intake Engine
        ↓
Queue / Event Bus
        ↓
Knowledge Processing Engine
        ├──────────────────────────────┐
        ▼                              ▼
Classification Engine          Forecast Engine (09)
        ▼                              │
Analysis Engine                        │
 ├── Ledger Diff                       │
 ├── Impact                            │
 └── Recommendation                    │
        ▼                              ▼
Review & Approval Portal         Consumer API
        ▼                              ▲
Decision Ledger ───────────────────────┘
```

---

## 3. Event flow

| Event | Producer | Consumer |
| ----- | -------- | -------- |
| `source.triggered` | Signal Intake Engine | Knowledge Processing Engine |
| `source.ingested` | Knowledge Processing Engine | Classification Engine **or** Forecast Engine (routing) |
| `decision.classified` | Classification Engine | Analysis Engine |
| `insight.ready` | Analysis Engine | Review & Approval Portal |
| `decision.approved` | Review & Approval Portal | Decision Ledger |
| `change.preview.ready` | Forecast Engine | Consumer API |

---

## 4. Pipeline summary

| # | Module | Purpose | Input | Output |
| - | ------ | ------- | ----- | ------ |
| 01 | **Signal Intake Engine** | Receive and validate processing triggers | Manual trigger, schedule, webhook | Processing job |
| 02 | **Queue / Event Bus** | Decouple stages and scale async workers | Processing job event | Job message |
| 03 | **Knowledge Processing Engine** | Build structured knowledge; detect decisions **and** discussions | Job message + source reference | Structured knowledge + routing hint |
| 04 | **Classification Engine** | Classify decision candidates (**decision path only**) | Structured knowledge with candidates | Classified decision |
| 05 | **Analysis Engine** | Ledger diff, impact, recommendations (**decision path only**) | Classified decision | Insight package |
| 06 | **Review & Approval Portal** | Human validation before ledger write | Insight package | Approved decision |
| 07 | **Decision Ledger** | Source of truth for approved decisions | Approved decision | Ledger record |
| 08 | **Consumer API** | Expose trusted knowledge and change previews | Ledger records + change previews | API response |
| **09** | **Forecast Engine** | Capture change + precedent for **discussions** | Discussion-path `source.ingested` | Change preview |

See [module-responsibility-matrix.md](module-responsibility-matrix.md) for sub-component detail.

---

## 5. C4 model diagrams

| Level | Diagram | Purpose |
| ----- | ------- | ------- |
| L1 — Context | [c4-context.mmd](../diagrams/c4/c4-context.mmd) | System boundary |
| L2 — Container | [c4-container.mmd](../diagrams/c4/c4-container.mmd) | Deployable containers + dual path |
| L3 — Analysis | [c4-component-analysis-engine.mmd](../diagrams/c4/c4-component-analysis-engine.mmd) | Analysis sub-components (3 sub-engines) |
| L3 — Forecast | [c4-component-forecast-engine.mmd](../diagrams/c4/c4-component-forecast-engine.mmd) | Change · Precedent · Forward |
