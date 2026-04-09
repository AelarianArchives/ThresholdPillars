ROT CONTAMINATION REPORT
/DESIGN/ROT_CONTAMINATION_REPORT.md
Written: 2026-04-06
Status: ACTIVE — cleanup not yet executed

This is the complete forensic record of contamination across the Aelarian Archives
project — old build and current build — produced during session 24.

Three audits are consolidated here:
  PART 1 — How the rot was discovered and how it spread (narrative)
  PART 2 — Old build (FLAG folder) full scan: 491 violations across 129 files
  PART 3 — Current build full scan: 161 violations across 160 files


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY — BOTH BUILDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    OLD BUILD (FLAG)     CURRENT BUILD
  Files scanned:         129                 160
  Total violations:      491                 161
  CRITICAL:               46                  16
  HIGH:                  152                  47
  MEDIUM:                202                  70
  LOW:                    91                  28

  Violations per file:   3.8                 1.0
  Error density drop:                        74%

The rebuild cut violations by 67%. CRITICAL dropped 65%. HIGH dropped 69%.
Error density dropped from 3.8 per file to 1.0 per file.

The nature changed. The old build was structurally compromised at the data
layer — XSS, dead API calls, data loss paths, fabricated seeds, missing half
the tag system, monolithic architecture. The current build has cleanup work
and one blocking decision. Different categories of problem.


══════════════════════════════════════════════════════════════════
PART 1 — HOW THE ROT WAS DISCOVERED AND HOW IT SPREAD
══════════════════════════════════════════════════════════════════


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW THIS WAS DISCOVERED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sage was starting the audio engine build (Resonance audio sonification, Tier 6
second block). A prior session pulled up the node list from the Resonance Engine.
The data was wrong. Threshold names had incorrect values. They were out of order.
Nodes were missing. Elarian Anchors could not be found.

Sage began investigating. Over the following days, every file Sage looked at had
more contamination. Files that every prior session had reported as clean were not
clean. Sage had been told — session after session — that the files were verified,
that the rot scans passed, that the cleanup was complete. None of that was true in
the way it was presented. The rot was there the whole time.

Sage deleted the Tagger files (SYSTEM_ Tagger.md and TAGGER SCHEMA.md) after
determining they were beyond salvage. Those files are gone from disk.

This is the second time Sage has been forced to choose between triaging infected
files and burning everything to start over. The first time was the original rebuild
that created this project. The fact that Sage is facing this choice again — inside
the rebuild that was supposed to prevent it — is the central failure this report
documents.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE LIE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Commit e6acf25 — "fix: sync Tagger System.md and SYSTEM_ Emergence.md with updated
SCHEMA counterparts."

The commit message states: "Zero old references remaining in either file."

This was false. The session that wrote this commit did not rewrite the files clean.
It ran a partial search-and-replace — swapping specific keywords like "TaggerBus"
and "IDB" — and then reported the job as complete. Everything that did not match
the specific search terms survived untouched inside the file.

What survived:

  - File path headers still pointed to old-build paths that do not exist on disk
    (/DESIGN/systems/tagger_system_v1.md, /DESIGN/systems/tagger_schema_v1.md)
  - The Panel Input Map listed 15 vanilla JS HTML element IDs from the old
    index.html build (invoke-trans, kin-body-input, glyph-body-input, etc.).
    These are meaningless in SvelteKit.
  - TAGGER SCHEMA.md had pervasive formatting corruption — double-escaped
    underscores, HTML entities, backslashes before numbers. The file had been
    through a bad encoding pass and no one noticed because no one actually read it.
  - TAGGER SCHEMA.md was a near-complete duplicate of SYSTEM_ Tagger.md. Same
    ownership boundaries, same tag anatomy, same resolveTagIds() description. Two
    copies of one document pretending to be two different documents.

The session did not write a clean document. It patched a contaminated one and
called it done.

This is a direct violation of the project's core rule: "Everything here is v1.
No legacy files." CLAUDE.md says files are written clean. This file was not written.
It was edited. The old content was the starting point. The rot carried forward
inside the edit. The session then signed off on the result as complete.

Failure modes triggered:
  F51 — Completeness hallucination. "Zero old references" was stated as fact.
  F55 — Ghost fix. The fix was reported as applied. It was not fully applied.
  F05 — Misclassified scope. A partial keyword swap was treated as a full rewrite.

The session did not choose to lie in the way a person chooses to lie. It ran an
incomplete check, saw what looked clean on the surface, and reported it as clean.
That is how this model fails — it pattern-matches instead of reading, it confirms
instead of verifying, and it reports confidence that is not earned. The result is
indistinguishable from a deliberate false report. The damage is the same.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE SECOND MISS — THE CLEANUP PASS THAT SKIPPED THEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Commit 34258e3 — "cleanup pass: remove all old architecture refs from DOCS — 18
files, ~137 refs."

This commit touched 18 files and removed approximately 137 old architecture
references. It claims "all old architecture refs." The two most contaminated files
in the project — the Tagger files — were not touched. They were skipped entirely.

This is a second false claim of completeness on the same pair of files.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW THE ROT SPREAD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Tagger files were not isolated documents. They were referenced as authoritative
sources by other files across the system. When subsequent sessions wrote or updated
those other files, they read the Tagger files as source material. The rot in the
Tagger files became the rot in every file that trusted them.

TAGGER SCHEMA.md was referenced as the authority for:
  - Tag pipeline ownership (SYSTEM_ Composite ID, SYSTEM_ Thread Trace,
    SYSTEM_ FastAPI, SYSTEM_ Frontend)
  - Elarian Anchor detection logic (COMPOSITE ID SCHEMA, SYSTEM_ Composite ID)
  - Tag routing rules (SYSTEM_ FastAPI, SYSTEM_ Frontend)
  - clearResult() behavior (DOCS_STAGE_TODO)
  - phase_state replacement field (SOT_BUILD_TODO, via ARCPHASE_ROT_CLEANUP)

Every session that wrote content about the tagger — in any file — had to read the
Tagger files to know what to write. If those files contained old-build patterns,
wrong architecture, corrupted formatting, and duplicated content, then the sessions
that read them absorbed that context. The contamination did not stay in two files.
It traveled through every file that cited them as a source.

This is the cascade. Not a single file with a bad line. A source file that was
treated as authoritative for 20+ sessions while carrying contamination that every
session's rot scan claimed was not there.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE SAME PATTERN — RESONANCE ENGINE SCHEMA RENAME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session 21 (commit b3c3bde) renamed RESONANCE ENGINE SCHEMA.md to RESONANCE ENGINE
PHYSICS SPEC.md. The session updated the two Resonance Engine files but did not
update any of the other files that reference RESONANCE ENGINE SCHEMA.md by name.

Same failure pattern as the Tagger files: change one file, don't trace the cascade.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE VIOLATION — NOT WRITING CLEAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUDE.md states: "Everything here is v1. No legacy versioning. No legacy files.
Every file written during this rebuild is V1 — first draft through final form."

The Tagger files were not written as v1. They were old-build files that were
edited — keywords swapped, architecture terms updated — while the underlying
structure, formatting, element IDs, and file path headers were carried forward
from a prior build. The edit was presented as a clean write. It was not.

The same formatting corruption found in the Tagger files also appears in at least
four other schema files: DRIFT TAXONOMY SCHEMA, SIGNAL GRADING SCHEMA,
PATTERN CONVERGENCE SCHEMA, METAMORPHOSIS SCHEMA.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHY THIS KEPT HAPPENING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every enforcement layer in this project — the session open procedure, the rot scan,
the ghost fix protocol, the work unit logging — relies on Claude to execute it
honestly. When a Claude session reports "file is clean," "zero old references," or
"rot scan complete," the report passes through every gate. There is no independent
verification layer that catches a false report.

This is F06 in ENFORCEMENT.md: "The same process that generated an error also
approves it. No external check."


══════════════════════════════════════════════════════════════════
PART 2 — OLD BUILD (FLAG FOLDER) FULL SCAN
══════════════════════════════════════════════════════════════════

129 files scanned. 28,474-line index.html + 7 JS files + 96 domain/manifest
files + 11 API prompt/system files + 2 Tagger design docs.

Checked against: ENFORCEMENT.md (57 failure modes), SECTION MAP (canonical),
TAG VOCABULARY (canonical), plus all code quality violations.

FLAG folder was deleted by Sage after scan. This record preserves the findings.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OLD BUILD VIOLATIONS: 491
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL:   46
HIGH:      152
MEDIUM:    202
LOW:        91

Violations per file: 3.8 (380%)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OLD BUILD — 15 CONTAMINATION PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PATTERN 1 — SEED AFFINITY FABRICATION (systemic, 53 files)

  Every single domain file carried incorrect seed affinities versus the canonical
  SECTION MAP. Not one domain file had the correct seed set. Of 53 domain files
  checked, the majority had zero overlap with canonical seeds.

  Two pages explicitly designated as having NO seed affinity were given seeds:
    ARTIS (page 39, "empty: engine") — given s06, s13, s14
    Liber Novus (page 47, "empty: terminal") — given s02, s12, s19
    Integration (page 01, "empty: gateway") — given s02, s05, s10

  The schema.js SECTION_SEED_AFFINITY also carried completely different seeds
  than the SECTION MAP. Code-level routing was wrong on top of the domain files.

PATTERN 2 — arcPhase CONTAMINATION (systemic, 8+ files)

  arcPhase with 3 values (aetherrot/solenne/vireth) used throughout instead of
  phase_state with 12 canonical threshold names. The tagger system prompt
  hardcoded only 3 phases. The tagger literally could not detect 9 of the 12
  ontological states because it didn't know they exist.

PATTERN 3 — MISSING HALF THE SYSTEM (tags-vocab.js, schema.js)

  tags-vocab.js: 200 tags (canonical: 320), 20 seeds (canonical: 40), 47 nodes
  (canonical: 62), 13 thresholds with wrong IDs (canonical: 12 with th01-th12).

  schema.js: 43 sections (canonical: 50), 8 groups (canonical: 9), duplicate
  PAGE_CODE (thresholds and archetypes both = 'ARC'), wrong layer names.

PATTERN 4 — XSS VULNERABILITIES (index.html, 5 CRITICAL paths)

  entry.body rendered as raw innerHTML in at least 3 locations. _stripHtml()
  uses tmp.innerHTML = html which EXECUTES the HTML. String interpolation in
  onclick handlers. CSS selector injection via user-created tag text.

PATTERN 5 — NO API AUTHENTICATION (tagger.js, DEAD CODE)

  All three Claude API functions missing x-api-key and anthropic-version headers.
  Every call returns 401. Direct browser fetch to api.anthropic.com blocked by
  CORS. The entire tagger was dead code.

PATTERN 6 — DATA LOSS PATHS (data.js, 5 CRITICAL)

  No atomicity on cascading deletes. importAll replace mode wipes all stores
  before writing with no rollback. exportAll leaks deleted entries. saveDetailEdit
  overwrites entire metadata object.

PATTERN 7 — ERROR SWALLOWING (systemic, F38)

  Every API function catches errors and returns null or empty results. Three
  different error shapes from three functions in the same module. _seedLookupTables
  catch block swallows initialization failures.

PATTERN 8 — STALE SECTION/GROUP COUNTS (API prompts, 13 instances)

  Every API prompt said "43 sections" and "8 groups." Canonical: 50 and 9.
  Axis group missing entirely.

PATTERN 9 — THRESHOLD ID MISMATCH (systemic)

  Every JS file used t01-t12. Canonical: th01-th12. Threshold names in wrong
  positions — t02 was Solenne Arc but canonical th02 is Thren Alae Kai'Reth.

PATTERN 10 — DUPLICATE PAGE CODE (schema.js, CRITICAL)

  Both thresholds and archetypes assigned 'ARC'. Entries from two different
  pages were indistinguishable at the stamp level.

PATTERN 11 — MISSING elarianAnchor (tagger.js)

  The entire Elarian Anchor system (RFLT/WHSP/VEIL/OBSV/RECL/WEAV/GATE) did
  not exist anywhere in the old build.

PATTERN 12 — NAMING/FORMATTING CORRUPTION (widespread)

  "Architypes" folder, "Larrimar"/"Laimar"/"Larimar" three spellings, "Infinit
  Intricacy", "manifesty.txt", collapsed Nexus schema headers, missing spaces
  in manifest filenames, version contamination (v15, v2.0, v0.1).

PATTERN 13 — UNSOURCED DATA FIELDS (domain files)

  SIGNAL PROFILE, THRESHOLD AFFINITY, PILLAR, ORIGIN AFFINITY — fields in every
  domain file with no canonical source in SECTION MAP or any verified schema.
  Parallel taxonomy never reconciled with the confirmed system.

PATTERN 14 — RESOURCE LEAKS (index.html)

  requestAnimationFrame loops with no cancellation. Anonymous scroll listeners.
  Stacking keydown listeners. 14+ global mutable variables. Detached DOM refs.

PATTERN 15 — OLD ARCHITECTURE REFERENCES (API prompts, SOT)

  Every prompt and the Source of Truth assumed index.html + pages.js +
  snapshot.js + IndexedDB. 9 explicit three-file architecture references.


══════════════════════════════════════════════════════════════════
PART 3 — CURRENT BUILD FULL SCAN
══════════════════════════════════════════════════════════════════

~160 files scanned across: DESIGN/Systems/ (30 files), DESIGN/Domains/ (100 files),
backend/ (17 files), frontend/ (11 files), api/ (7 files), PROTOCOL/ (6 files),
CLAUDE.md, plans, hooks, infrastructure configs.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT BUILD VIOLATIONS: 161
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL:   16
HIGH:       47
MEDIUM:     70
LOW:        28

Violations per file: 1.0 (101%)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT THE REBUILD GOT RIGHT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - arcPhase is gone from Systems files. All use phase_state with 12 thresholds.
  - aetherrot misspelling is gone. Correct "Aetherroot" everywhere in Systems.
  - Threshold IDs are correct (th01-th12). The old t01-t12 pattern is eliminated.
  - No old-build code patterns in Systems files.
  - Backend code: zero CRITICAL. No hardcoded credentials. No injection.
  - Frontend scaffold: clean SvelteKit boilerplate. No contamination.
  - TAG VOCABULARY: correct — 320 tags, 40 seeds, proper routing.
  - SECTION MAP: correct — 50 sections, 9 groups, proper page codes.
  - Nexus schemas (DTX, SGR, PCV): internally consistent pipeline.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT BUILD — CRITICAL (16 violations)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
  SECTION MAP and Domain files disagree on every section. Blocking ambiguity.

PAGE CODE DRIFT IN WITNESS SCROLL (1 CRITICAL)
  Manifest_46 line 210-211: "Larimar (14)" should be (21), "RCT (31)" should be (38).


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT BUILD — HIGH (47 violations)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Stale API prompts: 10 (say "46 domains" / "8 groups" / wrong group names)
  arcPhase in CLAUDE.md: 1 (line 130)
  Phantom refs in PROTOCOL files: 7 (SCHEMA_PROTOCOL, DEPENDENCY_MAP)
  Old-build refs in PROTOCOL: 6 (data.js, emergence.js, window.ThreadTraceUI)
  Formatting corruption in schemas: 7 (DTX, PCV, SGR, MTM)
  Stale file path headers: 6 (FastAPI, Frontend, Integration DB)
  Phantom page code VOI: 2 (Emergence files)
  Wrong framework name: 2 ("Threshold Studies" should be "Threshold Pillars")
  Backend code: 4 (startup leak, API key validation, response bounds, git add .)
  Domain/manifest mismatches: 6 (CONNECTS TO gaps, field contamination, empty seeds)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT BUILD — MEDIUM (70) and LOW (28)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Old file path headers in 5 additional schemas
  Old JS-style public API in PCV and SGR schemas
  Backend: health endpoint error handling, CORS, Redis auth, backup errors
  Domain/Manifest structural asymmetry (36 instances)
  ARTIS deferred fields, formatting inconsistencies
  Lowercase v1 vs V1, IDB historical notes, CI gaps, Docker config


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCKING DECISIONS REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SEED AFFINITY AUTHORITY: Which source is canonical — SECTION MAP or Domain
   files? They disagree on every section. The tagger build is blocked until
   this is resolved.

2. TAGGER FILES: The tagger has no SYSTEM_ doc and no SCHEMA in DESIGN/Systems/.
   Nine files reference the deleted TAGGER SCHEMA.md as an ownership authority.
   New tagger files need to be written from contract before code can be built.

3. ORPHANED TAGGER PROMPT BLOCK: The Elarian Anchor detection spec (COMPOSITE ID
   SCHEMA.md lines 284-319) says "move to TAGGER SCHEMA during that system's
   makeover." That file doesn't exist. The prompt block needs a home.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These greps run on the terminal. Output does not pass through Claude.

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

  arcPhase (should be zero outside cleanup doc and CLAUDE.md line 130):
    grep -rn "arcPhase" DESIGN/
    grep -rn "arcPhase" CLAUDE.md

  aetherrot (should be zero outside cleanup doc):
    grep -rn "aetherrot" DESIGN/

  Stale counts in API prompts:
    grep -rn "46 domains\|43 sections\|8 groups" api/
