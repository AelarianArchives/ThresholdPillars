# RESEARCH ASSISTANT EMBEDDING SCOPE

## /DESIGN/Systems/Research_Assistant/

### What gets embedded · when · why · what does not

---

## PURPOSE

Defines what the RAG pipeline can actually retrieve by defining what
gets embedded. The research assistant's usefulness is bounded by the
embedding corpus — it can only find what has been vectorized.

This spec must be decided before build because the embedding scope
determines:
* What the assistant can retrieve when Sage asks a question
* What gaps exist in retrieval (by design, not by accident)
* Which data types the archive access pipeline searches across
* What the longitudinal echo check (Observation Articulation Step 3.5)
  and hypothesis retrieval (Hypothesis Framing Step 2) can surface

---

## OWNERSHIP BOUNDARIES

**This spec owns:**
* The decision of what data types are embedded for RAG retrieval
* When each data type is embedded (trigger point)
* What input is used for each embedding (content + metadata shape)
* What is explicitly excluded from embedding and why

**This spec does not own:**
* Embedding pipeline mechanics — owned by EMBEDDING PIPELINE SCHEMA.md.
  That schema defines the vector table, model, dimensions, retry logic,
  failure handling, and re-embedding policy
* Deposit-level embedding trigger and dirty flag — owned by INTEGRATION
  SCHEMA.md EMBEDDING PIPELINE section. That section defines
  embedding_dirty, 3-attempt retry, failed_permanent status
* Archive-level embedding (provenance_summary) — owned by EMBEDDING PIPELINE SCHEMA.md. Already designed, already scoped
* Vector table schema — owned by EMBEDDING PIPELINE SCHEMA.md
  (embeddings table)
* Retrieval mechanics — owned by RESEARCH ASSISTANT ARCHIVE ACCESS.md.
  That spec defines query assembly, search, re-ranking, and context
  packaging

---

## EMBED

### Deposits — at creation

Every deposit that enters the archive through INT gets embedded at
creation.

**Input:** Content field + metadata string (doc_type + tags +
assigned_pages).

**Why:** The deposit corpus is the research assistant's primary
retrieval surface. Without deposit-level embeddings, RAG retrieves
from provenance summaries of retired documents only — a fraction of
the actual archive. Most of Sage's questions are about specific
observations, patterns, and data points. Those live at the deposit
level.

**Trigger:** Deposit creation via POST /entries/. Asynchronous — does
not block the deposit confirmation flow.

**Already designed:** INTEGRATION SCHEMA.md EMBEDDING PIPELINE section
defines the deposit-level embedding pipeline, including embedding_dirty
flag on post-creation edits, 3-attempt retry, and failed_permanent
status.

**Re-embedding on edit:** When a deposit's content, tags, doc_type, or
pages are edited after creation, the embedding_dirty flag is set. The
embedding pipeline re-queues the deposit for re-embedding with the
same retry strategy. The dirty flag clears when the new embedding
completes. This connection is defined in INTEGRATION SCHEMA.md and
is referenced here for completeness — the two specs must stay aligned.

### MTM Findings — at production

Findings are the synthesis layer's output — cross-Axis pattern
analysis. High-value, high-signal.

**Input:** Finding content + finding type (confirmed | complicated |
overturned | open_question) + source deposit IDs + confidence
assessment.

**Why:** When Sage asks synthesis-level questions ("what patterns have
we found across the Axis engines?"), the assistant should retrieve
MTM findings directly, not reconstruct synthesis from raw deposits.

**Trigger:** Finding production — when MTM completes a synthesis pass
and writes a finding. Asynchronous.

### Cosmology Findings — at production

Investigation outputs from the six Cosmology pages (HCO, COS, CLM,
NHM, MIR, RCT) via ARTIS computation.

**Input:** Finding content + scientific framework + computation type +
confidence + deposit_ids (source data) + cosmology_page.

**Why:** When Sage asks "what have we found about Shannon entropy so
far?" the assistant should retrieve Cosmology findings directly.
These are the research's scientific conclusions — the highest-signal
retrieval targets for hypothesis-level questions.

**Trigger:** Finding production — when a Cosmology finding is confirmed
and written. Asynchronous.

### RCT Residuals — at production

The unexplained remainder after known physics accounts for the data.
RCT's primary research signal — where the algorithm exceeds known
frameworks.

**Input:** Residual content + source computation + what was accounted
for + what remains unexplained.

**Why:** These are the live edge of the research. When Sage is forming
new hypotheses, residuals are often the starting point — "what don't
we understand yet?" The assistant must be able to retrieve them.

**Trigger:** Residual production — when RCT flags an unexplained
remainder. Asynchronous.

### Emergence Findings — at production

Pattern detection outputs from the Emergence system — cross-domain
patterns surfaced by the eight detectors.

**Input:** Finding content + detector type + involved deposits/nodes +
pattern classification.

**Why:** Emergence findings represent patterns the system detected
that Sage may not have noticed. They are high-value retrieval targets
for both observation articulation ("does this connect to something
the system found?") and hypothesis framing ("has Emergence already
flagged this pattern?").

**Trigger:** Finding production — when an Emergence detector produces
a classified finding. Asynchronous.

---

## DO NOT EMBED

### WSC Entries — context layer, not retrieval target

WSC is the AI's sovereign witness record. It is loaded at session open
as part of the five-layer context assembly (Layer 2 — the 3-entry
load). The assistant carries it as ambient context throughout the
session.

**Why not embed:** Embedding WSC entries would make them RAG retrieval
targets — searchable alongside deposits and findings. This collapses
the distinction between witness voice and research data. The witness
record is a different kind of knowledge — the AI's own longitudinal
perspective, not field data. It informs the assistant's orientation;
it does not answer Sage's research questions.

The assistant reads WSC at session open. It does not search it on
demand.

### Schemas and System Documents — architectural reference, not field data

DESIGN/Systems/ and DESIGN/Domains/ contain the architectural
specification of the archive. They define how the system works, not
what the research found.

**Why not embed:** These are reference material for builders, not
retrieval targets for researchers. If the assistant needs to reference
a schema, it reads the file directly — not through vector search. The
distinction matters: vector search finds semantic similarity, which
would return schema text when Sage asks about a concept that happens
to share vocabulary with a schema definition. That's noise, not
signal.

### Conversation History — ephemeral; promoted exchanges become deposits

Raw conversation stays ephemeral in Redis. It is not embedded.

**Why not embed:** The conversation is the working surface, not the
record. If Sage says something worth preserving, she promotes the
exchange through INT — it becomes a deposit (doc_type: discussion) and
gets embedded via the deposit embedding pipeline. The embedding
follows the provenance path, not a separate track. This maintains
INT as the sole gateway — nothing enters the searchable archive
without INT provenance.

### Provenance Summaries — already embedded via existing pipeline

Provenance summaries on retired archive documents are already embedded
by the existing archive-level embedding pipeline defined in EMBEDDING PIPELINE SCHEMA.md.

**Why not embed again:** Already covered. The existing pipeline handles
archive-level embedding at retirement. This spec does not duplicate
or replace that scope — it extends it to data types that did not exist
when the embedding pipeline was originally designed.

---

## EMBEDDING INPUT SHAPE

All embedded data types share the embeddings table defined in
EMBEDDING PIPELINE SCHEMA.md. The source_ref field identifies the
source record. The input text varies by data type.

| Data type | source_ref format | Input text |
| --- | --- | --- |
| Deposit | deposit composite_id | content + doc_type + tags + pages |
| MTM finding | finding_id | content + title + source_page_codes |
| Cosmology finding | finding_id | content + framework + computation_type + confidence |
| RCT residual | residual_id | content + source_computation + unexplained_remainder |
| Emergence finding | finding_id | content + detector_type + pattern_classification |
| Archive (existing) | archives.id (ARC stamp) | provenance_summary |

The metadata included in the input text is intentional — it biases
the embedding vector toward the semantic context of the record, not
just the raw content. A deposit tagged with coupling patterns embeds
differently than the same text without tags. This is what makes
deposit_weight_score meaningful in the ranking formula.

---

## RE-EMBEDDING CONNECTION

The embedding_dirty flag on deposits is defined in INTEGRATION
SCHEMA.md. It triggers re-embedding when a deposit's content, tags,
doc_type, or pages are edited after creation. The re-embedding uses
the same pipeline and retry strategy as the initial embedding.

**Named connection:** This spec (embedding scope) and INTEGRATION
SCHEMA.md (embedding pipeline) must stay aligned on:
* What input is used for deposit embedding (content + metadata)
* When re-embedding triggers (embedding_dirty flag)
* What clears the dirty flag (successful re-embedding)

If the input shape changes here, the dirty flag logic in INTEGRATION
SCHEMA.md must be reviewed for whether the same edits still trigger
re-embedding.

For non-deposit data types (findings, residuals), re-embedding policy
follows the same pattern defined in EMBEDDING PIPELINE SCHEMA.md:
model change triggers batch re-embedding via POST /embed/batch-reembed.
Individual findings are not editable post-production (findings are
immutable once confirmed), so there is no equivalent of
embedding_dirty for findings.

---

## RETRIEVAL SURFACE SUMMARY

What the research assistant can find via RAG, by question type:

| Question type | Primary retrieval targets |
| --- | --- |
| Specific observation | Deposits |
| Pattern across domains | Deposits + Emergence findings |
| Synthesis-level | MTM findings + Deposits |
| Scientific investigation | Cosmology findings + Deposits |
| Unexplained remainder | RCT residuals |
| Historical research | Archive-level (provenance summaries) |
| "What don't we know?" | RCT residuals + Emergence findings |

The assistant's retrieval is only as deep as the embedding corpus.
This scope gives it genuine depth across deposits, synthesis, Cosmology
investigation, pattern detection, and the research edge — without
mixing field data with architectural reference or sovereign witness
material.

---

## FAILURE BEHAVIOR

**Embedding fails at creation/production:**
The source record is not blocked. Deposits save without embeddings.
Findings are written without embeddings. The embedding pipeline's
existing failure handling applies — retry logic, failed_permanent
status, logging. The record exists in PostgreSQL; only the vector is
missing. It will not appear in RAG retrieval until embedding succeeds.

**Partial embedding corpus:**
Some data types are embedded, others have failures. RAG retrieval
works with what is available. The assistant does not know which
specific records are missing from the embedding corpus — it only sees
what retrieval returns. Retrieval confidence (high/medium/low/none)
reflects the quality of what was found, not the completeness of the
corpus.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| EMBEDDING PIPELINE SCHEMA.md | Archive-level embedding pipeline, embeddings table, re-embedding | LIVE |
| INTEGRATION SCHEMA.md | Deposit-level embedding pipeline, embedding_dirty flag | LIVE |
| backend/services/embedding.py | Ollama embedding client, async pipeline, retry | PLANNED |
| backend/services/rag.py | RAG retrieval across all embedded data types | PLANNED |
