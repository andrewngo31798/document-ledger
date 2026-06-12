# Knowledge Processing Engine (legacy stub)

> **Canonical spec:** [modules/03-knowledge-processing/README.md](../modules/03-knowledge-processing/README.md)

Converts raw source content into structured knowledge and sets **routing** for downstream paths.

| Responsibility | Description |
| -------------- | ----------- |
| Fetch & normalize | Pull and clean source content |
| Extract entities | People, systems, projects |
| Detect decision candidates | Explicit or implied decisions |
| Detect discussion signals | Shifting threads without closed decisions |
| Route | `routing.primary_path`: `decision`, `discussion`, or `none` |

```
Event Bus → Knowledge Processing Engine → source.ingested
                ├─ decision path  → Classification Engine
                └─ discussion path → Forecast Engine (module 09)
```
