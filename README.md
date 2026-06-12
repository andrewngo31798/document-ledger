# document-ledger

Capture, analyze, and publish organizational decisions as trusted, AI-ready knowledge — and surface **discussion change** before decisions close.

## Repository layout

```
document-ledger/
├── README.md
├── architecture/          # System design and module specifications
│   ├── overview/          # Architecture overview, dual-path diagram, responsibility matrix
│   ├── diagrams/          # C4 and other architecture diagrams
│   └── modules/           # Per-module specs (pipeline order 01–09)
├── demo/                  # Demo scripts, walkthrough, onboarding
└── frontend/              # Interactive pipeline demo (React + Vite)
```

## Documentation

Start with the [architecture index](architecture/README.md).

### Dual-path pipeline

| Path | When | Flow |
| ---- | ---- | ---- |
| **Decision** | Decision candidate detected | Signal Intake → Queue → Knowledge Processing → Classification → Analysis → Review → Decision Ledger → Consumer API |
| **Discussion** | Discussion signal, no decision | Signal Intake → Queue → Knowledge Processing → **Forecast Engine (09)** → Consumer API |

```
External Sources → Signal Intake → Queue → Knowledge Processing
  ├─ decision path  → Classification → Analysis → Review → Decision Ledger → Consumer API
  └─ discussion path → Forecast Engine (09) ───────────────────────────────→ Consumer API
```

**Forecast Engine (module 09)** captures change in threads and answers *"have we seen this before?"* — it is **not** part of Analysis Engine.

## Demo

- [System walkthrough](demo/system-walkthrough.md) — talking points per module
- [Component script](demo/component-script.md) — presenter cues for the UI demo
- Run locally: `cd frontend && npm install && npm run dev`
