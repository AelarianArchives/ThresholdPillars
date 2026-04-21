#!/usr/bin/env python3
"""
RECURSION REPAIR GATE — PreToolUse hook for Write and Edit operations.

Enforces the four-phase gate system:
  SPEC → BUILD → AUDIT → REPAIR (if needed)

This hook runs BEFORE every Write or Edit. It checks the target file's
phase state and blocks writes that violate the current phase.

BUILD PHASE ENFORCEMENT:
  - SPEC must carry a terminal STATUS marker (APPROVED or FINAL) in its header
  - Only files listed in the SPEC's '## Test files' or '## Files' can be written
  - Test files must exist on disk before any implementation file can be written
  - SPEC must not be modified after approval (hash check)

REPAIR PHASE ENFORCEMENT:
  - Only files named in the AUDIT's '## Fixes' section can be written
  - No scope expansion beyond what the AUDIT identified
  - After REPAIR, must re-run AUDIT (loops until PASS)

FILES EXEMPT FROM GATING:
  - .claude/ directory (settings, plans, memory, specs, audits)
  - PROTOCOL/SESSION_LOG.md (session logging)
  - hooks/ directory (hook scripts)
  - .gitignore, .env files
"""

import hashlib
import json
import os
import sys
import datetime

# ── Paths ─────────────────────────────────────────────────────────────────────

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHASE_STATE_FILE = os.path.join(PROJECT_ROOT, ".claude", "phase_state.json")
PHASE_LOG_FILE = os.path.join(PROJECT_ROOT, ".claude", "phase_log.txt")
SPECS_DIR = os.path.join(PROJECT_ROOT, ".claude", "specs")
AUDITS_DIR = os.path.join(PROJECT_ROOT, ".claude", "audits")

# ── SPEC required sections (must match phase_control.py) ─────────────────────

SPEC_REQUIRED_SECTIONS = [
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

# ── Exempt paths ──────────────────────────────────────────────────────────────

EXEMPT_PREFIXES = [
    ".claude/",
    ".claude\\",
    "hooks/",
    "hooks\\",
    "PROTOCOL/SESSION_LOG.md",
    "PROTOCOL\\SESSION_LOG.md",
    ".gitignore",
    ".env",
]

EXEMPT_SUFFIXES = [
    ".env",
    "phase_state.json",
    "phase_log.txt",
]


def is_exempt(rel_path):
    if not rel_path:
        return True
    for prefix in EXEMPT_PREFIXES:
        if rel_path.startswith(prefix):
            return True
    for suffix in EXEMPT_SUFFIXES:
        if rel_path.endswith(suffix):
            return True
    return False


def load_phase_state():
    if os.path.exists(PHASE_STATE_FILE):
        try:
            with open(PHASE_STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}


def log_phase_event(file_path, event, detail=""):
    try:
        os.makedirs(os.path.dirname(PHASE_LOG_FILE), exist_ok=True)
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(PHASE_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] {event}: {file_path}")
            if detail:
                f.write(f" — {detail}")
            f.write("\n")
    except Exception:
        pass


def get_file_path_from_env():
    file_path = os.environ.get("CLAUDE_FILE_PATH", "")
    if file_path:
        return file_path

    tool_input = os.environ.get("CLAUDE_TOOL_INPUT", "")
    if tool_input:
        try:
            params = json.loads(tool_input)
            return params.get("file_path", "")
        except (json.JSONDecodeError, TypeError):
            pass

    return ""


def get_relative_path(abs_path):
    try:
        return os.path.relpath(abs_path, PROJECT_ROOT).replace("\\", "/")
    except ValueError:
        return abs_path


def get_spec_path(rel_path):
    return os.path.join(SPECS_DIR, rel_path + ".spec.md")


def hash_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return hashlib.sha256(f.read().encode()).hexdigest()


def parse_file_list(spec_content, section_header):
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
                if file_path:
                    files.append(file_path)

    return files


def validate_spec_structure(spec_content):
    """Verify SPEC contains all required sections with content."""
    lines = spec_content.split("\n")
    missing = []
    empty = []

    for section in SPEC_REQUIRED_SECTIONS:
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

    if missing or empty:
        problems = []
        if missing:
            problems.append(f"Missing: {', '.join(missing)}")
        if empty:
            problems.append(f"Empty: {', '.join(empty)}")
        return False, "; ".join(problems)
    return True, ""


# ── STATUS marker (must match phase_control.py SPEC template convention) ─────

VALID_STATUS_VALUES = ("APPROVED", "FINAL")


def check_status_marker(spec_content):
    """Verify SPEC carries a terminal STATUS marker in its header zone.

    The marker must appear on its own line between the `# SPEC:` title
    line and the first `##` section header. Valid values are APPROVED
    and FINAL. Key and value are case-sensitive. Whitespace between
    the colon and the value is flexible.

    Returns (True, "") if a valid marker is found.
    Returns (False, reason) otherwise, where reason is a human-readable
    message suitable for a gate block.
    """
    lines = spec_content.split("\n")
    seen_title = False
    in_header_zone = False

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("# SPEC:"):
            seen_title = True
            in_header_zone = True
            continue

        if not in_header_zone:
            continue

        # Reached first H2 section header — end of header zone.
        if stripped.startswith("## "):
            break

        if stripped.startswith("STATUS:"):
            value = stripped[len("STATUS:"):].strip()
            if value in VALID_STATUS_VALUES:
                return True, ""
            if not value:
                return False, "STATUS marker has no value. Expected 'APPROVED' or 'FINAL'."
            return False, f"STATUS value is '{value}', expected 'APPROVED' or 'FINAL'."

    if not seen_title:
        return False, "SPEC file missing '# SPEC:' title line."

    return False, (
        "No STATUS marker found in SPEC header. "
        "Expected 'STATUS: APPROVED' or 'STATUS: FINAL' "
        "between title line and first section."
    )


def get_audit_path(rel_path):
    return os.path.join(AUDITS_DIR, rel_path + ".audit.md")


def parse_repair_files(audit_content):
    """Parse file paths from AUDIT '## Fixes' section.

    Expects lines like '- path/to/file.py: description of fix'.
    Extracts the path before the colon.
    """
    lines = audit_content.split("\n")
    files = set()
    in_section = False

    for line in lines:
        stripped = line.strip()
        if stripped == "## Fixes":
            in_section = True
            continue
        if in_section:
            if stripped.startswith("#"):
                break
            if stripped.startswith("- "):
                entry = stripped[2:].strip()
                if ":" in entry:
                    file_path = entry.split(":")[0].strip()
                else:
                    file_path = entry.strip()
                if file_path:
                    files.add(file_path)

    return files


def find_parent_spec(rel_path, state):
    """Find which tracked file's SPEC includes this file in its file lists."""
    for tracked_file, entry in state.items():
        spec_path = get_spec_path(tracked_file)
        if not os.path.exists(spec_path):
            continue
        try:
            with open(spec_path, "r", encoding="utf-8") as f:
                content = f.read()
        except IOError:
            continue
        test_files = parse_file_list(content, "## Test files")
        all_files = parse_file_list(content, "## Files")
        if rel_path in test_files or rel_path in all_files:
            return tracked_file, entry, content, test_files, all_files

    return None, None, None, None, None


def block(rel_path, reason, detail):
    log_phase_event(rel_path, "BLOCKED", detail)
    msg = (
        f"\n  RECURSION REPAIR GATE — BLOCKED\n"
        f"  File: {rel_path}\n"
        f"  Reason: {reason}\n"
    )
    sys.stderr.write(msg)
    sys.exit(2)


def main():
    tool_name = os.environ.get("CLAUDE_TOOL_NAME", "")

    if tool_name not in ("Write", "Edit"):
        sys.exit(0)

    file_path = get_file_path_from_env()
    if not file_path:
        sys.exit(0)

    rel_path = get_relative_path(file_path)

    if is_exempt(rel_path):
        sys.exit(0)

    state = load_phase_state()

    # ── Resolve phase: direct lookup or parent SPEC search ────────────────

    file_state = state.get(rel_path)
    parent_key = rel_path
    spec_content = None
    test_files = []
    all_files = []

    if file_state is None:
        parent_key, file_state, spec_content, test_files, all_files = find_parent_spec(rel_path, state)

    if file_state is None:
        log_phase_event(rel_path, "BLOCKED", "No SPEC phase entry exists.")
        msg = (
            f"\n{'='*60}\n"
            f"  RECURSION REPAIR GATE — BLOCKED\n"
            f"{'='*60}\n"
            f"  File: {rel_path}\n"
            f"  Reason: No SPEC exists for this file.\n"
            f"\n"
            f"  Before writing any file, you must:\n"
            f"  1. Create a SPEC (goal, assumptions, risks,\n"
            f"     invariants, test strategy, test files, files)\n"
            f"  2. Get Sage's approval on the SPEC\n"
            f"  3. Register via: python hooks/phase_control.py spec <file>\n"
            f"{'='*60}\n"
        )
        sys.stderr.write(msg)
        sys.exit(2)

    current_phase = file_state.get("phase", "")

    # ── Phase gates ───────────────────────────────────────────────────────

    if current_phase == "spec_pending":
        block(rel_path, "SPEC not yet approved by Sage.", "SPEC pending approval.")

    elif current_phase == "spec_approved":
        # BUILD phase — enforce test-first and file list
        spec_path = get_spec_path(parent_key)

        # Load SPEC content if not already loaded (direct lookup case)
        if spec_content is None:
            if not os.path.exists(spec_path):
                block(rel_path, "SPEC file missing.", "SPEC file not found on disk.")
            with open(spec_path, "r", encoding="utf-8") as f:
                spec_content = f.read()
            test_files = parse_file_list(spec_content, "## Test files")
            all_files = parse_file_list(spec_content, "## Files")

        # Gate 3 — SPEC must carry terminal STATUS marker
        status_valid, status_problem = check_status_marker(spec_content)
        if not status_valid:
            block(
                rel_path,
                f"SPEC missing terminal STATUS marker. {status_problem}",
                "STATUS marker validation failed.",
            )

        # Gate 4 — Re-validate SPEC structure (don't trust phase_state alone)
        spec_valid, spec_problems = validate_spec_structure(spec_content)
        if not spec_valid:
            block(
                rel_path,
                f"SPEC structure incomplete: {spec_problems}",
                "SPEC failed re-validation during BUILD.",
            )

        # Check SPEC was not modified after approval
        stored_hash = file_state.get("spec_hash", "")
        if stored_hash and os.path.exists(spec_path):
            current_hash = hash_file(spec_path)
            if current_hash != stored_hash:
                block(
                    rel_path,
                    "SPEC was modified after approval. SPEC is immutable during BUILD.",
                    "SPEC hash mismatch.",
                )

        # Check file is in SPEC's file lists
        if rel_path != parent_key and rel_path not in test_files and rel_path not in all_files:
            block(
                rel_path,
                f"File not listed in SPEC for {parent_key}. Only SPEC-listed files can be written during BUILD.",
                "File not in SPEC file lists.",
            )

        # Test-first: if writing a non-test file, all test files must exist
        is_test_file = rel_path in test_files
        if not is_test_file and test_files:
            missing = []
            for tf in test_files:
                tf_abs = os.path.join(PROJECT_ROOT, tf)
                if not os.path.exists(tf_abs):
                    missing.append(tf)
            if missing:
                block(
                    rel_path,
                    f"Tests first. These test files must exist before writing implementation:\n    " + "\n    ".join(missing),
                    "Test-first violation.",
                )

        log_phase_event(rel_path, "ALLOWED", "BUILD phase.")
        sys.exit(0)

    elif current_phase == "build_complete":
        block(rel_path, "BUILD complete. Run AUDIT before writing more.", "BUILD complete, awaiting AUDIT.")

    elif current_phase == "audit_pass":
        block(rel_path, "AUDIT passed. File is complete.", "File locked after AUDIT pass.")

    elif current_phase == "audit_fail":
        # REPAIR phase — only files named in AUDIT Fixes can be written
        audit_path = get_audit_path(parent_key)

        if not os.path.exists(audit_path):
            block(
                rel_path,
                "AUDIT document missing. Cannot determine allowed REPAIR scope.",
                "No AUDIT document found.",
            )

        with open(audit_path, "r", encoding="utf-8") as f:
            audit_content = f.read()

        repair_files = parse_repair_files(audit_content)

        if not repair_files:
            block(
                rel_path,
                "AUDIT Fixes section names no files. Cannot determine REPAIR scope.",
                "No files in AUDIT Fixes.",
            )

        if rel_path not in repair_files:
            block(
                rel_path,
                f"File not listed in AUDIT Fixes. REPAIR is limited to:\n    " + "\n    ".join(sorted(repair_files)),
                "File not in AUDIT Fixes list.",
            )

        log_phase_event(rel_path, "ALLOWED", "REPAIR phase — file listed in AUDIT Fixes.")
        sys.exit(0)

    elif current_phase == "repair_complete":
        block(rel_path, "REPAIR complete. Re-run AUDIT.", "REPAIR complete, awaiting re-AUDIT.")

    else:
        log_phase_event(rel_path, "WARN", f"Unknown phase '{current_phase}'. Allowing.")
        sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        try:
            log_phase_event("HOOK_ERROR", "ERROR", str(e))
        except Exception:
            pass
        # Fail closed — if the gate can't determine whether to allow, block
        sys.stderr.write(f"\n  RECURSION REPAIR GATE — ERROR\n  Hook crashed: {e}\n  Blocking write as a safety measure.\n")
        sys.exit(2)
