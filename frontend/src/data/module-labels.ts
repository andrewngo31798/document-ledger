import type { PipelineStage } from '../types/pipeline'

/** Architecture short labels (diagrams) — see architecture/overview/architecture.md */
export const STAGE_LABEL: Record<PipelineStage, string> = {
  input: 'Input',
  'signal-intake': 'Signal Intake',
  'event-bus': 'Queue',
  'knowledge-processing': 'Knowledge Processing',
  classification: 'Classification',
  'forecast-engine': 'Forecast',
  'analysis-engine': 'Analysis',
  'review-portal': 'Review Portal',
  'decision-ledger': 'Decision Ledger',
  'consumer-api': 'Consumer API',
}

/** Canonical module names for detail views and tooltips */
export const STAGE_CANONICAL: Partial<Record<PipelineStage, string>> = {
  'signal-intake': 'Signal Intake Engine',
  'event-bus': 'Queue / Event Bus',
  'knowledge-processing': 'Knowledge Processing Engine',
  classification: 'Classification Engine',
  'forecast-engine': 'Forecast Engine',
  'analysis-engine': 'Analysis Engine',
  'review-portal': 'Review & Approval Portal',
}
