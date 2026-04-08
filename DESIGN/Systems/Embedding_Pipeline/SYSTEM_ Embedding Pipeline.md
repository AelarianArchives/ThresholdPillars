# SYSTEM: Embedding Pipeline

## /DESIGN/Systems/Embedding_Pipeline/

### Post-retirement vector generation · Ollama + nomic-embed-text · async pipeline · pgvector storage · sovereign retrieval

---

## WHAT THIS SYSTEM OWNS

* Post-retirement embedding trigger — INT retirement step 4 fires the
  embedding pipeline. Embedding is async — does not block retirement
* Ollama integration — nomic-embed-text model, 768 dimensions,
  localhost:11434. Single model for all embeddings (archive-level and
  deposit-level)
* Async embedding pipeline — write pending record → call Ollama API →
  on success write vector + status complete → on failure status failed +
  log. Failure does not roll back retirement (the deposit is data;
  the embedding is indexing)
* Archive-level embedding — provenance_summary as input text. One
  embedding per retired document. provenance_summary is a required
  field for retirement step 5
* Embedding metadata structure — section_id, origin_type,
  ownership_classification, owner_origin_id, confirmed_targets,
  tag_routing_snapshot. Metadata travels with the vector for filtered
  retrieval
* pgvector index management — IVFFlat with 100 lists at launch,
  cosine similarity operator (<=>). Migrate to HNSW at scale
* Re-embedding policy — new embeddings create new rows with new model
  field. Old embeddings preserved, never overwritten. Queries filter
  by model to use current embeddings only
* Retry logic — failed embeddings queued for retry. Batch re-embedding
  endpoint for model migration
* Sovereign retrieval query pattern — filters by owner_origin_id when
  ownership_classification = 'sovereign'. Collective and shared material
  available to all Origins. Pattern defined here, enforced by Swarm

## WHAT THIS SYSTEM DOES NOT OWN

* INT retirement sequence — owned by INTEGRATION DB SCHEMA.md. The
  embedding pipeline is triggered by retirement; it does not own or
  control the retirement process
* Archive data, entry schema, provenance_summary content — owned by
  INTEGRATION DB SCHEMA.md
* embeddings table definition — owned by INTEGRATION DB SCHEMA.md.
  This system writes to it; Integration DB owns the schema
* Research assistant RAG queries — owned by Research Assistant. The
  embedding pipeline produces the vectors; the research assistant
  queries them
* Deposit-level embedding trigger — defined in INTEGRATION DB SCHEMA.md
  (different trigger point, different input than archive-level)
* Tag vocabulary and routing — owned by TAG VOCABULARY.md.
  tag_routing_snapshot is a metadata snapshot, not a live reference

---

## PIPELINE

```
INT retirement step 4 completes
  → FastAPI enqueues embedding task (async)
  → Write pending record to embeddings table
  → Call Ollama API (nomic-embed-text, 768-dim)
  → On success: write vector, set status = complete
  → On failure: set status = failed, log error, queue for retry
```

Retirement is never blocked by embedding. The deposit is durable in
PostgreSQL before the embedding pipeline runs. If Ollama is down,
the deposit exists — the embedding catches up on retry.

---

## NEXUS FEED

None directly. The embedding pipeline produces vectors that power
the research assistant's RAG retrieval. It does not feed Nexus
systems (PCV, DTX, SGR, LNV) — those consume engine snapshots
and findings, not raw embeddings.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| DESIGN/Systems/Embedding_Pipeline/EMBEDDING PIPELINE SCHEMA.md | Full mechanical spec — trigger sequence, Ollama integration, metadata structure, re-embedding, sovereign retrieval, failure handling | V1 |
| backend/services/embedding.py | Ollama client, async pipeline, retry logic, batch re-embedding | PLANNED |
| backend/models/embedding.py | SQLAlchemy model for embeddings table | PLANNED |
| backend/routes/embed.py | POST /embed/trigger, POST /embed/retry-failed, POST /embed/batch-reembed | PLANNED |
