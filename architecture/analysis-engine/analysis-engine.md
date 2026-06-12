# Analysis Engine (legacy stub)

> **Canonical spec:** [modules/05-analysis-engine/README.md](../modules/05-analysis-engine/README.md)

The Analysis Engine is the **decision-path** intelligence layer. It orchestrates **three** sub-engines:

| Sub-engine | Purpose |
| ---------- | ------- |
| **Ledger Diff** | What changed vs approved Decision Ledger |
| **Impact** | Blast radius and affected systems |
| **Recommendation** | Governance and next-step proposals |

**Forecast Engine** (change capture, "have we seen this before?" for discussions) is **module 09** — [modules/09-forecast-engine/README.md](../modules/09-forecast-engine/README.md). It is not part of Analysis.

```
Classification Engine → Analysis Engine → Review & Approval Portal
                         ├── Ledger Diff
                         ├── Impact
                         ├── Recommendation
                         └── Insight Aggregator
```

Output: **Insight Package** + `insight.ready` event.
