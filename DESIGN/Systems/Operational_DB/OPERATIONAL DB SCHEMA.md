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
                       post-promotion archive entry.

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
