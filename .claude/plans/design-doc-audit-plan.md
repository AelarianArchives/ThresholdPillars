# Design Document Audit and Extraction Plan
# Aelarian Archives
# Created: 2026-04-09 (session 38)
# Updated: 2026-04-09 (session 39 — methodology refinements from Tier 1)


## Context

design-session-plan.md is a ~5,550-line working surface that has accumulated
38+ sessions of design decisions, resolved questions, removed sections, and
drift alongside confirmed specs across 8 build tiers. Sage is spending half
her time containing drift instead of developing. The verified DESIGN/ specs
are the actual source of truth (33 files on VERIFIED list). The design doc
is a working surface, not an authority.


## Goal

Tier-by-tier deep analysis cross-referencing every claim against verified
specs. Categorize all material. Extract confirmed content into a clean
document. Retire the old one.


---
## Audit Methodology


### Per-tier execution order (refined after Tier 1):

**Step 1 — Sage Truth Check (FIRST, before any audit)**

For every tier, before cross-referencing begins, present Sage a
plain-language build summary:
- What this tier is — what it covers, what it builds
- What specs exist for it (verified vs unverified vs none)
- What the actual build state is — locked, waiting on schemas, blocked,
  not started
- Any known issues or drift items already spotted

Sage reads this and confirms it matches her understanding of the tier.
If something doesn't match, it gets flagged and resolved BEFORE the
audit runs. This is the gremlin gate — where "something Sage approved
that Sage never knew about" gets caught. Auditing against a drifted
understanding produces drifted results.

**Step 2 — Read tier section and all mapped specs**

Read the design doc tier section completely. Read every verified spec
mapped to this tier completely.

**Step 3 — Cross-reference (5 checks per claim)**

For every design claim:
1. Spec existence — does a verified DESIGN/ spec exist for this?
2. Spec alignment — do field names, enums, workflows, contracts match?
3. Gap detection — items in doc with no spec (designed but never written)
4. Drift detection — claims that contradict a verified spec, stale values,
   cross-refs to removed sections
5. Dead material — strikethroughs, REMOVED, dropped fields, superseded
   designs

**Step 4 — Cross-file spec consistency check**

Check verified specs against EACH OTHER for the same tier. A design
claim can match Spec A but contradict Spec B when both describe the
same concept. This is where misalignment between workflow specs and
database specs hides.

Specific checks:
- Status enums: does every spec that references a status use the same
  values? If a workflow spec and a DB spec describe the same entity's
  lifecycle, do the states align or is a mapping documented?
- Field names: does every spec that references a field use the same
  name? (observation_type vs observation_presence, chunk_order vs
  chunk_number)
- Database location: if multiple specs reference where data is stored,
  do they agree? (SQLite vs PostgreSQL)
- Ownership claims: if two specs both claim to own the same field or
  process, flag the overlap

**Step 5 — Internal design doc consistency check**

Check the design doc tier section against ITSELF. The same concept
may appear in multiple subsections with different values:
- Same field with different enum values in different subsections
- Same field with different names in different subsections
- A field described as "dropped" in one place but still referenced
  in another
- Numeric values that appear in multiple places with different numbers

**Step 6 — Categorize**

Categories (one per item):
- CONFIRMED — matches verified spec. Extracts verbatim.
- DRAFT — designed, no verified spec. Transfers with DRAFT marker.
- DEAD — removed/superseded. Does not transfer.
- DRIFT — contradicts spec or introduces unapproved behavior. Flagged
  for Sage.
- DECISION CONTEXT — resolved questions, reasoning trails. Goes to
  appendix.

**Step 7 — Write audit artifact**

Each tier produces an artifact at .claude/audits/design-doc-audit-tier-N.md
with required sections: Task, Files examined, Findings, Conclusion.

**Step 8 — Sage reviews and approves before next tier begins**


---
## Tier-to-Spec Mapping


### Tier 1 — INT Engine + Deposit Foundation (lines 203-1287, COMPLETE)

Specs: INTEGRATION SCHEMA, INTEGRATION DB SCHEMA, SYSTEM_ Integration,
SYSTEM_ Integration DB, COMPOSITE ID SCHEMA, SYSTEM_ Composite ID,
TAGGER SCHEMA, SYSTEM_ Tagger, OPERATIONAL DB SCHEMA (all VERIFIED).

Note: EMBEDDING PIPELINE SCHEMA is mapped here in the original plan but
covers archive-level embedding only. Deposit-level embedding is defined
in INTEGRATION SCHEMA.md. Both valid — different scopes.

**Status: AUDITED (session 39).** 13 CONFIRMED, 2 DRIFT (fixed),
4 DEAD, 0 DRAFT. 5 fixes applied to INTEGRATION SCHEMA.md. Artifact:
.claude/audits/design-doc-audit-tier-1.md


### Tier 2 — Black Pearl + Pages + Void (lines 1289-2166, COMPLETE)

Specs: SYSTEM_ Frontend (VERIFIED — content approval pending, see
ROT ENTRY 006), OPERATIONAL DB SCHEMA (VERIFIED), SECTION MAP,
PAGE_LAYOUTS.md (null — Sage building separately)

**Status: TRUTH CHECK COMPLETE (session 40).** 6 contamination items
found in SYSTEM_ Frontend.md and design doc. Logged in ROT ENTRY 006.
ROT_OPEN.md has 7 action items. Batch 1 (rot logging) done. Batch 2
(section-by-section review with Sage) is next session. Batch 3
(SYSTEM_ Frontend.md corrections) follows.

**Modified methodology for Tier 2:** No auto-confirming against
SYSTEM_ Frontend.md — the spec itself contains unauthorized content.
Every section presented to Sage individually for yes/no/modified.

**Already categorized:**
  DEAD: sub-rhythms, curation panel, Reflective Pearl Constellation
  DRIFT: error states standalone (belongs in Pulse)
  WRONG: Black Pearl direction (left not right), Observatory order
  DEAD (design doc): Page Identity type system (REMOVED session 33),
    Page-Type Layout Anatomy (REMOVED session 33), Session Opening
    Ritual (REMOVED session 32), Research Velocity Indicator
    (REMOVED session 32)
  CONFIRMED (Sage, this session): failure modes (keep)
  STALE: components list (full-project inventory, not Tier 2)

**Remaining sections needing Sage review (Batch 2):**
  Black Pearl UI, Void page 51, UI Architecture Foundation,
  Shared Shell + Navigation Contract, Deposit Card Component,
  Page Load + Empty State, Black Pearl Panel Interaction Spec,
  Session Schema, Instance Context, Deposit Weight AI Suggestion,
  Observatory Spec (nodes confirmed, details need review),
  Duplicate Prevention on Re-Route, Engine Baseline Recalibration,
  AOS, Deposit Genealogy View, Annotation Layer, WSC HOLDING note,
  Resolved Questions, Pipeline Segment


### Tier 3 — Axis Engines + Ven'ai (lines 2168-2938, DESIGNED)

Specs: Engine schemas per page (THR, ECR, INF, SNM, STR) + Ven'ai
Service + TAG VOCABULARY (exist on disk, NOT on VERIFIED list except
TAG VOCABULARY)


### Tier 4 — MTM + Nexus + WSC + LNV + Void Engine (lines 2940-4511, COMPLETE)

Specs: METAMORPHOSIS SCHEMA, PATTERN CONVERGENCE SCHEMA, SIGNAL GRADING
SCHEMA, DRIFT TAXONOMY SCHEMA, DAILY NEXUS ROUTINE SCHEMA (all VERIFIED).
VOID ENGINE SCHEMA, WSC SCHEMA, LNV SCHEMA (exist, not verified)


### Tier 5 — Cosmology + ARTIS (lines 4513-5244, DESIGNED)

Specs: ARTIS SCHEMA, COSMOLOGY SCHEMA (exist, not verified)


### Tier 6 — Research Assistant + Audio (lines 5248-5327, COMPLETE)

Specs: SYSTEM_ Research Assistant + 6 companion specs (all VERIFIED),
RESONANCE ENGINE PHYSICS SPEC (VERIFIED), RESONANCE ENGINE AUDIO SPEC
(exists, not verified)


### Tier 7 — Observatory + Notifications + Export (lines 5329-5549+, PARTIAL)

Specs: PIPELINE CONTRACT 1 (exists, not verified). Most items have no
specs.


### Tier 8 — Stress Test + SOT (quick ref only, NOT STARTED)

Specs: None.


---
## Execution Order


One tier at a time. Sage reviews each before next proceeds.

**Session A: Tiers 1-2**
~2,000 lines of design doc, ~12 verified spec files. Both COMPLETE with
verified specs. Establishes methodology on best-documented tiers. Highest
CONFIRMED yield.
Tier 1: DONE (session 39).

**Session B: Tier 3**
~770 lines, 14 spec files (mostly unverified). First DRAFT items appear.
Sets pattern for unverified-but-existing specs.

**Session C: Tier 4**
~1,570 lines, largest tier. MTM two-pass, Void two-layer, WSC, LNV. Most
complex cross-referencing. Full session.

**Session D: Tiers 5-6**
~1,080 lines combined. Tier 5 has 4 unverified specs. Tier 6 is short
with 7 verified specs.

**Session E: Tier 7-8 + Preamble + Cross-tier + Decisions Log**
~1,500 lines, minimal spec cross-referencing (most items NOT STARTED).
Mostly categorization.

**Session F: Extraction**
Build clean document from all approved audit artifacts. Write decision
context appendix. Verify. Retire old doc.


---
## Extraction (after full audit)


### New document: .claude/plans/design-build-spec.md

- Only CONFIRMED + DRAFT material
- Tier status markers: LOCKED / DESIGNED / PARTIAL / NOT STARTED
- No strikethroughs, no session history, no resolved questions inline
- No session numbers in body (describes WHAT, not WHEN)
- Preamble trimmed to essential context (~30 lines)


### Decision context appendix: .claude/plans/design-decision-context.md

- All resolved questions with answers
- Key reasoning trails and load-bearing decisions
- Trimmed Decisions Log (stale entries removed)


### Retirement

- Old doc moved to Retired/ with date suffix
- References updated in any project files that point to it
- Git commit with clear provenance


---
## Drift Already Spotted (pre-audit)


5 items found during structural mapping, before formal audit:

1. Quick Ref line 107: WSC DESIGN listed as "HOLDING" — but WSC was fully
   designed in session 19 (Tier 4, lines 3797-4206). Stale.
2. Quick Ref line 97: TRIA (#13) listed as unchecked — resolved session 38
   (confirmed this session). Stale.
3. Decisions Log line 6028: "WSC gets RESEARCHER NOTE optional field" —
   explicitly reversed in session 19 (WSC design: "No researcher voice in
   WSC"). Stale.
4. VOID ENGINE SCHEMA.md line 35: References "Dashboard" — should say
   "Observatory" per session 31 rename. (Spec-level issue, not design doc.)
5. Decisions Log line 6039: Lists deposit_depth: deep | standard |
   fragment — dropped in session 15. Log doesn't note the drop.


---
## Session 39 Lessons (folded into methodology)

Three methodology refinements based on Tier 1 audit:

1. **Truth check moved to Step 1.** Originally placed after the audit.
   Moved to first because auditing against a drifted understanding
   produces drifted results. Sage verifies her understanding of the tier
   BEFORE cross-referencing begins.

2. **Cross-file spec consistency check added (Step 4).** Tier 1 found
   INTEGRATION SCHEMA.md and INTEGRATION DB SCHEMA.md disagreeing on
   batch processing table structure, status enums, and database location.
   Both were verified files. The design doc matched the stale spec, making
   the drift invisible to a design-doc-vs-spec check alone. Specs must
   be checked against each other.

3. **Internal design doc consistency check added (Step 5).** Tier 1 found
   the design doc using "observation_type" in two places where it meant
   "observation_presence," and listing source_format with 7 values in one
   section but 6 in another. Same-tier inconsistencies within the design
   doc itself need a dedicated check.
