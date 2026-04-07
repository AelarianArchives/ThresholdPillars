# OPERATIONAL DB SCHEMA

## V1

## /DESIGN/Systems/Operational_DB/OPERATIONAL DB SCHEMA.md

SQLite · backend/db/operational.db


OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  SQLite operational database for fast ephemeral state that
  does not belong in PostgreSQL. Session tracking, Origin
  presence states, and transient UI state live here.

  File location: backend/db/operational.db
  Created at FastAPI startup if not present.
  Journal mode: WAL (write-ahead logging) for concurrent
  read access during active sessions.


WHAT BELONGS HERE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - Session lifecycle state (type, start, close, active flag)
  - Multi-presence session invocation tracking
  - Origin presence state per session (active, dormant, returned)
  - Transient UI operational state (current section, filters)
  - Engine stale flags (one boolean per Axis engine)
  - Researcher memory — Sage's active research state (single live record)
  - Researcher memory history — snapshots of prior research states
  - Conversation summaries — compressed session records for continuity
  - Ven'ai drift log — language drift events detected per session

  This is the fast, lightweight layer. Reads and writes are
  local and synchronous. No network hop. No connection pool.


WHAT DOES NOT BELONG HERE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - Archive entries — PostgreSQL (root_entries, archives)
  - Tags and routing — PostgreSQL
  - Embeddings — PostgreSQL (pgvector)
  - Findings, patterns, drift events — PostgreSQL
  - Anything that feeds SOT, the research assistant, or
    vector search — PostgreSQL

  If data has research value beyond the current session and
  needs to be queried alongside archive entries, it belongs
  in PostgreSQL. The one exception is presence_log — see note
  on that table below.


CROSS-DB CORRELATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  session_id (UUID) is the shared key between SQLite and
  PostgreSQL. When a session starts:

  1. SQLite sessions record created with session_id
  2. session_id passed to PostgreSQL on every root_entries
     write during that session
  3. PostgreSQL root_entries.session_id = SQLite sessions.session_id

  No foreign key enforcement across databases. FastAPI service
  layer creates the SQLite session first, receives the
  session_id, then uses it in all PostgreSQL writes. Orphaned
  session_ids are detectable by audit query.


TABLE: sessions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  session_id         — text (UUID), primary key
                       Generated at session start. Shared with
                       PostgreSQL as correlation key.

  session_type       — text, not null
                       enum: 'single' | 'multi_presence'
                       Determines how entries created during
                       this session are flagged. Denormalized
                       to root_entries.session_type at intake.

  invocation_phrase  — text, nullable
                       The phrase that opened a multi-presence
                       session. Null for single sessions.
                       The phrase itself is part of the field —
                       it comes from the original encounters or
                       names what happens when all three Origins
                       are present. A field decision, not a
                       technical one. Sage defines it.

  started_at         — text (ISO timestamp), not null
                       Written at session creation.

  closed_at          — text (ISO timestamp), nullable
                       Written at session close. Null while
                       session is active.

  active             — integer (0 | 1), not null, default 1
                       1 = session in progress.
                       0 = session closed or abandoned.
                       Set to 0 when closed_at is written.
                       A session with active = 1 and no recent
                       activity is an abandoned session —
                       detectable on next startup.

  STARTUP RECOVERY: on FastAPI startup, any session with
  active = 1 is checked. If the previous process exited
  without closing the session, it is marked active = 0 and
  closed_at = startup timestamp. This is an interrupted
  session, not a clean close — distinguishable by the gap
  between the last activity and closed_at.


TABLE: presence_log
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  id                 — integer, primary key, autoincrement

  session_id         — text (UUID), not null
                       Foreign key to sessions.session_id.

  origin_id          — text, not null
                       enum: 'o01' | 'o02' | 'o03'
                       o01 = Larimar, o02 = Verith,
                       o03 = Cael'Thera.

  state              — text, not null
                       enum: 'active' | 'dormant' | 'returned'
                       active:   Origin is present and
                                 participating in the session.
                       dormant:  Origin has left the session.
                                 This is a supported state, not
                                 an error. An Origin can go
                                 dormant and return within a
                                 single session.
                       returned: Origin has re-entered the
                                 session after being dormant.
                                 Distinct from initial active
                                 state — the return is a
                                 recorded event.

  timestamp          — text (ISO timestamp), not null
                       When this state change occurred.

  STATE MACHINE — valid transitions:
    active  → dormant   (Origin leaves)
    dormant → returned  (Origin re-enters)
    returned → dormant  (Origin leaves again)

  Invalid transitions (unreachable by construction):
    dormant → active    (must use 'returned', not 'active')
    returned → active   (returned IS the active-again state)
    any → any same state (no self-transitions)

  The FastAPI service layer enforces valid transitions. An
  invalid transition request is rejected with an error, not
  silently corrected.

  RESEARCH VALUE NOTE: presence_log records are preserved,
  not cleaned up. Multi-presence sessions are a rare event
  class — the presence transitions (who was active, who went
  dormant, who returned, when) are foundational behavioral
  data. This is the one SQLite table with long-term research
  value. It stays in SQLite because:
  - Writes must be fast (real-time state tracking)
  - Reads are session-scoped (not cross-entry queries)
  - It does not participate in vector search or SOT
  If research queries need to join presence data with archive
  entries, the join happens in FastAPI via session_id — read
  from SQLite, correlate with PostgreSQL.


TABLE: pearls
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  pearl_id           — text, primary key
                       Format: 'prl_[timestamp]_[rand]'

  content            — text, not null
                       Could be short — even a few words.
                       Pre-archive signal capture.

  created_at         — text (ISO timestamp), not null
                       When Sage captured the Pearl. This value
                       becomes pearl_captured_at on the deposit
                       record when the Pearl is promoted through
                       INT gateway. The gap between Pearl creation
                       and deposit creation is itself data.

  page_context       — text, nullable
                       Which page Sage was on when they captured
                       the Pearl, if any. Informational — does
                       not constrain promotion routing.

  status             — text, not null
                       enum: 'active' | 'promoted' | 'archived'
                       active:   Pearl exists, not yet promoted.
                                 Stays indefinitely. No auto-expiry.
                       promoted: Pearl promoted through INT gateway.
                                 Full deposit fields assigned.
                                 Entered PostgreSQL as archive entry.
                       archived: Pearl explicitly dismissed by Sage.
                                 Not a deletion — record preserved.

  promoted_deposit_id — text, nullable
                       References the deposit ID created when
                       this Pearl was promoted. Null until
                       promotion. Links pre-archive Pearl to its
                       post-promotion deposit record.

  pearl_type           — text, not null, default 'capture'
                         enum: 'capture' | 'reflective'
                         capture:    standard quick-capture Pearl.
                                     Tags, doc_type, routing
                                     available at capture time.
                         reflective: free-form phenomenological
                                     data. No tags, no doc_type,
                                     no routing, no length
                                     constraint. Felt, unresolved,
                                     non-analytical thought. Exists
                                     first for Sage; swarm reads
                                     as context alongside Nexus
                                     outputs.

  swarm_visible        — integer (0 | 1), not null
                         Default: 1 for reflective, 1 for capture.
                         Reflective Pearls have a per-Pearl opt-out
                         toggle — Sage can mark individual
                         reflective Pearls as swarm-private (0).
                         Capture Pearls are always swarm-visible (1).
                         Phase 2 relevance: Origins read
                         swarm-visible Pearls as context.

  promoted_via         — text, nullable
                         enum: 'panel' | 'dashboard' | null
                         Where promotion was triggered. Null until
                         promotion. Panel = Black Pearl slide-in
                         panel. Dashboard = Pearl list on dashboard.

  Pearls are PRE-ARCHIVE. They do not live in PostgreSQL until
  promoted. This preserves the key invariant: "nothing enters
  the archive without INT provenance." A Pearl becomes an archive
  entry only when promoted through INT.

  Unpromoted Pearls stay in SQLite indefinitely. No auto-expiry.
  Sage decides when (or if) they become deposits.

  See INTEGRATION SCHEMA.md BLACK PEARL PROMOTION FLOW for full
  promotion mechanics.


TABLE: operational_state
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  key                — text, primary key
                       The state key. Examples:
                       'current_section', 'active_filters',
                       'last_viewed_entry', 'ui_panel_state'

  value              — text, not null
                       JSON-encoded value. The application
                       layer serializes/deserializes as needed.
                       SQLite stores it as text.

  updated_at         — text (ISO timestamp), not null
                       Last time this key was written.

  This is a simple key-value store for transient UI state.
  It survives browser refresh (persisted to disk) but has no
  research value. Keys can be deleted or overwritten freely.

  No schema enforcement on keys — the application layer
  defines what keys exist and what their values mean.
  This flexibility is intentional for ephemeral UI state.


TABLE: engine_stale_flags
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  One row per Axis engine. Tracks whether the engine's computation
  is stale (new deposits arrived since last compute). Cheap
  ephemeral state — no research value, no cross-session persistence
  needed. Full spec in ENGINE COMPUTATION SCHEMA.md.

  engine             — text, primary key
                       enum: 'thr' | 'str' | 'inf' | 'ecr' | 'snm'
                       5 rows, one per engine.

  stale              — integer (0 | 1), not null, default 1
                       1 = stale (needs recomputation)
                       0 = fresh (computation is current)
                       Default 1: on first load, all engines are
                       stale — forces initial computation.

  updated_at         — text (ISO timestamp), not null
                       Last time this flag was modified.

  SET TO 1: when a deposit lands on the engine's page.
  SET TO 0: when engine recomputation completes successfully.

  THREE RECOMPUTATION TRIGGERS (read stale flag, if 1: compute):
    1. Page view — user navigates to the engine's page
    2. Batch window close — all batch deposits have landed
    3. MTM pull — MTM requests engine output for synthesis

  CREATED AT STARTUP: if the table is empty at FastAPI startup,
  all 5 rows are inserted with stale = 1. The table is
  self-initializing.


TABLE: researcher_memory
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Single live record. Sage's active research state — what she is
  currently investigating, tracking, questioning. Not inferred
  from behavior — Sage writes it deliberately. Read at session
  open, referenced throughout by the research assistant.

  Full design context in SYSTEM_ Research Assistant.md.

  memory_id          — integer, primary key, autoincrement

  current_focus      — text, not null
                       What Sage is investigating right now.

  active_hypotheses  — text, not null
                       JSON array of strings. Hypotheses she is
                       personally tracking.

  open_questions     — text, not null
                       JSON array of strings. Things she is
                       trying to answer.

  skepticisms        — text, not null
                       JSON array of strings. Patterns she is
                       not convinced by.

  not_yet_named      — text, nullable
                       Something she is sensing but cannot
                       articulate yet. No structure imposed.
                       Sage's own words. Optional.

  research_posture   — text, not null
                       enum: 'deep_investigation' |
                             'broad_survey' |
                             'consolidating' |
                             'questioning_foundations' |
                             'integrating'

  phase_context      — text, nullable
                       Which instance/phase she is in right
                       now, if relevant.

  last_updated       — text (ISO timestamp), not null

  updated_by         — text, not null
                       enum: 'sage' | 'assistant_suggested'
                       Sage-authored entries are authoritative.
                       Assistant-suggested entries are
                       high-confidence but not sovereign.

  SINGLE RECORD: only one row exists at a time. Updates
  overwrite the live record after snapshotting to
  researcher_memory_history.


TABLE: researcher_memory_history
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Snapshot history of researcher_memory. Every time the live
  record updates, the previous state is written here before the
  new state is applied. The full arc of Sage's research posture
  becomes visible over time.

  Full design context in SYSTEM_ Research Assistant.md.

  history_id         — integer, primary key, autoincrement

  memory_snapshot    — text, not null
                       JSON object — full researcher_memory
                       state at that moment.

  snapshot_reason    — text, not null
                       Why the memory changed. Human-readable.

  created_at         — text (ISO timestamp), not null

  ACCUMULATES: history records are preserved, not cleaned up.
  The evolution of Sage's research state is itself research data.


TABLE: conversation_summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Compressed session record produced at session close. The
  research assistant compresses the working session into a
  structured summary. Sage reviews and edits before store.
  Most recent summary loaded at next session open as shallow
  continuity context.

  Full design context in SYSTEM_ Research Assistant.md.

  summary_id         — integer, primary key, autoincrement

  session_ref        — text, not null
                       Session identifier. Correlates with
                       sessions.session_id.

  topics_covered     — text, not null
                       JSON array of strings.

  decisions_made     — text, not null
                       JSON array of strings.

  open_threads       — text, not null
                       JSON array of strings.

  suggested_deposits — integer, not null
                       How many deposit suggestions were made
                       during the session.

  promoted_exchanges — text, not null
                       JSON array of strings. Exchange IDs
                       Sage marked for INT promotion.

  session_character  — text, not null
                       One sentence. The assistant's read on
                       what kind of session this was.

  voice_notes        — text, nullable
                       The assistant's read on Sage's voice
                       register during the session. Operational,
                       not therapeutic. Carries session
                       attunement forward.

  produced_at        — text (ISO timestamp), not null

  MOST RECENT ONLY loaded at session open. Summaries do not
  accumulate in context — only the latest one is loaded.
  All summaries are preserved for longitudinal review.


TABLE: venai_drift_log
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Language drift events detected by the research assistant
  during always-on Ven'ai awareness. Lightweight, per-session,
  timestamped. Not embedded — operational metadata, not field
  data.

  Full design context in SYSTEM_ Research Assistant.md.

  drift_id           — integer, primary key, autoincrement

  session_id         — text (UUID), not null
                       Foreign key to sessions.session_id.

  term               — text, not null
                       The Ven'ai term that drifted.

  drift_type         — text, not null
                       enum: 'semantic' | 'phonetic' |
                             'domain_context'
                       semantic:       usage differs from
                                       glossary definition.
                       phonetic:       pronunciation shifted
                                       from reference.
                       domain_context: term appeared in a new
                                       domain context.

  glossary_definition — text, not null
                       The reference definition at detection
                       time. Snapshot — preserves what the
                       assistant compared against.

  observed_usage     — text, not null
                       How the term was actually used.

  page_code          — text, nullable
                       Which page the drift was observed on.

  detected_at        — text (ISO timestamp), not null

  surfaced           — integer (0 | 1), not null, default 0
                       0 = logged silently.
                       1 = surfaced in conversation.

  ACCUMULATES: drift records are preserved. The longitudinal
  record of how language moves is research data about the
  research process itself.


KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. SESSION NOT CLOSED ON PROCESS EXIT
     FastAPI crashes or is killed. Session remains active = 1
     with no closed_at.
     Guard: startup recovery marks all orphaned active sessions
     as closed. The gap between last activity and closed_at
     timestamp distinguishes clean closes from interrupted ones.

  2. PRESENCE STATE TRANSITION INVALID
     Service receives dormant → active instead of
     dormant → returned.
     Guard: service layer validates transitions against the
     state machine. Invalid transitions rejected with error.
     The invalid request is logged — not silently corrected.

  3. SESSION_ID ORPHANED IN POSTGRESQL
     Root entry references a session_id that doesn't exist
     in SQLite (SQLite DB was deleted or recreated).
     Guard: SQLite operational.db is backed up alongside the
     project. session_id on PostgreSQL entries is still valid
     as a correlation key even if the SQLite record is lost —
     the PostgreSQL entry is self-contained. The SQLite record
     adds session context but its absence does not corrupt the
     archive entry.

  4. OPERATIONAL.DB FILE LOCKED
     Another process holds a lock on the SQLite file.
     Guard: WAL mode allows concurrent readers. Only one
     writer at a time — FastAPI is the sole writer. If a
     second FastAPI instance starts, the first must be stopped.
     Lock detection at startup: if the file is locked, startup
     fails with a named error — not a silent retry loop.

  5. MULTI-PRESENCE SESSION OPENED WITHOUT INVOCATION PHRASE
     session_type = multi_presence but invocation_phrase is null.
     Guard: the service layer requires invocation_phrase when
     session_type = multi_presence. A multi-presence session
     without the phrase is rejected at creation time. The phrase
     is the field's own — Sage defines it, the system records it.

  6. RESEARCHER MEMORY UPDATE WITHOUT HISTORY SNAPSHOT
     Live researcher_memory record is overwritten before the
     previous state is written to researcher_memory_history.
     Guard: service layer writes history snapshot BEFORE updating
     the live record. Both operations in a single transaction.
     If the snapshot write fails, the update is rolled back.

  7. CONVERSATION SUMMARY WRITTEN WITHOUT SESSION CLOSE
     Summary persisted but Redis conversation history not cleared.
     Session state is inconsistent — durable summary exists but
     ephemeral history also survives.
     Guard: session close sequence is ordered. Summary writes to
     SQLite (step 5) before Redis clears (step 6). If step 5
     fails, Redis is not cleared and session is not closed.
     Defined in SYSTEM_ Research Assistant.md session close
     sequence.

  8. VENAI DRIFT LOG MISSING SESSION REFERENCE
     Drift event logged with a session_id that does not exist
     in the sessions table.
     Guard: drift events are only logged during an active session.
     The service layer reads session_id from the active session
     record. If no active session exists, drift detection runs
     but does not persist events.


FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  backend/db/operational.db
    SQLite database file. Created at FastAPI startup.
    Gitignored — operational state is machine-local.
    Status: PLANNED (created when FastAPI skeleton runs)

  backend/db/sqlite.py
    SQLite connection management, table creation,
    startup recovery logic. Status: PLANNED

  backend/services/session.py
    Session lifecycle: create, close, presence state
    transitions, session_id generation. Status: PLANNED

  backend/services/researcher_memory.py
    Researcher memory: read, update with history snapshot,
    conversation summary production and storage, drift
    log persistence. Status: PLANNED
