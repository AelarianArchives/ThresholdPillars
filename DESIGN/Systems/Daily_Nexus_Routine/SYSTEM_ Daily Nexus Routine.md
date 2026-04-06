# SYSTEM: Daily Nexus Routine

## /DESIGN/Systems/Daily_Nexus_Routine/

### Session-close pipeline · MTM-to-LNV orchestration · failure recovery

---

## WHAT THIS SYSTEM OWNS

* Close Session button — wired in the global dropdown, available from every page
* Session-close pipeline orchestration — step order definition and enforcement. Notification does not fire until synthesis resolves.
* In-progress guard — checks for a running or stale session before allowing a new run to begin, with timeout for in-session recovery
* routine_sessions PostgreSQL table — record creation, status writes, failure typing, performance tracking, read-only enforcement on completed and failed records
* Handoff timing — awaiting MTM synthesis endpoint completion before LNV notification fires
* Failure detection and typing — pre_synthesis vs mid_synthesis vs interrupted
* LNV notification — assembling and sending both success and failure payloads to LNV
* lnv_notified flag — written after LNV notification step confirms, regardless of MTM status
* lnv_routing_status trigger — after LNV confirms receipt of each Finding, DNR triggers the FastAPI service layer to write lnv_routing_status → deposited and lnv_deposit_id on the findings record. DNR owns the trigger. The FastAPI service layer owns the write.
* Retry surface — Retry Session Close in the global dropdown (visible when retry_available is true), inline Retry button in LNV. Both call NexusRoutine.retry().
* Stale in-progress recovery — NexusRoutine.init() detects and resolves interrupted session records on app load. In-session timeout provides recovery without app restart.

## WHAT THIS SYSTEM DOES NOT OWN

* MTM synthesis logic — owned by MTM synthesis service (backend/services/mtm.py)
* Findings content or structure — owned by METAMORPHOSIS SCHEMA.md
* LNV deposit writing — owned by LNV
* Witness Scroll (WSC · 46) — WSC is sovereign. It is not triggered, sequenced, owned, or waited on here. WSC follows the pipeline's completion as a separate act.
* PostgreSQL reads or writes — owned by FastAPI service layer (backend/services/)
* Routing authority — owned by SOT

---

## WHAT THE ROUTINE IS

The Daily Nexus Routine is the architectural close sequence that runs between the Axis and Nexus layers at session close. It fires the MTM synthesis cycle and routes its output to LNV in guaranteed order with guaranteed completion handling.

It is not a summary function. It is not a prompt. It is a defined contract between MTM and LNV that executes the same way every session, regardless of what the session contained. A session with zero Axis deposits still runs the pipeline. MTM reads what exists and produces Findings or produces none. Both are valid outcomes.

The pipeline may run more than once in a day. Each run is a discrete routine_session record. There is no one-per-day constraint.

WSC is not part of this pipeline. Witness Scroll is a separate act that follows the pipeline's completion. The pipeline does not trigger WSC, prompt WSC, or wait for WSC. WSC remains sovereign.

---

## THE CLOSE SESSION BUTTON

Lives in the global dropdown alongside the media intake trigger. Consistent position and label across all pages. It is a session-level architectural action — not a page-level function.

On press: checks the in-progress guard, creates a session record, fires the session-close pipeline, writes final status. Full mechanics in DAILY NEXUS ROUTINE SCHEMA.md.

---

## THE SESSION-CLOSE PIPELINE

Strict order. Each step resolves before the next fires. Never runs in parallel.

**Step 1 — MTM Synthesis**
Triggers the MTM synthesis endpoint (POST /mtm/synthesize). On retry: passes prior_mtm_session_ids array. On clean run: passes no options. MTM runs its full cycle and returns a result object. DNR does not inspect Findings content — it receives the result object and passes it to Step 2.

**Step 2 — LNV Notification**
Fires after MTM resolves, regardless of MTM status. LNV always receives — success or failure. On success: routes Findings, triggers lnv_routing_status writes. On failure: sends failure notification payload with typed failure and retry prompt.

Both payloads carry synthesis_duration_ms so LNV surfaces performance visibility.

NOTE: Tier 4 design may add a Step 3 (Void session-close pulse check). The pipeline is named by function, not by count, so the addition does not require renaming.

Full pipeline mechanics, payload shapes, and write ordering in DAILY NEXUS ROUTINE SCHEMA.md.

---

## INTERRUPTED RUN RECOVERY

Two recovery paths exist:

**At app load (NexusRoutine.init()):** Checks for any routine_session record with status in_progress. If found: writes status → failed, failure_type → interrupted, retry_available → true. Handles both cases — MTM resolved before crash (has mtm_session_ref) and MTM not yet resolved (null ref). Sends LNV failure notification in both cases.

**In-session timeout (DNR_INPROGRESS_TIMEOUT_MS):** If an in_progress record is older than the timeout threshold and no MTM resolution has arrived, DNR treats it as interrupted without requiring an app restart. Same recovery path as init() — writes status → failed, failure_type → interrupted, surfaces retry.

Both paths produce the same failure state. No special case logic elsewhere in the system.

---

## RETRY MECHANICS

Surfaced in two places after any MTM failure:

**LNV** — a flagged failure entry with the failure type, findings count produced before failure, and an inline Retry button. Sage sees exactly what happened and can act without navigating away.

**Global dropdown** — Retry Session Close appears while retry_available is true on the most recent routine_session record. Sage can retry from any page. Disappears when a successful run completes.

Both surfaces call NexusRoutine.retry(). Behavior is identical regardless of where retry is triggered. Retry does not bypass the in_progress guard. A new routine_session record is created on every retry. No previous record is modified.

Retry window, dedup session window assembly, and window ceiling defined in DAILY NEXUS ROUTINE SCHEMA.md.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/services/dnr.py | DNR service — session-close pipeline execution, in_progress guard, session record management, MTM endpoint trigger, LNV notification, retry logic, stale in_progress recovery on init, timeout recovery | PLANNED |
| backend/routes/dnr.py | FastAPI DNR endpoints — session close trigger, retry trigger, session status query | PLANNED |
| frontend/ (DNR components) | Svelte — Close Session button in global dropdown, Retry Session Close dropdown item, status indicators | PLANNED |

All mechanical specs — pipeline sequence, payload shapes, store definitions, session window determination, named constants, failure modes — in DAILY NEXUS ROUTINE SCHEMA.md.
