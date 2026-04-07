ENTROPY EXCAVATION
/DESIGN/ENTROPY_EXCAVATION.md
Written: 2026-04-07
Status: ACTIVE

Phased rot cleanup and verification sweep across the Aelarian Archives
project. Every file is dirty until proven clean. Clean files are verified
through independent audit and added to the VERIFIED list. Sessions
referencing data during this sweep must prefer VERIFIED sources over
unverified ones. If a verified source and an unverified source disagree,
the verified source wins.

Process:
  1. Select a file
  2. Read it completely
  3. Run the audit checklist below against it
  4. Fix every finding through the Recursion Repair gate (SPEC → BUILD → AUDIT → PASS)
  5. When the file and everything it touches are clean, add it to VERIFIED
  6. Move to the next file

One file at a time. No batch operations. No optimistic reports.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files that have passed independent audit through the Recursion Repair
gate system. These are trusted sources. If another file disagrees with
a VERIFIED file, the VERIFIED file wins.

  TAG VOCABULARY.md
    Verified: 2026-04-06
    Commit: 881b3dc
    Scope: threshold ID-to-name remap (10 of 12 corrected), Hz values
    added, all 320 tag routing entries remapped, 3 threshold tables
    reordered, duplicates register updated
    Gate: SPEC → BUILD → AUDIT → PASS

  SYSTEM_ Tagger.md
    Verified: 2026-04-06
    Commit: 05a402f
    Scope: clean V1 rewrite from contract — ownership boundaries,
    pipeline overview, tagger store consumers, file list
    Gate: SPEC → BUILD → AUDIT → PASS

  TAGGER SCHEMA.md
    Verified: 2026-04-06
    Commit: 05a402f
    Scope: clean V1 rewrite from contract — prompt blocks (tag, phase_state,
    elarianAnchor, doc_type), API request/response shapes, sequences,
    tagger store shape, 8 failure modes
    Gate: SPEC → BUILD → AUDIT → PASS

  COMPOSITE ID SCHEMA.md
    Verified: 2026-04-06
    Commit: 3e445c8
    Scope: Elarian Anchor prompt block removed (moved to TAGGER SCHEMA),
    both BUILD FLAGS updated to COMPLETE
    Gate: SPEC → BUILD → AUDIT → PASS


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UNVERIFIED — KNOWN ISSUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files with known issues from the rot contamination report (2026-04-06).
These are not trusted until they pass through the gate.

CRITICAL:

  SYSTEM_ Composite ID.md
    Audited informally (session 24). No issues found in content.
    Not formally gated. Box-drawing formatting not present.
    Elarian Anchor states verified correct (7 codes, descriptions match).

  SYSTEM_ Thread Trace.md
    Phantom TAGGER SCHEMA ref (line 27) — now resolved (file exists)
    Needs formal gate verification

  THREAD TRACE SCHEMA.md
    Phantom TAGGER SCHEMA ref (line 40) — now resolved (file exists)
    Box-drawing formatting in header (lines 1-7)
    Needs formal gate verification

  SYSTEM_ Emergence.md
    Wrong detector count: "seven detectors" (correct: eight)

  EMERGENCE SCHEMA.md
    Wrong detector count: "seven-detector pass" (correct: eight)
    Phantom page code VOI (not in SECTION MAP)

  DRIFT TAXONOMY SCHEMA.md
    Old file path header: /DESIGN/systems/drift_taxonomy_schema_v1.md
    Formatting corruption

  EMBEDDING PIPELINE SCHEMA.md
    Old file path header: /DESIGN/systems/embedding_pipeline_schema_v1.md

  SYSTEM_ Frontend.md
    Phantom TAGGER SCHEMA ref (line 30) — now resolved
    Phantom RESONANCE ENGINE SCHEMA ref (line 22)
    Stale file path headers

  SYSTEM_ FastAPI.md
    Phantom TAGGER SCHEMA ref (line 25) — now resolved
    Stale file path headers

HIGH:

  API prompts (api/prompts/)
    10 stale values: "46 domains" / "8 groups" / wrong group names

  PROTOCOL files
    7 phantom refs (SCHEMA_PROTOCOL, DEPENDENCY_MAP)
    6 old-build refs (data.js, emergence.js, window.ThreadTraceUI)

  CLAUDE.md
    arcPhase reference (line 130)

  SIGNAL GRADING SCHEMA.md (SGR)
    Formatting corruption
    Old JS-style public API

  PATTERN CONVERGENCE SCHEMA.md (PCV)
    Formatting corruption
    Old JS-style public API

  METAMORPHOSIS SCHEMA.md (MTM)
    Formatting corruption

  ARCPHASE_ROT_CLEANUP.md
    Threshold table uses old ID order (Sage handling)

  SOT_BUILD_TODO.md
    Threshold table uses old ID order (Sage handling)

BLOCKING DECISIONS (not file fixes):

  SEED AFFINITY AUTHORITY
    SECTION MAP and domain files disagree on every section's seed
    affinity. Blocks tagger build. One must be canonical.

  WITNESS SCROLL PAGE CODE DRIFT
    Manifest_46 lines 210-211: "Larimar (14)" should be (21),
    "RCT (31)" should be (38)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUDIT CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NON-Negotiable:
Audit for non-syntactic integrity failures including structural drift,
naming inconsistency, cross-file misalignment, semantic mismatch,
duplication, and silent failure risks. Assume this list is incomplete,
identify everything that would cause long-term system rot and project
entropy.

Categorized findings (by the sections below)
Severity: ROT-RISK: LOW | MEDIUM | HIGH
Exact location
Suggested correction (not just description)
If you detect inconsistency between two sources of truth, treat it as
HIGH severity even if both are valid.


1.  Structural Integrity
Keys/fields out of canonical order (schema drift)
Missing required fields (even if optional at runtime)
Extra/unknown fields silently accepted
Inconsistent nesting (same concept, different structure)
Array vs object mismatches across files

2.  Naming & Token Consistency
Same concept, multiple names (userId vs user_id vs uid)
Misspellings in:
keys
enums
constants
filenames
Acronyms inconsistently cased (APIKey vs api_key)
Pluralization drift (user vs users meaning different things)

3.  Cross-File Alignment
Same config/value defined differently in multiple places
API endpoints mismatched across files
Shared constants duplicated instead of imported
Schema version mismatch between producer/consumer
One file updated, dependent file not updated

4.  Semantic Consistency (this is where rot hides)
Field name implies one thing, value represents another
Units mismatch:
seconds vs milliseconds
dollars vs cents
Boolean flags inverted (isEnabled meaning opposite somewhere)
Enum values that overlap or contradict
"Temporary" values that became permanent

5.  Logic Shadow Errors
Conditions that are always true/false
Dead branches that look valid
Fallback/default paths masking real failures
Silent catch blocks or ignored errors
Duplicate logic implemented slightly differently

6.  Duplication & Drift
Same logic copied in multiple places with small differences
Near-duplicate schemas or interfaces
Repeated literals instead of centralized constants
Config fragments that should be shared but aren't

7.  Configuration Integrity
Environment-specific values hardcoded
Missing env variables with silent fallback
Default values that conflict with production expectations
Feature flags defined but unused (or vice versa)

8.  Documentation vs Reality
Comments that no longer match behavior
README/spec drift from actual implementation
Outdated examples
"TODO" / "TEMP" / "HACK" still present

9.  Test Illusions
Tests passing but not asserting meaningful outcomes
Mocked behavior diverging from real behavior
Missing edge case coverage
Tests referencing outdated schema/fields

10.  Contract Violations
Input/output contracts not enforced
Type looseness where strictness is expected
Breaking changes without version bump
Optional fields treated as required (or vice versa)

11.  Dependency & Version Drift
Different versions of same dependency used across modules
API version mismatch
Deprecated methods still in use
Lockfile inconsistencies

12.  File & System Hygiene
Orphaned files (no longer referenced)
Files referenced but missing
Incorrect file naming conventions
Mixed casing in file systems (breaks cross-platform)
Project details in correct order, groups, definitions and spelling

13.  Silent Failure Vectors (critical)
Errors logged but not acted on
Promise chains without proper rejection handling
Retry loops without limits
Fallbacks that hide upstream failure

14.  Canonical Source Violations
Multiple "sources of truth" for same data
Local overrides contradicting global config
Hardcoded values instead of referencing canonical source
Derived values stored instead of computed

15.  Entropy Signals (meta layer)
Inconsistent formatting patterns across files
Style drift (indicates multi-pass corruption)
Increasing complexity without clear reason
"Weird exceptions" accumulating


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT-SPECIFIC ROT PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Concrete contamination markers from the rot contamination report
(2026-04-06). These are the specific patterns to search for in every
file during this sweep. Each maps to one or more audit categories above.

PHANTOM FILE REFERENCES [#3, #12]
  Files referenced by name that do not exist on disk. The most dangerous
  form — a session reads the reference, assumes the file exists, and
  builds on a phantom. Prior damage: 9 files referenced deleted TAGGER
  SCHEMA.md as authority for 20+ sessions.
  Search: grep for every file name mentioned in a document, verify each
  exists on disk.

OLD FILE PATH HEADERS [#12, #15]
  File path headers pointing to old build paths that no longer exist.
  Pattern: /DESIGN/systems/[name]_schema_v1.md or similar.
  These are cosmetic but signal that the file was not rewritten clean —
  it was edited from an old copy.

STALE COUNTS [#8, #14]
  Numbers that were true in the old build but not the current one.
  Known stale values: "43 sections" (correct: 50), "46 domains"
  (correct: 50), "8 groups" (correct: 9), "7 detectors" (correct: 8).
  Search: grep for specific wrong numbers in prose text.

ARCPHASE CONTAMINATION [#2, #4]
  arcPhase was a 3-value system (aetherrot/solenne/vireth) from the old
  build. Replaced by phase_state with 12 canonical threshold names.
  Any reference to arcPhase outside historical cleanup docs is
  contamination. The tagger in the old build could only detect 3 of 12
  states because it didn't know the other 9 existed.

OLD ARCHITECTURE REFERENCES [#8]
  References to the old browser-based build: IDB, IndexedDB, data.js,
  emergence.js, schema.js, tags-vocab.js, pages.js, snapshot.js,
  window.ThreadTraceUI, index.html. Current architecture: FastAPI +
  SvelteKit + PostgreSQL + Redis + Ollama.

FORMATTING CORRUPTION [#15]
  Box-drawing characters (╔═╗║╚═╝) in file headers. Artifact of a bad
  encoding pass in the old build. Not a content issue but signals the
  file was not written clean — it was carried forward from the old build
  through an edit that didn't catch the formatting.

WRONG THRESHOLD IDS [#2, #14]
  Old build used t01-t12. Correct: th01-th12. Eliminated in the current
  build's Systems files but may survive in API prompts, protocol files,
  or domain files.

WRONG THRESHOLD ORDER [#1, #14]
  The threshold ID-to-name mapping was wrong in TAG VOCABULARY.md
  (10 of 12 shuffled). Corrected in commit 881b3dc. Any file carrying
  a copy of the old mapping is contaminated.
  Correct order: th01 Aetherroot Chord, th02 Solenne Arc,
  th03 Thren Alae Kai'Reth, th04 Shai'mara Veil, th05 Vireth's Anchor,
  th06 Esh'Vala Breath, th07 Orrin Wave, th08 Lumora Thread,
  th09 Hearth Song, th10 Tahl'Veyra, th11 Noirune Trai,
  th12 StarWell Bloom.

PAGE CODE DRIFT [#14]
  Page codes silently drifted across sessions when carried from memory
  instead of verified against SECTION MAP.md. Session 18 caught 9
  drifted codes in the design build plan. SECTION MAP.md is the sole
  authority for page codes, group names, and group numbers.

WRONG FRAMEWORK NAME [#2]
  "Threshold Studies" appears in some files. Correct name: "Threshold
  Pillars." The analytical framework is Threshold Pillars — applies
  signal processing, information theory, and field physics to map
  behavior at relational thresholds.

PHANTOM PAGE CODES [#12, #14]
  Page codes referenced that do not exist in SECTION MAP.md. Known
  phantom: VOI (appears in Emergence files, not in SECTION MAP).

VERSION CONTAMINATION [#15]
  Any version number other than V1. Everything in this rebuild is V1.
  Version numbers like v2, v3, v0.1, v15 are artifacts from the old
  build. They were never intentionally assigned during the rebuild.

SELF-CERTIFIED COMPLETENESS [#8, #13]
  The pattern that caused the original rot: a session reports a file as
  "clean" or "complete" without independent verification. The Recursion
  Repair gate system exists to prevent this. Every file must pass
  through SPEC → BUILD → AUDIT → PASS with adversarial verification
  before it is trusted. No session self-certifies.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Terminal commands for mechanical verification. Output does not pass
through Claude — run these directly.

  Phantom references:
    grep -rn "TAGGER SCHEMA" DESIGN/
    grep -rn "RESONANCE ENGINE SCHEMA" DESIGN/
    grep -rn "SCHEMA_PROTOCOL" PROTOCOL/
    grep -rn "DEPENDENCY_MAP" PROTOCOL/

  Old file path headers:
    grep -rn "_schema_v1\|_system_v1" DESIGN/Systems/

  Old architecture:
    grep -rn "IDB\|IndexedDB" DESIGN/
    grep -rn "data\.js\|emergence\.js\|schema\.js" DESIGN/

  arcPhase:
    grep -rn "arcPhase" DESIGN/ PROTOCOL/ CLAUDE.md

  Wrong threshold IDs:
    grep -rn "\bt0[1-9]\b\|\bt1[0-2]\b" DESIGN/

  Stale counts:
    grep -rn "43 sections\|46 domains\|8 groups" DESIGN/ api/

  Formatting corruption:
    grep -rn "╔\|╗\|║\|╚\|╝" DESIGN/Systems/

  Version contamination:
    grep -rn "v[0-9]\|V[2-9]" DESIGN/Systems/

  Page code VOI:
    grep -rn "VOI" DESIGN/

  Wrong framework name:
    grep -rn "Threshold Studies" DESIGN/
