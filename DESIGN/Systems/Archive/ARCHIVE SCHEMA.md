╔══════════════════════════════════════════════════════════════╗
║  ARCHIVE SCHEMA  ·  ARV  ·  V1                              ║
║  /DESIGN/Systems/Archive/ARCHIVE SCHEMA.md                   ║
║  Mechanical spec — deposit format, write sequence, sealed    ║
║  enforcement, failure modes. Architectural description in    ║
║  SYSTEM_ Archive.md.                                         ║
╚══════════════════════════════════════════════════════════════╝


OWNERSHIP BOUNDARIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OWNS
Archives page deposit format — field definitions, body content structure
Write sequence — Archive-side view of post-retirement steps 1-2
Authentication threshold rejection behavior — what happens when criteria are not met
Sealed record enforcement — UI read-only, API rejection mechanics
Media intake trigger sequence — button interaction, INT handoff
Known failure modes — all guards and recovery paths

DOES NOT OWN
Three-surface architecture definition — owned by SYSTEM_ Archive.md
Sealed record rule (why) — owned by SYSTEM_ Archive.md
Authentication threshold criteria — owned by SYSTEM_ Archive.md
Nexus feed definition — owned by SYSTEM_ Archive.md
PostgreSQL archives table schema — owned by INTEGRATION DB SCHEMA.md
Post-retirement sequence — owned by INTEGRATION SCHEMA.md
Provenance summary generation — owned by INTEGRATION SCHEMA.md
ARC id generation — owned by Composite ID system
Deposit record field definitions — owned by INTEGRATION SCHEMA.md
Media deposit wiring — owned by INTEGRATION SCHEMA.md
Routing authority — owned by SOT


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHIVES PAGE DEPOSIT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The page deposit is a structured entry on the Archives page. It is not
the provenance_summary verbatim — it is a formatted deposit drawn from
that content.

REQUIRED FIELDS:

  title          — string. From root_entries.title.

  arc_id         — string. The ARC stamp id.

  retired_at     — timestamp. ISO formatted for display.

  doc_type       — enum. Mirrors root_entries.doc_type at retirement
                   time. Field definition and enum values owned by
                   INTEGRATION SCHEMA.md (deposit record field shape).
                   Value is frozen at retirement — if the upstream enum
                   changes, sealed records retain their original value.

  section        — 'archives'. Fixed value.

  type           — 'archive_record'. Fixed value.

  status         — 'sealed'. Fixed value. Written once. Never changed
                   after write.

FIELD REFERENCE PRINCIPLE:

Any field on the Archives deposit that mirrors a field on root_entries
or the deposit schema references its source definition, not a local
copy. The Archives deposit is a sealed snapshot — its field VALUES are
frozen at retirement time, but the field DEFINITIONS point upstream.
One canonical definition, referenced everywhere it appears.

Fields that mirror upstream sources:
  doc_type       → defined in INTEGRATION SCHEMA.md (deposit record)
  title          → from root_entries.title
  retired_at     → from archives.retired_at (retirement step 6)
  arc_id         → from archives.id (Composite ID system)

BODY CONTENT — SIX REQUIRED SECTIONS:

Drawn from provenance_summary. All six required. A deposit missing
any section is incomplete and must not be written.

  Source overview       — what the document is and where it came from.

  Signal weight         — what the material carried and why it
                          mattered.

  Deposit distribution  — deposit count, receiving sections, notable
                          routing patterns.

  Split routing notes   — deposits that crossed multiple sections
                          and why.

  Unresolved notes      — anything flagged during parsing that didn't
                          fit cleanly.

  Parsing confidence    — honest self-assessment of read quality.
                          Flags anything potentially missed, misrouted,
                          or that exceeded parsing clarity. A future
                          model reads this to weight its own
                          interpretation of the record.

WHAT THE DEPOSIT DOES NOT CONTAIN:

No interpretation beyond what the provenance_summary states. No
narrative framing. No thematic expansion. The deposit reflects what
the system found. It does not editorialize what it means.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WRITE SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is the Archive-side view of INTEGRATION SCHEMA.md's
POST-RETIREMENT SEQUENCE (steps 1-2). The full sequence is owned by
Integration. Archive executes its portion when called.

1. Receive retirement data from INT: root_ref, provenance_summary
   (six sections complete), confirmed_targets, deposit statistics
   (total_deposits, confirmed, skipped, lifetime_deferrals),
   retired_at, provenance fields, methodology fields.

2. Validate authentication threshold — all criteria must be met:
   - retirement_status = 'complete'
   - confirmed_targets written
   - provenance_summary contains all six sections (non-null)
   - open_deferrals = 0 or explicitly accepted
   If any criterion is unmet: deposit REJECTED. The specific unmet
   criterion is logged. No partial Archives deposit is written.
   retirement_status stays incomplete. The failure is named, not
   silent.

3. Write Archives page deposit entry drawn from provenance_summary.
   Entry fields: title, arc_id, retired_at, doc_type, section =
   'archives', type = 'archive_record', status = 'sealed'.

4. Return deposit entry id to INT. INT writes page_deposit_id on
   the PostgreSQL archives record (post-retirement step 2).

Failure at step 2: threshold not met. Deposit rejected with named
  criterion. No write occurs. INT informed of failure.
Failure at step 3: Archives page deposit write fails. PostgreSQL
  archives record exists with page_deposit_id null. Recovery: re-run
  from step 3 only — PostgreSQL record is already written.
Failure at step 4: return fails. Both surfaces exist but page_deposit_id
  is not written. Recovery: page_deposit_id null on a PostgreSQL archives
  record with a retired_at timestamp is a visible recovery signal —
  resolvable by querying Archives deposits for matching arc_id.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEALED RECORD ENFORCEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Entries with status 'sealed' are read-only. No edit function is
exposed on sealed entries in the UI. The FastAPI service layer
enforces this at the update layer — updates to sealed entries are
rejected.

Why this matters is defined in SYSTEM_ Archive.md (sealed record rule).
This section defines how it is enforced.

UI enforcement:
  No edit button, no inline editing, no field modification on sealed
  entries. The sealed entry card renders in a read-only display mode.

API enforcement:
  PATCH /entries/{id} rejects any update where the entry's status =
  'sealed'. Returns error with explanation. No partial update written.

Database enforcement:
  No additional DB-level constraint required — application layer is
  sufficient given single-service architecture. If V2+ introduces
  multiple write paths, add a PostgreSQL trigger or check constraint
  on the status field.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEDIA INTAKE TRIGGER SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. User opens media intake form from dropdown on any page.
2. User selects file and submits.
3. File and metadata routed to INT as a new source document intake
   with doc_type matching the file type.
4. INT intake sequence begins — file receives provenance, parsing,
   confirmed_targets routing, and retirement in the normal sequence.

Failure at step 3: form submission fails. No INT record created.
  User notified. No partial state written.

Full media deposit wiring (doc_type mapping, upload flow, storage,
display card) in INTEGRATION SCHEMA.md.

GUARD: no direct file attachment path exists on content page entries.
The only upload path is this trigger, which routes to INT. If a direct
attachment mechanism is ever added for other purposes, it must be
explicitly scoped to non-source-document file types.

PLANNED: exact UI spec — dropdown position, label, form fields, file
type handling, INT handoff implementation.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROVENANCE AND METHODOLOGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The archives record carries provenance and methodology fields from
root_entries, written at retirement step 6. These fields are carried
forward — not re-derived. The archive is a sealed snapshot of what
was known at retirement time.

Provenance fields (from root_entries):
  session_id, origin_type, session_type, ownership_classification,
  parallax_flag, owner_origin_id

Methodology fields (from root_entries):
  observed_at, recorded_at, observation_type, observer_state,
  model_version, platform_conditions, session_continuity,
  framework_version, exclusion_note

These travel with the sealed record so that any future reader (human
or AI) has full chain of custody without needing to join back to
root_entries.

Field definitions owned by INTEGRATION DB SCHEMA.md. Values frozen
at retirement time.

Embedding is generated asynchronously post-retirement and stored in
the dedicated embeddings table (see EMBEDDING PIPELINE SCHEMA.md).
The archive record itself does not carry the vector.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. PAGE_DEPOSIT_ID NOT WRITTEN AFTER RETIREMENT
PostgreSQL archives record has no pointer to the browsable surface.
The three surfaces are linked only by ARC id — no direct
machine-readable join between PostgreSQL record and page deposit.
Guard: page_deposit_id is written at write sequence step 4 after
the Archives page deposit is confirmed created. Never left null
after a successful post-retirement.

2. ARCHIVES PAGE DEPOSIT WRITTEN BEFORE POSTGRESQL RECORD
Write sequence inverts. page_deposit_id cannot be written to the
PostgreSQL record because the record does not exist yet.
Guard: PostgreSQL archives record is always created first (retirement
step 6 in INTEGRATION SCHEMA.md). Archives page deposit written at
post-retirement step 1. page_deposit_id written at post-retirement
step 2. Sequence is non-negotiable.

3. SEALED ENTRY MODIFIED AFTER RETIREMENT
A sealed record is updated — status changed, body edited, fields
overwritten. The ledger no longer reflects what actually happened
at retirement. Chain of custody is broken.
Guard: entries with status 'sealed' are read-only in the UI. No edit
function exposed. FastAPI service layer rejects updates to sealed
entries at the update layer.

4. MEDIA FILE UPLOADED DIRECTLY TO A PAGE ENTRY
File bypasses INT. No provenance. No confirmed_targets. Cross-mapping
impossible. The file exists on one entry in one section with no
routing record.
Guard: no direct file attachment path exists on content page entries.
The only upload path is the media intake trigger, which routes to INT.

5. ARCHIVES PAGE DEPOSIT MISSING A PROVENANCE SECTION
The deposit is incomplete. Future models cannot assess parsing
confidence. Signal weight and routing distribution are absent.
Guard: provenance_summary completeness validated at authentication
threshold check (write sequence step 2). All six sections must be
present. Deposit rejected if any section is missing.

6. AUTHENTICATION THRESHOLD NOT MET — SILENT FAILURE
Document reaches Archives page deposit step without meeting all
threshold criteria. Partial or invalid deposit written.
Guard: authentication threshold is validated explicitly at write
sequence step 2. If any criterion is unmet, the deposit is rejected.
The specific unmet criterion is logged. No partial Archives deposit
is written. The failure is named, not silent. Same pattern as INT's
atomicity boundary — clear rejection before write, never partial
records.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PUBLIC API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARV.writeArchiveDeposit(archivesRecord) → string
  Validates authentication threshold. Creates the Archives page
  deposit entry drawn from provenance_summary content. Returns the
  deposit entry id. Called by INT at post-retirement step 1.
  Rejects with named criterion if threshold not met.

ARV.activateSection(sectionId) → void
  Activates the ARV section in the UI. Called on section navigation.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

backend/services/entry.py
  FastAPI service layer — PostgreSQL archives table record creation,
  page_deposit_id write, sealed entry enforcement, authentication
  threshold validation, embedding trigger.
  Status: PLANNED

backend/models/
  SQLAlchemy models — archives table with provenance and methodology
  fields.
  Status: PLANNED

frontend/src/
  Svelte components — Archives page render, sealed entry display
  (read-only card), media intake trigger dropdown.
  Status: PLANNED
