# Architecture

Documentation for the Document Ledger pipeline — from external signals to trusted decision knowledge and **discussion change previews**.

## Overview

| Document | Description |
| -------- | ----------- |
| [System Architecture](overview/architecture.md) | Dual-path pipeline, naming conventions, events |
| [Module Responsibility Matrix](overview/module-responsibility-matrix.md) | Input / processing / output per module |
| [Dual-path diagram](overview/dual-path-pipeline.mmd) | Decision path vs discussion path fork |

## Diagrams

C4 model diagrams ([source and design notes](diagrams/c4/README.md)):

| Level | Source |
| ----- | ------ |
| Context (L1) | [diagrams/c4/c4-context.mmd](diagrams/c4/c4-context.mmd) |
| Container (L2) | [diagrams/c4/c4-container.mmd](diagrams/c4/c4-container.mmd) |
| Component — Analysis (L3) | [diagrams/c4/c4-component-analysis-engine.mmd](diagrams/c4/c4-component-analysis-engine.mmd) |
| Component — Forecast (L3) | [diagrams/c4/c4-component-forecast-engine.mmd](diagrams/c4/c4-component-forecast-engine.mmd) |

## Modules

| # | Module | Spec |
| - | ------ | ---- |
| 01 | Signal Intake Engine | [modules/01-signal-intake](modules/01-signal-intake/) |
| 02 | Queue / Event Bus | [modules/02-queue-event-bus](modules/02-queue-event-bus/) |
| 03 | Knowledge Processing Engine | [modules/03-knowledge-processing](modules/03-knowledge-processing/) |
| 04 | Classification Engine | [modules/04-classification](modules/04-classification/) |
| 05 | Analysis Engine | [modules/05-analysis-engine](modules/05-analysis-engine/) |
| 06 | Review & Approval Portal | [modules/06-review-portal](modules/06-review-portal/) |
| 07 | Decision Ledger | [modules/07-decision-ledger](modules/07-decision-ledger/) |
| 08 | Consumer API | [modules/08-consumer-api](modules/08-consumer-api/) |
| **09** | **Forecast Engine** | [modules/09-forecast-engine](modules/09-forecast-engine/) |

## Layout

```
architecture/
├── README.md
├── overview/
│   ├── architecture.md
│   ├── module-responsibility-matrix.md
│   └── dual-path-pipeline.mmd
├── diagrams/c4/
└── modules/
    ├── 01-signal-intake/ … 08-consumer-api/
    └── 09-forecast-engine/    ← discussions: change + precedent
```
