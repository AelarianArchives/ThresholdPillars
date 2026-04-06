╔══════════════════════════════════════════════════════════════╗
║  DAILY NEXUS ROUTINE SCHEMA  ·  DNR  ·  V1                  ║
║  /DESIGN/Systems/Daily_Nexus_Routine/                        ║
║  Mechanical spec — pipeline sequence, payloads, store,       ║
║  retry, session window, failure modes.                       ║
║  Architectural description in SYSTEM_ Daily Nexus Routine.md ║
╚══════════════════════════════════════════════════════════════╝


OWNERSHIP BOUNDARIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OWNS
Session-close pipeline mechanics — step execution, write ordering
In-progress guard — check, timeout, recovery
routine_sessions store — field definitions, status transitions
LNV success payload — full shape specification
LNV failure notification payload — full shape specification
Retry mechanics — session window assembly, dedup array, window ceiling
Named constants — timeout, window max
Known failure modes — all guards and recovery paths

DOES NOT OWN
Pipeline architectural identity — owned by SYSTEM_ Daily Nexus Routine.md
MTM synthesis logic — owned by METAMORPHOSIS SCHEMA.md
Findings content or structure — owned by METAMORPHOSIS SCHEMA.md
LNV deposit writing — owned by LNV
WSC — sovereign, not part of this pipeline
PostgreSQL reads or writes — owned by FastAPI service layer
Routing authority — owned by SOT


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAMED CONSTANTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DNR_INPROGRESS_TIMEOUT_MS
  Maximum time an in_progress routine_session record can exist
  before DNR treats it as interrupted without requiring app restart.
  If an in_progress record is older than this threshold and no MTM
  resolution has arrived, DNR writes status → failed,
  failure_type → interrupted, surfaces retry. Same recovery path
  as NexusRoutine.init(). Calibration item at build time — the
  mechanism is defined here, the value is tuned at build.

DNR_DEDUP_WINDOW_MAX
  Maximum number of prior failed sessions included in the
  prior_mtm_session_ids dedup array. When the session window
  exceeds this count, DNR includes the N most recent failed
  sessions only and logs that the window was truncated.
  Truncation noted on routine_session record:
  dedup_window_truncated → true. LNV surfaces this when true —
  Sage knows the dedup pass was partial and semantic overlap from
  older sessions is possible. Calibration item at build time.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE CLOSE SESSION BUTTON — MECHANICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Lives in the global dropdown. Available from every page.

ON PRESS:

1. Check in-progress guard: if most recent routine_session status
   is in_progress AND record age < DNR_INPROGRESS_TIMEOUT_MS,
   does not fire. Surfaces status indicator.
   If in_progress AND record age >= DNR_INPROGRESS_TIMEOUT_MS,
   treats as interrupted (see INTERRUPTED RUN RECOVERY below).
2. Create routine_session record. Write status → in_progress.
   Write triggered_at = timestamp.
3. Execute the session-close pipeline (see below).
4. Write routine_session to final status.

GUARD — NO CONCURRENT RUNS: in_progress check runs before any new
session record is created. No duplicate runs.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION-CLOSE PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Strict order. Each step resolves before the next fires. Never
runs in parallel. Named by function, not count — Tier 4 may add
a Void session-close pulse check as an additional step.

STEP 1 — MTM SYNTHESIS

  Trigger: POST /mtm/synthesize
  On retry: pass prior_mtm_session_ids array (see RETRY)
  On clean run: pass no options
  Await completion. MTM returns result object:

    {
      status:                'complete' | 'failed'
      failure_type:          null | 'pre_synthesis' | 'mid_synthesis'
      findings:              Finding[]
      findings_count:        integer
      findings_dropped:      integer
      mtm_session_id:        string
      synthesis_duration_ms: integer
    }

  On resolution: write mtm_session_ref on routine_session record.
  Write synthesis_duration_ms on routine_session record (same
  moment, before LNV notification fires).
  Proceed to Step 2.

STEP 2 — LNV NOTIFICATION

  Fires after MTM resolves, regardless of MTM status. LNV always
  receives — success or failure.

  On MTM status 'complete':
    Assemble and send LNV success payload (see below).
    After LNV confirms receipt of each Finding, trigger FastAPI
    service layer to write lnv_routing_status → deposited and
    lnv_deposit_id on each findings record.
    Write lnv_notified → true on routine_session.
    Write retry_available → false.
    Write status → complete on routine_session.

  On MTM status 'failed':
    Assemble and send LNV failure notification payload (see below).
    After LNV confirms receipt:
    Write lnv_notified → true on routine_session.
    Write retry_available → true.
    Write status → failed on routine_session.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LNV SUCCESS PAYLOAD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What LNV receives when MTM status is 'complete':

    {
      type:                  'mtm_success'
      mtm_session_id:        string
      findings:              Finding[]
      findings_count:        integer
      findings_dropped:      integer
      synthesis_duration_ms: integer
      dedup_skipped:         boolean
    }

If findings_count is 0 and findings_dropped > 0, LNV surfaces:
"Synthesis complete — [n] candidate(s) produced, none written.
Review session logs."

If dedup_skipped is true, LNV surfaces: "Deduplication did not
run — findings may contain duplicates from prior failed sessions."

LNV pattern-matches on type: 'mtm_success' to distinguish from
failure payloads. Symmetric with the failure payload — both are
typed objects, never inferred from absence of fields.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LNV FAILURE NOTIFICATION PAYLOAD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What LNV receives when MTM status is 'failed':

    {
      type:                  'mtm_failure'
      failure_type:          'pre_synthesis' | 'mid_synthesis'
                             | 'interrupted'
      mtm_session_id:        string
      findings:              Finding[] — empty or partial
      findings_count:        integer
      findings_dropped:      integer
      synthesis_duration_ms: integer
      retry_available:       true
      message:               string — human-readable failure
                             description from failure_type
    }

LNV holds this as a flagged entry. It displays what was received,
surfaces failure type and count, and presents the retry prompt.
It does not editorialize the failure.

FAILURE TYPE DISPLAY:
  pre_synthesis → "MTM synthesis did not start — [reason].
    Retry available."
  mid_synthesis → "MTM synthesis incomplete — partial Findings
    received. [count] Finding(s) produced before failure.
    Retry available."
  interrupted → "Session interrupted before completion.
    Retry available."


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STORE: routine_sessions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  id                     — auto

  triggered_at           — timestamp. Written when Close Session
                           fires. Never updated.

  status                 — enum: in_progress | complete | failed
                           in_progress: pipeline executing.
                           complete: all steps resolved successfully.
                           failed: MTM returned failed status, or
                           run was interrupted.

  mtm_session_ref        — references synthesis_sessions.id.
                           Written after MTM resolves. Links this
                           run to the MTM session record. Null
                           until MTM resolves.

  synthesis_duration_ms  — integer. Wall-clock synthesis time in
                           milliseconds. Written at same moment as
                           mtm_session_ref, from MTM result object.
                           Visible in session history without
                           requiring a join to synthesis_sessions.
                           Null if MTM never resolved.

  lnv_notified           — boolean. true after LNV notification
                           step completes, regardless of MTM status.
                           false until Step 2 executes.

  failure_type           — enum: null | pre_synthesis |
                           mid_synthesis | interrupted
                           null on complete runs.
                           pre_synthesis: MTM halted before
                           synthesis began.
                           mid_synthesis: API failed partway.
                           interrupted: app closed/crashed while
                           run was in_progress, or
                           DNR_INPROGRESS_TIMEOUT_MS exceeded.

  retry_available        — boolean. true when status is failed.
                           false on complete runs. Written at
                           Step 2 completion.

  dedup_window_truncated — boolean. true when the retry session
                           window exceeded DNR_DEDUP_WINDOW_MAX
                           and was truncated to the N most recent
                           failed sessions. false on all other
                           runs. Null on clean first runs.
                           LNV surfaces when true.

  created_at             — timestamp. Written once at record
                           creation. Never updated.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERRUPTED RUN RECOVERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Two recovery paths. Both produce the same failure state.

AT APP LOAD (NexusRoutine.init()):
  Checks for any routine_session record with status in_progress.
  If found:
    Write status → failed on routine_session.
    Write failure_type → interrupted.
    Write retry_available → true.

  If mtm_session_ref is not null (MTM had resolved before crash):
    Write status → failed on the linked synthesis_session.
    Send LNV failure notification with failure_type: interrupted
    and findings_count from the MTM synthesis_session record.

  If mtm_session_ref is null (MTM had not yet resolved):
    No MTM session record to update.
    Send LNV failure notification with failure_type: interrupted,
    findings_count: 0, findings_dropped: 0.
    On retry: fires as clean run — passes no prior_mtm_session_ids.

IN-SESSION TIMEOUT (DNR_INPROGRESS_TIMEOUT_MS):
  If an in_progress record is older than the timeout threshold
  and no MTM resolution has arrived: same recovery path as init().
  Write status → failed, failure_type → interrupted. Surface retry.
  No app restart required.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RETRY MECHANICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Surfaced in two places: LNV inline Retry button, Global dropdown
Retry Session Close. Both call NexusRoutine.retry(). Behavior is
identical regardless of caller.

SESSION WINDOW DETERMINATION:

  The current session window is all routine_session records since
  the most recent record with status: complete. If no complete
  record exists, the window is all records. The window closes the
  moment a run completes successfully.

  DNR reads all routine_session records in the current window.
  Reads mtm_session_ref from each. Assembles prior_mtm_session_ids
  array from those refs. Excludes any record where mtm_session_ref
  is null — those runs were interrupted before MTM resolved and
  have no Findings to deduplicate against.

WINDOW CEILING (DNR_DEDUP_WINDOW_MAX):

  When the session window exceeds DNR_DEDUP_WINDOW_MAX, DNR
  includes only the N most recent failed sessions in the dedup
  array. The truncation is logged. dedup_window_truncated → true
  written on the new routine_session record. LNV surfaces this
  so Sage knows the dedup pass was partial.

RETRY EXECUTION:

  Creates a new routine_session record (never modifies previous).
  Passes prior_mtm_session_ids to MTM synthesis endpoint.
  Runs the full session-close pipeline from Step 1.
  Respects the in_progress guard — does not bypass it.
  Retry Session Close disappears from dropdown when a successful
  run completes.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PUBLIC API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NexusRoutine.init() → void
  Called once at app init. Wires Close Session button. Wires Retry
  Session Close option. Checks for stale in_progress records and
  resolves them. Called before the app shell is interactive.

NexusRoutine.run() → Promise<void>
  Called by Close Session button. Runs in_progress guard (with
  timeout check). Creates routine_session record. Executes the
  session-close pipeline. Returns when all steps have resolved.

NexusRoutine.retry() → Promise<void>
  Called from LNV inline Retry button or Global dropdown Retry
  Session Close. Assembles prior_mtm_session_ids from current
  session window (respecting DNR_DEDUP_WINDOW_MAX). Creates new
  routine_session record. Runs full session-close pipeline.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. BUTTON FIRES WHILE PREVIOUS RUN IS IN_PROGRESS
Two concurrent runs. Duplicate session records. MTM fires twice.
LNV receives duplicates.
Guard: in_progress check runs before any new session record is
created. If most recent status is in_progress and within timeout
window, button does not fire. Status indicator surfaced.

2. MTM COMPLETES BUT LNV NOTIFICATION FAILS
Findings exist in PostgreSQL. LNV never receives them. Session
shows complete for MTM but lnv_notified stays false.
Guard: lnv_notified written only after LNV notification confirms.
Session status written only after lnv_notified is true. A session
where lnv_notified is false and mtm_session_ref is written is an
incomplete run — NexusRoutine.init() checks for this on app load.

3. RETRY FIRED BEFORE FAILURE_TYPE IS WRITTEN
Retry fires on incomplete failure record. New run references
unresolved state.
Guard: retry_available set to true only after failure_type is
written and lnv_notified is true. Retry prompt does not surface
until failure notification payload is fully written.

4. SESSION RECORD NEVER EXITS IN_PROGRESS
In_progress guard blocks all future runs indefinitely.
Guard: two recovery paths — NexusRoutine.init() at app load, and
DNR_INPROGRESS_TIMEOUT_MS for in-session recovery. Both write
status → failed, failure_type → interrupted. No permanent block.

5. FAILED SESSION RECORD OVERWRITTEN ON RETRY
Ledger no longer reflects what happened. Provenance gap.
Guard: retry always creates a new routine_session record. Failed
records are read-only after status is written. No update path.

6. DEDUP WINDOW GROWS UNBOUNDED
40+ failed sessions in window. MTM loads all prior findings to
build dedup Set. Performance degrades.
Guard: DNR_DEDUP_WINDOW_MAX caps the window. Truncation logged.
dedup_window_truncated noted on routine_session. LNV surfaces
when true so Sage knows dedup was partial.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

backend/services/dnr.py
  DNR service — session-close pipeline execution, in_progress
  guard with timeout, session record management, MTM endpoint
  trigger, LNV notification (success + failure payloads), retry
  logic with window ceiling, interrupted recovery on init.
  Status: PLANNED

backend/routes/dnr.py
  FastAPI DNR endpoints — session close trigger, retry trigger,
  session status query.
  Status: PLANNED

frontend/ (DNR components)
  Svelte — Close Session button in global dropdown, Retry Session
  Close dropdown item, status indicators.
  Status: PLANNED
