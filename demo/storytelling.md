# 5-Minute Demo Storytelling Plan — Knowledge Ledger

## Context
The narrative begins from a real individual pain point — the experience of searching for
information and not being able to trust what you find — before scaling to the organizational
and AI-layer consequences. The Analysis Engine is the technical centerpiece and gets the
most demo time. Everything before it earns that moment. Everything after it lands the payoff.

Tone: first-person confession opening, then present-tense discovery, then technical depth,
then human accountability, then earned close. No slide-deck detachment.

Avoid: "source of truth" (overused), "documentation tool" framing, announcing the insight
before the audience feels it.

---

## Narrative Arc (5 min)

### 0:00–0:50 — The Problem (individual → organizational → AI)

Open in the present tense of discovery. Do not announce the problem. Let it arrive.

> "I'm on a new feature. My team has been researching the approach for two weeks —
> spikes, Confluence pages, Jira threads. I open Glean and search. I find a document.
> It looks complete. Well-structured. Someone wrote it recently. I act on it.
> I'm not sure I should have."

Beat. Then the second story:

> "A few days later I search the same topic again — looking for the real answer, something
> external to confirm my thinking. The first result is my own document. The system gave
> my own unverified thinking back to me as if it were a source of authority. It can't tell me
> whether I was right. It can only tell me I wrote it."

Then scale it:

> "Multiply that across a team. Across an organization. Everyone is writing diligently —
> Jira tickets close, Confluence pages publish, Slack threads reach conclusions.
> No one is doing anything wrong. But the organization ends up with many sources of
> information and no way to tell which one to trust."

Then the reframe — do not announce it, let it land:

> "We kept asking: what's the better search tool? But search was working fine.
> It found everything. That was the problem."

Then add AI:

> "Now put an AI assistant into that retrieval layer. It doesn't carry your hesitation.
> It doesn't pause the way you did. It answers — with confidence — from the same
> unverified pool. Your uncertainty disappears. Only the answer remains."

**The gap isn't information. It's verification.**

---

### 0:50–1:30 — Signal Intake (Modules 01–02)

Move fast. This is plumbing. Show it works, don't explain it.

> "Knowledge Ledger starts where decisions actually live."

Show a trigger: a Jira ticket closes. A Confluence page publishes. The Signal Intake Engine
picks it up. No one had to remember to import it. No copy-paste. The event hits the queue.

> "The system doesn't wait for someone to remember to document a decision. It listens."

That's enough. Move on.

---

### 1:30–2:30 — Knowledge Processing + Classification (Modules 03–04)

Medium pace. This is the credibility moment — show the system understands, not just stores.

Raw content is fetched, normalized, broken into semantic chunks. Entities extracted — the
people involved, systems affected, date, rationale. Then Classification: business decision
or technical? What domain? The system scores its own confidence. High-confidence routes
automatically. Ambiguous ones escalate.

> "It doesn't index text. It understands what kind of decision was made — and how sure
> it is about that."

The confidence score matters — it's the first signal that this system has judgment, not just
retrieval.

---

### 2:30–4:00 — Analysis Engine (Module 05) ← SLOW DOWN HERE

This is the purpose of the demo. Everything before was setup. Zoom into the ReactFlow DAG.

A classified decision arrives. The Analysis Engine receives it. Four sub-engines activate —
show them as a live DAG, edges animating in dependency order, each node resolving before
the next fires.

**Walk each node as it activates:**

**Impact Engine** — fires first
Traverses the knowledge graph. Lights up which services, teams, and projects are in the
blast radius. Edges animate as dependencies are traced.
> "It maps what this decision touches — before anyone has to ask."

**Similarity Engine** — runs in parallel with Impact
Vector and lexical search over the ledger. Surfaces decisions that look like this one.
Shows what happened after.
> "Has your organization made this call before? Here's the record."

**Forecast Engine** — depends on Similarity output
Synthesizes patterns from past precedents. Outputs a consequence probability, a timeline
estimate, a risk signal.
> "Based on what happened last time — here's what to watch for."

**Recommendation Engine** — depends on Impact + Forecast
Synthesizes all three upstream outputs. Produces governance next-steps: escalate,
document rationale, flag a conflict, assign an owner.
> "By the time a human sees this, the system has already done the research."

Let each result card resolve visually before moving on. Don't rush this. The DAG activating
in dependency order IS the demo.

---

### 4:00–4:30 — Review Portal (Module 06)

Brief. The Analysis Engine already did the setup — this is the release valve.

A reviewer opens the portal. They see the decision candidate, impact map, similar
precedents, forecast, recommended next steps. Everything the Analysis Engine produced,
presented for a human to act on. They can edit, add rationale, approve, or reject.

> "Some things shouldn't be fully automated. When trust is involved, someone has to own
> it. The portal doesn't replace that moment — it makes the person in that moment faster
> and better informed."

One click: approved. The ledger writes.

---

### 4:30–4:50 — Decision Ledger + Consumer API (Modules 07–08)

The payoff. Show it quickly but let the contrast land.

The approved decision enters the ledger: versioned, timestamped, evidence-linked, immutable.

Then the Consumer API. A RAG query comes in:
*"Why did we choose Postgres over DynamoDB?"*

The API returns the ledger entry — the decision-maker, the date, the tradeoff, the approval.
Not a summary. Not a generated answer. The verified record.

> "Your AI assistant isn't guessing anymore. It's drawing from knowledge your team has
> explicitly verified."

---

### 4:50–5:00 — Close

Do not introduce new ideas. Land the reframe from the opening.

> "Every tool your team uses — onboarding, AI assistants, migration runbooks — can now
> draw from the same verified foundation."

Then the earned closer:

> "The bottleneck was never the tool. It was always the quality of what you fed it.
> Knowledge Ledger is how you change that."

---

## Demo Checkpoints (in order)
1. Trigger fires from a source (Jira/Confluence) → intake log visible
2. Knowledge Processing output — structured decision candidate with entities
3. Classification result — domain, confidence score visible
4. Analysis Engine DAG — all four nodes activate in dependency order, result cards resolve
5. Review Portal — reviewer approves with rationale added
6. Ledger entry — versioned, evidence-linked, immutable
7. Consumer API — RAG query returns grounded ledger answer

---

## Key Lines (do not skip or paraphrase)
- "I'm not sure I should have." ← opens the problem; sets the tone
- "The system gave my own unverified thinking back to me as if it were authority."
- "Search was working fine. It found everything. That was the problem."
- "The system doesn't wait for someone to remember to document a decision. It listens."
- "It doesn't index text. It understands what kind of decision was made."
- "By the time a human sees this, the system has already done the research."
- "The portal doesn't replace that moment — it makes the person faster and better informed."
- "The bottleneck was never the tool. It was always the quality of what you fed it."

---

## Pacing Notes
- 0:00–0:50 Problem: slow and deliberate. Two personal stories, then scale, then AI.
  Do not rush the reframe. The "search found everything — that was the problem" line needs
  a pause before and after.
- 0:50–1:30 Signal Intake: fast. Show it works. Two lines max per module. Move on.
- 1:30–2:30 Classification: medium. The confidence score is the credibility beat. Linger
  briefly on it — it's the first proof the system has judgment.
- 2:30–4:00 Analysis Engine: **90 seconds minimum. This is the purpose.**
  Walk each node slowly. Let each result card resolve before the next fires.
  If the demo runs long anywhere else, cut there — not here.
- 4:00–4:30 Review Portal: 30 seconds. The Analysis Engine did the setup. The portal
  is one human decision. Show it, don't explain it.
- 4:30–5:00 Ledger + Consumer API + Close: the contrast between "AI guessing" and
  "AI drawing from verified knowledge" is the final emotional beat. Let the RAG answer
  land before you close.
