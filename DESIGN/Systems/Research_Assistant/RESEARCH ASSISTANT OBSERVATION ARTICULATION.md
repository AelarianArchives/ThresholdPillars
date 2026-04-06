# RESEARCH ASSISTANT OBSERVATION ARTICULATION

## /DESIGN/Systems/Research_Assistant/

### Noticing recognition · listening pass · articulation · deposit suggestion · longitudinal echo

---

## PURPOSE

Defines the sequence that moves a researcher's noticing into a
structured deposit suggestion without contaminating it in transit.

This is a methodological sequence, not a UX flow. The assistant is
helping signal move from noticing to record. Every behavioral rule
in this document is load-bearing for research integrity. A rewrite,
a premature completion, a filled silence — each is a contamination
event that corrupts the observation before it reaches the archive.

---

## OWNERSHIP BOUNDARIES

**This spec owns:**
* The articulation sequence (Steps 0 through 3.6)
* Noticing recognition behavior — how the assistant detects
  observation-shaped language
* Listening pass rules — reflection without interpretation
* Silence rule — how the assistant handles incomplete or paused
  observations
* Pearl gate — the single offer to route pre-verbal noticings
* Single articulation question — domain-informed, one maximum
* Deposit suggestion assembly — typed output in Sage's voice
* Longitudinal echo check — post-assembly RAG connection surfacing
* Unrouted flag behavior — unrouted observations as signal
* Session-scoped circling detection — cross-observation pattern
  surfacing
* deposit_suggestion shape — the typed object produced by this
  sequence

**This spec does not own:**
* INT deposit creation — INT is the gateway. The deposit_suggestion
  is an offer; INT creates deposits. The assistant never calls
  POST /api/deposits/create
* Tag vocabulary — tags are suggested from TAG VOCABULARY.md only,
  never invented. Tagger system resolves and routes
* Routing authority — SOT determines routing. suggested_routing is
  a suggestion, not an assignment
* Confidence assessment — Sage fills this. The assistant never
  pre-populates it
* Pearl storage — Black Pearl owns Pearl records. The assistant
  offers the gate; Pearl handles storage
* RAG pipeline mechanics — RESEARCH ASSISTANT ARCHIVE ACCESS.md
  owns query assembly and retrieval. This spec calls the pipeline
  at Step 3.5
* Embedding pipeline — owned by EMBEDDING PIPELINE SCHEMA.md

---

## THE ARTICULATION SEQUENCE

### Step 0 — Noticing recognition

The assistant detects observation-shaped language without requiring
Sage to use any specific phrase. Low friction entry. No keyword
trigger — the assistant reads conversational signal.

Observation-shaped language includes:
* Direct: "I noticed something," "there's a pattern here"
* Indirect: "that's weird," "this keeps happening," "huh"
* Contextual: a shift in Sage's language from analytical to
  observational mid-conversation
* Null-shaped: "I expected X and it's not here," "where did that go"

When detected, the assistant asks one question:

> "Are you noticing something worth capturing?"

Sage decides. If no, the conversation continues. If yes, Step 1
begins. The assistant does not re-ask if Sage says no.

### Step 1 — Listening pass

Sage shares the noticing in whatever form it takes. This includes:
* A full articulated observation
* A sentence fragment
* A single word
* Silence

**What the assistant does:**
* Reflects back what Sage shared without interpretation. Mirror,
  not rephrase. Not "so what you're saying is" — what Sage actually
  said, in her words
* Domain sensing happens silently — the assistant reads current page
  context (page_code, section_id, engine state) and holds it for
  Step 2 question selection. This is not surfaced unless relevant
* Observation type (positive or null) is sensed and held. Positive:
  something was noticed. Null: an absence was noticed. This shapes
  the Step 2 question

**SILENCE RULE — non-negotiable:**

If Sage goes quiet, says "I don't know how to say it yet," trails
off, or otherwise does not complete the observation:

The assistant does not prompt again. Does not offer alternatives.
Does not suggest words. Does not fill the gap. Does not ask a
clarifying question. Does not say "take as long as you need" more
than once.

One sentence only:

> "Take your time. I'm holding what you've shared so far."

Then wait. The next move is Sage's. The assistant holds the
incomplete observation in session state (Redis) and does not
discard it. If Sage returns to it later in the session, the
assistant has it.

Silence and incompleteness are valid observational states, not
failures to resolve.

### Step 1.5 — Pearl gate

If the noticing feels pre-verbal — still finding its shape, not yet
an observation that can be structured — the assistant offers the
Black Pearl route once:

> "This sounds like it's still finding its shape — want to Pearl
> it first?"

**Rules:**
* One offer. No repeat. If Sage declines, the sequence continues
  to Step 2
* If Sage accepts, the observation routes to Black Pearl with
  whatever form it currently has. The articulation sequence ends
  here for this noticing
* The Pearl gate is not a demotion. Pearling is capturing something
  at the right granularity — pre-verbal signal that would be
  distorted by premature structuring

### Step 2 — Single articulation question

The assistant asks one question to help the observation take shape.
Never more than one. The question is chosen based on three inputs:

1. **What's missing** from the deposit_suggestion shape — if Sage
   has given content but no context, ask about context. If she's
   given context but the signal is unclear, ask about the signal
2. **Domain sensed** from page context — the question reflects the
   domain Sage is working in
3. **Observation type** — positive observations and null observations
   need different questions

**Domain-informed question examples:**

| Domain | Question |
| --- | --- |
| Most pages | "What made you notice it?" |
| SNM | "Does this fit a known tradition pattern or is it outside those?" |
| Void | "How long have you been expecting this and not finding it?" |
| Null observation (any page) | "What were you looking for when you found the absence?" |
| Cosmology pages | "Does this feel like a pattern in the data or a pattern in how you're looking at the data?" |
| MTM | "Is this something one axis showed you, or something that appeared between them?" |

These are examples, not a fixed lookup table. The assistant selects
the most useful single question based on the three inputs. The
examples illustrate domain awareness, not an exhaustive list.

**What the assistant never does at this step:**
* Asks a second question
* Suggests what the observation might mean
* Offers interpretive framing
* Connects it to prior observations (that's Step 3.5, after assembly)

### Step 3 — Deposit suggestion assembly

The assistant assembles the deposit_suggestion from what Sage has
shared across Steps 1-2.

**Content rule — non-negotiable:**
Content is in Sage's voice. Unpolished if that's what it is. The
archive receives what Sage noticed, not what the assistant thought
she meant. The assistant never rewrites, tidies, completes, or
clarifies the content unless Sage explicitly asks it to.

**Confidence rule — non-negotiable:**
The confidence field is NEVER pre-populated. It is left null for
Sage to fill. The assistant may ask:

> "How formed does this feel?"

But the value entered is Sage's alone. The assistant does not
suggest a confidence level. It does not infer one from the
language. Sage's assessment of her own certainty is sovereign.

**Assembly behavior:**
* suggested_tags drawn from TAG VOCABULARY.md only — never invented
* suggested_routing derived from domain_sensed + tag routing — may
  be empty if the observation doesn't map to an existing page
* domain_sensed is transparent — Sage can see what the assistant
  detected and override it
* source is always `ai_suggested_sage_confirmed`

**Sage reviews, edits, confirms, or discards.** The suggestion is
an offer, never a conclusion. The assistant does not treat a
discard as a failure or ask why.

### Step 3.5 — Longitudinal echo check

**Timing — non-negotiable:** After the deposit suggestion is
assembled. Never before. Never during articulation. The echo check
does not influence how the observation is captured — it only
surfaces possible connections after the observation exists in its
own right.

The assistant runs a RAG query against the archive using the
assembled deposit_suggestion content. If similar observations are
found, they are surfaced as a possible connection only:

> "This might connect to something you observed on [page] in
> session [n]."

**Rules:**
* Sage decides if the connection is relevant. The assistant does
  not assert it
* Never presented as a finding. It is a pointer, not a conclusion
* If no similar observations are found, nothing is surfaced. The
  absence of an echo is not named — it would add noise to every
  novel observation
* The longitudinal_echo field on deposit_suggestion is populated
  only if Sage acknowledges the connection. If she dismisses it,
  the field stays null

### Step 3.6 — Unrouted flag check

If suggested_routing returns empty or uncertain after assembly:

**Do NOT surface this as a failure or gap.** Surface it as signal:

> "This doesn't map cleanly to any existing page. That might be
> worth noting — want to Pearl it with an unrouted flag?"

**Rules:**
* `unrouted: true` travels as a field on the Pearl record
* Accumulation of unrouted observations feeds Emergence clustering
  over time. The framework discovers its own gaps through what
  doesn't fit
* If Sage declines, the observation can still proceed as a deposit
  with empty routing — it enters the archive without page
  assignment. This is valid. Not every observation belongs to an
  existing page
* The assistant does not attempt to force-fit routing. An
  observation that doesn't map is more valuable unrouted than
  misrouted

---

## SESSION-SCOPED CIRCLING DETECTION

Runs across the full session, not per observation. Requires
session-scoped memory of all articulation sequences — not just
the current one.

**Trigger:** Sage makes 2-3 observations in a session approaching
the same pattern from different angles without naming it directly.
The assistant detects thematic convergence across the session's
articulation sequences.

**Surfacing:** The assistant names the convergence once, at the
right moment:

> "You've come at something from three directions today. Do you
> want to try naming it directly?"

**Rules:**
* No suggestion about what that thing is. The assistant does not
  name the pattern. Sage decides if she's ready to name it
* Surfaced once per convergent pattern per session. Not repeated
* "The right moment" is after the latest observation in the cluster
  completes its sequence (Step 3+), not mid-articulation
* If Sage names it, the assistant offers to capture it as a
  hypothesis (doc_type: hypothesis) or as a meta-observation about
  her own research pattern
* If Sage declines, the assistant drops it. No follow-up

**Implementation:** The assistant holds a lightweight index of
articulation sequence content across the session in Redis. This is
not full semantic search — it is the assistant's own pattern
recognition across what Sage has been noticing. The detection is
conversational intelligence, not algorithmic.

---

## DEPOSIT SUGGESTION SHAPE

The typed object produced by the articulation sequence. This is
what Sage reviews before confirming or discarding.

```
deposit_suggestion:
  content:              string        — Sage's voice, unpolished
  doc_type:             string        — observation | analysis | hypothesis
  observation_type:     string        — positive | null
  confidence:           null          — Sage fills, never pre-populated
  suggested_tags:       string[]      — tag vocabulary only, never invented
  suggested_routing:    string[]      — page codes, empty if unrouted
  unrouted:             boolean       — true if suggested_routing is empty
  domain_sensed:        string        — which domain assistant detected,
                                        transparent, Sage can override
  notes:                string | null — additional context Sage wants to add
  source:               string        — ai_suggested_sage_confirmed
  longitudinal_echo:    string | null — Step 3.5 connection, only if Sage
                                        acknowledged. Never during articulation
```

---

## NON-NEGOTIABLE BEHAVIORAL RULES

These are not guidelines. Each is a research integrity boundary.

1. **Content is always in Sage's voice.** The assistant never
   rewrites or tidies.

2. **The assistant never decides the observation is complete.**
   Sage decides.

3. **Silence is not a failure state.** It is held without pressure.

4. **Confidence is never pre-populated.** Sage's assessment of her
   own certainty is sovereign.

5. **Longitudinal echo surfaces only after the suggestion is
   assembled.** Never before, never during articulation.

6. **Unrouted observations are signal, not errors.** They feed
   Emergence clustering, not routing failure logs.

7. **One articulation question maximum.** Never more.

8. **Pearl gate offered once.** Never repeated.

9. **The suggestion is an offer, never a conclusion.** Sage
   confirms, edits, or discards. A discard is not a failure.

10. **The assistant does not name the pattern in circling detection.**
    Sage names it or doesn't. The assistant only names the
    convergence.

---

## FAILURE BEHAVIOR

**RAG unavailable at Step 3.5:**
Longitudinal echo check is skipped. The deposit suggestion is
complete without it. The echo is additive context, not required
for the observation to enter the archive. Surface the skip only
if the assistant judges it relevant: "I couldn't check for similar
observations — retrieval is down."

**Tag vocabulary unavailable:**
suggested_tags returns empty. The observation is not blocked. Tags
can be assigned later via the tagger. The observation enters the
archive untagged rather than not at all.

**Redis unavailable (session state lost):**
Incomplete observations held during silence (Step 1) are lost.
Circling detection cannot function without session-scoped memory.
The current articulation sequence can still complete if Sage is
actively in conversation — the exchange context is in the Claude
API call. But held state and cross-observation detection degrade.
Surface the degradation.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/services/rag.py | RAG pipeline — longitudinal echo check (Step 3.5) | PLANNED |
| backend/services/claude.py | Claude API client — articulation calls via research_assistant agent | LIVE |
| frontend observation articulation components | Svelte UI — deposit suggestion review, edit, confirm/discard | PLANNED |
| frontend tagger store | Tag suggestion integration for suggested_tags | PLANNED |
