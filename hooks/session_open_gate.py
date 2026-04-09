#!/usr/bin/env python3
"""
SESSION OPEN GATE — PreToolUse hook for Write and Edit operations.

Blocks all Write/Edit operations until a TYPE: OPEN or TYPE: RESUME
entry exists in SESSION_LOG.md for today's date.

Enforces CLAUDE.md: "No work starts until this entry exists in
SESSION_LOG.md for the current session."

Exempt paths: .claude/, hooks/, PROTOCOL/SESSION_LOG.md, .gitignore, .env
SESSION_LOG.md must be exempt so the OPEN entry itself can be written.
"""

import json
import os
import re
import sys
from datetime import date


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SESSION_LOG = os.path.join(PROJECT_ROOT, "PROTOCOL", "SESSION_LOG.md")

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


def session_opened_today():
    """Check if SESSION_LOG.md has a TYPE: OPEN or TYPE: RESUME for today."""
    if not os.path.exists(SESSION_LOG):
        return False

    today_str = date.today().strftime("%Y-%m-%d")

    try:
        with open(SESSION_LOG, "r", encoding="utf-8") as f:
            content = f.read()
    except IOError:
        return False

    # Find all OPEN or RESUME entries and check if any match today
    # Pattern: TIMESTAMP line followed by TYPE: OPEN or TYPE: RESUME
    entries = re.findall(
        r"TIMESTAMP:\s*(\d{4}-\d{2}-\d{2})[^\n]*\nTYPE:\s*(OPEN|RESUME)",
        content,
    )

    for timestamp_date, entry_type in entries:
        if timestamp_date == today_str:
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

    if is_exempt(rel_path):
        sys.exit(0)

    if session_opened_today():
        sys.exit(0)

    # Block
    print(f"\n{'='*60}")
    print(f"  SESSION OPEN GATE — BLOCKED")
    print(f"{'='*60}")
    print(f"  File: {rel_path}")
    print(f"  Reason: No TYPE: OPEN entry in SESSION_LOG.md for today.")
    print(f"")
    print(f"  Write a TYPE: OPEN entry to PROTOCOL/SESSION_LOG.md")
    print(f"  before any other work begins.")
    print(f"{'='*60}\n")
    sys.exit(1)


if __name__ == "__main__":
    main()
