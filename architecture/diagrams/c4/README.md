# C4 Model — Document Ledger

Version-controlled C4 diagrams aligned with [System Architecture](../../overview/architecture.md) and the [Module Responsibility Matrix](../../overview/module-responsibility-matrix.md).

## Diagram levels

| Level | File | Description |
| ----- | ---- | ----------- |
| **Context (L1)** | [c4-context.mmd](c4-context.mmd) | Document Ledger in its environment: users, external sources, downstream AI consumers |
| **Container (L2)** | [c4-container.mmd](c4-container.mmd) | Deployable containers, data stores, and async event flow across the 8 pipeline modules |
| **Component (L3)** | [c4-component-analysis-engine.mmd](c4-component-analysis-engine.mmd) | Internal components of the Analysis Engine and its four sub-engines |

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

These diagrams replace earlier exports that had structural drift from the canonical architecture:

- **Queue / Event Bus** is modeled as its own container, not an implicit hop.
- Pipeline order is **Signal Intake → Queue → Knowledge Processing → Classification → Analysis → Review & Approval Portal → Decision Ledger → Consumer API**.
- **Classification Engine** does not bypass Analysis or write directly to Review.
- **Analysis Engine** does not write directly to Decision Ledger; approval happens in Review & Approval Portal first.
- Analysis sub-engines (Ledger Diff, Impact, Forecast, Recommendation) are shown at component level, not as top-level pipeline containers.

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
