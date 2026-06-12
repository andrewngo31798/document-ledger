export type NodeStatus = 'idle' | 'processing' | 'complete' | 'error' | 'rejected'

export type PipelineStage =
  | 'input'
  | 'signal-intake'
  | 'event-bus'
  | 'knowledge-processing'
  | 'classification'
  | 'analysis-engine'
  | 'review-portal'
  | 'decision-ledger'
  | 'consumer-api'

export type InputType = 'transcript' | 'confluence'

export type AnalysisProfile =
  | 'full_analysis'
  | 'standard_analysis'
  | 'lightweight_analysis'
  | 'review_first'

export type SubEngineKey = 'ledger_diff' | 'impact' | 'forecast' | 'recommendation'

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

export interface PredictedOutcome {
  outcome: string
  likelihood: 'unlikely' | 'possible' | 'likely' | 'very_likely'
  time_horizon: string
  risk_type?: string
  mitigation_hint?: string
  grounded_in?: string[]
}

export interface ForecastResult {
  summary: string
  confidence_band: 'low' | 'medium' | 'high'
  predicted_outcomes: PredictedOutcome[]
  rollback_considerations?: string
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
  forecast_report?: ForecastResult
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
  decision_candidate_count: number
  entities_extracted: string[]
  decision_signal: string
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

export interface PipelineStageResult {
  'signal-intake'?: SignalIntakeOutput
  'event-bus'?: { event_type: string; routing: string }
  'knowledge-processing'?: KnowledgeProcessingOutput
  classification?: ClassificationOutput
  'analysis-engine'?: InsightPackage
  'review-portal'?: { approved: boolean; rationale: string; reviewer: string }
  'decision-ledger'?: LedgerEntry
  'consumer-api'?: { query: string; answer: string; source_ledger_id: string }
}
