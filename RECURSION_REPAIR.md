# RECURSION_REPAIR.md
# Aelarian Archives — Recursion Repair Gate System
# Last updated: April 2026

---

## PURPOSE

This gate system applies to every file type and every piece of code.
All phases must pass before first output reaches disk. No exceptions.
No phase may be skipped, reordered, or combined. Hooks enforce this
mechanically — Claude cannot bypass the gates.

This is not a guideline. This is not a recommendation. This is a
non-negotiable gate that exists because prior sessions reported files
as clean when they were not. The gap was that the executor and the
verifier were the same entity. Recursion Repair separates them:
Claude executes, the hooks gate, Sage approves the SPEC, and the
AUDIT is adversarial by design.

---

## PHASE: SPEC

Before anything is written, Claude produces:
  - Goal — what this file or function will do
  - Assumptions — what is being taken as true, named explicitly
  - Risks — what could go wrong, including:
    - Edge cases
    - Invalid inputs
    - Race conditions (if relevant)
    - State corruption scenarios
  - Invariants — what must remain true before and after
  - Test strategy — how correctness will be verified
  - Files — every file this change touches or could affect

No code is allowed in this phase. The SPEC is plain language only.
Sage reviews and approves the SPEC before BUILD begins.

---

## PHASE: BUILD

Implement tests first. Then code.

Tests are written and committed before the implementation they test.
The implementation is written against the approved SPEC only. Any
deviation from the SPEC during implementation is named and stopped —
not silently absorbed.

---

## PHASE: AUDIT

Assume the BUILD is flawed.

Claude MUST:
  1. Attempt to break the implementation
  2. Identify mismatches between code and SPEC
  3. Identify untested paths
  4. Identify silent failure risks
  5. Suggest minimal fixes

Output is FAIL or PASS.
If FAIL: exact issues listed with exact fixes.

The AUDIT is adversarial. It does not confirm the BUILD — it tries
to destroy it. If it cannot break it, it passes.

---

## PHASE: REPAIR (if needed)

Apply ONLY the minimal fixes required to satisfy AUDIT.

DO NOT rewrite everything.
DO NOT introduce new behavior.
DO NOT expand scope beyond what the AUDIT identified.

After REPAIR, re-run AUDIT. The cycle continues until PASS.

---

## ENFORCEMENT

These phases are enforced by hooks in settings.json. A PreToolUse
hook blocks Write and Edit operations until phase requirements are
met. Phase state is tracked mechanically. Claude cannot self-certify
completion of a phase — the hooks verify it.

---

## RELATIONSHIP TO OTHER ROOT DOCUMENTS

**ENTROPY_EXCAVATION.md** — the audit process and checklist. Defines
HOW to audit a file: the 15-category checklist, project-specific rot
patterns, and the verified file list. Recursion Repair defines the
gate system (SPEC → BUILD → AUDIT → PASS). Entropy Excavation
defines what the AUDIT phase checks against. Files that pass through
the full gate AND are declared complete by Sage are added to
ENTROPY_EXCAVATION.md's VERIFIED list. Sage approves every addition.

**ROT_REGISTRY.md** — the living record. Every rot term, drift event,
and contamination ever found. Recursion Repair produces findings.
The registry records them. Any finding that surfaces during an AUDIT
phase is logged in the registry before the session closes.

**CLAUDE.md** — references this file. The rule that Recursion Repair
is non-negotiable lives in CLAUDE.md. The full gate system lives here.
