import type { ArchitectureDiagramDef } from '../architecture/types'
import { buildDualPathDiagram } from '../architecture/diagrams/dualPath'
import { buildSystemContextDiagram } from '../architecture/diagrams/systemContext'
import { buildContainersDiagram } from '../architecture/diagrams/containers'
import { buildSignalIntakeDiagram } from '../architecture/diagrams/signalIntake'
import { buildQueueEventBusDiagram } from '../architecture/diagrams/queueEventBus'
import { buildKnowledgeProcessingDiagram } from '../architecture/diagrams/knowledgeProcessing'
import { buildClassificationDiagram } from '../architecture/diagrams/classification'
import { buildAnalysisDagDiagram } from '../architecture/diagrams/analysisDag'
import { buildReviewPortalDiagram } from '../architecture/diagrams/reviewPortal'
import { buildDecisionLedgerDiagram } from '../architecture/diagrams/decisionLedger'
import { buildConsumerApiDiagram } from '../architecture/diagrams/consumerApi'
import { buildForecastPipelineDiagram } from '../architecture/diagrams/forecastPipeline'

export type ArchitectureDiagram = ArchitectureDiagramDef

export const ARCHITECTURE_DIAGRAMS: ArchitectureDiagramDef[] = [
  {
    id: 'dual-path',
    title: 'Overview',
    subtitle: 'External sources enter through intake; the decision path (classification → analysis → review → ledger) forks from the discussion path (forecast) after Knowledge Processing; Consumer API serves downstream AI systems.',
    group: 'Overview',
    build: buildDualPathDiagram,
  },
  {
    id: 'system-context',
    title: 'System context',
    subtitle: 'C4 Level 1 — external sources feed Document Ledger; verified decisions and change previews reach AI consumers.',
    group: 'C4 model',
    build: buildSystemContextDiagram,
  },
  {
    id: 'containers',
    title: 'Containers & stores',
    subtitle: 'C4 Level 2 — deployable services, async event flow, and data stores inside the Document Ledger boundary.',
    group: 'C4 model',
    build: buildContainersDiagram,
  },
  {
    id: 'module-01',
    title: 'Signal Intake Engine',
    subtitle: 'Module 01 — validate triggers, enforce idempotency, create jobs, and publish source.triggered to the queue.',
    group: 'Module 01',
    build: buildSignalIntakeDiagram,
  },
  {
    id: 'module-02',
    title: 'Queue / Event Bus',
    subtitle: 'Module 02 — async routing between pipeline stages with retry, DLQ, and observability.',
    group: 'Module 02',
    build: buildQueueEventBusDiagram,
  },
  {
    id: 'module-03',
    title: 'Knowledge Processing',
    subtitle: 'Module 03 — fetch, normalize, extract entities, detect decisions vs discussions, and set routing.primary_path.',
    group: 'Module 03',
    build: buildKnowledgeProcessingDiagram,
  },
  {
    id: 'module-04',
    title: 'Classification Engine',
    subtitle: 'Module 04 — taxonomy labeling via rules, classifiers, and LLM fallback; emits decision.classified.',
    group: 'Module 04',
    build: buildClassificationDiagram,
  },
  {
    id: 'module-05',
    title: 'Analysis Engine — internal architecture',
    subtitle: 'Module 05 full detail: Ledger Diff (5 stages) and Impact (3 stages) run in parallel; Recommendation (rules + LLM) follows; Aggregator merges into insight.ready for Review Portal.',
    group: 'Module 05',
    build: buildAnalysisDagDiagram,
  },
  {
    id: 'module-06',
    title: 'Review & Approval Portal',
    subtitle: 'Module 06 — human validation boundary: inspect, edit, approve, reject, or request re-analysis.',
    group: 'Module 06',
    build: buildReviewPortalDiagram,
  },
  {
    id: 'module-07',
    title: 'Decision Ledger',
    subtitle: 'Module 07 — append-only store of approved decisions with versioning, evidence links, and search indexing.',
    group: 'Module 07',
    build: buildDecisionLedgerDiagram,
  },
  {
    id: 'module-08',
    title: 'Consumer API',
    subtitle: 'Module 08 — authoritative ledger answers plus advisory change previews and precedent Q&A for AI systems.',
    group: 'Module 08',
    build: buildConsumerApiDiagram,
  },
  {
    id: 'module-09',
    title: 'Forecast Engine',
    subtitle: 'Module 09 — discussion-path change detection, precedent retrieval, and advisory change.preview.ready.',
    group: 'Module 09',
    build: buildForecastPipelineDiagram,
  },
]

export const ARCHITECTURE_GROUPS = [...new Set(ARCHITECTURE_DIAGRAMS.map((d) => d.group))]

export function moduleAccent(group: string): string {
  if (group === 'Overview' || group === 'C4 model') return 'var(--accent-intake)'
  if (group.startsWith('Module 0') && ['Module 01', 'Module 02', 'Module 03', 'Module 04'].includes(group)) {
    return 'var(--accent-intake)'
  }
  if (['Module 05', 'Module 06'].includes(group)) return 'var(--accent-processing)'
  return 'var(--accent-output)'
}
