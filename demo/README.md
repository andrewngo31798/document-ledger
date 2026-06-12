# Demo

Demo materials for Document Ledger.

| Document | Purpose |
| -------- | ------- |
| [System Walkthrough](system-walkthrough.md) | Talking points for each pipeline module (dual-path: decision + discussion) |
| [Component Script](component-script.md) | Presenter cues aligned with the ReactFlow demo UI |
| [Storytelling](storytelling.md) | Timed narrative arc for video demos |
| [Product Onboarding](product-onboarding.md) | Phase 1 org onboarding checklist |

## Demo paths in the UI

| Input | Path | Highlights |
| ----- | ---- | ---------- |
| Meeting transcript | Decision | Classification → Analysis (3 sub-engines) → Review → Ledger → Consumer API |
| Confluence page | Discussion | Forecast Engine (single node) → Consumer API |

Module specs: [`architecture/modules/`](../architecture/modules/) — including [Forecast Engine (09)](../architecture/modules/09-forecast-engine/README.md).

Run the interactive demo: `cd frontend && npm install && npm run dev`
