# 1. Role of Classification Engine

```
Classification Engine = categorize decisions into business and technical domains
```

Main responsibilities:

| Responsibility       | Description                                           |
| -------------------- | ----------------------------------------------------- |
| Classify decisions   | Business vs. technical domain tagging                 |
| Tag decision types   | Apply decision type labels                            |
| Score confidence     | Produce confidence score per classification           |
| Route analysis path  | Direct to the appropriate analysis workflow           |

---

# 2. Architecture

```
Knowledge Processing Engine
        ↓
Classification Engine
├── Classification Model
├── Rule Engine
├── Confidence Scorer
└── Analysis Router
        ↓
Analysis Engine
```

---

# 3. Internal Components

| Component                 | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| **Job Consumer**          | Receive structured knowledge objects         |
| **Classification Model**  | ML/LLM-based domain classification           |
| **Rule Engine**           | Apply business rules and overrides           |
| **Tag Assigner**            | Attach category, tags, and metadata          |
| **Confidence Scorer**     | Compute and attach confidence score          |
| **Analysis Router**       | Select analysis path based on classification |
| **Audit Logger**          | Record classification rationale              |

---

# 4. Input / Output

| Direction | Type                 | Description                          |
| --------- | -------------------- | ------------------------------------ |
| **Input** | Structured knowledge | Output from Knowledge Processing Engine |
| **Output**| Classified decision  | Category, tags, confidence score     |
| **Output**| `decision.classified` event | Trigger Analysis Engine        |

> TBD: Classification taxonomy, model selection, and confidence thresholds.
