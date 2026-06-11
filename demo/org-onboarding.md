# Document Ledger — Org Onboarding (Phase 1)

Checklist and guide for bringing Document Ledger into an organization at the first stage. This reflects the **intended Day 1 setup** from the architecture specs.

> **Note:** The repo is architecture-first today — `demo/` is not yet a deployable product. Use this document as the rollout playbook when implementation lands.

Related: [System Walkthrough](system-walkthrough.md) · [System Architecture](../architecture/overview/architecture.md)

---

## Mental model

Document Ledger is not plug-and-play on day one. Four foundations must exist before the pipeline produces trustworthy output:

| Foundation | What it provides |
| ---------- | ---------------- |
| **Tenant + access** | Org identity, who can trigger processing and who can review |
| **Source connections** | How signals enter (Jira, Confluence, meetings, manual) |
| **Org context files** | Gazetteers and service catalog so extraction and impact are not blind |
| **Human review loop** | Reviewers who approve the first baseline decisions into the ledger |

Until approved decisions exist, the system runs in **cold start** mode: analysis works, but ledger diff is mostly `first_of_kind` and impact relies on entities rather than a rich dependency graph.

---

## Infrastructure minimum (Phase 1 / MVP)

| Component | Required | Purpose |
| --------- | -------- | ------- |
| **PostgreSQL** | Yes | Knowledge records, entities, classifications, insight packages, ledger, graph adjacency |
| **Object storage** | Yes | Raw Jira, Confluence, meeting payloads |
| **Queue / Event Bus** | Yes | Pipeline events: `source.triggered` → `decision.approved` |
| **pgvector** | Yes | Ledger embedding search for Ledger Diff Engine |
| **Redis** | Yes | Signal Intake idempotency and job state |
| **LLM API** | Yes (limited) | Classification fallback, forecast and recommendation synthesis |

**Deferred at Phase 1:** Neo4j/FalkorDB, CMDB integration, Temporal workflows, GitHub dependency graphs.

---

## Onboarding checklist

### 1. Create the tenant

- Register one organization as one `tenant_id` (or multiple tenants if operating as a platform).
- Configure tenant-scoped auth: reviewers, admins, API users.
- Store source credentials in a **tenant secret store** — never shared across tenants.
- All downstream queries and records are scoped by `tenant_id`.

- [ ] Tenant provisioned
- [ ] Roles assigned (reviewer, admin, optional API consumer)
- [ ] Secret store configured for source credentials

---

### 2. Connect external sources

Signal Intake supports these trigger types:

| Trigger | Example | When to use |
| ------- | ------- | ----------- |
| **Backfill** | Sync last 30 days of Jira / Confluence | **Primary first-run action** — seed content |
| **Webhook** | Jira issue updated | Steady state after backfill |
| **Schedule** | Scan Confluence every 6 hours | Ongoing sync |
| **Manual** | User clicks "Analyze Document" | Demo, one-offs |
| **Replay** | Re-run failed job | Ops / debug |

**Per-source credentials (per tenant):**

| Source | Adapter | Credential |
| ------ | ------- | ---------- |
| Jira | JiraAdapter | OAuth / API token |
| Confluence | ConfluenceAdapter | OAuth / API token |
| Slack | SlackAdapter | Bot token |
| GitHub | GitHubAdapter | App installation token |
| Meeting | MeetingAdapter | File upload or integration API |
| File | FileAdapter | Internal object reference |

**Recommended first-run sequence:**

```
1. Connect Jira + Confluence (highest signal for decisions)
2. Run BACKFILL on existing ADRs, architecture pages, major tickets
3. Upload 1–2 meeting transcripts if decisions live in meetings
4. Enable webhooks for new / updated items
```

- [ ] Jira and/or Confluence connected
- [ ] Backfill completed on decision-heavy content
- [ ] Webhooks or schedules enabled for ongoing intake
- [ ] (Optional) Meeting transcripts or file uploads configured

---

### 3. Load org-specific context

Phase 1 does not assume a mature CMDB. Manually seed two JSON artifacts per tenant.

#### A. Tenant gazetteers (Knowledge Processing)

Used by EntityRuler during entity extraction:

- Project codes (`PROJ-123`)
- Internal system names (`auth-api`, `payment-service`)
- Team names (`Platform`, `Security`)
- Known technology aliases

Without gazetteers, extraction is weaker on domain-specific names.

#### B. Static service catalog / tenant graph (Analysis Engine)

Used by Impact Engine for 2-hop graph traversal at MVP:

```json
{
  "systems": [
    { "id": "auth-api", "owned_by": "Platform" },
    { "id": "payment-service", "depends_on": ["auth-api"] }
  ]
}
```

Without this, `impact_map` falls back to entity-only lists with low `blast_radius_score` and warning `graph_coverage: sparse`.

- [ ] Tenant gazetteers uploaded (projects, systems, teams)
- [ ] Static service catalog / dependency graph JSON uploaded

---

### 4. Classification taxonomy

Ship with canonical taxonomy v1 — see [`decision-taxonomy.json`](../architecture/modules/04-classification/taxonomy/decision-taxonomy.json).

| Level | Phase 1 behavior |
| ----- | ---------------- |
| **Domains** | `business`, `technical`, `hybrid` — stable |
| **Categories** | `architecture`, `security_compliance`, `product_scope`, etc. — stable |
| **Tags** | Tenant-specific extensions under categories — allowed at Phase 1 |

**Optional but valuable:** label **200–400 decision candidates** from your own Jira / Confluence exports to calibrate confidence thresholds (default 0.65–0.80). Without labeled data, routing still works via rules + LLM fallback, but confidence is less trustworthy.

- [ ] Taxonomy v1 confirmed (or tenant tags added under existing categories)
- [ ] (Optional) Labeled candidate set for calibration

---

### 5. Reviewers and governance

Before anything enters the Decision Ledger, humans must be in place.

| Role | Responsibility |
| ---- | -------------- |
| **Reviewer** | Approve or reject insight packages |
| **Admin** | Tenant config, source credentials |
| **Architecture board** (optional) | High `blast_radius_score` or `conflicts` cases |

| Review outcome | Next step |
| -------------- | --------- |
| **Approved** | Write to Decision Ledger; emit `decision.approved` |
| **Rejected** | Archive or retry pipeline |
| **Revision** | Re-trigger Analysis Engine |

**No auto-write to ledger** — intentional at every stage.

- [ ] Reviewers assigned
- [ ] Escalation path agreed for `conflicts` and `supersedes`
- [ ] Review Portal access configured

---

### 6. First pipeline run

```
External source (backfill / manual)
    → Signal Intake (validate tenant, create job)
    → Knowledge Processing (fetch, chunk, extract entities, detect candidates)
    → Classification (domain, category, analysis profile)
    → Analysis Engine (ledger diff + impact + …)
    → Review & Approval Portal (human validates)
    → Decision Ledger (first approved records)
    → Consumer API (search / RAG — only after approvals)
```

**Cold start behavior (empty ledger):**

| Output | What you see |
| ------ | ------------ |
| `ledger_diff.change_classification` | `first_of_kind` |
| `ledger_diff.headline` | "No approved decisions in ledger — this would establish a new baseline" |
| `quality.warnings` | `no_ledger_baseline` |
| `impact_map` | Entity-based only if graph is sparse |
| Recommendations | e.g. `document_as_first_adr`, `ledger_action: approve_new` |

- [ ] First backfill processed end-to-end
- [ ] First insight packages reviewed in Review Portal
- [ ] First approved decisions written to Decision Ledger

---

## First 2–4 weeks — priorities

| Priority | Action | Why |
| -------- | ------ | --- |
| **1** | Backfill existing ADRs and architecture Confluence pages | Fastest path to real decision candidates |
| **2** | Approve 10–20 decisions through Review Portal | Seeds Decision Ledger; unlocks real ledger diff |
| **3** | Load gazetteers + minimal service catalog JSON | Better entities and `impact_map` |
| **4** | Connect Jira webhooks for new tickets | Ongoing flow, not one-time import |
| **5** | Agree who owns `conflicts` and `supersedes` cases | Trust boundary is the product |

Consumer API and AI agents are **downstream of approved ledger content** — not required on day one unless approved records already exist to expose.

---

## The flywheel

```
Day 1:      Empty ledger, sparse graph, entity-only impact
              ↓
Week 2–4:   First approved ADRs in ledger
              ↓
Month 2+:   Ledger diff finds amends / supersedes / conflicts
            Graph grows from approved decisions + catalog
              ↓
Phase 2:    CMDB feed, trained classifiers, hybrid retrieval rerank
```

Each human approval:

- Adds a **ledger record** — diff baseline for future decisions
- Adds **decision nodes** to the Decision Knowledge Graph
- Improves **vector search** for Ledger Diff Engine
- Grounds **Forecast** in precedent outcomes

---

## Phase 1 vs later

| Setup item | Phase 1 (first stage) | Later |
| ---------- | --------------------- | ----- |
| Service catalog | Manual JSON import | CMDB integration |
| Knowledge graph | PostgreSQL adjacency + static JSON | Neo4j / FalkorDB; incremental merge on ledger write |
| Classification | Rules + LLM fallback | Trained Tier 2 classifier + calibration |
| Ledger diff | pgvector + category filter | Hybrid RRF + cross-encoder rerank |
| Consumer API | Basic search / retrieve | Full RAG context builder at scale |
| Code dependencies | Optional | Phase 3 GitHub / GitLab graphs |

---

## Quick reference — full checklist

- [ ] Create tenant + auth (reviewers, admins, API users)
- [ ] Deploy PostgreSQL, object storage, queue, pgvector, Redis
- [ ] Connect Jira and/or Confluence credentials
- [ ] Upload tenant gazetteers (projects, systems, teams)
- [ ] Upload static service catalog / dependency graph JSON
- [ ] Run **backfill** on existing ADRs and decision-heavy content
- [ ] Assign reviewers in Review Portal
- [ ] Approve first batch of decisions into Decision Ledger
- [ ] Enable webhooks / schedules for ongoing intake
- [ ] (Optional) Label 200+ candidates for classification calibration
- [ ] (Later) Expose Consumer API to dashboards, search, agents

---

## Summary

At first stage you are not turning on AI over your org. You are:

1. **Connecting sources** so decisions can be detected
2. **Teaching the system your vocabulary** (gazetteers + catalog)
3. **Putting humans in the loop** to approve the first trusted baseline
4. **Letting the ledger and graph compound** from those approvals

The system is useful on day one (detect, classify, propose insights) but **trustworthy only after** your org has approved its first decisions into the ledger.
