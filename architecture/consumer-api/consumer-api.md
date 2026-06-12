# Consumer API (legacy stub)

> **Canonical spec:** [modules/08-consumer-api/README.md](../modules/08-consumer-api/README.md)

Exposes **approved decision knowledge** and **advisory change previews** to downstream systems.

| Source | Trust tier | Use |
| ------ | ---------- | --- |
| Decision Ledger | Authoritative | Search, retrieve, RAG over approved decisions |
| Change previews (Forecast Engine) | Advisory | Discussion shifts, precedent Q&A |

```
Decision Ledger ──┐
                  ├──► Consumer API → AI agents / search / dashboards
change_previews ──┘
```

Planned endpoints include `/decisions/*`, `/changes/previews`, and `/changes/seen-before`.
