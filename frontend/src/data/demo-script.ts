import type { PipelineStage, NodeStatus, PrimaryPath } from '../types/pipeline'
import type { SubEngineStatus } from '../store/pipeline.store'

export type DemoBeatTarget =
  | { stage: PipelineStage }
  | { stage: 'analysis-engine'; subEngine: keyof SubEngineStatus }

export interface DemoBeat {
  id: string
  target: DemoBeatTarget
  title: string
  script: string
  technique?: string
  screenCue?: string
  pauseMs?: number
  /** When set, beat only applies to this pipeline path */
  path?: PrimaryPath
}

export const DEMO_SCRIPT: DemoBeat[] = [
  {
    id: 'input',
    target: { stage: 'input' },
    title: 'Choose a source',
    script:
      'Decisions start in meetings; discussions start in Confluence threads. Meeting transcript → decision path. Confluence page → discussion path with Forecast Engine.',
    screenCue: 'Transcript = decision · Confluence = discussion',
  },
  {
    id: 'signal-intake',
    target: { stage: 'signal-intake' },
    title: 'Signal Intake',
    script:
      'The front door. A signal arrives, gets validated, and becomes a processing job — no one had to remember to kick off a workflow.',
    technique: 'Trigger validation, idempotency, job creation, audit logging.',
    screenCue: 'Signal Intake node processing → Done',
  },
  {
    id: 'event-bus',
    target: { stage: 'event-bus' },
    title: 'Queue',
    script:
      'The async queue. Signal Intake publishes source.triggered — each stage hands off without blocking the next.',
    technique: 'Queue / Event Bus with at-least-once delivery; topic routing to knowledge-processing-queue.',
    screenCue: 'Queue node; edge label source.triggered',
  },
  {
    id: 'knowledge-processing',
    target: { stage: 'knowledge-processing' },
    title: 'Knowledge Processing',
    script:
      'Raw text becomes structured knowledge. For transcripts we detect decision candidates; for Confluence threads we detect discussion signals and route to Forecast.',
    technique: 'Normalize → chunk → entity extraction → decision-candidate OR discussion-signal detection → routing.primary_path.',
    screenCue: 'Detail panel: knowledge_kind, routing.primary_path',
    pauseMs: 1200,
  },
  {
    id: 'classification',
    target: { stage: 'classification' },
    title: 'Classification',
    path: 'decision',
    script:
      'Technical decision, ninety-one percent confidence — routed to full_analysis with ledger diff, impact, and recommendation.',
    technique: 'Classification Engine: tiered classifiers + confidence calibration + routing.sub_engines.',
    screenCue: 'Detail panel: classification.domain, routing.analysis_profile',
  },
  {
    id: 'analysis-intro',
    target: { stage: 'analysis-engine' },
    title: 'Analysis',
    path: 'decision',
    script:
      'The trust layer for decisions. Three sub-engines compare against the Decision Ledger, map blast radius, and recommend next steps.',
    screenCue: 'Analysis sub-DAG grid (3 engines)',
    pauseMs: 1500,
  },
  {
    id: 'ledger-diff',
    target: { stage: 'analysis-engine', subEngine: 'ledger-diff' },
    title: 'Ledger Diff',
    path: 'decision',
    script:
      "First question: what's new vs what we've already approved? No prior database decision — first of kind.",
    technique: 'Ledger Diff Engine: hybrid retrieval against Decision Ledger, structured changes[].',
    screenCue: 'Top-left sub-node; detail panel ledger_diff',
    pauseMs: 2000,
  },
  {
    id: 'impact',
    target: { stage: 'analysis-engine', subEngine: 'impact' },
    title: 'Impact',
    path: 'decision',
    script:
      'Blast radius: Decision Ledger, Consumer API, Review Portal, and RDS infrastructure — moderate technical risk.',
    technique: 'Knowledge graph traversal; blast_radius_score + risk dimension scores.',
    screenCue: 'Top-right sub-node; detail panel impact map',
    pauseMs: 2000,
  },
  {
    id: 'recommendation',
    target: { stage: 'analysis-engine', subEngine: 'recommendation' },
    title: 'Recommendation',
    path: 'decision',
    script:
      'Governance steps: document the rationale (required), assign schema owner (recommended), schedule scale review (optional).',
    technique: 'Recommendation Engine: governance rules + grounded LLM synthesis.',
    screenCue: 'Bottom sub-node; detail panel recommendations',
    pauseMs: 1500,
  },
  {
    id: 'aggregator',
    target: { stage: 'analysis-engine', subEngine: 'aggregator' },
    title: 'Insight package ready',
    path: 'decision',
    script:
      'All outputs merge into one review-ready package — schema-validated, scored for grounding, published as insight.ready.',
    technique: 'Insight Aggregator + Quality Scorer.',
    screenCue: 'Analysis node Done; edge insight.ready',
  },
  {
    id: 'forecast-intro',
    target: { stage: 'forecast-engine' },
    title: 'Forecast Engine',
    path: 'discussion',
    script:
      'No decision candidate — but the thread is shifting toward PostgreSQL. Forecast captures the change, matches ADR-007 precedent, and publishes an advisory change preview.',
    technique: 'Change detection + precedent retrieval + optional forward signals — internal engines not shown in demo UI.',
    screenCue: 'Forecast node processing; detail panel change_preview; decision-path nodes skipped',
    pauseMs: 2000,
  },
  {
    id: 'forecast-complete',
    target: { stage: 'forecast-engine' },
    title: 'Change preview ready',
    path: 'discussion',
    script:
      'Change preview published as change.preview.ready — advisory context, not approved organizational truth.',
    screenCue: 'Forecast node Done; edge change.preview.ready',
  },
  {
    id: 'review-portal',
    target: { stage: 'review-portal' },
    title: 'Review Portal',
    path: 'decision',
    script:
      'Automation stops at the trust boundary. A human sees the full analysis and decides — approve or reject.',
    screenCue: 'Dashed border; Approve / Reject buttons',
    pauseMs: 0,
  },
  {
    id: 'decision-ledger',
    target: { stage: 'decision-ledger' },
    title: 'Decision Ledger',
    path: 'decision',
    script:
      'Approved. Versioned, timestamped, evidence-linked — Postgres over DynamoDB, backed by ADR, spike, and transcript.',
    screenCue: 'Output layer; detail panel evidence_links',
  },
  {
    id: 'consumer-api',
    target: { stage: 'consumer-api' },
    title: 'Consumer API',
    script:
      'Downstream systems get trusted answers from the ledger (decision path) or advisory change previews with precedent Q&A (discussion path).',
    technique: 'RAG over approved ledger; /changes/seen-before for discussion path.',
    screenCue: 'Detail panel: prompt + synthesized answer',
    pauseMs: 2000,
  },
]

export interface DemoNarrationState {
  view: 'input' | 'pipeline'
  primaryPath: PrimaryPath
  activeStage: PipelineStage | null
  nodeStatus: Record<PipelineStage, NodeStatus>
  subEngineStatus: SubEngineStatus
  reviewDecision: 'pending' | 'approved' | 'rejected'
}

function beatById(id: string, path: PrimaryPath): DemoBeat | null {
  const beat = DEMO_SCRIPT.find((b) => b.id === id)
  if (!beat) return null
  if (beat.path && beat.path !== path) return null
  return beat
}

function beatForStage(stage: PipelineStage, path: PrimaryPath): DemoBeat | null {
  return (
    DEMO_SCRIPT.find(
      (b) =>
        'stage' in b.target &&
        b.target.stage === stage &&
        !('subEngine' in b.target) &&
        (!b.path || b.path === path),
    ) ?? null
  )
}

export function resolveDemoBeat(state: DemoNarrationState): DemoBeat | null {
  const { view, primaryPath, activeStage, nodeStatus, subEngineStatus, reviewDecision } = state

  if (view === 'input') return beatById('input', primaryPath) ?? DEMO_SCRIPT[0]

  if (nodeStatus['consumer-api'] === 'complete') return beatById('consumer-api', primaryPath)

  if (reviewDecision === 'rejected') return beatById('review-portal', primaryPath)

  if (!activeStage) return null

  if (activeStage === 'forecast-engine') {
    const feStatus = nodeStatus['forecast-engine']
    if (feStatus === 'complete') return beatById('forecast-complete', primaryPath)
    return beatById('forecast-intro', primaryPath)
  }

  if (activeStage === 'analysis-engine') {
    const aeStatus = nodeStatus['analysis-engine']
    if (aeStatus === 'idle') return beatById('analysis-intro', primaryPath)
    if (aeStatus === 'processing') {
      if (subEngineStatus.aggregator === 'processing') return beatById('aggregator', primaryPath)
      if (subEngineStatus.recommendation === 'processing') return beatById('recommendation', primaryPath)
      if (subEngineStatus['ledger-diff'] === 'processing') return beatById('ledger-diff', primaryPath)
      if (subEngineStatus.impact === 'processing') return beatById('impact', primaryPath)
      return beatById('analysis-intro', primaryPath)
    }
    if (aeStatus === 'complete') return beatById('aggregator', primaryPath)
  }

  return beatForStage(activeStage, primaryPath)
}
