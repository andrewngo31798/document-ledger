# Architecture

Documentation for the Document Ledger pipeline — from external signals to trusted decision knowledge.

## Overview

| Document | Description |
| -------- | ----------- |
| [System Architecture](overview/architecture.md) | End-to-end pipeline, naming conventions, core diagram |
| [Module Responsibility Matrix](overview/module-responsibility-matrix.md) | Input / processing / output per module and sub-component |

## Diagrams

C4 model diagrams ([source and design notes](diagrams/c4/README.md)):

| Level | Source | Export |
| ----- | ------ | ------ |
| Context (L1) | [diagrams/c4/c4-context.mmd](diagrams/c4/c4-context.mmd) | [c4-context.png](diagrams/c4/c4-context.png) |
| Container (L2) | [diagrams/c4/c4-container.mmd](diagrams/c4/c4-container.mmd) | [c4-container.png](diagrams/c4/c4-container.png) |
| Component — Analysis Engine (L3) | [diagrams/c4/c4-component-analysis-engine.mmd](diagrams/c4/c4-component-analysis-engine.mmd) | — |

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
