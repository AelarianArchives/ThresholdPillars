#!/usr/bin/env python3
"""
CLOSE AUDIT GATE — PreToolUse hook for Write and Edit operations.

Only fires when writing a TYPE: CLOSE entry to SESSION_LOG.md.
Verifies that the session close audit was performed (marker file exists).

The marker (.claude/close_audit_done.marker) is created by
entropy_scan.py --close-audit and consumed (deleted) by this hook
after a successful pass.

Enforces CLAUDE.md: "A session that closes without [audit] has not
closed cleanly."
"""

import json
import os
import sys


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIT_MARKER = os.path.join(PROJECT_ROOT, ".claude", "close_audit_done.marker")
SESSION_LOG_REL = "PROTOCOL/SESSION_LOG.md"


def get_relative_path(abs_path):
    try:
        return os.path.relpath(abs_path, PROJECT_ROOT).replace("\\", "/")
    except ValueError:
        return abs_path


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


def is_close_entry_write():
    """Check if the current Write/Edit contains TYPE: CLOSE."""
    tool_input = os.environ.get("CLAUDE_TOOL_INPUT", "")
    if not tool_input:
        return False
    try:
        params = json.loads(tool_input)
    except (json.JSONDecodeError, TypeError):
        return False

    # Check Write tool (content parameter)
    content = params.get("content", "")
    if "TYPE: CLOSE" in content:
        return True

    # Check Edit tool (new_string parameter)
    new_string = params.get("new_string", "")
    if "TYPE: CLOSE" in new_string:
        return True

    return False


def main():
    tool_name = os.environ.get("CLAUDE_TOOL_NAME", "")
    if tool_name not in ("Write", "Edit"):
        sys.exit(0)

    file_path = get_file_path_from_env()
    if not file_path:
        sys.exit(0)

    rel_path = get_relative_path(file_path)

    # Only fire on SESSION_LOG.md writes that contain TYPE: CLOSE
    if rel_path != SESSION_LOG_REL and rel_path != SESSION_LOG_REL.replace("/", "\\"):
        sys.exit(0)

    if not is_close_entry_write():
        sys.exit(0)

    # This IS a TYPE: CLOSE write — check for audit marker
    if os.path.exists(AUDIT_MARKER):
        # Audit was performed — consume the marker and pass
        try:
            os.remove(AUDIT_MARKER)
        except OSError:
            pass
        sys.exit(0)

    # Block — audit not performed
    print(f"\n{'='*60}")
    print(f"  CLOSE AUDIT GATE — BLOCKED")
    print(f"{'='*60}")
    print(f"  Reason: Session close audit not performed.")
    print(f"")
    print(f"  Before writing TYPE: CLOSE, you must:")
    print(f"  1. Run: python hooks/entropy_scan.py --close-audit")
    print(f"  2. Report findings to Sage")
    print(f"  3. Log any new rot in ROT_REGISTRY.md and ROT_OPEN.md")
    print(f"")
    print(f"  The audit creates a marker that this gate consumes.")
    print(f"  No marker = no close.")
    print(f"{'='*60}\n")
    sys.exit(1)


if __name__ == "__main__":
    main()
