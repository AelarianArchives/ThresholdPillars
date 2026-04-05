# SYSTEM: Daily Nexus Routine

## daily_nexus_routine_system.md

### /DESIGN/systems/

---

## WHAT THIS SYSTEM OWNS

* Close Session button — wired in the global dropdown, available from every page
* Sequence orchestration — step order definition and enforcement. Step 2 does not fire until Step 1 resolves.
* In-progress guard — checks for a running or stale session before allowing a new run to begin
* routine_sessions PostgreSQL table — record creation, status writes, failure typing, read-only enforcement on completed and failed records
* Handoff timing — awaiting MTM synthesis endpoint completion before LNV notification fires
* Failure detection and typing — pre_synthesis vs mid_synthesis vs interrupted
* LNV failure notification — assembling and sending the failure payload to LNV on every MTM failure
* lnv_notified flag — written after LNV notification step confirms, regardless of MTM status
* lnv_routing_status trigger — after LNV confirms receipt of each Finding, DNR triggers the FastAPI service layer to write lnv_routing_status → deposited and lnv_deposit_id on the findings record. DNR owns the trigger. The FastAPI service layer owns the write.
* Retry surface — Retry Session Close in the global dropdown (visible when retry_available is true), inline Retry button in LNV. Both call NexusRoutine.retry().
* Stale in-progress recovery — NexusRoutine.init() detects and resolves interrupted session records on app load

## WHAT THIS SYSTEM DOES NOT OWN

* MTM synthesis logic — owned by MTM synthesis service (backend/services/mtm.py)
* Findings content or structure — owned by MTM schema
* LNV deposit writing — owned by LNV
* Witness Scroll (WSC · 46) — WSC is sovereign. It is not triggered, sequenced, owned, or waited on here. WSC follows the Routine's completion as a separate act.
* PostgreSQL reads or writes — owned by FastAPI service layer (backend/services/)
* Routing authority — owned by SOT

---

## WHAT THE ROUTINE IS

The Daily Nexus Routine is the architectural close sequence that runs between the Axis and Nexus layers at session close. It fires the MTM synthesis cycle and routes its output to LNV in guaranteed order with guaranteed completion handling.

It is not a summary function. It is not a prompt. It is a defined contract between MTM and LNV that executes the same way every session, regardless of what the session contained. A session with zero Axis deposits still runs the Routine. MTM reads what exists and produces Findings or produces none. Both are valid outcomes.

The Routine may run more than once in a day. Each run is a discrete routine_session record. There is no one-per-day constraint.

---

## THE CLOSE SESSION BUTTON

Lives in the global dropdown alongside the media intake trigger. Consistent position and label across all pages. It is a session-level architectural action — not a page-level function.

**On press:**
1. Checks whether a Routine run is already in_progress. If yes: does not fire. Surfaces a status indicator. No duplicate runs.
2. Creates a routine_session record. Writes status → in_progress.
3. Triggers the MTM synthesis endpoint (POST /mtm/synthesize). Awaits resolution.
4. On MTM resolution: proceeds to LNV notification step.
5. Writes routine_session to final status.

---

## TWO-STEP SEQUENCE

Strict order. Step 2 does not fire until Step 1 resolves — success or failure. Never runs in parallel.

**Step 1 — MTM Synthesis**
Triggers the MTM synthesis endpoint (POST /mtm/synthesize). On retry: passes prior_mtm_session_ids array. On clean run: passes no options. Awaits completion. MTM runs its full cycle and returns a result object. DNR does not inspect Findings content — it receives the result object and passes it to Step 2.

**Step 2 — LNV Notification**
Fires after the MTM synthesis endpoint resolves regardless of MTM status. LNV always receives. Even on failure.

On MTM status 'complete': DNR sends the success payload. After LNV confirms receipt of each Finding, DNR triggers the FastAPI service layer to write lnv_routing_status → deposited and lnv_deposit_id on each findings record. Then writes lnv_notified → true. Then writes retry_available → false. Then writes status → complete.

On MTM status 'failed': DNR sends the failure payload (see LNV FAILURE NOTIFICATION below). After LNV confirms receipt, writes lnv_notified → true. Then writes retry_available → true. Then writes status → failed.

---

## FAILURE HANDLING

Two failure types. They are not the same event. Both are named, typed, and handled explicitly.

**pre_synthesis** — MTM could not read one or more lens pages before synthesis began. No Findings were produced. LNV receives: empty findings array · failure_type: pre_synthesis · mtm_session_id · retry prompt.

**mid_synthesis** — All five lens pages were read. Claude API failed partway through. Some Findings may exist. LNV receives: partial findings array (whatever was produced before failure) · failure_type: mid_synthesis · mtm_session_id · retry prompt.

**Failed session records are never overwritten.** A failed routine_session record is the accurate record of what happened. Retry creates a new session record. The failed record stands.

---

## LNV FAILURE NOTIFICATION PAYLOAD

```
{
  type:             'mtm_failure'
  failure_type:     'pre_synthesis' | 'mid_synthesis' | 'interrupted'
  mtm_session_id:   the synthesis_session record id
  findings:         array — empty or partial
  findings_count:   integer
  findings_dropped: integer
  retry_available:  true
  message:          human-readable failure description
}
```

LNV holds this as a flagged entry. It displays what was received, surfaces failure type and count, and presents the retry prompt. It does not editorialize the failure.

---

## RETRY MECHANICS

Surfaced in two places after any MTM failure:

**LNV** — a flagged failure entry with the failure type, findings count produced before failure, and an inline Retry button. Sage sees exactly what happened and can act without navigating away.

**Global dropdown** — Retry Session Close appears while retry_available is true on the most recent routine_session record. Sage can retry from any page. Disappears when a successful run completes.

Both surfaces call NexusRoutine.retry(). Behavior is identical regardless of where retry is triggered.

**Current session window** — all routine_session records since the most recent record with status: complete. If no complete record exists, the window is all records. DNR assembles the full prior_mtm_session_ids array from all mtm_session_refs in the current window (excluding records where mtm_session_ref is null — those were interrupted before MTM resolved and have no Findings to deduplicate against). This full array is passed to the MTM synthesis endpoint on retry so deduplication runs against all prior failed sessions, not just the most recent.

Retry does not bypass the in_progress guard. A new routine_session record is created on every retry. No previous record is modified.

---

## INTERRUPTED RUN RECOVERY

NexusRoutine.init() runs once at app load. It checks for any routine_session record with status in_progress.

If found (stale record from a previous interrupted session):
* Writes status → failed on the routine_session record
* Writes failure_type → interrupted on routine_session
* Writes retry_available → true on routine_session

If mtm_session_ref is not null on the stale record — MTM had resolved before the crash:
* Writes status → failed on the linked synthesis_session record in MTM's store
* Sends LNV failure notification payload with failure_type: interrupted and findings_count from the MTM synthesis_session record

If mtm_session_ref is null on the stale record — MTM had not yet resolved when the app closed:
* No MTM session record to update
* Sends LNV failure notification payload with failure_type: interrupted, findings_count: 0, findings_dropped: 0
* On retry, fires as a clean run — passes no prior_mtm_session_ids. No prior Findings to deduplicate against.

In all cases: surfaces Retry Session Close in the dropdown. Same failure path as any other failed run.

---

## PUBLIC API

**NexusRoutine.init() → void**
Called once at app init. Wires the Close Session button in the global dropdown. Wires the Retry Session Close option. Checks for stale in_progress records and resolves them. Called before the app shell is interactive.

**NexusRoutine.run() → Promise\<void\>**
Called by the Close Session button. Runs the in_progress guard. Creates routine_session record. Executes the two-step sequence. Returns when both steps have resolved.

**NexusRoutine.retry() → Promise\<void\>**
Called from two surfaces: inline Retry button in LNV, and Retry Session Close in the global dropdown. Behavior is identical regardless of caller. Assembles prior_mtm_session_ids from current session window. Passes them to MTM. Creates new routine_session record. Runs full two-step sequence.

---

## KNOWN FAILURE MODES

**1. Button fires while previous run is in_progress**
Two concurrent Routine runs. Duplicate session records. MTM fires twice. LNV receives duplicates.
Guard: in_progress check runs before any new session record is created. If most recent session status is in_progress, button does not fire. Status indicator surfaced instead.

**2. MTM completes but LNV notification fails**
Findings exist in PostgreSQL. LNV never receives them. Session shows complete for MTM but lnv_notified stays false.
Guard: lnv_notified is written only after LNV notification step confirms. Session status written only after lnv_notified is true. A session where lnv_notified is false and mtm_session_ref is written is an incomplete run. NexusRoutine.init() checks for this state on app load and surfaces recovery.

**3. Retry fired before failure_type is written**
Retry fires on an incomplete failure record. New run references unresolved state.
Guard: retry_available is only set to true after failure_type is written and lnv_notified is true. Retry prompt does not surface in LNV until the failure notification payload has been fully written.

**4. Session record never exits in_progress**
In_progress guard blocks all future Routine runs indefinitely.
Guard: session status is always written as the final step of NexusRoutine.run(). If the run throws before reaching the status write, NexusRoutine.init() detects the stale in_progress record on next app load and resolves it.

**5. Failed session record overwritten on retry**
Ledger no longer reflects what actually happened. Provenance gap.
Guard: retry always creates a new routine_session record. Failed records are read-only after status is written. No update path exists.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/services/dnr.py | DNR service — two-step sequence execution, in_progress guard, session record management, MTM endpoint trigger, LNV failure notification, retry logic, stale in_progress recovery on init | PLANNED |
| backend/routes/dnr.py | FastAPI DNR endpoints — session close trigger, retry trigger, session status query | PLANNED |
| frontend/ (DNR components) | Svelte — Close Session button in global dropdown, Retry Session Close dropdown item, status indicators | PLANNED |
