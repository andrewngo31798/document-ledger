# 1. Role of Knowledge Processing Engine

```
Knowledge Processing Engine = fetch raw data and convert it into structured knowledge
```

Main responsibilities:

| Responsibility         | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| Fetch source data        | Pull raw content from Jira, Confluence, meetings, etc. |
| Normalize text           | Clean and standardize unstructured input              |
| Chunk content            | Split large documents into processable segments       |
| Extract entities         | Identify people, systems, projects, dates               |
| Detect decision candidates | NLP extraction, decision signal detection         |
| Persist knowledge        | Store raw + normalized knowledge for downstream use   |

---

# 2. Architecture

```
Event Bus / Queue
        ↓
Knowledge Processing Engine
├── Source Fetcher
├── Text Normalizer
├── Content Chunker
├── Entity Extractor
├── Decision Candidate Detector
└── Knowledge Store Writer
        ↓
PostgreSQL / Object Storage
        ↓
Classification Engine
```

---

# 3. Internal Components

| Component                      | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| **Job Consumer**               | Pull processing jobs from the event bus    |
| **Source Fetcher**             | Retrieve raw data via source reference     |
| **Text Normalizer**            | Strip noise, unify encoding and formatting |
| **Content Chunker**            | Split content into semantic chunks         |
| **Entity Extractor**           | Extract named entities and metadata        |
| **Decision Candidate Detector**| Identify decision signals from text        |
| **Knowledge Store Writer**     | Persist raw and structured knowledge       |
| **Audit Logger**               | Trace fetch, transform, and store steps    |

---

# 4. Input / Output

| Direction | Type                  | Description                              |
| --------- | --------------------- | ---------------------------------------- |
| **Input** | Job message           | Source reference + tenant context        |
| **Input** | Raw source content    | Transcript, ticket, page, PR comment     |
| **Output**| Structured knowledge  | Normalized objects with decision candidates |
| **Output**| `source.ingested` event | Trigger classification stage           |

> TBD: Source adapter implementations, chunking strategy, and storage schema.
