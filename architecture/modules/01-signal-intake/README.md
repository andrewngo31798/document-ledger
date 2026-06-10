# 1. Role of Signal Intake Engine

```
Signal Intake Engine = entry point that receives processing triggers
```

Main responsibilities:

| Responsibility   | Description                                    |
| ---------------- | ---------------------------------------------- |
| Receive signal   | Accept manual trigger, webhook, schedule       |
| Validate signal  | Check tenant, source type, source reference    |
| Normalize signal | Normalize every trigger into a common format   |
| Create job       | Create processing job                          |
| Publish event    | Publish job to Queue / Event Bus               |
| Audit            | Record trigger history for trace / retry / debug |

---

# 2. Architecture

```
Manual UI
Scheduler
External Webhook
        ↓
API Gateway
        ↓
Signal Intake Engine
├── Trigger Controller
├── Auth & Tenant Resolver
├── Trigger Validator
├── Idempotency Handler
├── Source Registry
├── Job Creator
├── Event Publisher
├── Retry / DLQ Handler
└── Audit Logger
        ↓
PostgreSQL
Redis
Queue / Event Bus
        ↓
Knowledge Processing Engine
```

---

# 3. Internal Components

| Component                  | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| **Trigger Controller**     | Expose API to receive triggers             |
| **Auth & Tenant Resolver** | Resolve tenant, project, and user          |
| **Trigger Validator**      | Validate schema, source type, trigger type |
| **Source Registry**        | Manage supported source types              |
| **Idempotency Handler**    | Prevent duplicate triggers                 |
| **Job Creator**            | Create processing job                      |
| **Event Publisher**        | Publish event to Knowledge Processing Engine |
| **Audit Logger**           | Record full trigger lifecycle              |
| **Retry Handler**          | Retry when event publish fails             |
| **DLQ Handler**            | Store failed events for replay             |

---

# 4. Supported Trigger Types

| Trigger Type | Example                              | Use Case              |
| ------------ | ------------------------------------ | --------------------- |
| **Manual**   | User click “Sync Jira Ticket”        | Demo, one-off sync    |
| **Webhook**  | Jira issue updated                   | Near real-time update |
| **Schedule** | Every 6 hours scan Confluence        | Batch sync            |
| **Backfill** | Sync all decisions from last 30 days | Initial import        |
| **Replay**   | Re-run failed job                    | Recovery / debug      |
