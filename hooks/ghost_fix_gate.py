#!/usr/bin/env python3
"""
GHOST FIX GATE — Combined PreToolUse + PostToolUse hook.

PostToolUse behavior: After every Edit, writes a pending marker with
the file path and timestamp. This flags that a ghost fix verification
may be needed.

PreToolUse behavior: Before every Write/Edit to non-exempt paths,
checks for pending ghost fix marker. If present, prints a WARNING
(not a hard block) reminding to verify the fix is present.

The marker is cleared when a TYPE: GHOST_FIX entry is written to
SESSION_LOG.md.

This is a soft gate (warning only) because not every Edit is a fix.
Sage can promote to hard block if warranted.

Enforces SESSION_PROTOCOL.md: "Run after every patch, correction,
or fix — no exceptions."
"""

import json
import os
import sys
from datetime import datetime


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKER_FILE = os.path.join(PROJECT_ROOT, ".claude", "pending_ghost_fix.marker")

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


def is_exempt(rel_path):
    if not rel_path:
        return True
    for prefix in EXEMPT_PREFIXES:
        if rel_path.startswith(prefix):
            return True
    return False


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


def is_ghost_fix_entry():
    """Check if this write contains TYPE: GHOST_FIX (clearing the marker)."""
    tool_input = os.environ.get("CLAUDE_TOOL_INPUT", "")
    if not tool_input:
        return False
    try:
        params = json.loads(tool_input)
    except (json.JSONDecodeError, TypeError):
        return False

    content = params.get("content", "") + params.get("new_string", "")
    return "TYPE: GHOST_FIX" in content


def handle_pre_tool_use(rel_path):
    """PreToolUse: warn if ghost fix is pending."""
    # If writing a GHOST_FIX entry to session log, clear the marker
    if is_ghost_fix_entry():
        try:
            if os.path.exists(MARKER_FILE):
                os.remove(MARKER_FILE)
        except OSError:
            pass
        sys.exit(0)

    # Check for pending marker
    if not os.path.exists(MARKER_FILE):
        sys.exit(0)

    if is_exempt(rel_path):
        sys.exit(0)

    # Read marker for context
    try:
        with open(MARKER_FILE, "r", encoding="utf-8") as f:
            marker_content = f.read().strip()
    except IOError:
        marker_content = "(unknown file)"

    # WARNING only — does not block
    print(f"\n  GHOST FIX WARNING: Verification pending for: {marker_content}")
    print(f"  Confirm the fix is present before continuing.")
    print(f"  Write TYPE: GHOST_FIX to SESSION_LOG.md to clear.\n")
    sys.exit(0)  # exit 0 = warning, not block


def handle_post_tool_use(rel_path):
    """PostToolUse: after Edit, write pending marker."""
    tool_name = os.environ.get("CLAUDE_TOOL_NAME", "")

    # Only fire on Edit (not Write — Write creates new files, Edit patches)
    if tool_name != "Edit":
        sys.exit(0)

    if is_exempt(rel_path):
        sys.exit(0)

    # Write marker
    try:
        os.makedirs(os.path.dirname(MARKER_FILE), exist_ok=True)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(MARKER_FILE, "w", encoding="utf-8") as f:
            f.write(f"{rel_path} (edited {timestamp})")
    except IOError:
        pass

    sys.exit(0)


def main():
    tool_name = os.environ.get("CLAUDE_TOOL_NAME", "")
    if tool_name not in ("Write", "Edit"):
        sys.exit(0)

    file_path = get_file_path_from_env()
    if not file_path:
        sys.exit(0)

    rel_path = get_relative_path(file_path)

    # Determine if this is PreToolUse or PostToolUse
    # Claude Code sets CLAUDE_HOOK_PHASE or we detect from context
    hook_phase = os.environ.get("CLAUDE_HOOK_PHASE", "")

    if hook_phase == "post":
        handle_post_tool_use(rel_path)
    else:
        # Default to pre (PreToolUse is the warning side)
        handle_pre_tool_use(rel_path)


if __name__ == "__main__":
    main()
