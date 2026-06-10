1. Overall Architecture
External Sources
├── Manual Trigger
├── Scheduler
├── Webhook
├── Jira
├── Confluence
├── Meeting Transcript
├── Slack / Teams
└── GitHub / GitLab
        ↓
Signal Intake Engine
        ↓
Processing Job Queue
        ↓
Knowledge Processing Engine
        ↓
Classification Engine
        ↓
Analysis Engine
   ├── Impact Engine
   ├── Similarity Engine
   ├── Forecast Engine
   └── Recommendation Engine
        ↓
Review & Approval Portal
        ↓
Decision Ledger
        ↓
Consumer API
        ↓
AI Systems / Search / Agent / RAG

2. Core Architecture Diagram
                 ┌──────────────────────────────┐
                 │        External Sources       │
                 │ Jira / Confluence / Meeting   │
                 │ Slack / GitHub / Manual / Cron│
                 └───────────────┬──────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────┐
│              Signal Intake Engine                  │
│----------------------------------------------------│
│ - Receive manual trigger                           │
│ - Receive webhook                                  │
│ - Run scheduled trigger                            │
│ - Validate source reference                        │
│ - Create processing job                            │
│ - Publish source.triggered event                   │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│                 Event Bus / Queue                  │
│----------------------------------------------------│
│ Kafka / SQS / RabbitMQ / BullMQ                    │
│ Events: source.triggered, source.ingested           │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│            Knowledge Processing Engine             │
│----------------------------------------------------│
│ - Fetch raw data from source                       │
│ - Normalize text                                   │
│ - Chunk content                                    │
│ - Extract entities                                 │
│ - Extract decision candidates                      │
│ - Store raw + normalized knowledge                 │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│               Classification Engine                │
│----------------------------------------------------│
│ - Business / Technical classification              │
│ - Decision type tagging                            │
│ - Confidence scoring                               │
│ - Routing to proper analysis path                  │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│                  Analysis Engine                   │
│----------------------------------------------------│
│ Impact | Similarity | Forecast | Recommendation    │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│              Review & Approval Portal              │
│----------------------------------------------------│
│ - Human review                                     │
│ - Edit / approve / reject                          │
│ - Add rationale                                    │
│ - Confirm source of truth                          │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│                  Decision Ledger                   │
│----------------------------------------------------│
│ - Approved decisions                               │
│ - Version history                                  │
│ - Audit trail                                      │
│ - Evidence links                                   │
│ - AI-ready structured knowledge                    │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│                   Consumer API                     │
│----------------------------------------------------│
│ - Search decisions                                 │
│ - Retrieve by project/domain/system                │
│ - Feed AI agents / RAG / documentation systems     │
└────────────────────────────────────────────────────┘

3. Module Responsibility Table

| Module                          | Main Purpose                                           | Input                             | Output                     |
| ------------------------------- | ------------------------------------------------------ | --------------------------------- | -------------------------- |
| **Signal Intake Engine**        | Nhận tín hiệu có data mới cần xử lý                    | Manual trigger, schedule, webhook | Processing job             |
| **Queue / Event Bus**           | Tách xử lý async, scale worker                         | Processing job event              | Job message                |
| **Knowledge Processing Engine** | Fetch và xử lý raw data                                | Job message + source reference    | Structured knowledge       |
| **Classification Engine**       | Phân loại business / technical decision                | Structured knowledge              | Classified decision        |
| **Analysis Engine**             | Phân tích impact, similarity, forecast, recommendation | Classified decision               | Insight package            |
| **Review Portal**               | Human approve trước khi ghi ledger                     | Insight package                   | Approved decision          |
| **Decision Ledger**             | Source of truth cho decision đã approve                | Approved decision                 | Ledger record              |
| **Consumer API**                | Expose trusted knowledge cho AI systems                | Ledger record                     | API response / RAG context |
