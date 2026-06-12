import type { InsightPackage } from '../types/pipeline'

export const insightPackageMock: InsightPackage = {
  insight_package_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  classified_decision_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  tenant_id: 'tenant-demo',
  knowledge_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
  decision_candidate_id: 'd4e5f6a7-b8c9-0123-def0-234567890123',
  analysis_profile: 'full_analysis',
  decision_summary: {
    text: 'Choose PostgreSQL over DynamoDB as the primary data store for the Decision Ledger module.',
    domain: 'technical',
    categories: ['data_storage', 'architecture'],
    tags: ['database', 'decision-ledger'],
  },
  ledger_diff: {
    change_classification: 'first_of_kind',
    confidence: 0.94,
    headline: 'No prior database decision exists for this service — this is the first record.',
    summary:
      'The candidate selects PostgreSQL (RDS) with a relational query model. No approved ledger baseline exists for storage engine choice on the Decision Ledger module.',
    changes: [
      {
        dimension: 'technology',
        candidate_value: 'PostgreSQL (Amazon RDS)',
        change_type: 'added',
        evidence_candidate: 'Meeting transcript 2024-11-14',
      },
      {
        dimension: 'technology',
        candidate_value: 'relational (SQL + JSONB)',
        change_type: 'added',
      },
      {
        dimension: 'technology',
        candidate_value: 'managed (Amazon RDS)',
        change_type: 'added',
      },
    ],
  },
  impact_map: {
    summary:
      'Affects the Decision Ledger data layer and all services that query approved decisions.',
    blast_radius_score: 0.62,
    affected_systems: [
      {
        id: 'svc-decision-ledger',
        name: 'Decision Ledger',
        impact_level: 'direct',
        hop_distance: 0,
        evidence: 'Primary service adopting the storage engine',
      },
      {
        id: 'svc-consumer-api',
        name: 'Consumer API',
        impact_level: 'indirect',
        hop_distance: 1,
        evidence: 'Reads approved records from Decision Ledger',
      },
      {
        id: 'svc-review-portal',
        name: 'Review & Approval Portal',
        impact_level: 'indirect',
        hop_distance: 1,
      },
      {
        id: 'infra-rds',
        name: 'Infrastructure / RDS',
        impact_level: 'direct',
        hop_distance: 0,
      },
    ],
    risk_dimensions: {
      technical: 0.55,
      delivery: 0.25,
      people: 0.2,
    },
  },
  forecast_report: {
    summary:
      'Low operational risk given existing Postgres expertise. Scale ceiling expected beyond 18 months.',
    confidence_band: 'high',
    predicted_outcomes: [
      {
        outcome: 'Relational audit queries perform within SLA at projected volume.',
        likelihood: 'very_likely',
        time_horizon: '0–18 months',
        grounded_in: ['impact_map.affected_systems', 'classification.categories'],
      },
      {
        outcome: 'Partitioning required if ledger volume exceeds 18-month projections.',
        likelihood: 'possible',
        time_horizon: '18+ months',
        mitigation_hint: 'Schedule scale review at 12 months',
      },
    ],
  },
  recommendations: [
    {
      id: 'rec-001',
      type: 'documentation',
      action: 'Capture rationale and load-test results in the Decision Ledger as an approved record.',
      priority: 'required',
      rationale: 'First-of-kind decision establishes the baseline for future ledger diffs.',
      ledger_action: 'approve_new',
    },
    {
      id: 'rec-002',
      type: 'implementation',
      action: 'Assign Marcus Chen as the owner responsible for Postgres schema management.',
      priority: 'recommended',
      owner_hint: 'Marcus Chen',
    },
    {
      id: 'rec-003',
      type: 'governance',
      action: 'Set a 12-month review checkpoint to assess ledger volume against scale ceiling.',
      priority: 'optional',
    },
  ],
  provenance: {
    sub_engines_run: ['ledger_diff', 'impact', 'forecast', 'recommendation'],
    model_versions: { forecast: 'gpt-4.1-mini', recommendation: 'gpt-4.1-mini' },
    duration_ms: 4800,
    graph_queries: 12,
    retrieval_queries: 3,
    llm_calls: 2,
  },
  quality: {
    completeness_score: 0.96,
    grounding_score: 0.91,
    review_priority: 'normal',
  },
}
