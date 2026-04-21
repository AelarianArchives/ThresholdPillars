# AUDIT: hooks/recursion_repair_gate.py

## Break attempts

- **Unicode in STATUS value.** `STATUS: APPRÖVED` — rejected
  (value not in VALID_STATUS_VALUES). Correct.
- **Single-line SPEC with STATUS on title line.** `# SPEC: foo.py STATUS: APPROVED` —
  treated as title only, STATUS not detected on its own line,
  rejected with "no STATUS marker found." Correct.
- **STATUS with inline trailing text.** `STATUS: APPROVED # approved by sage` —
  value parses as `"APPROVED # approved by sage"`, not in
  VALID_STATUS_VALUES, rejected. Correct.
- **Multiple STATUS lines in header zone.** First valid value wins;
  subsequent STATUS lines ignored. Tested.
- **Multiple `# SPEC:` lines.** Second occurrence harmless — the
  startswith match on `# SPEC:` is idempotent; state flags stay
  True. Correct.
- **BOM prefix on title line.** `"\ufeff# SPEC: foo.py"` — `startswith("# SPEC:")`
  returns False because of the BOM character. Function reports
  "missing title." Minor edge case. Consumer's SPEC files should
  not carry BOMs; the existing `validate_spec_structure` has the
  same limitation.
- **SPEC with `##Goal` (no space).** Does not match
  `startswith("## ")`. Header-zone parsing continues past it.
  STATUS check would find a marker after such a line. This is
  benign because the structure validator (Gate 4) rejects
  malformed headers immediately after.

## SPEC mismatches

None detected. The implementation matches every Assumption and
Invariant in the SPEC:

- Check runs in `spec_approved` branch only: verified.
- Check runs BEFORE structure validation: verified.
- No new file reads: verified (operates on already-loaded
  `spec_content`).
- Case-sensitive key and value: verified.
- Flexible whitespace around the colon: verified.
- Author-agnostic: verified (no authorship inspection anywhere).
- Deterministic: verified (pure function over string input).
- `phase_control.py` unmodified: verified.

The SPEC Assumption referenced "lines 322-329 of the current
gate" as the load point. Post-edit line numbers shifted (the
check adds ~8 lines of wiring). The intent — "after SPEC
content load, before structure validation" — is preserved. Not
a mismatch; a location reference ages naturally.

## Untested paths

- **Integration wiring.** The pure function is unit-tested (22
  cases, all pass). The wiring into the `spec_approved` branch —
  that `block()` is called with the right message formatting
  when `check_status_marker` returns False — is not integration-
  tested. The SPEC explicitly scoped this out ("no integration
  tests in this work unit"). Named here as a known coverage gap.
- **`spec_approved` branch where SPEC file does not exist on
  disk.** Pre-existing behavior: `block()` is called before the
  new STATUS check. Not changed by this work unit, not tested
  by this work unit.
- **Unicode normalization forms.** Tests cover ASCII content.
  If a SPEC used NFD-normalized Unicode in a STATUS value (e.g.,
  combining characters), behavior is not tested but is expected
  to reject cleanly via the VALID_STATUS_VALUES tuple lookup.

## Silent failure risks

None detected. Every failure path returns an explicit
`(False, reason)` with a non-empty reason. The `block()` call
sites interpolate the reason into the stderr message, so the
block is observable and diagnosable. No exceptions are caught
and swallowed inside `check_status_marker`. If the function
itself were to raise (not currently possible given only string
operations), the outer `try/except` at the bottom of `main()`
enforces fail-closed per Gate 12.

One point of note, not a risk: a SPEC at phase `spec_approved`
in `phase_state.json` whose file on disk lacks STATUS will now
block at first write. This is intended behavior — it surfaces a
pre-existing inconsistency between `phase_control.py approve`
(which does not require STATUS) and the new Gate 3. The
resolution is a follow-up work unit: either add STATUS
validation to `approve`, or document the two-step approval
(approve → add STATUS → re-approve) as the intended flow.

## Result

PASS
