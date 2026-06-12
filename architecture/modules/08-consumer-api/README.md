# Consumer API — Design

Module **08**. Exposes **approved decision knowledge** and **discussion change previews** to downstream systems.

Related: [System Architecture](../../overview/architecture.md) · [Decision Ledger](../07-decision-ledger/) · [Forecast Engine](../09-forecast-engine/)

---

## 1. Role

```
Consumer API = trusted answers from the ledger + early signals from discussions
```

| Responsibility | Description |
| -------------- | ----------- |
| Search decisions | Full-text and filtered search over approved ledger |
| Retrieve records | Fetch by project, domain, system, or ID |
| **Change previews** | Serve Forecast Engine outputs — shifts + precedent matches |
| **"Seen this before"** | Precedent Q&A grounded in ledger records |
| Feed AI systems | RAG context from ledger + optional change preview context |
| Access control | Tenant-scoped, authenticated access |

---

## 2. Architecture

```
Decision Ledger ──────┐
                      ├──► Consumer API
change_previews ──────┘      ├── Search Service
 (Forecast Engine)            ├── Retrieval Service
                              ├── Change Preview Service
                              ├── Precedent Query Service
                              └── RAG Context Builder
                                      ↓
                              AI Systems / Search / Agents
```

---

## 3. Data sources

| Source | Path | Trust tier |
| ------ | ---- | ---------- |
| Decision Ledger | Decision path terminus | **Authoritative** — approved only |
| `change_previews` | Discussion path (Forecast Engine) | **Advisory** — not approved truth |

---

## 4. Planned endpoints (draft)

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/decisions/search` | GET | Search approved decisions |
| `/decisions/{id}` | GET | Single ledger record |
| `/decisions/rag-context` | POST | RAG context from ledger |
| `/changes/previews` | GET | List change previews (discussion path) |
| `/changes/previews/{id}` | GET | Full `change_preview` package |
| `/changes/seen-before` | POST | "Have we seen this before?" — precedent query |

---

## 5. Precedent query contract (draft)

**Request:** natural-language or structured query + optional `knowledge_id` context

**Response:**
- `seen_before: boolean`
- `precedent_matches[]` (same shape as Forecast Engine output)
- `answer` — grounded narrative citing `source_ledger_id` only

Same grounding rules as Forecast Engine Precedent Engine: ungrounded claims dropped.
