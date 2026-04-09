#!/usr/bin/env python3
"""
ROT OPEN GATE — PreToolUse hook for Write and Edit operations.

Blocks all Write/Edit operations if ROT_OPEN.md contains active items,
UNLESS the write target is a rot-resolution file (ROT_OPEN.md,
ROT_REGISTRY.md, SESSION_LOG.md).

Enforces CLAUDE.md: "Open rot is the first priority."

When ROT_OPEN.md has items under ## OPEN ITEMS, all non-rot-resolution
writes are blocked until those items are resolved (deleted from the file).
"""

import json
import os
import sys


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROT_OPEN_FILE = os.path.join(PROJECT_ROOT, "ROT_OPEN.md")

# Standard exempt paths (same as other hooks)
EXEMPT_PREFIXES = [
    ".claude/",
    ".claude\\",
    "hooks/",
    "hooks\\",
    ".gitignore",
    ".env",
]

EXEMPT_SUFFIXES = [
    ".env",
]

# Additional exempt files for rot resolution work
ROT_RESOLUTION_FILES = [
    "ROT_OPEN.md",
    "ROT_REGISTRY.md",
    "PROTOCOL/SESSION_LOG.md",
    "PROTOCOL\\SESSION_LOG.md",
    "ENTROPY_EXCAVATION.md",
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
    # Allow writes to rot resolution files
    for rot_file in ROT_RESOLUTION_FILES:
        if rel_path == rot_file or rel_path.replace("\\", "/") == rot_file:
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


def has_open_rot():
    """Check if ROT_OPEN.md has items under ## OPEN ITEMS."""
    if not os.path.exists(ROT_OPEN_FILE):
        return False

    try:
        with open(ROT_OPEN_FILE, "r", encoding="utf-8") as f:
            content = f.read()
    except IOError:
        return False

    # Find the ## OPEN ITEMS section
    marker = "## OPEN ITEMS"
    idx = content.find(marker)
    if idx == -1:
        return False

    # Check if there's any non-whitespace content after the header
    after_header = content[idx + len(marker):]
    lines = after_header.strip().split("\n")

    for line in lines:
        stripped = line.strip()
        # Skip empty lines and markdown section dividers
        if stripped and not stripped.startswith("---") and not stripped.startswith("#"):
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

    if not has_open_rot():
        sys.exit(0)

    # Block
    print(f"\n{'='*60}")
    print(f"  ROT OPEN GATE — BLOCKED")
    print(f"{'='*60}")
    print(f"  File: {rel_path}")
    print(f"  Reason: Active rot items exist in ROT_OPEN.md.")
    print(f"")
    print(f"  Open rot must be addressed with Sage before any")
    print(f"  other work begins. Read ROT_OPEN.md for details.")
    print(f"")
    print(f"  Allowed writes: ROT_OPEN.md, ROT_REGISTRY.md,")
    print(f"  SESSION_LOG.md, ENTROPY_EXCAVATION.md, .claude/")
    print(f"{'='*60}\n")
    sys.exit(1)


if __name__ == "__main__":
    main()
