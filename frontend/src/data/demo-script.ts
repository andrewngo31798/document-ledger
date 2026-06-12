import type { PipelineStage, NodeStatus } from '../types/pipeline'
import type { SubEngineStatus } from '../store/pipeline.store'

export type DemoBeatTarget =
  | { stage: PipelineStage }
  | { stage: 'analysis-engine'; subEngine: keyof SubEngineStatus }

export interface DemoBeat {
  /** Unique id for narration UI */
  id: string
  target: DemoBeatTarget
  /** Short label shown in a caption bar */
  title: string
  /** Primary presenter line — plain language */
  script: string
  /** Optional deeper explanation for technical audiences */
  technique?: string
  /** What to point at on screen */
  screenCue?: string
  /** Suggested pause before advancing (ms). Omit to use default demo timing. */
  pauseMs?: number
}

/**
 * Ordered narration beats aligned with frontend pipeline components.
 * Use with usePipelineRunner timing or a future DemoNarrationPanel.
 */
export const DEMO_SCRIPT: DemoBeat[] = [
  {
    id: 'input',
    target: { stage: 'input' },
    title: 'Choose a source',
    script:
      'Decisions start in meetings, Confluence updates, closed tickets — not in documentation tools. We begin with a real architecture review: PostgreSQL vs DynamoDB.',
    screenCue: 'Meeting transcript card selected',
  },
  {
    id: 'signal-intake',
    target: { stage: 'signal-intake' },
    title: 'Signal Intake',
    script:
      'The front door. A transcript arrives, gets validated, and becomes a processing job — no one had to remember to kick off a workflow.',
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
      'Raw text becomes structured knowledge: people, systems, and a detected decision — the team chose Postgres.',
    technique: 'Normalize → chunk → entity extraction → decision-candidate detection.',
    screenCue: 'Detail panel: decision_candidate_count, decision_signal',
    pauseMs: 1200,
  },
  {
    id: 'classification',
    target: { stage: 'classification' },
    title: 'Classification',
    script:
      'Technical decision, ninety-one percent confidence — routed to full_analysis with all four sub-engines enabled.',
    technique: 'Classification Engine: tiered classifiers + confidence calibration + routing.sub_engines.',
    screenCue: 'Detail panel: classification.domain, routing.analysis_profile',
  },
  {
    id: 'analysis-intro',
    target: { stage: 'analysis-engine' },
    title: 'Analysis',
    script:
      'The trust layer. Four sub-engines compare against the Decision Ledger, map blast radius, forecast outcomes, and recommend next steps.',
    screenCue: 'Analysis sub-DAG grid',
    pauseMs: 1500,
  },
  {
    id: 'ledger-diff',
    target: { stage: 'analysis-engine', subEngine: 'ledger-diff' },
    title: 'Ledger Diff',
    script:
      "First question: what's new vs what we've already approved? No prior database decision — first of kind. Technology dimension changes: PostgreSQL, relational SQL + JSONB, managed RDS.",
    technique:
      'Ledger Diff Engine: hybrid retrieval against Decision Ledger, structured changes[] with dimension + change_type, change classification.',
    screenCue: 'Top-left sub-node; detail panel ledger_diff section',
    pauseMs: 2000,
  },
  {
    id: 'impact',
    target: { stage: 'analysis-engine', subEngine: 'impact' },
    title: 'Impact',
    script:
      'Blast radius: Decision Ledger, Consumer API, Review & Approval Portal, and RDS infrastructure. Sixty-two percent reach — moderate technical risk, low delivery and people impact.',
    technique:
      'Knowledge graph traversal (2–3 hops) along depends_on and owned_by edges; blast_radius_score + risk dimension scores (0–1).',
    screenCue: 'Top-right sub-node; detail panel impact_map',
    pauseMs: 2000,
  },
  {
    id: 'forecast',
    target: { stage: 'analysis-engine', subEngine: 'forecast' },
    title: 'Forecast',
    script:
      'Looking forward: audit queries likely stay within SLA. Medium chance partitioning is needed after eighteen months — grounded in impact and precedent patterns, not guesswork.',
    technique:
      'Precedent-grounded outcome prediction; confidence_band; ungrounded claims dropped.',
    screenCue: 'Bottom-left sub-node; detail panel forecast_report',
    pauseMs: 1800,
  },
  {
    id: 'recommendation',
    target: { stage: 'analysis-engine', subEngine: 'recommendation' },
    title: 'Recommendation',
    script:
      'Three governance steps: document the rationale (required), assign Marcus as schema owner (recommended), flag a twelve-month scale review (optional).',
    technique: 'Recommendation Engine: governance rules + grounded LLM synthesis; types documentation, implementation, governance.',
    screenCue: 'Bottom-right sub-node; detail panel recommendations',
    pauseMs: 1500,
  },
  {
    id: 'aggregator',
    target: { stage: 'analysis-engine', subEngine: 'aggregator' },
    title: 'Insight package ready',
    script:
      'All outputs merge into one review-ready package — schema-validated, scored for grounding, published as insight.ready.',
    technique: 'Insight Aggregator + Quality Scorer; completeness and grounding scores drive review priority.',
    screenCue: 'Analysis node Done; edge insight.ready',
  },
  {
    id: 'review-portal',
    target: { stage: 'review-portal' },
    title: 'Review Portal',
    script:
      'Automation stops at the trust boundary. A human sees the full analysis and decides — approve or reject.',
    screenCue: 'Dashed border; Approve / Reject buttons',
    pauseMs: 0, // waits for user interaction
  },
  {
    id: 'decision-ledger',
    target: { stage: 'decision-ledger' },
    title: 'Decision Ledger',
    script:
      'Approved. Versioned, timestamped, evidence-linked — Postgres over DynamoDB, backed by the ADR, Jira spike, and meeting transcript.',
    screenCue: 'Output layer; detail panel evidence_links',
  },
  {
    id: 'consumer-api',
    target: { stage: 'consumer-api' },
    title: 'Consumer API',
    script:
      'Has our team verified this decision? The API returns the approved ledger record — approver, date, evidence links, and source ID. Not search. Not a generated summary.',
    technique: 'RAG constrained to approved ledger entries; source_ledger_id citation.',
    screenCue: 'Detail panel: query + grounded answer',
    pauseMs: 2000,
  },
]

export interface DemoNarrationState {
  view: 'input' | 'pipeline'
  activeStage: PipelineStage | null
  nodeStatus: Record<PipelineStage, NodeStatus>
  subEngineStatus: SubEngineStatus
  reviewDecision: 'pending' | 'approved' | 'rejected'
}

function beatById(id: string): DemoBeat | null {
  return DEMO_SCRIPT.find((b) => b.id === id) ?? null
}

function beatForStage(stage: PipelineStage): DemoBeat | null {
  return (
    DEMO_SCRIPT.find(
      (b) => 'stage' in b.target && b.target.stage === stage && !('subEngine' in b.target),
    ) ?? null
  )
}

/** Resolve the narration beat that matches current pipeline state. */
export function resolveDemoBeat(state: DemoNarrationState): DemoBeat | null {
  const { view, activeStage, nodeStatus, subEngineStatus, reviewDecision } = state

  if (view === 'input') return beatById('input')

  if (nodeStatus['consumer-api'] === 'complete') return beatById('consumer-api')

  if (reviewDecision === 'rejected') return beatById('review-portal')

  if (!activeStage) return null

  if (activeStage === 'analysis-engine') {
    const aeStatus = nodeStatus['analysis-engine']

    if (aeStatus === 'idle') return beatById('analysis-intro')

    if (aeStatus === 'processing') {
      if (subEngineStatus.aggregator === 'processing') return beatById('aggregator')
      if (subEngineStatus.recommendation === 'processing') return beatById('recommendation')
      if (subEngineStatus.forecast === 'processing') return beatById('forecast')
      if (subEngineStatus.impact === 'processing' && subEngineStatus['ledger-diff'] === 'complete') {
        return beatById('impact')
      }
      if (subEngineStatus['ledger-diff'] === 'processing') return beatById('ledger-diff')
      if (subEngineStatus.impact === 'processing') return beatById('impact')
      return beatById('analysis-intro')
    }

    if (aeStatus === 'complete') return beatById('aggregator')
  }

  return beatForStage(activeStage)
}
