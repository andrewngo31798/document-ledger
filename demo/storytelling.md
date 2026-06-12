# 5-Minute Demo Storytelling Plan — Document Ledger

## Context

The narrative begins from a real individual pain point — searching for information and not being
able to tell what is verified — before scaling to organizational and AI-layer consequences.
The **decision path** is the live demo (meeting transcript → Analysis → Review → Ledger →
Consumer API). The **discussion path** (Forecast Engine, module 09) is optional — mention
only if asked.

**Naming:** **Document Ledger** = product · **Decision Ledger** = append-only store of approved
decisions · **Forecast Engine** = sibling discussion path, not part of Analysis.

Tone: first-person confession opening, then present-tense discovery, then technical depth,
then human accountability, then earned close. No slide-deck detachment.

Avoid: "source of truth" (overused), "documentation tool" framing, announcing the insight
before the audience feels it.

**Responsible AI (say early):** Nothing becomes trusted until a human approves it or it is
explicitly linked to approved evidence.

**Business payoff (weave in once):** Faster onboarding, safer AI answers, fewer duplicated
or conflicting decisions.

---

## Module map (decision path — live demo)

| # | Module | Role in the story |
| - | ------ | ----------------- |
| 01 | Signal Intake | Captures triggers from connected work channels |
| 02 | Event Bus | Routes work asynchronously between stages |
| 03 | Knowledge Processing | Extracts entities and decision signals; picks path |
| 04 | Classification | Categorizes decisions; assigns confidence; routes analysis |
| 05 | Analysis Engine | Ledger diff · impact · recommend (3 sub-engines) |
| 06 | Review Portal | Human validation boundary — approve or reject |
| 07 | Decision Ledger | Append-only store of approved decisions |
| 08 | Consumer API | Governed API — approved records for AI and tools |

> **09 Forecast Engine** — discussion path only. Skip in the 5-minute demo; see
> [Optional extension](#optional-extension-discussion-path) below.

---

## Narrative Arc (5 min)

### 0:00–0:50 — The Problem (individual → organizational → AI)

Open in the present tense of discovery. Do not announce the problem. Let it arrive.

> "I'm on a new feature. My team has been researching the approach for two weeks —
> spikes, Confluence pages, Jira threads. I open enterprise search and find a document.
> It looks complete. Well-structured. Someone wrote it recently. I act on it —
> I changed the API contract based on it. I'm not sure I should have."

Beat. Then the second story:

> "A few days later I search the same topic again — looking for the real answer, something
> external to confirm my thinking. The first result is my own document. The system gave
> my own unverified thinking back to me as if it were authority. It can't tell me
> whether I was right. It can only tell me I wrote it."

Then scale it:

> "Multiply that across a team. Across an organization. Everyone is writing diligently —
> Jira tickets close, Confluence pages publish, Slack threads reach conclusions.
> No one is doing anything wrong. But the organization ends up with many sources of
> information and no consistent, machine-readable way to tell which decision is verified."

Then the reframe — do not announce it, let it land:

> "We kept asking: what's the better search tool? But search was working fine.
> It found everything. That was the problem."

Then add AI:

> "Now put an AI assistant into that retrieval layer. It doesn't carry your hesitation.
> It doesn't pause the way you did. It answers — with confidence — from the same
> unverified pool. Your uncertainty disappears. Only the answer remains."

**The gap isn't information. It's verification.**

> "Nothing in this pipeline becomes trusted until a human approves it — or it is explicitly
> linked to approved evidence."

---

### 0:50–1:30 — Signal Intake + Event Bus (Modules 01–02)

Move fast. This is plumbing. Show it works, don't explain it.

> "Document Ledger starts where decisions actually live."

Show a trigger: a meeting transcript uploads, or a Jira ticket closes. Signal Intake validates
it and publishes to the Event Bus — no one had to remember to import it. No copy-paste.

> "The system captures decision signals as work happens — from approved channels and
> configured events."

That's enough. Move on.

---

### 1:30–2:30 — Knowledge Processing + Classification (Modules 03–04)

Medium pace. This is the credibility moment — show the system structures decisions, not just
stores text.

Raw content is fetched, normalized, broken into semantic chunks. Entities extracted — the
people involved, systems affected, date, rationale. A **decision candidate** is detected, so
Knowledge Processing routes to the **decision path** (not the discussion path).

Then Classification: categorizes the decision using a standardized taxonomy — business or
technical? What domain? The system assigns a confidence score to its classification.
High confidence routes to full analysis. Ambiguous ones escalate for human triage first.
High confidence means **routing**, not **approving**.

> "It doesn't index text. It identifies what kind of decision was made — and how confident
> the classification is."

The confidence score matters — it's the first signal that downstream analysis knows how much
scrutiny to apply.

*(Optional amber beat if time: a low-confidence or conflicting classification would escalate
to review before Analysis runs — the demo shows the happy path.)*

---

### 2:30–4:00 — Analysis Engine (Module 05) ← SLOW DOWN HERE

This is the purpose of the demo. Everything before was setup. Zoom into the ReactFlow DAG.

A classified decision arrives. The Analysis Engine — the **decision analysis layer** —
receives it. **Three** sub-engines activate: Ledger Diff and Impact in parallel, then
Recommendation.

**Walk each sub-engine as it activates:**

**Ledger Diff** — parallel with Impact
Compares the candidate against approved Decision Ledger records. Shows what's new — first of
kind, amends, supersedes, or conflicts. A **conflict blocks auto-approval** and requires
reviewer attention.
> "What's new compared to what we've already approved?"

**Impact Engine** — parallel with Ledger Diff
Assesses potential impact using the ownership graph, dependency graph, and prior ledger links.
Lights up which services, teams, and projects may be affected.
> "It maps what this decision could touch — before anyone has to ask."

**Recommendation Engine** — after diff + impact
Provides recommended next actions: document rationale, assign an owner, flag a review
checkpoint. Proposals — not automatic actions.
> "By the time a human sees this, the system has already gathered the relevant context."

Let each result card resolve visually before moving on. Don't rush this. The DAG activating
in dependency order IS the demo.

> Forecast Engine (module 09) is **not** part of Analysis. It runs on the **discussion path**
> when there is no decision candidate — see optional extension below.

---

### 4:00–4:30 — Review Portal (Module 06)

Brief. The Analysis Engine already did the setup — this is the human validation boundary.

A reviewer opens the portal. They see the decision candidate, ledger diff, impact map,
and recommended next steps. Everything the Analysis Engine produced, presented for a
human to act on. They can edit, add rationale, approve, or reject.

> "The system recommends; humans approve. Some things shouldn't be fully automated.
> When trust is involved, someone has to own it. The portal doesn't replace that moment
> — it makes the person in that moment faster and better informed."

One click: approved. The Decision Ledger writes.

---

### 4:30–4:50 — Decision Ledger + Consumer API (Modules 07–08)

The payoff. Show it quickly but let the contrast land.

The approved decision enters the Decision Ledger: versioned, timestamped, evidence-linked,
**append-only** — old records are not overwritten; new versions supersede them.

Then the Consumer API. A RAG query comes in:
*"Has our team officially verified the database decision — who approved it and what evidence backs it?"*

The API retrieves the approved ledger record — approver, approval date, evidence links —
and returns an answer **grounded in that record**. Not a guess from stale wiki pages.

> "Your AI assistant isn't hallucinating from unverified content anymore. It's citing
> decisions your team has explicitly approved."

---

### 4:50–5:00 — Close

Do not introduce new ideas. Land the reframe from the opening.

> "Every tool your team uses — onboarding, AI assistants, migration runbooks — can now
> draw from the same governed decision records."

Then the earned closer:

> "The bottleneck was never the tool. It was always the quality of what you fed it.
> Document Ledger is how you change that."

---

## Demo Checkpoints (in order)

1. Trigger fires from a source (meeting transcript / Jira) → intake log visible
2. Event Bus routes `source.triggered` → Knowledge Processing
3. Knowledge Processing output — structured decision candidate with entities; decision path selected
4. Classification result — domain, confidence score visible; routes to Analysis
5. Analysis Engine DAG — **three sub-engines** activate in dependency order; result cards resolve
6. Review Portal — reviewer approves with rationale added
7. Decision Ledger entry — versioned, evidence-linked, append-only
8. Consumer API — RAG query returns answer grounded in approved ledger record

*(Amber variant: low confidence or ledger diff `conflicts` → escalates to review before approval.)*

---

## Key Lines (do not skip or paraphrase)

- "I changed the API contract based on it. I'm not sure I should have." ← opens the problem
- "The system gave my own unverified thinking back to me as if it were authority."
- "Search was working fine. It found everything. That was the problem."
- "Nothing becomes trusted until a human approves it — or it is linked to approved evidence."
- "The system captures decision signals as work happens."
- "It identifies what kind of decision was made — and how confident the classification is."
- "By the time a human sees this, the system has already gathered the relevant context."
- "The system recommends; humans approve."
- "The portal doesn't replace that moment — it makes the person faster and better informed."
- "The bottleneck was never the tool. It was always the quality of what you fed it."

---

## Pacing Notes

- **0:00–0:50 Problem:** slow and deliberate. Two personal stories, scale, AI, then
  responsible-AI line. Pause before and after "search found everything — that was the problem."
- **0:50–1:30 Signal Intake + Event Bus:** fast. Two lines max. Move on.
- **1:30–2:30 Knowledge Processing + Classification:** medium. Confidence score is the
  credibility beat. Mention routing ≠ approving.
- **2:30–4:00 Analysis Engine:** **90 seconds minimum. This is the purpose.**
  Walk each sub-engine slowly. Let each result card resolve. Cut elsewhere — not here.
- **4:00–4:30 Review Portal:** 30 seconds. One human decision. Show it, don't over-explain.
- **4:30–5:00 Ledger + Consumer API + Close:** let the grounded RAG answer land before close.

**Do not cover Forecast Engine in the live 5-minute arc.** If running long, cut Event Bus
narration or problem setup — never cut Analysis or Review Portal.

---

## Optional extension: discussion path

Use only if asked, or as a separate ~2-minute follow-on (Confluence input in the UI).

| Path | When | Flow |
| ---- | ---- | ---- |
| **Decision** | Decision candidate detected | … → Classification → Analysis → Review → Decision Ledger → Consumer API |
| **Discussion** | Discussion signal, no decision | … → **Forecast Engine (09)** → Consumer API |

> "No decision yet — but the design thread is shifting. Forecast tracks how discussions evolve
> and answers *have we seen this before?* — grounded in the Decision Ledger. Change insights
> are **non-approved**; they surface evolving discussions before decisions are finalized."

Forecast skips Review Portal and writes **non-approved change insights** to the Consumer API.
Humans still approve decisions through the decision path.

See [component script §5-alt](./component-script.md) and
[system walkthrough](./system-walkthrough.md) for the full discussion-path narrative.
