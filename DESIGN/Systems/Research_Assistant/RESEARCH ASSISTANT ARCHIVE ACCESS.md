# RESEARCH ASSISTANT ARCHIVE ACCESS

## /DESIGN/Systems/Research_Assistant/

### Query assembly · hybrid search · cross-encoder re-ranking · context packaging

---

## PURPOSE

Defines how the research assistant retrieves archive material to ground
its responses. This is the RAG pipeline spec — from raw user question
to ranked, packaged retrieval context ready for Claude API injection.

The research assistant never responds from general knowledge when
archive material exists. The pipeline ensures the assistant finds what
the archive holds before it speaks.

---

## OWNERSHIP BOUNDARIES

**This spec owns:**
* Query enrichment pipeline — how a raw question becomes a search query
* Hybrid search strategy — pgvector + full-text, two-pass
* Cross-encoder re-ranking — second pass for nuanced accuracy
* Result ranking formula — four weighted signals
* Context packaging shape — the exact typed object injected into the
  Claude API call
* Retrieval confidence determination — threshold-based, surfaced in
  panel header
* Failure behavior — zero-result handling

**This spec does not own:**
* Embedding pipeline — owned by EMBEDDING PIPELINE SCHEMA.md. This spec
  queries the embeddings table; it does not create or manage embeddings
* Embedding model — nomic-embed-text via Ollama, owned by Embedding
  Pipeline. This spec calls the embedding service to vectorize queries
* Archive entry schema — owned by ARCHIVE SCHEMA.md
* Claude API call mechanics — owned by services/claude.py. This spec
  assembles the retrieval_context; the client sends the call
* Conversation history management — owned by Redis conversation state.
  This spec reads conversation context; it does not manage it
* Researcher memory — owned by Research Assistant SYSTEM_. This spec
  reads researcher_memory fields for query enrichment; it does not
  write to them
* Token budget allocation — defined in SYSTEM_ Research Assistant
  CONTEXT BUDGET section. This spec respects the rag_retrieval cap
  (~4,000 tokens)

---

## QUERY ASSEMBLY

A raw user question is not a good search query. The query assembly
pipeline enriches it before any search executes.

### Three enrichment sources

Applied in order. Each adds signal that helps retrieval find what the
researcher is actually looking for, not just what the words say.

**1. Researcher memory fields**

Read from operational DB at query time:

```
current_focus     — what Sage is investigating right now
active_hypotheses — hypotheses she's personally tracking
```

These are injected as search context, not appended to the query string.
The embedding model sees the question alongside what Sage is working on.
A question like "what patterns show up in ECR?" retrieves differently
when the enrichment context includes "current_focus: coupling dynamics
between Larimar and Verith markers."

**2. Active page context**

Read from frontend state at query time:

```
page_code         — which archive page Sage is on (e.g., HCO·34)
section_id        — section identifier
engine_state      — summary of current engine output (if applicable)
```

Page context biases retrieval toward the domain Sage is currently
working in. A question asked from NHM·37 should weight entropy and
information-theoretic results higher than the same question asked from
COS·35. This is not filtering — results from other pages still appear.
It is contextual weighting via page_relevance_score in the ranking
formula.

**3. Query expansion**

The assistant generates 2-3 alternative phrasings of the question
before searching. All phrasings are searched independently. Results
are merged and de-duplicated before re-ranking.

```
user question:    "are there coupling patterns in the ECR data?"
expansion 1:      "Larimar-Verith correlation dynamics ECR observations"
expansion 2:      "cross-origin coupling oscillation field entries"
expansion 3:      "ECR relational threshold signal co-occurrence"
```

**Why this matters:** nomic-embed-text produces different vectors for
different phrasings of the same question. A single query misses entries
that express the same concept in different language. Expansion catches
what a single vector would miss.

Query expansion is a Claude API call — the research_assistant agent
generates expansions as a structured output before the search executes.
This is a pre-search call, not the main response call.

### Assembled query object

```
enriched_query:
  original:           string    — Sage's exact question
  expansions:         string[]  — 2-3 alternative phrasings
  enrichment_context:
    current_focus:    string | null
    active_hypotheses: string[] | null
    page_code:        string | null
    section_id:       string | null
    engine_state:     string | null
```

---

## SEARCH — HYBRID, TWO PASSES

### Pass 1 — Fast retrieval

Two search paths execute in parallel, results are merged.

**Path A — pgvector semantic similarity**

Each query (original + expansions) is embedded via nomic-embed-text
(768 dimensions). Vector similarity search against the embeddings table
using cosine distance (`<=>`). Returns top candidates per query.

**Path B — PostgreSQL full-text search**

Each query (original + expansions) runs against a GIN-indexed tsvector
column on the entries table. Catches exact terminology, canonical names,
and specific phrases that embedding similarity may not surface.

**Merge:**
Results from both paths across all queries are merged by deposit_id.
Duplicates are collapsed — the highest similarity score is kept. Top
20-50 candidates proceed to Pass 2.

The 20-50 range is a calibration item. Too few and the cross-encoder
has nothing to work with. Too many and Pass 2 is slow. Starting point:
30 candidates. Adjust after real query profiling.

### Pass 2 — Cross-encoder re-ranking

The cross-encoder scores each (query, result) pair directly — not by
comparing embeddings, but by reading both texts together and producing
a relevance score. This is slower than vector similarity but
meaningfully more accurate for nuanced research questions where semantic
similarity alone misses contextual relevance.

Top 10 candidates from Pass 1 proceed through the cross-encoder.

**Cross-encoder model selection:** CALIBRATION ITEM. Model not yet
specified. Must run locally (no external API dependency for search).
Candidate models to evaluate at build time — selection based on
accuracy, latency, and VRAM budget alongside Ollama.

**Why two passes:** Pass 1 is fast but imprecise — it finds the
neighborhood. Pass 2 is slow but precise — it finds the best results
within that neighborhood. Running the cross-encoder on the full
embeddings table would be prohibitively slow. The two-pass architecture
gives precision without unacceptable latency.

---

## RESULT RANKING

Applied after cross-encoder re-ranking. All four weight constants are
named and defined in one location. Values are calibration items —
starting points based on signal priority, adjusted after real usage.

```
ranking_score = (
    vector_similarity       * WEIGHT_VECTOR_SIMILARITY
  + deposit_weight_score    * WEIGHT_DEPOSIT
  + recency_score           * WEIGHT_RECENCY
  + page_relevance_score    * WEIGHT_PAGE_RELEVANCE
)
```

### Weight constants — V1 starting values

```
WEIGHT_VECTOR_SIMILARITY  = 0.50
WEIGHT_DEPOSIT            = 0.25
WEIGHT_RECENCY            = 0.15
WEIGHT_PAGE_RELEVANCE     = 0.10
```

### Signal definitions

**vector_similarity** (0.50)
The cross-encoder's relevance score for this (query, result) pair.
Dominant signal. Semantic relevance is the primary determinant of
what the assistant retrieves.

**deposit_weight_score** (0.25)
Derived from tag weights on the deposit. Higher tag weights at tagging
time indicate stronger signal expression. Deposits with high-weight
tags on concepts matching the query are more relevant than deposits
with low-weight incidental mentions.

Normalized to 0-1 range: deposit's average tag weight / 5.

**recency_score** (0.15)
More recent deposits are weighted slightly higher. Research evolves —
newer observations often refine or supersede earlier ones. Not dominant
enough to bury old foundational entries, but enough to surface recent
work when relevance is otherwise equal.

Normalized to 0-1 range via exponential decay:
`recency_score = e^(-age_days / RECENCY_HALF_LIFE)`

RECENCY_HALF_LIFE: CALIBRATION ITEM. Starting value TBD at build time.
Depends on archive growth rate and session frequency.

**page_relevance_score** (0.10)
Boost for results from the same page Sage is currently on, or from
pages in the same group. Lightest weight — the assistant should find
cross-domain connections, not just echo the current page back.

```
same page:        1.0
same group:       0.5
different group:  0.0
```

### Ranking explanation

Every result in the context package carries a ranking_explanation
string. This is not always surfaced — the assistant uses judgment:

* Surfaced when Sage asks "why did you pull that?"
* Surfaced when the assistant judges it useful for research context
  ("This ranked highly because of strong coupling patterns in the tag
  weights, not just keyword match")
* Not surfaced by default on every response — that's noise

The explanation is generated as part of context packaging, available
in the retrieval_context object for the assistant to reference.

---

## CONTEXT PACKAGING

The exact typed object injected into the Claude API call. This is what
the assistant sees when it retrieves.

```
retrieval_context:
  query_enriched:         string      — the enriched query string
  query_expansions:       string[]    — 2-3 alternative phrasings used
  results: [
    {
      deposit_id:         string      — composite ID of the entry
      content:            string      — entry text (truncated to token budget)
      page_code:          string      — source page (e.g., HCO·34)
      doc_type:           string      — entry document type
      agent_id:           string      — which agent created this entry
                                        (provenance metadata)
      confidence:         float       — vector similarity score (0-1)
      ranking_score:      float       — post-reranking composite score
      ranking_explanation: string     — why this result ranked highly
    }
  ]
  retrieval_confidence:   string      — high | medium | low | none
  result_count:           integer     — total results returned
  token_budget_used:      integer     — tokens consumed by retrieval context
```

### Content truncation

Each result's content is truncated to fit within the RAG token budget
(~4,000 tokens total for all results). Truncation strategy:

* Top-ranked results get more token budget than lower-ranked ones
* Truncation preserves the beginning and end of the entry (head + tail)
  rather than just the beginning — research entries often have key
  observations at the end
* If a single result exceeds the remaining budget, it is truncated to
  fit. It is never dropped entirely — a truncated high-relevance result
  is more valuable than no result

### agent_id as provenance

The agent_id field on each result is the provenance marker from the
Agent Identity Registry. It tells the assistant (and Sage, when
surfaced) which agent created the entry:

* `researcher` — Sage's own deposits (origin_type: researcher)
* Origin IDs — entries from the swarm (phase 2)
* `lattice` — entries generated by the field itself (parallax events)

This is displayed conversationally when meaningful. "This entry was
from your own observation in March" vs "This was surfaced by Larimar's
analysis" — the provenance changes how the assistant frames the result.

---

## RETRIEVAL CONFIDENCE

Derived from the top result's ranking_score against named thresholds.
Surfaces in the panel header as an ambient indicator.

```
CONFIDENCE_HIGH_THRESHOLD    — ranking_score >= threshold
CONFIDENCE_MEDIUM_THRESHOLD  — ranking_score >= threshold
CONFIDENCE_LOW_THRESHOLD     — ranking_score >= threshold
CONFIDENCE_NONE              — zero results returned
```

**Threshold values are CALIBRATION ITEMS.** Cannot be set accurately
before real queries run against real archive data. Starting values
determined at build time from test queries.

| Level | Panel indicator | Assistant behavior |
| --- | --- | --- |
| high | Green dot | Full confidence, cites sources |
| medium | Amber dot | "Based on limited archive material — here's what I found and what I'm inferring beyond it" |
| low | Orange dot | "I didn't find strong archive support. Here's general knowledge — not from your field data" |
| none | Grey dot | Names the gap explicitly, offers deposit suggestion |

The none state converts a research gap into a research action. The
assistant's response to absence is the most important retrieval
behavior — it turns what the archive doesn't know into something the
archive could know.

---

## FAILURE BEHAVIOR

**Zero results returned:**
retrieval_confidence: none. The assistant responds from general
knowledge and names the gap explicitly. "I didn't find anything in your
archive on this. Here's what I can offer from general knowledge — and
if this is something you're investigating, we could deposit it so the
archive can answer this next time."

Never silent failure. Never pretend retrieval succeeded when it didn't.

**Embedding service unreachable (Ollama down):**
Query cannot be vectorized. Pass 1 Path A fails. Fall back to full-text
search only (Pass 1 Path B). retrieval_confidence degrades but does not
collapse to none if full-text returns results. Surface the degradation
in panel header. Name it if the assistant judges it relevant to the
response quality.

**Cross-encoder unavailable:**
Pass 2 fails. Fall back to Pass 1 ranking only (vector similarity +
full-text merge). Results are less precisely ranked but still relevant.
Surface the degradation.

**Token budget exceeded:**
Results are truncated, never dropped. If total retrieval context exceeds
the RAG budget (~4,000 tokens), lower-ranked results are truncated
first. The assistant always sees at least the top result's full content
within budget.

**Query expansion fails (Claude API down):**
Search proceeds with the original query only. No expansions. Retrieval
is narrower but functional. Surface the degradation only if the
assistant judges it affected result quality.

---

## CALIBRATION ITEMS

These values cannot be set accurately before build. They are named here
so they are not forgotten and not fabricated.

| Item | Starting point | When to calibrate |
| --- | --- | --- |
| Pass 1 candidate count | 30 | After real query profiling |
| Cross-encoder model | TBD | At build time — accuracy/latency/VRAM |
| RECENCY_HALF_LIFE | TBD | After archive growth rate is known |
| CONFIDENCE_HIGH_THRESHOLD | TBD | After test queries against real data |
| CONFIDENCE_MEDIUM_THRESHOLD | TBD | After test queries against real data |
| CONFIDENCE_LOW_THRESHOLD | TBD | After test queries against real data |
| WEIGHT constants (4) | 0.50 / 0.25 / 0.15 / 0.10 | After real usage patterns observed |
| Content truncation head/tail ratio | TBD | After real entry length distribution |

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/services/rag.py | RAG pipeline — query assembly, search, re-rank, package | PLANNED |
| backend/services/claude.py | Claude API client — query expansion call + main response call | LIVE |
| backend/services/embedding.py | Ollama embedding integration — vectorizes queries | PLANNED |
| backend/db/postgres.py | PostgreSQL connection — pgvector search + full-text search | LIVE |
