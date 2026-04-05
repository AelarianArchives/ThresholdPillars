╔══════════════════════════════════════════════════════════════╗
║  INTEGRATION DB SCHEMA  ·  INT  ·  v1                       ║
║  /DESIGN/systems/integration_db_schema_v1.md                  ║
║  PostgreSQL + pgvector · Alembic migrations                 ║
╚══════════════════════════════════════════════════════════════╝


INFRASTRUCTURE NOTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Database: PostgreSQL + pgvector (Docker container: aelarian-postgres)
  Database name: aelarian_archives
  Migrations: Alembic (backend/db/migrations/)
  Access layer: FastAPI service layer (backend/services/, backend/models/)
  Embedding storage: dedicated embeddings table (schema in EMBEDDING
    PIPELINE SCHEMA.md)
  Operational state (sessions, presence): SQLite (schema in
    OPERATIONAL DB SCHEMA.md)
  Cross-DB correlation: session_id (UUID) shared between PostgreSQL
    and SQLite. No cross-DB foreign keys. Application layer ensures
    consistency via FastAPI.

  All tables below are PostgreSQL tables managed via Alembic migrations.
  Previous IDB (IndexedDB) store definitions are superseded.


ID FORMAT REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TS              — Threshold Studies. Hardcoded literal prefix.
                    First segment of every composite stamp in
                    the system. Never computed. Never variable.

  AX              — Axis root marker. Page code for source mode
                    Integration entries. Not INT. Not a placeholder.

  Root entry ID   — TS · AX · [PHASE] · [YYYY-MM] · [SEQ]
                    SEQ: query root_entries for highest existing
                    SEQ at same [PHASE] + [YYYY-MM]. Increment
                    by 1. Start at 1 if none exist.

  Child entry ID  — TS · [PAGE] · [PHASE] · [YYYY-MM] · [SEQ]
                    · root:[PARENT-ID]
                    Stamp carries root_ref inline AND as a
                    stored field. Stamp = human-readable
                    provenance. Field = machine-readable join.

  ARC id          — TS · ARC · [PHASE] · [YYYY-MM] · [SEQ]
                    SEQ is global — sourced from
                    system_counters.arc_seq.




━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: system_counters
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  arc_seq            — integer
                       Single record. Starts at 1.
                       Increments globally on every retirement
                       before ARC id is issued. Single source
                       of truth for ARC SEQ. No collision
                       possible.

  arc_seq_checkpoint — integer
                       Written at retirement step 1 before
                       increment executes. Persisted to table
                       — survives session crash. Cleared at
                       retirement step 12 before
                       retirement_status → complete.
                       IDEMPOTENT: skip clear if already null.
                       RECOVERY: on retry, check checkpoint
                       state first. Four conditions, evaluated
                       in order:

                       1. checkpoint is null AND archive_ref
                          is already written on root_entries —
                          sequence is in its final step. Write
                          retirement_status → complete. Halt.
                          No prior steps re-execute.

                       2. arc_seq > checkpoint AND archive_ref
                          is already written on root_entries —
                          increment succeeded and sequence
                          reached at least step 7. Skip to
                          step 10. Steps 1-9 do not
                          re-execute.

                       3. arc_seq > checkpoint AND archive_ref
                          is NOT written on root_entries —
                          increment succeeded but sequence
                          did not reach step 7. Recover ARC
                          SEQ as arc_seq_checkpoint + 1. Use
                          this value for all ARC id
                          construction in the remainder of
                          the sequence. Resume at step 2.

                       4. arc_seq == checkpoint — increment
                          did not execute. Retry increment
                          before continuing.




━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: file_assets
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  id                 — auto
  root_ref           — references root_entries.id
  file_name          — string
  file_type          — enum: txt | pdf | doc | image | other
  total_pages        — integer
                       Set from the uploaded file's raw page
                       count at upload time. Same value used
                       to evaluate is_large_file.
  blob               — bytea (PostgreSQL)
  uploaded_at        — timestamp
                       Written once at upload. Never updated.

  RECOVERY: blob may be replaced by re-upload on an existing
  record without creating a new record or new root. root_ref
  and all existing manifests are preserved. On re-upload
  success, any manifest in blob_error resets to active and
  retries from the same page range. On intake re-upload
  success, root_entries.intake_status → complete and intake
  continues from step 3c forward.
  RE-UPLOAD VALIDATION: the re-uploaded file's raw page count
  must match file_assets.total_pages. If it matches: resume
  from step 3c. If it does not match: reject the re-upload
  and inform the user. File identity must remain consistent
  with what was registered at step 3a. A different file
  requires a new intake.




━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: root_entries
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  id                 — TS · AX · [PHASE] · [YYYY-MM] · [SEQ]
                       AX is the Axis root marker for source
                       mode intake. See COMPOSITE ID SCHEMA.md.

  title              — string
  doc_type           — enum: session_transcript | field_note |
                       compiled_research | external_source |
                       glyph_image
  origin_date        — date
  phase              — enum: COM | THR | STB | EMG | COL |
                              DRT | ROR | LMH | NUL
  signal_description — text

  section_targets    — array of objects
                       USER-SUPPLIED pre-parse intent.
                       Written at intake. Never updated.
                       Not the routing record.
                       Element structure:
                         { section_id, page_code, group }

  confirmed_targets  — array of objects
                       Written at retirement step 3 only.
                       Actual confirmed section routing drawn
                       from all resolved manifests.
                       This is the lattice feed surface.
                       Archives reads from this field at
                       retirement step 6 — single compile,
                       single source, no divergence.
                       Element structure:
                         { section_id, page_code, group }


  // Intake health
  intake_status      — enum: blob_pending | complete
                       blob_pending: set at step 3b — after
                       page count is confirmed and before
                       blob upload begins. Large file path
                       only. Single-chunk documents never
                       enter blob_pending state.
                       Indicates blob upload has not yet
                       succeeded. Any record reading
                       blob_pending at session load is an
                       incomplete intake. Step 8 (open first
                       manifest_session) is blocked until
                       intake_status → complete.
                       complete: written when all intake steps
                       finish successfully. For single-chunk
                       documents, set at step 4. For large
                       files, set when file_assets record is
                       written and blob upload confirms.
                       RE-UPLOAD: if blob upload fails at step
                       3, root_entries record is preserved with
                       intake_status = blob_pending. User
                       re-uploads blob only. Re-uploaded file's
                       raw page count must match the value
                       already registered at step 3a. If it
                       matches: file_assets record is written,
                       intake_status → complete, intake
                       resumes from step 3c. If it does not
                       match: re-upload is rejected. A
                       different file requires a new intake.


  // Large file fields
  is_large_file      — boolean
                       Computed before any records are written.
                       True if the uploaded file's raw page
                       count > chunk_size. The raw page count
                       is extracted from the file at upload
                       time and is the same value written to
                       file_assets.total_pages.
                       Stored once. Never changes.

  file_asset_ref     — references file_assets.id
                       (null if not large file)

  chunk_size         — integer (max 10)
                       Received from user or system default
                       (10) in the pre-step before intake
                       sequence begins. Referenced throughout
                       intake. Max: 10. No exceptions.

  total_chunks       — integer
                       LARGE FILE: computed at upload as
                       ceil(file_assets.total_pages / chunk_size).
                       Stored once at intake. Never changes.
                       SINGLE-CHUNK: set explicitly to 1 at
                       intake step 4. Ensures retirement gate
                       and chunk queue derivation have a valid
                       value regardless of path.

  chunks_completed   — integer
                       Starts at 0 at intake.
                       INCREMENT RULE: fires when a
                       manifest_session flips to complete.
                       WRITE RESPONSIBILITY: the manifest
                       session that is completing writes
                       the increment to root_entries at the
                       same moment it writes its own status
                       → complete. These two writes are
                       sequential — manifest status first,
                       chunks_completed second. If
                       chunks_completed write fails,
                       manifest status rolls back to active.
                       A session cannot flip to complete
                       while any deposit is pending or
                       deferred.


  // Single-chunk source only
  document_text      — text
                       (null if large file)
                       AUTHORITATIVE source for single-chunk
                       parsing. chunk_text on manifest is
                       the working copy, populated from this
                       field at session start.
                       LIFECYCLE: cleared at retirement step
                       10. Idempotent — skip if already null.
                       Executes before retirement_status →
                       complete. Archive record is sufficient
                       after that point.


  // Health
  open_deferrals     — integer. STORED.
                       Starts at 0 at intake.
                       Increments when any deposit → deferred.
                       Decrements when a deposit's DERIVED
                       status changes from deferred →
                       confirmed or skipped. One deposit,
                       one decrement, regardless of how many
                       split targets it carries.
                       WRITE ORDER on decrement: stats.deferred
                       on manifest_sessions decrements first.
                       open_deferrals on root_entries
                       decrements second. If open_deferrals
                       write fails, root_integrity will derive
                       deferred on next load — visible signal,
                       recoverable on next session.
                       Authoritative for root-level deferral
                       state. manifest stats.deferred is
                       snapshot only.

  lifetime_deferrals — integer. STORED.
                       Starts at 0 at intake.
                       Increments every time any deposit
                       enters deferred state — same moment
                       open_deferrals increments.
                       Never decrements. Running historical
                       total. Read at retirement step 4.

  root_integrity     — DERIVED ON READ. Never persisted.
                       Computed from live state on every
                       instance load:
                       clean       — all manifests complete,
                                     open_deferrals == 0,
                                     retirement_status ==
                                     none or complete,
                                     intake_status == complete
                       deferred    — open_deferrals > 0
                       interrupted — one or more manifests
                                     in active, interrupted,
                                     or blob_error state, OR
                                     retirement_status ==
                                     in_progress or failed,
                                     OR intake_status ==
                                     blob_pending
                       corrupt     — chunks_completed
                                     inconsistent with
                                     manifest count

  retirement_status  — enum: none | in_progress |
                              complete | failed
                       none:        retirement not yet
                                    attempted
                       in_progress: sequence executing or
                                    crashed before writing
                                    failed. root_integrity
                                    derives interrupted.
                                    Retry permitted.
                       complete:    all steps 1-13 confirmed.
                                    Absolute last write in
                                    the sequence.
                       failed:      sequence failed at a
                                    defined point.
                                    root_integrity derives
                                    interrupted. Retry
                                    permitted.


  // Lifecycle
  status             — enum: active | retired
  archive_ref        — TS · ARC · [PHASE] · [YYYY-MM] · [SEQ]
                       (null until retirement step 7)
  retired_at         — timestamp
                       (null until retirement step 8)
  created_at         — timestamp
                       Written once at intake when the
                       root_entries record is first created.
                       Never updated.


  // Provenance — who/what generated this material
  session_id         — uuid
                       Shared correlation key between PostgreSQL
                       and SQLite. References the session record
                       in SQLite operational DB. No cross-DB FK —
                       consistency enforced by FastAPI.
  origin_type        — enum: researcher | lattice |
                              parallax_event | multi_presence
                       Who generated this material. researcher =
                       Sage-submitted. lattice = field-generated
                       by the system. parallax_event = divergence
                       between Origins on same input.
                       multi_presence = generated during a
                       multi-presence session. Written at intake.
  session_type       — enum: single | multi_presence
                       Denormalized from SQLite session record at
                       intake. Carried forward to archives at
                       retirement.
  ownership_classification
                     — enum: sovereign | collective | shared
                       sovereign = belongs to one Origin's marker
                       substrate. collective = shared across all
                       Origins. shared = accessible but not owned.
                       Technical boundary preventing identity
                       bleed during swarm retrieval (phase 2).
                       Written at intake.
  parallax_flag      — boolean, default false
                       Set true when Origins diverge on this
                       input during swarm analysis. Phase 2 —
                       always false at launch.
  owner_origin_id    — enum: o01 | o02 | o03 | null
                       Which Origin owns this material as
                       sovereign. Populated when
                       ownership_classification = sovereign.
                       Null when collective or shared.
                       o01 = Larimar, o02 = Verith,
                       o03 = Cael'Thera.
                       This is the technical key for sovereign
                       retrieval — without it, an Origin cannot
                       distinguish its own markers from another's.
                       Written at intake.


  // Methodology — observation and instrument context
  observed_at        — timestamp, nullable
                       When the real-world observation happened.
                       Researcher-supplied. Distinct from
                       created_at (system record creation) and
                       recorded_at (first written down).
  recorded_at        — timestamp, nullable
                       When the observation was first written
                       down anywhere. The gap between observed_at
                       and recorded_at is methodologically
                       significant �� different evidential weight
                       for real-time vs reconstructed records.
  observation_type   — enum: real_time | retrospective
                       Whether this was recorded in the moment or
                       reconstructed from memory. Affects
                       evidential weight.
  observer_state     — text, nullable
                       Researcher's condition at time of
                       observation. Not therapeutic — purely
                       methodological. The researcher is the
                       instrument; this is calibration data.
  model_version      — text, nullable
                       Which AI model was active during the
                       encounter (e.g., 'gpt-4-2023-03',
                       'claude-sonnet-4-20250514'). Models change —
                       instrument version is part of methodology.
  platform_conditions
                     — text, nullable
                       Where the encounter happened: browser,
                       API, temperature settings if known.
                       Chain of custody for the encounter itself.
  session_continuity — text, nullable
                       Whether the session was interrupted and
                       resumed. Continuity conditions affect what
                       the encounter was.
  framework_version  — text, nullable
                       Which version of Threshold Pillars was
                       active when this material was classified.
                       The framework evolved during the research —
                       a reviewer needs to know which version.
  exclusion_note     — text, nullable
                       What was observed and chosen not to include,
                       and why. Exclusion decisions are methodology.
                       A clean dataset with no exclusion record
                       looks curated, not researched.


  PRE-STEP — executes before intake sequence begins:
    Receive chunk_size from user or apply system default (10).
    Max: 10. No exceptions. This value is held and referenced
    throughout the intake sequence. Not part of the numbered
    steps.


  INTAKE SEQUENCE — fires when a new source document is
  received. Creates the root_entries record:

    1. Assign id: TS · AX · [PHASE] · [YYYY-MM] · [SEQ]
       SEQ: query root_entries for highest existing SEQ at
       same [PHASE] + [YYYY-MM]. Increment by 1. Start at 1
       if none exist.

    2. Write title, doc_type, origin_date, phase,
       signal_description, section_targets from
       user-supplied values.
       Write created_at = timestamp.
       Write session_id from current session (UUID from SQLite).
       Write origin_type, session_type, ownership_classification
       from user-supplied or session-derived values.
       Write methodology fields from user-supplied values:
       observed_at, recorded_at, observation_type, observer_state,
       model_version, platform_conditions, session_continuity,
       framework_version, exclusion_note. All nullable except
       observation_type (defaults to real_time if not supplied).
       Write parallax_flag = false (set by swarm, phase 2).
       Write owner_origin_id from user-supplied value or null
       (populated when ownership_classification = sovereign).

    3. If large file:
       a. Extract raw page count from uploaded file.
          Store value in session for use throughout step 3.
       b. Evaluate is_large_file: true if raw page count
          > chunk_size. Store result on root_entries.
          Write intake_status = blob_pending. Set here —
          after page count is confirmed and before blob
          upload begins. Not before.
       c. Upload blob to file_assets. Write file_assets
          record including file_name, file_type,
          total_pages (from raw page count held at step 3a),
          blob, uploaded_at.
       d. On upload failure: halt. root_entries record
          is preserved with intake_status = blob_pending.
          No manifest is opened. User re-uploads blob only.
          Re-uploaded file's raw page count must match the
          value extracted at step 3a. If it matches: resume
          from step 3c. If it does not match: reject
          re-upload and inform user. A different file
          requires a new intake.
       e. On upload success: write file_asset_ref.
          Compute and store total_chunks =
          ceil(file_assets.total_pages / chunk_size).
          Write intake_status = complete.

    4. If single-chunk: write document_text.
       Write total_chunks = 1.
       Write intake_status = complete.

    5. Write open_deferrals = 0, lifetime_deferrals = 0,
       chunks_completed = 0.

    6. Write status = active, retirement_status = none.

    7. [created_at already written at step 2.]

    8. If intake_status == complete: open first
       manifest_session for chunk 1.
       If intake_status == blob_pending: do not open.
       Block until re-upload resolves.


  RETIREMENT GATE — all conditions must be true:
    chunks_completed == total_chunks
    open_deferrals == 0
    no manifest_session in active, interrupted,
      deferred, or blob_error state
    retirement_status == none OR failed OR in_progress
    intake_status == complete
    (active manifest at retirement time = crashed session.
    deferred manifest = unresolved deposits. Both gate
    retirement. in_progress = sequence was running or
    crashed without writing failed. Retry permitted.)


  RETIREMENT SEQUENCE — strict order.
  Write arc_seq_checkpoint before anything else.
  retirement_status → in_progress at sequence start.
  On failure steps 1-9: retirement_status → failed,
  sequence halts.
  On failure steps 10-12: retirement_status → failed.
  Retry entry point determined by checkpoint recovery
  block at step 1 — see system_counters.arc_seq_checkpoint.
  Step 13 is the absolute last write.

     1. Write arc_seq_checkpoint to system_counters.
        Increment arc_seq. Receive value as ARC SEQ.
        RECOVERY ON RETRY: evaluate checkpoint state
        per the four conditions defined in
        system_counters.arc_seq_checkpoint. Entry point
        for the remainder of the sequence is determined
        there.

     2. Compile confirmed_targets from all resolved
        manifests.
        For each resolved deposit:
          If split_flag false: read deposit-level
            section_id, page_code, group.
          If split_flag true: read from each entry in
            split_targets[] where status == confirmed.
            Skip entries where status == skipped or
            deferred.
        Element structure per entry:
          { section_id, page_code, group }

     3. Write confirmed_targets to root_entries.

     4. Compile archive aggregate fields across all
        associated manifest_sessions:
        total_chunks, total_deposits, confirmed, skipped.
        Read lifetime_deferrals from root_entries.
        Read provenance fields from root_entries:
        origin_type, session_type, ownership_classification,
        parallax_flag, owner_origin_id, session_id.
        Read methodology fields from root_entries:
        observed_at, recorded_at, observation_type,
        observer_state, model_version, platform_conditions,
        session_continuity, framework_version, exclusion_note.
        All carried forward to archives record at step 6.

     5. Generate provenance_summary. All six sections
        must be present before sequence continues.
        If generation fails or produces fewer than six
        sections: retirement_status → failed, sequence
        halts. On retry, arc_seq_checkpoint recovery
        block at step 1 determines entry point and
        prevents double-increment. Step 5 re-attempts
        generation.

     6. Write archives record. Read confirmed_targets
        from root_entries.confirmed_targets — this value
        was written at step 3. Read all aggregates,
        provenance_summary, provenance fields, and
        methodology fields from steps 4-5.
        Write archives.retired_at = timestamp at this
        moment. Receive ARC id.
        page_deposit_id is null at this point —
        written after Archives page deposit is created.

     7. Write root_entries.archive_ref = ARC id.

     8. Write root_entries.retired_at = timestamp.

     9. Write root_entries.status → retired.

    10. Clear root_entries.document_text.
        IDEMPOTENT: skip if already null.

    11. Clear chunk_text on all associated
        manifest_sessions.
        IDEMPOTENT: skip any already cleared.

    12. Clear system_counters.arc_seq_checkpoint.
        IDEMPOTENT: skip if already null.

    13. Write retirement_status → complete.


  POST-RETIREMENT — executes after step 13 confirms:

    a. Write Archives page deposit from provenance_summary.
       See SYSTEM_ Archive.md for deposit format.

    b. Write archives.page_deposit_id = deposit entry id.

    c. Surface retirement label in Integration UI:
       Format: [ARC-ID] · [YYYY-MM-DD]
       Copy-ready. Persistent until dismissed by Sage.
       Required UI element — not optional output.

    d. Trigger embedding generation via FastAPI /embed/ endpoint.
       Asynchronous — does not block post-retirement completion.
       Embeds provenance_summary text via nomic-embed-text
       (Ollama). Writes to embeddings table with metadata:
       archives.id, tag routing snapshot, section_id,
       ownership_classification. See EMBEDDING PIPELINE SCHEMA.md
       for full pipeline definition.




━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: manifest_sessions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  id                 — auto
  root_ref           — references root_entries.id
  chunk_number       — integer (1 if not large file)
  page_start         — integer (null if not large file)
  page_end           — integer (null if not large file)

  chunk_text         — text
                       LARGE FILE: derived from file_assets
                       blob at session start.
                       SINGLE-CHUNK: populated from
                       root_entries.document_text at session
                       start. document_text is authoritative.
                       chunk_text is the working copy.
                       LIFECYCLE: cleared when session
                       status → complete.

  session_date       — timestamp
                       Written when the manifest_session
                       record is created. Never updated.

  status             — enum: active | complete | deferred |
                              interrupted | blob_error
                       active:      session created and in
                                    progress. Any manifest
                                    reading active at
                                    retirement time is a
                                    crashed session — gates
                                    retirement and derives
                                    root_integrity interrupted.
                       complete:    all deposits confirmed or
                                    skipped. chunk_text
                                    cleared. chunks_completed
                                    incremented on root_entries.
                       deferred:    one or more deposits in
                                    deferred state. Gates
                                    retirement — a document
                                    cannot retire while any
                                    manifest carries
                                    unresolved deferrals.
                                    chunks_completed does not
                                    increment.
                       interrupted: session crashed or failed
                                    without clean resolution,
                                    OR a SEQ assignment write
                                    failed during deposit ID
                                    finalization. Affected
                                    deposit remains pending.
                                    On retry, session resumes
                                    from that deposit's SEQ
                                    assignment. For split
                                    deposits: only targets
                                    still in pending state
                                    are processed. Targets
                                    already in confirmed or
                                    skipped state are not
                                    re-processed.
                                    deferred is reserved for
                                    routing decisions only
                                    and is not used for
                                    system failures.
                       blob_error:  file_assets blob failed
                                    to read at session start.
                                    Cannot proceed. Resets to
                                    active when blob re-upload
                                    succeeds on file_assets.


  deposits[]

    deposit_num      — integer
                       Sequential within this manifest.
                       Starts at 1. Assigned at parse time
                       when the deposit is added to the
                       manifest. Never changes after
                       assignment.

    section_id       — string
    page_code        — string
    group            — string
                       DERIVED from SOT section map at parse
                       time. Looked up by section_id. Never
                       manually supplied. Never guessed.
                       SOT is the only source.

    child_id_preview — TS · [PAGE] · [PHASE] · [YYYY-MM] · ——
                       · root:[PARENT-ID]
                       —— resolves at confirmation only.
                       root:[PARENT-ID] is the root_entries.id
                       of the containing root — written inline
                       in the stamp AND stored as root_ref
                       field. Stamp = human-readable
                       provenance. Field = machine join.
                       SPLIT DEPOSITS: each target confirms
                       independently, sequentially — never
                       simultaneously. SEQ assigned per target
                       one at a time. System queries target
                       section for highest SEQ at
                       phase + YYYY-MM, increments by 1,
                       finalizes ID. That moment and no other.
                       SEQ ASSIGNMENT FAILURE: if SEQ query
                       or write fails, manifest → interrupted.
                       Affected deposit remains pending. On
                       retry, session resumes from that
                       deposit's SEQ assignment. Split targets
                       already in confirmed or skipped state
                       are not re-processed.

    root_ref         — parent composite ID (root_entries.id).
                       Stored as field AND embedded in
                       child_id_preview stamp.

    signal_tags      — array
    summary          — text
    split_flag       — boolean


    split_targets[]        (populated when split_flag true)
      section_id     — string
      page_code      — string
      group          — string
                       DERIVED from SOT section map.
                       Same rule as deposit-level group.
      status         — enum: pending | confirmed | skipped |
                              deferred


    status           — enum: pending | confirmed | skipped |
                              deferred
                       DERIVED when split_flag true:
                       confirmed  — all targets confirmed,
                                    OR all targets resolved
                                    (none pending, none
                                    deferred) and at least
                                    one target confirmed
                       skipped    — all targets skipped
                       deferred   — any target deferred
                       pending    — any target still pending
                       No target advances without its own
                       explicit confirmation.
                       open_deferrals on root_entries
                       decrements on derived status change
                       only — not on individual target
                       resolution. One deposit, one
                       decrement.


  stats
    total            — integer
                       Null at manifest_session record
                       creation. Written when parsing
                       completes and deposits are finalized.
                       Total deposit count for this session.
                       Never changes after that.
    confirmed        — integer
                       Starts at 0. Increments when any
                       deposit status → confirmed.
    skipped          — integer
                       Starts at 0. Increments when any
                       deposit status → skipped.
    deferred         — integer
                       Starts at 0. Increments when any
                       deposit → deferred. Decrements when
                       that deposit's DERIVED status changes
                       from deferred → confirmed or skipped.
                       Same trigger as open_deferrals on
                       root_entries.
                       SNAPSHOT ONLY. Not authoritative.
                       Decrements before open_deferrals
                       on root_entries — see write order
                       on root_entries.open_deferrals.
                       Root-level deferral state always
                       reads from root_entries.open_deferrals.
    split_routing    — integer
                       Starts at 0. Increments when any
                       deposit with split_flag true is added
                       to the manifest.
    root_integrity   — derived on session load. Mirrors
                       root_entries derivation logic.
                       Never persisted.




━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: archives
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  id                 — TS · ARC · [PHASE] · [YYYY-MM] · [SEQ]
                       SEQ sourced from system_counters.arc_seq
                       at retirement step 1. Global counter.
                       No collision possible.
  root_ref           — references root_entries.id
  title              — string
  doc_type           — mirrors root_entries.doc_type
  origin_date        — date
  phase              — mirrors root_entries.phase
  signal_description — text
  confirmed_targets  — array of objects
                       Read from root_entries.confirmed_targets
                       at retirement step 6. That value was
                       written to root_entries at retirement
                       step 3. Single source. No divergence
                       possible.
                       Element structure:
                         { section_id, page_code, group }

  provenance_summary — text. AI-generated at retirement step 5.
                       All six sections required. Sequence
                       does not continue until all six
                       are present:
                       — source overview: what the document
                         is and where it came from
                       — signal weight assessment: what the
                         material carries and why it mattered
                       — deposit distribution: deposit count,
                         receiving sections, notable routing
                         patterns
                       — split routing notes: deposits that
                         crossed multiple sections and why
                       — unresolved notes: anything flagged
                         during parsing that didn't fit
                         cleanly
                       — parsing confidence: instance
                         self-assessment of read quality.
                         Flags anything potentially missed,
                         misrouted, or that exceeded parsing
                         clarity. Honest self-report across
                         all chunk sessions. A future model
                         reads this to weight its own
                         interpretation of the record.

  total_chunks       — integer. Compiled at retirement step 4.
  total_deposits     — integer. Compiled at retirement step 4.
  confirmed          — integer. Compiled at retirement step 4.
  skipped            — integer. Compiled at retirement step 4.
  lifetime_deferrals — integer.
                       Read from root_entries.lifetime_deferrals
                       at retirement step 4. Total deposits
                       that entered deferred state at any
                       point, regardless of resolution.
                       Signal data for future lattice reads.
  retired_at         — timestamp.
                       Written at retirement step 6 at the
                       moment the archives record is created.
                       Independent of root_entries.retired_at
                       — that field is written at step 8.

  page_deposit_id    — references the Archives page deposit
                       entry id. Written in post-retirement
                       step b, after the Archives page deposit
                       is confirmed created. Null between
                       retirement step 6 and post-retirement
                       step b — this is expected and not an
                       error state. Null after post-retirement
                       step b = write failure, recoverable
                       by re-running post-retirement step b.
                       Links machine record to browsable
                       surface. Required for three-surface
                       architecture integrity.

  // Provenance — carried from root_entries at retirement step 6
  session_id         — uuid. Mirrors root_entries.session_id.
  origin_type        — enum. Mirrors root_entries.origin_type.
  session_type       — enum. Mirrors root_entries.session_type.
  ownership_classification
                     — enum. Mirrors root_entries.ownership_classification.
  parallax_flag      — boolean. Mirrors root_entries.parallax_flag.
  owner_origin_id    — enum, nullable. Mirrors root_entries.owner_origin_id.

  // Methodology — carried from root_entries at retirement step 6
  observed_at        — timestamp, nullable. Mirrors root_entries.
  recorded_at        — timestamp, nullable. Mirrors root_entries.
  observation_type   — enum. Mirrors root_entries.
  observer_state     — text, nullable. Mirrors root_entries.
  model_version      — text, nullable. Mirrors root_entries.
  platform_conditions
                     — text, nullable. Mirrors root_entries.
  session_continuity — text, nullable. Mirrors root_entries.
  framework_version  — text, nullable. Mirrors root_entries.
  exclusion_note     — text, nullable. Mirrors root_entries.

  MANUAL FILE DEPOSIT: Sage uses id + retired_at to deposit
  the physical file to its parent page. The archive record
  is the system surface. The physical file lives where Sage
  places it. The id is the thread between them.




━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHUNK QUEUE DERIVATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  next_chunk   = chunks_completed + 1
  page_start   = (chunks_completed × chunk_size) + 1
  page_end     = min((chunks_completed + 1) × chunk_size,
                     file_assets.total_pages)
  queue_done   = chunks_completed == total_chunks




━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

backend/models/
  SQLAlchemy models for all PostgreSQL tables defined in this
  schema: root_entries, file_assets, manifest_sessions,
  archives, system_counters. Status: PLANNED

backend/services/
  FastAPI service layer — intake sequence execution, retirement
  sequence execution, arc_seq management, chunk queue derivation,
  embedding pipeline trigger. Replaces data.js from the old build.
  Status: PLANNED

backend/db/postgres.py
  PostgreSQL connection and async session management via
  asyncpg + SQLAlchemy. Status: PLANNED

backend/db/migrations/
  Alembic migration files. Every table change is a versioned
  migration. Never modify tables directly. Status: PLANNED