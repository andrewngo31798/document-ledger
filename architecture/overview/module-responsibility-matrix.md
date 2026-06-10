Document Ledger - Module Responsibility Matrix


| Module                    | Purpose                                                  | Input                                                          | Processing                                            | Output                                    | Consumers            |
| ------------------------- | -------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------- | -------------------- |
| **Detect**                | Identify decision candidates from unstructured content   | Meeting transcript, Jira ticket, Confluence update, PR comment | NLP extraction, decision signal detection             | Decision candidates                       | Knowledge Processing |
| **Knowledge Processing**  | Convert raw text into structured knowledge               | Decision candidates                                            | Summarization, entity extraction, metadata enrichment | Structured knowledge objects              | Classify             |
| **Classify**              | Categorize decisions into business and technical domains | Structured knowledge                                           | Classification models, rule engine                    | Decision category, tags, confidence score | Analysis Engine      |
| **Impact Engine**         | Determine what may be affected by the decision           | Classified decision                                            | Dependency analysis, graph traversal                  | Impact map                                | Review               |
| **Similarity Engine**     | Find related historical decisions                        | Classified decision                                            | Embedding search, vector similarity                   | Similar decisions list                    | Review               |
| **Forecast Engine**       | Predict future consequences and risks                    | Classified decision + historical decisions + impact map        | Pattern analysis, risk prediction                     | Forecast report                           | Review               |
| **Recommendation Engine** | Suggest next actions and governance steps                | Outputs from Impact, Similarity, Forecast                      | Reasoning, rule engine, LLM                           | Recommendations                           | Review               |
| **Review**                | Human validation and approval workflow                   | Insight package                                                | Human review                                          | Approved / Rejected decision              | Decision Ledger      |
| **Decision Ledger**       | Source of truth for approved decisions                   | Approved decision package                                      | Versioning, indexing, audit trail                     | Ledger record                             | Consumer API         |
| **Consumer API**          | Expose trusted knowledge to downstream systems           | Ledger records                                                 | Search, retrieval, filtering                          | Decision knowledge API                    | AI Systems           |


