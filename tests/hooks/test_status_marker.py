"""
Unit tests for check_status_marker() in recursion_repair_gate.py.

The function verifies that a SPEC carries a terminal STATUS marker
(`STATUS: APPROVED` or `STATUS: FINAL`) in its header zone — the
region between the `# SPEC:` title line and the first `##` section
header.

Signature:
    check_status_marker(spec_content: str) -> tuple[bool, str]

Returns (True, "") if a valid marker is present in the correct
position. Returns (False, reason) otherwise, where `reason` is a
human-readable message suitable for inclusion in a gate block.
"""

import os
import sys

# Make the hook directory importable so tests can find the function
# under test. Assumes tests/hooks/ sits alongside hooks/ at repo root.
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(REPO_ROOT, "hooks"))

from recursion_repair_gate import check_status_marker  # noqa: E402


# ── Valid SPECs ──────────────────────────────────────────────────────────────

def test_valid_approved():
    spec = "# SPEC: foo/bar.py\n\nSTATUS: APPROVED\n\n## Goal\n\nDo the thing.\n"
    ok, reason = check_status_marker(spec)
    assert ok is True
    assert reason == ""


def test_valid_final():
    spec = "# SPEC: foo/bar.py\n\nSTATUS: FINAL\n\n## Goal\n\nDo the thing.\n"
    ok, reason = check_status_marker(spec)
    assert ok is True
    assert reason == ""


def test_valid_no_space_after_colon():
    spec = "# SPEC: foo/bar.py\n\nSTATUS:APPROVED\n\n## Goal\n\nDo it.\n"
    ok, reason = check_status_marker(spec)
    assert ok is True
    assert reason == ""


def test_valid_extra_whitespace_after_colon():
    spec = "# SPEC: foo/bar.py\n\nSTATUS:   APPROVED\n\n## Goal\n\nDo it.\n"
    ok, reason = check_status_marker(spec)
    assert ok is True
    assert reason == ""


def test_valid_trailing_whitespace_on_status_line():
    spec = "# SPEC: foo/bar.py\n\nSTATUS: APPROVED   \n\n## Goal\n\nDo it.\n"
    ok, reason = check_status_marker(spec)
    assert ok is True
    assert reason == ""


def test_valid_crlf_line_endings():
    spec = "# SPEC: foo/bar.py\r\n\r\nSTATUS: APPROVED\r\n\r\n## Goal\r\n\r\nDo it.\r\n"
    ok, reason = check_status_marker(spec)
    assert ok is True
    assert reason == ""


def test_valid_status_immediately_after_title_no_blank_line():
    spec = "# SPEC: foo/bar.py\nSTATUS: APPROVED\n\n## Goal\n\nDo it.\n"
    ok, reason = check_status_marker(spec)
    assert ok is True
    assert reason == ""


def test_valid_multiple_blank_lines_before_status():
    spec = "# SPEC: foo/bar.py\n\n\n\nSTATUS: APPROVED\n\n## Goal\n\nDo it.\n"
    ok, reason = check_status_marker(spec)
    assert ok is True
    assert reason == ""


def test_valid_multiple_status_lines_first_wins():
    spec = (
        "# SPEC: foo/bar.py\n\n"
        "STATUS: APPROVED\n"
        "STATUS: DRAFT\n\n"
        "## Goal\n\nDo it.\n"
    )
    ok, reason = check_status_marker(spec)
    assert ok is True
    assert reason == ""


# ── Missing or malformed title ───────────────────────────────────────────────

def test_empty_string():
    ok, reason = check_status_marker("")
    assert ok is False
    assert "title" in reason.lower()


def test_no_title_line():
    spec = "STATUS: APPROVED\n\n## Goal\n\nDo it.\n"
    ok, reason = check_status_marker(spec)
    assert ok is False
    assert "title" in reason.lower()


def test_title_line_without_spec_prefix():
    spec = "# Something else\n\nSTATUS: APPROVED\n\n## Goal\n"
    ok, reason = check_status_marker(spec)
    assert ok is False
    assert "title" in reason.lower()


# ── Missing STATUS line ──────────────────────────────────────────────────────

def test_no_status_line_at_all():
    spec = "# SPEC: foo/bar.py\n\n## Goal\n\nDo it.\n"
    ok, reason = check_status_marker(spec)
    assert ok is False
    assert "STATUS" in reason


def test_status_only_in_body_after_goal():
    spec = (
        "# SPEC: foo/bar.py\n\n"
        "## Goal\n\n"
        "STATUS: APPROVED\n\n"
        "Do the thing.\n"
    )
    ok, reason = check_status_marker(spec)
    assert ok is False
    assert "STATUS" in reason


# ── Invalid STATUS values ────────────────────────────────────────────────────

def test_status_draft_rejected():
    spec = "# SPEC: foo/bar.py\n\nSTATUS: DRAFT\n\n## Goal\n\nDo it.\n"
    ok, reason = check_status_marker(spec)
    assert ok is False
    assert "DRAFT" in reason


def test_status_pending_rejected():
    spec = "# SPEC: foo/bar.py\n\nSTATUS: pending\n\n## Goal\n\nDo it.\n"
    ok, reason = check_status_marker(spec)
    assert ok is False
    assert "pending" in reason


def test_status_value_wrong_case_rejected():
    spec = "# SPEC: foo/bar.py\n\nSTATUS: approved\n\n## Goal\n\nDo it.\n"
    ok, reason = check_status_marker(spec)
    assert ok is False
    assert "approved" in reason


def test_status_value_with_trailing_text_rejected():
    spec = "# SPEC: foo/bar.py\n\nSTATUS: APPROVED and locked\n\n## Goal\n\nDo it.\n"
    ok, reason = check_status_marker(spec)
    assert ok is False
    assert "APPROVED and locked" in reason


def test_status_key_wrong_case_rejected():
    spec = "# SPEC: foo/bar.py\n\nStatus: APPROVED\n\n## Goal\n\nDo it.\n"
    ok, reason = check_status_marker(spec)
    assert ok is False
    assert "STATUS" in reason


def test_status_empty_value():
    spec = "# SPEC: foo/bar.py\n\nSTATUS:\n\n## Goal\n\nDo it.\n"
    ok, reason = check_status_marker(spec)
    assert ok is False


# ── Boundary cases ───────────────────────────────────────────────────────────

def test_status_after_h3_inside_header_zone():
    spec = (
        "# SPEC: foo/bar.py\n\n"
        "### A note\n\n"
        "STATUS: APPROVED\n\n"
        "## Goal\n\nDo it.\n"
    )
    ok, reason = check_status_marker(spec)
    assert ok is True
    assert reason == ""


def test_title_is_only_line():
    spec = "# SPEC: foo/bar.py\n"
    ok, reason = check_status_marker(spec)
    assert ok is False
    assert "STATUS" in reason
