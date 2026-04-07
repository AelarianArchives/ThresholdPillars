#!/usr/bin/env python3
"""
PHASE CONTROL — CLI for managing Recursion Repair phase state.

Usage:
  python hooks/phase_control.py status                    — show all tracked files
  python hooks/phase_control.py status <file>             — show phase for one file
  python hooks/phase_control.py spec <file>               — register SPEC (creates template)
  python hooks/phase_control.py approve <file>            — validate + approve SPEC
  python hooks/phase_control.py build_done <file>         — mark BUILD complete
  python hooks/phase_control.py audit <file>              — create AUDIT template
  python hooks/phase_control.py audit_pass <file>         — validate AUDIT + mark passed
  python hooks/phase_control.py audit_fail <file>         — validate AUDIT + mark failed
  python hooks/phase_control.py repair_done <file>        — mark REPAIR complete
  python hooks/phase_control.py reset <file>              — remove file from tracking
  python hooks/phase_control.py clear                     — clear all phase state

Phase flow (each transition is gated — no skipping):
  spec_pending → spec_approved → build_complete
  → audit_pass (done) OR audit_fail → repair_complete → (re-audit loop)

SPEC validation (enforced mechanically on approve):
  Required sections: Goal, Assumptions, Risks (edge cases, invalid inputs,
  race conditions, state corruption scenarios), Invariants, Test strategy,
  Test files, Files.
  Every section must have content. No code blocks allowed.

BUILD validation (enforced mechanically on build_done):
  - All test files listed in SPEC exist on disk
  - All files listed in SPEC exist on disk
  - SPEC was not modified during BUILD (hash check)

AUDIT validation (enforced mechanically on audit_pass / audit_fail):
  Required sections (always): Break attempts, SPEC mismatches,
  Untested paths, Silent failure risks, Result.
  Additional sections (FAIL only): Issues, Fixes.
  Result must match the command (PASS or FAIL).
  Every required section must have content.
"""

import hashlib
import json
import os
import sys
import datetime

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHASE_STATE_FILE = os.path.join(PROJECT_ROOT, ".claude", "phase_state.json")
SPECS_DIR = os.path.join(PROJECT_ROOT, ".claude", "specs")
AUDITS_DIR = os.path.join(PROJECT_ROOT, ".claude", "audits")

REQUIRED_SECTIONS = [
    "## Goal",
    "## Assumptions",
    "### Edge cases",
    "### Invalid inputs",
    "### Race conditions",
    "### State corruption scenarios",
    "## Invariants",
    "## Test strategy",
    "## Test files",
    "## Files",
]


def load():
    if os.path.exists(PHASE_STATE_FILE):
        try:
            with open(PHASE_STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}


def save(state):
    os.makedirs(os.path.dirname(PHASE_STATE_FILE), exist_ok=True)
    with open(PHASE_STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


def now():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def normalize(path):
    return path.replace("\\", "/")


def get_spec_path(rel_path):
    return os.path.join(SPECS_DIR, rel_path + ".spec.md")


def hash_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return hashlib.sha256(f.read().encode()).hexdigest()


def parse_file_list(spec_content, section_header):
    """Parse file paths from a SPEC section. Expects '- path' format lines.
    Skips entries starting with N/A or None (case-insensitive)."""
    lines = spec_content.split("\n")
    files = []
    in_section = False

    for line in lines:
        stripped = line.strip()
        if stripped == section_header:
            in_section = True
            continue
        if in_section:
            if stripped.startswith("#"):
                break
            if stripped.startswith("- "):
                file_path = stripped[2:].strip()
                if file_path and not file_path.lower().startswith(("n/a", "none")):
                    files.append(file_path)

    return files


def create_spec_template(rel_path):
    spec_path = get_spec_path(rel_path)
    os.makedirs(os.path.dirname(spec_path), exist_ok=True)

    template = f"""# SPEC: {rel_path}

## Goal


## Assumptions


## Risks

### Edge cases


### Invalid inputs


### Race conditions


### State corruption scenarios


## Invariants


## Test strategy


## Test files


## Files

"""
    with open(spec_path, "w", encoding="utf-8") as f:
        f.write(template)

    return spec_path


def validate_spec(rel_path):
    spec_path = get_spec_path(rel_path)

    if not os.path.exists(spec_path):
        return False, f"SPEC file not found at: {os.path.relpath(spec_path, PROJECT_ROOT)}"

    with open(spec_path, "r", encoding="utf-8") as f:
        content = f.read()

    if "```" in content:
        return False, "SPEC contains code blocks. No code allowed in SPEC phase."

    lines = content.split("\n")
    missing = []
    empty = []

    for section in REQUIRED_SECTIONS:
        found = False
        has_content = False

        for i, line in enumerate(lines):
            if line.strip() == section:
                found = True
                for j in range(i + 1, len(lines)):
                    stripped = lines[j].strip()
                    if stripped.startswith("#"):
                        break
                    if stripped:
                        has_content = True
                        break
                break

        if not found:
            missing.append(section)
        elif not has_content:
            empty.append(section)

    if missing:
        return False, f"Missing sections: {', '.join(missing)}"
    if empty:
        return False, f"Empty sections (need content): {', '.join(empty)}"

    return True, "SPEC is complete."


def validate_build(rel_path, state_entry):
    """Validate BUILD is complete: all SPEC-listed files exist, SPEC unchanged."""
    spec_path = get_spec_path(rel_path)

    if not os.path.exists(spec_path):
        return False, "SPEC file missing."

    # Check SPEC was not modified during BUILD
    stored_hash = state_entry.get("spec_hash", "")
    if stored_hash:
        current_hash = hash_file(spec_path)
        if current_hash != stored_hash:
            return False, "SPEC was modified during BUILD. SPEC is immutable after approval."

    with open(spec_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Check all test files exist
    test_files = parse_file_list(content, "## Test files")
    missing_tests = []
    for tf in test_files:
        tf_abs = os.path.join(PROJECT_ROOT, tf)
        if not os.path.exists(tf_abs):
            missing_tests.append(tf)

    if missing_tests:
        return False, f"Test files missing from disk: {', '.join(missing_tests)}"

    # Check all implementation files exist
    all_files = parse_file_list(content, "## Files")
    missing_files = []
    for f in all_files:
        f_abs = os.path.join(PROJECT_ROOT, f)
        if not os.path.exists(f_abs):
            missing_files.append(f)

    if missing_files:
        return False, f"Files missing from disk: {', '.join(missing_files)}"

    return True, "BUILD is complete."


# ── AUDIT ─────────────────────────────────────────────────────────────────────

AUDIT_REQUIRED_SECTIONS = [
    "## Break attempts",
    "## SPEC mismatches",
    "## Untested paths",
    "## Silent failure risks",
    "## Result",
]

AUDIT_FAIL_SECTIONS = [
    "## Issues",
    "## Fixes",
]


def get_audit_path(rel_path):
    return os.path.join(AUDITS_DIR, rel_path + ".audit.md")


def create_audit_template(rel_path):
    audit_path = get_audit_path(rel_path)
    os.makedirs(os.path.dirname(audit_path), exist_ok=True)

    template = f"""# AUDIT: {rel_path}

## Break attempts


## SPEC mismatches


## Untested paths


## Silent failure risks


## Result


## Issues


## Fixes

"""
    with open(audit_path, "w", encoding="utf-8") as f:
        f.write(template)

    return audit_path


def get_result_value(content):
    """Extract the Result value from an audit document."""
    lines = content.split("\n")
    in_result = False
    for line in lines:
        stripped = line.strip()
        if stripped == "## Result":
            in_result = True
            continue
        if in_result:
            if stripped.startswith("#"):
                break
            if stripped:
                return stripped.upper()
    return ""


def validate_audit(rel_path, expected_result):
    """Validate an AUDIT document. expected_result is 'PASS' or 'FAIL'."""
    audit_path = get_audit_path(rel_path)

    if not os.path.exists(audit_path):
        return False, f"AUDIT file not found. Run: python hooks/phase_control.py audit {rel_path}"

    with open(audit_path, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.split("\n")

    # Check all required sections have content
    required = AUDIT_REQUIRED_SECTIONS[:]
    if expected_result == "FAIL":
        required += AUDIT_FAIL_SECTIONS

    missing = []
    empty = []

    for section in required:
        found = False
        has_content = False

        for i, line in enumerate(lines):
            if line.strip() == section:
                found = True
                for j in range(i + 1, len(lines)):
                    stripped = lines[j].strip()
                    if stripped.startswith("#"):
                        break
                    if stripped:
                        has_content = True
                        break
                break

        if not found:
            missing.append(section)
        elif not has_content:
            empty.append(section)

    if missing:
        return False, f"Missing sections: {', '.join(missing)}"
    if empty:
        return False, f"Empty sections (need content): {', '.join(empty)}"

    # Check Result value matches expected
    result_value = get_result_value(content)
    if result_value != expected_result:
        return False, f"Result says '{result_value}', expected '{expected_result}'."

    return True, f"AUDIT validated: {expected_result}."


# ── Commands ─────────────────────────────────────────────────────────────────

def cmd_status(args):
    state = load()
    if not state:
        print("No files tracked.")
        return

    if args:
        key = normalize(args[0])
        entry = state.get(key)
        if entry:
            print(f"  {key}: {entry['phase']} (updated {entry.get('updated', '?')})")
        else:
            print(f"  {key}: not tracked")
        return

    for key, entry in sorted(state.items()):
        print(f"  {entry['phase']:20s}  {key}")


def cmd_spec(args):
    if not args:
        print("Usage: phase_control.py spec <file>")
        sys.exit(1)

    key = normalize(args[0])
    spec_path = create_spec_template(key)

    state = load()
    state[key] = {"phase": "spec_pending", "updated": now()}
    save(state)

    rel_spec = os.path.relpath(spec_path, PROJECT_ROOT).replace("\\", "/")
    print(f"  {key} -> spec_pending")
    print(f"  SPEC template created: {rel_spec}")
    print(f"  Fill all sections, then run: python hooks/phase_control.py approve {key}")


def cmd_approve(args):
    if not args:
        print("Usage: phase_control.py approve <file>")
        sys.exit(1)

    key = normalize(args[0])
    state = load()
    entry = state.get(key)

    if not entry:
        print(f"  {key}: not tracked. Run 'spec' first.")
        sys.exit(1)

    if entry["phase"] != "spec_pending":
        print(f"  {key}: phase is '{entry['phase']}', expected 'spec_pending'.")
        sys.exit(1)

    valid, message = validate_spec(key)

    if not valid:
        print(f"\n  SPEC VALIDATION FAILED")
        print(f"  File: {key}")
        print(f"  {message}\n")
        sys.exit(1)

    # Store SPEC hash — immutable from this point
    spec_path = get_spec_path(key)
    spec_hash = hash_file(spec_path)

    state[key] = {"phase": "spec_approved", "updated": now(), "spec_hash": spec_hash}
    save(state)
    print(f"  {key} -> spec_approved")
    print(f"  SPEC validated and locked. BUILD phase unlocked.")


def cmd_build_done(args):
    if not args:
        print("Usage: phase_control.py build_done <file>")
        sys.exit(1)
    key = normalize(args[0])
    state = load()
    entry = state.get(key)
    if not entry or entry["phase"] != "spec_approved":
        current = entry["phase"] if entry else "not tracked"
        print(f"  {key}: phase is '{current}', expected 'spec_approved'.")
        sys.exit(1)

    valid, message = validate_build(key, entry)
    if not valid:
        print(f"\n  BUILD VALIDATION FAILED")
        print(f"  File: {key}")
        print(f"  {message}\n")
        sys.exit(1)

    state[key] = {
        "phase": "build_complete",
        "updated": now(),
        "spec_hash": entry.get("spec_hash", ""),
    }
    save(state)
    print(f"  {key} -> build_complete")
    print(f"  All test files and implementation files verified on disk.")


def cmd_audit(args):
    """Create an AUDIT template for a file in build_complete or repair_complete phase."""
    if not args:
        print("Usage: phase_control.py audit <file>")
        sys.exit(1)

    key = normalize(args[0])
    state = load()
    entry = state.get(key)

    if not entry or entry["phase"] not in ("build_complete", "repair_complete"):
        current = entry["phase"] if entry else "not tracked"
        print(f"  {key}: phase is '{current}', expected 'build_complete' or 'repair_complete'.")
        sys.exit(1)

    audit_path = create_audit_template(key)
    rel_audit = os.path.relpath(audit_path, PROJECT_ROOT).replace("\\", "/")
    print(f"  AUDIT template created: {rel_audit}")
    print(f"  Fill all sections, then run:")
    print(f"    python hooks/phase_control.py audit_pass {key}")
    print(f"    python hooks/phase_control.py audit_fail {key}")


def cmd_audit_pass(args):
    if not args:
        print("Usage: phase_control.py audit_pass <file>")
        sys.exit(1)
    key = normalize(args[0])
    state = load()
    entry = state.get(key)
    if not entry or entry["phase"] not in ("build_complete", "repair_complete"):
        current = entry["phase"] if entry else "not tracked"
        print(f"  {key}: phase is '{current}', expected 'build_complete' or 'repair_complete'.")
        sys.exit(1)

    valid, message = validate_audit(key, "PASS")
    if not valid:
        print(f"\n  AUDIT VALIDATION FAILED")
        print(f"  File: {key}")
        print(f"  {message}\n")
        sys.exit(1)

    state[key] = {"phase": "audit_pass", "updated": now()}
    save(state)
    print(f"  {key} -> audit_pass")
    print(f"  AUDIT validated. File is complete.")


def cmd_audit_fail(args):
    if not args:
        print("Usage: phase_control.py audit_fail <file>")
        sys.exit(1)
    key = normalize(args[0])
    state = load()
    entry = state.get(key)
    if not entry or entry["phase"] not in ("build_complete", "repair_complete"):
        current = entry["phase"] if entry else "not tracked"
        print(f"  {key}: phase is '{current}', expected 'build_complete' or 'repair_complete'.")
        sys.exit(1)

    valid, message = validate_audit(key, "FAIL")
    if not valid:
        print(f"\n  AUDIT VALIDATION FAILED")
        print(f"  File: {key}")
        print(f"  {message}\n")
        sys.exit(1)

    state[key] = {"phase": "audit_fail", "updated": now()}
    save(state)
    print(f"  {key} -> audit_fail")
    print(f"  AUDIT validated. REPAIR phase unlocked.")


def cmd_repair_done(args):
    if not args:
        print("Usage: phase_control.py repair_done <file>")
        sys.exit(1)
    key = normalize(args[0])
    state = load()
    entry = state.get(key)
    if not entry or entry["phase"] != "audit_fail":
        current = entry["phase"] if entry else "not tracked"
        print(f"  {key}: phase is '{current}', expected 'audit_fail'.")
        sys.exit(1)
    state[key] = {"phase": "repair_complete", "updated": now()}
    save(state)
    print(f"  {key} -> repair_complete")


def cmd_reset(args):
    if not args:
        print("Usage: phase_control.py reset <file>")
        sys.exit(1)
    key = normalize(args[0])
    state = load()
    if key in state:
        del state[key]
        save(state)
        print(f"  {key} -- removed from tracking")
    else:
        print(f"  {key} -- not tracked")


def cmd_clear(_):
    save({})
    print("  All phase state cleared.")


COMMANDS = {
    "status": cmd_status,
    "spec": cmd_spec,
    "approve": cmd_approve,
    "build_done": cmd_build_done,
    "audit": cmd_audit,
    "audit_pass": cmd_audit_pass,
    "audit_fail": cmd_audit_fail,
    "repair_done": cmd_repair_done,
    "reset": cmd_reset,
    "clear": cmd_clear,
}


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        print("Recursion Repair — Phase Control")
        print()
        for name in COMMANDS:
            print(f"  python hooks/phase_control.py {name} [file]")
        sys.exit(1)

    cmd = sys.argv[1]
    args = sys.argv[2:]
    COMMANDS[cmd](args)


if __name__ == "__main__":
    main()
