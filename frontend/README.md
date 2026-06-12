# Document Ledger — Frontend Demo

Interactive pipeline visualization for the Document Ledger dual-path architecture.

## Run locally

```bash
npm install
npm run dev
```

Mock pipeline by default (`VITE_USE_MOCK=true`). Set `VITE_USE_MOCK=false` and `VITE_API_BASE_URL` to hit a real backend.

## Demo paths

| Input screen choice | `primary_path` | Stages shown |
| ------------------- | -------------- | ------------ |
| Meeting transcript | `decision` | Classification → Analysis (Ledger Diff, Impact, Recommendation) → Review → Ledger → Consumer API |
| Confluence page | `discussion` | Forecast Engine → Consumer API (decision-path nodes skipped) |

## Key files

| Path | Role |
| ---- | ---- |
| `src/components/PipelineFlow.tsx` | ReactFlow canvas and dual-path edges |
| `src/hooks/usePipelineRunner.ts` | Stage advancement and path routing |
| `src/data/demo-script.ts` | Narration beats per stage |
| `src/data/change-preview-mock.ts` | Forecast Engine output (discussion path) |
| `src/data/insight-package-mock.ts` | Analysis output (decision path) |

Architecture reference: [architecture/overview/architecture.md](../architecture/overview/architecture.md)
