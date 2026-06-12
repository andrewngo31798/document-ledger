# Queue / Event Bus (legacy stub)

> **Canonical spec:** [modules/02-queue-event-bus/README.md](../modules/02-queue-event-bus/README.md)

Async processing layer between pipeline stages.

## Key events

| Event | Producer | Consumer(s) |
| ----- | -------- | ----------- |
| `source.triggered` | Signal Intake | Knowledge Processing |
| `source.ingested` | Knowledge Processing | Classification **or** Forecast Engine (via `routing.primary_path`) |
| `decision.classified` | Classification | Analysis Engine |
| `insight.ready` | Analysis Engine | Review Portal |
| `decision.approved` | Review Portal | Decision Ledger |
| `change.preview.ready` | Forecast Engine | Consumer API |
