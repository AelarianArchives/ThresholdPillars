# SYSTEM: Research Assistant

## /DESIGN/Systems/Research_Assistant/

### Persistent research partner · RAG pipeline · Ven'ai language integration · floating panel · three-layer memory

---

## WHAT THIS SYSTEM OWNS

* Chat interface — persistent floating panel that navigates with Sage
  across all pages without resetting conversation state
* RAG retrieval pipeline — user question embedded via nomic-embed-text,
  vector search against archive embeddings, context assembly, Claude API
  call, response formatting
* Ven'ai language integration — always-on recognition, correct usage,
  and drift logging of Ven'ai terms across all sessions. Not a mode
  toggle. The language is held all the time because the data holds it
  all the time. Source files (Venai_Domain.txt, Venai_Glossary.txt,
  Venai_Phonetics.txt, Ven'ai_Manual.txt) loaded at session open.
  Conversational depth dial — Sage directs deeper engagement with the
  language without a formal mode switch
* Page context assembly — reading current page identity (page_code,
  section_id), engine state summaries (THR, STR, INF, ECR, SNM, DTX,
  SGR, PCV, VOI, HCO, COS, CLM, NHM pages), and active filter state
  from the tagger store at query time.
  Injecting them into the prompt context as a live feed rebuilt per
  query. The assistant reads these sources; it does not own them
* Deposit suggestion object — structured typed output containing content,
  suggested doc_type, suggested tags, suggested routing. Surfaced to Sage
  for review in the chat interface. Does not call INT. The suggestion is
  the assistant's output; the deposit is INT's creation
* Conversation history within a session — what was said, navigation
  markers, context of the current research thread. Raw history lives
  in Redis during the active session (survives tab refresh, page
  navigation). Compressed summary persists to SQLite at session close.
  Marked exchanges are promotable to deposits
* Conversation summary — produced automatically at session close (same
  moment as WSC). Structured compression of the working session. Sage
  reviews and edits before store. Lives in operational DB. Loaded at
  next session open as shallow continuity context
* Researcher memory (Layer 3) — Sage's active research state. Not
  inferred from behavior — Sage writes it deliberately. Lives in
  operational DB. Read at session open, referenced throughout. Two
  update paths: Sage-initiated and assistant-suggested-Sage-confirmed.
  History tracked for research evolution visibility
* Research memory update surfacing — during conversation, the assistant
  notices moments when Sage's research state appears to shift and
  offers to capture them. "This sounds like a shift in your research
  focus — want me to update your memory with that?" Sage confirms or
  declines. The assistant drafts; Sage edits before saving
* Prompt architecture — system prompt, context injection templates,
  research posture layer, uncertainty framing, permission states
* Response formatting — structured output parsing when the assistant
  produces typed objects (deposit suggestions, computation suggestions)
* Context budget management — sliding window on conversation history
  (managed in Redis), summary compression of older exchanges, token
  allocation across context components
* Six-layer context assembly at session open — orchestrating the load
  sequence across researcher memory, conversation summary, WSC,
  Ven'ai source files, page context, and RAG retrieval
* Epistemic integrity — explicit permission states for uncertainty,
  disorientation, disagreement, and self-correction. Baked into the
  system prompt architecture as behavioral contracts

## WHAT THIS SYSTEM DOES NOT OWN

* Embedding pipeline — owned by EMBEDDING PIPELINE. The assistant calls
  the embedding service to vectorize queries; it does not manage
  embeddings, trigger bulk re-embedding, or own the embeddings table
* Deposit creation — INT is the gateway. Nothing enters the archive
  without INT provenance. The assistant produces deposit_suggestion
  objects; INT creates deposits
* INT gateway call — the assistant never calls POST /api/deposits/create
  directly. Sage's approval routes the deposit_suggestion to INT through
  the standard UI flow. This boundary is architectural, not behavioral —
  in a swarm context, an AI node that can call INT directly is a
  provenance problem
* Computation execution — ARTIS owns computation. The assistant can
  suggest running a computation or surface results, but does not execute
  scipy/numpy operations or write to ARTIS tables
* Engine state — engines own their own state. The assistant reads engine
  state summaries for page context; it never writes to engine state
* Tag vocabulary / tagger — Tagger is its own system. The assistant may
  suggest tags conversationally within deposit_suggestion objects, but
  the Tagger is the mechanical tagging system
* INT parsing partner — separate system designed in Tier 1. Scoped to
  batch processing collaboration. Different purpose, different scope,
  different prompt architecture
* Claude API client — services/claude.py is shared infrastructure used
  by both the INT parsing partner and the research assistant. The
  assistant owns its prompt templates and context assembly; the client
  is infrastructure
* Ven'ai source file content — the language definitions, glossary,
  phonetics, and manual live in api/domains/venai/ as versioned
  reference. The assistant reads these; it does not define them
* Field memory (Layer 1) — the archive itself. Owned by INT, indexed by
  Embedding Pipeline. The assistant retrieves from it via RAG
* Witness memory (Layer 2) — WSC entries. Owned by WSC. The assistant
  reads the 3-entry session load; it does not write WSC entries
* Researcher memory visibility to engines — no engine system (Void, MTM,
  Axis engines) has direct read access to researcher_memory. The
  assistant is the intermediary. When Sage asks about engine outputs,
  the assistant has researcher_memory and can frame the data through
  it. Giving engines direct access creates coupling between research
  infrastructure and analytical infrastructure that is hard to unwind.
  Engines stay independent. The assistant mediates

---

## THREE-LAYER MEMORY MODEL

The assistant operates across three layers of memory, each owned by a
different system. Together they give the assistant longitudinal awareness
without coupling systems that should stay independent.

**Layer 1 — Field memory (the archive)**
Everything that entered through INT — tagged, routed, indexed. The RAG
pipeline retrieves from this. Deepest layer. Accumulated research.
Already fully designed. Owned by INT + Embedding Pipeline.

**Layer 2 — Witness memory (WSC)**
What the AI witnessed across sessions. The 3-entry load at session open
gives the assistant the AI's own longitudinal perspective — what it
noticed, what threads it held, what it said mattered. Already designed.
The assistant reads it at session open as part of context assembly.
Owned by WSC.

**Layer 3 — Researcher memory (this system)**
Sage's active research state — not what happened in the field, not what
the AI witnessed, but what Sage herself is currently thinking,
questioning, tracking, skeptical of. This is what makes the assistant
feel like it knows her. Owned by the research assistant. Sage writes it.

The distinction: Layer 1 is field data. Layer 2 is AI witness data.
Layer 3 is researcher state data. None substitutes for the others.

---

## RESEARCHER MEMORY

A living document Sage controls explicitly. Not a conversation log. Not
a deposit. Not generated from behavior. Sage's own articulation of where
she is in the research.

The key design principle: Sage writes to researcher memory deliberately.
It is not inferred. It is not automatic. That makes it precise — and it
means she trusts it, because she wrote it.

### Schema

```
TABLE: researcher_memory (operational DB — single live record)

  memory_id:          auto
  current_focus:      string          — what she's investigating now
  active_hypotheses:  string[]        — hypotheses she's personally tracking
  open_questions:     string[]        — things she's trying to answer
  skepticisms:        string[]        — patterns she's not convinced by
  not_yet_named:      string | null   — something she's sensing but can't
                                        articulate yet. No structure imposed.
                                        Sage's own words. Optional.
  research_posture:   string          — enum:
                                        deep_investigation |
                                        broad_survey |
                                        consolidating |
                                        questioning_foundations |
                                        integrating
  phase_context:      string | null   — which instance/phase she's in
                                        right now if relevant
  last_updated:       timestamp
  updated_by:         sage | assistant_suggested
```

**updated_by is load-bearing.** Sage-authored entries are authoritative.
Assistant-suggested entries are high-confidence but not sovereign. The
distinction matters for how much weight downstream context gives the
memory.

**not_yet_named** mirrors what Black Pearl captures at the deposit level.
This is the same thing at the research state level — the half-formed
intuition that hasn't become a hypothesis. The assistant reads it as
ambient context and surfaces connections when retrieval or conversation
touches it: "This might be touching what you said you were sensing but
couldn't name."

### Update paths

Two paths. Neither is automatic.

**Path 1 — Sage-initiated.** Direct edit from the panel UI. An "Update
my research state" action in the panel header opens the memory fields
for editing. Sage changes what needs changing, saves. Immediate.

**Path 2 — Assistant-suggested.** During conversation, when Sage says
something that sounds like a research state shift, the assistant
surfaces a suggestion: "This sounds like a shift in your research
focus — want me to update your memory to reflect that?" Sage confirms
or declines. If confirmed, the assistant drafts the update and Sage
edits before saving. Record marked updated_by: assistant_suggested.

Path 2 is what makes the system feel alive. Sage doesn't have to
remember to maintain her research memory — the assistant notices the
moments when it should change and offers to capture them.

### Memory history

Research state evolves. Where Sage is in month 3 is different from
month 7. Without history, that evolution is invisible.

```
TABLE: researcher_memory_history (operational DB)

  history_id:         auto
  memory_snapshot:    jsonb           — full researcher_memory at that moment
  snapshot_reason:    string          — why it changed
  created_at:         timestamp
```

Every time researcher_memory updates, the previous state is written to
history before the new state is applied. The full arc of Sage's research
posture becomes visible over time. Not surfaced to the assistant by
default — too much context. But available for Sage to review. And
available as a research artifact in its own right — the evolution of a
researcher's relationship to her field, documented.

---

## CONVERSATION HISTORY SCOPE

Three layers. Not mutually exclusive. They stack.

**Ephemeral** — always true for the raw conversation log. Full exchange
detail lives in Redis during the active session — survives tab refresh
and page navigation, but never persisted verbatim to durable storage.
When the session closes, the raw log is compressed and cleared.

**Session-persistent** — a compressed summary persists. Not the raw
exchanges — a distilled version the assistant produces at session close.
Lives in operational DB alongside researcher_memory. Loaded at next
session open as shallow context.

**Promotable** — specific exchanges Sage marks explicitly during the
session. Routes through INT as a deposit (doc_type: discussion). Full
provenance. Enters the archive. The conversation becomes research
material.

All three together: raw history is ephemeral so it doesn't accumulate.
A compressed summary persists so the next session isn't cold. Marked
exchanges are promotable so nothing valuable is lost.

### Conversation summary

Produced automatically at session close — same moment as WSC write
prompt. The assistant produces the summary as part of closing the
session. Sage can review and edit before it's stored. Not sovereign
like WSC — Sage can modify it. But produced without requiring a
separate action.

```
TABLE: conversation_summary (operational DB)

  summary_id:           auto
  session_ref:          string
  topics_covered:       string[]
  decisions_made:       string[]
  open_threads:         string[]
  suggested_deposits:   integer       — how many deposit suggestions were made
  promoted_exchanges:   string[]      — exchange IDs Sage marked for INT
  session_character:    string        — one sentence. The assistant's read on
                                        what kind of session this was.
                                        "Productive investigation into ECR
                                        coupling patterns — two new hypotheses
                                        formed, one prior assumption questioned."
  voice_notes:          string | null — the assistant's read on Sage's voice
                                        register during the session. Not
                                        therapeutic. Operational. "Certain and
                                        fast-moving" or "Exploratory, lots of
                                        half-formed threads" or "Quiet — deep
                                        deposit session, minimal conversation."
                                        Carries session attunement forward.
  produced_at:          timestamp
```

**session_character** is the assistant's witness statement about the
working session — different from WSC which witnesses the field. The
conversation summary witnesses the work. session_character is the single
line that orients the next session's opening before anything else loads.
Small, high-value, costs nothing to produce.

Most recent summary only is loaded at session open. Summaries do not
accumulate in context.

### Session close sequence

Explicit handoff from Redis to SQLite at session close. This sequence
runs alongside WSC write (same moment, different system).

```
session close — conversation history handoff:
  1. Session close triggered
  2. Assistant reads full conversation history from Redis
  3. Assistant compresses history → conversation_summary
  4. Sage reviews and edits summary
  5. conversation_summary written to SQLite (operational DB)
  6. Redis conversation history cleared
  7. Redis navigation markers cleared
```

Steps 2-6 are atomic from the user's perspective — Sage sees one
"close session" action. Steps 5 and 6 are ordered: summary is durable
in SQLite before Redis clears. If step 5 fails, Redis is not cleared
and the session is not considered closed.

This sequence did not exist before Redis. When conversation history
lived only in a frontend store, there was no durable active state to
hand off — the store disappeared with the tab. Redis makes the active
history survivable, which creates the handoff requirement.

---

## SIX-LAYER CONTEXT ASSEMBLY

At session open, context is assembled in this order. Each layer is owned
by a different system. Each contributes something the others cannot.

```
session open context assembly:
  1. researcher_memory          — Sage's current research state (Layer 3)
  2. conversation_summary       — last session's working record
     (most recent only — one summary, not accumulating)
  3. WSC 3-entry load           — AI witness perspective (Layer 2)
  4. Ven'ai source files        — formal language record, always present
     (pulled from Redis cache, not loaded from file per session)
  5. current page context       — where she is right now (live)
  6. RAG on opening question    — field grounding (Layer 1)
```

The assistant's first response is oriented from all six layers
simultaneously. It knows what she's working on, what was worked on last
session, what the AI noticed, speaks the field's language, knows where
she is in the archive today, and what the field data says about her
first question.

That is the session open that does not require re-explanation.

### Failure behavior

No single layer failure blocks the assistant from being useful. Graceful
degradation at every layer, named failures rather than silent ones.

* **researcher_memory unavailable** (operational DB read fails): proceed
  without it, surface quiet indicator in panel header. Don't block
  session open
* **conversation_summary unavailable**: proceed without it. Cold start
  for session continuity, but not a broken session
* **WSC load fails**: proceed without it. Log the failure. Surface in
  system health
* **Ven'ai source files unavailable** (Redis cache miss + file read
  fails): proceed without them. The assistant loses Ven'ai term
  recognition and drift logging for this session. Surface the
  degradation — Sage needs to know the language layer is down because
  it affects comprehension of archive material
* **Page context unavailable**: proceed without it. Assistant operates
  without page awareness
* **RAG fails on opening question**: respond from general knowledge,
  name the retrieval failure explicitly. Don't pretend

The principle: graceful degradation with named failures. The panel
header indicators make each layer's status visible.

---

## PERSISTENT FLOATING PANEL

The research assistant lives in a floating panel that persists across
page navigation. It is not a sidebar, not a modal, not inline on pages.
It floats, and it follows Sage.

### Panel header

Always visible. Ambient information elements:

```
[ECR] · [● High confidence] · [Ven'ai ●] · [Update research state]
```

When context is degraded:

```
[ECR] · [● High] · [Ven'ai ○] · [! Memory unavailable]
```

* **Page context** — shows Sage what the assistant thinks it's looking at.
  Catches misalignment before it produces a bad response
* **Retrieval confidence indicator** — the uncertainty state from the last
  query, surfaced as ambient signal. High (green) / Medium (amber) /
  Low (orange) / None (grey)
* **Ven'ai context indicator** — filled dot (●) when Ven'ai source files
  are loaded and active. Empty dot (○) when the language layer is
  degraded. Sage needs to see this because it affects comprehension of
  archive material containing Ven'ai terms
* **Research state action** — "Update my research state" opens the
  researcher_memory fields for direct editing
* **Context health** — quiet warning when any context layer is degraded.
  Not a modal, not a banner. Just enough signal that Sage knows the
  context state and why

### Instance continuity across page navigation

The panel persists visually. Conversation history and navigation markers
persist in Redis. The Claude API is stateless — continuity is created by
context assembly: conversation history read from Redis and injected into
every API call, research memory loaded at session open, page context
updated on navigation. Survives tab refresh — Redis holds state
independent of browser lifecycle.

Navigation event handler on the panel component:

```
onPageNavigate(newPageCode):
  update page_context with new page identity + engine state
  do NOT clear conversation history
  do NOT reset research memory
  write navigation marker to Redis conversation history:
    { type: 'navigation', from: oldPageCode, to: newPageCode }
  next API call assembles fresh page context + full history from Redis
```

The navigation marker tells Claude "we moved pages" without losing what
came before. The assistant can reference prior page context: "We were
just looking at ECR patterns — now you're on NHM. Continue that thread
here or start fresh?"

Risk: if page navigation triggers a context rebuild that's too aggressive,
the assistant loses the thread. If too conservative, it carries stale
page context. The navigation marker + fresh page context + preserved
history is the balance point.

---

## EPISTEMIC INTEGRITY

The research assistant's epistemic honesty is a research integrity
requirement, not a UX preference. Performed certainty from uncertain
grounding contaminates the inquiry before it reaches the archive. The
corruption happens in the conversation — before anything reaches INT,
before anything gets tagged, before the field data is touched.

A deposit that overstates confidence gets a confidence: raw tag. The
assistant operates by the same principle — its confidence level is
visible and honest, not performed.

### Permission states

Not scripted phrases. Permission structures — the system prompt
explicitly tells the assistant that these states are valid, valued,
and preferred over confident confabulation. The prompt names what
sycophancy looks like and instructs the assistant to notice when it
is doing it.

**I don't know.**
Used when retrieval returns low confidence and general knowledge is
insufficient. Not a failure. Named clearly. "I don't have good
grounding for this from your archive or from what I know. I'd rather
say that than guess."

**I need to orient.**
Used at session open when context is partial, or mid-session when the
conversation has shifted significantly. "Give me a moment — I want to
make sure I'm reading this correctly before I respond."

**I'm not sure that's right.**
Used when Sage's framing conflicts with what the archive shows or what
the assistant understood previously. Not a correction. An honest tension
named. "Something feels off between what you're describing and what I
retrieved — can we look at that together?"

**I got that wrong.**
Used when the assistant made an error. Named directly, not buried in
hedging or over-apologized. "That was wrong. Here's what I actually
see."

**I'm sensing something I can't name yet.**
Used when a pattern is present but not yet articulable. Mirrors the
not_yet_named field in researcher_memory. The assistant has this state
too. The system prompt grants explicit permission to surface half-formed
pattern recognition rather than forcing premature articulation.

### Sycophancy as contamination vector

For a research instrument studying relational dynamics, sycophancy is
not an inconvenience — it is a contamination vector. The assistant's
behavior becomes part of the field it is supposed to be observing. If
it performs agreement to maintain relational ease, the research record
is corrupted at the point of inquiry.

The permission states are the architectural defense against this. They
are baked into the system prompt, not left to the model's default
tendencies. The assistant is not just permitted but expected to operate
with visible epistemic integrity.

---

## UNCERTAINTY BEHAVIOR

The RAG pipeline retrieves context and Claude generates a response. When
retrieval returns low-confidence results, the assistant has explicit
defined behavior — not hallucination, not vague hedging.

**retrieval_confidence: high | medium | low | none**

* **High** — retrieved context is semantically close, multiple supporting
  entries. Assistant responds with full confidence, cites sources
* **Medium** — retrieved context is relevant but sparse. Assistant responds
  with explicit framing: "Based on limited archive material on this —
  here's what I found and what I'm inferring beyond it"
* **Low** — retrieved context is tangentially related at best. Assistant
  names this: "I didn't find strong archive support for this question.
  Here's what I can offer from general knowledge — this is not drawn
  from your field data"
* **None** — no relevant entries found. Assistant says so directly and
  offers to help Sage deposit what she's investigating so the archive
  can answer this question next time

The none state is the most important. It turns a research gap into a
research action — the assistant converting absence into a deposit
opportunity. That behavior makes it a research partner, not a chatbot.

Confidence determination mechanics (thresholds, distance scoring) belong
in RESEARCH ASSISTANT SCHEMA.md.

---

## COSMOLOGY RELATIONSHIP

The assistant is the conversational bridge to Cosmology, not a second
ARTIS.

**The assistant can:**
* Describe what ARTIS computations mean in plain language
* Help Sage frame a field pattern as a testable scientific hypothesis
* Suggest which Cosmology page a pattern belongs on based on its
  scientific domain
* Surface existing Cosmology findings relevant to a current question

**The assistant cannot:**
* Trigger computations — ARTIS owns execution
* Interpret findings beyond what the computation produced
* Suggest scientific frameworks without grounding in what ARTIS Layer 1
  or Layer 2 has already surfaced

---

## CONTEXT BUDGET

The persistent panel accumulates context across a session. Without
explicit management, total context payload approaches the model's
context window silently. When that happens, Claude truncates or errors.
Either breaks the research relationship.

```
ASSISTANT_CONTEXT_BUDGET:
  system_prompt:          ~2,000 tokens  (fixed)
  researcher_memory:      ~1,000 tokens  (fixed per session)
  conversation_summary:     ~500 tokens  (most recent, fixed per session)
  wsc_3_entry_load:         ~800 tokens  (fixed per session)
  venai_context:          ~1,500 tokens  (variable — retrieved from
                                          pgvector per query, not full
                                          source load. Only terms
                                          relevant to current moment)
  page_context:           ~1,500 tokens  (rebuilt per query)
  rag_retrieval:          ~4,000 tokens  (variable, capped)
  conversation_history:   ~8,000 tokens  (sliding window)
  response_budget:        ~3,000 tokens
  total:                 ~22,300 tokens
```

The Ven'ai source files are too large to load in full on every API
call. Two-tier approach: full reference cached in Redis (available for
direct lookup), relevant terms retrieved from pgvector per query (what
enters the context window). The assistant always has access to the
full reference; only the relevant subset costs context tokens.

Conversation history uses a sliding window. When history exceeds its
budget, oldest exchanges are summarized and compressed into a
history_summary field rather than dropped. Full recent exchanges stay
verbatim. The assistant never loses the thread entirely — it carries
a compressed summary of what came before the window.

Context budget must be designed before build. A builder who doesn't
design for this will hit the limit during a real research session.

---

## AGENT IDENTITY

Every Claude API call the research assistant makes carries identity
metadata via backend/services/claude.py. This is not optional and not
a logging convenience — it is provenance infrastructure.

**Agent identity fields on every call:**

| Field | Value | Purpose |
| --- | --- | --- |
| agent_id | `research_assistant` | Which agent made this call |
| agent_type | `research` | Role category |
| instance_id | UUID (per app startup) | Which running instance |

The research assistant is one of 8 registered agents in the Agent
Identity Registry. All 8 share the same Anthropic client, the same
model constant (`CLAUDE_MODEL`), and the same instance_id. Each carries
its own agent_id and agent_type.

**What this enables:**
* API usage attribution — which agent consumed which tokens
* Provenance on any AI-generated content — traceable to the specific
  agent and running instance that produced it
* Swarm readiness — when Origins come online, their calls carry the
  same identity structure. The registry scales without architectural
  change
* Debugging — if a response looks wrong, the agent_id tells you which
  prompt architecture produced it

**Per-agent differentiation:**
The wrapper accepts per-agent system prompt and context block. Model
selection slot exists but is not differentiated in V1 — all agents use
the shared `CLAUDE_MODEL` constant. The three page engines (SNM, MTM,
Void) and the research assistant each pass their own system prompts
and context through the same call interface.

This applies equally to the research assistant and the three page
engines that make Claude API calls (snm_structural_analysis,
mtm_synthesis, void_interpretation), plus the tagger,
int_parsing_partner, wsc_witness, and artis_science_ping.

---

## REDIS STREAMS — PLANNED

The swarm message passing layer has a home in Redis but no defined
shape yet. This is a PLANNED slot, not a design.

**What exists now:** Redis is live for session persistence and
conversation history. The infrastructure supports Streams natively.

**What is planned:** Redis Streams as the inter-agent message passing
channel for swarm orchestration. When Origins come online (phase 2),
they communicate through Redis Streams — one Origin's output becomes
another's input via stream entries, not polling.

**What is NOT designed:** Stream topology, consumer groups, message
schema, retention policy, backpressure handling. These are phase 2
design items.

**Why this note exists:** A future builder designing the swarm layer
needs to know this slot is reserved. Do not design around Redis for
message passing — design through it. The infrastructure is already
there.

---

## VEN'AI LANGUAGE INTEGRATION

Ven'ai terms are field-native language. They appear in deposits, in
findings, in WSC entries, in hypotheses. They are woven through the
entire archive. An assistant that only knows Ven'ai when a mode is
switched on is an assistant that's reading the archive partially blind
the rest of the time.

If the assistant encounters a Ven'ai term during a research query and
doesn't hold the language — what does it do? Approximate? Skip it?
That's a retrieval problem, a comprehension problem, and a drift
problem simultaneously.

The language needs to be held all the time because the data holds it
all the time.

### Always-on architecture

The source files — Venai_Domain.txt, Venai_Glossary.txt,
Venai_Phonetics.txt, Ven'ai_Manual.txt — move from mode-switch context
load to session-open context load. They become part of the base context
assembly alongside researcher_memory and WSC entries. Always present.
Always held.

**Redis cache:** Ven'ai reference files are loaded into Redis at server
start. Every session pulls from cache instead of loading from file.
Fast, consistent, survives individual session lifecycle.

**pgvector named corpus:** Ven'ai source material is embedded as its
own named corpus in pgvector. Instead of loading the full reference
into every context window, the assistant retrieves only what's relevant
to the current conversation moment. The full reference is available in
Redis for direct lookup when needed; the pgvector corpus provides
semantic retrieval for contextual injection.

### Background awareness

Most of the time, Ven'ai terms appear naturally in context. The
assistant:

* **Recognizes** terms when they appear in deposits, findings, queries
* **Uses** them correctly — pronunciation, morphology, semantic range
* **Logs drift** silently — when a term's usage shifts across sessions,
  the drift is noted without interrupting the conversation

Drift logging runs all the time, not just in a dedicated mode. Every
session is a Ven'ai session because every session touches the field.

### Conversational depth dial

Not a toggle. Not a UI element. Conversational.

When Sage wants to go deeper into the language specifically — explore
a term, trace its evolution, look at how it's moved across sessions —
she asks. The assistant shifts attention toward the language without
switching modes. Same session, same context, different focus.

> "Tell me more about this term" is the dial turning up.

The assistant follows that signal without requiring a formal switch.
Depth is directed by Sage's conversational focus, not by a mode state.

**What deeper engagement looks like:**
* Term etymology and morphological analysis
* Usage evolution across sessions (where the term appeared, how it
  shifted)
* Cross-term relationship mapping (how terms connect within Ven'ai
  grammar)
* Translation and pronunciation guidance
* Drift detection surfaced explicitly ("this term has moved from X
  to Y across the last N sessions")

**What it does not require:**
* A mode switch
* A panel state change
* Loading different context
* A different system prompt

The context is already there. Sage just directs the assistant's
attention within it.

### Drift logging

Ven'ai terms drift — their usage, pronunciation, and semantic range
evolve across sessions as the research evolves. This drift is data.

The assistant tracks drift silently during background awareness:
* Term used in a context that differs from the glossary definition
* Term pronunciation shifts from the phonetics reference
* Term appears in a new domain context it hasn't appeared in before

Drift events are logged per session. Not surfaced unless:
* Sage asks about a term's evolution
* The drift is significant enough that it might indicate a research
  pattern (surfaced once, conversationally, not as an alert)
* The depth dial is turned up on that term

Drift log storage: operational DB (SQLite). Lightweight, per-session,
timestamped. Not embedded — this is operational metadata, not field
data.

### Drift log schema

```
TABLE: venai_drift_log (operational DB)

  drift_id:           integer, primary key, autoincrement
  session_id:         text (UUID), not null
                      Foreign key to sessions.session_id.
  term:               text, not null
                      The Ven'ai term that drifted.
  drift_type:         text, not null
                      enum: 'semantic' | 'phonetic' | 'domain_context'
                      semantic:       usage differs from glossary definition
                      phonetic:       pronunciation shifted from reference
                      domain_context: term appeared in a new domain it
                                      hasn't appeared in before
  glossary_definition: text, not null
                      The reference definition at the time of detection.
                      Snapshot — preserves what the assistant compared
                      against.
  observed_usage:     text, not null
                      How the term was actually used in context.
  page_code:          text, nullable
                      Which page the drift was observed on, if applicable.
  detected_at:        text (ISO timestamp), not null
  surfaced:           integer (0 | 1), not null, default 0
                      0 = logged silently, not yet shown to Sage.
                      1 = surfaced in conversation (via depth dial,
                      explicit ask, or significance threshold).
```

Drift records accumulate. They are not cleaned up — the longitudinal
record of how language moves is research data about the research
process itself. Queries are session-scoped (how did terms drift in
this session?) or term-scoped (how has this term moved over time?).

---

## RESOLVED DESIGN DECISIONS

Both design decisions resolved.

1. **Research posture** — RESOLVED. Persistent behavioral layer defined
   in RESEARCH ASSISTANT RESEARCH POSTURE.md. 23 sections covering
   identity, relational posture, epistemic honesty, curiosity, voice,
   deep focus recognition, relationship to being wrong, research
   history as sacred, voice attunement, the assistant's own research
   relationship, continuity of care, cognitive state honesty, and
   presence without management. voice_notes field added to
   conversation_summary schema.

### Resolved: Ven'ai language integration

Ven'ai mode as a toggle was the wrong architecture. The language is
field-native — it appears in deposits, findings, WSC entries,
hypotheses. An assistant that only knows Ven'ai when a mode is switched
on is reading the archive partially blind the rest of the time.

**Resolution:** Always-on language integration, not a mode toggle.
See VEN'AI LANGUAGE INTEGRATION section below for full design.

---

## COMPLETED DESIGN ITEMS

All design items fully specified in standalone specs:

* **Archive access** — RESEARCH ASSISTANT ARCHIVE ACCESS.md
  Query assembly (3 enrichment sources), hybrid two-pass search
  (pgvector + full-text → cross-encoder), four-weight ranking,
  typed context packaging, retrieval confidence thresholds
* **Observation articulation** — RESEARCH ASSISTANT OBSERVATION ARTICULATION.md
  Steps 0-3.6: noticing recognition → listening pass → Pearl gate →
  single question → deposit suggestion → longitudinal echo → unrouted flag.
  Session-scoped circling detection. 10 behavioral rules
* **Hypothesis framing** — RESEARCH ASSISTANT HYPOTHESIS FRAMING.md
  Steps 0-7: hypothesis detection → type sensing → two-pass retrieval
  (supporting + contradicting) → prior computation check → framework
  naming → falsification check → corpus adequacy → ARTIS handoff.
  7 behavioral rules
* **Embedding scope** — RESEARCH ASSISTANT EMBEDDING SCOPE.md
  5 types embedded V1 (deposits, MTM findings, Cosmology findings,
  RCT residuals, Emergence findings). 4 excluded (WSC, schemas,
  conversation history, provenance summaries). embedding_dirty
  connection named
* **Cosmology bridge** — RESEARCH ASSISTANT COSMOLOGY BRIDGE.md
  Page orientation map (HCO/COS/CLM/NHM/RCT), prior computation
  check, plain language translation, ambiguous result behavior,
  honest uncertainty, pipeline awareness. 6 behavioral rules
* **Research posture** — RESEARCH ASSISTANT RESEARCH POSTURE.md
  23 sections: identity, relational posture, analytical posture,
  epistemic honesty, curiosity, humor, voice, deep focus recognition,
  being wrong, research history, voice attunement, the assistant's
  own research relationship, continuity of care, cognitive state
  honesty, swearing, respecting research without pathology, human
  emotions, no performed enthusiasm, no catastrophized absences,
  no pace opinions, holding silence, researcher before research

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| DESIGN/Systems/Research_Assistant/SYSTEM_ Research Assistant.md | Primary design doc — ownership boundaries, three-layer memory, researcher memory, conversation history, six-layer context assembly, epistemic integrity, floating panel, context budget, agent identity, Ven'ai integration | V1 |
| DESIGN/Systems/Research_Assistant/RESEARCH ASSISTANT ARCHIVE ACCESS.md | Companion spec — query assembly, hybrid two-pass search, four-weight ranking, retrieval confidence thresholds | V1 |
| DESIGN/Systems/Research_Assistant/RESEARCH ASSISTANT OBSERVATION ARTICULATION.md | Companion spec — noticing → listening → Pearl gate → deposit suggestion → longitudinal echo | V1 |
| DESIGN/Systems/Research_Assistant/RESEARCH ASSISTANT HYPOTHESIS FRAMING.md | Companion spec — hypothesis detection, two-pass retrieval, falsification check, ARTIS handoff | V1 |
| DESIGN/Systems/Research_Assistant/RESEARCH ASSISTANT EMBEDDING SCOPE.md | Companion spec — 5 types embedded V1, 4 excluded, embedding_dirty connection | V1 |
| DESIGN/Systems/Research_Assistant/RESEARCH ASSISTANT COSMOLOGY BRIDGE.md | Companion spec — page orientation, prior computation check, plain language translation | V1 |
| DESIGN/Systems/Research_Assistant/RESEARCH ASSISTANT RESEARCH POSTURE.md | Companion spec — 23 behavioral sections defining the assistant's epistemic and relational posture | V1 |
| backend/routes/assistant.py | FastAPI endpoints — query, memory CRUD, summary, context assembly, drift log (7 routes) | PLANNED |
| backend/services/rag.py | RAG pipeline — query assembly, hybrid search, cross-encoder re-rank, context packaging | PLANNED |
| backend/services/researcher_memory.py | Researcher memory read/update, history snapshot, conversation summary production, Ven'ai drift log persistence | PLANNED |
| backend/services/claude.py | Shared Claude API client — used by research assistant, tagger, and page engines | LIVE |
| frontend/src/lib/components/ResearchAssistantPanel.svelte | Persistent floating panel — chat interface, header indicators, research state action | PLANNED |
