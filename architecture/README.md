# Architecture

Documentation for the Document Ledger pipeline — from external signals to trusted decision knowledge.

## Overview

| Document | Description |
| -------- | ----------- |
| [System Architecture](overview/architecture.md) | End-to-end pipeline, core diagram, module table |
| [Module Responsibility Matrix](overview/module-responsibility-matrix.md) | Input / processing / output per module |

## Diagrams

| Diagram | File |
| ------- | ---- |
| C4 Context | [diagrams/c4/c4-context.png](diagrams/c4/c4-context.png) |
| C4 Container | [diagrams/c4/c4-container.png](diagrams/c4/c4-container.png) |

## Modules

Pipeline modules in execution order:

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

## Layout

```
architecture/
├── README.md                 ← you are here
├── overview/                 ← system-wide docs
├── diagrams/c4/              ← C4 model exports
└── modules/                  ← per-module specs (01–08)
    └── {nn-module-name}/
        └── README.md
```
