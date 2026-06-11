import type { InsightPackage } from '../types/pipeline'

export const insightPackageMock: InsightPackage = {
  insight_package_id: 'ins_20241115_001',
  classified_decision_id: 'cls_20241115_001',
  decision_summary:
    'Choose PostgreSQL over DynamoDB as the primary data store for the Decision Ledger module.',
  domain: 'technical',
  ledger_diff: {
    change_classification: 'first_of_kind',
    confidence: 0.94,
    headline: 'No prior database decision exists for this service — this is the first record.',
    field_changes: [
      { field: 'storage_engine', from: 'undecided', to: 'PostgreSQL (Amazon RDS)' },
      { field: 'query_model', from: 'undecided', to: 'relational (SQL + JSONB)' },
      { field: 'deployment', from: 'undecided', to: 'managed (Amazon RDS)' },
    ],
    primary_reference_id: undefined,
  },
  impact_map: {
    summary:
      'Affects the Decision Ledger data layer and all services that query approved decisions.',
    blast_radius_score: 0.62,
    affected_systems: [
      { name: 'Decision Ledger', type: 'service' },
      { name: 'Consumer API', type: 'service' },
      { name: 'Review Portal', type: 'service' },
      { name: 'Infrastructure / RDS', type: 'infrastructure' },
    ],
    risk_dimensions: {
      technical: 'medium',
      delivery: 'low',
      compliance: 'low',
    },
  },
  forecast_report: {
    summary:
      'Low operational risk given existing Postgres expertise. Scale ceiling expected beyond 18 months.',
    confidence_band: 'high',
    predicted_outcomes: [
      {
        description: 'Relational audit queries perform within SLA at projected volume.',
        probability: 'high',
      },
      {
        description: 'Partitioning required if ledger volume exceeds 18-month projections.',
        probability: 'medium',
      },
    ],
    risk_warning: undefined,
  },
  recommendations: [
    {
      action_type: 'document',
      description: 'Capture rationale and load-test results in the Decision Ledger as an approved record.',
      priority: 'high',
    },
    {
      action_type: 'assign',
      description: 'Assign Marcus Chen as the owner responsible for Postgres schema management.',
      priority: 'medium',
    },
    {
      action_type: 'flag',
      description: 'Set a 12-month review checkpoint to assess ledger volume against scale ceiling.',
      priority: 'low',
    },
  ],
}
