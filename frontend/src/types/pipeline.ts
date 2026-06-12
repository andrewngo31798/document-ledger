export type NodeStatus = 'idle' | 'processing' | 'complete' | 'error' | 'rejected' | 'skipped'

export type PipelineStage =
  | 'input'
  | 'signal-intake'
  | 'event-bus'
  | 'knowledge-processing'
  | 'classification'
  | 'forecast-engine'
  | 'analysis-engine'
  | 'review-portal'
  | 'decision-ledger'
  | 'consumer-api'

export type InputType = 'transcript' | 'confluence'

/** Routing after Knowledge Processing — decision candidates vs discussion signals */
export type PrimaryPath = 'decision' | 'discussion'

export type AnalysisProfile =
  | 'full_analysis'
  | 'standard_analysis'
  | 'lightweight_analysis'
  | 'review_first'

export type SubEngineKey = 'ledger_diff' | 'impact' | 'recommendation'

export type ForecastSubEngineKey = 'change_detector' | 'precedent_engine' | 'forward_projector'

export interface RunConfig {
  inputType: InputType
  inputLabel: string
  content: string
}

// --- Insight package (insight-package.schema.json) ---

export type LedgerChangeClassification =
  | 'first_of_kind'
  | 'extends'
  | 'amends'
  | 'supersedes'
  | 'conflicts'
  | 'reaffirms'
  | 'duplicate'
  | 'no_ledger_match'
  | 'deferred'

export type LedgerChangeDimension =
  | 'scope'
  | 'technology'
  | 'constraint'
  | 'policy'
  | 'timeline'
  | 'ownership'
  | 'status'
  | 'rationale'
  | 'other'

export interface LedgerChange {
  dimension: LedgerChangeDimension
  candidate_value: string
  ledger_value?: string
  change_type: 'added' | 'removed' | 'modified' | 'replaced' | 'unchanged'
  evidence_candidate?: string
  evidence_ledger?: string
}

export interface LedgerDiffResult {
  headline: string
  summary?: string
  change_classification: LedgerChangeClassification
  confidence: number
  primary_reference?: {
    ledger_record_id: string
    title: string
    approved_at: string
    version: number
  }
  changes: LedgerChange[]
  unchanged_aspects?: string[]
}

export interface DecisionSummary {
  text: string
  domain: string
  categories: string[]
  tags?: string[]
}

export interface AffectedSystem {
  id: string
  name: string
  impact_level: 'direct' | 'indirect' | 'transitive'
  hop_distance?: number
  evidence?: string
}

export interface PredictedOutcome {
  outcome: string
  likelihood: 'unlikely' | 'possible' | 'likely' | 'very_likely'
  time_horizon: string
  risk_type?: string
  mitigation_hint?: string
  grounded_in?: string[]
}

export interface ImpactResult {
  summary: string
  blast_radius_score: number
  affected_systems: AffectedSystem[]
  affected_teams?: { name: string; impact_type?: string; rationale?: string }[]
  risk_dimensions: {
    technical: number
    delivery: number
    people: number
  }
}

export type RecommendationType =
  | 'governance'
  | 'documentation'
  | 'review'
  | 'implementation'
  | 'communication'
  | 'rollback_plan'
  | 'ledger_action'

export interface Recommendation {
  id: string
  type: RecommendationType
  action: string
  priority: 'required' | 'recommended' | 'optional'
  rationale?: string
  owner_hint?: string
  evidence_refs?: string[]
  ledger_action?:
    | 'approve_new'
    | 'approve_amendment'
    | 'approve_supersedes'
    | 'resolve_conflict'
    | 'reject_duplicate'
    | 'no_ledger_change'
}

export interface InsightPackage {
  insight_package_id: string
  classified_decision_id: string
  tenant_id: string
  knowledge_id?: string
  decision_candidate_id?: string
  analysis_profile: AnalysisProfile
  decision_summary: DecisionSummary
  ledger_diff: LedgerDiffResult
  impact_map?: ImpactResult
  recommendations?: Recommendation[]
  provenance: {
    sub_engines_run: SubEngineKey[]
    model_versions: Record<string, string>
    duration_ms: number
    graph_queries?: number
    retrieval_queries?: number
    llm_calls?: number
  }
  quality: {
    completeness_score: number
    grounding_score: number
    review_priority?: 'low' | 'normal' | 'high' | 'urgent'
    warnings?: string[]
  }
}

// --- Stage outputs ---

export interface SignalIntakeOutput {
  job_id: string
  source_type: string
  triggered_by: string
  payload_ref: string
  timestamp: string
}

export interface KnowledgeProcessingOutput {
  knowledge_id: string
  knowledge_kind: 'decision_candidate' | 'discussion' | 'informational'
  decision_candidate_count: number
  discussion_signal: boolean
  entities_extracted: string[]
  decision_signal?: string
  routing: { primary_path: PrimaryPath }
}

export interface DetectedShift {
  shift_type: string
  description: string
  direction: 'emerging' | 'reversing' | 'stable'
  confidence: number
  evidence_span?: string
  baseline_hint?: string
}

export interface PrecedentMatch {
  ledger_record_id: string
  title: string
  relationship: string
  similarity_score: number
  approved_at?: string
  what_happened: string
  evidence_refs?: string[]
}

export interface ForwardSignals {
  summary: string
  confidence_band: 'low' | 'medium' | 'high'
  predicted_outcomes: PredictedOutcome[]
}

/** Forecast Engine (module 09) output — discussion path */
export interface ChangePreview {
  change_preview_id: string
  knowledge_id: string
  tenant_id: string
  source_type: string
  knowledge_kind: 'discussion'
  change_summary: string
  seen_before_headline: string
  detected_shifts: DetectedShift[]
  precedent_matches: PrecedentMatch[]
  forward_signals?: ForwardSignals
  provenance: {
    engines_run: ForecastSubEngineKey[]
    retrieval_queries?: number
    llm_calls?: number
    duration_ms: number
  }
  quality: {
    grounding_score: number
    novelty_score?: number
    alert_priority?: 'low' | 'normal' | 'high'
  }
}

export interface ClassificationOutput {
  classified_decision_id: string
  knowledge_id: string
  decision_candidate_id: string
  classification: {
    domain: 'business' | 'technical' | 'hybrid'
    categories: string[]
    confidence: number
    method: 'rule' | 'classifier' | 'llm' | 'hybrid'
    tags?: string[]
  }
  routing: {
    analysis_profile: AnalysisProfile
    sub_engines?: SubEngineKey[]
  }
}

export interface LedgerEntry {
  id: string
  decision_summary: string
  domain: string
  version: number
  approved_by: string
  approved_at: string
  evidence_links: string[]
}

export interface ConsumerApiOutput {
  prompt: string
  answer: string
  source_ledger_id: string
}

export interface PipelineStageResult {
  'signal-intake'?: SignalIntakeOutput
  'event-bus'?: { event_type: string; routing: string }
  'knowledge-processing'?: KnowledgeProcessingOutput
  classification?: ClassificationOutput
  'forecast-engine'?: ChangePreview
  'analysis-engine'?: InsightPackage
  'review-portal'?: { approved: boolean; rationale: string; reviewer: string }
  'decision-ledger'?: LedgerEntry
  'consumer-api'?: ConsumerApiOutput
}
