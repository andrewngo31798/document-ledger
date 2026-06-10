# 1. Role của Signal Intake Engine

```
Signal Intake Engine = entry point nhận tín hiệu xử lý
```

Nhiệm vụ chính:


| Responsibility   | Description                                    |
| ---------------- | ---------------------------------------------- |
| Receive signal   | Nhận manual trigger, webhook, schedule         |
| Validate signal  | Kiểm tra tenant, source type, source reference |
| Normalize signal | Chuẩn hóa mọi trigger thành format chung       |
| Create job       | Tạo processing job                             |
| Publish event    | Đẩy job sang queue/event bus                   |
| Audit            | Lưu lịch sử trigger để trace/retry/debug       |


---

# 2. Architecture

```

```

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
Event Bus / Queue
        ↓
Knowledge Processing Engine
```

---

# 3. Internal Components


| Component                  | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| **Trigger Controller**     | Expose API nhận trigger                    |
| **Auth & Tenant Resolver** | Xác định tenant/project/user               |
| **Trigger Validator**      | Validate schema, source type, trigger type |
| **Source Registry**        | Quản lý source nào được support            |
| **Idempotency Handler**    | Chống duplicate trigger                    |
| **Job Creator**            | Tạo processing job                         |
| **Event Publisher**        | Publish event cho Knowledge Processing     |
| **Audit Logger**           | Lưu toàn bộ lifecycle                      |
| **Retry Handler**          | Retry khi publish event fail               |
| **DLQ Handler**            | Lưu event lỗi để xử lý lại                 |


---

# 4. Supported Trigger Types


| Trigger Type | Example                              | Use Case              |
| ------------ | ------------------------------------ | --------------------- |
| **Manual**   | User click “Sync Jira Ticket”        | Demo, one-off sync    |
| **Webhook**  | Jira issue updated                   | Near real-time update |
| **Schedule** | Every 6 hours scan Confluence        | Batch sync            |
| **Backfill** | Sync all decisions from last 30 days | Initial import        |
| **Replay**   | Re-run failed job                    | Recovery/debug        |


