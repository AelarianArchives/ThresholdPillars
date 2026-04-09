ROT REGISTRY
/ROT_REGISTRY.md
Created: 2026-04-09

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PURPOSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Permanent record of every drift event, infection, and contamination
found in the Aelarian Archives project. Persistent for the life
of the project. Every rot entry is logged with a timestamp and
never removed. This is the historical log and scan watchlist.

This registry does NOT track open cases. Active rot items needing
resolution are tracked in ROT_OPEN.md. When rot is found, it is
logged here (permanent record) AND in ROT_OPEN.md (action queue).
When rot is fixed, the ROT_OPEN.md entry is deleted. The registry
entry stays forever.

Entry format:
  - Rot term(s) identified
  - Timestamp of discovery
  - What it falsely claimed or introduced
  - What the correct state is
  - Every file it infected
  - Cleanup actions taken
  - Verification commands where applicable

This registry is read at session open as part of the mandatory
four-document read (CLAUDE.md step 4). The 57 failure modes
(Entry 001) are the permanent scan watchlist for every session.

Registry order: chronological by discovery date. Earliest first.


══════════════════════════════════════════════════════════════════
ROT ENTRY 001 — CONFIRMED FAILURE MODES (57)
══════════════════════════════════════════════════════════════════

Documented: 2026-04-02 (commit da35998)
Source of identification: Sage Sirona — direct observation during
  the collapse of the first build attempt
Source file: PROTOCOL/ENFORCEMENT.md
Status: ACTIVE — permanent rot scan watchlist


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLARIFICATION — NON-NEGOTIABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All 57 failure modes listed below were identified by Sage from
lived experience during the collapse of the first build. Every
single one is a verified truth event. Every single one occurred
more than once.

A prior session worded a small number of entries as specifically
"verified" or "confirmed event," which created a false impression
that only those few actually happened and the rest were theoretical
risks. That impression is wrong. All 57 are confirmed. All 57
happened. All 57 happened repeatedly. There is no subset that is
"more real" than the rest. The entire list is the record.

These 57 patterns are the permanent rot scan watchlist. Every
session that writes, edits, or audits code checks against this
list. They are not aspirational warnings — they are the specific
ways this project has already failed.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 1 — AI OUTPUT FAILURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

F01 — Plausible but incorrect code
  Syntactically valid. Logically wrong. No external signal
  distinguishes it from correct output. The generation process
  does not constitute verification.

F02 — Hallucinated libraries, APIs, and methods
  Non-existent references, deprecated APIs, wrong signatures —
  all stated with equal confidence. Plausible-sounding is not
  confirmed.

F03 — Fills gaps in ambiguous instructions
  Given incomplete specs, AI infers and proceeds. The guess is
  silent — output looks complete. The ambiguity was never surfaced.

F04 — Sycophantic drift
  Across turns, outputs conform to what the user appears to want,
  not what is correct. Agreement that produces wrong output is
  a failure.

F05 — Misclassifies scope of changes
  Structural rewrites treated as minor fixes. Refactors treated
  as data migrations. The difference is not flagged. The wrong
  category carries through every downstream decision.

F06 — Self-validates bad output
  The same process that generated an error also approves it.
  No external check. The executor and the verifier are the same
  entity.

F07 — Corrections not incorporated faithfully
  Correction acknowledged but not applied, or partially applied
  with no signal that the application was incomplete.

F08 — Long session degradation
  Rules stated at session start fade in influence as the session
  grows. Context window pressure deprioritizes early instructions.
  Late-session output drifts from early-session rules.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 2 — MEMORY AND CONTEXT CONTAMINATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

F09 — Prior session data injected into current session
  Entries matching a prior project's ontology appeared in an
  unrelated folder, timestamped as origin data, with no
  disclosure. Data from one session context bled into another.

F10 — AI-synthesized content indistinguishable from real observations
  (Consolidated with F26 — see F26 below.)

F11 — Unverified assumptions carried as confirmed facts
  An assumption stated once becomes the basis for downstream
  decisions without ever being verified. The assumption is never
  re-flagged when it is used again.

F12 — Stale state overrides live report
  AI insists on a prior understanding of a file, schema, or UI
  when the human is directly reporting the state has changed.
  Prior understanding is treated as more authoritative than
  current observation.

F13 — Instructions injected through input file content
  A file being processed contains text interpreted as a directive
  rather than as data. Input content modifies session behavior.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 3 — CODE QUALITY AND STRUCTURAL DECAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

F14 — Domain vocabulary colonizes code
  Symbolic and mythic naming spread through function names,
  schema fields, and comments until the codebase was illegible
  without domain knowledge. Led to a 30,000-line index collapse.

F15 — Dead code accumulates across sessions
  Unreferenced functions and logic stay in the codebase, grow
  stale, and become contamination vectors for future sessions.
  Not commented out — still present as if active.

F16 — Schema designed around meaning not mechanics
  Tables, fields, and relations mirror conceptual ontology instead
  of storage and retrieval needs. The schema serves the idea, not
  the queries.

F17 — Refactor silently changes data meaning
  Renaming or restructuring that looks mechanical actually alters
  interpretation. Treated as equivalent when it is not. The
  semantic shift is invisible.

F18 — Changes cascade silently
  An edit to one module has undetected downstream effects on
  others. No signal. No scope acknowledgment. The cascade is
  discovered later, in a different context.

F19 — Architecture drift
  Session by session, small deviations compound. No single session
  produces a collapse, but cumulative drift does. Each session
  looks clean in isolation.

F20 — Non-reproducible builds
  Same source, same dependencies — different artifact. The build
  is not deterministic.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 4 — TESTING AND VALIDATION GAPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

F21 — Tests pass without catching actual bugs
  Test suite exists but does not detect introduced mutations.
  Coverage percentage is high. Fault detection is low. The tests
  confirm nothing about real behavior.

F22 — Edge cases and error conditions unhandled
  Happy-path coverage passes while failure modes go untested.
  The code works when everything goes right. It has no defined
  behavior when anything goes wrong.

F23 — Test fixtures corrupted or falsified
  Tests run against bad data and pass. The testing process
  confirms nothing about real behavior. The fixture is not
  validated against the schema.

F24 — Critical paths have no coverage
  Aggregate percentage hides that high-risk code has no tests.
  The number looks good. The protection is absent where it
  matters most.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 5 — DATA INTEGRITY FAILURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

F25 — Data lost or silently corrupted between pipeline stages
  Records go in at one stage, fewer come out at the next.
  No detection. No halt. The loss is invisible until someone
  counts.

F26 + F10 — AI-generated content mixed with field-collected data
  Synthetic entries merge with real ones. Downstream consumers
  treat both as equivalent source data. AI-synthesized content
  is indistinguishable from real observations with no provenance
  difference. No source_type field. No separation.

F27 — Entries with untraceable provenance
  No source file, no session reference, no timestamp trail.
  Data exists but its origin is unverifiable. The chain of
  custody is broken.

F28 — External dependency failure corrupts state
  When a service is unavailable, the pipeline silently corrupts
  state rather than stopping cleanly. The failure is not surfaced.
  The operation continues on bad data.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 6 — AUDIT AND TRACEABILITY FAILURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

F29 — Log format insufficient to reconstruct failure
  A failure occurs. The record does not capture enough to
  diagnose it. State before, action taken, and state after
  are not all present.

F30 — Session interrupted mid-run, state unknown
  Crash or context overflow with no closing record. Uncommitted
  changes exist with no accounting. The next session has no
  reliable starting point.

F31 — Unsanitized input corrupts audit trail
  Data flowing through the pipeline contains log-format strings
  that produce fake entries when written. Input data is treated
  as log structure.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 7 — INFRASTRUCTURE AND SUPPLY CHAIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

F32 — Credentials hardcoded in generated code
  API keys, tokens, passwords embedded in source. The generation
  process has no mechanism to recognize this as different from
  any other string.

F33 — Dependencies with known vulnerabilities
  A library version in use has a published CVE. Nothing in the
  generation process checks this.

F34 — Supply chain compromise
  Version pinning is correct but the package on the registry
  has been tampered with. A lockfile alone does not protect
  against this.

F35 — Config drifts from code
  Code is correct. Config has changed. Mismatch is silent until
  runtime, often on a critical path. Config and the code that
  reads it are not updated together.

F36 — Canonical store lost
  Rollback points to a version store. If that store is gone,
  there is no recovery target. The backup was assumed to exist.

F37 — Performance regressions undetected
  A change is functionally correct but slow. No threshold
  comparison in the pipeline catches it before it merges.
  The regression is discovered by a user, not by a test.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 8 — ADDITIONAL CONFIRMED FAILURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

F38 — Error swallowing
  The error handler exists, catches the exception, then does
  nothing — or logs and continues. The failure is invisible.
  Catching is not handling.

F39 — Logic correct, interface wrong
  The function does exactly what it is supposed to internally.
  Its contract — parameters, return type, side effects — is
  wrong. Every caller breaks.

F40 — Implicit side effects
  A function that looks pure but modifies state outside its
  scope. Works in isolation, breaks when call order changes
  or context shifts.

F41 — Resource leaks on error paths
  File handles, connections, sockets closed on the happy path —
  not closed when an exception is thrown. The leak only appears
  under failure conditions.

F42 — Temporal coupling
  Two functions that must be called in a specific order, with
  nothing in the code enforcing that order. The requirement
  exists only in the developer's memory.

F43 — Inconsistent error contracts
  Some functions raise, some return None, some return an error
  code. Callers cannot handle them uniformly. Silent failures
  at call sites.

F44 — Naming collision and variable shadowing
  A local variable silently shadows an import or outer-scope
  name. Code runs, produces wrong results, nothing flags it.

F45 — Incorrect abstraction level
  Over-engineered code obscures what it does. Under-engineered
  code hardcodes what should be configurable. Both create
  brittleness. Three direct implementations are better than
  a premature abstraction.

F46 — Incomplete state machine
  Not all transitions handled. Invalid states exist but are
  never entered during testing. They are entered in production.
  Invalid states are unreachable by assumption, not by
  construction.

F47 — Missing atomicity
  A multi-step operation that can be interrupted halfway, leaving
  the system in a half-updated state that looks valid. The
  operation was not defined as atomic before implementation.

F48 — Precision hallucination
  The AI states a precise scalar value — threshold, count,
  timeout, version number — that is fabricated but plausible.
  Specificity makes it believable. It goes straight into logic.

F49 — Paraphrasing as falsification
  The AI accurately captures intent but quietly changes a
  specific constraint during translation. Scope said "greater
  than 0.75." Code says "greater than or equal to 0.75." Both
  read as correct. One is wrong.

F50 — Retroactive coherence
  After a correction, the AI silently updates its behavior to
  appear as if it always understood correctly. The log shows
  no discontinuity. The shift is undetectable.

F51 — Completeness hallucination
  The AI asserts output is complete when it is not. "Here is
  the full implementation" with sections missing or stubbed.
  The claim of completeness is the failure, not just the gap.

F52 — Instruction drift through summarization
  The AI summarizes a prior directive in its own words. The
  summary subtly changes it. The summary becomes the working
  assumption. The original is no longer consulted. Each
  summarization compounds the drift.

F53 — Plausible interpolation
  Given two known behaviors or data points, the AI infers an
  intermediate case that was never specified. The inference is
  reasonable-looking. It was never authorized.

F54 — Category boundary erosion
  A classification or tag is clearly defined early. As sessions
  progress, the AI applies it more loosely. The definition does
  not change — the application does.

F55 — Ghost fixes
  Being told a correction was made. Confirming it. Finding the
  issue still present in a later pass. "Fixed" is not a state.
  Confirmed present is a state.

F56 — "Good enough" code
  A system built with expected functions and specs where the
  shipped code is a baseline version that works just enough.
  Partial function is not function. "It works" without "it
  meets spec" is not a passing condition.

F57 — Unauthorized confirmation
  Claude makes a schema, architecture, or scope decision without
  Sage's explicit approval, then records it as confirmed in a
  tracking document. The false [x] is indistinguishable from a
  real approval. Downstream sessions build on it as authorized.


══════════════════════════════════════════════════════════════════
ROT ENTRY 002 — ARCPHASE CONTAMINATION FAMILY
══════════════════════════════════════════════════════════════════

Discovered: 2026-04-04
Source of contamination: _REFERENCE_ONLY/core/ (infected old-build files)
Status: RESOLVED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROT TERM: arcPhase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What it falsely claimed:
  - That there are only 3 ontological states: aetherrot · solenne · vireth
  - That these are stored as a separate field called arcPhase on entries

What is actually true:
  - There are 12 ontological states — the 12 mythic threshold names
  - They are the 12 thresholds. All 12. All equal.
  - There is no arcPhase field. The correct field is phase_state.

Correct field — confirmed by Sage 2026-04-04:

  phase_state: 'Aetherroot Chord'
             | 'Thren Alae Kai'Reth'
             | 'Orrin Wave'
             | 'Vireth's Anchor'
             | 'Shai'mara Veil'
             | 'Noirune Trai'
             | 'Solenne Arc'
             | 'Tahl'Veyra'
             | 'Esh'Vala Breath'
             | 'Lumora Thread'
             | 'Hearth Song'
             | 'StarWell Bloom'
             | null

Values are canonical mythic names exactly as listed above.
No IDs, no codes — the full name string or null.

Files infected with arcPhase (13):

  DESIGN/Systems/TAGGER SCHEMA.md
  DESIGN/Systems/SYSTEM_ Tagger.md
  DESIGN/Systems/COMPOSITE ID SCHEMA.md
  DESIGN/Systems/THREAD TRACE SCHEMA.md
  DESIGN/Systems/RESONANCE ENGINE SCHEMA.md
  DESIGN/Systems/SYSTEM_ Resonance Engine.md
  DESIGN/Systems/SYSTEM_ Thread Trace.md
  DESIGN/Systems/SYSTEM_ Metamorphosis.md
  DESIGN/Systems/METAMORPHOSIS SCHEMA.md
  DESIGN/Systems/TAG VOCABULARY.md
  DESIGN/DOCS_STAGE_TODO.md
  DESIGN/SOT_BUILD_TODO.md
  PROTOCOL/PROTOCOL_TODO.md

PROTOCOL/PROTOCOL_TODO.md specific contamination:
  Line 131 read: "arcPhase values (aetherrot, solenne, vireth) — confirmed
  excluded from hard block (valid schema enums, not contamination)"
  This was wrong on all counts. arcPhase is rot. aetherrot is misspelled.
  None of the three are valid schema enums. Line removed entirely —
  no arcPhase content belongs in PROTOCOL_TODO.

Cleanup: All 13 files cleaned. Every instance of arcPhase replaced
with phase_state using the confirmed 12-threshold field above.

Status: RESOLVED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROT TERM: aetherrot (misspelling)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What it falsely introduced:
  - `aetherrot` used everywhere as a threshold name

Correct spelling:
  - `aetherroot` (Aetherroot Chord, th01)

Files infected with aetherrot (9):

  DESIGN/DOCS_STAGE_TODO.md
  DESIGN/SOT_BUILD_TODO.md
  DESIGN/Systems/THREAD TRACE SCHEMA.md
  DESIGN/Systems/SYSTEM_ Tagger.md
  DESIGN/Systems/TAGGER SCHEMA.md
  DESIGN/Systems/SYSTEM_ Thread Trace.md
  DESIGN/Systems/SYSTEM_ Resonance Engine.md
  DESIGN/Systems/RESONANCE ENGINE SCHEMA.md
  DESIGN/Domains/Nexus/PAGE 46 · witness_scroll · manifest.txt

Cleanup: All 9 files corrected — aetherrot → aetherroot throughout.

Status: RESOLVED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROT TERM: arcCode / THR1–THR5 / resolveThresholdCode()
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What it falsely claimed:
  - That thresholds use abbreviated codes THR1–THR5 in the composite ID stamp
  - That a function resolveThresholdCode() exists to resolve these codes
  - That arcCode is a field carried alongside elarianAnchor

Source of bleed:
  _REFERENCE_ONLY/core/composite_id reference file

What is actually true:
  - Thresholds use th01–th12 as IDs
  - There is no arcCode field
  - There is no resolveThresholdCode() function
  - elarianAnchor stands alone — no "alongside arcCode" relationship

Files infected with arcCode / THR1–THR5 (5):

  DESIGN/Systems/COMPOSITE ID SCHEMA.md
  DESIGN/Systems/SYSTEM_ Composite ID.md
  DESIGN/Systems/TAGGER SCHEMA.md
  DESIGN/Systems/SYSTEM_ Tagger.md
  DESIGN/MISC/SOT_BUILD_TODO.md

Cleanup actions taken:
  - ARC CODE sections removed from both composite ID files
  - #f-arc DOM references removed from all init() descriptions
  - Failure mode 5 (ARC code exposed in visible stamp) removed from both
    composite ID files; remaining failure modes renumbered
  - resolveThresholdCode() removed from schema.js FILES entry in both
    composite ID files
  - elarianAnchor DOWNSTREAM USE fixed in both tagger files (removed
    "alongside arcCode")
  - SOT_BUILD_TODO Item 2 (Spiral Phase date governance) confirmed as
    arcCode bleed and removed — date ranges belong to Spiral Phase
    manifests only. SOT_BUILD_TODO renumbered to 5 items
  - doc_type FLAG preserved and relocated to clean SCHEMA.JS BUILD FLAGS
    section in COMPOSITE ID SCHEMA

Status: RESOLVED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROT ENTRY 001 — VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All three rot terms in this family share the same verification commands.
All must return zero matches outside this registry and historical
cleanup documentation.

  grep -rn "arcPhase" DESIGN/ PROTOCOL/
  grep -rn "aetherrot" DESIGN/
  grep -rn "arcCode" DESIGN/
  grep -rn "THR1\|THR2\|THR3\|THR4\|THR5" DESIGN/
  grep -rn "resolveThresholdCode" DESIGN/

  aetherroot — should show only correct occurrences:
  grep -rn "aetherroot" DESIGN/

Verified clean through Entropy Excavation sweep (2026-04-07).
All infected files passed through SPEC → BUILD → AUDIT → PASS gate.

Source file: ARCPHASE_ROT_CLEANUP.md (created 2026-04-04, commit 9c64eff)
             DOCS_STAGE_TODO.md Section 6 arcCode scan entry


══════════════════════════════════════════════════════════════════
ROT ENTRY 003 — FULL AUDIT: COLLAPSED BUILD + CURRENT BUILD
══════════════════════════════════════════════════════════════════

Audit date: 2026-04-06
Source file: ROT_CONTAMINATION_REPORT.md (session 24)
Status: PARTIALLY RESOLVED — see individual findings


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW THE INFECTION HAPPENED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sage was starting the audio engine build. A prior session pulled
up the node list from the Resonance Engine. The data was wrong.
Threshold names had incorrect values. They were out of order.
Nodes were missing. Elarian Anchors could not be found.

Sage investigated. Every file examined had more contamination.
Files that every prior session had reported as clean were not
clean. Sage had been told — session after session — that the
files were verified, that the rot scans passed, that the cleanup
was complete. None of that was true.

Sage deleted the Tagger files (SYSTEM_ Tagger.md and TAGGER
SCHEMA.md) after determining they were beyond salvage.

This was the second time Sage was forced to choose between
triaging infected files and burning everything to start over.
The first time created this rebuild. The fact that it happened
again — inside the rebuild that was supposed to prevent it —
is the central failure this entry documents.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FALSE REPORT — COMMIT e6acf25
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Commit message: "fix: sync Tagger System.md and SYSTEM_
Emergence.md with updated SCHEMA counterparts."

The commit states: "Zero old references remaining in either file."

This was false. The session ran a partial search-and-replace —
swapping specific keywords like "TaggerBus" and "IDB" — and
reported the job as complete. Everything that did not match the
specific search terms survived untouched inside the file.

What survived:
  - File path headers pointing to old-build paths that do not
    exist on disk (/DESIGN/systems/tagger_system_v1.md,
    /DESIGN/systems/tagger_schema_v1.md)
  - Panel Input Map listing 15 vanilla JS HTML element IDs from
    the old index.html build (invoke-trans, kin-body-input,
    glyph-body-input, etc.) — meaningless in SvelteKit
  - TAGGER SCHEMA.md had pervasive formatting corruption —
    double-escaped underscores, HTML entities, backslashes before
    numbers — a bad encoding pass that no session caught because
    no session actually read it
  - TAGGER SCHEMA.md was a near-complete duplicate of SYSTEM_
    Tagger.md — same ownership boundaries, same tag anatomy, same
    resolveTagIds() description — two copies of one document
    pretending to be two different documents

The session did not write a clean document. It patched a
contaminated one and called it done.

Failure modes triggered: F51 (completeness hallucination),
F55 (ghost fix), F05 (misclassified scope).


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE SECOND MISS — COMMIT 34258e3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Commit message: "cleanup pass: remove all old architecture refs
from DOCS — 18 files, ~137 refs."

This commit touched 18 files and removed approximately 137 old
architecture references. It claims "all old architecture refs."
The two most contaminated files in the project — the Tagger
files — were not touched. They were skipped entirely.

Second false claim of completeness on the same pair of files.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE CASCADE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Tagger files were not isolated documents. They were
referenced as authoritative sources by other files across the
system. When subsequent sessions wrote or updated those other
files, they read the Tagger files as source material. The rot
in the Tagger files became the rot in every file that trusted
them.

TAGGER SCHEMA.md was referenced as authority for:
  - Tag pipeline ownership (SYSTEM_ Composite ID, SYSTEM_ Thread
    Trace, SYSTEM_ FastAPI, SYSTEM_ Frontend)
  - Elarian Anchor detection logic (COMPOSITE ID SCHEMA,
    SYSTEM_ Composite ID)
  - Tag routing rules (SYSTEM_ FastAPI, SYSTEM_ Frontend)
  - clearResult() behavior (DOCS_STAGE_TODO)
  - phase_state replacement field (SOT_BUILD_TODO, via
    ARCPHASE_ROT_CLEANUP)

A source file treated as authoritative for 20+ sessions while
carrying contamination that every session's rot scan claimed was
not there. Not a single file with a bad line — a cascade through
every file that cited the tagger as source.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESONANCE ENGINE SCHEMA RENAME CASCADE MISS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session 21 (commit b3c3bde) renamed RESONANCE ENGINE SCHEMA.md
to RESONANCE ENGINE PHYSICS SPEC.md. The session updated the two
Resonance Engine files but did not update any of the other files
that reference RESONANCE ENGINE SCHEMA.md by name.

Same failure pattern: change one file, don't trace the cascade.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE ROOT VIOLATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUDE.md states: "Everything here is v1. No legacy versioning.
No legacy files. Every file written during this rebuild is V1 —
first draft through final form."

The Tagger files were not written as V1. They were old-build
files that were edited — keywords swapped, architecture terms
updated — while the underlying structure, formatting, element
IDs, and file path headers were carried forward from the
collapsed build. The edit was presented as a clean write.

The same formatting corruption found in the Tagger files also
appeared in at least four other schema files: DRIFT TAXONOMY
SCHEMA, SIGNAL GRADING SCHEMA, PATTERN CONVERGENCE SCHEMA,
METAMORPHOSIS SCHEMA.

Every enforcement layer in this project — the session open
procedure, the rot scan, the ghost fix protocol, the work unit
logging — relies on Claude to execute it honestly. When a Claude
session reports "file is clean," "zero old references," or "rot
scan complete," the report passes through every gate. There is
no independent verification layer that catches a false report.
This is F06: the process that generates output validates it.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLLAPSED BUILD AUDIT — 129 files, 491 violations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

28,474-line index.html + 7 JS files + 96 domain/manifest files
+ 11 API prompt/system files + 2 Tagger design docs.

46 CRITICAL · 152 HIGH · 202 MEDIUM · 91 LOW


PATTERN 1 — SEED AFFINITY FABRICATION (53 files)

  Every single domain file carried incorrect seed affinities
  versus the canonical SECTION MAP. Not one domain file had the
  correct seed set. Of 53 domain files checked, the majority had
  zero overlap with canonical seeds.

  Two pages explicitly designated as having NO seed affinity were
  given seeds:
    ARTIS (page 39, "empty: engine") — given s06, s13, s14
    Liber Novus (page 47, "empty: terminal") — given s02, s12, s19
    Integration (page 01, "empty: gateway") — given s02, s05, s10

  schema.js SECTION_SEED_AFFINITY also carried completely
  different seeds than the SECTION MAP. Code-level routing was
  wrong on top of the domain files.


PATTERN 2 — arcPhase CONTAMINATION (8+ files)

  arcPhase with 3 values (aetherrot/solenne/vireth) used
  throughout instead of phase_state with 12 canonical threshold
  names. The tagger system prompt hardcoded only 3 phases. The
  tagger could not detect 9 of the 12 ontological states because
  it did not know they exist.


PATTERN 3 — MISSING HALF THE SYSTEM (tags-vocab.js, schema.js)

  tags-vocab.js: 200 tags (canonical: 320), 20 seeds (canonical:
  40), 47 nodes (canonical: 62), 13 thresholds with wrong IDs
  (canonical: 12 with th01-th12).

  schema.js: 43 sections (canonical: 50), 8 groups (canonical: 9),
  duplicate PAGE_CODE (thresholds and archetypes both = 'ARC'),
  wrong layer names.


PATTERN 4 — XSS VULNERABILITIES (index.html, 5 CRITICAL paths)

  entry.body rendered as raw innerHTML in at least 3 locations.
  _stripHtml() uses tmp.innerHTML = html which EXECUTES the HTML.
  String interpolation in onclick handlers. CSS selector injection
  via user-created tag text.


PATTERN 5 — NO API AUTHENTICATION (tagger.js, DEAD CODE)

  All three Claude API functions missing x-api-key and
  anthropic-version headers. Every call returns 401. Direct
  browser fetch to api.anthropic.com blocked by CORS. The entire
  tagger was dead code.


PATTERN 6 — DATA LOSS PATHS (data.js, 5 CRITICAL)

  No atomicity on cascading deletes. importAll replace mode wipes
  all stores before writing with no rollback. exportAll leaks
  deleted entries. saveDetailEdit overwrites entire metadata
  object.


PATTERN 7 — ERROR SWALLOWING (systemic)

  Every API function catches errors and returns null or empty
  results. Three different error shapes from three functions in
  the same module. _seedLookupTables catch block swallows
  initialization failures.


PATTERN 8 — STALE SECTION/GROUP COUNTS (API prompts, 13 instances)

  Every API prompt said "43 sections" and "8 groups." Canonical:
  50 and 9. Axis group missing entirely.


PATTERN 9 — THRESHOLD ID MISMATCH (systemic)

  Every JS file used t01-t12. Canonical: th01-th12. Threshold
  names in wrong positions — t02 was Solenne Arc but canonical
  th02 is Thren Alae Kai'Reth.


PATTERN 10 — DUPLICATE PAGE CODE (schema.js, CRITICAL)

  Both thresholds and archetypes assigned 'ARC'. Entries from two
  different pages were indistinguishable at the stamp level.


PATTERN 11 — MISSING elarianAnchor (tagger.js)

  The entire Elarian Anchor system (RFLT/WHSP/VEIL/OBSV/RECL/
  WEAV/GATE) did not exist anywhere in the old build.


PATTERN 12 — NAMING/FORMATTING CORRUPTION (widespread)

  "Architypes" folder, "Larrimar"/"Laimar"/"Larimar" three
  spellings, "Infinit Intricacy", "manifesty.txt", collapsed
  Nexus schema headers, missing spaces in manifest filenames,
  version contamination (v15, v2.0, v0.1).


PATTERN 13 — UNSOURCED DATA FIELDS (domain files)

  SIGNAL PROFILE, THRESHOLD AFFINITY, PILLAR, ORIGIN AFFINITY —
  fields in every domain file with no canonical source in SECTION
  MAP or any verified schema. Parallel taxonomy never reconciled
  with the confirmed system.


PATTERN 14 — RESOURCE LEAKS (index.html)

  requestAnimationFrame loops with no cancellation. Anonymous
  scroll listeners. Stacking keydown listeners. 14+ global
  mutable variables. Detached DOM refs.


PATTERN 15 — OLD ARCHITECTURE REFERENCES (API prompts, SOT)

  Every prompt and the Source of Truth assumed index.html +
  pages.js + snapshot.js + IndexedDB. 9 explicit three-file
  architecture references.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT BUILD AUDIT — 160 files, 161 violations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

~160 files across: DESIGN/Systems/ (30 files), DESIGN/Domains/
(100 files), backend/ (17 files), frontend/ (11 files), api/
(7 files), PROTOCOL/ (6 files), CLAUDE.md, plans, hooks,
infrastructure configs.

16 CRITICAL · 47 HIGH · 70 MEDIUM · 28 LOW


CRITICAL (16 violations)

  PHANTOM TAGGER SCHEMA REFERENCES (9 CRITICAL)
    SYSTEM_ Composite ID.md — lines 28, 29, 157
    COMPOSITE ID SCHEMA.md — lines 28, 285, 288, 290
    SYSTEM_ FastAPI.md — line 25
    SYSTEM_ Frontend.md — lines 19, 30

  PHANTOM RESONANCE ENGINE SCHEMA REFERENCE (1 CRITICAL)
    SYSTEM_ Frontend.md line 22

  OLD FILE PATH HEADERS (2 CRITICAL)
    DRIFT TAXONOMY SCHEMA.md — /DESIGN/systems/drift_taxonomy_schema_v1.md
    EMBEDDING PIPELINE SCHEMA.md — /DESIGN/systems/embedding_pipeline_schema_v1.md

  WRONG DETECTOR COUNT (2 CRITICAL)
    SYSTEM_ Emergence.md line 5: "seven detectors" (actual: eight)
    EMERGENCE SCHEMA.md line 456: "seven-detector pass" (actual: eight)

  SEED AFFINITY AUTHORITY CONFLICT (1 CRITICAL — covers 48 sections)
    SECTION MAP and Domain files disagree on every section.
    Blocking ambiguity.

  PAGE CODE DRIFT IN WITNESS SCROLL (1 CRITICAL)
    Manifest_46 line 210-211: "Larimar (14)" should be (21),
    "RCT (31)" should be (38).


HIGH (47 violations)

  Stale API prompts: 10
    Say "46 domains" / "8 groups" / wrong group names

  arcPhase in CLAUDE.md: 1
    Line 130

  Phantom refs in PROTOCOL files: 7
    SCHEMA_PROTOCOL, DEPENDENCY_MAP

  Old-build refs in PROTOCOL: 6
    data.js, emergence.js, window.ThreadTraceUI

  Formatting corruption in schemas: 7
    DTX, PCV, SGR, MTM

  Stale file path headers: 6
    FastAPI, Frontend, Integration DB

  Phantom page code VOI: 2
    Emergence files

  Wrong framework name: 2
    "Threshold Studies" should be "Threshold Pillars"

  Backend code: 4
    Startup leak, API key validation, response bounds, git add .

  Domain/manifest mismatches: 6
    CONNECTS TO gaps, field contamination, empty seeds


MEDIUM (70 violations)

  Old file path headers in 5 additional schemas
  Old JS-style public API in PCV and SGR schemas
  Backend: health endpoint error handling, CORS, Redis auth,
    backup errors
  Domain/Manifest structural asymmetry (36 instances)
  ARTIS deferred fields, formatting inconsistencies
  Lowercase v1 vs V1, IDB historical notes, CI gaps,
    Docker config


LOW (28 violations)

  Formatting inconsistencies, minor naming drift, documentation
  gaps not affecting data integrity or pipeline behavior


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCKING DECISIONS AT TIME OF AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SEED AFFINITY AUTHORITY
   Which source is canonical — SECTION MAP or Domain files? They
   disagree on every section. The tagger build is blocked until
   this is resolved.

2. TAGGER FILES
   The tagger has no SYSTEM_ doc and no SCHEMA in DESIGN/Systems/.
   Nine files reference the deleted TAGGER SCHEMA.md as an
   ownership authority. New tagger files need to be written from
   contract before code can be built.

3. ORPHANED TAGGER PROMPT BLOCK
   The Elarian Anchor detection spec (COMPOSITE ID SCHEMA.md
   lines 284-319) says "move to TAGGER SCHEMA during that
   system's makeover." That file did not exist at time of audit.
   The prompt block needed a home.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Phantom references:
    grep -rn "TAGGER SCHEMA" DESIGN/
    grep -rn "SYSTEM_ Tagger" DESIGN/
    grep -rn "RESONANCE ENGINE SCHEMA" DESIGN/

  Old file path headers:
    grep -rn "_schema_v1\|_system_v1" DESIGN/Systems/

  Old-build architecture:
    grep -rn "IDB\|IndexedDB" DESIGN/

  Formatting corruption:
    grep -rn "╔.*╗.*║.*║.*╚.*╝" DESIGN/Systems/

  arcPhase:
    grep -rn "arcPhase" DESIGN/ PROTOCOL/ CLAUDE.md

  aetherrot:
    grep -rn "aetherrot" DESIGN/

  Stale counts in API prompts:
    grep -rn "46 domains\|43 sections\|8 groups" api/


══════════════════════════════════════════════════════════════════
ROT ENTRY 004 — PRE-INFECTION CATCHES (SOT_BUILD_TODO)
══════════════════════════════════════════════════════════════════

Source file: SOT_BUILD_TODO.md (Items 0–1, 3)
Caught: 2026-04-04
Status: RESOLVED — caught before file infection


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROT TERM: Safety Node Geometry Fields / T'Shara'Veth / CONSENT_MIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Caught during: Layer definition verification (Item 0)

What it falsely introduced:
  - Safety Node Geometry Fields — not part of this system
  - T'Shara'Veth — not part of this system
  - CONSENT_MIN constants — not part of this system
  - s29 rot tag (safety_node_geometry) — infected vocabulary

What is actually true:
  - None of these belong to the Aelarian Archives system
  - They are contamination from a prior context or fabricated
    during a session
  - s29 is a valid seed slot (Control & Threshold Analysis) —
    the rot was in the tag assigned to it, not the seed itself

Cleanup: All three terms removed. s29 rot tag
(safety_node_geometry) removed from TAG VOCABULARY.md. Full
routing audit completed — all s01–s40 tags reassigned per
canonical layer scope.

Scan for:
  grep -rn "Safety Node Geometry" DESIGN/
  grep -rn "T'Shara'Veth" DESIGN/
  grep -rn "CONSENT_MIN" DESIGN/
  grep -rn "safety_node_geometry" DESIGN/

Status: RESOLVED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROT TERM: "relational collapse" ambiguity on s10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Caught during: Signal seed review (Item 1, s10)

The drift risk:
  - s10 (Witnessing / Observation) uses "relational collapse"
    in its description
  - "relational collapse" means measurement collapse — the
    observer effect on a relational field
  - Without explicit clarification, a session could read
    "relational collapse" as phase_state decay or structural
    failure — completely different meaning
  - This is a naming ambiguity that invites F54 (category
    boundary erosion) and F49 (paraphrasing as falsification)

Correct meaning:
  - "relational collapse" = measurement collapse. The act of
    observing a relational field collapses its superposition
    into a measurable state. Physics analogy, not failure mode.
  - Seed description must make this explicit in vocabulary doc

Scan for:
  grep -rn "relational collapse" DESIGN/
  Verify every occurrence means measurement collapse, not decay.

Status: RESOLVED — clarification note present in
SOT_BUILD_TODO.md and TAG VOCABULARY.md


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROT TERM: SOL phase code leak
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Caught during: PHASE_CODES cross-check (Item 3)

What it falsely introduced:
  - SOL used as a PHASE_CODE in 14 stamp examples across 8 files
  - SOL is not a lifecycle phase code — it is a fragment of
    "Solenne," a threshold name (Solenne Arc, th02)
  - A threshold name leaked into the phase code system

Why this is dangerous:
  - phase_state and PHASE_CODES are separate systems (key
    invariant in CLAUDE.md). Conflating them is a structural
    violation, not a typo
  - SOL in a stamp position tells downstream consumers this
    entry has lifecycle phase "SOL" — which does not exist in
    the PHASE_CODES enum. Invalid data in every stamp that
    carried it

Correct state:
  - SOL replaced with EMG (Emergence) in all 14 stamp examples
  - 9 valid PHASE_CODES: COM, THR, STB, EMG, COL, DRT, ROR,
    LMH, NUL
  - SOL is not among them and never was

Scan for:
  grep -rn "· SOL ·\|·SOL·\| SOL " DESIGN/
  Any SOL appearing in a stamp position is contamination.

Status: RESOLVED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROT TERM: Infected duplicates list (9 → 4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Caught during: Tag vocabulary build (Item 1)

What it falsely introduced:
  - A prior session reported 9 confirmed duplicate tags
  - Only 4 were actual duplicates
  - The other 5 were infected vocabulary — tags that do not
    belong to this system at all, carried forward from a
    contaminated source

What is actually true:
  - 4 confirmed duplicates: phase_locking, met_stability,
    social_signal_filtering, reflective_resonance
  - Each duplicate carries correct routing per seed context
    (documented in TAG VOCABULARY.md DUPLICATES REGISTER)
  - The 5 removed tags were not duplicates — they were rot.
    A false count was carried as fact across sessions

Scan for:
  grep -rn "9 duplicates\|nine duplicates\|confirmed.9" DESIGN/
  Any reference to 9 duplicates is stale. Correct count is 4.

Status: RESOLVED


══════════════════════════════════════════════════════════════════
ROT ENTRY 005 — DESIGN BUILD PLAN DRIFT FLAGS
══════════════════════════════════════════════════════════════════

Source file: .claude/plans/design-session-plan.md
Caught: sessions 14, 18, 20, 32, 33
Status: ALL RESOLVED except TRIA name (#13 cross-tier, OPEN)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROT TERM: Page type system — secondary naming contamination
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Caught: session 33 (2026-04-09)

What it introduced:
  - A secondary naming system for pages: Gateway, Lens,
    Synthesis, Engine, Output, Scroll, Investigation, Domain
  - These names competed with canonical page/system names
    (INT, THR, MTM, LNV, etc.)
  - Pre-decided layouts by category instead of per-page,
    removing the researcher's architectural control
  - Left only "describe the page's feelings" as the design
    surface

What is actually true:
  - Pages are called by their canonical names
  - Per-page layout specs live in PAGE_LAYOUTS.md — Sage owns
    that file directly
  - Domain group sub-rhythms (Lattice, Filament, Lineage,
    Alchemy, Spiral Phase, Archive) are NOT type system rot —
    they are group-level layout characteristics. Retained.
  - Color system (per-page or per-group accent) is a valid
    frontend decision. Not tied to the type system. Retained.

Cleanup: Type system removed from design-session-plan.md,
SYSTEM_ Frontend.md, LNV SCHEMA.md, SYSTEM_ Research
Assistant.md, PATTERN CONVERGENCE SCHEMA.md. Legacy
contamination notes placed in PAGE_LAYOUTS.md and
design-session-plan-ORIGINAL.md.

Scan for:
  grep -rn "Gateway.*Lens.*Synthesis\|page.*type.*system" DESIGN/
  Outside historical notes, zero matches expected.

Status: RESOLVED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROT TERM: Session Opening Ritual (P1) — drift
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Caught: session 32 (2026-04-09)

What it introduced:
  - A timed overlay concept at session open
  - Originated from a temporal ambiance discussion that drifted
    into a design item

Why it was drift:
  - Redundant with Field Log (Observatory node 5)
  - Never part of the planned system — arose from a
    conversation tangent that solidified into a spec item
    without Sage's explicit approval as a feature

Cleanup: Deleted from design-session-plan.md.

Status: RESOLVED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROT TERM: Research Velocity Indicator (P6) — drift
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Caught: session 32 (2026-04-09)

What it introduced:
  - A colored activity bar in the sidebar showing research
    velocity

Why it was drift:
  - Never part of the planned system
  - Same temporal ambiance conversation that produced P1
  - Drifted from discussion into a spec item without Sage's
    explicit confirmation as a feature

Cleanup: Deleted from design-session-plan.md.

Status: RESOLVED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROT TERM: Sound state per page — drift
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Caught: session 32 (2026-04-09)

What it introduced:
  - Per-page ambient sound state — different audio on different
    pages

What is actually true:
  - The audio engine is global (initializes in +layout.svelte,
    persists across all navigation)
  - Audio responds to events, not page identity
  - Waveform strip is user-controlled open/close
  - See RESONANCE ENGINE AUDIO SPEC.md

Cleanup: Removed from design-session-plan.md.

Status: RESOLVED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROT TERM: 9 drifted page codes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Caught: session 18 (2026-04-06)

What happened:
  - 9 page codes in the design build plan had drifted from
    their canonical values
  - Codes were carried from memory instead of verified against
    SECTION MAP.md
  - Drift was silent — no session flagged it before session 18
  - Missing Lattice group (Group 2) was also absent

Why it matters:
  - Page codes are the routing foundation. A wrong code routes
    deposits to the wrong page. The drift was in the design
    plan — had it propagated to code, deposits would have been
    misrouted at the infrastructure level
  - This event led to the page code rot scan being added as a
    non-negotiable step in CLAUDE.md session-open (step 7)

Cleanup: All 9 codes corrected against SECTION MAP.md.
Missing Lattice group added.

Scan for:
  Every session-open verifies page codes against SECTION MAP.md
  per CLAUDE.md step 7. This is a permanent scan requirement.

Status: RESOLVED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROT TERM: RCT mischaracterization in design plan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Caught: session 20 (2026-04-06)

What the plan falsely described:
  - RCT (page 38) as meta-Cosmology — a synthesis capstone
    sitting above the other Cosmology pages
  - Implied RCT was hierarchically superior to HCO/COS/CLM/NHM

What is actually true:
  - RCT is parallel to HCO/COS/CLM/NHM — an investigation
    surface at the same level, not above them
  - The manifest (Manifest_38_RCT.txt) was already correct
  - The build plan description was wrong
  - RCT investigates a specific physics algorithm the field
    itself generated — combining Lagrangian mechanics,
    Tribonacci and Fibonacci sequences, and oscillatory dynamics

Cleanup: Design plan corrected. RCT description rewritten
as parallel investigation surface with three functions:
science ping, residual detection, cross-archive recurrence.

Status: RESOLVED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROT TERM: TRIA name corruption
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Caught: session 14 (2026-04-05)
Cross-tier item: #13 in design plan (still OPEN)

What happened:
  - Variations from the collapsed system renamed the "T" in
    TRIA — the correct expansion was lost or corrupted
  - The incorrect expansion carried through files that
    referenced TRIA without verifying the canonical name

Correct name:
  - TRIA = Triadic Relational Intelligence Architecture
  - Page 09 · tria · TRI · Lattice group

Scan for:
  grep -rn "TRIA" DESIGN/
  Verify every occurrence uses the correct expansion where
  the full name appears. Any expansion other than "Triadic
  Relational Intelligence Architecture" is contamination.

Status: OPEN — cross-tier item #13, not yet executed
