# EMBEDDING PIPELINE SCHEMA

## /DESIGN/Systems/Embedding_Pipeline/EMBEDDING PIPELINE SCHEMA.md

Ollama + nomic-embed-text · pgvector · FastAPI async


OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Every retired archive entry is embedded as a 768-dimensional
  vector and stored in PostgreSQL via pgvector. Embeddings power
  vector similarity search for the research assistant (RAG) and
  future Origin sovereign retrieval (phase 2).

  The pipeline is asynchronous — it does not block retirement.
  A failed embedding does not roll back a completed retirement.
  Embeddings are supplementary to the archive record, not part
  of the sealed record itself.


TRIGGER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Event:  INT post-retirement step 4
          (after retirement_status → complete, after Archives
          page deposit written, after retirement label surfaced)
          See INTEGRATION SCHEMA.md POST-RETIREMENT SEQUENCE.

  The embedding trigger fires last in the post-retirement
  sequence. By this point:
  - archives record exists with all fields
  - provenance_summary is complete (all six sections)
  - confirmed_targets are written
  - provenance and methodology fields are carried
  - page_deposit_id is written

  If the trigger fails to fire or the embedding fails to
  generate, retirement is still complete. The embedding is
  queued for retry. See FAILURE HANDLING below.


MODEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Model:      nomic-embed-text
  Runtime:    Ollama (localhost:11434)
  API:        POST http://localhost:11434/api/embeddings
  Dimensions: 768
  Input:      text string (provenance_summary)

  Request format:
    {
      "model": "nomic-embed-text",
      "prompt": "<provenance_summary text>"
    }

  Response: { "embedding": [float × 768] }


WHAT GETS EMBEDDED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Source text: archives.provenance_summary

  The provenance_summary is the embedding input because:
  - It is a normalized AI-generated representation of the
    source document — consistent structure across all entries
  - It captures source overview, signal weight, deposit
    distribution, split routing, unresolved notes, and
    parsing confidence — a comprehensive semantic fingerprint
  - It is always present on archives records (required at
    retirement step 5 — retirement halts if incomplete)
  - Raw document_text is cleared at retirement step 10 and
    is not available post-retirement

  SCOPE NOTE: This schema covers ARCHIVE-LEVEL embedding —
  post-retirement, provenance_summary as input, one embedding
  per retired document. DEPOSIT-LEVEL embedding (per-deposit,
  content + tags + doc_type as input, embedding_dirty flag,
  3-attempt retry, failed_permanent status) is defined in
  INTEGRATION SCHEMA.md under EMBEDDING PIPELINE. Different
  scope, different trigger, different input. Both write to
  the embeddings table but serve different retrieval needs.
  Archive-level powers broad semantic search across documents.
  Deposit-level powers granular search within the archive.

  PHASE 2 CONSIDERATION: deposit-level embedding ships per
  INTEGRATION SCHEMA.md. Origin sovereign retrieval (filtering
  by owner_origin_id) activates in phase 2.


TABLE: embeddings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  id               — serial (primary key)

  source_ref       — text, not null
                     References the source record ID, depending on
                     source_type: archives.id (ARC stamp) for
                     archive, deposits.id (deposit stamp) for
                     deposit, finding_id for mtm/cosmology/emergence
                     findings, residual_id for rct_residual. Not a
                     foreign key constraint — the application layer
                     resolves the reference using source_type as
                     discriminator.

  source_type      — enum: archive | deposit | mtm_finding |
                     cosmology_finding | rct_residual |
                     emergence_finding, not null
                     archive: embedding of provenance_summary
                     for a retired document (triggered by INT
                     post-retirement step d).
                     deposit: embedding of deposit content + tags
                     + doc_type (triggered at deposit creation,
                     async). See INTEGRATION SCHEMA.md EMBEDDING
                     PIPELINE section.
                     mtm_finding: embedding of MTM synthesis
                     finding (triggered at finding production).
                     cosmology_finding: embedding of Cosmology
                     investigation finding (triggered at finding
                     confirmation).
                     rct_residual: embedding of RCT unexplained
                     residual (triggered at residual production).
                     emergence_finding: embedding of Emergence
                     pattern detection finding (triggered at
                     finding classification).
                     Required for distinguishing retrieval scope:
                     archive-level powers broad semantic search,
                     deposit-level powers granular search,
                     finding types power synthesis and
                     investigation-level retrieval. See RESEARCH ASSISTANT EMBEDDING SCOPE.md for full
                     embedding scope design.

  embedding        — vector(768), not null
                     The embedding vector generated by
                     nomic-embed-text via Ollama.

  model            — text, not null
                     The model that generated this embedding.
                     Value at launch: 'nomic-embed-text'
                     Stored per record so that when the model
                     changes, old and new embeddings are
                     distinguishable. A query can filter by
                     model to use only current-model vectors.

  created_at       — timestamp, not null
                     When this embedding was generated.

  status           — enum: complete | failed | pending
                     complete: embedding generated and stored
                     failed: generation attempted, failed
                     pending: queued, not yet attempted
                     Failed and pending records have null
                     embedding vectors.

  metadata         — jsonb, not null
                     Structured metadata that travels with the
                     vector for filtered retrieval. Contents:

    {
      "section_id":     "string — primary section",
      "origin_type":    "researcher | lattice | parallax_event
                         | multi_presence",
      "session_type":   "single | multi_presence",
      "ownership_classification":
                        "sovereign | collective | shared",
      "owner_origin_id":
                        "o01 | o02 | o03 | null
                         — which Origin owns this marker.
                         Populated when ownership_classification
                         = sovereign. Null when collective or
                         shared. This is the technical key for
                         sovereign retrieval — without it, an
                         Origin cannot distinguish its own
                         markers from another's.",
      "parallax_flag":  "boolean",
      "confirmed_targets":
                        [{ "section_id", "page_code", "group" }],
      "tag_routing_snapshot":
                        [{ "tag_id", "seed_id", "layer_id",
                           "threshold_id", "pillar_id" }]
    }

VECTOR INDEX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Distance metric: cosine similarity (pgvector <=> operator)

  Index type at launch: IVFFlat
    CREATE INDEX ON embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

  IVFFlat is appropriate for launch (small dataset, fast to
  build). Migrate to HNSW when dataset grows beyond ~10,000
  entries for better recall at scale.

  The index is created via Alembic migration — not manually.


RETRIEVAL PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  RESEARCH ASSISTANT (RAG) — launch:
    Query: embed the user's question via nomic-embed-text,
    then find the N nearest archive embeddings by cosine
    similarity. Return the matching archives records as
    context for Claude API.

    SELECT e.source_ref, e.source_type, e.metadata,
           e.embedding <=> $query_vector AS distance
    FROM embeddings e
    WHERE e.status = 'complete'
      AND e.model = 'nomic-embed-text'
      AND e.source_type = $source_type  -- 'archive' or 'deposit'
    ORDER BY e.embedding <=> $query_vector
    LIMIT $n;

  SOVEREIGN RETRIEVAL — phase 2:
    Each Origin retrieves only its own markers unless the
    material is classified collective or shared.

    SELECT e.source_ref, e.source_type, e.metadata,
           e.embedding <=> $query_vector AS distance
    FROM embeddings e
    WHERE e.status = 'complete'
      AND e.model = 'nomic-embed-text'
      AND (
        e.metadata->>'ownership_classification' IN
          ('collective', 'shared')
        OR (
          e.metadata->>'ownership_classification' = 'sovereign'
          AND e.metadata->>'owner_origin_id' = $origin_id
        )
      )
    ORDER BY e.embedding <=> $query_vector
    LIMIT $n;

    This is the technical enforcement of identity integrity.
    Without owner_origin_id, this query cannot distinguish
    between Origins' sovereign markers.


ASYNC BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  The embedding pipeline runs asynchronously via FastAPI
  background tasks.

  Sequence:
  1. Retirement completes (step 13)
  2. Post-retirement steps a-c execute (page deposit, label)
  3. Step d: FastAPI enqueues embedding task
  4. Background task:
     a. Write embeddings record with status = pending
     b. Call Ollama API with provenance_summary
     c. On success: write embedding vector, status → complete
     d. On failure: status → failed, log error

  The enqueue returns immediately. Retirement post-sequence
  does not wait for the embedding to complete.

  QUEUE BEHAVIOR: if multiple retirements happen in quick
  succession, embedding tasks queue and execute sequentially.
  Ollama processes one embedding at a time. Concurrent calls
  are safe but serial execution prevents resource contention.


RE-EMBEDDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  When the embedding model changes (e.g., nomic-embed-text
  replaced by a newer model):

  1. New embeddings are generated for all archives records
  2. Each new embedding is a new row in the embeddings table
     with the new model name
  3. Old embeddings are preserved — not deleted, not overwritten
  4. Retrieval queries filter by model to use current vectors
  5. A batch re-embedding endpoint handles this:
     POST /embed/batch-reembed?model=<new-model-name>

  The model field on each record is what makes this possible.
  Without it, old and new embeddings would be indistinguishable.


FAILURE HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  PRINCIPLE: embedding failure never rolls back retirement.
  The archive is the primary artifact. The embedding is
  derived and supplementary.

  Failure scenarios:

  1. Ollama service unavailable
     embeddings record written with status = failed.
     Retry endpoint: POST /embed/retry-failed
     Finds all status = failed records, re-attempts generation.

  2. Ollama returns malformed response
     Same as above — status = failed, retryable.

  3. PostgreSQL write failure after successful embedding
     Embedding generated but vector not stored. Status remains
     pending. Retry picks it up. Ollama call is idempotent —
     re-generating the same embedding is safe.

  4. Retirement post-step d never fires
     archives record exists with no corresponding embeddings
     record. Detectable by audit query:
     SELECT a.id FROM archives a
     LEFT JOIN embeddings e ON e.source_ref = a.id
     WHERE e.id IS NULL;
     Batch endpoint can backfill missing embeddings.

  No silent failures. Every failure state is visible via
  status field or audit query. No embedding is assumed
  complete without status = complete.


KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. EMBEDDING GENERATED WITH WRONG MODEL
     Model field says 'nomic-embed-text' but the actual Ollama
     model was different (e.g., user pulled a different model
     under the same name).
     Guard: model field stores the exact model name from the
     Ollama response. Ollama list confirms installed models.

  2. METADATA STALE AFTER ENTRY UPDATE
     Entry's tag routing or ownership changes after embedding.
     Metadata in embeddings table is now wrong.
     Guard: embeddings metadata is a snapshot at embedding time.
     If the source entry changes (which should be rare — archives
     are sealed), a new embedding must be generated. Sealed
     record rule means archives don't change — this failure mode
     applies only if ownership_classification is corrected
     post-retirement (an administrative fix, not normal flow).

  3. DUPLICATE EMBEDDINGS FOR SAME SOURCE
     Multiple embedding records for the same archives.id with
     the same model.
     Guard: unique constraint on (source_ref, source_type, model).
     Alembic migration enforces this. Re-embedding with a new model
     creates a new record; re-embedding with the same model
     replaces the existing record.

  4. VECTOR DIMENSIONS MISMATCH
     A future model produces vectors with different dimensions
     than 768. Existing index and queries break.
     Guard: vector(768) column type enforces dimensionality.
     A model change that alters dimensions requires a new
     column or table — not a silent swap. This is an
     architectural decision point, not a runtime error.


FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  backend/services/embedding.py
    Ollama client, async embedding pipeline, retry logic,
    batch re-embedding. Status: PLANNED

  backend/models/embedding.py
    SQLAlchemy model for embeddings table.
    Status: PLANNED

  backend/routes/embed.py
    FastAPI routes:
      POST /embed/trigger    — single entry embedding
      POST /embed/retry-failed — retry all failed
      POST /embed/batch-reembed — re-embed with new model
    Status: PLANNED
