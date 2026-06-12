# Classification Engine (legacy stub)

> **Canonical spec:** [modules/04-classification/README.md](../modules/04-classification/README.md)

**Decision path only.** Classifies decision candidates and routes Analysis sub-engines.

| Responsibility | Description |
| -------------- | ----------- |
| Classify domain | business, technical, hybrid |
| Apply taxonomy | Category tags and confidence |
| Route analysis | `analysis_profile` + `sub_engines` (ledger_diff, impact, recommendation) |

Discussions (`routing.primary_path = discussion`) **skip Classification** and route to [Forecast Engine (module 09)](../modules/09-forecast-engine/README.md).

```
Knowledge Processing → Classification → Analysis Engine
```
