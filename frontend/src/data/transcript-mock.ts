export const transcriptMock = `Meeting Transcript — Backend Architecture Review
Date: 2024-11-14
Attendees: Sarah (Tech Lead), Marcus (Backend), Priya (Data), Tom (DevOps)

Sarah: Alright, let's settle the database question. We've been going back and forth on
DynamoDB vs Postgres for the decision ledger store. Marcus, you want to kick us off?

Marcus: Sure. DynamoDB was attractive for the auto-scaling story, but after the spike
last week I'm not confident it handles our relational query patterns well. The audit
trail queries require joins across decision records, evidence links, and reviewer history.
With Dynamo we'd end up re-implementing relational logic in application code.

Priya: I ran the read workload simulation on RDS Postgres. Even at 10x our projected
volume, query times stayed under 50ms with proper indexing. The JSONB support also
means we can store the insight package payloads without a separate document store.

Tom: Ops-wise, Postgres is simpler for us right now. We already run it for the auth
service. One less managed service to monitor.

Sarah: Any concerns about scale ceiling?

Marcus: At our projected growth rate, we won't hit Postgres limits for at least 18 months.
We can revisit partitioning at that point. The risk of premature optimisation with Dynamo
outweighs the upside.

Sarah: Okay, I think we've heard enough. We're going with Postgres. Marcus, can you
document the rationale in Confluence and close out the Jira spike ticket?

Marcus: Will do.

Sarah: Great. Decision made: Postgres over DynamoDB for the decision ledger store.
Rationale: relational query requirements, existing operational familiarity, JSONB
support for payloads. We'll revisit if we hit scale ceiling post-18 months.`
