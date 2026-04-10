# INTEGRATION SCHEMA

## INT · V1

## /DESIGN/Systems/Integration/INTEGRATION SCHEMA.md

Mechanical spec — sequences, fields, contracts, state machines.
Architectural/behavioral description in SYSTEM_ Integration.md.


OWNERSHIP BOUNDARIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OWNS
Intake sequence — all 8 steps, both paths (single-chunk and large file)
Manifest session mechanics — states, chunk_text lifecycle, chunks_completed rules
Deposit anatomy — all field definitions, split deposit mechanics, SEQ assignment
Deposit resolution — confirmed · skipped · deferred state definitions
Retirement gate — 5 conditions
Retirement sequence — 13 steps, atomic, checkpoint recovery
Post-retirement sequence — 4 steps, non-atomic, independent of retirement
INT gateway deposit creation contract — POST /api/deposits/create, full request/response
Deposit atomicity boundary — 6-step pipeline with boundary marked
INT parsing partner API contract — parse object, correction propagation, prompt versioning
Batch processing system — document flow, rolling buffer, chunk tracking, state machine
Review queue interaction spec — card layout, skip/decline flows, staleness
Media deposit wiring — doc_type mapping, upload flow, display card
Black Pearl promotion flow — Pearl → INT gateway → deposit
Duplicate detection — hash-based, warn not block
KIN cross-deposit rule — secondary VEN deposit trigger
Embedding pipeline — async embedding, retry, invalidation
Known failure modes — all guards and recovery paths
Public API — endpoint contracts

DOES NOT OWN
Database table schema — owned by INTEGRATION DB SCHEMA.md
Architectural identity — owned by SYSTEM_ Integration.md
AI behavioral posture — owned by SYSTEM_ Integration.md
Routing authority — owned by SOT
Composite ID construction — owned by composite ID service
Tag resolution — owned by tagger service
Research assistant — owned by Tier 6 design


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPOSIT RECORD — FULL FIELD SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every deposit in the archive carries these fields. This shape is what
ALL downstream systems read from. Getting this wrong means migrating
data later.

ALREADY DEFINED (existing schemas):

  content              — text body of the deposit
  page_target /
    section_id         — which page(s) this deposit routes to
  tags                 — semantic tags from tagger system
  composite_id         — stamp from Composite ID system (root, native,
                         or child)
  timestamp            — when the deposit was created
  phase_state          — ontological threshold state (12 canonical
                         names or null)
  elarianAnchor        — 7-state psychological arc classification
                         (or null)

CLASSIFICATION FIELDS:

  doc_type             — what the content IS. AI-suggested via tagger,
                         Sage confirms or overrides during review.
                         Enum:
                           entry        — general input, raw source
                                          material (default)
                           observation  — researcher notices a pattern
                           analysis     — deeper analytical work
                           hypothesis   — proposed testable idea
                           discussion   — dialogue / conversation content
                           transcript   — verbatim record
                           glyph        — visual symbol
                           media        — image / audio / video
                           reference    — external source (paper,
                                          article, someone else's work)
                         Unlocks conditional fields: observation,
                         analysis, and hypothesis doc_types unlock
                         observation_presence and confidence. Other
                         doc_types do not display these fields.
                         doc_type is a database field only — not
                         encoded in the composite ID stamp. Travels
                         in AI-facing JSON export as top-level field.
                         (Confirmed in COMPOSITE ID SCHEMA.md,
                         verified 2026-04-06.)

  source_format        — how the content arrived. Separate axis from
                         doc_type. A handwritten observation is
                         doc_type: observation + source_format:
                         handwritten.
                         Enum:
                           digital      — typed / digital text
                           handwritten  — scanned handwritten pages
                           scan         — scanned printed material
                           image        — photograph / image file
                           audio        — audio recording
                           file         — uploaded document (PDF, etc.)
                           json         — structured JSON data file

  source_type          — field | generated
                         Non-nullable on every entry. Schema-level
                         enforcement. Entries without this are rejected.

RESEARCHER OBSERVATION FIELDS (conditional — doc_type dependent):

These fields ONLY appear for researcher doc_types: observation,
analysis, hypothesis. They do NOT appear for raw input doc_types
(entry, discussion, transcript, etc.). This prevents the deposit
flow from feeling like a wellness check when ingesting raw source
material.

  observation_presence — positive | null
                         Is this something observed, or something
                         expected but absent? Null observations are
                         the mechanism that prevents confirmation
                         bias. "I looked for X and it wasn't there"
                         is first-class data. Only meaningful for
                         researcher observations — raw input just IS.
                         Named observation_presence (not observation_type)
                         to distinguish from root_entries.observation_type
                         which is a methodology field (real_time |
                         retrospective). Different tables, different
                         semantics — different names.

  confidence           — clear | emerging | raw
                         About the OBSERVATION, not the observer.
                         How formed is this observation?
                           clear    — "I'm certain this pattern is here"
                           emerging — "I think I'm seeing something"
                           raw      — "Just logging this, no idea what
                                       it is yet"

UNIVERSAL METADATA FIELDS:

  notes                — universal optional freeform text field.
                         Available on EVERY deposit regardless of
                         doc_type. Covers researcher conditions
                         during observations, batch review context,
                         any annotation that enriches the deposit.

  deposit_weight       — high | standard | low
                         AI-suggested via tagger, Sage can override.
                         How much this deposit should count in engine
                         computations. AI assesses based on doc_type,
                         content specificity, and confidence. Simple
                         tier, not numeric — less precision risk,
                         easier to read and override. Engines (Tier 3)
                         decide how to use the weight value.

  pearl_captured_at    — timestamp | null
                         Null for all non-Pearl deposits (manual,
                         batch-parsed). Populated on Pearl promotion
                         with the Pearl record's created_at value —
                         when Sage actually noticed the signal, not
                         when it entered the archive.
                         Why this matters: deposit's created_at records
                         when it entered the archive. pearl_captured_at
                         records when the signal first appeared to the
                         researcher. The gap between the two is itself
                         data. Required field on the promotion path —
                         populated from Pearl record's created_at before
                         deposit creation. Not optional, not backfillable.
                         Engine/MTM behavior: engines and MTM use
                         created_at for computational ordering.
                         pearl_captured_at is metadata — travels with the
                         deposit for provenance and temporal analysis but
                         does not change how engines process the deposit.

SWARM FOUNDATION FIELDS:

  authored_by          — which AI instance or human created this.
                         Launch: always "sage" or "claude".
                         Swarm phase: per-origin-node values.

  node_id              — which analytical node.
                         Launch: single value.
                         Swarm phase: multiple nodes.

  instance_context     — pointer to the active instance in the instance
                         registry. Phase period with date range. Sage
                         creates manually. One active at a time.
                         Validated non-null at deposit creation.

DROPPED FIELDS (session 15 — recorded for audit trail):
  deposit_depth (deep|standard|fragment) — redundant with doc_type,
    confidence, and content itself.
  researcher_state — felt like judging personal state, not capturing
    research data. Replaced by universal notes field.
  session_depth — same reason. Replaced by notes field.
  condition_notes — replaced by universal notes field available on
    all doc_types.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRE-STEP — BEFORE INTAKE BEGINS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

chunk_size — integer. Range: 5-8. Max: 8. No exceptions. Received from
Sage or system default (8) applied. Referenced throughout intake and all
manifest sessions. Determines total_chunks and page range per session.

Set once. Does not change after intake begins.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTAKE SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fires when a new source document is received. Creates the root_entries
record.

Pre-step: chunk_size received or default applied.

1. Assign root entry id: TS · AX · [PHASE] · [YYYY-MM] · [SEQ]
   SEQ: query root_entries for highest existing SEQ at same
   [PHASE] + [YYYY-MM]. Increment by 1. Start at 1 if none exist.

2. Write: title · doc_type · origin_date · phase · signal_description
   · section_targets (user-supplied pre-parse intent — written once,
   never updated)
   Write: created_at = timestamp

3. Large file path:
   a. Extract raw page count from uploaded file. Hold value in
      session for use throughout step 3.
   b. Evaluate is_large_file: true if raw page count > chunk_size.
      Store on root_entries. Never changes after this point.
      Write: intake_status = blob_pending. Status is set here —
      after page count is confirmed and before blob upload begins.
      Not before.
   c. Upload blob to file_assets. Write file_assets record:
      file_name · file_type · total_pages (from 3a) · blob ·
      uploaded_at
   d. On upload failure: halt. root_entries preserved with
      intake_status = blob_pending. No manifest opened. User
      re-uploads blob only. Re-uploaded file's raw page count
      must match value from step 3a. Match → resume from step 3c.
      No match → reject re-upload. A different file requires new
      intake.
   e. On upload success: write file_asset_ref. Compute and store:
      total_chunks = ceil(total_pages / chunk_size)
      Write: intake_status = complete

4. Single-chunk path:
   Write: document_text (full document text)
   Write: total_chunks = 1
   Write: intake_status = complete

5. Write: open_deferrals = 0 · lifetime_deferrals = 0 ·
   chunks_completed = 0

6. Write: status = active · retirement_status = none

7. [created_at already written at step 2]

8. If intake_status == complete: open first manifest_session for
   chunk 1. If intake_status == blob_pending: do not open. Block
   until re-upload resolves.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANIFEST SESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A manifest session is the working unit of parsing. One per chunk.
Each session receives a page range (or the full document for
single-chunk), parses deposit candidates, and tracks their resolution.

SESSION STATES:

  active       — session created and in progress. Any manifest reading
                 active at retirement time is a crashed session — gates
                 retirement.
  complete     — all deposits confirmed or skipped. chunk_text cleared.
                 chunks_completed incremented on root_entries.
  deferred     — one or more deposits in deferred state. Gates
                 retirement. chunks_completed does not increment.
  interrupted  — session crashed without clean resolution, OR a SEQ
                 assignment write failed during deposit ID finalization.
                 Affected deposit remains pending. Retry resumes from
                 that deposit's SEQ assignment. Split targets already
                 in confirmed or skipped state are not re-processed.
                 deferred is reserved for routing decisions only — not
                 used for system failures.
  blob_error   — file_assets blob failed to read at session start.
                 Cannot proceed. Resets to active when blob re-upload
                 succeeds on file_assets.

CHUNK_TEXT LIFECYCLE:

  Large file: derived from file_assets blob at session start.
  Single-chunk: populated from root_entries.document_text at session
  start. document_text is authoritative. chunk_text is the working copy.
  Cleared when: session status → complete.

CHUNKS_COMPLETED INCREMENT RULE:

  Fires when a manifest_session flips to complete. The completing
  session writes the increment to root_entries at the same moment it
  writes its own status → complete. Two writes, sequential order:
  1. manifest status → complete
  2. chunks_completed incremented on root_entries
  If chunks_completed write fails, manifest status rolls back to active.
  A session cannot flip to complete while any deposit is pending or
  deferred.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPOSIT ANATOMY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each deposit candidate identified during parsing is an element in the
manifest_session deposits array.

  deposit_num      — sequential within this manifest. Assigned at parse
                     time. Never changes after assignment.
  section_id       — the target section
  page_code        — the target page code
  group            — DERIVED from SOT section map at parse time. Looked
                     up by section_id. Never manually supplied. Never
                     guessed. SOT is the only source.
  child_id_preview — TS · [PAGE] · [PHASE] · [YYYY-MM] · ——
                     · root:[PARENT-ID]
                     —— resolves to SEQ at confirmation only.
                     root:[PARENT-ID] = root_entries.id written inline
                     in stamp AND stored as root_ref field. Stamp =
                     human-readable provenance. Field = machine join.
  root_ref         — parent composite ID (root_entries.id)
  signal_tags      — array of proposed tags
  summary          — text
  split_flag       — boolean. True if deposit routes to more than one
                     section.
  status           — confirmed | skipped | deferred | pending

SPLIT DEPOSITS:

When split_flag is true, the deposit carries a split_targets array.
Each target has its own section_id · page_code · group · status.
Targets confirm independently, sequentially — never simultaneously.
SEQ is assigned per target one at a time at the moment of confirmation.

Split deposit status derived from targets:
  confirmed  — all targets confirmed, OR all resolved with at least
               one confirmed
  skipped    — all targets skipped
  deferred   — any target deferred
  pending    — any target still pending

No target advances without its own explicit confirmation.

SEQ ASSIGNMENT FAILURE:

If SEQ query or write fails during confirmation, manifest →
interrupted. Affected deposit remains pending. On retry, session
resumes from that deposit's SEQ assignment. Split targets already
in confirmed or skipped state are not re-processed.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPOSIT RESOLUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

confirmed   — deposit accepted. Section routing verified. Child ID
              locked with a real SEQ. Entry written to target section.

skipped     — deposit deliberately excluded. Routing was reviewed and
              the material does not belong in any section, is a
              duplicate, or is outside the scope of the archive.
              Skipped deposits do not route anywhere. They remain on
              the manifest as a record that the decision was made
              explicitly.

deferred    — routing cannot be confirmed at this time. Deposit held
              open. open_deferrals increments. Session cannot complete
              while any deposit is deferred. Retirement gated on
              open_deferrals = 0.
              Deferrals are never forced to resolution. They remain
              open until Sage makes an explicit routing decision —
              confirmed or skipped. If a document reaches retirement
              with open deferrals, retirement is blocked. Not bypassed.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RETIREMENT GATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All five conditions must be true before the retirement sequence begins:

  chunks_completed == total_chunks
  open_deferrals == 0
  no manifest_session in active · interrupted · deferred · blob_error
    state
  retirement_status == none OR failed OR in_progress
  intake_status == complete

An active manifest at retirement time = a crashed session. Gates
retirement. A deferred manifest = unresolved deposits. Gates
retirement. retirement_status == in_progress = sequence was running or
crashed without writing failed. Retry permitted.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RETIREMENT SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Strict order. No step executes out of sequence. retirement_status →
in_progress at sequence start. On failure at steps 1–9:
retirement_status → failed. Sequence halts. On failure at steps 10–12:
retirement_status → failed. Step 13 is the absolute last write.
Nothing executes after it.

This sequence is ATOMIC. Failure rolls retirement_status to failed.
The post-retirement sequence (below) is separate and independent.

1.  Write arc_seq_checkpoint to system_counters. Increment arc_seq.
    Receive value as ARC SEQ.
    RECOVERY ON RETRY: evaluate checkpoint state per the four
    conditions defined in system_counters.arc_seq_checkpoint in
    INTEGRATION DB SCHEMA.md. Entry point for the remainder of the
    sequence is determined there.

2.  Compile confirmed_targets from all resolved manifests.
    For each resolved deposit:
      If split_flag false: read deposit-level section_id · page_code
        · group
      If split_flag true: read from each split_target where status ==
        confirmed. Skip targets where status == skipped or deferred.
    Element structure: { section_id, page_code, group }

3.  Write confirmed_targets to root_entries.

4.  Compile archive aggregate fields across all associated
    manifest_sessions: total_chunks · total_deposits · confirmed ·
    skipped. Read lifetime_deferrals from root_entries.

5.  Generate provenance_summary. All six sections must be present
    before sequence continues. If generation fails or produces fewer
    than six sections: retirement_status → failed. Sequence halts.
    On retry, arc_seq_checkpoint recovery block at step 1 determines
    entry point and prevents double-increment. Step 5 re-attempts
    generation.

    Six required sections:
      — source overview: what the document is and where it came from
      — signal weight: what the material carries and why it mattered
      — deposit distribution: deposit count, receiving sections,
        routing patterns
      — split routing notes: deposits that crossed multiple sections
        and why
      — unresolved notes: anything flagged during parsing that didn't
        fit cleanly
      — parsing confidence: honest self-assessment of read quality.
        Flags anything potentially missed, misrouted, or that exceeded
        parsing clarity. A future model reads this to weight its own
        interpretation of the record.

6.  Write archives record. Read confirmed_targets from
    root_entries.confirmed_targets (written at step 3 — single source,
    no divergence possible). Read all aggregates and provenance_summary
    from steps 4–5. Write archives.retired_at = timestamp at this
    moment. Receive ARC id. page_deposit_id is null at this point —
    written in post-retirement.

7.  Write root_entries.archive_ref = ARC id.

8.  Write root_entries.retired_at = timestamp.

9.  Write root_entries.status → retired.

10. Clear root_entries.document_text.
    IDEMPOTENT: skip if already null.

11. Clear chunk_text on all associated manifest_sessions.
    IDEMPOTENT: skip any already cleared.

12. Clear system_counters.arc_seq_checkpoint.
    IDEMPOTENT: skip if already null.

13. Write retirement_status → complete.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST-RETIREMENT SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Executes after retirement_status → complete. These are NOT part of the
atomic retirement sequence. Failure here does not roll back retirement.
The retirement is done. These steps produce outputs from the completed
retirement.

1.  Write Archives page deposit from provenance_summary content.
    See SYSTEM_ Archive.md for deposit format.

2.  Write archives.page_deposit_id = deposit entry id.
    Links machine record to browsable surface. Required for
    three-surface architecture integrity. Null after this step =
    write failure, recoverable by re-running step 2.

3.  Surface retirement label in Integration UI.
    Format: [ARC-ID] · [YYYY-MM-DD]
    Example: TS·ARC·EMG·2026-03·0001 · 2026-03-31
    Copy-ready. Persistent until dismissed by Sage. Required UI
    element — not optional output. Sage uses this label to create the
    parent page deposit and place the physical file.

4.  Trigger embedding generation via FastAPI /embed/ endpoint.
    Asynchronous — does not block post-retirement completion. Embeds
    provenance_summary text via nomic-embed-text (Ollama). Writes to
    embeddings table with metadata: archives.id, tag routing snapshot,
    section_id, ownership_classification. See EMBEDDING PIPELINE
    SCHEMA.md for full pipeline definition.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INT GATEWAY — DEPOSIT CREATION CONTRACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The API contract for creating deposits through INT. Complete field set —
every deposit record field represented.

REQUEST:

  POST /api/deposits/create

    {
      // Session context
      session_id: string              — current session
      chunk_id: string | null         — null for manual deposits
      parse_version: string | null    — null for manual deposits

      // Core content
      content: string                 — REQUIRED
      doc_type: string                — REQUIRED, deposit record enum:
                                        entry | observation | analysis |
                                        hypothesis | discussion |
                                        transcript | glyph | media |
                                        reference
      source_format: string           — REQUIRED, deposit record enum:
                                        digital | handwritten | scan |
                                        image | audio | file | json
      tags: string[]                  — REQUIRED (may be empty array)
      pages: string[]                 — REQUIRED, routing targets (1+)

      // Conditional fields (doc_type dependent)
      // REQUIRED for: observation, analysis, hypothesis
      // NULL for all other doc_types
      observation_presence: positive | null
      confidence: clear | emerging | raw | null

      // Universal metadata
      deposit_weight: high | standard | low  — REQUIRED, AI-suggested
      notes: string | null                   — optional freeform
      source_type: field | generated         — REQUIRED, non-nullable

      // Swarm foundation (always known at creation in V1)
      authored_by: string             — REQUIRED. V1: "sage" or "claude"
      node_id: string                 — REQUIRED. V1: single value
      instance_context: string        — REQUIRED. Active instance registry pointer.

      // Provenance
      provenance: {
        source: manual | ai_parsed | ai_suggested_sage_confirmed
        correction_applied: boolean
        original_suggestion: object | null  — AI's original if corrected
      }
    }

RESPONSE — success:

    {
      deposit_id: string
      stamp: string                 — assigned composite ID stamp
      status: created
      routing_confirmed: string[]   — pages successfully notified
      embedding_status: queued | skipped
      created_at: timestamp
    }

RESPONSE — failure:

    {
      error_code: duplicate | validation_failed | routing_failed
                  | embedding_queued_failed
      failed_at_step: string        — which pipeline step failed
      deposit_id: string | null     — null if failed before record
                                      creation
      partial_state: object | null  — what succeeded before failure
      retry_safe: boolean           — can this be retried without
                                      side effects?
    }

Field nullability rule: fields required at creation sit ABOVE the
atomicity boundary (see below). Fields populated async sit BELOW.
Conditional fields (observation_presence, confidence) are required for
their applicable doc_types, null for others — schema-enforced, not
caller-optional.

Sage-facing surfaces:
  Success: routing_confirmed, embedding_status → surface on deposit
  confirmation card.
  Failure — plain language translations required:
    duplicate → "This content already exists"
    validation_failed → "Missing required fields"
    routing_failed → "Couldn't reach target page"
    embedding_queued_failed → "Saved but search indexing delayed"


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPOSIT ATOMICITY BOUNDARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The boundary sits after record creation, before embedding and routing.

  Step 1: validate              — fails → 400, nothing created
  Step 2: duplicate check       — fails → 409, nothing created
  Step 3: create deposit record — fails → 500, nothing created
  ─────── ATOMICITY BOUNDARY ────────────────────────────────
  Step 4: assign stamp          — fails → deposit exists,
                                  stamp_status: pending
  Step 5: trigger embedding     — fails → deposit exists,
                                  embedding_status: failed
  Step 6: route to pages        — fails → deposit exists,
                                  routing_status: partial | failed

Above the boundary: all-or-nothing. Failure means nothing was created.
Request can be retried safely.

Below the boundary: deposit exists regardless of downstream failure.
This is intentional — the deposit record is the canonical artifact.
Steps 4-6 are recoverable async operations.

Failure handling below the boundary:

  Stamp failure: deposit enters stamp_pending queue, retry async.
  Deposit is valid and usable, stamp assigned when queue resolves.

  Embedding failure: embedding_status: failed, enters embedding retry
  queue. Deposit is searchable by tags/type but not vector-searchable
  until resolved. Not a blocking failure.

  Routing failure (partial): routing_status: partial, records which
  pages received notification and which didn't. Affected pages flagged,
  re-routing triggerable manually or on next session open. Deposit
  exists and is archived — only the page-level index is incomplete.

The deposit record is always the source of truth. Downstream failures
degrade capability, they don't invalidate the deposit.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INT PARSING PARTNER — API CONTRACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The INT right panel AI is a parsing partner scoped to batch processing
collaboration. NOT the research assistant (Tier 6). Its output is a
typed record, not free text.

PARSE OBJECT (returned per chunk):

    chunk_parse:
      chunk_id: string
      parse_version: string         — prompt version that produced this
      suggested_deposits: [
        {
          provisional_id: string
          content: string           — extracted deposit text
          suggested_tags: string[]
          suggested_type: observation | pattern | question | note
          suggested_pages: string[] — routing candidates
          confidence: high | medium | low
          flag: null | ambiguous | needs_context | cross_page
        }
      ]
      parse_flags: [
        {
          flag_type: chunk_unclear | boundary_ambiguous | context_missing
          description: string
          chunk_position: string    — where in the chunk the issue occurs
        }
      ]
      chunk_summary: string         — one sentence: what this chunk
                                      contained
      correction_hooks: string[]    — field IDs Sage corrected in prior
                                      chunks, carried forward so AI
                                      adjusts approach

SIMPLIFIED TYPE ENUM — mapping to doc_type:

At parse time the AI works from raw chunk text with no surrounding
archive context. The simplified classification is the AI's best initial
read. Sage has the context to map it accurately during review.

Mapping is a default suggestion, not a hard rule. Review card shows
AI's suggested_type, then the mapped doc_type field as an editable
dropdown pre-populated with the most likely candidate:

  | suggested_type | → doc_type default | Sage picks from |
  |----------------|-------------------|-----------------|
  | observation | observation | observation (direct) |
  | pattern | analysis | analysis or hypothesis |
  | question | discussion | discussion or hypothesis |
  | note | entry | entry, reference, glyph, media, transcript |

Calibration feedback: the final doc_type selected during review feeds
back into a calibration view. If pattern is consistently mapped to
hypothesis rather than analysis, that's signal the mapping default
can be tightened over time.

CORRECTION PROPAGATION — running context object:

Corrections travel as a distilled ruleset, not raw conversation
history. The distillation process has four steps:

  1.  Sage corrects a deposit field during review (edit fires
      correction event).

  1a. Immediate active-rule conflict check: correction checked against
      active_rules before distillation begins. If the correction
      contradicts an active rule:
        Conflict surfaced immediately: "Your correction conflicts with
        active rule: [rule text]. Is the rule wrong, or is this a
        one-off?"
        Sage options:
          Rule is wrong → active rule moved to superseded_rules with
          superseded_by: correction_event_id. Correction proceeds to
          distillation (step 2). Resulting candidate enters active_rules
          without a second contradiction check (conflict already
          resolved).
          One-off exception → active rule stays. Correction applies to
          this deposit only. No distillation. exception_logged: true on
          the correction record so calibration view can track exception
          frequency.
        If no conflict with active rules: proceed to step 2.

  2.  AI distills the correction into a candidate rule.

  3.  Candidate rule shown to Sage for one-tap confirm or edit BEFORE
      it enters active_rules. Keeps Sage in control without adding
      friction.

CONTRADICTION DETECTION — candidate gate (load-bearing):

Before a confirmed rule enters active_rules, it is checked against all
existing active_rules for conflict. If the incoming candidate
contradicts an active rule:
  Conflict flagged to Sage with both rules shown side-by-side.
  Sage confirms which rule takes precedence.
  Superseded rule moved to superseded_rules (retained for history,
  not deleted).
  Do NOT auto-resolve — contradictions are Sage's decision.

Two conflict checks exist — different inputs, different failure modes:
  Step 1a (correction-time): catches "this correction directly
  contradicts active rule X." Runs before distillation.
  Candidate gate (candidate-time): catches "the distilled rule
  contradicts active rule Y that the original correction didn't touch."
  Runs after distillation and Sage confirmation. Covers the case where
  distillation produces a rule broader than the original correction.
  Both are needed. Neither subsumes the other.

    correction_context:
      session_id: string
      corrections: [
        {
          chunk_id: string          — which chunk triggered correction
          field: string             — tag | type | routing | boundary
          original: string          — what AI produced
          corrected: string         — what Sage set it to
          instruction: string       — extracted rule: "when X, do Y
                                      instead"
          distillation_confirmed: boolean — Sage confirmed the rule
        }
      ]
      active_rules: string[]        — confirmed, non-contradicting rules
                                      that travel in the prompt on every
                                      subsequent chunk
      superseded_rules: [
        {
          rule: string
          superseded_by: string     — which newer rule replaced it
          superseded_at: timestamp
        }
      ]

Every subsequent chunk prompt opens with: "Apply these corrections
from this session: [active_rules]."

Session ends → ruleset stored on session record. Optionally surfaces
in next session as starting correction context if Sage wants continuity.

PROMPT VERSIONING + CHANGELOG TRIGGERS:

Parsing partner prompt carries a version string. Every parse object
records which prompt version produced it.

Three defined trigger types for a version bump:

  (a) Sage-directed: Sage explicitly flags a correction as "update
      the prompt, not just this session." Always triggers a bump.
  (b) Calibration-triggered: correction rate on a confidence tier
      exceeds threshold → surfaces a prompt revision recommendation
      to Sage, she confirms. Not automatic — recommendation only.
  (c) Manual: bump from the prompt management view at any time.

All three create a changelog entry. The correction or observation that
inspired the bump is the changelog body. Version history is traceable
to its cause. These trigger types apply to all versioned prompts in
the system (parsing partner here, SNM in Tier 3).

CONFIDENCE CALIBRATION TRACKING:

Track correction rate per confidence tier:

    calibration_view:
      tier: high | medium | low
      total_deposits: integer
      correction_count: integer
      correction_rate: float
      fields_corrected: { tag: int, type: int, routing: int,
                          content: int }

Persistent miscalibration at a tier (e.g., high confidence deposits
corrected >30% of the time) is a changelog trigger for the parsing
prompt — ties to prompt version trigger type (b). Threshold for
triggering the recommendation is a calibration item.

SAGE-FACING SURFACES:
  suggested_deposits → entire review card built from this
  parse_flags → surface on review card ABOVE the deposit so Sage
    knows the AI flagged something before reading the content
  chunk_summary → header in review queue so Sage knows what the
    chunk contained before reviewing individual deposits
  confidence → visible on review card badge
  active_rules → visible as live correction log panel during batch
    session (corrections are not a black box)
  distillation confirm → one-tap confirm/edit shown after each
    correction, before rule enters active_rules
  contradiction flag → side-by-side display when incoming rule
    conflicts with existing one
  calibration view → correction rates per confidence tier, alongside
    type mapping calibration
  correction_hooks, provisional_id, parse_version → internal only,
    never displayed


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BATCH PROCESSING SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

How large source documents enter the archive. This is how most data
gets into the system — must be efficient and session-persistent.

DOCUMENT FLOW:

  1.  Sage uploads ONE document at a time (not multiple simultaneously)
  2.  Root stamp created (Composite ID source mode): one per document
  3.  Root entry record created (root_entries table, PostgreSQL) with:
      total pages, chunk size, intake status, root stamp ID.
      See INTEGRATION DB SCHEMA.md for full table definition.
  4.  AI chunks into 5-8 page batches, numbered in order
  5.  AI parses each chunk → extracts deposits → suggests tags,
      doc_type, source_format, page routing per deposit
  6.  Deposits go to review queue (NOT directly deposited)
  7.  Sage reviews per-deposit (not per-chunk — one chunk produces
      multiple deposits routed to different pages, each reviewed
      individually but grouped by source chunk for context)
  8.  Approved deposits get child stamps (Composite ID:
      root:[PARENT-ID]) and route through INT gateway to target pages
  9.  Each approval triggers immediate deposit — archive builds in
      real-time
  10. Session ends mid-document? System knows exactly where it stopped

ROLLING BUFFER (AI stays 3-5 chunks ahead):

  AI parses ahead of where Sage is reviewing. Fast enough that Sage
  always has something to review (never bored). Close enough that
  Sage's corrections feed forward into AI's next chunks. When Sage
  corrects routing on chunk 5, AI adjusts approach for chunk 6+. The
  chat window is where context flows: Sage explains what the AI is
  seeing, AI incorporates for subsequent parsing.

CHUNK TRACKING:

  Table definitions in INTEGRATION DB SCHEMA.md (PostgreSQL):

    root_entries      — one per source document. Tracks intake status,
                        chunk_size, total_chunks, chunks_completed,
                        retirement gate. Status via intake_status
                        (blob_pending | complete) + retirement_status +
                        root_integrity.

    manifest_sessions — one per chunk work session. Tracks chunk_number,
                        page_range, chunk_text, session status
                        (active | complete | deferred | interrupted |
                        blob_error), nested deposits[] array, stats,
                        and correction_context (jsonb).

    deposits[]        — nested within manifest_sessions. Per-deposit:
                        deposit_num, section_id, page_code, status
                        (pending | confirmed | skipped | deferred),
                        split_flag, split_targets, notes.

  See INTEGRATION DB SCHEMA.md for complete field definitions,
  constraints, write ordering, and lifecycle rules.

SESSION PERSISTENCE:

Everything persists in PostgreSQL. Session dies? Next session reads
root_entries.chunks_completed and manifest_sessions status to determine
exact resume point — which chunks are complete, which are in progress,
which deposits are pending review.

PARENT TAG: One root stamp per DOCUMENT (not per batch/chunk). Every
child deposit carries root:[PARENT-ID] linking back. Already designed
in Composite ID schema.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BATCH PROCESSING STATE MACHINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Explicit valid transitions only. No implicit state changes.

These are application-layer workflow phases. The database stores session
state via manifest_sessions.status (active | complete | deferred |
interrupted | blob_error) and deposit status (pending | confirmed |
skipped | deferred). The application layer derives the workflow phase
from a combination of DB fields — a manifest_session with status
"active" and no deposits[] populated is in the "parsing" phase; with
deposits[] populated but unresolved, it is in the "review" phase.
See INTEGRATION DB SCHEMA.md for the stored state model.

CHUNK WORKFLOW PHASES (valid transitions only — no others permitted):

  pending → parsing            — AI begins processing chunk
  parsing → parsed             — successful parse, awaiting review
  parsing → parse_failed       — AI returned error or malformed output
  parse_failed → parsing       — Sage triggers retry (manual or auto)
  parsed → review              — chunk enters review queue
  review → complete            — Sage approves all deposits from chunk
  review → partial             — some deposits skipped or deferred
  review → parse_failed        — Sage rejects entire parse, triggers
                                 re-parse
  partial → complete           — remaining skipped deposits resolved

  parsed → parsing is NOT valid. Re-parse only enters from
  parse_failed.

FAILURE STATES:

    parse_failed:
      failure_type: ai_error | malformed_output | timeout
                    | context_overflow
      retry_count: integer
      retry_limit: 3          — after 3 failures, enters manual_required

    manual_required:          — human must handle, AI cannot parse this
      reason: string
      escalated_at: timestamp

  context_overflow: specific failure for when chunk exceeds AI context
  window. Triggers automatic chunk splitting before retry, not a raw
  retry of the same chunk.

TRANSITION TRIGGERS:

  | Transition | Trigger |
  |------------|---------|
  | pending → parsing | Sage initiates batch or auto-queue fires |
  | parsing → parsed | AI returns valid parse object |
  | parsing → parse_failed | AI error, timeout, or malformed output |
  | parse_failed → parsing | Retry (auto up to limit, then manual) |
  | parsed → review | Deposit creation flow completes for chunk |
  | review → complete | All deposits in chunk resolved |
  | review → partial | Session ends with skips outstanding |

SAGE-FACING SURFACES:
  Chunk status → visible in batch progress view with plain language:
    parse_failed → "Parse failed"
    manual_required → "Needs your attention"
    partial → "Some deposits skipped"
  failure_type → plain language so Sage can decide retry vs manual
  retry_count → visible so Sage knows how many attempts were made


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REVIEW QUEUE INTERACTION SPEC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Per-deposit review during batch processing. Cards built from parsing
partner's suggested_deposits output.

REVIEW CARD LAYOUT:

  ┌─────────────────────────────────────────────────┐
  │ [SUGGESTED TYPE]  [CONFIDENCE]  [FLAGS]          │
  │                                                  │
  │ Content (full text of suggested deposit)         │
  │                                                  │
  │ doc_type: [dropdown — pre-populated via mapping] │
  │ Suggested tags: [tag] [tag] [tag]  (editable)    │
  │ Suggested routing: [Page A] [Page B]  (editable) │
  │ Chunk: #N of M  |  Session: [date]               │
  │                                                  │
  │ [APPROVE] [EDIT] [SKIP]                           │
  └─────────────────────────────────────────────────┘

parse_flags from the chunk surface ABOVE the first deposit card in a
chunk group — Sage sees the AI's concerns before reviewing content.
chunk_summary displays as the group header.

doc_type mapping on card: AI's suggested_type badge shows at top.
Below it, the doc_type dropdown is pre-populated from the mapping
table (see INT Parsing Partner section). Sage confirms or changes
before approving. Full doc_type enum always available in dropdown —
the mapping pre-selects, it doesn't constrain.

Editable fields during review: content, tags, doc_type, routing. All
four editable before approve. Edit is inline — no modal, no separate
form. Any edit fires a correction event that enters correction_context
for the session.

CROSS-CHUNK CONTEXT SIDEBAR:

When Sage reviews chunk 4 she sees it in isolation. If chunk 4
references something established in chunk 1, there's no way to see
that without leaving the queue.

Solution: lightweight session thread sidebar in the review queue.
  Prior chunks' summaries (from chunk_summary field) listed in order.
  Approved deposits from the same session, collapsible per chunk.
  Collapsible — not always open, not a full workspace.
  Just enough context to anchor each chunk review in session history.
  Sidebar updates as Sage progresses through chunks — approved
  deposits from chunk N are visible when reviewing chunk N+1.

SKIP STATE FLOW:

    skipped:
      skipped_at: timestamp
      skip_reason: string | null  — optional, Sage can note why
      re_queue_eligible: true     — always re-queueable
      expiry: null                — skipped deposits don't expire

Skipped deposits surface in a persistent skip queue accessible from
INT. Sage can re-queue individually or batch re-queue all skipped from
a session. Re-queuing returns to review state — does not re-parse.

Staleness signal: skipped deposits don't expire (no forced decisions).
But a skip from 8 months ago may no longer be relevant without being
wrong. After a configurable window (default: 90 days), a staleness
indicator appears on the skip. Sage sees the deposit is old and can
re-queue or let it sit. Staleness is informational, not an expiry.
No automatic action taken.

    SKIP_STALENESS_WINDOW_DAYS = 90    — named constant, configurable
                                         (calibration item)

FLAG DISPLAY VALUES (plain language, not raw tokens):
  ambiguous → "Ambiguous boundary"
  needs_context → "Needs more context"
  cross_page → "Routes to multiple pages"
  skip_reason → free text field


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEDIA DEPOSIT WIRING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Images enter the archive through INT with the same tagging and routing
as text, but through a simpler flow (no chunking).

Accepted formats (V1): JPEG, PNG. Audio is future, not V1. Glyphs
embedded in documents are handled by batch processing naturally.
Standalone images use this flow.

Storage: Filesystem (backend/media/). Database stores metadata + file
path. Media folder added to .gitignore for git, included in backup.py
folder copy.

DOC_TYPE MAPPING:

  image file   → doc_type: glyph or media (Sage confirms)
  document     → doc_type determined by file content and Sage
                 confirmation
  other        → doc_type: reference

UPLOAD FLOW:

  1. Upload image on INT workstation (drag-drop or button)
  2. Image preview appears in left panel
  3. AI analyzes image → suggests tags, doc_type (glyph/media),
     page routing
  4. Sage writes summary text alongside — what this image is, what
     it means
  5. AI analysis informs tag suggestions (behind the scenes). Sage's
     summary is the deposit text. AI doesn't write the deposit —
     Sage does.
  6. Review AI suggestions, approve/correct
  7. Deposits through INT gateway with: file path, summary, tags,
     routing

MEDIA DEPOSIT CARD (display on target pages):

Large thumbnail (click to expand to full-size lightbox). Sage's
summary text displayed alongside. Tags and composite ID visible. Own
card type — not jammed into text deposit stream, but lives alongside
text deposits in chronological order on the page.

For image files, the deposit is the image itself routed to confirmed
target sections. The image can route to multiple confirmed targets
through split deposit handling — enabling cross-mapping without
siloing the file to a single section.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLACK PEARL PROMOTION FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pre-deposit quick capture. Black Pearl lives in the page nav (left
side). Sage's reflection space — captures raw noticings before they
are named or framed.

Storage: Operational DB (SQLite). Pearls are PRE-ARCHIVE — they do
not live in PostgreSQL until promoted. This preserves the key
invariant: "nothing enters the archive without INT provenance." A
Pearl becomes an archive entry only when promoted through INT.

PEARL RECORD (full field list — see OPERATIONAL DB SCHEMA.md for
constraints and defaults):

    pearl_id             — text, primary key
    content              — text, not null
    created_at           — timestamp
    page_context         — which page Sage was on when captured, nullable
    status               — active | promoted | archived
    promoted_deposit_id  — references deposit ID, null until promotion
    promoted_via         — panel | null (null until promotion)

PROMOTION FLOW:

  Pearl promoted → pearl_captured_at populated from Pearl's created_at
  → sent to INT gateway → full deposit fields assigned (doc_type, tags,
  routing, composite ID, pearl_captured_at) → enters PostgreSQL as a
  real deposit. Pearl record updated: status → promoted,
  promoted_deposit_id → new deposit ID, promoted_via → source surface.

LIFECYCLE:

Unpromoted Pearls stay in operational DB indefinitely. No auto-expiry.
They're pre-signal — Sage decides when (or if) they become deposits.
archived status for Pearls Sage explicitly dismisses.

UI surfaces: Tier 2 (per-page capture) and Tier 7 (dashboard).


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DUPLICATE DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hash-based identical content match. Failsafe for copies-of-copies.

Scope: IDENTICAL entries only. Not fuzzy, not similar. Hash the full
content text. Same text deposited to two different pages triggers the
check. (Ven'ai name deduplication is separate — see Tier 3.)

Behavior: WARN, not BLOCK. Same content on two pages may be
intentional (observation relevant to both THR and ECR). Detection
surfaces: "This content already exists at [location]. Deposit anyway?"
Sage decides. Not a hard block.

Where it fires: on deposit creation in INT gateway (step 2 of the
atomicity boundary). Checks against all existing deposits in
PostgreSQL.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KIN CROSS-DEPOSIT RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When parsing a deposit that routes to KIN (20), the AI checks whether
the kin entity's name is a Ven'ai root combination. If yes, a
secondary deposit to VEN (14) is generated within the same manifest
session.

The secondary VEN deposit is not a split deposit. The original content
routes to KIN as a complete record. The VEN deposit is a derived
glossary entry — a separate record generated from the kin name.
Required content: correctly-spelled name · root breakdown · meaning of
each root · combined meaning · reference to the KIN entry.

The VEN deposit requires its own confirmation. It cannot be skipped
without an explicit Sage decision. If the VEN deposit is deferred,
open_deferrals increments normally and retirement is gated until
resolved.

If the kin entity's name cannot be confirmed as a Ven'ai root
combination, the AI names the ambiguity and flags it for Sage's
decision. The VEN deposit is not generated until the determination is
confirmed.

KIN+VEN FAILURE HANDLING (resolved 2026-04-07):

KIN confirms and writes first. VEN is a dependent write that triggers
immediately after KIN confirmation. They are not in the same database
transaction, but they are coupled for resolution.

  ven_pair_status — tracked on the KIN deposit record.
    pending:  VEN generation triggered, write not yet confirmed.
    complete: VEN deposit written and confirmed. Both clear.
    failed:   VEN write failed. KIN is flagged. Both deposits are
              blocked until retry verification clears the VEN write.

Atomicity boundary: KIN commit is the point of no return for KIN
content. The KIN content is valid — only its VEN derivative failed.
VEN status is tracked on the KIN record. Resolution requires both.

On retry: VEN write re-attempted. On success, ven_pair_status →
complete, both confirmed. KIN content is not re-processed.

STR is not involved in this pair. STR maps relations between entities
but is not part of the KIN+VEN cross-deposit sequence.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMBEDDING PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vector embedding of deposit content for semantic search.

WHAT GETS EMBEDDED:

The deposit's content field plus a metadata string constructed from:
doc_type + tags + assigned_pages. Metadata appended to content before
embedding so vector search is tag-aware, not just content-aware.

TIMING:

Async. Embedding is queued at deposit creation, never blocks the
creation response. Deposit is usable immediately; vector searchability
follows.

STATUS TRACKING:

    embedding_status: queued | processing | complete | failed
                      | retry_queued | failed_permanent

RETRY STRATEGY:

    attempt_1: immediate on failure
    attempt_2: 5 minute delay
    attempt_3: 30 minute delay
    after attempt_3: status → failed_permanent, surfaces in
                     maintenance view

failed_permanent: deposit exists and is fully functional. Vector search
will miss it until manually re-queued. Not a data loss condition.

EMBEDDING INVALIDATION ON EDIT (load-bearing):

Embedding is built from content + tags + doc_type + pages. If Sage
edits any of those fields after creation, the embedding is stale
immediately. Without handling, vector search returns results based on
old content/tags — silently degraded accuracy.

    embedding_dirty: boolean    — set true on any post-creation edit to
                                  content, tags, doc_type, or pages

When embedding_dirty is set:
  Deposit remains usable — all non-vector functionality unaffected.
  Automatic re-queue triggered: embedding_status → retry_queued.
  Same retry strategy as initial embedding (3 attempts).
  Vector search accuracy degrades until re-indexing completes.
  embedding_dirty cleared when new embedding completes successfully.

This applies during batch review (Sage edits before approve) AND
post-deposit edits. During batch review, the final approved state is
what gets embedded — edits before approve don't trigger re-queue, only
the approve action triggers the initial embed with final field values.

ENGINE STALE FLAG ON POST-CREATION EDIT:

Post-creation edits to tags mark engines on the deposit's assigned
pages as stale. Same stale flag mechanism as new deposit arrival
(Tier 3 hybrid compute trigger). Edit to tags changes what the engine
would index — engine's cached computation is no longer current.

Scope: tags only. Notes edits do not affect engine computation.
Content and routing are not editable post-creation (Tier 2 deposit
card: "Edit access for tags and notes only").

embedding_dirty handles the vector pipeline. This rule handles the
engine pipeline. Both fire on the same trigger (tag edit), target
different systems.

STORAGE:

Vector stored with deposit_id as primary key reference. Deposit record
holds embedding_id, embedding_status, and embedding_dirty. They are
linked, not co-located — the deposit record is not the vector store.

SAGE-FACING SURFACES:
  embedding_status — plain language on deposit record:
    queued / processing → "Indexing"
    complete → "Indexed"
    failed / retry_queued → "Index pending"
    failed_permanent → "Index failed"
  failed_permanent → maintenance view: "This deposit exists but won't
    appear in search results until re-indexed."


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HUMAN READABILITY RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cross-cutting rule — applies to all Tier 1 systems, established here
because Tier 1 has the most user-facing surfaces.

Rule: any field that surfaces in a UI element — review card, batch
progress view, deposit record, maintenance view, correction log — must
have a display_label or plain language translation defined alongside
its internal value.

Raw status strings, error codes, and flag tokens are system-internal.
Sage never reads raw tokens.

This rule carries forward to all subsequent tiers. When a new system
defines status values, error codes, or classification tokens that will
appear in any UI surface, the plain language translation is part of the
design — not deferred to frontend build time.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. BLOB UPLOAD FAILS AT INTAKE STEP 3
root_entries record preserved with intake_status = blob_pending. No
manifest opened. Record is not lost. Recovery: user re-uploads blob
only. Raw page count on re-upload must match value from step 3a.
Match → resume from step 3c. No match → reject. A different file
requires a new intake.

2. RETIREMENT ATTEMPTED WITH OPEN DEFERRALS
Retirement gate blocks. Sequence does not begin. Recovery: review
deferred deposits. Confirm or skip each explicitly. open_deferrals
must reach 0 before retirement gate clears.

3. PROVENANCE_SUMMARY GENERATION FAILS AT STEP 5
retirement_status → failed. Sequence halts. Recovery:
arc_seq_checkpoint recovery at step 1 determines entry point on retry.
Step 5 re-attempts generation. Double-increment of arc_seq is
prevented by checkpoint recovery.

4. ARC_SEQ INCREMENTED BUT SEQUENCE CRASHES BEFORE ARCHIVES RECORD
arc_seq has moved but no archives record exists for that SEQ value.
The SEQ value is consumed. Cannot be reused. Recovery:
arc_seq_checkpoint recovery at step 1 on retry. Condition 3 applies —
increment succeeded but archive_ref is not yet written. Recover ARC
SEQ as arc_seq_checkpoint + 1. Resume at step 2.

5. ROUTING PROPOSED WITHOUT SOT CONFIRMATION
A deposit routes to a section guessed rather than confirmed against
the SOT section map. The routing record is wrong. Downstream reads on
confirmed_targets inherit the error. Guard: AI names ambiguity rather
than guessing. If SOT mapping is unclear, the deposit is flagged for
Sage's routing decision.

6. SPLIT DEPOSIT TARGETS CONFIRMED SIMULTANEOUSLY
SEQ values collide. Two targets in the same section get the same SEQ.
IDs are not unique. Guard: split targets confirm sequentially, one at
a time. SEQ is assigned per target at confirmation. The next target
does not confirm until the prior target's SEQ is written and locked.

7. RETIREMENT LABEL NOT DISPLAYED AFTER STEP 13
Sage cannot copy the ARC id. Parent page placement and physical file
referencing are blocked or done incorrectly. Guard: retirement label
display is a required UI element, not optional output. Renders at
post-retirement step 3 and persists until dismissed.

8. PAGE_DEPOSIT_ID NOT WRITTEN AFTER ARCHIVES PAGE DEPOSIT
Archives record has no pointer to its browsable surface. Three-surface
architecture is broken. Guard: page_deposit_id is written at
post-retirement step 2 immediately after the Archives page deposit
confirms creation. Never left null after successful post-retirement.

9. BATCH PARSE FAILURE CASCADES TO DATA LOSS
AI fails to parse a chunk and the failure is silent. Content is never
extracted and Sage never knows it was missed. Guard: parse_failed state
with typed failure_type surfaces visibly in batch progress view. After
3 retries, escalates to manual_required. Sage always knows what failed
and why.

10. CORRECTION CONTEXT CONTRADICTS ITSELF
Late-session correction rule silently conflicts with an earlier one,
making the entire ruleset incoherent. AI applies contradictory rules
to subsequent chunks. Guard: two-check system — step 1a catches
correction-vs-active conflicts at correction time, candidate gate
catches candidate-vs-active conflicts after distillation. Both surface
to Sage for resolution.

11. EMBEDDING STALE AFTER POST-CREATION EDIT
Deposit content or tags edited after creation. Vector embedding built
from old values. Search returns results that don't match current
content. Guard: embedding_dirty flag set on any edit to content, tags,
doc_type, or pages. Auto re-queue triggered. Same retry strategy as
initial embedding.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PUBLIC API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All intake and retirement operations route through FastAPI endpoints.
The frontend calls these endpoints via the API client (src/lib/api.ts).

POST /api/deposits/create — create deposit through INT gateway
  Full contract defined in INT GATEWAY section above.

POST /entries/ — create root entry (intake sequence start)
  Receives: title, doc_type, origin_date, phase, signal_description,
  section_targets, chunk_size.
  Returns: root entry id, intake_status.

PATCH /entries/{id} — update entry status
  Receives: fields to update (deposit status, manifest session state).
  Returns: updated record.

POST /entries/{id}/retire — trigger retirement sequence
  Evaluates retirement gate. If all five conditions pass, executes
  steps 1–13. Returns: ARC id and retired_at on success. Error with
  step number on failure.

POST /entries/{id}/media — media intake
  Receives: uploaded file, source page code of originating archive
  page. Routes file through standard intake sequence. This is the only
  upload path.

POST /batch/upload — initiate batch processing
  Receives: document file, title, notes, chunk_size.
  Returns: document_id (root stamp), total_chunks, status.

POST /batch/{document_id}/parse — trigger chunk parsing
  Receives: chunk_id or auto-queue.
  Returns: chunk_parse object (see INT Parsing Partner).

PATCH /batch/{document_id}/deposits/{deposit_id} — review action
  Receives: action (approve | skip | decline | edit), field edits.
  Returns: updated deposit status, correction_context if edit fired.

GET /batch/{document_id}/status — batch progress
  Returns: document status, per-chunk status array, review queue
  counts, correction context summary.

POST /pearls/ — create Pearl
  Receives: content, page_context.
  Returns: pearl_id, created_at.

POST /pearls/{pearl_id}/promote — promote Pearl to deposit
  Triggers INT gateway flow with pearl_captured_at populated.
  Returns: deposit_id, stamp.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

backend/routes/entries.py
  FastAPI route handlers — intake, manifest sessions, deposits,
  retirement, media intake, batch processing, Pearl promotion.
  Status: PLANNED

backend/services/entry.py
  Service layer — intake sequence, retirement sequence, deposit
  resolution, arc_seq coordination, batch state machine, correction
  context management, embedding trigger.
  Status: PLANNED

backend/models/entries.py
  SQLAlchemy models — root_entries, file_assets, manifest_sessions,
  archives, system_counters. Deposit record model with full field
  shape.
  Status: PLANNED

frontend/ (INT page)
  Svelte UI — INT workstation: dual panel (upload + review left,
  parsing partner right), deposit review cards, batch progress view,
  correction log, calibration view, retirement trigger, retirement
  label display, media intake, Pearl promotion.
  Status: PLANNED
