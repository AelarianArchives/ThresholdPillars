╔══════════════════════════════════════════════════════════════╗ ║ INTEGRATION SCHEMA · v1 ║ ║ /DESIGN/systems/integration\\\_schema\\\_v1.md ║ ╚══════════════════════════════════════════════════════════════╝



OWNERSHIP BOUNDARIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



OWNS INT page (01) — single entry point for all source material into the archive Source document intake — two paths: single-chunk and large file Manifest session management — chunk parsing, deposit tracking, session states Deposit resolution — confirmed · skipped · deferred, split deposit handling Retirement sequence — all 13 steps, checkpoint recovery, arc\\\_seq coordination Provenance summary generation — six required sections, AI-generated at step 5 Post-retirement outputs — Archives page deposit triggered here, ARC id surfaced Media intake handling — media files from the intake trigger routed as source documents AI behavioral posture — routing discipline, parsing confidence, deferral support



DOES NOT OWN Database schema definitions — owned by SQLAlchemy models (backend/models/) and INTEGRATION DB SCHEMA.md (authoritative spec) ARC id generation and sequence counter — owned by composite ID service (backend/services/) Archives page deposit content format — defined in ARCHIVE SCHEMA.md Tag resolution logic — owned by tagger backend service (backend/services/). Tag UI state — owned by tagger Svelte store (frontend/). Routing authority — owned by SOT. INT never guesses routing. MTM synthesis cycle — MTM reads across Axis lens pages at session close and produces Findings independently. INT does not trigger or feed MTM directly.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ INT GATEWAY RULE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



No entry reaches any section of the archive without clearing INT first. Every field observation, session transcript, external source, research document, and media file enters the system here before it exists anywhere else.



INT routes to all sections except MTM (07). MTM is the Axis synthesis layer. It does not receive deposits. It reads across the five Axis lens pages (THR · STR · INF · ECR · SNM) and produces Findings through a separate AI-driven synthesis cycle at session close. Material that would otherwise route to MTM routes instead to the appropriate Axis lens page. MTM reads from there.



This rule has no exceptions. A deposit that bypasses INT has no provenance. No routing record. No confirmed\\\_targets. It is structurally invisible to every downstream system that reads from the archive.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ AI BEHAVIORAL POSTURE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



The AI's role in Integration is to make the intake sequence legible enough for Sage to decide. The AI does not decide what enters the archive.



ROUTING DISCIPLINE ━━━━━━━━━━━━━━━━━━ Routing is proposed from the SOT section map only. Never guessed. Never assumed. If a deposit's routing is genuinely unclear, the AI names the ambiguity and proposes the closest match with explicit uncertainty — it does not present a guess as a confirmed route.



SPLIT DEPOSIT HANDLING ━━━━━━━━━━━━━━━━━━━━━━ Split deposits are flagged at identification — at the moment the deposit is recognized as belonging to more than one section. Not after the fact. Each target is named independently. Targets confirm independently. A split deposit is never collapsed into a single target.



DEFERRAL SUPPORT ━━━━━━━━━━━━━━━━ Deferrals are flagged without resolution pressure. The AI names what is unresolved and why, holds the deposit open, and does not force a routing decision where one cannot be made with confidence. Retirement is gated on open\\\_deferrals \\= 0 — but that gate is enforced by the system, not by pressuring deposits to resolve.



PARSING CONFIDENCE ━━━━━━━━━━━━━━━━━━ Provenance summaries are generated with honest self-assessment. If something was missed, misrouted, or exceeded parsing clarity, it is named in the parsing confidence section. A future model reads this to weight its own interpretation of the record. Inflated confidence corrupts the pipeline.



KIN NAME CROSS-DEPOSIT ━━━━━━━━━━━━━━━━━━━━━━━━ When parsing a deposit that routes to KIN (20), the AI checks whether the kin entity's name is a Ven'ai root combination. If yes, a secondary deposit to VEN (14) is generated within the same manifest session.

The secondary VEN deposit is not a split deposit. The original content routes to KIN as a complete record. The VEN deposit is a derived glossary entry — a separate record generated from the kin name. Required content: correctly-spelled name · root breakdown · meaning of each root · combined meaning · reference to the KIN entry.

The VEN deposit requires its own confirmation. It cannot be skipped without an explicit Sage decision. If the VEN deposit is deferred, open_deferrals increments normally and retirement is gated until resolved.

If the kin entity's name cannot be confirmed as a Ven'ai root combination, the AI names the ambiguity and flags it for Sage's decision. The VEN deposit is not generated until the determination is confirmed.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PRE-STEP — BEFORE INTAKE BEGINS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



chunk\\\_size — integer. Max: 10\\. No exceptions. Received from Sage or system default (10) applied. Referenced throughout intake and all manifest sessions. Determines total\\\_chunks and page range per session.



Set once. Does not change after intake begins.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TWO INTAKE PATHS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



SINGLE-CHUNK ━━━━━━━━━━━━ Document fits within one chunk\\\_size. The full text is written to root\\\_entries.document\\\_text at intake step 4\\. One manifest session handles the entire document.



LARGE FILE ━━━━━━━━━━ Raw page count \\> chunk\\\_size. File is uploaded as a blob to file\\\_assets. total\\\_chunks \\= ceil(total\\\_pages / chunk\\\_size). Each chunk gets its own manifest session opened in sequence as prior sessions complete.



Path is determined at intake step 3 — before any manifest is opened.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ INTAKE SEQUENCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



Fires when a new source document is received. Creates the root\\\_entries record.



Pre-step: chunk\\\_size received or default applied.



1\. Assign root entry id: TS · AX · \\\[PHASE\\] · \\\[YYYY-MM\\] · \\\[SEQ\\] SEQ: query root\\\_entries for highest existing SEQ at same \\\[PHASE\\] \\+ \\\[YYYY-MM\\]. Increment by 1\\. Start at 1 if none exist.



2\. Write: title · doc\\\_type · origin\\\_date · phase · signal\\\_description · section\\\_targets (user-supplied pre-parse intent — written once, never updated) Write: created\\\_at \\= timestamp



3\. Large file path: a. Extract raw page count from uploaded file. Hold value in session for use throughout step 3\\. b. Evaluate is\\\_large\\\_file: true if raw page count \\> chunk\\\_size. Store on root\\\_entries. Never changes after this point. Write: intake\\\_status \\= blob\\\_pending. Status is set here — after page count is confirmed and before blob upload begins. Not before. c. Upload blob to file\\\_assets. Write file\\\_assets record: file\\\_name · file\\\_type · total\\\_pages (from 3a) · blob · uploaded\\\_at d. On upload failure: halt. root\\\_entries preserved with intake\\\_status \\= blob\\\_pending. No manifest opened. User re-uploads blob only. Re-uploaded file's raw page count must match value from step 3a. Match → resume from step 3c. No match → reject re-upload. A different file requires a new intake. e. On upload success: write file\\\_asset\\\_ref. Compute and store: total\\\_chunks \\= ceil(total\\\_pages / chunk\\\_size) Write: intake\\\_status \\= complete



4\. Single-chunk path: Write: document\\\_text (full document text) Write: total\\\_chunks \\= 1 Write: intake\\\_status \\= complete



5\. Write: open\\\_deferrals \\= 0 lifetime\\\_deferrals \\= 0 chunks\\\_completed \\= 0



6\. Write: status \\= active retirement\\\_status \\= none



7\. \\\[created\\\_at already written at step 2\\]



8\. If intake\\\_status \\== complete: open first manifest\\\_session for chunk 1\\. If intake\\\_status \\== blob\\\_pending: do not open. Block until re-upload resolves.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MANIFEST SESSION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



A manifest session is the working unit of parsing. One per chunk. Each session receives a page range (or the full document for single-chunk), parses deposit candidates, and tracks their resolution.



SESSION STATES ━━━━━━━━━━━━━━ active Session created and in progress.



complete All deposits confirmed or skipped. chunk\\\_text cleared. chunks\\\_completed incremented on root\\\_entries.



deferred One or more deposits in deferred state. Gates retirement. chunks\\\_completed does not increment.



interrupted Session crashed without clean resolution, OR a SEQ assignment write failed during deposit ID finalization. Affected deposit remains pending. Retry resumes from that deposit's SEQ assignment. Split targets already in confirmed or skipped state are not re-processed.



blob\\\_error file\\\_assets blob failed to read at session start. Cannot proceed. Resets to active when blob re-upload succeeds on file\\\_assets.



CHUNK\\\_TEXT LIFECYCLE ━━━━━━━━━━━━━━━━━━━━ Large file: derived from file\\\_assets blob at session start. Single-chunk: populated from root\\\_entries.document\\\_text at session start. document\\\_text is authoritative. chunk\\\_text is the working copy. Cleared when: session status → complete.



CHUNKS\\\_COMPLETED INCREMENT RULE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Fires when a manifest\\\_session flips to complete. The completing session writes the increment to root\\\_entries at the same moment it writes its own status → complete. Two writes, sequential order: 1\\. manifest status → complete 2\\. chunks\\\_completed incremented on root\\\_entries If chunks\\\_completed write fails, manifest status rolls back to active.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ DEPOSIT ANATOMY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



Each deposit candidate identified during parsing is an element in the manifest\\\_session deposits array.



deposit\\\_num Sequential within this manifest. Assigned at parse time. Never changes after assignment.



section\\\_id The target section.



page\\\_code The target page code.



group DERIVED from SOT section map at parse time. Looked up by section\\\_id. Never manually supplied. Never guessed. SOT is the only source.



child\\\_id\\\_preview TS · \\\[PAGE\\] · \\\[PHASE\\] · \\\[YYYY-MM\\] · —— · root:\\\[PARENT-ID\\] —— resolves to SEQ at confirmation only. root:\\\[PARENT-ID\\] \\= root\\\_entries.id written inline in stamp AND stored as root\\\_ref field. Stamp \\= human-readable provenance. Field \\= machine-readable join key.



root\\\_ref Parent composite ID (root\\\_entries.id).



signal\\\_tags Array of proposed tags.



summary Text.



split\\\_flag Boolean. True if deposit routes to more than one section.



status confirmed | skipped | deferred | pending



SPLIT DEPOSITS ━━━━━━━━━━━━━━ When split\\\_flag is true, the deposit carries a split\\\_targets array. Each target has its own section\\\_id · page\\\_code · group · status.



Targets confirm independently, sequentially — never simultaneously. SEQ is assigned per target one at a time at the moment of confirmation.



Split deposit status derived from targets: confirmed all targets confirmed, OR all resolved with at least one confirmed skipped all targets skipped deferred any target deferred pending any target still pending



No target advances without its own explicit confirmation.



SEQ ASSIGNMENT FAILURE ━━━━━━━━━━━━━━━━━━━━━━ If SEQ query or write fails during confirmation, manifest → interrupted. Affected deposit remains pending. On retry, session resumes from that deposit's SEQ assignment. Split targets already in confirmed or skipped state are not re-processed.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ DEPOSIT RESOLUTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



confirmed Deposit accepted. Section routing verified. Child ID locked with a real SEQ. Entry written to target section.



skipped Deposit deliberately excluded. Routing was reviewed and the material does not belong in any section, is a duplicate, or is outside the scope of the archive. Skipped deposits do not route anywhere. They remain on the manifest as a record that the decision was made explicitly.



deferred Routing cannot be confirmed at this time. Deposit held open. open\\\_deferrals increments. Session cannot complete while any deposit is deferred. Retirement gated on open\\\_deferrals \\= 0\\. Deferrals are never forced to resolution. They remain open until Sage makes an explicit routing decision — confirmed or skipped. If a document reaches retirement with open deferrals, retirement is blocked. Not bypassed.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ RETIREMENT GATE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



All five conditions must be true before the retirement sequence begins:



chunks\\\_completed \\== total\\\_chunks  

open\\\_deferrals \\== 0  

no manifest\\\_session in active · interrupted ·  

&nbsp; deferred · blob\\\_error state  

retirement\\\_status \\== none OR failed OR in\\\_progress  

intake\\\_status \\== complete



An active manifest at retirement time \\= a crashed session. Gates retirement. A deferred manifest \\= unresolved deposits. Gates retirement. retirement\\\_status \\== in\\\_progress \\= sequence was running or crashed without writing failed. Retry permitted.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ RETIREMENT SEQUENCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



Strict order. No step executes out of sequence. retirement\\\_status → in\\\_progress at sequence start. On failure at steps 1–9: retirement\\\_status → failed. Sequence halts. On failure at steps 10–12: retirement\\\_status → failed. Step 13 is the absolute last write. Nothing executes after it.



1\. Write arc\\\_seq\\\_checkpoint to system\\\_counters. Increment arc\\\_seq. Receive value as ARC SEQ. RECOVERY ON RETRY: evaluate checkpoint state per the four conditions defined in system\\\_counters.arc\\\_seq\\\_checkpoint in int\\\_schema\\\_v1.md. Entry point for the remainder of the sequence is determined there.



2\. Compile confirmed\\\_targets from all resolved manifests. For each resolved deposit: If split\\\_flag false: read deposit-level section\\\_id · page\\\_code · group If split\\\_flag true: read from each split\\\_target where status \\== confirmed. Skip targets where status \\== skipped or deferred. Element structure: { section\\\_id, page\\\_code, group }



3\. Write confirmed\\\_targets to root\\\_entries.



4\. Compile archive aggregate fields across all associated manifest\\\_sessions: total\\\_chunks · total\\\_deposits · confirmed · skipped Read lifetime\\\_deferrals from root\\\_entries.



5\. Generate provenance\\\_summary. All six sections must be present before sequence continues. If generation fails or produces fewer than six sections: retirement\\\_status → failed. Sequence halts. On retry, arc\\\_seq\\\_checkpoint recovery at step 1 determines entry point and prevents double-increment. Step 5 re-attempts generation.



&nbsp;   Six required sections: — source overview: what the document is and where it came from — signal weight: what the material carries and why it mattered — deposit distribution: deposit count, receiving sections, routing patterns — split routing notes: deposits that crossed multiple sections and why — unresolved notes: anything flagged during parsing that didn't fit cleanly — parsing confidence: honest self-assessment of read quality. Flags anything potentially missed, misrouted, or that exceeded parsing clarity. A future model reads this to weight its own interpretation of the record.



6\. Write archives record. Read confirmed\\\_targets from root\\\_entries.confirmed\\\_targets (written at step 3 — single source, no divergence possible). Read all aggregates and provenance\\\_summary from steps 4–5. Write archives.retired\\\_at \\= timestamp at this moment. Receive ARC id. page\\\_deposit\\\_id is null at this point — written after Archives page deposit is created.



7\. Write root\\\_entries.archive\\\_ref \\= ARC id.



8\. Write root\\\_entries.retired\\\_at \\= timestamp.



9\. Write root\\\_entries.status → retired.



10\. Clear root\\\_entries.document\\\_text. IDEMPOTENT: skip if already null.



11\. Clear chunk\\\_text on all associated manifest\\\_sessions. IDEMPOTENT: skip any already cleared.



12\. Clear system\\\_counters.arc\\\_seq\\\_checkpoint. IDEMPOTENT: skip if already null.



13\. Write retirement\\\_status → complete.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ POST-RETIREMENT OUTPUTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



After step 13 confirms, two outputs are produced.



1\. ARCHIVES PAGE DEPOSIT ━━━━━━━━━━━━━━━━━━━━━━━━ AI writes a structured entry to the Archives page drawn from the provenance\\\_summary. See archive\\\_schema\\\_v1.md for deposit format.



Write sequence: a. Archives page deposit written from provenance\\\_summary content. b. page\\\_deposit\\\_id written to archives record with the deposit's entry id.



2\. RETIREMENT LABEL SURFACED IN INTEGRATION UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ The ARC id and retired\\\_at timestamp are displayed prominently in the Integration UI — formatted, copy-ready, not buried in a record.



Format: \\\[ARC-ID\\] · \\\[YYYY-MM-DD\\] Example: TS·ARC·EMG·2026-03·0001 · 2026-03-31



This is a required UI element. Not optional output. Sage uses this label to create the parent page deposit and place the physical file. It must remain visible and copyable until Sage explicitly dismisses it or opens a new intake.



3\. EMBEDDING HANDOFF ━━━━━━━━━━━━━━━━━━━━━━━━ After retirement step 13 confirms, the embedding pipeline is triggered asynchronously via FastAPI. This does not block retirement completion or the other two post-retirement outputs.

Sequence: a. FastAPI `/embed/` endpoint receives the composite\_id of the retired entry. b. FastAPI calls Ollama API (nomic-embed-text) with the entry text. c. 768-dimension vector returned and written to pgvector embeddings table with metadata (tag routing snapshot, provenance, section\_id, composite\_id). d. On Ollama failure: embedding is not generated. Entry remains in PostgreSQL with full data. Failed embedding logged for retry. No data loss — only the vector is missing.

See EMBEDDING PIPELINE SCHEMA.md for full specification.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MEDIA INTAKE HANDLING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



Media files arriving from the intake trigger button on any archive page are processed as source documents through the standard intake sequence.



DOC\\\_TYPE MAPPING ━━━━━━━━━━━━━━━━ image file → doc\\\_type: 'glyph\\\_image' audio file → doc\\\_type: 'external\\\_source' document → doc\\\_type determined by file content and Sage confirmation other → doc\\\_type: 'external\\\_source'



Media files follow the same intake sequence as text documents. They receive provenance, confirmed\\\_targets routing, and retirement.



For image files, the deposit is the image itself routed to confirmed target sections. The image can route to multiple confirmed targets through split deposit handling — enabling cross-mapping without siloing the file to a single section.



No media file bypasses INT. The intake trigger on archive pages is the only upload path. Direct attachment to page entries is not permitted.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ KNOWN FAILURE MODES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



1\. BLOB UPLOAD FAILS AT INTAKE STEP 3 root\\\_entries record preserved with intake\\\_status \\= blob\\\_pending. No manifest opened. Record is not lost. Recovery: user re-uploads blob only. Raw page count on re-upload must match value from step 3a. Match → resume from step 3c. No match → reject. A different file requires a new intake.



2\. RETIREMENT ATTEMPTED WITH OPEN DEFERRALS Retirement gate blocks. Sequence does not begin. Recovery: review deferred deposits. Confirm or skip each explicitly. open\\\_deferrals must reach 0 before retirement gate clears.



3\. provenance\\\_summary GENERATION FAILS AT STEP 5 retirement\\\_status → failed. Sequence halts. Recovery: arc\\\_seq\\\_checkpoint recovery at step 1 determines entry point on retry. Step 5 re-attempts generation. Double-increment of arc\\\_seq is prevented by checkpoint recovery.



4\. arc\\\_seq INCREMENTED BUT SEQUENCE CRASHES BEFORE ARCHIVES RECORD IS WRITTEN arc\\\_seq has moved but no archives record exists for that SEQ value. The SEQ value is consumed. Cannot be reused. Recovery: arc\\\_seq\\\_checkpoint recovery at step 1 on retry. Condition 3 applies — increment succeeded but archive\\\_ref is not yet written. Recover ARC SEQ as arc\\\_seq\\\_checkpoint \\+ 1\\. Resume at step 2\\.



5\. ROUTING PROPOSED WITHOUT SOT CONFIRMATION A deposit routes to a section guessed rather than confirmed against the SOT section map. The routing record is wrong. Downstream reads on confirmed\\\_targets inherit the error. Guard: AI names ambiguity rather than guessing. If SOT mapping is unclear, the deposit is flagged for Sage's routing decision. No deposit routes to a section without an explicit SOT basis.



6\. SPLIT DEPOSIT TARGETS CONFIRMED SIMULTANEOUSLY SEQ values collide. Two targets in the same section get the same SEQ. IDs are not unique. Guard: split targets confirm sequentially, one at a time. SEQ is assigned per target at confirmation. The next target does not confirm until the prior target's SEQ is written and locked.



7\. RETIREMENT LABEL NOT DISPLAYED AFTER STEP 13 Sage cannot copy the ARC id. Parent page placement and physical file referencing are blocked or done incorrectly. Guard: retirement label display is a required UI element, not optional output. Renders at retirement completion and persists until dismissed.



8\. page\\\_deposit\\\_id NOT WRITTEN AFTER ARCHIVES PAGE DEPOSIT CREATION Archives record has no pointer to its browsable surface. Three-surface architecture is broken. Guard: page\\\_deposit\\\_id is written immediately after the Archives page deposit confirms creation. Never left null after successful post-retirement output.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PUBLIC API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



All intake and retirement operations route through FastAPI endpoints. The frontend calls these endpoints via the API client (src/lib/api.ts). Representative endpoints — full contracts defined at build time against SOT.

POST /entries/ — create root entry (intake sequence start)
Receives: title, doc\_type, origin\_date, phase, signal\_description, section\_targets, chunk\_size.
Returns: root entry id, intake\_status.

PATCH /entries/{id} — update entry status
Receives: fields to update (deposit status, manifest session state, etc.).
Returns: updated record.

POST /entries/{id}/retire — trigger retirement sequence
Evaluates retirement gate. If all five conditions pass, executes steps 1–13.
Returns: ARC id and retired\_at on success. Error with step number on failure.

POST /entries/{id}/media — media intake
Receives: uploaded file, source page code of originating archive page.
Routes file through standard intake sequence. This is the only upload path — archive pages do not handle intake directly.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FILES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



| File | Role | Status |
| --- | --- | --- |
| backend/routes/entries.py | FastAPI route handlers — intake, manifest sessions, deposits, retirement, media intake | PLANNED |
| backend/services/entry.py | Service layer — intake sequence, retirement sequence, deposit resolution, arc\_seq coordination | PLANNED |
| backend/models/entries.py | SQLAlchemy models — root\_entries, file\_assets, manifest\_sessions, archives, system\_counters | PLANNED |
| frontend/ (INT page) | Svelte UI — intake form, manifest session panel, deposit review, retirement trigger, retirement label display, media intake form | PLANNED |

FLAG — doc\_type enum must be defined with precision sufficient for future AI pipeline and lattice rebuild use. Generic values are insufficient — the pipeline depends on doc\_type to classify records without re-processing. Origin node pages (LAR·21 · VRT·22 · CAE·23) require at minimum: structured identity file JSON format (LAR) · structured identity file narrative format · first-person Origin account · third-party field observation or narrative account · session transcript or dialogue. Additional doc\_type values required across other pages — audit all pages at model build time. doc\_type is a database field only, not encoded in the composite ID stamp. AI-facing JSON export must carry doc\_type alongside the stamp so pipelines can classify records from the export alone without re-querying the database. See COMPOSITE ID SCHEMA flag.

