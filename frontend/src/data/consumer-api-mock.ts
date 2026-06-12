import type { ConsumerApiOutput } from '../types/pipeline'
import { ledgerEntryMock } from './ledger-entry-mock'

export const consumerApiMock: ConsumerApiOutput = {
  prompt:
    'Has our team officially verified the database decision — who approved it and what evidence backs it?',
  answer: `Yes — the database decision is officially verified on 15 Nov 2024 (${ledgerEntryMock.id}, version 1), backed by ADR-007, the KL-142 spike, and the 14 Nov architecture review.

Technically, the team chose PostgreSQL on RDS for relational audit queries and JSONB insight payloads — aligned with the approved platform standard to reuse existing Postgres operations rather than add DynamoDB.

From a business standpoint, this supports the Document Ledger pilot for Platform architecture decisions and satisfies the governance rule that architecture choices must be ADR-documented before implementation.`,
  source_ledger_id: ledgerEntryMock.id,
}

/** Discussion path — precedent Q&A from change preview (advisory, not approved truth) */
export const consumerApiDiscussionMock: ConsumerApiOutput = {
  prompt: 'Have we seen a shift toward PostgreSQL for ledger storage before?',
  answer: `Yes — ADR-007 (approved March 2024) adopted PostgreSQL for audit log storage under similar scale assumptions. The team completed rollout in six weeks with no SLA breach in the first year.

The current Confluence thread shows an emerging position toward Postgres — not a closed decision. This is advisory context from a change preview, not verified organizational truth. For authoritative answers, wait for human approval through the decision path.

Precedent match: ledger-adr-007 (91% similarity).`,
  source_ledger_id: 'ledger-adr-007',
}
