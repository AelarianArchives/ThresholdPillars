# SYSTEM: Integration DB

## integration_db_system.md

### /DESIGN/systems/

### PostgreSQL + pgvector · Alembic migrations · FastAPI service layer

---

## WHAT THIS SYSTEM OWNS

* Database layer (PostgreSQL) — all read and write operations across every table in the archive
* Schema versioning via Alembic migrations — every table change is a versioned migration
* Table ownership for: root_entries · file_assets · manifest_sessions · archives · system_counters · routine_sessions · synthesis_sessions · findings · drift_events · patterns · emergence_findings · embeddings
* arc_seq counter operations — increment, checkpoint write, checkpoint clear
* Chunk queue derivation — computing next_chunk, page_start, page_end, queue_done
* Write path execution for every system — FastAPI service layer executes the write; the owning system owns the decision to write
* lnv_routing_status and lnv_deposit_id writes on findings records — triggered by DNR after LNV receipt confirmation
* Cross-DB session correlation — session_id (UUID) shared with SQLite operational DB; consistency enforced at application layer

## WHAT THIS SYSTEM DOES NOT OWN

* Routing authority — owned by SOT
* Entry schema definition and enum values — owned by SQLAlchemy models (backend/models/)
* Composite ID construction logic — owned by composite ID service
* Synthesis logic — owned by MTM service
* Session sequence orchestration — owned by DNR service
* Deposit routing decisions — owned by INT (integration system)
* Tag routing decisions — owned by tagger service
* Embedding pipeline execution — owned by embedding service (see EMBEDDING PIPELINE SCHEMA.md)
* Operational state (sessions, presence) — owned by SQLite (see OPERATIONAL DB SCHEMA.md)
* Any business logic about what should be written — the service layer executes; it does not decide

---

## SCHEMA VERSIONING — ALEMBIC MIGRATIONS

All table changes are managed through Alembic migrations (backend/db/migrations/). This replaces the DB_VERSION / REQUIRED_VERSION coupling from the old IDB build.

**The rule:** every table addition, column change, index change, or constraint change is a versioned Alembic migration. Migrations are tested before applying to production data. Never modify tables directly via SQL. Never skip a migration version.

**Migration discipline:**
* Each migration has an up() and down() function — forward and rollback
* Migrations are committed to git alongside the code that uses the new schema
* The migration chain is linear — no branch conflicts in migration history
* Thread trace tables live in the same PostgreSQL database — no cross-DB version coupling needed

---

## WRITE AUTHORITY TABLE

Each table lists who decides what is written and what the FastAPI service layer executes on their behalf:

| Table | Decision authority | Service layer executes |
| --- | --- | --- |
| root_entries | INT (integration system) | intake sequence, retirement sequence writes |
| file_assets | INT | blob upload, record creation, re-upload path |
| manifest_sessions | INT | record creation, status writes, chunk_text lifecycle |
| archives | INT | retirement step 6 write, post-retirement page_deposit_id, embedding trigger |
| system_counters | INT | arc_seq increment, checkpoint write and clear |
| routine_sessions | DNR | record creation, status writes, lnv_notified, retry_available |
| synthesis_sessions | MTM | record creation, status writes, findings_count, dedup_skipped |
| findings | MTM | record creation, fingerprint write; DNR triggers lnv_routing_status and lnv_deposit_id writes |
| drift_events | DTX | record creation, trajectory_state, outcome_vector, outcome_label, grade_latency |
| patterns | PCV | record creation, status transitions |
| emergence_findings | Emergence | record creation, detection config version write |
| embeddings | Embedding pipeline | vector write with metadata after INT retirement (async) |

The service layer never initiates a write based on its own judgment. Every write is triggered by the owning system.

---

## TABLE INVENTORY

**root_entries** — source document records. One per intake. Carries provenance from first intake through retirement. Authoritative source for document_text on single-chunk documents. Now includes provenance fields (origin_type, session_type, ownership_classification, parallax_flag, session_id) and methodology metadata (observed_at, recorded_at, observation_type, observer_state, model_version, platform_conditions, session_continuity, framework_version, exclusion_note).

**file_assets** — blob storage for large files. One record per uploaded file. blob may be replaced by re-upload on an existing record without creating a new root.

**manifest_sessions** — chunk parsing sessions. One per chunk per document. Tracks deposit array, stats, and session state. chunk_text is the working copy for the session — cleared on completion.

**archives** — retirement records. One per retired document. Carries confirmed_targets, provenance_summary, aggregate stats, and the ARC id. Links back to root_entries and forward to the Archives page deposit. Provenance and methodology fields carried from root_entries at retirement. Embedding generated asynchronously post-retirement and stored in embeddings table.

**embeddings** — vector embeddings for archived entries. One per embedded entry (re-embedding on model change creates new record, preserves old). Carries vector(768) from nomic-embed-text, model identifier, and metadata jsonb (tag routing snapshot, section_id, ownership_classification). See EMBEDDING PIPELINE SCHEMA.md for full definition.

**system_counters** — single-record table. Holds arc_seq (global counter, never decrements) and arc_seq_checkpoint (crash-safe retirement guard, cleared at retirement step 12).

**routine_sessions** — DNR session records. One per Routine run. Tracks the two-step sequence status, MTM session reference, LNV notification state, and retry availability.

**synthesis_sessions** — MTM synthesis cycle records. One per synthesis endpoint call (POST /mtm/synthesize). Tracks lens pages read, findings count, failure type, and deduplication skip flag.

**findings** — MTM Finding records. Written at synthesis time. Carries content_fingerprint for deduplication, source_pattern_refs for traceability, and lnv_routing_status for handoff tracking.

**drift_events** — DTX drift classification records. One per classified drift event. Carries four required classification dimensions, live trajectory_state, outcome_vector, and grade_latency.

**patterns** — PCV pattern records. One per observed cross-domain pattern. Carries hypothesis_id (the structural thread to DTX and SGR), source_signals, and hypothesis_statement.

**emergence_findings** — Emergence detection findings. Distinct from findings (MTM). Different record shape, different provenance chain, different downstream consumers. One per detected pattern per detection pass. Carries finding type, severity, metrics with doc_type_distribution, detection_config_version. See EMERGENCE SCHEMA.md.

---

## ARC_SEQ COUNTER OPERATIONS

arc_seq is the global counter for ARC id assignment. It never decrements.

**Increment sequence (at retirement step 1):**
1. Write arc_seq_checkpoint = current arc_seq value to system_counters
2. Increment arc_seq
3. Receive incremented value as ARC SEQ — use this value for all ARC id construction in this retirement sequence

**Checkpoint recovery (on retry):** four conditions evaluated in order — see INTEGRATION DB SCHEMA for the full recovery block. The checkpoint is the crash-safe guard that prevents double-increment on retry.

**Checkpoint clear (at retirement step 12):** write arc_seq_checkpoint = null. Idempotent — skip if already null.

---

## CHUNK QUEUE DERIVATION

Computed from stored values on root_entries and file_assets. Never stored. Derived on demand.

```
next_chunk   = chunks_completed + 1
page_start   = (chunks_completed × chunk_size) + 1
page_end     = min((chunks_completed + 1) × chunk_size, file_assets.total_pages)
queue_done   = chunks_completed == total_chunks
```

---

## SERVICE API

Representative methods — full signatures defined at build time against SOT.
All methods live in backend/services/. Accessed via FastAPI route handlers.

**entry_service.create_root_entry(fields) → str**
Writes root_entries record including provenance and methodology fields. Returns assigned id.

**entry_service.write_manifest_session(fields) → str**
Creates manifest_sessions record for the given root. Returns session id.

**entry_service.update_deposit_status(session_id, deposit_num, status) → None**
Updates status on a single deposit within a manifest_session. Increments/decrements relevant stats.

**entry_service.increment_arc_seq() → int**
Writes checkpoint, increments arc_seq, returns new value.

**entry_service.write_archives_record(fields) → str**
Creates archives record at retirement step 6 including provenance and methodology fields. Returns ARC id. Triggers async embedding generation.

**entry_service.write_finding(fields) → str**
Creates findings record from MTM synthesis output. Returns finding id.

**entry_service.write_lnv_routing_status(finding_id, deposit_id) → None**
Writes lnv_routing_status → deposited and lnv_deposit_id on the named findings record. Triggered by DNR after LNV confirms receipt.

**entry_service.create_routine_session() → str**
Creates routine_sessions record. Returns session id.

**entry_service.update_routine_session(session_id, fields) → None**
Writes status, lnv_notified, retry_available, failure_type updates on a routine_session record.

---

## KNOWN FAILURE MODES

**1. Alembic migration skipped or applied out of order**
Tables are in an unexpected state. Queries fail or return wrong data.
Guard: Alembic tracks migration history in a dedicated table. `alembic current` shows applied state. `alembic upgrade head` applies all pending. Migrations are tested before production. Never modify tables via raw SQL.

**2. Database write failure mid-sequence (retirement)**
Partial retirement state. Arc_seq may have incremented without an archives record existing.
Guard: arc_seq_checkpoint provides crash-safe recovery. On retry, checkpoint recovery block at step 1 determines entry point. Double-increment is prevented. Sequence resumes from correct step. PostgreSQL transactions provide atomicity within individual steps.

**3. Partial write on chunks_completed increment**
manifest status writes to complete but chunks_completed write fails. Root integrity derives corrupt on next load.
Guard: the two writes are sequential within a transaction — manifest status first, chunks_completed second. If the transaction fails, both roll back. A corrupt root_integrity value is visible on load and surfaces recovery.

**4. open_deferrals write fails on decrement**
stats.deferred on manifest_sessions decrements correctly but root_entries.open_deferrals does not. Root-level deferral count is wrong. Retirement gate may clear incorrectly.
Guard: both writes execute in the same transaction. If either fails, both roll back. root_integrity derives deferred on next load from the live manifest state — visible recovery signal.

**5. lnv_routing_status not written after LNV receipt**
Finding exists with lnv_routing_status: pending indefinitely. No visible error — the Finding is stranded.
Guard: DNR triggers the write immediately after LNV confirms receipt of each Finding. Findings with lnv_routing_status: pending after a completed routine_session are detectable on load as incomplete handoffs.

**6. Cross-DB consistency failure (PostgreSQL ↔ SQLite)**
session_id on root_entries references a SQLite session record that doesn't exist, or vice versa.
Guard: FastAPI service layer creates the SQLite session record first, receives session_id, then passes it to PostgreSQL writes. No cross-DB foreign keys — consistency is application-enforced. Orphaned session_ids detectable by periodic audit query.

**7. Docker container down — PostgreSQL unavailable**
All database operations fail. FastAPI cannot serve requests.
Guard: FastAPI startup checks PostgreSQL connection. Health endpoint reports database status. Container auto-restarts via Docker restart policy. Data persists in aelarian_pgdata volume.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/db/postgres.py | PostgreSQL connection + async session management via asyncpg + SQLAlchemy | PLANNED |
| backend/models/ | SQLAlchemy models for all PostgreSQL tables | PLANNED |
| backend/services/ | FastAPI service layer — intake, retirement, arc_seq, chunk queue, embedding trigger, write path for all owning systems | PLANNED |
| backend/db/migrations/ | Alembic migration files — versioned schema changes | PLANNED |
| backend/db/sqlite.py | SQLite connection for operational state (sessions, presence) | PLANNED |
