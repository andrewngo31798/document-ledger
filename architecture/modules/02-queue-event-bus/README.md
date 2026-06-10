# 1. Role of Queue / Event Bus

```
Queue / Event Bus = async processing layer between pipeline stages
```

Main responsibilities:

| Responsibility    | Description                                      |
| ----------------- | ------------------------------------------------ |
| Receive events    | Accept `source.triggered`, `source.ingested`     |
| Buffer jobs       | Decouple producers from consumers for scale      |
| Route messages    | Deliver jobs to the correct downstream worker    |
| Retry / DLQ       | Handle transient failures and poison messages    |
| Observability     | Expose lag, throughput, and failure metrics      |

---

# 2. Architecture

```
Signal Intake Engine
        ↓
Event Bus / Queue
├── Topic: source.triggered
├── Topic: source.ingested
├── Consumer: Knowledge Processing Engine
├── Retry policy
└── Dead-letter queue
        ↓
Knowledge Processing Engine
```

---

# 3. Internal Components

| Component            | Purpose                                      |
| -------------------- | -------------------------------------------- |
| **Event Router**     | Route events to subscribed consumers         |
| **Job Serializer**   | Normalize job payload schema                 |
| **Consumer Registry**| Track active workers and subscriptions       |
| **Retry Handler**    | Exponential backoff for failed deliveries    |
| **DLQ Handler**      | Store and replay unprocessable messages      |
| **Metrics Collector**| Lag, throughput, error rate                  |

---

# 4. Supported Event Types

| Event Type          | Producer              | Consumer                    |
| ------------------- | --------------------- | --------------------------- |
| **source.triggered**| Signal Intake Engine  | Knowledge Processing Engine |
| **source.ingested** | Knowledge Processing  | Classification Engine       |
| **decision.classified** | Classification Engine | Analysis Engine         |
| **insight.ready**   | Analysis Engine       | Review Portal               |
| **decision.approved** | Review Portal       | Decision Ledger             |

> TBD: Final event schema, broker choice (Kafka / SQS / RabbitMQ / BullMQ), and retry policy.
