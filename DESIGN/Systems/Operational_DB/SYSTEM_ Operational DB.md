# SYSTEM: Operational DB

## /DESIGN/Systems/Operational_DB/

### SQLite state layer · session lifecycle · stale flags · researcher memory · conversation summaries · pearls · Ven'ai drift log

---

## WHAT THIS SYSTEM OWNS

* SQLite database — ephemeral and operational state. Separate from
  PostgreSQL (archive data). Created at FastAPI startup. WAL mode
  for concurrent reads
* Session lifecycle — session creation, session_id generation (UUID),
  session close. session_id correlates SQLite sessions table with
  PostgreSQL root_entries.session_id
* Multi-presence session tracking — session_type (single | multi_presence),
  invocation_phrase for multi-presence sessions
* Presence logging — Origin presence state transitions per session.
  Valid state machine enforced (active → dormant → returned → dormant).
  Transitions preserved for research value
* Engine stale flags — one row per Axis engine (thr, str, inf, ecr,
  snm). Boolean flag: set to 1 when deposit lands, cleared to 0 when
  computation completes. Mechanic defined by Engine Computation;
  table lives here
* Researcher memory — Sage's active research state. Single live record:
  current_focus, active_hypotheses, open_questions, skepticisms,
  not_yet_named, research_posture, phase_context. Two update paths:
  Sage-initiated and assistant-suggested-Sage-confirmed.
  updated_by field distinguishes authority level
* Researcher memory history — snapshot of full memory state before
  every update. snapshot_reason recorded. Research evolution visible
  over time
* Conversation summaries — compressed session records produced at
  session close. Most recent summary loaded at next session open for
  continuity. Includes session_character, voice_notes, topics_covered,
  decisions_made, open_threads
* Ven'ai drift log — per-session drift events detected by the research
  assistant. drift_type (semantic | phonetic | domain_context),
  glossary_definition snapshot, observed_usage. Records accumulate —
  longitudinal drift data is research material
* Pearls — pre-archive signal captures. Status lifecycle:
  active → promoted → archived. Promoted pearls route through INT
  gateway as deposits. promoted_deposit_id links back after promotion.
  type (capture | reflective), swarm_visible flag
* Operational state — key-value store for transient UI state (current
  section, active filters). Ephemeral by design
* Startup recovery — on FastAPI startup, verify tables exist, create
  if missing. No migration framework (SQLite schema is simple enough
  for create-if-not-exists)

## WHAT THIS SYSTEM DOES NOT OWN

* Archive data — all archive entries, tags, threads, embeddings live in
  PostgreSQL. SQLite never stores archive data. The boundary is
  architectural: PostgreSQL = durable research data, SQLite = operational
  state
* Engine computation — owned by Engine Computation and individual
  engines. Operational DB stores the stale flags; engines own the
  computation logic
* Embedding pipeline — owned by Embedding Pipeline. Embeddings table
  is PostgreSQL
* Session persistence (conversation history) — active conversation
  history lives in Redis during sessions. Operational DB stores the
  compressed summary after session close, not the raw exchanges
* Researcher memory content decisions — the Research Assistant system
  owns the memory model design, update surfacing, and context assembly.
  Operational DB owns the table
* Pearl promotion logic — INT gateway owns deposit creation. Operational
  DB stores the pearl and writes promoted_deposit_id back after INT
  confirms

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| DESIGN/Systems/Operational_DB/OPERATIONAL DB SCHEMA.md | Full mechanical spec — all tables, state machines, startup recovery, session correlation | V1 |
| backend/db/operational.db | SQLite file, created at FastAPI startup | PLANNED |
| backend/db/sqlite.py | Connection management, table creation, WAL mode, startup recovery | LIVE |
| backend/services/session.py | Session lifecycle, presence state transitions, session_id generation | PLANNED |
| backend/services/researcher_memory.py | Memory read/update, history snapshot, summary production, drift log | PLANNED |
