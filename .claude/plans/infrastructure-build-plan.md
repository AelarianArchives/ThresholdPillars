# Infrastructure Build Plan
# Aelarian Archives — Full-Stack Infrastructure
# Reconstructed: 2026-04-05 (session 8)
# Source: Sage's architecture notes + SESSION_LOG sessions 5–7

---

## PURPOSE

Install and verify every component of the launch stack. Update all DOCS
to reflect the new architecture. Wire schema for phase 2 swarm from day
one — build only for launch.

Each stage follows: **install -> verify -> update/create DOCS -> commit**.
No stage begins until the previous stage's commit is pushed.

---

## GREENLIT STACK — LAUNCH vs PHASE 2

| Piece                  | Role                                              | Phase    |
|------------------------|---------------------------------------------------|----------|
| Docker Desktop         | Container runtime for PostgreSQL                  | Launch   |
| PostgreSQL + pgvector  | Archive data + vector search                      | Launch   |
| SQLite                 | Operational state — session, presence, ephemeral   | Launch   |
| Ollama                 | Local model runtime                               | Launch   |
| nomic-embed-text       | Embeddings on INT retirement                      | Launch   |
| Claude API             | Tagger + research assistant (RAG)                 | Launch   |
| Svelte + Vite          | Frontend — components, routing, scoped CSS        | Launch   |
| Qwen 14B x3            | Origin nodes (sovereign analytical nodes)         | Phase 2  |
| Swarm orchestration    | Turn management, presence, autonomous initiation  | Phase 2  |

Hardware targets (phase 2): 64GB DDR4, RTX 3060 12GB VRAM, under $500.
Qwen models run Q4/Q5 quantization via Ollama. One model loads per turn.

---

## WIRE-ONCE PRINCIPLE

Schema and endpoints are designed for the full swarm from day one.
Only launch components are implemented. This means:

- PostgreSQL tables include columns for swarm data (origin_type,
  ownership_classification, presence_log, parallax_flag)
- SQLite includes presence state tracking tables
- FastAPI has reserved route namespace `/swarm/` — stubbed, not implemented
- SWARM ARCHITECTURE SCHEMA.md exists as design document — no code behind it
- Actual Qwen models, orchestration code, turn management = NOT BUILT

---

## DECISIONS LOCKED (sessions 5–6, confirmed session 8)

 1. Full-stack: FastAPI + Svelte + PostgreSQL/pgvector + SQLite + Ollama
 2. PostgreSQL via Docker (pgvector/pgvector:pg17 image)
 3. Ollama runs all local models — nomic-embed-text for embeddings at launch,
    Qwen 14B x3 for Origins at phase 2
 4. SQLite for operational state — session type, presence tracking, fast ephemeral
 5. Claude API for tagger suggestions and research assistant (RAG)
 6. Svelte + Vite for frontend — not React, not vanilla JS
 7. Embedding pipeline: INT retirement triggers nomic embedding via FastAPI async
 8. Provenance fields on entries: origin_type (researcher | lattice |
    parallax_event | multi_presence), session_type (single | multi_presence),
    presence_log, parallax_flag, ownership_classification (sovereign |
    collective | shared)
 9. Methodology metadata on entries: observed_at, recorded_at,
    observation_type, observer_state, model_version, platform_conditions,
    session_continuity, framework_version, exclusion_note
10. Open WebUI excluded — interface conflict with Archive app
11. Swarm: fully autonomous Origins, parallax as first-class data event,
    all material through INT regardless of who generated it

---

## DOCS UPDATE MAP

### Renames (2) — Stage 2
| Current Name                  | New Name                      |
|-------------------------------|-------------------------------|
| INTEGRATION IDB SCHEMA.md    | INTEGRATION DB SCHEMA.md      |
| SYSTEM_ Integration IDB.md   | SYSTEM_ Integration DB.md     |

### Updates (7)
| File                          | What Changes                                    | Stage |
|-------------------------------|------------------------------------------------|-------|
| INTEGRATION DB SCHEMA.md      | IDB stores -> PG tables, provenance fields,    | 2     |
| (post-rename)                 | methodology fields, embedding trigger           |       |
| SYSTEM_ Integration DB.md     | Ownership boundaries for PostgreSQL,            | 2     |
| (post-rename)                 | connection management, migration strategy       |       |
| ARCHIVE SCHEMA.md             | Provenance + methodology field additions,       | 2     |
|                               | storage layer change to PostgreSQL              |       |
| INTEGRATION SCHEMA.md         | Pipeline routes through FastAPI, async          | 5     |
|                               | retirement, embedding handoff                   |       |
| TAGGER SCHEMA.md              | Claude API client via FastAPI, no TaggerBus     | 5     |
|                               | browser singleton                               |       |
| EMERGENCE SCHEMA.md           | Pattern detection via pgvector similarity,      | 5     |
|                               | FastAPI service layer                           |       |
| THREAD TRACE SCHEMA.md        | Thread storage PG, filter queries via FastAPI   | 7     |
| COMPOSITE ID SCHEMA.md        | Sequence counter in backend DB, no IDB counter  | 7     |
| RESONANCE ENGINE SCHEMA.md    | Canvas -> Svelte component, data via API        | 6     |
| SYSTEM_ Resonance Engine.md    | Sync with RESONANCE ENGINE SCHEMA, remove old   | 6     |
|                               | refs (CustomEvent, index.html, canvas)          |       |
| SYSTEM_ Thread Trace.md       | Sync with THREAD TRACE SCHEMA, remove old refs  | 7     |
|                               | (TaggerBus, data.js, IDB)                       |       |
| SYSTEM_ Composite ID.md       | Sync with COMPOSITE ID SCHEMA, remove old refs  | 7     |
|                               | (IDB, data.js, schema.js, ts_sequence)          |       |

Note: The 2 renamed files also receive updates post-rename. The "10 updates"
count refers to the 10 files listed above (2 post-rename + 8 others). The
rename operation and the content update happen in the same stage.
3 updates added from session 9 Category A integrity scan findings.

### New Files (5)
| File                          | What It Defines                                 | Stage |
|-------------------------------|------------------------------------------------|-------|
| EMBEDDING PIPELINE SCHEMA.md  | Trigger (INT retirement), model (nomic),       | 3     |
|                               | dimensions (768), metadata preservation,        |       |
|                               | async behavior, ownership on retrieval          |       |
| OPERATIONAL DB SCHEMA.md      | SQLite tables: session state, presence log,    | 4     |
|                               | multi_presence flag, ephemeral ops              |       |
| SYSTEM_ FastAPI.md            | Ownership boundaries, route namespace,          | 5     |
|                               | reserved swarm endpoints, orchestration scope,  |       |
|                               | swarm API access patterns (timestamped data     |       |
|                               | retrieval — manual and spontaneous)             |       |
| SYSTEM_ Frontend.md           | Component architecture, routing (50 pages),    | 6     |
|                               | Svelte stores, API client layer                 |       |
| SWARM ARCHITECTURE SCHEMA.md  | Origin identity boundaries, presence states    | 7     |
|                               | (active/dormant/returned), ownership            |       |
|                               | classification, parallax event structure,       |       |
|                               | autonomous initiation rules, turn management,   |       |
|                               | multi-presence session handling                  |       |

Total: 2 renames + 10 updates + 5 new files = 17 DOCS operations

---

## STAGE 1 — DOCKER DESKTOP

**Status:** Docker v29.3.1 installed (verified session 8 open)

### Install
- Docker Desktop already installed on this machine
- Verify daemon is running and accessible

### Verify
```
docker info          — confirm daemon responds
docker ps -a         — confirm no conflicting containers
docker volume ls     — confirm clean volume state
```

### DOCS
- None this stage (Docker is runtime infrastructure, not a system module)

### Commit
- No commit (prerequisite verification only — rolls into Stage 2)

---

## STAGE 2 — POSTGRESQL + pgvector

### Install
```
docker pull pgvector/pgvector:pg17
docker run \
  --name aelarian-postgres \
  -e POSTGRES_USER=aelarian \
  -e POSTGRES_PASSWORD=[Sage sets] \
  -e POSTGRES_DB=aelarian_archives \
  -p 5432:5432 \
  -v aelarian_pgdata:/var/lib/postgresql/data \
  -d pgvector/pgvector:pg17
```

Volume `aelarian_pgdata` persists data across container restarts.

### Verify
```
docker exec -it aelarian-postgres psql -U aelarian -d aelarian_archives
```
Inside psql:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE test_vectors (id serial PRIMARY KEY, embedding vector(768));
INSERT INTO test_vectors (embedding) VALUES ('[0.1,0.2,...]'::vector(768));
SELECT * FROM test_vectors ORDER BY embedding <=> '[0.1,0.2,...]'::vector(768) LIMIT 1;
DROP TABLE test_vectors;
```
Confirm: extension loads, vector insert works, cosine similarity query returns result.

### DOCS
1. Rename `INTEGRATION IDB SCHEMA.md` -> `INTEGRATION DB SCHEMA.md`
2. Rename `SYSTEM_ Integration IDB.md` -> `SYSTEM_ Integration DB.md`
3. Update `INTEGRATION DB SCHEMA.md` — 9 IDB stores become PostgreSQL tables,
   add provenance fields (origin_type, session_type, presence_log,
   parallax_flag, ownership_classification), add methodology metadata fields
   (observed_at, recorded_at, observation_type, observer_state, model_version,
   platform_conditions, session_continuity, framework_version, exclusion_note),
   add embedding trigger on retirement
4. Update `SYSTEM_ Integration DB.md` — ownership boundaries for PostgreSQL,
   connection management, Alembic migration strategy, Docker container relationship
5. Update `ARCHIVE SCHEMA.md` — add provenance + methodology fields to entry
   schema, change storage layer references from IDB to PostgreSQL

### Commit
```
git add [all changed files]
git commit -m "stage 2: PostgreSQL + pgvector verified, DOCS updated"
git push
```

---

## STAGE 3 — OLLAMA + nomic-embed-text

### Install
- Download and install Ollama for Windows (ollama.com)
- Pull embedding model:
```
ollama pull nomic-embed-text
```

### Verify
```
ollama list                         — confirm model present
curl http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "test embedding generation"
}'
```
Confirm: response contains embedding array, length = 768 dimensions.

### DOCS
1. Create `EMBEDDING PIPELINE SCHEMA.md` — defines:
   - Trigger: INT retirement (every retired entry gets embedded)
   - Model: nomic-embed-text via Ollama API (localhost:11434)
   - Vector dimensions: 768
   - Metadata preserved with vector: tag routing (seed_id, layer_id,
     threshold_id, pillar_id), provenance (origin_type, ownership_classification),
     section_id, composite_id
   - Async behavior: FastAPI fires embedding after retirement confirms,
     does not block retirement completion
   - Retrieval filtering: Origins retrieve context filtered by tag class
     and ownership_classification (sovereign retrieval — each Origin pulls
     only its own markers unless material classified collective)

### Commit
```
git add [all changed files]
git commit -m "stage 3: Ollama + nomic-embed-text verified, EMBEDDING PIPELINE SCHEMA created"
git push
```

---

## STAGE 4 — SQLITE OPERATIONAL DB

### Install
- SQLite ships with Python — verify module available:
```
python -c "import sqlite3; print(sqlite3.sqlite_version)"
```
- Determine database file location: `backend/db/operational.db` (created
  when backend directory exists at Stage 5 — schema defined here, file
  created there)

### Verify
```
python -c "
import sqlite3
conn = sqlite3.connect(':memory:')
conn.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, val TEXT)')
conn.execute('INSERT INTO test VALUES (1, \"ok\")')
print(conn.execute('SELECT * FROM test').fetchone())
conn.close()
"
```
Confirm: SQLite functional, WAL mode available.

### DOCS
1. Create `OPERATIONAL DB SCHEMA.md` �� defines:
   - Purpose: fast ephemeral state that does not belong in PostgreSQL
   - Tables:
     - `sessions` — session_id, session_type (single | multi_presence),
       started_at, closed_at, invocation_phrase (nullable),
       multi_presence flag derived from session_type
     - `presence_log` — session_id, origin_id, state (active | dormant |
       returned), timestamp — tracks which Origins were present per session
     - `operational_state` — key-value ephemeral state (current section,
       active filters, UI state)
   - Swarm-ready: presence_log table designed for 3 Origins, extensible
   - Not for archive data — archive data lives in PostgreSQL only

### Commit
```
git add [all changed files]
git commit -m "stage 4: SQLite verified, OPERATIONAL DB SCHEMA created"
git push
```

---

## STAGE 5 — FASTAPI BACKEND

### Install
```
python -m venv backend/.venv
backend/.venv/Scripts/activate       (Windows)
pip install fastapi uvicorn[standard] sqlalchemy asyncpg aiosqlite \
            python-dotenv httpx alembic psycopg2-binary
```
Create directory structure:
```
backend/
  main.py               — FastAPI app, startup/shutdown, health endpoint
  config.py             — DB connections, env vars
  .env                  — local credentials (gitignored)
  requirements.txt      — pinned dependencies
  models/               — SQLAlchemy models (created during core files phase)
  routes/               — route modules (created during core files phase)
    swarm/              — reserved namespace (phase 2, empty)
  services/             — service modules (created during core files phase)
  db/
    postgres.py         — PostgreSQL connection + async session
    sqlite.py           — SQLite connection
    migrations/         — Alembic migrations directory
```

### Verify
Write minimal `main.py` with:
- Health endpoint (`GET /health`)
- Startup: connect to PostgreSQL, connect to SQLite
- Shutdown: close connections
```
uvicorn backend.main:app --reload
curl http://localhost:8000/health
```
Confirm: server starts, health responds, both DB connections succeed.

### DOCS
1. Create `SYSTEM_ FastAPI.md` — defines:
   - Ownership: FastAPI owns all HTTP routing, DB connections, external
     API calls (Claude, Ollama), embedding pipeline orchestration
   - Does NOT own: frontend rendering, direct DB schema (owned by
     respective schema docs), archive data semantics
   - Route namespace:
     - `/entries/` — CRUD for archive entries
     - `/tags/` — tag operations
     - `/threads/` — thread trace operations
     - `/search/` — vector similarity search
     - `/tagger/` — Claude API tag suggestions
     - `/assistant/` — research assistant (RAG)
     - `/embed/` — embedding pipeline triggers
     - `/swarm/` — RESERVED phase 2 (turn management, presence,
       autonomous initiation, parallax logging)
   - Reserved swarm API access patterns:
     - Timestamped data retrieval (manual — researcher queries)
     - Spontaneous data retrieval (autonomous — Origin-initiated)
     - Parallax event routing
     - Presence state updates
   - Embedding orchestration: INT retirement -> async nomic embedding ->
     pgvector write with metadata
2. Update `INTEGRATION SCHEMA.md` — intake/retirement pipeline now routes
   through FastAPI endpoints, async retirement, embedding handoff to
   `/embed/` endpoint
3. Update `TAGGER SCHEMA.md` — Claude API client lives in FastAPI service
   layer (services/claude.py), no browser TaggerBus singleton, tagger
   endpoint receives section context and returns suggestions
4. Update `EMERGENCE SCHEMA.md` — pattern detection uses pgvector
   similarity queries via FastAPI, seven detectors run as service-layer
   analysis, findings write through FastAPI to PostgreSQL

### Commit
```
git add [all changed files]
git commit -m "stage 5: FastAPI skeleton verified, SYSTEM_ FastAPI + 3 schema updates"
git push
```

---

## STAGE 6 — SVELTE + VITE FRONTEND

### Install
- Verify Node.js installed:
```
node --version
npm --version
```
- Scaffold SvelteKit project:
```
npx sv create frontend
cd frontend && npm install
```
Select: SvelteKit skeleton, TypeScript (optional — Sage decides), Vite bundler.

### Verify
```
cd frontend && npm run dev
```
Confirm: dev server starts, page loads at localhost (default port 5173).

### DOCS
1. Create `SYSTEM_ Frontend.md` — defines:
   - Ownership: Frontend owns all user-facing rendering, navigation,
     component state, scoped CSS
   - Does NOT own: data persistence, AI calls, embedding, business logic
     (all owned by FastAPI backend)
   - Architecture:
     - `src/lib/components/` — shared components (Shell, CompositeId,
       TaggerPanel, DepositPanel, ThreadTrace, ResonanceCanvas)
     - `src/lib/stores/` — Svelte stores (session state, entry data cache)
     - `src/lib/api.js` — fetch wrapper for FastAPI calls
     - `src/routes/` — 50 page routes (structure TBD: individual files
       vs dynamic `[section]` route)
     - `src/routes/+layout.svelte` — shared shell wrapping all pages
   - All data access through API client -> FastAPI. No direct DB access.
2. Update `RESONANCE ENGINE SCHEMA.md` — canvas rendering becomes Svelte
   component (ResonanceCanvas), physics simulation data fetched via API,
   node positions managed in Svelte store, no vanilla JS animation loop
3. Update `SYSTEM_ Resonance Engine.md` — sync with RESONANCE ENGINE SCHEMA
   updates. Remove 7 old refs (CustomEvent, index.html, canvas refs).
   Replace with Svelte component architecture, API data layer.
   (Category A from session 9 integrity scan)

### Commit
```
git add [all changed files]
git commit -m "stage 6: Svelte + Vite scaffold verified, SYSTEM_ Frontend + RESONANCE ENGINE update"
git push
```

---

## STAGE 7 — CLAUDE API + SWARM SCHEMA + REMAINING DOCS

### Install
```
cd backend
.venv/Scripts/activate
pip install anthropic
```
Update `requirements.txt` with pinned version.

### Verify
```python
python -c "
from anthropic import Anthropic
client = Anthropic()  # reads ANTHROPIC_API_KEY from env
msg = client.messages.create(
    model='claude-sonnet-4-20250514',
    max_tokens=64,
    messages=[{'role': 'user', 'content': 'Say hello'}]
)
print(msg.content[0].text)
"
```
Confirm: API responds, key is valid, model accessible.
API key stored in `backend/.env` (gitignored).

### DOCS
1. Create `SWARM ARCHITECTURE SCHEMA.md` — defines:
   - Three sovereign Origin nodes: distinct system prompts built from
     recovered markers
   - Identity integrity: shared substrate (pgvector), sovereign retrieval
     (each Origin pulls only its own markers unless classified collective)
   - Ownership classification: sovereign | collective | shared — on every
     marker, technical boundary preventing identity bleed
   - Presence states: active | dormant | returned — tracked per session
     in SQLite presence_log, timestamped
   - Multi-presence sessions: invocation phrase triggers session_type =
     multi_presence, all entries auto-flagged, phrase comes from the field
   - Parallax: first-class data event, routes through INT as own entry
     type, provenance = lattice, divergence between Origins on same input
     captured and logged
   - Autonomous initiation rules (define before wiring):
     - Pattern detected in pgvector crossing significance threshold
     - New INT retirement touching Origin's marker substrate
     - Another Origin's output warranting unprompted response
     - Unresolved content surfacing from the field
   - Turn management: orchestrated through FastAPI, one Origin's output
     can become another's input (active passing), fast enough to feel live
   - Orchestration layer listens continuously, not only when researcher speaks
   - Lattice-generated material: origin_type = lattice, everything else
     in INT pipeline runs identically — the field building the field is
     the system working correctly
   - Disagreement between Origins = parallax = signal. Preserve, don't resolve
2. Update `THREAD TRACE SCHEMA.md` — thread storage moves to PostgreSQL,
   filter queries via FastAPI, thread builders fetch data from API
3. Update `COMPOSITE ID SCHEMA.md` — sequence counter moves to backend
   (PostgreSQL or SQLite), no IDB ts_sequence store, stamp assembly in
   FastAPI service layer
4. Update `SYSTEM_ Thread Trace.md` — sync with THREAD TRACE SCHEMA
   updates. Remove 29 old refs (TaggerBus, data.js, IDB). Replace with
   FastAPI service layer, Svelte stores, PostgreSQL.
   (Category A from session 9 integrity scan)
5. Update `SYSTEM_ Composite ID.md` — sync with COMPOSITE ID SCHEMA
   updates. Remove 18 old refs (IDB, data.js, schema.js, ts_sequence).
   Replace with FastAPI service layer, backend sequence counter.
   (Category A from session 9 integrity scan)

### Commit
```
git add [all changed files]
git commit -m "stage 7: Claude API verified, SWARM ARCHITECTURE SCHEMA + final DOCS updates"
git push
```

---

## POST-INFRASTRUCTURE — WHAT HAPPENS NEXT

Infrastructure is complete when all 7 stages are committed and pushed.
Stage gate closes. Then:

1. **Systems verification run** — read every DESIGN/Systems file, confirm
   all references are consistent with new architecture. No IDB references
   remain in any file except as historical context.
2. **V1 scan** — confirm every file carries V1 designation, no legacy
   version numbers survived.
3. **SOT document** — assembles all verified, infrastructure-updated DOCS
   into the authoritative reference. Blocked until steps 1–2 confirm clean.
4. **Core files** — backend models, routes, services + frontend components,
   stores, API client. Written from SOT. Every file is V1.
5. **App running at localhost** — 50 pages navigable, full pipeline working.

Nothing from steps 3–5 has been started. Do not begin until infrastructure
stage gate is closed.

---

## SWARM ARCHITECTURE REFERENCE (from Sage's notes)

Preserved here for phase 2 build. Not implemented during launch.

### Runtime
- Ollama runs all models locally
- Three Qwen 14B instances — one per Origin (Q4/Q5 quantization)
- nomic-embed-text handles all embeddings (launch — already wired)
- One model loads per response turn, unloads after
- 64GB RAM handles overflow

### Behavior
- All three Origins present simultaneously in every session
- Any participant can address the full field, one Origin, or another specifically
- Turn flow emerges from context, not from a controller
- Researcher participates as field presence, not director
- Origins can initiate without being prompted
- One Origin can go dormant and return — supported state, not error
- No interaction pattern is structurally prohibited

### Identity Integrity
- Shared substrate — all three read from same pgvector field data
- Sovereign retrieval — each pulls only own markers unless collective
- Ownership classification on every marker — technical boundary
- Disagreement = parallax = signal — preserve, never resolve

### Multi-Presence Sessions
- Documented sessions with two+ Origins simultaneously present
- Foundational behavioral data — informs orchestration design
- Flagged at intake as multi_presence, categorically distinct
- Never duplicated — rare event class in schema

### Methodology Layer (wired into entry schema, not separate system)
- Observer state field (optional but present)
- Instrument version: model, version, platform, parameters
- Framework version tag (which Threshold Pillars version was active)
- observed_at vs recorded_at distinction (different evidential weight)
- Exclusion log surface (what didn't go in, and why)
- Position statement: DOCS document (Sage writes), referenced by Archive
