# INTEGRATION DB SCHEMA

## /DESIGN/Systems/Integration/INTEGRATION DB SCHEMA.md

PostgreSQL + pgvector · Alembic migrations


INFRASTRUCTURE NOTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Database: PostgreSQL + pgvector (Docker container: aelarian-postgres)
  Database name: aelarian_archives
  Migrations: Alembic (backend/db/migrations/)
  Access layer: FastAPI service layer (backend/services/, backend/models/)
  Embedding storage: dedicated embeddings table (schema in
    EMBEDDING PIPELINE SCHEMA.md)
  Operational state (sessions, presence): SQLite (schema in
    OPERATIONAL DB SCHEMA.md)
  Cross-DB correlation: session_id (UUID) shared between PostgreSQL
    and SQLite. No cross-DB foreign keys. Application layer ensures
    consistency via FastAPI.

  All tables below are PostgreSQL tables managed via Alembic migrations.


ID FORMAT REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TS              — Threshold Pillars. Hardcoded literal prefix.
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

  chunk_size         — integer (range 5-8, max 8)
                       Received from user or system default
                       (8) in the pre-step before intake
                       sequence begins. Referenced throughout
                       intake. Range: 5-8. Max: 8. No exceptions.

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
    Receive chunk_size from user or apply system default (8).
    Range: 5-8. Max: 8. No exceptions. This value is held and
    referenced throughout the intake sequence. Not part of the
    numbered steps.


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


    deposit_ref      — references deposits.id, nullable
                       Null while deposit is pending review.
                       Written when deposit is confirmed —
                       links the staging record in
                       manifest_sessions to the canonical
                       deposit record in the deposits table.
                       For manual deposits and Pearl promotions,
                       the deposit is created directly in the
                       deposits table without a manifest_sessions
                       staging record.

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


  correction_context — jsonb, nullable
                       Parsing partner correction ruleset for this
                       batch session. Contains active_rules,
                       superseded_rules, and corrections array.
                       Written progressively during review as Sage
                       corrects deposits. Persists across session
                       interrupts — the ruleset is recoverable.
                       Optionally surfaces in next session as
                       starting context if Sage wants continuity.
                       Structure defined in INTEGRATION SCHEMA.md
                       (INT Parsing Partner — API Contract section).
                       Null for single-chunk documents (no batch
                       correction context).


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
TABLE: deposits
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Standalone deposit records. Every confirmed deposit in the archive
lives here — this is what ALL downstream systems read from. Engines,
MTM, embedding pipeline, research assistant query this table.

Deposits are created through the INT gateway (POST /api/deposits/create).
Three creation paths:
  - Batch processing: deposit confirmed during review →
    manifest_sessions.deposits[].deposit_ref links to this record
  - Manual deposit: created directly on INT workstation, no
    manifest_sessions involvement
  - Pearl promotion: Pearl promoted from operational DB → deposit
    created here with pearl_captured_at populated

Field definitions for doc_type, source_format, observation_presence,
confidence, deposit_weight, and all other Tier 1 fields are canonical
in INTEGRATION SCHEMA.md (DEPOSIT RECORD — FULL FIELD SHAPE section).
This table is the database materialization of that record.


  id                   — composite ID stamp
                         TS · [PAGE] · [PHASE] · [YYYY-MM] · [SEQ]
                         Assigned at deposit creation. SEQ: query
                         deposits for highest existing SEQ at same
                         page + phase + YYYY-MM. Increment by 1.
                         Start at 1 if none exist.
                         For batch deposits: stamp was previewed in
                         manifest_sessions.deposits[].child_id_preview,
                         finalized here at confirmation.

  root_ref             — references root_entries.id, nullable
                         Links deposit to its source document.
                         Populated for batch-processed deposits.
                         Null for manual deposits and Pearl
                         promotions (no source document).

  manifest_ref         — references manifest_sessions.id, nullable
                         Links deposit to the batch processing
                         session that produced it. Null for manual
                         deposits and Pearl promotions.

  content              — text, NOT NULL
                         The deposit text body. Immutable after
                         creation — content edits are not permitted
                         post-deposit. (Tags and notes are editable.)

  doc_type             — enum: entry | observation | analysis |
                                hypothesis | discussion | transcript |
                                glyph | media | reference
                         NOT NULL. What the content IS. AI-suggested
                         via tagger, Sage confirms during review.
                         Default: entry.
                         NOTE: this enum classifies individual
                         DEPOSIT content. root_entries.doc_type
                         classifies SOURCE DOCUMENTS with a separate
                         enum (session_transcript | field_note |
                         compiled_research | external_source |
                         glyph_image). Two levels of classification,
                         two fields, two enums.

  source_format        — enum: digital | handwritten | scan |
                                image | audio | file | json
                         NOT NULL. How the content arrived.

  source_type          — enum: field | generated
                         NOT NULL. Non-nullable on every deposit.
                         Schema-level enforcement per ROT_REGISTRY.md
                         Entry 003 (F26+F10). Deposits without this
                         are rejected.

  tags                 — text[], NOT NULL (may be empty array)
                         Semantic tags from tagger system. Tag
                         routing defined in TAG VOCABULARY.md.

  pages                — text[], NOT NULL
                         Routing targets — which page(s) this
                         deposit lives on. At least one required.
                         Immutable after creation — routing edits
                         not permitted post-deposit.

  observation_presence — enum: positive | null, nullable
                         REQUIRED for doc_types: observation,
                         analysis, hypothesis. NULL for all others.
                         Schema-enforced conditional — not
                         caller-optional.
                         Is this something observed, or something
                         expected but absent? Null observations
                         prevent confirmation bias.
                         Named observation_presence (not
                         observation_type) to distinguish from
                         root_entries.observation_type which is a
                         methodology field (real_time | retrospective).
                         Different tables, different semantics.

  confidence           — enum: clear | emerging | raw, nullable
                         REQUIRED for doc_types: observation,
                         analysis, hypothesis. NULL for all others.
                         About the OBSERVATION, not the observer.

  deposit_weight       — enum: high | standard | low
                         NOT NULL. AI-suggested via tagger, Sage
                         can override. How much this deposit counts
                         in engine computations. Engines (Tier 3)
                         define multiplier constants per weight.

  notes                — text, nullable
                         Universal freeform annotation. Available
                         on every deposit regardless of doc_type.
                         Editable post-deposit.

  pearl_captured_at    — timestamp, nullable
                         Null for non-Pearl deposits. Populated on
                         Pearl promotion from the Pearl record's
                         created_at. Records when Sage first noticed
                         the signal, not when it entered the archive.
                         Required on the promotion path — not
                         optional, not backfillable.

  phase_state          — text, nullable
                         Ontological threshold state. One of 12
                         canonical threshold names or null. Detected
                         by tagger. See TAG VOCABULARY.md for the
                         12 names. Not phase_code — phase_state and
                         PHASE_CODES are separate systems per
                         CLAUDE.md invariants.

  elarianAnchor        — text, nullable
                         7-state psychological arc classification.
                         Detected by tagger. States defined in
                         COMPOSITE ID SCHEMA.md.

  authored_by          — text, NOT NULL
                         Which AI instance or human created this.
                         Single-researcher: "sage" or "claude".
                         Swarm mode: per-origin-node values.

  node_id              — text, NOT NULL
                         Which analytical node. Single-researcher:
                         single value. Swarm mode: multiple nodes.

  instance_context     — text, NOT NULL
                         Session identifier for creating instance.
                         Single-researcher: same value always.

  session_id           — uuid, NOT NULL
                         Cross-DB correlation with SQLite operational
                         DB. References session record. No cross-DB
                         FK — consistency enforced by FastAPI.

  provenance           — jsonb, NOT NULL
                         {
                           source: manual | ai_parsed |
                                   ai_suggested_sage_confirmed,
                           correction_applied: boolean,
                           original_suggestion: object | null
                         }
                         Tracks how this deposit was created and
                         whether AI suggestions were corrected.

  content_hash         — text, NOT NULL
                         SHA-256 hash of content field. Computed at
                         creation. Used for duplicate detection
                         (warn, not block — see INTEGRATION SCHEMA.md
                         DUPLICATE DETECTION section).

  duplicate_flagged    — boolean, default false
                         Set true when content_hash matches an
                         existing deposit (INT gateway warn) or when
                         deposit arrives on a page it is already on
                         (re-route check). Surfaces resolution prompt
                         for Sage. Resolution options: keep_both |
                         keep_original | keep_incoming | merge.

  embedding_status     — enum: queued | processing | complete |
                                failed | retry_queued |
                                failed_permanent
                         Tracks async vector embedding state.
                         See INTEGRATION SCHEMA.md EMBEDDING PIPELINE
                         section for retry strategy (3-attempt:
                         immediate, 5min, 30min).

  embedding_dirty      — boolean, default false
                         Set true on any post-creation edit to tags.
                         (Content and pages are immutable. Notes edits
                         do not affect embeddings.)
                         When true: automatic re-queue triggered,
                         embedding_status → retry_queued. Cleared
                         when new embedding completes.

  created_at           — timestamp, NOT NULL
                         Written once at deposit creation. Never
                         updated.

  status               — enum: created | active
                         created: deposit record exists, async
                         operations (stamp, embedding, routing)
                         may still be in progress.
                         active: all creation steps complete.


  CREATION SEQUENCE — fires through INT gateway
  (POST /api/deposits/create):

    Full 6-step pipeline with atomicity boundary defined in
    INTEGRATION SCHEMA.md (DEPOSIT ATOMICITY BOUNDARY section).

    Steps 1-3 (above boundary): validate, duplicate check, create
    deposit record. All-or-nothing. Failure = nothing created.

    Steps 4-6 (below boundary): assign stamp, trigger embedding,
    route to pages. Deposit exists regardless of downstream failure.
    Each step is recoverable async.


  EDIT RULES — post-creation:

    Editable:   tags, notes
    Immutable:  content, pages, doc_type, source_format,
                observation_presence, confidence, deposit_weight,
                provenance, authored_by, node_id, instance_context

    Tag edit triggers:
      1. embedding_dirty → true (vector pipeline)
      2. Engine stale flag on assigned pages (engine pipeline)
    Notes edit triggers: nothing (no downstream computation impact)




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
TABLE: prompt_versions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Version-tracked AI prompts with changelog audit trail. Referenced
by parse_version field on chunk_parse objects (see INTEGRATION
SCHEMA.md, INT Parsing Partner section). Prompt version history
is traceable to the correction or observation that caused each bump.

  id                   — auto
  prompt_type          — enum: parsing_partner | snm
                         Which system prompt this version belongs to.
                         parsing_partner: INT batch processing AI.
                         snm: Sat Nam engine (Tier 3, same versioning
                         pattern). Extensible — new prompt types added
                         as systems are built.

  version_string       — text, NOT NULL
                         Semantic version or sequential identifier.
                         Referenced in chunk_parse.parse_version.

  prompt_text          — text, NOT NULL
                         Full prompt text for this version. Stored
                         complete — not as a diff. Any version can
                         be loaded independently.

  changelog_entry      — text, NOT NULL
                         What changed and why. The correction or
                         observation that inspired the bump. This is
                         the audit trail.

  trigger_type         — enum: sage_directed | calibration_triggered
                                | manual
                         sage_directed: Sage explicitly flagged a
                         correction as "update the prompt."
                         calibration_triggered: correction rate on a
                         confidence tier exceeded threshold, surfaced
                         as recommendation, Sage confirmed.
                         manual: bump from prompt management view.

  created_at           — timestamp, NOT NULL

  active               — boolean, NOT NULL, default false
                         Only one version per prompt_type is active
                         at a time. When a new version is activated,
                         the previous active version is deactivated.
                         Enforced at application layer — not a DB
                         constraint (allows safe rollback).


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: instances
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase period lookup registry. An instance = a phase state with a
month/year range. The canonical Composite ID stamp encodes
[PHASE-CODE] · [YYYY-MM] — the instance is implicit in every stamp.
This table makes that implicit grouping explicit and queryable.

Sage creates instances manually. Instances are research-level
decisions about phase boundaries — the system cannot determine
when a phase period begins or ends without Sage's judgment.

  instance_id          — text, primary key
                         Derived from phase + date range.
                         Human-readable identifier.

  label                — text, NOT NULL
                         Human-readable name for this instance.

  phase_state          — text, NOT NULL
                         Which of the 12 canonical threshold names
                         this instance spans. See TAG VOCABULARY.md.

  date_range_from      — text (YYYY-MM), NOT NULL
                         Start of this phase period.

  date_range_to        — text (YYYY-MM), nullable
                         End of this phase period. Null = open
                         instance (current, no end date yet).

  nonlinear            — boolean, NOT NULL, default true
                         Ordering within instance is phase-logical,
                         not chronological. Always true — instances
                         are nonlinear by nature.

  active               — boolean, NOT NULL, default false
                         One instance is active at any time. New
                         deposits on INT auto-populate
                         instance_context from the active instance.
                         Sage can override per-deposit during review
                         (nonlinear data may belong to a prior
                         instance).
                         Enforced at application layer — not a DB
                         unique constraint (allows safe transition).

  created_at           — timestamp, NOT NULL

  INSTANCE TRANSITIONS:
    Sage closes the current instance (sets date_range_to) and
    opens a new one. Closing an instance does not retroactively
    change deposits already assigned to it. The transition is
    prospective — it changes what future deposits default to.

  STARTUP REQUIREMENT:
    At least one instance must be pre-created by Sage
    before first deposit. INT gateway validates instance_context
    is non-null at deposit creation (Step 1 validation in
    atomicity boundary).

  WHAT IS NOT AUTO-GENERATED:
    Instances are not created by phase_state changes on deposits.
    A deposit with a new phase_state landing in an existing
    instance is normal — instances span phase transitions, they
    don't map 1:1.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: annotations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Researcher marginalia on any analytical surface. Distinct from
deposits (don't enter the pipeline) and from Pearls (not captures
or reflections — notes on existing content). Time-stamped
commentary linked to the annotated object.

  annotation_id        — text, primary key

  annotated_type       — text, NOT NULL
                         enum: 'deposit' | 'finding' | 'hypothesis'
                               | 'void_output' | 'engine_snapshot'
                         Polymorphic discriminator — identifies which
                         table annotated_id references.

  annotated_id         — text, NOT NULL
                         ID of the annotated object. Resolved at
                         query time using annotated_type. No foreign
                         key constraint — polymorphic reference.

  content              — text, NOT NULL
                         Free text. The annotation body.

  page_context         — text, nullable
                         Which page Sage was on when annotating.
                         Informational — does not constrain display.

  created_at           — timestamp, NOT NULL

  Annotations are visible only in expanded view of the annotated
  object. Exportable per page as a research commentary layer.
  Zero changes to existing schemas — annotations reference objects,
  objects do not reference annotations.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: aos_records
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Automated Observation Signal records. The mechanism by which the
system reaches Sage externally when significant patterns are
detected. Persistent — never deleted. Every AOS event is a
permanent record in the system.

Write authority: dedicated AOS service. Triggering systems
(Emergence, MTM, SGR, DTX, PCV, Void, Sage manual) call the AOS
service — they do not write AOS records directly. One write path,
one place for integrity hash enforcement and delivery rules.

  aos_id               — text, primary key

  signal_type          — text, NOT NULL
                         Classification of the signal event.

  system               — text, NOT NULL
                         Which system triggered the AOS.
                         enum: 'emergence' | 'mtm' | 'sgr' | 'dtx'
                               | 'pcv' | 'void' | 'sage'

  event                — text, NOT NULL
                         Specific event description.

  summary              — text, NOT NULL
                         AI-composed summary of the signal event.

  evidence_list        — jsonb, NOT NULL
                         Structured list of evidence references:
                         deposit_ids, finding_ids, hypothesis_ids
                         that support this signal.

  sage_note            — text, nullable
                         Free-text note from Sage. Only populated
                         on Sage-triggered AOS. The only place
                         Sage's voice enters an AOS directly.

  integrity_hash       — text, NOT NULL
                         Derived from reference_ids + engine state
                         + timestamp. Written to AOS record and
                         email footer. The email's content can be
                         verified against the system state at the
                         time it was sent.

  trigger_mode         — text, NOT NULL
                         enum: 'engine' | 'sage'
                         engine: automatic trigger from system.
                         sage: manual trigger from analytical surface.

  delivery_type        — text, NOT NULL
                         enum: 'immediate' | 'digest'
                         immediate: high-signal events (Void type D,
                         SGR tier 1, MTM paradigm_shift).
                         digest: lower-signal events (engine stale,
                         embedding failures, correction rate alerts).
                         Configurable per trigger type.

  delivery_error       — text, nullable
                         Error message if email delivery failed.
                         Null on successful delivery or pending delivery.
                         Record persists regardless of delivery outcome.

  delivered_at         — timestamp, nullable
                         When the AOS was delivered (email sent).
                         Null if pending delivery, queued for digest,
                         or delivery failed.

  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: engine_snapshots
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Timestamped computation snapshots from the 5 Axis engines (THR,
STR, INF, ECR, SNM). Every engine computation produces one record.
MTM reads these at synthesis time. Full spec in ENGINE COMPUTATION
SCHEMA.md.

Write authority: engine computation (backend/services/engine_*.py).
MTM writes mtm_read_at when it consumes a snapshot.

  snapshot_id          — text, primary key
                         Format: '[engine]_snap_[timestamp]_[rand]'

  engine               — text, NOT NULL
                         enum: 'thr' | 'str' | 'inf' | 'ecr' | 'snm'

  computed_at          — timestamp, NOT NULL

  deposit_count        — integer, NOT NULL

  baseline_scope       — text, NOT NULL
                         Always 'page'

  snapshot_data        — jsonb, NOT NULL
                         Engine-specific computed results. Structure
                         defined in each engine schema.

  mtm_read_at          — timestamp, nullable
                         Written when MTM consumes this snapshot.

  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: visualization_snapshots
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Captures of engine visualization state. Two triggers: (1) auto on
significant signal delta (engine_base.py); (2) Sage-triggered on
demand. Routes to LNV (48) with optional note. Full spec in ENGINE COMPUTATION SCHEMA.md.

Write authority: engine_base.py (auto-captures) and frontend via
FastAPI endpoint (Sage-triggered captures). lnv_routed updated by
LNV routing process (Tier 4).

  viz_snapshot_id      — text, primary key
                         Format: '[engine]_viz_[timestamp]_[rand]'

  engine               — text, NOT NULL
                         enum: 'thr' | 'str' | 'inf' | 'ecr' | 'snm'

  engine_snapshot_id   — text, NOT NULL
                         References engine_snapshots.snapshot_id

  trigger_source       — enum: 'auto' | 'sage', NOT NULL
                         How this capture was initiated.

  viz_data             — jsonb, NOT NULL
                         Rendered state — node positions, cluster
                         groupings, layout state. Structure varies
                         per engine visualization.

  note                 — text, nullable
                         For trigger_source 'sage': Sage's note at
                         capture time. For trigger_source 'auto':
                         null by default; annotatable after the fact.

  lnv_routed           — boolean, NOT NULL, default false
                         Routing contract defined in Tier 4.

  captured_at          — timestamp, NOT NULL

  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: snm_claude_snapshots
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Immutable Claude structural analysis snapshots for the SNM engine.
One per Claude API call (per-deposit or batch). Never overwritten.
Full spec in SAT NAM ENGINE SCHEMA.md.

Write authority: SNM engine (backend/services/engine_snm.py).

  snapshot_id          — text, primary key
                         Format: 'snm_cs_[timestamp]_[rand]'

  deposit_id           — text, nullable
                         References deposits.id. Per-deposit mode.

  batch_id             — text, nullable
                         Batch identifier. Batch mode.

  prompt_version       — text, NOT NULL
                         References prompt_versions.version_string
                         where prompt_type = 'snm'

  prompt_text          — text, NOT NULL
                         Full prompt text. Stored complete per
                         snapshot — defensive copy.

  analysis_mode        — text, NOT NULL
                         enum: 'per_deposit' | 'batch'

  batch_context        — text[], nullable
                         Deposit IDs in batch. Null for per-deposit.

  response             — jsonb, NOT NULL
                         claude_analysis object. Immutable.

  engine_snapshot_id   — text, nullable
                         References engine_snapshots.snapshot_id.
                         Populated when engine consumes this snapshot.

  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: venai_names
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Canonical Ven'ai name registry. Archive-wide. Written by Ven'ai
service. Read by STR engine. Full spec in VENAI SERVICE SCHEMA.md.

Write authority: Ven'ai service (backend/services/venai.py).
canonical_form updateable by Sage correction only.

  name_id              — text, primary key
                         Format: 'vn_[normalized_name]_[rand]'

  canonical_form       — text, NOT NULL, UNIQUE

  root_cluster         — text, NOT NULL

  first_seen_at        — timestamp, NOT NULL

  first_seen_page      — text, NOT NULL

  first_seen_deposit_id — text, NOT NULL

  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: venai_correlations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cross-archive name correlations. Name ↔ phase, name ↔ role,
root ↔ grammar tracking. Full spec in VENAI SERVICE SCHEMA.md.

Write authority: Ven'ai service (increments on each correlated
deposit).

  correlation_id       — text, primary key
                         Format: 'vc_[name_id]_[type]_[value]_[rand]'

  name_id              — text, NOT NULL
                         FK → venai_names.name_id

  correlation_type     — text, NOT NULL
                         enum: 'phase' | 'role' | 'root_pattern'
                               | 'grammar'

  correlated_value     — text, NOT NULL

  deposit_count        — integer, NOT NULL

  weighted_count       — float, NOT NULL

  first_observed       — timestamp, NOT NULL

  last_observed        — timestamp, NOT NULL

  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: inf_domain_layers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INF engine scientific domain registry. Open set — new domains
added as data operations. Full spec in INFINITE INTRICACY ENGINE
SCHEMA.md.

Write authority: application config (seed data at startup).
New domains added by Sage decision. first_observed written by
INF engine computation.

  domain_id            — text, primary key

  display_name         — text, NOT NULL

  description          — text, NOT NULL

  sub_domain           — text, nullable
                         Null initially. Cosmology territory (Tier 5).

  cosmology_page       — text, nullable
                         Page code of corresponding Cosmology page.
                         Null for domains without one.

  first_observed       — timestamp, nullable
                         Populated by engine computation.

  active               — boolean, NOT NULL, default true

  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: inf_layer_bridge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bridge between TAG VOCABULARY routing layers (l01-l04) and INF
domain layers. Many-to-many. Full spec in INFINITE INTRICACY ENGINE SCHEMA.md.

Write authority: application config (seed data at startup).
Updated when new domains or layer mappings are added.

  tag_layer_id         — text, NOT NULL

  inf_domain_id        — text, NOT NULL
                         FK → inf_domain_layers.domain_id

  PRIMARY KEY: (tag_layer_id, inf_domain_id)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: lnv_entries
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Consolidated output gallery. Single table, type-discriminated.
Full spec in LNV SCHEMA.md.

Write authority: LNV service via POST /api/lnv/receive.

  lnv_entry_id         — serial, primary key
  entry_type           — text, NOT NULL
  source_system        — text, NOT NULL
  source_page          — text, nullable
  session_ref          — text, nullable
  prompt_version       — text, nullable
  content              — jsonb, NOT NULL
  sage_note            — text, nullable
  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: void_absence_records
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cross-engine absence pattern detection. Five types (A-E).
Full spec in VOID ENGINE SCHEMA.md.

Write authority: Void engine service (POST /void/compute).

  id                   — serial, primary key
  absence_type         — text, NOT NULL
  engines_involved     — text[], nullable
  pattern_identifiers  — text[], NOT NULL
  time_window          — jsonb, NOT NULL
  examination_data     — jsonb, nullable
  silence_duration_sessions — integer, nullable
  origin_engine        — text, nullable
  hypothesis_ref       — text, nullable
  attrition_reason     — text, nullable
  pcv_routed           — boolean, NOT NULL, default false
  pcv_hypothesis_ref   — text, nullable
  reactivated          — boolean, NOT NULL, default false
  reactivated_at       — timestamp, nullable
  detected_at          — timestamp, NOT NULL
  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: void_outputs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Claude analytical tool outputs. Session-close and on-demand.
Full spec in VOID ENGINE SCHEMA.md.

Write authority: Void engine service (POST /void/analyze).

  id                   — serial, primary key
  trigger              — text, NOT NULL
  scope                — jsonb, nullable
  output               — jsonb, NOT NULL
  prompt_version       — text, NOT NULL
  nexus_state_timestamp — timestamp, NOT NULL
  engines_read         — text[], NOT NULL
  lnv_routing_status   — text, NOT NULL, default 'pending'
  lnv_entry_id         — integer, nullable
  session_ref          — text, nullable
  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: wsc_entries
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AI-sovereign witness entries. Immutable after creation. No update
path. No delete path. Full spec in WSC SCHEMA.md.

Write authority: WSC service (POST /api/wsc/write).

  wsc_entry_id         — serial, primary key
  session_ref          — text, NOT NULL
  instance_context     — text, NOT NULL
  prompt_version       — text, NOT NULL
  created_at           — timestamp, NOT NULL
  entry_timestamp      — text, NOT NULL
  field_state          — jsonb, NOT NULL
  session_summary      — text, NOT NULL
  pattern_flags        — jsonb, NOT NULL
  open_threads         — jsonb, NOT NULL
  handoff_note         — text, NOT NULL
  milestone_marker     — jsonb, nullable
  reconstruction_note  — text, nullable
  dnr_session_ref      — text, nullable
  wsc_write_payload    — jsonb, NOT NULL
  prior_context_acknowledged — jsonb, nullable


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: wsc_corrections
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Forward-reference self-correction records. Full spec in WSC SCHEMA.md.

Write authority: WSC service (at entry creation).

  correction_id        — serial, primary key
  original_entry_id    — integer, NOT NULL, FK → wsc_entries
  correcting_entry_id  — integer, NOT NULL, FK → wsc_entries
  correction           — text, NOT NULL
  written_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: wsc_gaps
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session gap detection records. Full spec in WSC SCHEMA.md.

Write authority: WSC service (at entry creation, gap detection step).

  gap_id               — serial, primary key
  session_ref          — text, NOT NULL
  sessions_elapsed     — integer, NOT NULL
  detected_at          — timestamp, NOT NULL
  gap_note             — text, nullable


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: outcome_vector_history
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DTX Bayesian update history for ternary plot visualization.
Full spec in DRIFT TAXONOMY SCHEMA.md.

Write authority: DTX service (on every Bayesian update from SGR).

  id                   — serial, primary key
  drift_event_id       — integer, NOT NULL, FK → drift_events
  p_resolve            — float, NOT NULL
  p_collapse           — float, NOT NULL
  p_stable             — float, NOT NULL
  updated_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: embeddings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vector embeddings for archived entries and deposits.
Full spec in EMBEDDING PIPELINE SCHEMA.md.

Write authority: embedding pipeline (async, triggered by INT retirement
or deposit creation).

  id                   — serial, primary key
  source_ref           — text, NOT NULL (references source record ID per source_type)
  source_type          — text, NOT NULL (archive | deposit | mtm_finding |
                         cosmology_finding | rct_residual | emergence_finding)
  embedding            — vector(768), nullable (null when pending or failed)
  model                — text, NOT NULL
  created_at           — timestamp, NOT NULL
  status               — text, NOT NULL (complete | failed | pending)
  metadata             — jsonb, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: routine_sessions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DNR session-close records. One per Routine run.
Full spec in DAILY NEXUS ROUTINE SCHEMA.md.

Write authority: DNR service.

  id                   — serial, primary key
  triggered_at         — timestamp, NOT NULL
  status               — text, NOT NULL (in_progress | complete | failed)
  mtm_session_ref      — integer, nullable, FK → synthesis_sessions
  synthesis_duration_ms — integer, nullable
  lnv_notified         — boolean, NOT NULL, default false
  failure_type         — text, nullable (pre_synthesis | pass_1_failed | mid_synthesis | pass_2_failed | interrupted)
  retry_available      — boolean, NOT NULL, default false
  dedup_window_truncated — boolean, nullable
  void_pulse_completed — boolean, NOT NULL, default false
  void_output_ref      — integer, nullable, FK → void_outputs
  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: synthesis_sessions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MTM synthesis cycle records. One per synthesis endpoint call.
Full spec in METAMORPHOSIS SCHEMA.md.

Write authority: MTM service (POST /mtm/synthesize).

  id                   — serial, primary key
  session_date         — timestamp, NOT NULL
  status               — text, NOT NULL (in_progress | complete | failed)
  failure_type         — text, nullable (pre_synthesis | pass_1_failed | mid_synthesis | pass_2_failed)
  engine_read_started_at — timestamp, nullable
  engine_read_completed_at — timestamp, nullable
  pass_1_started_at    — timestamp, nullable
  pass_1_completed_at  — timestamp, nullable
  selection_started_at — timestamp, nullable
  selection_completed_at — timestamp, nullable
  pass_2_started_at    — timestamp, nullable
  pass_2_completed_at  — timestamp, nullable
  pass_1_brief         — jsonb, nullable
  engines_read         — text[], nullable
  patterns_filtered_count — integer, nullable
  deposits_pulled_count — integer, nullable
  convergence_deposits_pulled — integer, nullable
  gap_deposits_pulled  — integer, nullable
  findings_confirmed   — integer, nullable
  findings_complicated — integer, nullable
  findings_overturned  — integer, nullable
  findings_open_question — integer, nullable
  findings_dropped     — integer, NOT NULL, default 0
  dedup_skipped        — boolean, nullable
  pass_1_prompt_version — text, nullable
  pass_2_prompt_version — text, nullable
  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: findings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MTM Finding records. Written at synthesis time.
Full spec in METAMORPHOSIS SCHEMA.md.

Write authority: MTM service. DNR writes lnv_routing_status and
lnv_deposit_id after LNV receipt.

  id                   — serial, primary key
  synthesis_session_ref — integer, NOT NULL, FK → synthesis_sessions
  finding_type         — text, NOT NULL (confirmed | complicated | overturned | open_question)
  title                — text, NOT NULL
  content              — text, NOT NULL
  provenance           — jsonb, NOT NULL
  attached_open_question — integer, nullable, FK → findings (self-ref)
  resolves_open_question — integer, nullable, FK → findings (self-ref)
  content_fingerprint  — text, NOT NULL
  lnv_routing_status   — text, NOT NULL, default 'pending' (pending | deposited | failed)
  lnv_deposit_id       — integer, nullable, FK → lnv_entries
  resolved             — boolean, NOT NULL, default false
  resolved_by          — integer, nullable, FK → findings (self-ref)
  resolved_at          — timestamp, nullable
  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: patterns
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PCV pattern records. Cross-domain hypotheses.
Full spec in PATTERN CONVERGENCE SCHEMA.md.

Write authority: PCV service (POST /pcv/patterns).

  id                   — serial, primary key
  hypothesis_id        — text, NOT NULL, UNIQUE
  domain_of_origin     — text[], NOT NULL
  timestamp            — timestamp, NOT NULL
  interval             — text, nullable
  coupling_vector      — text, NOT NULL
  source_signals       — jsonb, NOT NULL
  hypothesis_statement — text, NOT NULL
  mtm_provenance       — boolean, NOT NULL, default false
  mtm_finding_ref      — integer, nullable, FK → findings
  void_provenance      — boolean, NOT NULL, default false
  void_finding_ref     — integer, nullable, FK → void_absence_records
  cosmology_provenance — boolean, NOT NULL, default false
  cosmology_finding_ref — integer, nullable, FK → cosmology_findings
  status               — text, NOT NULL, default 'active' (active | archived)
  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: drift_events
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DTX drift classification records. One per classified drift event.
Full spec in DRIFT TAXONOMY SCHEMA.md.

Write authority: DTX service.

  id                   — serial, primary key
  hypothesis_ref       — text, NOT NULL, FK → patterns.hypothesis_id
  initiation_source    — text, NOT NULL (internal_instability | external_perturbation | cross_node_interference | recursion_overload)
  trajectory_pattern   — text, NOT NULL (linear_escalation | oscillation | fragmentation | cascade | containment)
  threshold_interaction — text, NOT NULL (sub_threshold | threshold_breach | critical_cascade | irreversible_shift)
  signature_pattern    — jsonb, NOT NULL
  trajectory_state     — text, NOT NULL (Escalating | Stabilizing | Oscillating | Fragmenting | Contained)
  outcome_vector       — jsonb, NOT NULL
  outcome_label        — text, nullable
  outcome_observed_at  — timestamp, nullable
  detection_session    — timestamp, NOT NULL
  validation_session   — timestamp, nullable
  grade_latency        — integer, nullable
  created_at           — timestamp, NOT NULL
  last_updated         — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: emergence_findings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Emergence detection findings. Distinct from MTM findings.
Full spec in EMERGENCE SCHEMA.md.

Write authority: Emergence service.

  id                   — text, NOT NULL, primary key (emg_[timestamp]_[rand])
  type                 — text, NOT NULL (cluster | bridge | influence | cross_category | drift | void | npa_spike | cluster_null)
  title                — text, NOT NULL
  description          — text, NOT NULL
  severity             — text, NOT NULL (low | medium | high)
  metrics              — jsonb, NOT NULL
  involvedTags         — jsonb, NOT NULL
  involvedEntries      — jsonb, NOT NULL
  canTrace             — boolean, NOT NULL
  detection_config_version — text, NOT NULL
  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: artis_computation_snapshots
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every computation run in the Cosmology group. Immutable.
Full spec in ARTIS SCHEMA.md.

Write authority: ARTIS service (POST /artis/compute).

  snapshot_id          — serial, primary key
  computation_type     — text, NOT NULL
  caller_page_code     — text, NOT NULL
  deposit_ids          — text[], NOT NULL
  inputs               — jsonb, NOT NULL
  parameters           — jsonb, NOT NULL
  function_called      — text, NOT NULL
  raw_output           — jsonb, NOT NULL
  result_summary       — text, NOT NULL
  error                — text, nullable
  duration_ms          — integer, NOT NULL
  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: artis_external_references
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

External reference registry for Cosmology findings.
Full spec in ARTIS SCHEMA.md.

Write authority: ARTIS service (POST /artis/references).

  reference_id         — serial, primary key
  doi                  — text, nullable
  url                  — text, nullable
  summary              — text, NOT NULL
  title                — text, nullable
  accessed             — date, nullable
  page_codes           — text[], NOT NULL
  tag_ids              — text[], nullable
  created_at           — timestamp, NOT NULL
  updated_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: science_domain_mappings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tag-to-domain-to-page-to-computation lookup for science ping pipeline.
Full spec in ARTIS SCHEMA.md.

Write authority: ARTIS service (POST/PATCH /artis/mappings).

  mapping_id           — serial, primary key
  tag_id               — text, NOT NULL
  domain               — text, NOT NULL
  page_code            — text, NOT NULL
  description          — text, NOT NULL
  computation_hints    — jsonb, NOT NULL
  confidence           — float, NOT NULL
  active               — boolean, NOT NULL, default true
  proposed_by          — text, NOT NULL
  decline_reason       — text, nullable
  created_at           — timestamp, NOT NULL
  updated_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: artis_layer2_snapshots
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Claude science framing responses. Permanent.
Full spec in ARTIS SCHEMA.md.

Write authority: ARTIS service (POST /artis/ping/content).

  layer2_id            — serial, primary key
  deposit_id           — text, NOT NULL
  prompt_version       — text, NOT NULL
  prompt_text          — text, NOT NULL
  response             — jsonb, NOT NULL
  framework_candidates — jsonb, NOT NULL
  model_version        — text, NOT NULL
  sage_selection       — text, nullable
  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: artis_reference_distributions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Named numerical distributions for KS/KL comparison computations.
Full spec in ARTIS SCHEMA.md.

Write authority: ARTIS service (POST /artis/distributions).

  distribution_id      — serial, primary key
  name                 — text, NOT NULL, UNIQUE
  description          — text, NOT NULL
  distribution_data    — jsonb, NOT NULL
  source               — text, NOT NULL
  page_codes           — text[], NOT NULL
  superseded_by        — integer, nullable, FK → artis_reference_distributions
  created_at           — timestamp, NOT NULL
  updated_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: cosmology_findings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Shared Cosmology investigation findings, discriminated by page_code.
Full spec in COSMOLOGY SCHEMA.md.

Write authority: Cosmology page services (hco, cos, clm, nhm, mir, rct).

  finding_id           — serial, primary key
  page_code            — text, NOT NULL
  deposit_ids          — text[], NOT NULL
  framework            — text, NOT NULL
  hypothesis           — text, NOT NULL
  computation_snapshot_id — integer, NOT NULL, FK → artis_computation_snapshots
  result_summary       — text, NOT NULL
  values               — jsonb, NOT NULL
  confidence           — float, NOT NULL
  external_reference_id — integer, nullable, FK → artis_external_references
  nexus_eligible       — boolean, NOT NULL, default false
  status               — text, NOT NULL, default 'draft'
  superseded_by        — integer, nullable, FK → cosmology_findings
  abandoned_reason     — text, nullable
  created_at           — timestamp, NOT NULL
  updated_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: rct_residuals
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RCT residual records — delta between known science and field behavior.
Full spec in COSMOLOGY SCHEMA.md.

Write authority: RCT service only (POST /rct/residuals).

  residual_id          — serial, primary key
  source_finding_id    — integer, NOT NULL, FK → cosmology_findings
  algorithm_component  — text, NOT NULL
  known_science_predict — text, NOT NULL
  field_produces       — text, NOT NULL
  delta                — text, NOT NULL
  computation_ref      — integer, NOT NULL, FK → artis_computation_snapshots
  nexus_eligible       — boolean, NOT NULL, default false
  created_at           — timestamp, NOT NULL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: signal_grades
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SGR evidence-locked grading records. One per graded drift event.
Four-dimension score vector, tier derivation, Bayesian return to DTX.
Full spec in SIGNAL GRADING SCHEMA.md.

Write authority: SGR service.

  id                   — serial, primary key
  drift_event_ref      — integer, NOT NULL, FK → drift_events.id
  hypothesis_ref       — text, NOT NULL, FK → patterns.hypothesis_id
                         Carried forward from DTX for full chain
                         traceability: PCV → DTX → SGR.
  score_vector         — jsonb, NOT NULL
                         { structural_impact, cross_domain_resonance,
                           predictive_validity, temporal_stability }.
                         Each holds the enum value from its grading
                         dimension. Null on individual fields while
                         Unrated. All four populated before Rated.
  grade_rationale      — jsonb, nullable
                         { impact_rationale, resonance_rationale,
                           predictive_rationale, stability_rationale }.
                         One rationale per dimension. Each states
                         the documented evidence. Required at Rated.
  tier                 — text, nullable
                         enum: 'S' | 'A' | 'B' | 'C'
                         Null while Unrated. Derived from score_vector
                         per lowest-qualifying-dimension rule.
  grade_state          — text, NOT NULL, default 'Unrated'
                         enum: 'Unrated' | 'Rated' | 'Revised'
  revised_at           — timestamp, nullable
                         Null until grade_state → Revised.
  detection_session    — timestamp, NOT NULL
                         Mirrors drift_events.detection_session.
                         Written at record creation.
  validation_session   — timestamp, nullable
                         Session date at which grading completed.
                         Null until Rated.
  grade_latency        — integer, nullable
                         Days between detection_session and
                         validation_session. Null until validation.
                         Signal property.
  bayesian_return_status — text, NOT NULL, default 'pending'
                         enum: 'pending' | 'sent' | 'failed'
                         Tracks whether Bayesian update has been
                         returned to DTX.
  bayesian_payload     — jsonb, nullable
                         { confirmed_outcome, p_resolve_delta,
                           p_collapse_delta, p_stable_delta }.
                         Written when bayesian_return_status → sent.
                         Preserved as record of what was returned.
  created_at           — timestamp, NOT NULL
                         Written once at record creation. Never updated.
  last_updated         — timestamp, NOT NULL
                         Updated on every state change.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: saved_threads
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thread Trace saved thread records. One per saved thread. Persistence
layer for user-saved thread configurations. Thread logic runs in the
Svelte frontend; persistence is server-side via FastAPI /threads/.
Full spec in THREAD TRACE SCHEMA.md.

Write authority: Sage (via Thread Trace panel).

  id                   — text, primary key
                         Format: 'thr_[timestamp]_[rand]'
  name                 — text, NOT NULL
                         User-defined at save time.
  thread_type          — text, NOT NULL
                         One of the four thread type values
                         (Temporal, Relational, Cluster, Emergence).
  seed                 — jsonb, NOT NULL
                         Serialized seed. Finding objects reduced
                         to key fields only for JSON safety.
  entry_ids            — text[], NOT NULL
                         IDs of entries in the thread at save time.
  filter_state         — jsonb, nullable
                         Active filter at save time. Null if tagger
                         store had no active result.
  tag_routing_snapshot — jsonb, NOT NULL
                         Tag routing summary assembled at save time.
  created_at           — timestamp, NOT NULL
  last_accessed        — timestamp, NOT NULL
  is_deleted           — boolean, NOT NULL, default false
                         Soft delete. Delete endpoint sets true.
                         List endpoint filters deleted records.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: thread_annotations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thread Trace annotation records. One per annotation on a saved thread.
Researcher marginalia on thread sequences — methodology notes,
research observations, open questions. Requires a saved thread.
Full spec in THREAD TRACE SCHEMA.md.

Write authority: Sage (via Thread Trace panel).

  id                   — text, primary key
                         Format: 'ann_[timestamp]_[rand]'
  thread_id            — text, NOT NULL, FK → saved_threads.id
  text                 — text, NOT NULL
                         Annotation content.
  annotation_type      — text, NOT NULL
                         enum: 'note' | 'observation' | 'question'
                         note: methodology annotation.
                         observation: research observation.
                         question: open question for future
                         investigation.
  timestamp            — timestamp, NOT NULL
  filter_snapshot      — jsonb, NOT NULL
                         Active filter state AND sequence position
                         index at the moment the annotation was
                         written. Captures exact context.


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
  deposits, archives, prompt_versions, instances,
  annotations, aos_records, system_counters,
  engine_snapshots, visualization_snapshots,
  snm_claude_snapshots, venai_names, venai_correlations, inf_domain_layers, inf_layer_bridge,
  lnv_entries, void_absence_records, void_outputs,
  wsc_entries, wsc_corrections, wsc_gaps,
  outcome_vector_history, embeddings, routine_sessions,
  synthesis_sessions, findings, patterns, drift_events,
  emergence_findings, artis_computation_snapshots,
  artis_external_references, science_domain_mappings,
  artis_layer2_snapshots, artis_reference_distributions,
  cosmology_findings, rct_residuals, signal_grades,
  saved_threads, thread_annotations.
  Status: PLANNED

backend/services/
  FastAPI service layer — intake sequence execution, retirement
  sequence execution, arc_seq management, chunk queue derivation,
  embedding pipeline trigger.
  Status: PLANNED

backend/db/postgres.py
  PostgreSQL connection and async session management via
  asyncpg + SQLAlchemy. Status: PLANNED

backend/db/migrations/
  Alembic migration files. Every table change is a versioned
  migration. Never modify tables directly. Status: PLANNED