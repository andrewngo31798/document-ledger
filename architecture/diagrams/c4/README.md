# C4 Model — Document Ledger

Version-controlled C4 diagrams aligned with [System Architecture](../../overview/architecture.md) and the [Module Responsibility Matrix](../../overview/module-responsibility-matrix.md).

## Diagram levels

| Level | File | Description |
| ----- | ---- | ----------- |
| **Context (L1)** | [c4-context.mmd](c4-context.mmd) | Document Ledger in its environment: users, external sources, downstream AI consumers |
| **Container (L2)** | [c4-container.mmd](c4-container.mmd) | Deployable containers, data stores, and async event flow — **dual-path** (decision + discussion) |
| **Component — Analysis (L3)** | [c4-component-analysis-engine.mmd](c4-component-analysis-engine.mmd) | Analysis Engine and its **three** decision-path sub-engines |
| **Component — Forecast (L3)** | [c4-component-forecast-engine.mmd](c4-component-forecast-engine.mmd) | Forecast Engine (module 09) — change, precedent, forward |
| **Dual-path overview** | [../../overview/dual-path-pipeline.mmd](../../overview/dual-path-pipeline.mmd) | Fork after Knowledge Processing |
| **Analysis detail (L3+)** | [../../modules/05-analysis-engine/diagrams/README.md](../../modules/05-analysis-engine/diagrams/README.md) | Internal architecture, AI layer, DAG, grounding pipeline |
| **Forecast detail** | [../../modules/09-forecast-engine/README.md](../../modules/09-forecast-engine/README.md) | Discussion-path design and schemas |

## Rendered exports

| Diagram | PNG |
| ------- | --- |
| Context | [c4-context.png](c4-context.png) |
| Container | [c4-container.png](c4-container.png) |

Regenerate PNG exports from source:

```bash
./render.sh
```

Or manually with mermaid-cli:

```bash
npx @mermaid-js/mermaid-cli -i c4-context.mmd -o c4-context.png -b transparent
npx @mermaid-js/mermaid-cli -i c4-container.mmd -o c4-container.png -b transparent
```

## Design notes

- **Queue / Event Bus** is modeled as its own container, not an implicit hop.
- **Dual-path routing** after Knowledge Processing:
  - **Decision path:** Classification → Analysis → Review → Decision Ledger → Consumer API
  - **Discussion path:** Forecast Engine (09) → Consumer API (`change.preview.ready`)
- **Forecast Engine** is a **top-level pipeline container** (module 09), not an Analysis sub-engine.
- **Analysis Engine** does not write directly to Decision Ledger; approval happens in Review & Approval Portal first.
- Analysis sub-engines (Ledger Diff, Impact, Recommendation) are shown at component level inside Analysis only.

## Canonical module mapping

| C4 container | Module spec |
| ------------ | ----------- |
| Signal Intake Engine | [01-signal-intake](../../modules/01-signal-intake/) |
| Queue / Event Bus | [02-queue-event-bus](../../modules/02-queue-event-bus/) |
| Knowledge Processing Engine | [03-knowledge-processing](../../modules/03-knowledge-processing/) |
| Classification Engine | [04-classification](../../modules/04-classification/) |
| Analysis Engine | [05-analysis-engine](../../modules/05-analysis-engine/) |
| Review & Approval Portal | [06-review-portal](../../modules/06-review-portal/) |
| Decision Ledger | [07-decision-ledger](../../modules/07-decision-ledger/) |
| Consumer API | [08-consumer-api](../../modules/08-consumer-api/) |
| **Forecast Engine** | [09-forecast-engine](../../modules/09-forecast-engine/) |
