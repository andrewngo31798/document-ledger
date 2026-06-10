# 1. Role of Decision Ledger

```
Decision Ledger = source of truth for approved decisions
```

Main responsibilities:

| Responsibility   | Description                                      |
| ---------------- | ------------------------------------------------ |
| Store decisions  | Persist approved decision packages               |
| Version history  | Track changes across decision revisions          |
| Audit trail      | Immutable log of writes and updates              |
| Evidence links   | Maintain links to original source material       |
| Index knowledge  | Make decisions searchable and AI-ready           |

---

# 2. Architecture

```
Review & Approval Portal
        ↓
Decision Ledger
├── Ledger Writer
├── Version Manager
├── Audit Trail Store
├── Evidence Linker
└── Search Indexer
        ↓
PostgreSQL
Search Index (TBD)
        ↓
Consumer API
```

---

# 3. Internal Components

| Component            | Purpose                                      |
| -------------------- | -------------------------------------------- |
| **Ledger Writer**    | Persist approved decision records            |
| **Version Manager**  | Manage decision versions and supersession    |
| **Audit Trail Store**| Append-only audit log                        |
| **Evidence Linker**  | Attach and resolve source evidence URLs      |
| **Search Indexer**   | Index records for retrieval and RAG          |
| **Query Service**    | Internal read API for Consumer API           |

---

# 4. Ledger Record Schema (Draft)

| Field            | Description                              |
| ---------------- | ---------------------------------------- |
| **id**           | Unique ledger record identifier          |
| **tenant**       | Tenant / project scope                   |
| **decision**     | Structured decision content              |
| **category**     | Business / technical classification      |
| **evidence**     | Links to source artifacts                |
| **approved_by**  | Reviewer identity                        |
| **approved_at**  | Approval timestamp                       |
| **version**      | Record version number                    |

| Direction | Type           | Description                          |
| --------- | -------------- | ------------------------------------ |
| **Input** | Approved decision | Output from Review Portal         |
| **Output**| Ledger record  | Durable, versioned source of truth   |

> TBD: Storage schema, indexing strategy, and retention policy.
