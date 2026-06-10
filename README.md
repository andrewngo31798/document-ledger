# document-ledger

Capture, analyze, and publish organizational decisions as trusted, AI-ready knowledge.

## Repository layout

```
document-ledger/
├── README.md
├── architecture/          # System design and module specifications
│   ├── overview/          # Architecture overview and responsibility matrix
│   ├── diagrams/          # C4 and other architecture diagrams
│   └── modules/           # Per-module specs (pipeline order 01–08)
└── demo/                  # Demo implementation (placeholder)
```

## Documentation

Start with the [architecture index](architecture/README.md).

Pipeline flow:

```
External Sources → Signal Intake → Queue → Knowledge Processing → Classification
  → Analysis → Review → Decision Ledger → Consumer API → AI Systems
```
