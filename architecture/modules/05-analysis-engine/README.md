# 1. Role of Analysis Engine

```
Analysis Engine = produce insight package from classified decisions
```

The Analysis Engine orchestrates four sub-engines that run in parallel or sequence:

| Sub-engine                | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| **Impact Engine**         | Determine what may be affected               |
| **Similarity Engine**     | Find related historical decisions            |
| **Forecast Engine**       | Predict future consequences and risks        |
| **Recommendation Engine** | Suggest next actions and governance steps    |

---

# 2. Architecture

```
Classification Engine
        ↓
Analysis Engine
├── Impact Engine
├── Similarity Engine
├── Forecast Engine
├── Recommendation Engine
└── Insight Aggregator
        ↓
Review & Approval Portal
```

---

# 3. Internal Components

| Component                   | Purpose                                           |
| --------------------------- | ------------------------------------------------- |
| **Job Consumer**            | Receive classified decision events                |
| **Impact Engine**           | Dependency analysis, graph traversal → impact map |
| **Similarity Engine**       | Embedding search → similar decisions list         |
| **Forecast Engine**         | Pattern analysis → forecast report                |
| **Recommendation Engine**   | Reasoning + rules + LLM → recommendations         |
| **Insight Aggregator**      | Merge sub-engine outputs into insight package     |
| **Audit Logger**            | Trace analysis steps and model outputs            |

---

# 4. Sub-engine Input / Output

| Sub-engine              | Input                                      | Output                |
| ----------------------- | ------------------------------------------ | --------------------- |
| **Impact Engine**       | Classified decision                        | Impact map            |
| **Similarity Engine**   | Classified decision                        | Similar decisions list|
| **Forecast Engine**     | Classified decision + history + impact map | Forecast report   |
| **Recommendation Engine** | Impact + Similarity + Forecast outputs   | Recommendations       |

| Direction | Type             | Description                              |
| --------- | ---------------- | ---------------------------------------- |
| **Output**| Insight package  | Combined analysis for human review       |
| **Output**| `insight.ready` event | Trigger Review & Approval Portal   |

> TBD: Sub-engine execution order, parallelization strategy, and vector store selection.
