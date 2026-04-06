# SYSTEM: Research Assistant

## /DESIGN/Systems/Research_Assistant/

### Persistent research partner · RAG pipeline · mode switching · floating panel

---

## WHAT THIS SYSTEM OWNS

* Chat interface — persistent floating panel that navigates with Sage
  across all pages without resetting conversation state
* RAG retrieval pipeline — user question embedded via nomic-embed-text,
  vector search against archive embeddings, context assembly, Claude API
  call, response formatting
* Mode switching logic — managing which mode is active, applying
  mode-specific prompt templates, maintaining mode state within the
  session. Mode definitions (system prompts, context templates) live in
  api/prompts/ as versioned configuration. The assistant reads them;
  it does not define them internally
* Page context assembly — reading current page identity (page_code,
  section_id, page type), engine state summaries (Lens and Cosmology
  pages), and active filter state from the tagger store at query time.
  Injecting them into the prompt context as a live feed rebuilt per
  query. The assistant reads these sources; it does not own them
* Deposit suggestion object — structured typed output containing content,
  suggested doc_type, suggested tags, suggested routing. Surfaced to Sage
  for review in the chat interface. Does not call INT. The suggestion is
  the assistant's output; the deposit is INT's creation
* Conversation history within a session — what was said, navigation
  markers, context of the current research thread
* Research memory — the assistant's persistent knowledge of Sage's
  research state across sessions. Current hypotheses, active questions,
  things to revisit, research posture this phase. Lives in operational
  DB. Read at session open, referenced throughout. Distinct from the
  archive (field data) and from conversation history (session-scoped)
* Prompt architecture — system prompts per mode, context injection
  templates, research posture layer, uncertainty framing
* Response formatting — structured output parsing when the assistant
  produces typed objects (deposit suggestions, computation suggestions)
* Context budget management — sliding window on conversation history,
  summary compression of older exchanges, token allocation across
  context components

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
* Mode definitions — content of what each mode is (system prompts,
  context templates, vocabulary sets) lives in api/prompts/ as versioned
  configuration. The assistant reads these; it does not define them

---

## PERSISTENT FLOATING PANEL

The research assistant lives in a floating panel that persists across
page navigation. It is not a sidebar, not a modal, not inline on pages.
It floats, and it follows Sage.

### Panel header

Always visible. Three ambient information elements:

```
[Research mode] · [ECR] · [● High confidence]
```

* **Mode label** — current active mode (Research / Ven'ai / future modes).
  One tap to switch
* **Page context** — shows Sage what the assistant thinks it's looking at.
  Catches misalignment before it produces a bad response
* **Retrieval confidence indicator** — the uncertainty state from the last
  query, surfaced as ambient signal. High (green) / Medium (amber) /
  Low (orange) / None (grey)

### Instance continuity across page navigation

The panel persists visually. Conversation history persists in the Svelte
store. The Claude API is stateless — continuity is created by context
assembly: conversation history injected into every API call, research
memory loaded at session open, page context updated on navigation.

Navigation event handler on the panel component:

```
onPageNavigate(newPageCode):
  update page_context with new page identity + engine state
  do NOT clear conversation history
  do NOT reset research memory
  inject navigation marker into conversation history:
    { type: 'navigation', from: oldPageCode, to: newPageCode }
  next API call assembles fresh page context + full history
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
  system_prompt:        ~2,000 tokens  (fixed)
  research_memory:      ~1,000 tokens  (fixed per session)
  page_context:         ~1,500 tokens  (rebuilt per query)
  rag_retrieval:        ~4,000 tokens  (variable, capped)
  conversation_history: ~8,000 tokens  (sliding window)
  response_budget:      ~3,000 tokens
  total:               ~19,500 tokens
```

Conversation history uses a sliding window. When history exceeds its
budget, oldest exchanges are summarized and compressed into a
history_summary field rather than dropped. Full recent exchanges stay
verbatim. The assistant never loses the thread entirely — it carries
a compressed summary of what came before the window.

Context budget must be designed before build. A builder who doesn't
design for this will hit the limit during a real research session.

---

## OPEN DESIGN DECISIONS

These are flagged, not resolved. Each must be decided before SYSTEM_
is considered complete and before SCHEMA is written.

1. **Conversation history scope** — ephemeral (gone at session close) |
   session-persistent (operational DB, available next session) |
   promotable (selected exchanges can become deposits through INT).
   Design decision in progress.

2. **Research memory layer** — confirmed as needed. Schema, update
   cadence, and structure not yet designed. Operational DB home confirmed.

3. **Research posture** — persistent behavioral layer active across all
   modes. Think alongside, notice what Sage is circling, hold research
   state, surface what she hasn't asked. Full scope to be designed later
   in Tier 6. Current api/prompts/ files to be folded in at that point.

4. **Ven'ai mode** — needs its own design session within Tier 6.
   Qualitatively different from Research mode — different relationship
   to language itself. Requires grammar rules, vocabulary access,
   translation capability, drift awareness. Not a simple mode toggle.

---

## REMAINING DESIGN ITEMS

From the Tier 6 plan, not yet fully designed:

* How it accesses the archive — query assembly, result ranking, context
  packaging beyond the base retrieval pattern in EMBEDDING PIPELINE SCHEMA
* How it helps articulate observations — "I notice X" to structured deposit
* How it helps frame hypotheses — "this looks like Shannon entropy" to
  computation suggestion
* What gets embedded — all deposits? findings? schemas? conversation
  exchanges? Depends partly on conversation history scope decision
