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

export interface RunConfig {
  inputType: InputType
  inputLabel: string
  content: string
}

// Aligned with insight-package.schema.json
export interface FieldDiff {
  field: string
  from: string
  to: string
}

export interface LedgerDiffResult {
  change_classification:
    | 'first_of_kind'
    | 'extends'
    | 'amends'
    | 'supersedes'
    | 'conflicts'
    | 'reaffirms'
    | 'duplicate'
    | 'no_ledger_match'
  confidence: number
  headline: string
  field_changes: FieldDiff[]
  primary_reference_id?: string
}

export interface AffectedSystem {
  name: string
  type: string
}

export interface ImpactResult {
  summary: string
  blast_radius_score: number
  affected_systems: AffectedSystem[]
  risk_dimensions: {
    technical: 'low' | 'medium' | 'high'
    delivery: 'low' | 'medium' | 'high'
    compliance: 'low' | 'medium' | 'high'
  }
}

export interface PredictedOutcome {
  description: string
  probability: 'low' | 'medium' | 'high'
}

export interface ForecastResult {
  summary: string
  confidence_band: 'low' | 'medium' | 'high'
  predicted_outcomes: PredictedOutcome[]
  risk_warning?: string
}

export type RecommendationActionType =
  | 'escalate'
  | 'document'
  | 'assign'
  | 'flag'

export interface Recommendation {
  action_type: RecommendationActionType
  description: string
  priority: 'low' | 'medium' | 'high'
}

export interface InsightPackage {
  insight_package_id: string
  classified_decision_id: string
  decision_summary: string
  domain: string
  ledger_diff: LedgerDiffResult
  impact_map: ImpactResult
  forecast_report: ForecastResult
  recommendations: Recommendation[]
}

export interface SignalIntakeOutput {
  job_id: string
  source_type: string
  triggered_by: string
  payload_ref: string
  timestamp: string
}

export interface KnowledgeProcessingOutput {
  knowledge_id: string
  decision_candidates: number
  entities_extracted: string[]
  decision_signal: string
}

export interface ClassificationOutput {
  classified_decision_id: string
  domain: string
  categories: string[]
  confidence: number
  analysis_profile: string
}

export interface LedgerEntry {
  ledger_id: string
  decision_summary: string
  domain: string
  version: number
  approved_by: string
  approved_at: string
  evidence_links: string[]
}

export interface PipelineStageResult {
  'signal-intake'?: SignalIntakeOutput
  'event-bus'?: { message: string; routing: string }
  'knowledge-processing'?: KnowledgeProcessingOutput
  classification?: ClassificationOutput
  'analysis-engine'?: InsightPackage
  'review-portal'?: { approved: boolean; rationale: string; reviewer: string }
  'decision-ledger'?: LedgerEntry
  'consumer-api'?: { query: string; answer: string; source_ledger_id: string }
}
