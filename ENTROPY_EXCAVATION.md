ENTROPY EXCAVATION
/ENTROPY_EXCAVATION.md
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

A file is added to this list when ALL THREE conditions are met:
  1. File passes adversarial audit (Recursion Repair AUDIT phase)
  2. File is complete — not in progress, not a draft, not mid-build
  3. Sage explicitly approves its addition

Passing audit alone does not qualify. A file can pass audit mid-build
and still take weeks to complete. Sage's approval is the final gate.
No file is added to this list without Sage's explicit confirmation.

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
    Entropy scan: 0 findings (2026-04-07)

  TAGGER SCHEMA.md
    Verified: 2026-04-06
    Commit: 05a402f
    Scope: clean V1 rewrite from contract — prompt blocks (tag, phase_state,
    elarianAnchor, doc_type), API request/response shapes, sequences,
    tagger store shape, 8 failure modes
    Gate: SPEC → BUILD → AUDIT → PASS
    Entropy scan: 0 findings (2026-04-07)

  COMPOSITE ID SCHEMA.md
    Verified: 2026-04-06
    Commit: 3e445c8
    Scope: Elarian Anchor prompt block removed (moved to TAGGER SCHEMA),
    both BUILD FLAGS updated to COMPLETE
    Gate: SPEC → BUILD → AUDIT → PASS

  METAMORPHOSIS SCHEMA.md
    Verified: 2026-04-07
    Scope: clean V1 rewrite — all formatting corruption removed (box-drawing,
    escaped underscores/brackets, wall-of-text), finding_type removed from
    validation criteria (field did not exist in response format or store),
    cross-file fix in RESEARCH ASSISTANT EMBEDDING SCOPE.md (finding_type +
    confidence → title + source_page_codes)
    Gate: SPEC → BUILD → AUDIT → PASS
    Entropy scan: 0 findings (2026-04-07)

  INTEGRATION SCHEMA.md
    Verified: 2026-04-07
    Scope: targeted fixes — box-drawing header replaced, V2 version refs
    reworded to "Launch" / "Swarm phase" (not version contamination — refers
    to Ollama swarm wiring phase), stale BUILD FLAG on doc_type resolved
    (COMPOSITE ID SCHEMA already verified COMPLETE)
    Gate: SPEC → BUILD → AUDIT → PASS
    Entropy scan: 1 finding (false positive on split_flag field name).
    KIN+VEN BUILD FLAG resolved 2026-04-07: KIN confirms first, VEN is
    dependent write tracked via ven_pair_status on KIN record, both
    blocked until retry clears VEN on failure.
    Cross-file scan: 33 references across 14 files — all clean

  SYSTEM_ Research Assistant.md
    Verified: 2026-04-07
    Scope: scanner findings are false positives — "23 sections" refers to
    research posture document sections (not archive sections), "RESEARCH
    ASSISTANT SCHEMA.md" is a planned file (not yet written, forward ref)
    Entropy scan: 3 findings (all false positives)

  RESEARCH ASSISTANT EMBEDDING SCOPE.md
    Verified: 2026-04-07
    Scope: cross-file fixes from MTM rewrite (finding_type→title+source_page_codes)
    and Emergence (seven→eight detectors). Pre-existing phantom ref
    "PIPELINE SCHEMA.md" is shorthand for EMBEDDING PIPELINE SCHEMA.md.
    BUILD FLAG on field name is false positive.
    Entropy scan: 2 findings (both false positives/pre-existing)

  RESEARCH ASSISTANT COSMOLOGY BRIDGE.md
    Verified: 2026-04-07
    Scope: 0 real findings. Scanner phantom "ARCHIVE ACCESS.md" is
    truncated match — actual text says "RESEARCH ASSISTANT ARCHIVE ACCESS.md"
    which exists.
    Entropy scan: 1 finding (false positive)

  RESEARCH ASSISTANT ARCHIVE ACCESS.md
    Verified: 2026-04-07
    Scope: 0 findings. No changes required.
    Entropy scan: 0 findings (2026-04-07)

  RESEARCH ASSISTANT OBSERVATION ARTICULATION.md
    Verified: 2026-04-07
    Scope: 0 findings. No changes required.
    Entropy scan: 0 findings (2026-04-07)

  RESEARCH ASSISTANT HYPOTHESIS FRAMING.md
    Verified: 2026-04-07
    Scope: 0 findings. No changes required.
    Entropy scan: 0 findings (2026-04-07)

  RESEARCH ASSISTANT RESEARCH POSTURE.md
    Verified: 2026-04-07
    Scope: 0 findings. No changes required.
    Entropy scan: 0 findings (2026-04-07)

  SYSTEM_ Frontend.md
    Verified: 2026-04-07
    Scope: targeted fix — phantom ref "RESONANCE ENGINE SCHEMA.md" corrected
    to "RESONANCE ENGINE PHYSICS SPEC.md"
    Entropy scan: 0 findings (2026-04-07)

  SYSTEM_ FastAPI.md
    Verified: 2026-04-07
    Scope: 0 findings. No changes required.
    Entropy scan: 0 findings (2026-04-07)

  SYSTEM_ Composite ID.md
    Verified: 2026-04-07
    Scope: 0 findings. No changes required.
    Entropy scan: 0 findings (2026-04-07)

  SIGNAL GRADING SCHEMA.md
    Verified: 2026-04-07
    Scope: targeted fix — box-drawing header replaced, old file path corrected
    Entropy scan: 0 findings (2026-04-07)

  PATTERN CONVERGENCE SCHEMA.md
    Verified: 2026-04-07
    Scope: targeted fix — box-drawing header replaced, old file path corrected
    Entropy scan: 0 findings (2026-04-07)

  DRIFT TAXONOMY SCHEMA.md
    Verified: 2026-04-07
    Scope: targeted fix — box-drawing header replaced, old file path corrected
    Entropy scan: 0 findings (2026-04-07)

  RESONANCE ENGINE PHYSICS SPEC.md
    Verified: 2026-04-07
    Scope: targeted fix — box-drawing header replaced
    Gate: SPEC → BUILD → AUDIT → PASS
    Entropy scan: 0 findings (2026-04-07)

  SYSTEM_ Resonance Engine.md
    Verified: 2026-04-07
    Scope: 0 findings pre-audit. No changes required.
    Entropy scan: 0 findings (2026-04-07)

  OPERATIONAL DB SCHEMA.md
    Verified: 2026-04-07
    Scope: targeted fix — box-drawing header replaced, old file path corrected
    Gate: SPEC → BUILD → AUDIT → PASS
    Entropy scan: 0 findings (2026-04-07)

  EMBEDDING PIPELINE SCHEMA.md
    Verified: 2026-04-07
    Scope: targeted fix — box-drawing header replaced, old file path corrected
    Gate: SPEC → BUILD → AUDIT → PASS
    Entropy scan: 0 findings (2026-04-07)

  DAILY NEXUS ROUTINE SCHEMA.md
    Verified: 2026-04-07
    Scope: targeted fix — box-drawing header replaced
    Gate: SPEC → BUILD → AUDIT → PASS
    Entropy scan: 0 findings (2026-04-07)

  SYSTEM_ Daily Nexus Routine.md
    Verified: 2026-04-07
    Scope: 0 findings pre-audit. 1 scanner false positive on lnv_notified
    flag field name.
    Entropy scan: 1 finding (false positive)

  THREAD TRACE SCHEMA.md
    Verified: 2026-04-07
    Scope: targeted fix — box-drawing header replaced
    Gate: SPEC → BUILD → AUDIT → PASS
    Entropy scan: 0 findings (2026-04-07)
    Cross-file scan: 1 external reference — clean

  SYSTEM_ Thread Trace.md
    Verified: 2026-04-07
    Scope: 0 findings pre-audit. No cascade from THREAD TRACE SCHEMA fix.
    Gate: verified by entropy scan — no changes required
    Entropy scan: 0 findings (2026-04-07)

  ARCHIVE SCHEMA.md
    Verified: 2026-04-07
    Scope: targeted fixes — box-drawing header replaced, V2 version ref
    reworded to "future phase" (sealed record enforcement note)
    Gate: SPEC → BUILD → AUDIT → PASS
    Entropy scan: 0 findings (2026-04-07)
    Cross-file scan: 8 external references — all clean

  SYSTEM_ Archive.md
    Verified: 2026-04-07
    Scope: targeted fix — V2 version ref reworded to "future phase"
    (sealed record chain of custody note)
    Gate: SPEC → BUILD → AUDIT → PASS
    Entropy scan: 0 findings (2026-04-07)

  EMERGENCE SCHEMA.md
    Verified: 2026-04-07
    Scope: targeted fix — box-drawing header replaced. VOI references
    are correct (Void engine page exists, mid-build when rot interrupted).
    Gate: SPEC → BUILD → AUDIT → PASS
    Entropy scan: 0 real findings. Prior note "VOI phantom" was a
    scanner limitation at time of writing — VOI is page 52 (Void),
    standalone section, confirmed in SECTION MAP.md. (ROT 016, session 63)

  SYSTEM_ Emergence.md
    Verified: 2026-04-07
    Scope: targeted fix — "seven detectors" → "eight detectors".
    VOI reference correct (same as EMERGENCE SCHEMA).
    Gate: SPEC → BUILD → AUDIT → PASS
    Entropy scan: 0 real findings. Prior note "VOI phantom" was same
    scanner limitation — resolved. (ROT 016, session 63)

  SWARM ARCHITECTURE SCHEMA.md
    Verified: 2026-04-07
    Scope: targeted fix — box-drawing header replaced, old file path
    corrected (/DESIGN/systems/ → /DESIGN/Systems/)
    Gate: SPEC → BUILD → AUDIT → PASS
    Entropy scan: 2 findings (both false positives — parallax_flag
    field names matched by BUILD FLAG scanner pattern)
    Cross-file scan: no external references — no cascade possible

  SYSTEM_ Integration DB.md
    Verified: 2026-04-07
    Scope: targeted fix — old IDB reference removed from Alembic section
    Gate: SPEC → BUILD → AUDIT → PASS
    Entropy scan: 0 findings (2026-04-07)

  SYSTEM_ Integration.md
    Verified: 2026-04-07
    Scope: 0 findings pre-audit. Cascade check against INTEGRATION SCHEMA.md
    and INTEGRATION DB SCHEMA.md fixes — no contamination found. Content
    consistent with both verified schemas.
    Gate: verified by entropy scan + cascade audit — no changes required
    Entropy scan: 0 findings (2026-04-07)

  INTEGRATION DB SCHEMA.md
    Verified: 2026-04-07
    Scope: targeted fixes — box-drawing header replaced, old file path
    corrected, IDB/IndexedDB reference removed, "Threshold Studies" →
    "Threshold Pillars", phantom "PIPELINE SCHEMA.md" → "EMBEDDING PIPELINE
    SCHEMA.md", old "data.js" reference removed
    Gate: SPEC → BUILD → AUDIT → PASS
    Entropy scan: 3 findings (all false positives — scanner matches
    "FLAG —" in schema field names parallax_flag and split_flag)
    Cross-file scan: 23 references across 16 files — all clean

  SYSTEM_ Metamorphosis.md
    Verified: 2026-04-07
    Scope: 0 findings pre-rewrite, 0 findings post-rewrite. No cascade from
    METAMORPHOSIS SCHEMA.md clean rewrite. Content consistent with rewritten
    schema.
    Gate: verified by entropy scan — no changes required
    Entropy scan: 0 findings (2026-04-07)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UNVERIFIED — KNOWN ISSUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files with known issues from the rot contamination report (2026-04-06).
These are not trusted until they pass through the gate.

RESOLVED (session 27 audit remediation, 2026-04-08):

  All CRITICAL items resolved. The following files were verified
  through the Entropy Excavation gate and now appear in the
  VERIFIED section above:
    SYSTEM_ Composite ID.md, SYSTEM_ Thread Trace.md,
    THREAD TRACE SCHEMA.md, SYSTEM_ Emergence.md,
    EMERGENCE SCHEMA.md, DRIFT TAXONOMY SCHEMA.md,
    EMBEDDING PIPELINE SCHEMA.md, SYSTEM_ Frontend.md,
    SYSTEM_ FastAPI.md

  HIGH items resolved:
    API prompts — counts corrected to 51 sections / 9 groups
    CLAUDE.md — arcPhase reference removed (prior session)
    SIGNAL GRADING SCHEMA.md — verified clean
    PATTERN CONVERGENCE SCHEMA.md — verified clean
    METAMORPHOSIS SCHEMA.md — verified clean
    Witness Scroll page codes — Manifest_46 corrected (21, 38)

STILL OPEN:

  PROTOCOL files
    DEPENDENCY_MAP.json contains only old-build refs.
    Scheduled for Fix 6 (clear and defer to core files phase).

  ARCPHASE_ROT_CLEANUP.md — RETIRED (content transferred to ROT_REGISTRY.md)
  SOT_BUILD_TODO.md — RETIRED (content transferred to ROT_REGISTRY.md)

BLOCKING DECISIONS (not file fixes):

  SEED AFFINITY AUTHORITY — RESOLVED 2026-04-14 (session 53)
    SECTION MAP is canonical. All five Axis domain files corrected
    to match SECTION MAP: Domain_StarRoot.txt, Domain_Infinite_Intricacy.txt,
    Domain_Echo_Recall.txt, Domain_Sat_Nam.txt, Domain_THR.txt (was already
    correct). ROT ENTRY 010 logged in ROT_REGISTRY.md. Tagger build
    unblocked on seed affinity.


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
  Page codes referenced that do not exist in SECTION MAP.md.
  No current known phantoms. VOI was listed here previously but is
  confirmed as page 52 (Void), standalone section in SECTION MAP.md.
  (ROT 016, session 63 — scanner fixed session 38)

UNSOURCED PROTECTION CLAUSES [#8, #14]
  Any rule of the form "do not flag X," "X is correct," or "never
  correct X" that cannot point to a named canonical source (a specific
  file and section). Protection clauses without canonical backing are a
  rot persistence vector — they cause errors to survive correction by
  being mistaken for intentional invariants.
  Rule defined in: CLAUDE.md BEHAVIORAL RULES.
  Prior instance: morphogy — Claude spelling error encoded as a
  protected invariant in CLAUDE.md KEY INVARIANTS for one month.
  Resolved ROT 015, session 63.
  Search: grep for "never flag\|do not flag\|is correct\|never correct"
  in CLAUDE.md and any protocol docs. Verify each has a canonical source.

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
