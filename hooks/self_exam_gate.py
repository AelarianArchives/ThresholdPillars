#!/usr/bin/env python3
"""
SELF-EXAMINATION ARTIFACT GATE — TaskCompleted hook.

Fires when a task is marked as completed. If the task involves
self-examination (audit, analysis, verification, comparison, review),
blocks completion unless a corresponding artifact file exists in
.claude/audits/.

The artifact must:
  1. Exist in .claude/audits/
  2. Have been written today (not stale from a prior session)
  3. Contain required sections: Task, Files examined, Findings, Conclusion

This prevents F06 (self-validates bad output) — the executor cannot
mark self-examination work as complete without producing a record
that Sage can verify.

Exit 0: task is not self-examination, or artifact exists and is valid.
Exit 2: task is self-examination and no valid artifact found.
"""

import json
import os
import re
import sys
from datetime import date


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDITS_DIR = os.path.join(PROJECT_ROOT, ".claude", "audits")

# Keywords that identify self-examination tasks
EXAM_KEYWORDS = [
    "audit", "re-audit", "reaudit", "analysis", "analyze", "verification",
    "verify", "comparison", "compare", "review", "gap analysis",
    "stale reference", "cross-check", "validate", "inspect",
]

# Required sections in an artifact report
REQUIRED_SECTIONS = [
    "## Task",
    "## Files examined",
    "## Findings",
    "## Conclusion",
]


# If the task subject starts with these verbs, it's a build task
# even if it mentions examination terminology in the description
BUILD_VERBS = [
    "build", "create", "write", "implement", "add", "fix", "update",
    "wire", "promote", "enhance", "expand", "install", "configure",
    "set up", "refactor", "move", "rename", "delete", "remove",
]


def is_self_examination(task_subject, task_description=""):
    """Check if a task involves self-examination based on keywords.
    Excludes build tasks that happen to mention audit terminology."""
    subject_lower = task_subject.lower().strip()

    # If subject starts with a build verb, it's not self-examination
    for verb in BUILD_VERBS:
        if subject_lower.startswith(verb):
            return False

    # Check subject (primary) and description (secondary) for exam keywords
    # Subject match is stronger — check it alone first
    if any(kw in subject_lower for kw in EXAM_KEYWORDS):
        return True

    # Description alone is not sufficient — too many false positives
    return False


def find_todays_artifact():
    """Find the most recent artifact written today in .claude/audits/."""
    if not os.path.exists(AUDITS_DIR):
        return None

    today_str = date.today().strftime("%Y-%m-%d")
    candidates = []

    for root, dirs, files in os.walk(AUDITS_DIR):
        for fname in files:
            if not fname.endswith(".md"):
                continue
            fpath = os.path.join(root, fname)
            try:
                mtime = os.path.getmtime(fpath)
                from datetime import datetime
                mdate = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d")
                if mdate == today_str:
                    candidates.append(fpath)
            except OSError:
                continue

    if not candidates:
        return None

    # Return most recently modified
    candidates.sort(key=lambda f: os.path.getmtime(f), reverse=True)
    return candidates[0]


def validate_artifact(fpath):
    """Check that the artifact has all required sections with content."""
    try:
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
    except IOError:
        return False, "Cannot read artifact file"

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
        return False, f"Empty sections: {', '.join(empty)}"
    return True, ""


def main():
    # Read task data from stdin
    try:
        raw = sys.stdin.read() or "{}"
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        data = {}

    # Extract task info — TaskCompleted provides task metadata
    task_subject = data.get("task_subject", data.get("subject", ""))
    task_description = data.get("task_description", data.get("description", ""))

    # Also check tool_input for TaskUpdate calls
    tool_input = data.get("tool_input", {})
    if isinstance(tool_input, dict):
        task_subject = task_subject or tool_input.get("subject", "")
        task_description = task_description or tool_input.get("description", "")

    if not is_self_examination(task_subject, task_description):
        sys.exit(0)

    # This IS a self-examination task — check for artifact
    artifact = find_todays_artifact()
    if artifact is None:
        sys.stderr.write(
            f"\n{'='*60}\n"
            f"  SELF-EXAMINATION GATE — BLOCKED\n"
            f"{'='*60}\n"
            f"  Task: {task_subject[:80]}\n"
            f"  Reason: No audit artifact found in .claude/audits/\n"
            f"\n"
            f"  Self-examination tasks (audit, analysis, verification,\n"
            f"  comparison, review) require a written report before\n"
            f"  the task can be marked complete.\n"
            f"\n"
            f"  Write a report to .claude/audits/ with sections:\n"
            f"    ## Task\n"
            f"    ## Files examined\n"
            f"    ## Findings\n"
            f"    ## Conclusion\n"
            f"{'='*60}\n"
        )
        sys.exit(2)

    # Artifact exists — validate structure
    valid, problems = validate_artifact(artifact)
    if not valid:
        rel_path = os.path.relpath(artifact, PROJECT_ROOT)
        sys.stderr.write(
            f"\n{'='*60}\n"
            f"  SELF-EXAMINATION GATE — BLOCKED\n"
            f"{'='*60}\n"
            f"  Task: {task_subject[:80]}\n"
            f"  Artifact: {rel_path}\n"
            f"  Reason: {problems}\n"
            f"\n"
            f"  Fill all required sections before completing.\n"
            f"{'='*60}\n"
        )
        sys.exit(2)

    # Valid artifact exists — allow completion
    sys.exit(0)


if __name__ == "__main__":
    main()
