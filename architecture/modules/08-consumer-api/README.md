# 1. Role of Consumer API

```
Consumer API = expose trusted decision knowledge to downstream systems
```

Main responsibilities:

| Responsibility   | Description                                      |
| ---------------- | ------------------------------------------------ |
| Search decisions | Full-text and filtered search over ledger        |
| Retrieve records | Fetch by project, domain, system, or ID         |
| Feed AI systems  | Provide structured context for agents and RAG    |
| Access control   | Enforce tenant-scoped, authenticated access      |

---

# 2. Architecture

```
Decision Ledger
        ↓
Consumer API
├── API Gateway
├── Auth & Tenant Resolver
├── Search Service
├── Retrieval Service
└── RAG Context Builder
        ↓
AI Systems / Search / Agent / RAG
```

---

# 3. Internal Components

| Component              | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| **API Gateway**        | Expose REST/GraphQL endpoints                |
| **Auth & Tenant Resolver** | Authenticate and scope requests          |
| **Search Service**     | Query ledger index with filters              |
| **Retrieval Service**  | Fetch single or batch records by ID          |
| **RAG Context Builder**| Format ledger records for LLM consumption    |
| **Rate Limiter**       | Protect downstream systems from overload     |
| **Audit Logger**       | Log API access for compliance                |

---

# 4. Planned Endpoints (Draft)

| Endpoint                    | Method | Description                          |
| --------------------------- | ------ | ------------------------------------ |
| `/decisions/search`         | GET    | Search decisions with filters        |
| `/decisions/{id}`           | GET    | Retrieve a single ledger record      |
| `/decisions/by-project`     | GET    | List decisions for a project         |
| `/decisions/rag-context`    | POST   | Build RAG context for a query        |

| Direction | Type           | Description                          |
| --------- | -------------- | ------------------------------------ |
| **Input** | Ledger records | Read from Decision Ledger            |
| **Output**| API response   | JSON payloads for downstream consumers|

> TBD: API spec (OpenAPI), authentication method, and pagination strategy.
