#!/usr/bin/env python3
"""
CODE QUALITY GATE — PreToolUse hook for Write and Edit operations.

Prevention-level enforcement. Scans the CONTENT being written (not just
the file path) and blocks writes that introduce known-bad patterns.

Unlike entropy_scan.py (which detects rot AFTER it lands), this hook
prevents rot from reaching disk.

Checks (all on code files only — .py, .js, .ts, .svelte):
  1. Empty catch blocks / silent exception suppression (F38, F43)
  2. Resource opens without finally blocks (F41)
  3. Unhandled promise rejections (F38)
  4. Dead code patterns (always-true/false conditions)
  5. Domain vocabulary in function names (F14)
  6. Unverified imports (F02) — checks against manifests
  7. Unsourced precision values in docs (F48)
  8. INCOMPLETE/TODO/HACK markers in "complete" files (F51)
  9. Hardcoded credentials in code (F32)
  10. Lockfile presence on npm operations

Non-code files and exempt paths are skipped.
Exit 2 = block. Exit 0 = allow. Stderr for block messages.
"""

import json
import os
import re
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXEMPT_PREFIXES = [
    ".claude/", ".claude\\",
    "hooks/", "hooks\\",
    "PROTOCOL/SESSION_LOG.md", "PROTOCOL\\SESSION_LOG.md",
    ".gitignore", ".env",
    "Retired/", "Retired\\",
]

CODE_EXTENSIONS = (".py", ".js", ".ts", ".svelte")
DOC_EXTENSIONS = (".md",)

# Domain terms that should not appear in function/method names
DOMAIN_TERMS = {
    "aetherroot", "solenne", "vireth", "lumora", "hearth_song",
    "starwell", "noirune", "tahl_veyra", "orrin", "esh_vala",
    "shai_mara", "thren_alae", "metamorphosis_synthesis", "black_pearl",
    "elarian_anchor", "resonance_engine", "thread_trace", "daily_nexus",
    "emergence_detector", "signal_grading", "drift_taxonomy",
    "pattern_convergence", "witness_scroll",
}

# Python stdlib modules (for import verification)
PYTHON_STDLIB = {
    "os", "sys", "re", "json", "datetime", "hashlib", "subprocess",
    "pathlib", "collections", "typing", "enum", "abc", "functools",
    "itertools", "math", "random", "string", "io", "copy", "time",
    "logging", "unittest", "dataclasses", "contextlib", "textwrap",
    "uuid", "base64", "urllib", "http", "socket", "sqlite3", "csv",
    "shutil", "tempfile", "glob", "fnmatch", "struct", "importlib",
    "asyncio", "concurrent", "multiprocessing", "threading",
}

CREDENTIAL_PATTERNS = [
    r'(?:API_KEY|APIKEY|api_key)\s*[=:]\s*["\'][A-Za-z0-9_\-]{8,}',
    r'(?:SECRET|secret|SECRET_KEY|secret_key)\s*[=:]\s*["\'][A-Za-z0-9_\-]{8,}',
    r'(?:PASSWORD|password|passwd)\s*[=:]\s*["\'][^"\']{4,}',
    r'(?:TOKEN|token|AUTH_TOKEN|auth_token)\s*[=:]\s*["\'][A-Za-z0-9_\-]{8,}',
    r'(?:B2_KEY_ID|B2_APP_KEY)\s*[=:]\s*["\'][^"\']{8,}',
    r'sk-[A-Za-z0-9]{20,}',
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


def get_file_path_and_content():
    """Extract file path and content being written from tool input."""
    tool_input = os.environ.get("CLAUDE_TOOL_INPUT", "")
    if not tool_input:
        return "", ""
    try:
        params = json.loads(tool_input)
    except (json.JSONDecodeError, TypeError):
        return "", ""

    file_path = params.get("file_path", "")
    # Write tool: content parameter. Edit tool: new_string parameter.
    content = params.get("content", "") or params.get("new_string", "")
    return file_path, content


def block(rel_path, check_name, message):
    sys.stderr.write(
        f"\n  CODE QUALITY GATE — BLOCKED\n"
        f"  File: {rel_path}\n"
        f"  Check: {check_name}\n"
        f"  {message}\n"
    )
    sys.exit(2)


def warn(rel_path, check_name, message):
    """Soft warning — does not block."""
    sys.stdout.write(
        f"\n  CODE QUALITY WARNING: [{check_name}] {rel_path}\n"
        f"  {message}\n"
    )


# ── CHECK 1: Empty catch blocks (F38, F43) ──────────────────────────────────

def check_empty_catches(rel_path, content, lines):
    for i, line in enumerate(lines):
        stripped = line.strip()

        # Python: bare except with pass
        if rel_path.endswith(".py"):
            if stripped in ("except:", "except Exception:"):
                for j in range(i + 1, min(i + 4, len(lines))):
                    next_line = lines[j].strip()
                    if next_line == "pass":
                        block(rel_path, "empty-catch",
                              f"Line {i+1}: Empty except block (catch and suppress).\n"
                              f"  Handle the exception or re-raise. Catching is not handling.")
                    elif next_line and not next_line.startswith("#"):
                        break

        # JS/TS: empty catch block
        if rel_path.endswith((".js", ".ts", ".svelte")):
            if re.search(r'catch\s*\([^)]*\)\s*\{\s*\}', stripped):
                block(rel_path, "empty-catch",
                      f"Line {i+1}: Empty catch block.\n"
                      f"  Handle the error or re-throw.")


# ── CHECK 2: Resource opens without finally (F41) ───────────────────────────

def check_resource_cleanup(rel_path, content, lines):
    if not rel_path.endswith(".py"):
        return

    # Look for open() calls not inside with statements or try/finally
    for i, line in enumerate(lines):
        stripped = line.strip()
        if "open(" in stripped and not stripped.startswith("with ") and not stripped.startswith("#"):
            # Check if we're inside a with block (look at indentation context)
            # Simple heuristic: if the line assigns to a variable and there's no
            # "with" on this line, warn
            if re.search(r'=\s*open\(', stripped):
                # Check surrounding context for finally
                context_start = max(0, i - 10)
                context = "\n".join(lines[context_start:i + 5])
                if "finally" not in context and "with " not in context:
                    warn(rel_path, "resource-cleanup",
                         f"Line {i+1}: File open() without 'with' statement or try/finally.\n"
                         f"  Resource cleanup belongs in finally blocks or use context managers.")


# ── CHECK 3: Unhandled promise rejections (F38) ─────────────────────────────

def check_promise_handling(rel_path, content, lines):
    if not rel_path.endswith((".js", ".ts", ".svelte")):
        return

    for i, line in enumerate(lines):
        stripped = line.strip()
        # .then() without .catch()
        if ".then(" in stripped:
            # Look ahead for .catch on same or next few lines
            context = "\n".join(lines[i:min(i + 5, len(lines))])
            if ".catch(" not in context and "await " not in lines[i].strip():
                warn(rel_path, "promise-rejection",
                     f"Line {i+1}: .then() without .catch() — unhandled rejection.\n"
                     f"  Add .catch() or use async/await with try/catch.")


# ── CHECK 4: Dead code patterns ──────────────────────────────────────────────

def check_dead_code(rel_path, content, lines):
    for i, line in enumerate(lines):
        stripped = line.strip()

        # if True / if False
        if re.match(r'^if\s+(True|False)\s*:', stripped):
            warn(rel_path, "dead-code",
                 f"Line {i+1}: Condition is always {stripped.split()[1]} — dead branch.")

        # JS: if (true) / if (false)
        if re.match(r'^if\s*\(\s*(true|false)\s*\)', stripped):
            warn(rel_path, "dead-code",
                 f"Line {i+1}: Condition is always {stripped} — dead branch.")

        # return followed by code at same indent level
        if stripped.startswith("return ") or stripped == "return":
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                # Same or less indentation = unreachable
                if next_line.strip() and not next_line.strip().startswith(("#", "//", "}", "except", "elif", "else", "finally", "case")):
                    curr_indent = len(line) - len(line.lstrip())
                    next_indent = len(next_line) - len(next_line.lstrip())
                    if next_indent <= curr_indent and next_line.strip():
                        warn(rel_path, "dead-code",
                             f"Line {i+2}: Unreachable code after return on line {i+1}.")


# ── CHECK 5: Domain vocabulary in function names (F14) ───────────────────────

def check_domain_naming(rel_path, content, lines):
    for i, line in enumerate(lines):
        fn_match = re.match(r'\s*def\s+(\w+)', line)
        if not fn_match:
            fn_match = re.match(r'\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)', line)
        if not fn_match:
            fn_match = re.match(r'\s*(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(', line)

        if fn_match:
            name = fn_match.group(1).lower()
            for term in DOMAIN_TERMS:
                if term in name:
                    block(rel_path, "domain-naming",
                          f"Line {i+1}: Function '{fn_match.group(1)}' contains domain term '{term}'.\n"
                          f"  Function names use plain technical language only (CLAUDE.md).")
                    break


# ── CHECK 6: Unverified imports (F02) ────────────────────────────────────────

def check_imports(rel_path, content, lines):
    # Load manifests once
    if rel_path.endswith(".py"):
        req_path = os.path.join(PROJECT_ROOT, "backend", "requirements.txt")
        known = set(PYTHON_STDLIB)
        if os.path.exists(req_path):
            try:
                with open(req_path, "r", encoding="utf-8") as f:
                    for req_line in f:
                        req_line = req_line.strip()
                        if req_line and not req_line.startswith("#"):
                            pkg = re.split(r'[>=<!\[]', req_line)[0].strip().lower()
                            known.add(pkg)
            except IOError:
                pass

        for i, line in enumerate(lines):
            match = re.match(r'^(?:from|import)\s+(\w+)', line.strip())
            if match:
                mod = match.group(1)
                if mod.lower() not in known:
                    # Check if it's a local module
                    if not os.path.exists(os.path.join(os.path.dirname(os.path.join(PROJECT_ROOT, rel_path)), mod)):
                        if not os.path.exists(os.path.join(os.path.dirname(os.path.join(PROJECT_ROOT, rel_path)), mod + ".py")):
                            warn(rel_path, "unverified-import",
                                 f"Line {i+1}: Import '{mod}' not found in requirements.txt or stdlib.\n"
                                 f"  Verify it exists before using (CLAUDE.md enforcement rules).")

    elif rel_path.endswith((".js", ".ts", ".svelte")):
        pkg_path = os.path.join(PROJECT_ROOT, "frontend", "package.json")
        known_js = {"$app", "$env", "svelte", "svelte/store", "svelte/transition"}
        if os.path.exists(pkg_path):
            try:
                with open(pkg_path, "r", encoding="utf-8") as f:
                    pkg = json.load(f)
                known_js.update(pkg.get("dependencies", {}).keys())
                known_js.update(pkg.get("devDependencies", {}).keys())
            except (json.JSONDecodeError, IOError):
                pass

        for i, line in enumerate(lines):
            match = re.match(r'''^\s*import\s+.*?from\s+['"]([^./][^'"]*?)['"]''', line)
            if match:
                pkg = match.group(1).split("/")[0]
                if pkg.startswith("@"):
                    pkg = "/".join(match.group(1).split("/")[:2])
                if pkg not in known_js:
                    warn(rel_path, "unverified-import",
                         f"Line {i+1}: Import '{pkg}' not in package.json.\n"
                         f"  Verify it exists before using (CLAUDE.md enforcement rules).")


# ── CHECK 7: Unsourced precision values in docs (F48) ────────────────────────

def check_precision_values(rel_path, content, lines):
    if not rel_path.endswith(".md"):
        return
    # Skip known files that legitimately contain numbers
    basename = os.path.basename(rel_path)
    if basename in ("SESSION_LOG.md", "ROT_REGISTRY.md", "ENTROPY_EXCAVATION.md",
                    "SECTION MAP.md", "TAG VOCABULARY.md", "CLAUDE.md"):
        return

    for i, line in enumerate(lines):
        # Look for specific threshold/timeout/count patterns without source
        patterns = [
            (r'timeout\s*[:=]\s*(\d{3,})', "timeout value"),
            (r'threshold\s*[:=]\s*(\d+\.?\d*)', "threshold value"),
            (r'retry\s*[:=]\s*(\d+)', "retry count"),
            (r'max\s*[:=]\s*(\d{3,})', "max value"),
            (r'interval\s*[:=]\s*(\d{3,})', "interval value"),
        ]
        for pattern, desc in patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                # Check if the line or next line has a source comment
                context = line + (lines[i + 1] if i + 1 < len(lines) else "")
                if not re.search(r'source:|per |from |see |ref:|measured|tested|baseline', context, re.IGNORECASE):
                    warn(rel_path, "unsourced-precision",
                         f"Line {i+1}: {desc} '{match.group(1)}' — no source cited.\n"
                         f"  Precision values must be sourced (CLAUDE.md enforcement rules).")


# ── CHECK 8: INCOMPLETE/TODO markers (F51) ───────────────────────────────────

def check_incomplete_markers(rel_path, content, lines):
    markers_found = []
    for i, line in enumerate(lines):
        for marker in ("INCOMPLETE", "TODO", "HACK", "FIXME", "PLACEHOLDER", "STUB"):
            if marker in line and not line.strip().startswith("#") and not line.strip().startswith("//"):
                # Skip if it's in a comment about detecting these markers
                if "marker" in line.lower() or "scan" in line.lower() or "pattern" in line.lower():
                    continue
                markers_found.append((i + 1, marker, line.strip()[:80]))

    if markers_found:
        # Warn, don't block — these are legitimate during BUILD phase
        for line_num, marker, context in markers_found[:3]:
            warn(rel_path, "incomplete-marker",
                 f"Line {line_num}: {marker} marker found: {context}")


# ── CHECK 9: Hardcoded credentials (F32) ─────────────────────────────────────

def check_credentials(rel_path, content, lines):
    if rel_path.endswith(".md"):
        return
    # Skip .env files
    if os.path.basename(rel_path).startswith(".env"):
        return

    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("#") or stripped.startswith("//"):
            continue
        for pattern in CREDENTIAL_PATTERNS:
            if re.search(pattern, line):
                block(rel_path, "credential",
                      f"Line {i+1}: Hardcoded credential pattern detected.\n"
                      f"  Move to .env — GITHUB_PROTOCOL.md §5.")


# ── CHECK 10: Lockfile presence ──────────────────────────────────────────────
# This check is in bash_safety_gate.py, not here (it's a Bash command check).
# Including a write-side check: if package.json is being written, verify
# lockfile exists.

def check_lockfile(rel_path, content, lines):
    if os.path.basename(rel_path) != "package.json":
        return
    lockfile = os.path.join(os.path.dirname(os.path.join(PROJECT_ROOT, rel_path)), "package-lock.json")
    if not os.path.exists(lockfile):
        warn(rel_path, "lockfile-missing",
             "package.json being written but package-lock.json does not exist.\n"
             "  Run npm ci to generate lockfile from this manifest.")


# ── CHECK 11: Contamination prevention (L3-002 through L3-009) ───────────────
# These patterns were previously only detected at close audit by entropy_scan.
# Now prevented at write time.

CONTAMINATION_BLOCKS = [
    # (pattern, description, applies_to) — applies_to: "code", "doc", "any"
    (r'\barcPhase\b', "arcPhase reference — replaced by phase_state (L3-003)", "any"),
    (r'\bt0[1-9]\b|\bt1[0-2]\b', "Old threshold ID (t01-t12) — correct: th01-th12 (L3-004)", "any"),
    (r'\bIDB\b', "Old architecture: IDB/IndexedDB (L3-005)", "any"),
    (r'\bIndexedDB\b', "Old architecture: IndexedDB (L3-005)", "any"),
    (r'\bdata\.js\b', "Old architecture: data.js (L3-005)", "any"),
    (r'\bemergence\.js\b', "Old architecture: emergence.js (L3-005)", "any"),
    (r'\bschema\.js\b', "Old architecture: schema.js (L3-005)", "any"),
    (r'window\.ThreadTraceUI', "Old architecture: window.ThreadTraceUI (L3-005)", "any"),
    (r'Threshold Studies', "Wrong framework name — correct: Threshold Pillars (L3-009)", "any"),
]

CONTAMINATION_WARNS = [
    (r'[╔╗║╚╝]', "Box-drawing formatting (old build encoding artifact) (L3-002)", "doc"),
    (r'\b43\s+sections\b', "Stale count: 43 sections (correct: 50) (L3-006)", "doc"),
    (r'\b46\s+domains\b', "Stale count: 46 domains (correct: 50) (L3-006)", "doc"),
    (r'\b8\s+groups\b', "Stale count: 8 groups (correct: 9) (L3-006)", "doc"),
    (r'\b7\s+detectors?\b', "Stale count: 7 detectors (correct: 8) (L3-006)", "doc"),
]

VERSION_CONTAMINATION_PATTERN = re.compile(r'\b[Vv](\d+(?:\.\d+)?)\b')


def check_contamination(rel_path, content, lines):
    """Prevent known contamination patterns from reaching disk."""
    is_code = rel_path.endswith(CODE_EXTENSIONS)
    is_doc = rel_path.endswith(DOC_EXTENSIONS)

    # Skip files that document these patterns (entropy scan, rot registry, etc.)
    basename = os.path.basename(rel_path)
    if basename in ("entropy_scan.py", "code_quality_gate.py", "ROT_REGISTRY.md",
                    "ENTROPY_EXCAVATION.md", "ROT_OPEN.md"):
        return

    for i, line in enumerate(lines):
        # Hard blocks — contamination markers
        for pattern, desc, scope in CONTAMINATION_BLOCKS:
            if scope == "any" or (scope == "code" and is_code) or (scope == "doc" and is_doc):
                if re.search(pattern, line):
                    block(rel_path, "contamination",
                          f"Line {i+1}: {desc}")

        # Soft warns — stale counts and formatting
        for pattern, desc, scope in CONTAMINATION_WARNS:
            if scope == "any" or (scope == "code" and is_code) or (scope == "doc" and is_doc):
                if re.search(pattern, line):
                    warn(rel_path, "contamination",
                         f"Line {i+1}: {desc}")

        # Version contamination in docs (L3-008)
        if is_doc and basename not in ("CLAUDE.md", "SESSION_LOG.md"):
            for match in VERSION_CONTAMINATION_PATTERN.finditer(line):
                version = match.group(1)
                if version not in ("1", "1.0"):
                    context = line.lower()
                    if "http" not in context and "localhost" not in context:
                        warn(rel_path, "version-contamination",
                             f"Line {i+1}: Version V{version} — everything is V1 (L3-008)")


# ── CHECK 12: SRI hash validation on HTML writes (L2-002) ────────────────────

def check_sri_hashes(rel_path, content, lines):
    """Prevent CDN resources without SRI integrity attributes."""
    if not rel_path.endswith((".html", ".svelte")):
        return

    for i, line in enumerate(lines):
        if re.search(r'<script\s[^>]*src\s*=\s*["\']https?://', line):
            context = " ".join(lines[max(0, i-1):min(i+3, len(lines))])
            if 'integrity=' not in context:
                block(rel_path, "sri-missing",
                      f"Line {i+1}: CDN script without SRI hash.\n"
                      f"  Add integrity attribute — GITHUB_PROTOCOL.md §3.")

        if re.search(r'<link\s[^>]*href\s*=\s*["\']https?://', line):
            context = " ".join(lines[max(0, i-1):min(i+3, len(lines))])
            if 'integrity=' not in context:
                block(rel_path, "sri-missing",
                      f"Line {i+1}: CDN stylesheet without SRI hash.\n"
                      f"  Add integrity attribute — GITHUB_PROTOCOL.md §3.")


# ── MAIN ─────────────────────────────────────────────────────────────────────

ALL_CHECKS_CODE = [
    check_empty_catches,
    check_resource_cleanup,
    check_promise_handling,
    check_dead_code,
    check_domain_naming,
    check_imports,
    check_credentials,
    check_contamination,
    check_sri_hashes,
]

ALL_CHECKS_DOC = [
    check_precision_values,
    check_incomplete_markers,
    check_contamination,
]

ALL_CHECKS_ANY = [
    check_lockfile,
]


def main():
    tool_name = os.environ.get("CLAUDE_TOOL_NAME", "")
    if tool_name not in ("Write", "Edit"):
        sys.exit(0)

    file_path, content = get_file_path_and_content()
    if not file_path:
        sys.exit(0)

    rel_path = get_relative_path(file_path)

    if is_exempt(rel_path):
        sys.exit(0)

    if not content:
        sys.exit(0)

    lines = content.split("\n")

    # Run code checks on code files
    if rel_path.endswith(CODE_EXTENSIONS):
        for check in ALL_CHECKS_CODE:
            check(rel_path, content, lines)

    # Run doc checks on doc files
    if rel_path.endswith(DOC_EXTENSIONS):
        for check in ALL_CHECKS_DOC:
            check(rel_path, content, lines)

    # Run universal checks
    for check in ALL_CHECKS_ANY:
        check(rel_path, content, lines)

    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        # Fail closed
        sys.stderr.write(f"\n  CODE QUALITY GATE — ERROR\n  Hook crashed: {e}\n  Blocking as safety measure.\n")
        sys.exit(2)
