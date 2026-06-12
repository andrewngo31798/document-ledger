import type { ChangePreview } from '../types/pipeline'

/** Mock output for Forecast Engine (module 09) — discussion / Confluence path */
export const changePreviewMock: ChangePreview = {
  change_preview_id: 'f1e2d3c4-b5a6-7890-fedc-ba9876543210',
  knowledge_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
  tenant_id: 'tenant-demo',
  source_type: 'confluence',
  knowledge_kind: 'discussion',
  change_summary:
    'Design thread is shifting toward PostgreSQL for ledger storage — position language detected, no closed decision yet.',
  seen_before_headline:
    'Yes — ADR-007 (2024-03) approved Postgres for audit storage under similar scale assumptions.',
  detected_shifts: [
    {
      shift_type: 'technology',
      description: 'PostgreSQL favored over DynamoDB for ledger persistence',
      direction: 'emerging',
      confidence: 0.88,
      evidence_span: '…we should probably standardize on Postgres for the ledger…',
      baseline_hint: 'Prior Confluence page mentioned DynamoDB evaluation only',
    },
    {
      shift_type: 'timeline',
      description: 'Target adoption mentioned for next quarter',
      direction: 'emerging',
      confidence: 0.72,
      evidence_span: '…aiming to have this in place by Q3…',
    },
  ],
  precedent_matches: [
    {
      ledger_record_id: 'ledger-adr-007',
      title: 'ADR-007: PostgreSQL for audit log storage',
      relationship: 'related_adr',
      similarity_score: 0.91,
      approved_at: '2024-03-12T10:00:00Z',
      what_happened:
        'Team adopted Postgres; rollout completed in 6 weeks with no SLA breach in first year.',
      evidence_refs: ['ledger:ledger-adr-007', 'entity:PostgreSQL'],
    },
    {
      ledger_record_id: 'ledger-adr-004',
      title: 'ADR-004: Decision Ledger module boundaries',
      relationship: 'same_scope',
      similarity_score: 0.74,
      approved_at: '2024-01-08T14:30:00Z',
      what_happened: 'Established Decision Ledger as system of record for approved decisions.',
      evidence_refs: ['ledger:ledger-adr-004'],
    },
  ],
  forward_signals: {
    summary: 'Low integration risk if aligned with ADR-007 patterns; watch partition planning at 18-month volume.',
    confidence_band: 'high',
    predicted_outcomes: [
      {
        outcome: 'Reuse of existing Postgres operational playbooks',
        likelihood: 'very_likely',
        time_horizon: '0–6 months',
        grounded_in: ['precedent:ledger-adr-007'],
      },
    ],
  },
  provenance: {
    engines_run: ['change_detector', 'precedent_engine', 'forward_projector'],
    retrieval_queries: 8,
    llm_calls: 2,
    duration_ms: 3200,
  },
  quality: {
    grounding_score: 0.93,
    novelty_score: 0.41,
    alert_priority: 'normal',
  },
}
