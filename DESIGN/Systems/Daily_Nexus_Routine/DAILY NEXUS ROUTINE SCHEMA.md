

╔══════════════════════════════════════════════════════════════╗ ║ DAILY NEXUS ROUTINE SCHEMA · DNR · v1 ║ ║ /DESIGN/systems/daily\_nexus\_routine\_schema\_v1.md ║ ╚══════════════════════════════════════════════════════════════╝

OWNERSHIP BOUNDARIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OWNS The Close Session button — global dropdown, every page Sequence orchestration — step order definition and enforcement Session record — creation, status tracking, failure typing Handoff timing — awaiting MTM completion before LNV fires Failure flagging — detecting, typing, and writing failure state LNV failure notification — what LNV receives on MTM failure Retry surface — surfacing retry prompt in LNV, firing new run lnv\_routing\_status trigger — after LNV confirms receipt of each Finding, DNR triggers the FastAPI service layer to write lnv\_routing\_status → deposited and lnv\_deposit\_id on the findings record. DNR owns this trigger. The FastAPI service layer owns the write.

DOES NOT OWN MTM synthesis logic — owned by MTM synthesis service (backend/services/mtm.py) Findings content or structure — owned by MTM schema LNV deposit writing — owned by LNV WSC — Witness Scroll is not part of this Routine. It is a separate act that follows session close. It is not triggered, sequenced, or owned here. PostgreSQL reads or writes — owned by FastAPI service layer (backend/services/) Routing authority — owned by SOT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ROUTINE DEFINITION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Daily Nexus Routine is the architectural close sequence that runs between the Axis and Nexus layers at session close. It fires the MTM synthesis cycle and routes its output to LNV in guaranteed order with guaranteed completion handling.

It is not a summary function. It is not a prompt. It is a defined contract between MTM and LNV that executes the same way every time, regardless of what the session contained.

WSC is not part of this Routine. Witness Scroll is a separate act that follows the Routine's completion. The Routine does not trigger WSC, prompt WSC, or wait for WSC. WSC remains sovereign.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SESSION DEFINITION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A session is the working period between two Routine runs. It has no formal open event — it begins when the previous Routine run completes. It ends when Close Session is pressed.

The Routine may run more than once in a day. Each run is a discrete session record. There is no one-per-day constraint.

A session may contain zero deposits to the Axis lens pages. The Routine still runs if triggered. MTM will read what exists and either produce Findings or produce none. Both are valid outcomes. Neither is an error.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ THE CLOSE SESSION BUTTON ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Close Session button lives in the global dropdown. The same dropdown that carries the media intake trigger. Available from every page in the archive.

Consistent position and label across all pages. Does not interfere with any page's primary deposit flow. It is a session-level architectural action, not a page-level function.

WHAT IT DOES ON PRESS

1. Checks whether a Routine run is already in\_progress. If yes: does not fire a second run. Surfaces a status indicator — Routine already running. No duplicate runs.  
2. Creates a session record. Writes status → in\_progress.  
3. Triggers the MTM synthesis endpoint (POST /mtm/synthesize). Awaits resolution.  
4. On MTM resolution: proceeds to LNV notification step.  
5. Writes session record to final status.

GUARD — NO CONCURRENT RUNS If status of the most recent session record is in\_progress, the button does not fire a new run. The in\_progress check runs before any new session record is created.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TWO-STEP SEQUENCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Strict order. Step 2 does not fire until Step 1 resolves — success or failure. The sequence never runs in parallel.

STEP 1 — MTM SYNTHESIS Trigger the MTM synthesis endpoint (POST /mtm/synthesize). On retry: pass prior\_mtm\_session\_ids array (see RETRY). On clean run: pass no options. Await completion. MTM runs its full synthesis cycle — reads all five lens pages, calls Claude API, produces Findings, writes to PostgreSQL. The synthesis endpoint returns a result object:

{  
  status:           'complete' | 'failed'  
  failure\_type:     null | 'pre\_synthesis' | 'mid\_synthesis'  
  findings:         array of Finding records produced  
                    (may be empty on failure or clean run  
                    with no patterns)  
  findings\_count:   integer — count of findings array  
  findings\_dropped: integer — candidates not written,  
                    zero on clean runs  
  mtm\_session\_id:   the synthesis\_session record id  
}

The Routine does not inspect Findings content. It receives the result object and passes it to Step 2\.

STEP 2 — LNV NOTIFICATION Fires after the MTM synthesis endpoint resolves, regardless of MTM status. LNV always receives. Even on failure.

On MTM status 'complete': DNR sends LNV the success payload: { type: 'mtm\_complete' mtm\_session\_id: the synthesis\_session record id findings: array of Finding records findings\_count: integer findings\_dropped: integer If findings\_count is 0 and findings\_dropped \> 0, LNV surfaces: Synthesis complete — \[n\] candidate(s) produced, none written. Review session logs. } After LNV confirms receipt of each Finding, DNR triggers the FastAPI service layer to write lnv\_routing\_status → deposited and lnv\_deposit\_id on each findings record. Then writes lnv\_notified → true on routine\_session. Then writes retry\_available → false. Then writes status → complete on routine\_session.

On MTM status 'failed': DNR sends LNV the failure payload. See LNV FAILURE NOTIFICATION PAYLOAD below. After LNV confirms receipt, DNR writes lnv\_notified → true on routine\_session. Then writes retry\_available → true. Then writes status → failed on routine\_session.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FAILURE HANDLING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Two failure types. They are not the same event. Both are named, typed, and handled explicitly.

FAILURE TYPE: pre\_synthesis Condition: MTM could not read one or more lens pages before synthesis began. No Findings were produced. LNV receives: empty findings array · failure\_type: 'pre\_synthesis' · mtm\_session\_id · retry prompt. LNV displays: MTM synthesis did not start — \[reason\]. Retry available.

FAILURE TYPE: mid\_synthesis Condition: All five lens pages were read. Claude API failed partway through. Some Findings may exist. LNV receives: partial findings array (whatever was produced before failure) · failure\_type: 'mid\_synthesis' · mtm\_session\_id · retry prompt. LNV displays: MTM synthesis incomplete — partial Findings received. \[count\] Finding(s) produced before failure. Retry available.

FAILED SESSION RECORDS ARE NEVER OVERWRITTEN A failed synthesis\_session record is the accurate record of what happened. It is not corrected retroactively. Retry creates a new session record. The failed record stands. The ledger reflects what actually happened.

RETRY Surfaced in two places after any MTM failure:

LNV — a flagged failure entry displays the failure type, findings count produced before failure, and an inline Retry button. Sage sees exactly what happened and can act from there without navigating away.

Global dropdown — Retry Session Close appears in the dropdown while retry\_available is true. Sage can retry from any page without navigating to LNV first.

Both surfaces call NexusRoutine.retry(). The previous failed session's mtm\_session\_id is passed to MTM so deduplication runs against already-produced Findings before anything new is written or routed. Partial data from a failed mid\_synthesis run is never duplicated in LNV on retry.

Retry does not bypass the in\_progress guard. A new session record is created on every retry. The previous failed record is never modified. Retry Session Close disappears from the dropdown when a successful run completes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ STORE: routine\_sessions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

id — auto

triggered\_at — timestamp Written when Close Session fires. Never updated.

status — enum: in\_progress | complete | failed in\_progress: sequence executing. complete: both steps resolved successfully. failed: MTM returned failed status.

mtm\_session\_ref — references synthesis\_sessions.id Written after the MTM synthesis endpoint resolves. Links this Routine run to the MTM session record. Null until MTM resolves.

lnv\_notified — boolean true after LNV notification step completes, regardless of MTM status. false until Step 2 executes.

failure\_type — enum: null | pre\_synthesis | mid\_synthesis | interrupted null on complete runs. pre\_synthesis: MTM halted before synthesis began. mid\_synthesis: API failed partway through synthesis. interrupted: app closed or crashed while run was in\_progress. Written by NexusRoutine.init() on stale record detection. Written from MTM result object on failed runs. Written by init() on interrupted runs.

retry\_available — boolean true when status is failed. false on complete runs. Written at Step 2 completion.

created\_at — timestamp Written once at record creation. Never updated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ LNV FAILURE NOTIFICATION PAYLOAD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What LNV receives when MTM status is 'failed':

{ type: 'mtm\_failure' failure\_type: 'pre\_synthesis' | 'mid\_synthesis' | 'interrupted' mtm\_session\_id: the synthesis\_session record id findings: array — empty or partial findings\_count: integer — count of what was produced findings\_dropped: integer — candidates not written. Surfaces alongside findings\_count so LNV can distinguish a genuine empty from a dropped-all result. retry\_available: true message: human-readable failure description generated from failure\_type }

LNV holds this payload as a flagged entry. It does not editorialize the failure. It displays what was received, surfaces the failure type and count, and presents the retry prompt. The payload is traceable to the MTM session record via mtm\_session\_id.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PUBLIC API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NexusRoutine.init() → void Called once at app init. Wires the Close Session button in the global dropdown. Wires the Retry Session Close option in the global dropdown. Checks for any in\_progress session record from a previous interrupted run. If found: — Writes status → failed on the routine\_session record — Writes failure\_type → interrupted on routine\_session — Writes retry\_available → true on routine\_session — If mtm\_session\_ref is not null on the stale record: Writes status → failed on the linked synthesis\_session record in MTM's store. Sends LNV failure notification payload with failure\_type: 'interrupted' and findings\_count from the MTM synthesis\_session record. — If mtm\_session\_ref is null on the stale record: MTM had not yet resolved when the app was interrupted. No MTM session record to update. Sends LNV failure notification payload with failure\_type: 'interrupted', findings\_count: 0, findings\_dropped: 0\. On retry, fires as a clean run — passes no prior\_mtm\_session\_ids. There are no prior Findings to deduplicate against. — Surfaces Retry Session Close in the dropdown. This is the same failure path as any other failed run. No special case logic elsewhere in the system.

NexusRoutine.run() → Promise<void> Called by the Close Session button. Runs the in\_progress guard. Creates routine\_session record. Executes the two-step sequence. Returns when both steps have resolved.

NexusRoutine.retry() → Promise<void> Called from two surfaces: — Inline Retry button on the flagged failure entry in LNV — Retry Session Close option in the global dropdown Both surfaces call the same function. Behavior is identical regardless of where retry was triggered.

SESSION WINDOW — HOW IT IS DETERMINED The current session window is all routine\_session records since the most recent record with status: complete. If no complete record exists, the window is all records. The window closes the moment a run completes successfully. Every failed and interrupted record between the last complete run and now belongs to the current window.

Reads all routine\_session records in the current window. Reads mtm\_session\_ref from each. Assembles the full prior\_mtm\_session\_ids array from those refs. Excludes any record where mtm\_session\_ref is null — those runs were interrupted before MTM resolved and have no Findings to deduplicate against. Source: routine\_sessions.mtm\_session\_ref on each record in the current window. Never assumed or hardcoded.

Passes prior\_mtm\_session\_ids array to the MTM synthesis endpoint so deduplication runs against cumulative Findings from all prior failed runs — not just the most recent. Partial data from any failed run in the window is never duplicated in LNV on retry.

Does not modify any previous session record. Creates a new routine\_session record. Runs the full two-step sequence from Step 1\. Respects the in\_progress guard — does not bypass it.

RETRY SESSION CLOSE — DROPDOWN VISIBILITY Retry Session Close appears in the global dropdown only when retry\_available is true on the most recent session record. It disappears when a subsequent Routine run completes with status complete. It is not a permanent dropdown item — it is a recoverable state indicator.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ KNOWN FAILURE MODES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. BUTTON FIRES WHILE PREVIOUS RUN IS IN\_PROGRESS Two Routine runs execute concurrently. Two session records created for the same working period. MTM fires twice. LNV receives duplicate or overlapping Findings. Guard: in\_progress check runs before any new session record is created. If the most recent session record status is in\_progress, the button does not fire. Status indicator surfaced instead.

2. MTM COMPLETES BUT LNV NOTIFICATION FAILS Findings exist in PostgreSQL. LNV never receives them. Session record shows complete for MTM but lnv\_notified stays false. No visible failure — Findings exist but are stranded. Guard: lnv\_notified is written only after LNV notification step confirms. Session status is written only after lnv\_notified is true. A session where lnv\_notified is false and mtm\_session\_ref is written is an incomplete run — NexusRoutine.init() checks for this state on app load and surfaces recovery.

3. RETRY FIRED BEFORE FAILURE\_TYPE IS WRITTEN Retry fires on an incomplete failure record. The new run creates a session that references unresolved state. Guard: retry\_available is only set to true after failure\_type is written and lnv\_notified is true. The retry prompt does not surface in LNV until the failure notification payload has been fully written.

4. SESSION RECORD STATUS NOT UPDATED AFTER COMPLETION Session remains in\_progress indefinitely. The in\_progress guard blocks all future Routine runs. Archive cannot close a session. Guard: session status is always written as the final step of NexusRoutine.run(). If the run throws before reaching the status write, NexusRoutine.init() detects the stale in\_progress record on next app load and resolves it.

5. FAILED SESSION RECORD OVERWRITTEN ON RETRY The ledger no longer reflects what actually happened in the failed run. Provenance gap. Guard: retry always creates a new routine\_session record. The failed record is read-only after status is written. No update path exists for completed or failed records.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FILES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

backend/services/dnr.py
DNR service — two-step sequence execution, in\_progress guard, session record management, MTM endpoint trigger, LNV failure notification, retry logic, stale in\_progress recovery on init. Status: PLANNED

backend/routes/dnr.py
FastAPI DNR endpoints — session close trigger, retry trigger, session status query. Status: PLANNED

frontend/ (DNR components)
Svelte — Close Session button in global dropdown, Retry Session Close dropdown item, status indicators. Status: PLANNED

