# SYSTEM: Integration DB

## integration_db_system.md

### /DESIGN/systems/

### PostgreSQL + pgvector · Alembic migrations · FastAPI service layer

---

## WHAT THIS SYSTEM OWNS

* Database layer (PostgreSQL) — all read and write operations across every table in the archive
* Schema versioning via Alembic migrations — every table change is a versioned migration
* Table ownership for: root_entries · file_assets · manifest_sessions · deposits · archives · prompt_versions · instances · annotations · aos_records · system_counters · routine_sessions · synthesis_sessions · findings · drift_events · patterns · emergence_findings · embeddings · artis_computation_snapshots · artis_external_references · science_domain_mappings · artis_layer2_snapshots · artis_reference_distributions · cosmology_findings · rct_residuals · signal_grades · saved_threads · thread_annotations
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

All table changes are managed through Alembic migrations (backend/db/migrations/).

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
| manifest_sessions | INT | record creation, status writes, chunk_text lifecycle, correction_context writes |
| deposits | INT | record creation via INT gateway (batch confirm, manual, Pearl promotion), tag/notes edits, embedding state |
| archives | INT | retirement step 6 write, post-retirement page_deposit_id, embedding trigger |
| system_counters | INT | arc_seq increment, checkpoint write and clear |
| routine_sessions | DNR | record creation, status writes, lnv_notified, retry_available |
| synthesis_sessions | MTM | record creation, status writes, findings_count, dedup_skipped |
| findings | MTM | record creation, fingerprint write; DNR triggers lnv_routing_status and lnv_deposit_id writes |
| drift_events | DTX | record creation, trajectory_state, outcome_vector, outcome_label, grade_latency |
| patterns | PCV | record creation, status transitions |
| emergence_findings | Emergence | record creation, detection config version write |
| prompt_versions | INT | version creation on prompt bump (sage_directed, calibration_triggered, manual), active flag toggle |
| instances | Sage (manual) | instance creation, date_range_to close, active flag toggle |
| annotations | Sage (via any analytical surface) | annotation creation on any annotated object |
| aos_records | AOS service | record creation on engine trigger or Sage manual trigger, delivery tracking |
| embeddings | Embedding pipeline | vector write with metadata after INT retirement (async) |
| engine_snapshots | Engine computation (THR, STR, INF, ECR, SNM) | snapshot write after computation; MTM writes mtm_read_at on consumption |
| visualization_snapshots | Sage (via frontend capture action) | snapshot capture; lnv_routed updated by LNV routing (Tier 4) |
| snm_claude_snapshots | SNM engine | Claude API response storage; engine_snapshot_id linked when engine consumes |
| venai_names | Ven'ai service | name registration (form set at first registration, never altered by service) |
| venai_correlations | Ven'ai service | correlation record creation and increment on each correlated deposit |
| inf_domain_layers | Application config; INF engine writes first_observed | seed data at startup, domain addition by Sage decision |
| inf_layer_bridge | Application config | seed data at startup, mapping updates when domains or layers change |
| lnv_entries | LNV service | entry creation via POST /api/lnv/receive, content validation |
| void_absence_records | Void engine service | absence pattern detection, classification, PCV routing |
| void_outputs | Void engine service | Claude tool output storage, LNV routing |
| wsc_entries | WSC service | AI-authored entry creation (immutable, no update path) |
| wsc_corrections | WSC service | forward-reference correction creation at entry write time |
| wsc_gaps | WSC service | gap detection and recording at entry write time |
| outcome_vector_history | DTX service | vector history write on every Bayesian update from SGR |
| artis_computation_snapshots | ARTIS service | computation execution, snapshot creation (immutable) |
| artis_external_references | ARTIS service | reference creation, page_codes/tag_ids updates |
| science_domain_mappings | ARTIS service | mapping creation, confirm/decline, deactivation |
| artis_layer2_snapshots | ARTIS service | Claude framing response storage, sage_selection update |
| artis_reference_distributions | ARTIS service | distribution creation, superseded_by update |
| cosmology_findings | Cosmology page services (hco, cos, clm, nhm, mir, rct) | finding creation, status transitions, nexus_eligible, LNV routing |
| rct_residuals | RCT service | residual creation (immutable), LNV routing |
| signal_grades | SGR service | record creation, score vector writes, tier assignment, grade state transitions, Bayesian return tracking |
| saved_threads | Sage (via Thread Trace panel) | thread save, touch (last_accessed update), soft delete |
| thread_annotations | Sage (via Thread Trace panel) | annotation creation on saved threads |

The service layer never initiates a write based on its own judgment. Every write is triggered by the owning system.

---

## TABLE INVENTORY

**root_entries** — source document records. One per intake. Carries provenance from first intake through retirement. Authoritative source for document_text on single-chunk documents. Now includes provenance fields (origin_type, session_type, ownership_classification, parallax_flag, session_id) and methodology metadata (observed_at, recorded_at, observation_type, observer_state, model_version, platform_conditions, session_continuity, framework_version, exclusion_note).

**file_assets** — blob storage for large files. One record per uploaded file. blob may be replaced by re-upload on an existing record without creating a new root.

**manifest_sessions** — chunk parsing sessions. One per chunk per document. Tracks deposit staging array, stats, correction_context (jsonb), and session state. chunk_text is the working copy for the session — cleared on completion. Confirmed deposits link to the deposits table via deposit_ref.

**deposits** — standalone deposit records. One per confirmed deposit in the archive. Created through INT gateway (batch confirmation, manual deposit, Pearl promotion). Carries all Tier 1 fields: doc_type (9-value deposit-level enum), source_format, observation_presence, confidence, deposit_weight, notes, tags, pages, phase_state, elarianAnchor, provenance (jsonb), swarm foundation fields, embedding state. This is what all downstream systems (engines, MTM, embedding pipeline, research assistant) query. See INTEGRATION DB SCHEMA.md for full field definitions.

**archives** — retirement records. One per retired document. Carries confirmed_targets, provenance_summary, aggregate stats, and the ARC id. Links back to root_entries and forward to the Archives page deposit. Provenance and methodology fields carried from root_entries at retirement. Embedding generated asynchronously post-retirement and stored in embeddings table.

**embeddings** — vector embeddings for archived entries. One per embedded entry (re-embedding on model change creates new record, preserves old). Carries vector(768) from nomic-embed-text, model identifier, and metadata jsonb (tag routing snapshot, section_id, ownership_classification). See EMBEDDING PIPELINE SCHEMA.md for full definition.

**prompt_versions** — version-tracked AI prompts. One record per prompt version per prompt_type (parsing_partner, snm). Stores full prompt text, changelog entry (what changed and why), trigger_type (sage_directed, calibration_triggered, manual), and active flag. Referenced by parse_version on chunk_parse objects. Only one version per prompt_type is active at a time.

**instances** — phase period lookup registry. One per phase period. Sage creates manually. One active at a time. Feeds instance_context on deposit records. date_range_to nullable (open instance = current period). Instances are research-level decisions about phase boundaries — not auto-generated from deposit data.

**annotations** — polymorphic researcher marginalia. One per annotation on any analytical object (deposit, finding, hypothesis, void_output, engine_snapshot). Polymorphic reference via annotated_type + annotated_id. Zero changes to existing schemas — annotations reference objects, objects do not reference annotations. Exportable per page as research commentary layer.

**aos_records** — Automated Observation Signal records. One per signal event. Triggered by engines (Emergence, MTM, SGR, DTX, PCV, Void, Engine Computation, Embedding Pipeline) or by Sage manually from any analytical surface. Write authority: dedicated AOS service (not individual triggering systems). Carries integrity_hash for email verification. Carries delivery_error (nullable) if Gmail delivery failed — record persists regardless of delivery outcome. Permanent — never deleted. Full spec: DESIGN/Systems/AOS/AOS SCHEMA.md.

**system_counters** — single-record table. Holds arc_seq (global counter, never decrements) and arc_seq_checkpoint (crash-safe retirement guard, cleared at retirement step 12).

**routine_sessions** — DNR session records. One per Routine run. Tracks the two-step sequence status, MTM session reference, LNV notification state, and retry availability.

**synthesis_sessions** — MTM synthesis cycle records. One per synthesis endpoint call (POST /mtm/synthesize). Tracks lens pages read, findings count, failure type, and deduplication skip flag.

**findings** — MTM Finding records. Written at synthesis time. Carries content_fingerprint for deduplication, source_pattern_refs for traceability, and lnv_routing_status for handoff tracking.

**drift_events** — DTX drift classification records. One per classified drift event. Carries four required classification dimensions, live trajectory_state, outcome_vector, and grade_latency.

**patterns** — PCV pattern records. One per observed cross-domain pattern. Carries hypothesis_id (the structural thread to DTX and SGR), source_signals, and hypothesis_statement.

**emergence_findings** — Emergence detection findings. Distinct from findings (MTM). Different record shape, different provenance chain, different downstream consumers. One per detected pattern per detection pass. Carries finding type, severity, metrics with doc_type_distribution, detection_config_version. See EMERGENCE SCHEMA.md.

**engine_snapshots** — timestamped computation snapshots from the 5 Axis engines. One per computation. Carries engine identifier, deposit_count, baseline_scope, snapshot_data (jsonb, engine-specific), and mtm_read_at for MTM drift tracking. See ENGINE COMPUTATION SCHEMA.md.

**visualization_snapshots** — Captures of engine visualization state. Auto-triggered on significant signal delta or Sage-triggered on demand. trigger_source field ('auto' | 'sage') distinguishes the two. Links to engine_snapshots via engine_snapshot_id. Carries viz_data (jsonb), optional note, lnv_routed flag. Routes to LNV (Tier 4). See ENGINE COMPUTATION SCHEMA.md.

**snm_claude_snapshots** — immutable Claude structural analysis snapshots for the SNM engine. One per Claude API call (per-deposit or batch). Carries prompt_version, prompt_text (defensive copy), analysis_mode, response (jsonb), and engine_snapshot_id link. Never overwritten. See SAT NAM ENGINE SCHEMA.md.

**venai_names** — canonical Ven'ai name registry. Archive-wide. One per unique name. Carries canonical_form (unique), root_cluster, first_seen provenance. Written by Ven'ai service, read by STR engine. See VENAI SERVICE SCHEMA.md.

**venai_correlations** — cross-archive name correlations. Name ↔ phase, name ↔ role, root ↔ grammar. Carries deposit_count and weighted_count, incremented on each correlated deposit. Written by Ven'ai service, read by STR engine Phase 2. See VENAI SERVICE SCHEMA.md.

**inf_domain_layers** — INF engine scientific domain registry. Open set (5 confirmed, extensible). Carries domain_id, display_name, cosmology_page link (nullable), first_observed, active flag. Config table seeded at startup. See INFINITE INTRICACY ENGINE SCHEMA.md.

**inf_layer_bridge** — bridge between TAG VOCABULARY routing layers (l01-l04) and INF domain layers. Many-to-many. Composite primary key (tag_layer_id, inf_domain_id). Config table seeded at startup. See INFINITE INTRICACY ENGINE SCHEMA.md.

**lnv_entries** — consolidated output gallery. Single table, type-discriminated (mtm_finding, engine_snapshot, wsc_entry, void_output, cosmology_finding, rct_residual). Universal receive contract via POST /api/lnv/receive. Content jsonb validated against declared entry_type. Both display surface (gallery) and data source (PCV reads mtm_finding and cosmology_finding entries). See LNV SCHEMA.md.

**void_absence_records** — cross-engine absence pattern detection. Five types: A (cross_engine_convergent), B (single_engine_persistent), C (temporal_shift), D (convergent_with_origin), E (hypothesis_attrition). Types A and D route to PCV as hypotheses. Carries examination_data, PCV routing status, Type E reactivation tracking. See VOID ENGINE SCHEMA.md.

**void_outputs** — Claude analytical tool output storage. Three trigger modes: session_close, on_demand_open, on_demand_targeted. Each output stored permanently with prompt version and Nexus state timestamp. Routes to LNV via POST /api/lnv/receive. See VOID ENGINE SCHEMA.md.

**wsc_entries** — AI-sovereign witness entries. Immutable after creation — no update path, no delete path. Carries session summary, pattern flags, open threads, handoff note, and the full wsc_write_payload for reproducibility. Prompt version travels with every entry. See WSC SCHEMA.md.

**wsc_corrections** — forward-reference self-correction records. Written when a subsequent AI instance recognizes a prior entry misread the field. Original entry is byte-for-byte untouched. 3-entry load API joins corrections into the response. See WSC SCHEMA.md.

**wsc_gaps** — session gap detection records. Written automatically when a WSC entry is created and the system detects the prior session has no WSC record. Carries sessions_elapsed count. Included in the 3-entry session open timeline. See WSC SCHEMA.md.

**outcome_vector_history** — DTX Bayesian update history for ternary plot visualization. Written on every Bayesian update from SGR alongside the outcome_vector write on drift_events. Carries the full probability vector (p_resolve, p_collapse, p_stable) at each update point. See DRIFT TAXONOMY SCHEMA.md.

**artis_computation_snapshots** — every computation run in the Cosmology group. Immutable after creation (no update, no delete). Carries computation_type, caller_page_code, deposit_ids, inputs, parameters, function_called, raw_output, result_summary, error, duration_ms. Referenced by cosmology_findings.computation_snapshot_id and rct_residuals.computation_ref. See ARTIS SCHEMA.md.

**artis_external_references** — external reference registry for Cosmology findings. Carries doi, url, summary (required), title, accessed, page_codes, tag_ids. Referenced by cosmology_findings.external_reference_id. Shared across all investigation pages. See ARTIS SCHEMA.md.

**science_domain_mappings** — tag-to-domain-to-page-to-computation lookup for the science ping pipeline. Carries tag_id, domain, page_code, description, computation_hints (jsonb), confidence, active, proposed_by (sage/claude), decline_reason. Claude-proposed mappings start inactive; Sage confirms. See ARTIS SCHEMA.md.

**artis_layer2_snapshots** — Claude science framing responses. Permanent retention. Carries deposit_id (reference, not content), prompt_version, prompt_text, response (jsonb), framework_candidates, model_version, sage_selection. See ARTIS SCHEMA.md.

**artis_reference_distributions** — named numerical distributions for KS/KL comparison computations. Carries name (unique), description, distribution_data (jsonb, serialized array), source, page_codes, superseded_by. Cross-page resource. See ARTIS SCHEMA.md.

**cosmology_findings** — shared Cosmology investigation findings, discriminated by page_code. Carries page_code, deposit_ids, framework, hypothesis, computation_snapshot_id (FK), result_summary, values (jsonb), confidence (Sage's assessment), external_reference_id, nexus_eligible, status (draft/confirmed/superseded/abandoned). See COSMOLOGY SCHEMA.md.

**rct_residuals** — RCT residual records. Delta between known science predictions and field behavior. Immutable after creation. Carries source_finding_id (FK to cosmology_findings), algorithm_component, known_science_predict, field_produces, delta, computation_ref (FK to artis_computation_snapshots), nexus_eligible. Routes to LNV immediately on creation. See COSMOLOGY SCHEMA.md.

**signal_grades** — SGR evidence-locked grading records. One per graded drift event. Four-dimension score vector (structural_impact, cross_domain_resonance, predictive_validity, temporal_stability), tier derivation via lowest-qualifying-dimension rule, Bayesian return to DTX. Carries drift_event_ref (FK to drift_events), hypothesis_ref (FK to patterns.hypothesis_id) for full chain traceability PCV → DTX → SGR. See SIGNAL GRADING SCHEMA.md.

**saved_threads** — Thread Trace saved thread records. One per user-saved thread. Carries thread_type (Temporal, Relational, Cluster, Emergence), serialized seed, entry_ids at save time, filter_state, tag_routing_snapshot. Soft delete via is_deleted flag. Thread logic runs in Svelte frontend; persistence is server-side. See THREAD TRACE SCHEMA.md.

**thread_annotations** — Thread Trace annotation records. One per annotation on a saved thread. Researcher marginalia — methodology notes, research observations, open questions. Carries annotation_type (note, observation, question), filter_snapshot capturing exact thread position at annotation time. FK to saved_threads.id. See THREAD TRACE SCHEMA.md.

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
