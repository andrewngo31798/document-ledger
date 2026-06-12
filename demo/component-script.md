# Component-Aligned Demo Script

Presenter script mapped 1:1 to the Knowledge Ledger frontend pipeline. Each section fires when that component activates on the canvas.

**Demo scenario:** A backend architecture meeting decides *PostgreSQL over DynamoDB* for the Decision Ledger. The default input is the meeting transcript mock.

**How to run:** Input screen → select *Meeting transcript* → **Run demo →** → auto-advance through stages. Demo pauses at Review Portal until you click **Approve**.

**Tone:** Confident, conversational. Explain *what the audience is seeing* before *how it works*. Use the “Plain English” lines for mixed audiences; use “Technique” only when someone asks or when you have time during Analysis.

---

## Quick reference

| # | Component | ~Duration | Pacing |
|---|-----------|-----------|--------|
| 0 | Input Screen | 15s | Setup only |
| 1 | Signal Intake | 10s | Fast |
| 2 | Event Bus | 5s | Fast |
| 3 | Knowledge Processing | 15s | Medium |
| 4 | Classification | 10s | Medium — linger on confidence |
| 5 | Analysis Engine | **90–120s** | **Slow — this is the centerpiece** |
| 6 | Review Portal | 20s | Interactive pause |
| 7 | Decision Ledger | 10s | Quick payoff |
| 8 | Consumer API | 15s | Close with contrast |

---

## 0. Input Screen

**UI cue:** Landing page — four source cards, *Meeting transcript* selected.

**Point at:** The tagline and the selected transcript card.

### Script

> "Decisions don't start in a documentation tool. They start in a meeting, a Confluence update, a closed Jira ticket. We're starting with a real architecture review — the team is choosing a database for the Decision Ledger."

> "Watch what happens when that conversation enters the system. No one had to fill out a form. We just gave it the raw signal."

**Action:** Click **Run demo →**

---

## 1. Signal Intake

**UI cue:** `Signal Intake` node turns orange (processing), then green (Done). Status bar shows *Signal Intake · 1 of 8*.

**Point at:** The node badge and the edge label `source.triggered` when it appears.

### Script

> "Signal Intake is the front door. Something happened — a transcript was uploaded — and the system accepts it as a valid trigger."

> "It checks: who sent this, what type of source is it, is it a duplicate? Then it creates a job. Nobody had to remember to kick off a workflow."

### Plain English

The system listens for events where decisions actually happen — uploads, webhooks, scheduled checks — and turns them into a standardized “please process this” message.

### Technique (optional)

- **Trigger validation** — schema + tenant + source-type checks before anything expensive runs.
- **Idempotency** — same trigger twice does not create two jobs.
- **Job creation** — assigns a `job_id` and stores an audit record.

### Demo output to mention (Detail panel)

- `source_type`: meeting transcript
- `triggered_by`: manual upload
- `job_id`: unique processing job

---

## 2. Event Bus

**UI cue:** `Event Bus` activates immediately after Signal Intake. Edge animates between them.

**Point at:** The Event Bus node and the routing message in the detail panel.

### Script

> "The Event Bus is the post office. Signal Intake doesn't call the next module directly — it publishes an event. That keeps the pipeline decoupled: intake can change without breaking processing."

> "Right now the message is `source.triggered`, routed to the knowledge processing queue."

### Plain English

Think of it as a reliable message queue. Each stage hands off work asynchronously so nothing blocks while waiting for a slow step.

### Technique (optional)

- **At-least-once delivery** with idempotent consumers downstream.
- **Topic routing** — `source.triggered` → Knowledge Processing Engine.

---

## 3. Knowledge Processing

**UI cue:** Node moves to the Processing layer. Subtitle: *Extract & detect*.

**Point at:** Processing layer swimlane; open detail panel after completion.

### Script

> "Raw text isn't useful yet. Knowledge Processing reads the transcript and asks: what actually happened here?"

> "It pulls out the people — Sarah, Marcus, Priya. The systems — PostgreSQL, DynamoDB, Decision Ledger. And most importantly, it detects a decision signal: the team explicitly chose Postgres."

> "This isn't search indexing. The system is structuring the conversation into something a machine can reason about."

### Plain English

Like a careful note-taker at the meeting: who was involved, what was decided, what evidence exists — packaged as structured knowledge, not a blob of text.

### Technique (optional)

| Step | What it does |
|------|--------------|
| **Normalize** | Clean encoding, strip noise, unify format |
| **Chunk** | Split into semantic segments for analysis |
| **Entity extraction** | People, systems, projects, dates |
| **Decision detection** | Flag explicit decisions vs. general discussion |

### Demo output to mention

- `decision_candidates`: 1
- `entities_extracted`: PostgreSQL, DynamoDB, Decision Ledger, Sarah Okonkwo, Marcus Chen
- `decision_signal`: explicit decision

---

## 4. Classification

**UI cue:** `Classification` node — subtitle *Domain & confidence*.

**Point at:** Confidence score in detail panel (0.91). Edge label `decision.classified`.

### Script

> "Not every extracted statement needs full analysis. Classification decides: what kind of decision is this, and how confident are we?"

> "This one is **technical** — data storage and architecture. Confidence is ninety-one percent, high enough to route automatically. If it were ambiguous, it would escalate for human triage first."

> "It also picks the analysis profile: `full_analysis` — meaning all three Analysis sub-engines will run (ledger diff, impact, recommendation)."

### Plain English

A triage nurse for decisions: right department, right urgency, right level of scrutiny.

### Technique (optional)

- **Tiered classifiers** — rules first, then domain models, then LLM for edge cases.
- **Confidence calibration** — score reflects how sure the system is, not how important the decision is.
- **Routing profile** — tells Analysis Engine which sub-engines to run and how deep to go.

### Demo output to mention

- `domain`: technical
- `categories`: data_storage, architecture
- `confidence`: 0.91
- `analysis_profile`: full_analysis

---

## 5. Analysis Engine ← SLOW DOWN HERE

**UI cue:** Large node with 3 sub-engine grid. Subtitle: *Ledger diff · impact · recommend*. Sub-nodes light up in dependency order. *(Decision path only — meeting transcript demo.)*

**Point at:** Each sub-node as its spinner appears. Click the Analysis node when complete to open the full Insight Package in the detail panel.

### Opening line (when node first activates)

> "This is where Knowledge Ledger earns trust. The Analysis Engine doesn't just summarize the meeting — it compares this decision against what your organization has already approved, maps what it touches, predicts what to watch for, and suggests next steps."

> "Three steps: Ledger Diff and Impact start in parallel. Recommendation runs last. Forecast is a separate module (09) on the discussion path — not part of Analysis."

---

### 5a. Ledger Diff *(Phase 1 — parallel with Impact)*

**UI cue:** Top-left sub-node *Ledger Diff* shows spinner (~1.2s).

**Point at:** Ledger Diff cell, then detail panel → `ledger_diff` section after completion.

#### Script

> "First question: **what's new compared to what we've already approved?**"

> "Ledger Diff searches the Decision Ledger for related records. In this demo, there's no prior database decision for this service — so this is classified as **first of kind**."

> "It also captures the specific field changes: storage engine goes from undecided to PostgreSQL, query model becomes relational SQL plus JSONB, deployment becomes managed RDS."

#### Plain English

Imagine opening your team's decision log and asking: "Have we decided this before? If yes, what exactly changed?" That's the north star — not 'find similar documents,' but 'show me the delta from verified history.'

#### Technique

| Concept | Accessible explanation |
|---------|------------------------|
| **Hybrid retrieval** | Search by meaning (embeddings) *and* by keywords — like finding a past decision even if someone used different words |
| **Structured field diff** | Compare specific fields (storage engine, deployment model) instead of whole documents |
| **Change classification** | Label the relationship: first-of-kind, extends, amends, supersedes, conflicts, duplicate, etc. |

**Change types (if asked):**

- `first_of_kind` — nothing comparable in the ledger yet *(this demo)*
- `extends` — adds scope without contradicting
- `amends` — modifies one aspect of an existing decision
- `supersedes` — replaces an outdated decision
- `conflicts` — contradicts an active decision → needs resolution before approval

#### Demo output to mention

- `change_classification`: first_of_kind
- `headline`: "No prior database decision exists for this service"
- `field_changes`: storage_engine, query_model, deployment
- `confidence`: 0.94

---

### 5b. Impact Engine *(Phase 1 — parallel with Ledger Diff)*

**UI cue:** Top-right sub-node *Impact* shows spinner (~1.5s).

**Point at:** Impact cell, then detail panel → `impact map` section.

#### Script

> "While Ledger Diff compares history, Impact maps the blast radius: **if we adopt this, what gets touched?**"

> "It walks a knowledge graph — systems, teams, dependencies — and lights up what's in the path. Here: Decision Ledger itself, Consumer API, Review Portal, and the RDS infrastructure layer."

> "Blast radius score is sixty-two percent — moderate. Technical risk is medium; delivery and people impact are low because the team already runs Postgres elsewhere."

#### Plain English

Before you merge a code change, you'd ask "what breaks if this goes wrong?" Impact does that for organizational decisions — which services, teams, and projects are in the fallout zone.

#### Technique

| Concept | Accessible explanation |
|---------|------------------------|
| **Knowledge graph** | A map of how things connect: System A depends on System B, owned by Team C |
| **Graph traversal** | Walk 2–3 hops along dependency edges to find indirect effects |
| **Blast radius score** | Single number summarizing how wide the change reaches |
| **Risk dimensions** | Technical, delivery, and people — scored low / medium / high |

**Why graph, not just a list?** A decision about "the database" might indirectly affect every service that reads approved decisions — graph traversal finds those paths automatically.

#### Demo output to mention

- `affected_systems`: Decision Ledger, Consumer API, Review Portal, Infrastructure/RDS
- `blast_radius_score`: 0.62
- `risk_dimensions`: technical medium, delivery low, people low

---

### 5c. Recommendation Engine *(Phase 2 — after Impact)*

**UI cue:** Bottom sub-node *Recommendation* — label shows `← after Ledger Diff + Impact` (~1.1s).

**Point at:** Recommendation cell, then detail panel → `recommendations[]`.

#### Script

> "Recommendation answers: **what should the team do about this?**"

> "It synthesizes the ledger diff and impact map into concrete governance steps."

> "Three actions here: document the rationale in the ledger as an approved record. Assign Marcus as the Postgres schema owner. Flag a twelve-month review checkpoint to reassess scale."

#### Plain English

By the time a human opens the Review Portal, the system has already done the homework. Recommendations are proposals — not automatic actions.

#### Technique

| Concept | Accessible explanation |
|---------|------------------------|
| **Governance rules** | Hard-coded policies (e.g., conflicts must escalate before approval) |
| **Grounded synthesis** | AI drafts recommendations, but each must cite evidence from earlier analysis sections |
| **Action types** | `document`, `assign`, `flag`, `escalate` — structured next steps, not vague advice |

#### Demo output to mention

- Document rationale → priority high
- Assign Marcus Chen → priority medium
- 12-month review checkpoint → priority low

---

### 5e. Aggregator *(invisible on canvas — completes the package)*

**UI cue:** No separate sub-node visible; Analysis node turns green (Done) after aggregator finishes. Edge label `insight.ready` appears toward Review Portal.

**Point at:** Full Analysis node turning green; optionally open detail panel for the complete package.

#### Script

> "Behind the scenes, an aggregator merges all three steps into one review-ready package — validated against a schema, scored for completeness and grounding, and published as `insight.ready`."

> "Every claim in this package should be traceable. That's the difference between 'AI said so' and 'here's the evidence.'"

#### Plain English

Quality control before a human ever sees it: are all sections present? Is every claim backed by evidence? How urgent is review?

#### Technique (optional)

- **Schema validation** — insight package must match a strict JSON contract
- **Quality scores** — completeness, grounding, review priority
- **Partial failure handling** — if one sub-engine fails, the package may still publish with warnings and lower scores

---

### Analysis Engine — closing beat

> "Notice the order: compare to verified history first, map impact second, recommend last. The system leads with *what changed*, not *what sounds similar*. That's what makes the output trustworthy."

---

## 5-alt. Forecast Engine *(discussion path — Confluence demo)*

**UI cue:** Select **Confluence page** on input screen. After Knowledge Processing, decision-path nodes gray out (Skipped). Forecast appears as a **single standard node** (no sub-engine grid). Edge `change.preview.ready` goes directly to Consumer API.

**Point at:** Forecast node while processing, then detail panel → full `change_preview` (shifts, precedent matches, seen_before_headline).

### Script

> "No decision candidate — but the design thread is shifting toward PostgreSQL. Forecast captures the change and answers: **have we seen this before?** — matching ADR-007 from the ledger."

> "Change preview is **advisory** — not approved truth. Consumer API serves precedent Q&A; humans still own decisions through the decision path."

**Action:** Let the node finish and the canvas zoom back out before continuing.

---

## 6. Review Portal

**UI cue:** Demo auto-advance **stops here**. Node expands with decision summary, rationale textarea, Approve / Reject buttons. Badge: *human step*.

**Point at:** The dashed border (trust boundary), decision summary, and action buttons.

### Script

> "Automation stops at the trust boundary. A human sees everything the Analysis Engine produced — the diff, impact, recommendations — and decides whether to approve."

> "Some things shouldn't be fully automated. When trust is involved, someone has to own it. The portal doesn't replace that moment — it makes the person in that moment faster and better informed."

**Action:** Optionally type a short rationale (e.g., "Confirmed with team — aligns with spike results."). Click **Approve**.

### Plain English

The system proposes; humans dispose. Approval is what moves a decision from "candidate" to "verified organizational knowledge."

### Technique (optional)

- Review Portal loads the full `insight_package_id` — not a summary
- Reviewer can edit rationale, approve, reject, or request revision
- Only approved decisions write to the Decision Ledger

---

## 7. Decision Ledger

**UI cue:** After approval, `Decision Ledger` activates in the Output layer. Edge label `decision.approved`.

**Point at:** Output layer; detail panel showing versioned ledger entry.

### Script

> "Approval writes to the Decision Ledger — versioned, timestamped, evidence-linked, immutable."

> "This record now says: PostgreSQL over DynamoDB, approved by Sarah Okonkwo, backed by the Confluence ADR, the Jira spike, and the original meeting transcript."

> "This is the asset everything downstream trusts. Not a wiki page that might drift — a verified record with provenance."

### Plain English

An append-only log of decisions your organization has explicitly signed off on. Future analysis diffs against *this*, not against random documents.

### Demo output to mention

- `ledger_id`: ldg_20241115_001
- `version`: 1
- `approved_by`: Sarah Okonkwo
- `evidence_links`: ADR-007, Jira KL-142, meeting transcript

---

## 8. Consumer API

**UI cue:** Final node — subtitle *RAG & agents*. Detail panel shows a sample query and grounded answer.

**Point at:** The query and the answer citing the ledger record.

### Script

> "Now the payoff. An AI assistant — or any internal tool — asks: *Has our team officially verified the database decision — who approved it and what evidence backs it?*"

> "The Consumer API doesn't guess. It returns the verified ledger entry: the approver, the approval date, the evidence links — with a link back to the immutable source record."

> "Your AI assistant isn't hallucinating from stale Confluence pages anymore. It's drawing from knowledge your team has explicitly verified."

### Plain English

The ledger becomes the grounding layer for every tool that needs to answer "why did we decide that?" — chatbots, onboarding docs, migration runbooks, code assistants.

### Technique (optional)

- **RAG (Retrieval-Augmented Generation)** — retrieve verified ledger records first, then generate an answer constrained to that evidence
- **Source citation** — every answer includes `source_ledger_id` for auditability
- **Contrast with raw search** — search finds everything; the Consumer API finds *approved* answers

### Demo output to mention

- Query: "Has our team officially verified the database decision — who approved it and what evidence backs it?"
- Answer leads with approval status, approver, evidence links, then decision summary
- `source_ledger_id`: ldg_20241115_001

---

## Close (after Consumer API completes)

**UI cue:** Status bar shows all 8 stages complete.

### Script

> "We started with a meeting transcript nobody had time to write up. We ended with a verified decision that any tool in the organization can trust."

> "The bottleneck was never the search tool. It was always the quality of what you fed it. Knowledge Ledger is how you change that."

---

## Presenter tips

### Pacing
- **Don't rush Analysis.** If you're running long, cut Intake and Event Bus — not Ledger Diff or Impact.
- **Pause at Review Portal.** The audience needs to see the human gate.
- **Let the Consumer API answer land.** Read the query result out loud — the contrast with "AI guessing" is the emotional close.

### Detail panel
Click any completed node to show structured JSON output. Best clicks for storytelling:
1. **Classification** — confidence score
2. **Analysis Engine** — full insight package (all four sections)
3. **Decision Ledger** — evidence links
4. **Consumer API** — grounded answer

### If someone asks "where does AI fit?"
> "AI is used for understanding language — extracting entities, classifying decisions, writing summaries and recommendations. But retrieval, graph traversal, and ledger comparison are deterministic and auditable. AI synthesizes; it doesn't invent facts."

### If someone asks "what if there's a conflicting prior decision?"
> "Ledger Diff would classify it as `conflicts`, Impact would show overlapping systems, and Review priority would jump to urgent. The recommendation engine would suggest resolving the conflict before approval — not silently overwriting history."

---

## Related docs

- [5-minute storytelling arc](./storytelling.md) — narrative framing and key lines
- [Analysis Engine design](../architecture/modules/05-analysis-engine/README.md) — technical source of truth
- Frontend pipeline: `frontend/src/components/PipelineFlow.tsx`
