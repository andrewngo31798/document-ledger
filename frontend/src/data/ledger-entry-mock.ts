import type { LedgerEntry } from '../types/pipeline'

export const ledgerEntryMock: LedgerEntry = {
  id: 'ldg_20241115_001',
  decision_summary:
    'Choose PostgreSQL over DynamoDB as the primary data store for the Decision Ledger module.',
  domain: 'technical',
  version: 1,
  approved_by: 'Sarah Okonkwo',
  approved_at: '2024-11-15T11:05:00Z',
  evidence_links: [
    'confluence://ADR-007',
    'jira://KL-142 (spike)',
    'meeting://2024-11-14-arch-review',
  ],
}
