# SYSTEM: FastAPI

## fastapi_system.md

### /DESIGN/Systems/

### HTTP routing · DB connections · external API calls · embedding orchestration

---

## WHAT THIS SYSTEM OWNS

* All HTTP routing and request/response handling — every frontend action reaches backend systems through FastAPI endpoints
* Database and cache connection lifecycle — PostgreSQL async engine (asyncpg + SQLAlchemy), SQLite async engine (aiosqlite + SQLAlchemy), Redis async client (redis-py + hiredis), startup connect, shutdown dispose
* External API calls — Claude API (tagger suggestions, research assistant RAG) and Ollama API (nomic-embed-text embedding generation)
* Embedding pipeline orchestration — INT retirement triggers async embedding via Ollama, vector + metadata written to pgvector. FastAPI coordinates the handoff; it does not own the embedding schema (see EMBEDDING PIPELINE SCHEMA.md)
* Error handling pattern for all routes — defined once, applied consistently across the backend. Routes raise HTTPException with status codes. Services raise typed exceptions; routes translate to HTTP responses. No bare except. No silent swallowing (F38, F43)
* Configuration loading — reads all credentials and connection strings from backend/.env via python-dotenv. Fails with named error if required values are missing
* Redis connection lifecycle — async client connected at startup, closed at shutdown. Used for session persistence and inter-agent message passing. Health endpoint reports `redis: true/false`

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
| `/assistant/` | Research assistant — RAG pipeline, context retrieval, Claude response, researcher memory, conversation summary, Ven'ai drift. Sub-routes: POST /assistant/query (RAG query + Claude response), GET /assistant/memory (researcher memory read), PUT /assistant/memory (update with history snapshot), GET /assistant/summary (most recent conversation summary), POST /assistant/summary (produce + store at session close), GET /assistant/context (six-layer context assembly for session open), GET /assistant/drift (Ven'ai drift log query) | PLANNED |
| `/embed/` | Embedding pipeline triggers — async nomic-embed-text via Ollama | PLANNED |
| `/engines/` | Axis engine endpoints — compute trigger, result read, snapshot read, visualization snapshot capture. Covers all 5 engines (THR, STR, INF, ECR, SNM) | PLANNED |
| `/engines/snm/` | SNM-specific — Claude snapshot read, prompt management | PLANNED |
| `/venai/` | Ven'ai service endpoints — drift acknowledgment, name correction, name index read, correlation read | PLANNED |
| `/mtm/` | MTM synthesis endpoint — POST /mtm/synthesize (called by DNR only). Two-pass synthesis, result object return | PLANNED |
| `/pcv/` | PCV pattern endpoints — pattern creation, archive, query. Hypothesis_id assignment | PLANNED |
| `/dtx/` | DTX drift event endpoints — event creation, trajectory update, Bayesian update, outcome validation, vector history | PLANNED |
| `/sgr/` | SGR signal grading endpoints — grade creation, scoring, revision, Bayesian return, dashboard/latency queries | PLANNED |
| `/dnr/` | DNR session-close pipeline endpoints — close-session, retry, session query, init | PLANNED |
| `/api/lnv/` | LNV universal receive + read contracts — POST /api/lnv/receive, GET /api/lnv/entries | PLANNED |
| `/void/` | Void engine endpoints — compute (data layer), analyze (analytical layer), reactivate (Type E), absence record + output queries | PLANNED |
| `/api/wsc/` | WSC witness scroll endpoints — write, recent (3-entry load), entries query, single entry read | PLANNED |
| `/artis/` | ARTIS computation engine endpoints — compute, science ping pipeline (tags/content/suggest), snapshots, references, mappings, distributions. 12 endpoints | PLANNED |
| `/cosmology/` | Shared Cosmology investigation endpoints — findings CRUD, confirm/abandon/supersede, nexus-eligible, LNV routing. 8 endpoints | PLANNED |
| `/rct/` | RCT-specific endpoints — residual creation (auto-routes to LNV), residual query, accumulation counts. 4 endpoints | PLANNED |
| `/resonance/` | Resonance engine — GET /resonance/node-weights (historical activity scores + connection topology for session open initialization) | PLANNED |
| `/events/` | Server-Sent Events stream — pushes system events (deposits, findings, drift, grading, emergence, etc.) to frontend for audio notifications and real-time UI updates | PLANNED |
| `/aos/` | AOS signal routing — POST /aos/trigger (engine or Sage manual trigger, record creation, integrity hash, delivery initiation), GET /aos/records (Observatory Field Signals read) | PLANNED |
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

**1. PostgreSQL unreachable (Docker Compose container stopped or crashed)**
All database operations fail. No reads, no writes, no search.
Guard: FastAPI startup verifies PostgreSQL connection — server will not start if PostgreSQL is down. Health endpoint reports `postgres: false`. Docker Compose restart policy recovers the container. Data persists in aelarian_pgdata volume.

**2. SQLite file locked or corrupted**
Operational state reads/writes fail. Session tracking and presence log unavailable.
Guard: WAL mode reduces lock contention. FastAPI startup verifies SQLite connection. Health endpoint reports `sqlite: false`. SQLite file is ephemeral operational state — recoverable by rebuilding from session data. Archive data is not affected (lives in PostgreSQL).

**3. Redis unreachable (Docker Compose container stopped or crashed)**
Session persistence and inter-agent message passing fail. Active sessions lose cache state.
Guard: FastAPI startup connects Redis client — health endpoint reports `redis: false`. Docker Compose restart policy recovers the container. Redis data persists in aelarian_redis_data volume. Archive data is not affected (lives in PostgreSQL). Redis failure does not block core archive operations (deposit, retirement, search).

**4. Ollama unreachable (service stopped)**
Embedding generation fails. Retired entries are not embedded.
Guard: embedding runs async — retirement still completes. Failure logged with composite_id of the unembedded entry. Retry mechanism picks up failed embeddings on next Ollama availability check. No silent data loss — the entry exists in PostgreSQL; only the vector is missing.

**5. Claude API rate limit or key invalid**
Tagger suggestions and research assistant responses fail.
Guard: routes return appropriate HTTP error (429 or 401). Frontend displays the failure. Archive operations (deposit, retirement, search) are not affected — Claude API is for suggestions and RAG, not for core data operations.

**6. Connection pool exhaustion (PostgreSQL)**
All requests queue or fail waiting for a database connection.
Guard: SQLAlchemy async engine manages pool size. Pool overflow returns an error rather than hanging indefinitely. Health endpoint degrades. Fix is operational — restart or increase pool size in config.

**7. Partial embedding write (vector written, metadata missing or vice versa)**
Embedding record exists but is incomplete. Search returns results with missing context.
Guard: vector and metadata are written in a single INSERT within one transaction. Transaction failure rolls back both. No partial embedding records exist by construction.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/main.py | FastAPI app, lifespan (startup/shutdown), health endpoint | LIVE |
| backend/config.py | Environment loading — DB URLs, API keys, Ollama URL, Redis URL | LIVE |
| backend/db/postgres.py | PostgreSQL async engine, session factory, connect/disconnect | LIVE |
| backend/db/sqlite.py | SQLite async engine, session factory, WAL mode, connect/disconnect | LIVE |
| backend/db/operational.db | SQLite database file — ephemeral operational state | LIVE |
| backend/requirements.txt | Pinned dependencies (37 packages) | LIVE |
| backend/.env | Local credentials — DATABASE_URL, SQLITE_PATH, OLLAMA_BASE_URL, REDIS_URL, ANTHROPIC_API_KEY (gitignored) | LIVE |
| backend/models/ | SQLAlchemy models for PostgreSQL and SQLite tables | PLANNED |
| backend/routes/ | Route modules — entries, tags, threads, search, tagger, assistant, embed, engines, venai | PLANNED |
| backend/routes/mtm.py | MTM synthesis endpoint — POST /mtm/synthesize | PLANNED |
| backend/routes/convergence.py | PCV pattern endpoints — POST/PATCH/GET patterns | PLANNED |
| backend/routes/drift.py | DTX drift event endpoints — POST/PATCH/GET events, vector history | PLANNED |
| backend/routes/grading.py | SGR grading endpoints — POST/PATCH/GET grades, dashboard, latency | PLANNED |
| backend/routes/dnr.py | DNR session-close endpoints — close-session, retry, sessions, init | PLANNED |
| backend/routes/lnv.py | LNV endpoints — POST /api/lnv/receive, GET /api/lnv/entries | PLANNED |
| backend/routes/void.py | Void engine endpoints — compute, analyze, reactivate, queries | PLANNED |
| backend/routes/wsc.py | WSC endpoints — write, recent, entries, single entry | PLANNED |
| backend/routes/artis.py | ARTIS endpoints — compute, ping/tags, ping/content, ping/suggest, snapshots, references, mappings, distributions (12 routes) | PLANNED |
| backend/routes/cosmology.py | Shared Cosmology endpoints — findings CRUD, confirm, abandon, supersede, nexus-eligible, route-lnv (8 routes) | PLANNED |
| backend/routes/rct.py | RCT endpoints — residuals create, query, single, accumulation (4 routes) | PLANNED |
| backend/routes/assistant.py | Research assistant endpoints — query, memory CRUD, summary, context assembly, drift log (7 routes) | PLANNED |
| backend/routes/resonance.py | Resonance engine endpoints — GET /resonance/node-weights (historical weight initialization) | PLANNED |
| backend/routes/swarm/ | Reserved namespace — phase 2 | RESERVED |
| backend/services/engine_base.py | Shared engine computation — baseline math, weight application, null handling, signal classification, snapshot write, stale flag check | PLANNED |
| backend/services/engine_thr.py | THR engine — co-occurrence, presence, sequence | PLANNED |
| backend/services/engine_ecr.py | ECR engine — 171 pairs, signal constellation drift | PLANNED |
| backend/services/engine_inf.py | INF engine — domain layers, bridge resolution, emergence timeline | PLANNED |
| backend/services/engine_str.py | STR engine — root clusters, Ven'ai service integration | PLANNED |
| backend/services/engine_snm.py | SNM engine — two-stream, Claude API structural analysis | PLANNED |
| backend/services/venai.py | Ven'ai service — name registry, correlation tracking | PLANNED |
| backend/services/mtm.py | MTM synthesis — engine output reading, two-pass Claude API, Selection Function, Finding production, fingerprinting, dedup | PLANNED |
| backend/services/convergence.py | PCV service — pattern creation, hypothesis_id assignment, provenance validation, status transitions | PLANNED |
| backend/services/drift.py | DTX service — drift event creation, classification, trajectory updates, Bayesian receipt, outcome validation, vector history | PLANNED |
| backend/services/grading.py | SGR service — grade creation, score vector, tier derivation, Bayesian return, dashboard/latency queries | PLANNED |
| backend/services/dnr.py | DNR service — session-close pipeline, in_progress guard, MTM trigger, LNV routing, Void pulse check, retry logic | PLANNED |
| backend/services/lnv.py | LNV service — receive validation, content shape checking, entry writes, read queries | PLANNED |
| backend/services/void.py | Void service — absence detection, five-type classification, Claude tool (3 modes), PCV routing, Type E, reactivation | PLANNED |
| backend/services/wsc.py | WSC service — payload assembly, Claude API call, entry creation, gap detection, corrections, 3-entry load, LNV routing | PLANNED |
| backend/services/artis.py | ARTIS service — mapping management, reference registry, snapshot retrieval, science ping pipeline orchestration, Layer 2 Claude calls | PLANNED |
| backend/services/computation.py | ARTIS computation library — 15 implementations (scipy/numpy), input validation, snapshot creation | PLANNED |
| backend/services/cosmology.py | Shared Cosmology findings service — create, confirm, abandon, supersede, nexus-eligible, LNV routing | PLANNED |
| backend/services/rct.py | RCT service — residual creation, accumulation tracking, threshold prompt, LNV routing | PLANNED |
| backend/services/hco.py | HCO investigation surface — deposit-to-finding workflow, ARTIS computation requests | PLANNED |
| backend/services/cos.py | COS investigation surface — coupling analysis, multi-deposit findings | PLANNED |
| backend/services/clm.py | CLM investigation surface — geometric analysis, embedding dependency check | PLANNED |
| backend/services/nhm.py | NHM investigation surface — information-theoretic analysis, reference distribution queries | PLANNED |
| backend/services/mir.py | MIR investigation surface — bilateral symmetry analysis, parity characterization, ARTIS computation requests | PLANNED |
| backend/services/claude.py | Claude API client wrapper — agent identity registry (8 agents), shared model constant, call_claude() with metadata tracking | LIVE |
| backend/services/embedding.py | Ollama embedding integration | PLANNED |
| backend/services/rag.py | Retrieval-augmented generation pipeline — query assembly, hybrid search, cross-encoder re-rank, context packaging | PLANNED |
| backend/services/researcher_memory.py | Researcher memory — read, update with history snapshot, conversation summary production/storage, Ven'ai drift log persistence | PLANNED |
| backend/services/resonance.py | Resonance engine service — node weight computation from archive entries, connection strength calculation | PLANNED |
| backend/services/aos.py | AOS service — signal routing, record creation, integrity hash computation, delivery type assignment, email composition and send via Google client, daily pipeline orchestration | PLANNED |
| backend/services/google.py | Google client — Gmail OAuth (Larimar send, Threshold Studies inbox), Drive client (upload, download, search), APScheduler cron registration for 11:11 PM daily pipeline | PLANNED |
| backend/routes/events.py | SSE endpoint — streams system events to frontend for audio notifications and real-time UI | PLANNED |
| backend/services/tag_resolution.py | resolveTagIds() — server-side tag resolution | PLANNED |
| backend/db/migrations/ | Alembic migration files | PLANNED |
