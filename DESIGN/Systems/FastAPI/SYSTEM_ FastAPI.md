# SYSTEM: FastAPI

## fastapi_system.md

### /DESIGN/Systems/

### HTTP routing · DB connections · external API calls · embedding orchestration

---

## WHAT THIS SYSTEM OWNS

* All HTTP routing and request/response handling — every frontend action reaches backend systems through FastAPI endpoints
* Database connection lifecycle — PostgreSQL async engine (asyncpg + SQLAlchemy), SQLite async engine (aiosqlite + SQLAlchemy), startup connect, shutdown dispose
* External API calls — Claude API (tagger suggestions, research assistant RAG) and Ollama API (nomic-embed-text embedding generation)
* Embedding pipeline orchestration — INT retirement triggers async embedding via Ollama, vector + metadata written to pgvector. FastAPI coordinates the handoff; it does not own the embedding schema (see EMBEDDING PIPELINE SCHEMA.md)
* Error handling pattern for all routes — defined once, applied consistently across the backend. Routes raise HTTPException with status codes. Services raise typed exceptions; routes translate to HTTP responses. No bare except. No silent swallowing (F38, F43)
* Configuration loading — reads all credentials and connection strings from backend/.env via python-dotenv. Fails with named error if required values are missing

## WHAT THIS SYSTEM DOES NOT OWN

* Database schema definitions — owned by INTEGRATION DB SCHEMA.md (PostgreSQL tables) and OPERATIONAL DB SCHEMA.md (SQLite tables)
* Archive data semantics — owned by ARCHIVE SCHEMA.md. FastAPI routes data; it does not define what data means
* Tag vocabulary and routing rules — owned by TAG VOCABULARY.md and TAGGER SCHEMA.md
* Composite ID construction logic — owned by composite ID service (written against COMPOSITE ID SCHEMA.md)
* Embedding schema and metadata structure — owned by EMBEDDING PIPELINE SCHEMA.md. FastAPI triggers the pipeline; the schema defines what is stored
* Frontend rendering, navigation, component state, scoped CSS — owned by frontend (see SYSTEM_ Frontend.md, Stage 6)
* Research domain logic — FastAPI is plumbing. Signal analysis, threshold classification, and domain interpretation belong to the schemas and the research, not to HTTP routes
* Write authority decisions — the owning system decides what to write. FastAPI service layer executes the write. See SYSTEM_ Integration DB.md WRITE AUTHORITY TABLE

---

## ROUTE NAMESPACE

| Route | Purpose | Status |
| --- | --- | --- |
| `/health` | Connection status — PostgreSQL and SQLite liveness check | LIVE |
| `/entries/` | CRUD for archive entries | PLANNED |
| `/tags/` | Tag operations — read, assign, remove | PLANNED |
| `/threads/` | Thread trace operations — create, query, filter | PLANNED |
| `/search/` | Vector similarity search via pgvector | PLANNED |
| `/tagger/` | Claude API tag suggestions — receives section context, returns candidates | PLANNED |
| `/assistant/` | Research assistant — RAG pipeline, context retrieval, Claude response | PLANNED |
| `/embed/` | Embedding pipeline triggers — async nomic-embed-text via Ollama | PLANNED |
| `/swarm/` | RESERVED — phase 2 (turn management, presence, autonomous initiation, parallax logging) | RESERVED |

All routes are versioned by namespace, not by URL prefix. No `/v1/` prefix. If the API contract changes, the change is a migration — not a new version namespace.

---

## RESERVED SWARM API PATTERNS — PHASE 2

These patterns are designed but not implemented. The `/swarm/` namespace exists as an empty reserved directory. No code behind it until phase 2 build begins.

**Timestamped data retrieval (manual)** — researcher queries historical data across Origins. Filters by time range, origin_type, ownership_classification. Returns archived entries with full provenance.

**Spontaneous data retrieval (autonomous)** — Origin-initiated context pulls. An Origin's pattern detection crosses a significance threshold and the Origin requests relevant context from pgvector without researcher prompting.

**Parallax event routing** — when two Origins produce divergent analysis of the same input, the divergence is captured as a parallax event. Routes through INT as its own entry type with origin_type = parallax_event.

**Presence state updates** — tracks Origin state transitions (active → dormant → returned) in SQLite presence_log. State changes written per session, timestamped.

**Turn management** — orchestrated through FastAPI. One Origin's output can become another's input (active passing). Orchestration layer listens continuously, not only when researcher speaks.

---

## EMBEDDING ORCHESTRATION FLOW

Triggered by INT retirement (not by user action, not on a schedule):

1. Archive entry retired → FastAPI `/embed/` endpoint receives composite_id
2. FastAPI calls Ollama API at localhost:11434 — model: nomic-embed-text, input: entry text
3. Ollama returns 768-dimension vector
4. FastAPI writes vector + metadata to pgvector embeddings table
5. Metadata preserved with vector:
   - Tag routing snapshot: seed_id, layer_id, threshold_id, pillar_id
   - Provenance: origin_type, owner_origin_id, ownership_classification
   - Identifiers: section_id, composite_id
6. Retirement completion is not blocked — embedding runs async after retirement confirms

See EMBEDDING PIPELINE SCHEMA.md for full specification including re-embedding policy and failure handling.

---

## KNOWN FAILURE MODES

**1. PostgreSQL unreachable (Docker container stopped or crashed)**
All database operations fail. No reads, no writes, no search.
Guard: FastAPI startup verifies PostgreSQL connection — server will not start if PostgreSQL is down. Health endpoint reports `postgres: false`. Docker restart policy recovers the container. Data persists in aelarian_pgdata volume.

**2. SQLite file locked or corrupted**
Operational state reads/writes fail. Session tracking and presence log unavailable.
Guard: WAL mode reduces lock contention. FastAPI startup verifies SQLite connection. Health endpoint reports `sqlite: false`. SQLite file is ephemeral operational state — recoverable by rebuilding from session data. Archive data is not affected (lives in PostgreSQL).

**3. Ollama unreachable (service stopped)**
Embedding generation fails. Retired entries are not embedded.
Guard: embedding runs async — retirement still completes. Failure logged with composite_id of the unembedded entry. Retry mechanism picks up failed embeddings on next Ollama availability check. No silent data loss — the entry exists in PostgreSQL; only the vector is missing.

**4. Claude API rate limit or key invalid**
Tagger suggestions and research assistant responses fail.
Guard: routes return appropriate HTTP error (429 or 401). Frontend displays the failure. Archive operations (deposit, retirement, search) are not affected — Claude API is for suggestions and RAG, not for core data operations.

**5. Connection pool exhaustion (PostgreSQL)**
All requests queue or fail waiting for a database connection.
Guard: SQLAlchemy async engine manages pool size. Pool overflow returns an error rather than hanging indefinitely. Health endpoint degrades. Fix is operational — restart or increase pool size in config.

**6. Partial embedding write (vector written, metadata missing or vice versa)**
Embedding record exists but is incomplete. Search returns results with missing context.
Guard: vector and metadata are written in a single INSERT within one transaction. Transaction failure rolls back both. No partial embedding records exist by construction.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/main.py | FastAPI app, lifespan (startup/shutdown), health endpoint | LIVE |
| backend/config.py | Environment loading — DB URLs, API keys, Ollama URL | LIVE |
| backend/db/postgres.py | PostgreSQL async engine, session factory, connect/disconnect | LIVE |
| backend/db/sqlite.py | SQLite async engine, session factory, WAL mode, connect/disconnect | LIVE |
| backend/db/operational.db | SQLite database file — ephemeral operational state | LIVE |
| backend/requirements.txt | Pinned dependencies (30 packages) | LIVE |
| backend/.env | Local credentials — DATABASE_URL, SQLITE_PATH, OLLAMA_BASE_URL (gitignored) | LIVE |
| backend/models/ | SQLAlchemy models for PostgreSQL and SQLite tables | PLANNED |
| backend/routes/ | Route modules — entries, tags, threads, search, tagger, assistant, embed | PLANNED |
| backend/routes/swarm/ | Reserved namespace — phase 2 | RESERVED |
| backend/services/ | Service modules — embedding, claude, rag, entry operations | PLANNED |
| backend/db/migrations/ | Alembic migration files | PLANNED |
