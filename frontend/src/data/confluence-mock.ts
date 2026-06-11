export const confluenceMock = {
  page_id: 'confluence-adr-007',
  title: 'ADR-007: Choose Postgres over DynamoDB for Decision Ledger',
  space: 'Architecture Decisions',
  author: 'Marcus Chen',
  updated_at: '2024-11-15T10:32:00Z',
  status: 'Accepted',
  content: `
## Status
Accepted

## Context
The Knowledge Ledger system requires a persistent store for approved decision records,
evidence links, reviewer history, and audit trails. Two candidates were evaluated:
Amazon DynamoDB and PostgreSQL (RDS).

## Decision
We will use **PostgreSQL (Amazon RDS)** as the primary data store for the Decision Ledger.

## Rationale
- Audit trail queries require joins across multiple entity types (decisions, evidence, reviewers).
  Implementing this in DynamoDB would require duplicating relational logic in application code.
- Postgres JSONB columns provide native storage for insight package payloads without a
  separate document store.
- The team already operates Postgres for the auth service — one less managed service category.
- Load testing at 10x projected volume showed p99 query latency under 50ms with proper indexing.
- Horizontal scalability is not required within the 18-month horizon; partitioning can be
  introduced if needed at that point.

## Consequences
- DynamoDB auto-scaling benefit is foregone; manual capacity management required.
- Existing Postgres operational expertise and tooling can be reused.
- Decision will be revisited if ledger volume exceeds projections before 18 months.

## Decision Makers
- Sarah Okonkwo (Tech Lead) — final approval
- Marcus Chen (Backend) — technical analysis
- Priya Nair (Data) — load testing
- Tom Reeves (DevOps) — operational assessment
  `
}
