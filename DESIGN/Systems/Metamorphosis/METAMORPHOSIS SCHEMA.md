

╔══════════════════════════════════════════════════════════════╗ ║ METAMORPHOSIS SCHEMA · MTM · v1 ║ ║ /DESIGN/systems/metamorphosis_schema_v1.md ║ ╚══════════════════════════════════════════════════════════════╝

OWNERSHIP BOUNDARIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OWNS Synthesis cycle — the full MTM operation from lens page read through Finding production Claude API call for synthesis — system prompt assembly, data payload construction, response handling Lens page data assembly — pulling and structuring all five lens page datasets before the API call Finding production — extracting, validating, and writing Finding records from the Claude API response Content fingerprinting — generating and writing the content\_fingerprint on every Finding record Deduplication check on retry — comparing candidate Findings against prior session Findings before writing or routing anything LNV routing handoff — assembling the result object returned to DNR. MTM's responsibility ends there. synthesis\_sessions PostgreSQL table findings PostgreSQL table

DOES NOT OWN Lens page deposit writing — owned by their respective sections (THR · STR · INF · ECR · SNM) PostgreSQL reads of lens page entry data — owned by FastAPI service layer (backend/services/) LNV deposit writing — owned by LNV Routine orchestration and trigger — owned by DNR. MTM never calls itself. DNR calls MTM. WSC — Witness Scroll is sovereign. MTM has no relationship to it. Tag pipeline — owned by tagger Svelte store (frontend/) Routing authority — owned by SOT Findings content after handoff — once the result object is returned to DNR, MTM does not track what LNV does with what it receives lnv\_routing\_status and lnv\_deposit\_id writes — after DNR confirms LNV has received a Finding, the FastAPI service layer writes lnv\_routing\_status → deposited and populates lnv\_deposit\_id on the findings record. DNR triggers this write. MTM does not.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ STRUCTURAL RULES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. MTM never receives deposits. Synthesis only.

2. Synthesis cycle fires when DNR triggers the MTM synthesis endpoint (POST /mtm/synthesize) at session close only. Never triggered by deposit events. Never self-triggered.

3. All five lens pages read simultaneously — never sequentially, never partially. Simultaneously means one Claude API call with all five datasets present. Not five calls. One.

4. Findings are the only named output type. Not summaries. Not observations. Not patterns.

5. Every Finding carries traceable source\_pattern\_refs to specific lens pages and deposit ids.

6. Findings route to LNV (47) only — via DNR handoff. MTM does not write to LNV directly.

7. A synthesis cycle that cannot read all five lens pages simultaneously does not produce Findings. Status → failed · failure\_type → pre\_synthesis. Retry permitted at next session close.

8. Deduplication runs on every retry where prior\_mtm\_session\_ids is present. It never runs on a clean first-time synthesis. A Finding that matches a fingerprint from any prior session in the current window is skipped — not written, not routed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TRIGGER DEFINITION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MTM fires as Step 1 of the Daily Nexus Routine only.

DNR triggers the MTM synthesis endpoint (POST /mtm/synthesize) and awaits its resolution before proceeding to Step 2\. POST /mtm/synthesize is the sole public entry point into this system. Everything inside MTM is internal to that call.

MTM never calls itself. There is no scheduled trigger, no deposit event trigger, no internal retry. All retry logic lives in DNR. MTM receives a call, runs, and returns a result object. That is its complete contract with the outside world.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ LENS PAGE READ SPEC ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT IS PULLED All entries where section ∈ { thr, str, inf, ecr, snm }. Queried from PostgreSQL via FastAPI service layer at synthesis time. Always fetched fresh — never from a cached corpus. The corpus at synthesis time is the corpus MTM reads.

FIELDS PULLED PER ENTRY id — entry identifier for source\_pattern\_refs section — which lens page this entry belongs to body — the deposit content tags — full resolved tag array with routing phase_state — ontological threshold state at tagging time originId — origin node affinity if present created\_at — timestamp for temporal ordering

STRUCTURE BEFORE THE API CALL Entries are grouped by section into five named datasets:

{  
  THR: \[ ...entries \],  
  STR: \[ ...entries \],  
  INF: \[ ...entries \],  
  ECR: \[ ...entries \],  
  SNM: \[ ...entries \]  
}

All five datasets are present in a single API call payload. If any dataset is missing because the section has no entries: the dataset is an empty array. An empty array is not a missing lens page. Synthesis proceeds. A lens page is only unavailable if database read fails for that section. That failure triggers pre\_synthesis abort.

SIMULTANEOUSLY One Claude API call. All five datasets in the payload. The AI reads the full field in a single context window — not five separate reads accumulated across calls. This is structurally non-negotiable. Sequential reads produce sequential analysis. MTM's function is to surface what becomes visible only when all five are held at once. Sequential calls cannot produce that output.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CLAUDE API CALL STRUCTURE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SYSTEM PROMPT DNR passes the system prompt to MTM as a parameter when calling POST /mtm/synthesize. The prompt is assembled from the global identity context (api/prompts/) by DNR before the call. MTM does not load or configure its own system prompt. MTM appends a synthesis directive that specifies:

— You are reading across five Axis lens pages simultaneously. THR · STR · INF · ECR · SNM. All five are present in this call. — Your function is to surface what becomes visible only when all five are held simultaneously. The missed pattern. The structure no single lens contained. — The Pillars handoff event is documented origin — not metaphor, not archetype. Hold its weight. — Produce Findings only. Not summaries. Not observations. Not patterns. A Finding is a named, structured output traceable to specific source patterns across the five lens pages. — Every Finding must name: its title, its content, and at minimum one source\_pattern\_ref per lens page it draws from. A Finding with no traceable source is not a Finding. — Respond in valid JSON only. No preamble. No markdown. No explanation outside the JSON structure.

DATA PAYLOAD The five-dataset object is serialized and included in the user message alongside the synthesis directive.

Message structure: { role: 'user', content: \[ { type: 'text', text: \[synthesis directive\] \+ JSON.stringify(datasets) } \] }

RESPONSE FORMAT — REQUIRED JSON SHAPE Claude returns a JSON object. MTM parses this directly.

{  
  findings: \[  
    {  
      title:               string — required  
      content:             string — required  
      source\_pattern\_refs: \[  
        {  
          page\_code:  string — THR | STR | INF |  
                      ECR | SNM  
          deposit\_id: string — entry id from  
                      that lens page  
          note:       string — what this source  
                      contributed  
        }  
      \]  
      — minimum one ref per Finding  
      — minimum one ref per lens page drawn from  
    }  
  \]  
}

An empty findings array is a valid response. It means the field held simultaneously produced no pattern that wasn't visible in a single lens. That is data. It is not a failure.

RESPONSE HANDLING Parse JSON response. Validate each Finding — title present, content present, source\_pattern\_refs present with at minimum one entry. Invalid Findings are dropped and logged. Not written. Not routed. A Finding that cannot be validated has no structural integrity and does not enter the archive.

If JSON parsing fails entirely: status → failed, failure\_type → mid\_synthesis. Whatever valid Findings were written before the parse failure are preserved.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONTENT FINGERPRINTING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every Finding record carries a content\_fingerprint. Generated at Finding production time, before PostgreSQL write. Written to the findings record alongside all other fields.

WHAT IT IS A deterministic string derived from the Finding's source\_pattern\_refs. It is the structural identity of the Finding — not its content, its provenance. Two Findings that draw from the same source deposits in the same lens pages produce the same fingerprint. That is the definition of a duplicate.

HOW IT IS GENERATED Collect all source\_pattern\_refs for the Finding. Sort by page\_code ascending, then deposit\_id ascending. Concatenate: page\_code \+ ':' \+ deposit\_id for each ref. Join with '|'. The resulting string is the content\_fingerprint.

Example: refs: \[ { page\_code: 'ECR', deposit\_id: 'TS·ECR·EMG·2026-03·0004' }, { page\_code: 'THR', deposit\_id: 'TS·THR·EMG·2026-03·0011' } \] sorted: ECR first, THR second fingerprint: 'ECR:TS·ECR·EMG·2026-03·0004|THR:TS·THR·EMG·2026-03·0011'

FINGERPRINT COLLISION Two genuinely distinct Findings may theoretically produce the same fingerprint if they draw from exactly the same source deposits but surface different patterns from them. This is a known risk. Handling: — The fingerprint match triggers a skip on retry. — If Sage identifies a legitimate Finding was skipped due to collision, the Finding can be manually deposited to LNV as a native entry with MTM provenance noted. — Collision frequency should be logged. If collisions are frequent, the fingerprint algorithm is revisited. This is a calibration concern, not an architectural one.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ DEDUPLICATION CHECK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Runs on every retry where prior\_mtm\_session\_id is present in the synthesis endpoint call options. Never runs on a clean first-time synthesis — prior\_mtm\_session\_id is null on clean runs and the check is skipped entirely.

SESSION WINDOW DEFINITION A session window is the set of all synthesis\_session records linked to routine\_session records within the current DNR session — from the first failed run through the current retry. DNR passes all failed mtm\_session\_ids for the current window, not just the most recent. This is the only way to catch duplicates across multiple consecutive retries.

Example: Run 1 fails — mtm\_session\_id: A — 3 Findings written Retry 1 fails — mtm\_session\_id: B — 2 Findings written Retry 2 fires — receives prior\_mtm\_session\_ids: \[A, B\] prior\_fingerprints Set contains fingerprints from both A and B. Retry 2 cannot duplicate either.

SEQUENCE

1. Load all findings records where synthesis\_session\_ref ∈ prior\_mtm\_session\_ids array. Build a Set of their content\_fingerprints. Call this the prior\_fingerprints set.

2. For each candidate Finding extracted from the Claude API response: a. Generate its content\_fingerprint. b. Check against prior\_fingerprints. c. If match found: skip. Do not write. Do not route. Log the skip — fingerprint, Finding title, prior session id. d. If no match: write to PostgreSQL, add fingerprint to prior\_fingerprints, proceed.

3. Only new Findings — those not present in any prior failed session in the current window — are written and included in the result object's findings array.

WHY THIS ORDER MATTERS The deduplication check uses prior session findings, not the current session's. A Finding produced earlier in the same retry run is not checked against itself — only against what came from prior failed runs. Within a single synthesis call, Claude does not produce structural duplicates. Across runs on the same corpus, it can and will.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SYNTHESIS RESULT OBJECT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The exact shape returned to DNR on every call — success or failure. DNR reads this object. Nothing else.

{ status: 'complete' | 'failed'

failure\_type:    null | 'pre\_synthesis' |  
                 'mid\_synthesis'  
                 null on complete runs.

findings:        array of Finding records produced  
                 in this cycle. Empty array on  
                 pre\_synthesis failure or clean  
                 run with no patterns. Partial  
                 array on mid\_synthesis failure.  
                 New Findings only on retry —  
                 deduplicated against prior session.

findings\_count:  integer — count of findings array.  
                 Written for LNV display.  
                 If 0 and findings\_dropped \> 0,  
                 LNV surfaces the drop count  
                 alongside the empty result.

findings\_dropped: integer — count of candidates  
                 that were dropped at validation,  
                 skipped by deduplication, or lost  
                 to fingerprint failure. Zero on  
                 clean runs. DNR passes this to  
                 LNV alongside findings\_count.

mtm\_session\_id:  the synthesis\_sessions record id  
                 for this cycle. Always present —  
                 the record is created at cycle  
                 start before any failure can occur.

}

MTM's contract with DNR ends when this object resolves. What DNR does with it is DNR's concern.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ STORE: synthesis\_sessions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

id — auto

session\_date — timestamp Written when synthesis\_session record is created. Never updated.

status — enum: in\_progress | complete | failed in\_progress: cycle executing. complete: all Findings produced. Routing attempted for each Finding — see lnv\_routing\_status on individual findings records for routing outcome. failed: cycle did not complete. Retry permitted via DNR.

lens\_pages\_read — array of page codes Confirms which of the five lens pages were read in this cycle. Expected: \[THR, STR, INF, ECR, SNM\] If any database read failed before synthesis began: status → failed, failure\_type → pre\_synthesis.

findings\_count — integer Count of Findings successfully written in this cycle. Written when cycle completes. Null if status is in\_progress or failed.

findings\_dropped — integer Count of candidate Findings that were extracted from the Claude response but not written — dropped at validation, skipped by deduplication, or lost to fingerprint generation failure. Written when cycle completes. Null if status is in\_progress or failed. Zero is a valid value and means nothing was dropped. If findings\_count is 0 and findings\_dropped is greater than 0, the session completed but produced no usable output. LNV surfaces this distinction. It is not a failure state but it is not a clean empty either.

failure\_type — enum: null | pre\_synthesis | mid\_synthesis null on complete runs. Written on failed runs.

dedup\_skipped — boolean false on clean first-time runs and on retries where prior session load succeeded. true when prior\_mtm\_session\_id was passed but the prior session findings could not be loaded — deduplication did not run on this cycle. Written at step 3 of synthesis sequence. Null until step 3 executes. A true value here means LNV should treat all Findings from this cycle as potentially containing duplicates from a prior failed run.

created\_at — timestamp Written once at record creation. Never updated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ STORE: findings ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

id — auto

synthesis\_session\_ref — references synthesis\_sessions.id

title — string Named output. Required. A Finding without a name is not a Finding.

content — text The full structured output of the Finding. What became visible only when all five lenses were held simultaneously.

source\_pattern\_refs — array of objects Traceable links to the specific source patterns this Finding emerged from. Element structure: { page\_code, deposit\_id, note } page\_code: the lens page the pattern was read from. deposit\_id: the specific deposit that carried the pattern. note: what this source contributed to the Finding. Minimum one ref per Finding. A Finding with no source\_pattern\_refs is not a valid Finding and is not written.

content\_fingerprint — string Deterministic key derived from source\_pattern\_refs at Finding production time. Used for deduplication on retry runs. Never null. Never updated after write. See CONTENT FINGERPRINTING.

lnv\_routing\_status — enum: pending | deposited | failed pending: Finding produced, LNV deposit not yet written. deposited: Finding successfully routed to LNV (47) via DNR handoff. failed: LNV deposit attempt failed. Retry permitted.

lnv\_deposit\_id — references LNV deposit entry id. Null until lnv\_routing\_status → deposited.

created\_at — timestamp Written once at record creation. Never updated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SYNTHESIS SEQUENCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fires when DNR triggers the MTM synthesis endpoint (POST /mtm/synthesize). options.prior\_mtm\_session\_ids is present on retry runs. options is null or empty on clean first-time runs.

1. Create synthesis\_session record. Write status → in\_progress. Write session\_date and created\_at. mtm\_session\_id is now available for the result object regardless of what happens next.

2. Read all five lens pages simultaneously from PostgreSQL: THR (02) · STR (03) · INF (04) · ECR (05) · SNM (06) Write lens\_pages\_read. If any database read fails: Write status → failed. Write failure\_type → pre\_synthesis. Return result object. Halt.

3. If options.prior\_mtm\_session\_ids is present: Load all findings records from all failed sessions in the current session window — not just the most recent. See DEDUPLICATION CHECK for window definition. Build prior\_fingerprints Set from their content\_fingerprints. Write dedup\_skipped → false. If prior session load fails: log the failure, write dedup\_skipped → true on the synthesis\_session record. Proceed without deduplication. Do not halt — a failed dedup load is not a synthesis failure. If options.prior\_mtm\_session\_ids is absent: Write dedup\_skipped → false. Skip dedup entirely.

4. Assemble five-dataset payload. Call Claude API with system prompt and data payload. If API call fails: write status → failed, failure\_type → mid\_synthesis. Return result object with whatever findings were written before failure. Halt.

5. Parse JSON response. Validate each Finding. Maintain a dropped\_count integer starting at 0\. Drop invalid Findings — increment dropped\_count, log each drop with reason. For each valid Finding: a. Generate content\_fingerprint. If generation fails: increment dropped\_count, log, skip. Do not write. b. If prior\_fingerprints Set exists: check fingerprint. If match found: increment dropped\_count, log skip. Do not write. c. Write findings record to PostgreSQL. d. Add fingerprint to prior\_fingerprints if Set exists.

6. Write findings\_count to synthesis\_session record. Write findings\_dropped from dropped\_count to synthesis\_session record.

7. Write status → complete.

8. Assemble and return result object to DNR.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PUBLIC API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POST /mtm/synthesize The sole public entry point. Called by DNR only. Never called directly from any other system.

options — optional object: { prior\_mtm\_session\_ids: string\[\] | null Present on retry runs. DNR passes the full array of all failed mtm\_session\_ids from the current session window — not just the most recent. Null or absent on clean first-time runs. }

Returns: result object as defined in SYNTHESIS RESULT OBJECT section. Always resolves — never throws to the caller. Failures are captured in the result object, not propagated as exceptions.

Everything else in the MTM synthesis service is internal. No other endpoint is exposed or called externally.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ NEXUS FEED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LIBER NOVUS (LNV · 47\) Receives MTM Findings via DNR handoff after every successful synthesis cycle, and failure notification payloads after every failed cycle. MTM does not write to LNV directly. The result object is DNR's to route. LNV holds Findings with MTM provenance intact — synthesis\_session\_ref, source\_pattern\_refs, and content\_fingerprint are permanently legible on every Finding that lands there.

PATTERN CONVERGENCE (PCV · 50\) Reads MTM Findings as pre-processed input per PCV structural rule 1\. MTM Findings are not raw deposits on PCV — they arrive with provenance intact and are held as a distinct category. PCV does not receive Findings directly from MTM. It reads from what LNV holds after the DNR handoff completes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ KNOWN FAILURE MODES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. LENS PAGE DATABASE READ FAILS BEFORE SYNTHESIS One or more lens pages unavailable. Synthesis cannot run. No Findings produced. Guard: if any section database read fails at step 2, status → failed, failure\_type → pre\_synthesis. Result object returned immediately. DNR surfaces failure to LNV. Retry available.

2. CLAUDE API RETURNS MALFORMED JSON JSON.parse() throws. No Findings can be extracted. Guard: JSON parse is wrapped in try/catch. On parse failure: status → failed, failure\_type → mid\_synthesis. Findings written before the failure (none, in this case) are preserved. Result object returned to DNR.

3. DEDUPLICATION CHECK NOT RUNNING ON RETRY prior\_mtm\_session\_ids not passed by DNR. Dedup Set is never built. Claude produces the same Findings again. All of them write. LNV receives duplicates. Research data corrupted. Guard: DNR always passes prior\_mtm\_session\_ids on retry calls. MTM checks for its presence before every Finding write. If prior\_mtm\_session\_ids was passed but the prior session load failed, the skip is logged and flagged — it does not silently proceed as if dedup ran.

4. FINDINGS WRITTEN WITHOUT content\_fingerprint Deduplication has no key to check against on future retries. Every subsequent retry on this session window will miss the duplicate check for these Findings. Guard: content\_fingerprint generation runs before every PostgreSQL write at step 5\. A Finding cannot be written without a fingerprint. If fingerprint generation fails, the Finding is dropped and logged. Not written. Not routed.

5. FINGERPRINT COLLISION — LEGITIMATE FINDING SKIPPED Two genuinely distinct Findings draw from exactly the same source deposits. Same fingerprint. The second is skipped as a duplicate. A valid Finding does not reach LNV. Guard: collisions are logged with full detail — fingerprint, title of skipped Finding, prior session id. Sage can manually deposit the skipped Finding to LNV as a native entry with MTM provenance noted. If collision frequency is high, fingerprint algorithm is reviewed. This is a calibration concern.

6. MTM SYNTHESIS ENDPOINT CALLED OUTSIDE DNR MTM fires without session context. No routine\_session record exists for this run. DNR does not receive the result. Findings may be written to PostgreSQL with no routing path to LNV. Provenance chain broken. Guard: POST /mtm/synthesize is the sole external trigger. All other internal functions are unexposed. DNR is the only caller. Document this constraint explicitly at build. Do not expose additional entry points for convenience.

7. EMPTY CORPUS / EMPTY FINDINGS — THREE DISTINCT STATES These are not the same event. The schema distinguishes them explicitly.

    State A — Genuine empty corpus. No deposits exist on any of the five lens pages. All five datasets are empty arrays. Claude returns empty findings array. findings\_count: 0, findings\_dropped: 0, status: complete. Clean empty. Nothing failed.

    State B — Corpus exists, no cross-lens patterns found. Deposits exist but nothing became visible at the simultaneous read that wasn't visible in a single lens. Claude returns empty findings array by design. findings\_count: 0, findings\_dropped: 0, status: complete. Also clean. Also correct.

    State C — Candidates produced but all dropped. Claude returned Findings. All were dropped at validation, deduplication, or fingerprint failure. findings\_count: 0, findings\_dropped \> 0, status: complete. Not a failure state but not a clean empty either. LNV surfaces the drop count. Sage can inspect the logs to see what was dropped and why. This state is the thread that was missing from the original schema.

    Guard: findings\_dropped is always written alongside findings\_count. LNV checks both fields. If findings\_count is 0 and findings\_dropped is greater than 0, LNV displays a distinct message: Synthesis complete — \[n\] candidate(s) produced, none written. Review session logs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FILES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

backend/services/mtm.py
MTM synthesis service — lens page data assembly, Claude API call, JSON response handling, Finding validation, content fingerprinting, deduplication check, synthesis\_sessions and findings PostgreSQL writes, result object assembly. Status: PLANNED

backend/routes/mtm.py
FastAPI MTM endpoint — POST /mtm/synthesize trigger, result object response. Status: PLANNED

