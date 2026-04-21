# SPEC: hooks/recursion_repair_gate.py

## Goal

Add a STATUS marker check to the `spec_approved` branch of
`recursion_repair_gate.py`. The gate currently validates SPEC
structure and hash but does not verify that the SPEC carries a
terminal status marker. A SPEC missing `STATUS: APPROVED` or
`STATUS: FINAL` in its header will be blocked from having BUILD
work performed against it.

This closes the named gap in RECURSION_REPAIR.md section 6.

## Assumptions

- SPEC files live at `.claude/specs/<path>.spec.md` per the
  existing convention in `phase_control.py`.
- Every valid SPEC starts with a `# SPEC:` title line.
- The STATUS marker appears on its own line between the title
  line and the first `##` section header.
- Valid STATUS values are exactly `APPROVED` and `FINAL`.
  Key and value are case-sensitive. Whitespace between
  `STATUS:` and the value is flexible (zero or more spaces).
- The new check runs in the `spec_approved` branch only,
  BEFORE existing structure validation, so that an
  unfinalized SPEC fails with the clearer STATUS error rather
  than a cascade of structure errors.
- SPEC content is already loaded into memory at the point the
  new check runs (lines 322-329 of the current gate). No new
  file reads are introduced.
- The check is author-agnostic. It does not distinguish
  Claude-authored SPECs from Antigravity-authored SPECs.
- Test path convention for this project is `tests/<mirror of
  source path>/test_<name>.py`, established by this work unit.
- Test runner is pytest.
- This work unit does not modify `phase_control.py`. If
  `approve` should also validate STATUS, that is a follow-up
  work unit.

## Risks

### Edge cases

- SPEC with multiple STATUS lines in the header zone: first
  valid STATUS wins; search stops there.
- SPEC with blank lines between `# SPEC:` and `STATUS:`:
  accepted. Blank lines do not terminate the header zone.
- SPEC with CRLF line endings (`\r\n`): `.split("\n")` leaves
  `\r` on lines, but `.strip()` removes it. Verify in tests.
- SPEC where STATUS is the literal first line of the file
  (before any `# SPEC:` title): rejected. Title line is
  required to establish the header zone.
- SPEC with trailing whitespace on the STATUS line: handled
  by `.strip()`.

### Invalid inputs

- Empty SPEC file: rejected with "missing title" message.
- SPEC without `# SPEC:` line: rejected with clear message.
- SPEC with `STATUS: DRAFT`, `STATUS: pending`, or any other
  non-terminal value: rejected, message names the actual value.
- SPEC with `Status: APPROVED` (wrong-case key): rejected.
  No STATUS line detected — the key is case-sensitive.
- SPEC with `STATUS: approved` (wrong-case value): rejected,
  message names the actual value.
- SPEC where STATUS appears only inside body text (after the
  first `## ` header): ignored. Header-zone parsing stops at
  the first `##`.
- SPEC with `STATUS: APPROVED and locked` (valid value plus
  extra text): rejected as invalid value.

### Race conditions

- SPEC file edited concurrently with the gate's read: the
  gate performs a single read. Tearing is not protected
  against by this check and is not protected against
  elsewhere in the gate. Out of scope for this work unit.

### State corruption scenarios

- `phase_state.json` records `spec_approved` but the SPEC
  file on disk lacks STATUS: the gate blocks writes until
  STATUS is added. This is the intended behavior — it
  surfaces an inconsistency between `phase_control.py
  approve` (which does not currently require STATUS) and
  the new gate check. Resolution: Sage adds STATUS to the
  SPEC and re-approves, which regenerates the hash.
- SPEC with valid STATUS at approval, STATUS line edited
  later: caught by Gate 5 (hash mismatch, post-renumber)
  rather than by the new check. Correct layering.

## Invariants

- Gates 1, 2, and all gates after the new check retain
  their current blocking behavior unchanged.
- Gate 12 (hook crash = blocked, post-renumber) retains
  fail-closed posture.
- The new check adds no file reads. It inspects content
  already loaded into memory.
- The check runs exclusively in the `spec_approved` branch.
- Files exempted via `EXEMPT_PREFIXES` / `EXEMPT_SUFFIXES`
  remain exempt. The STATUS check does not apply to them.
- The check is deterministic: same SPEC content produces the
  same result on every invocation.

## Test strategy

Unit tests against a new pure function `check_status_marker(
spec_content: str) -> tuple[bool, str]` covering every case
named under Edge cases and Invalid inputs above, plus:

- Valid SPEC with `STATUS: APPROVED` → returns (True, "").
- Valid SPEC with `STATUS: FINAL` → returns (True, "").
- Valid SPEC with `STATUS:APPROVED` (no space) → returns
  (True, "").
- Valid SPEC with `STATUS:   APPROVED` (extra spaces) →
  returns (True, "").

Tests run as a standalone pytest module; no integration tests
against the full gate in this work unit. The pure function's
correctness is what the gate check depends on.

## Test files

- tests/hooks/test_status_marker.py

## Files

- hooks/recursion_repair_gate.py
- tests/hooks/test_status_marker.py
- RECURSION_REPAIR.md
