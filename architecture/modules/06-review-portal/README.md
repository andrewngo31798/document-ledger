# 1. Role of Review & Approval Portal

```
Review & Approval Portal = human validation before decisions enter the ledger
```

Main responsibilities:

| Responsibility    | Description                                      |
| ----------------- | ------------------------------------------------ |
| Present insights  | Display insight package from Analysis Engine     |
| Human review      | Allow reviewers to inspect and edit findings     |
| Approve / reject  | Gate decisions before they become source of truth|
| Add rationale     | Capture reviewer notes and justification         |
| Confirm source    | Link approved decision back to original evidence |

---

# 2. Architecture

```
Analysis Engine
        ↓
Review & Approval Portal
├── Insight Viewer
├── Review Workflow
├── Edit / Comment UI
├── Approval Controller
└── Audit Logger
        ↓
Decision Ledger
```

---

# 3. Internal Components

| Component              | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| **Insight Viewer**     | Render impact, similarity, forecast, recommendations |
| **Review Workflow**    | Assign, track, and escalate review tasks   |
| **Edit Controller**    | Allow reviewers to correct or enrich data  |
| **Approval Controller**| Approve or reject with rationale             |
| **Notification Service** | Alert reviewers of pending items           |
| **Audit Logger**       | Record all review actions and state changes  |

---

# 4. Review Outcomes

| Outcome     | Description                              | Next Step              |
| ----------- | ---------------------------------------- | ---------------------- |
| **Approved**| Reviewer confirms decision and rationale | Publish to Decision Ledger |
| **Rejected**| Reviewer rejects with reason             | Archive / retry pipeline |
| **Revision**| Reviewer requests re-analysis            | Re-trigger Analysis Engine |

| Direction | Type                | Description                          |
| --------- | ------------------- | ------------------------------------ |
| **Input** | Insight package     | Output from Analysis Engine          |
| **Output**| Approved decision   | Validated package for Decision Ledger|
| **Output**| `decision.approved` event | Trigger ledger write            |

> TBD: UI framework, role-based access, and approval workflow states.
