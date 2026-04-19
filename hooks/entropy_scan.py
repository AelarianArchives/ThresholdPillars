#!/usr/bin/env python3
"""
ENTROPY EXCAVATION SCANNER
Automated rot detection and drift prevention for the Aelarian Archives.

Run from project root:
  python hooks/entropy_scan.py                       — full scan, all categories
  python hooks/entropy_scan.py --summary             — counts only, no details
  python hooks/entropy_scan.py --category 1          — run specific category only
  python hooks/entropy_scan.py --close-audit         — session close audit (creates marker if clean)
  python hooks/entropy_scan.py --close-audit --force — create marker even with findings (after Sage review)

Categories:
  1  Contamination markers (known bad strings)
  2  Phantom file references
  3  Stale counts
  4  Canonical value verification
  5  Threshold order verification
  6  File path header verification
  7  Spelling enforcement
  8  BUILD FLAG status
  9  Temporary markers
  10 Formatting corruption
  11 Version contamination
  12 Cross-file count consistency
  13 Gitignore completeness
  14 Credential patterns in code
  15 Import/library verification
  16 Error handling patterns
  17 Performance assertions
  18 Domain vocabulary in code
  19 SRI hash validation

Sources: Entropy Excavation audit checklist, ARCPHASE_ROT_CLEANUP,
ROT_CONTAMINATION_REPORT, TAG VOCABULARY (verified), SECTION MAP.

This scanner does NOT pass through Claude. Run it directly.
"""

import json
import os
import re
import sys
from collections import defaultdict

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── Severity ──────────────────────────────────────────────────────────────────

HIGH = "HIGH"
MEDIUM = "MEDIUM"
LOW = "LOW"

# ── Canonical data (hardcoded from VERIFIED sources) ──────────────────────────

# Correct threshold mapping (TAG VOCABULARY.md, commit 881b3dc)
CANONICAL_THRESHOLDS = {
    "th01": "Aetherroot Chord",
    "th02": "Solenne Arc",
    "th03": "Thren Alae Kai'Reth",
    "th04": "Shai'mara Veil",
    "th05": "Vireth's Anchor",
    "th06": "Esh'Vala Breath",
    "th07": "Orrin Wave",
    "th08": "Lumora Thread",
    "th09": "Hearth Song",
    "th10": "Tahl'Veyra",
    "th11": "Noirune Trai",
    "th12": "StarWell Bloom",
}

# Page codes (SECTION MAP.md)
CANONICAL_PAGE_CODES = {
    "INT", "THR", "STR", "INF", "ECR", "SNM", "MTM", "TPL", "TRI", "PRI",
    "PAR", "ORC", "MOR", "VEN", "INV", "VEC", "ECH", "LGL", "ARC", "KIN",
    "LAR", "VRT", "CAE", "SEE", "SAC", "RIT", "BRT", "MLY", "GLY", "GEN",
    "DIV", "REC", "CNV", "HCO", "COS", "CLM", "NHM", "RCT", "ART", "MVM",
    "ANC", "LQL", "ALE", "MMT", "ARV", "WSC", "LNV", "DTX", "SGR", "PCV", "VOI",
}

# Phase codes (SECTION MAP.md)
CANONICAL_PHASE_CODES = {"COM", "THR", "STB", "EMG", "COL", "DRT", "ROR", "LMH", "NUL"}

# Elarian Anchor codes (COMPOSITE ID SCHEMA.md)
CANONICAL_ANCHORS = {"RFLT", "WHSP", "VEIL", "OBSV", "RECL", "WEAV", "GATE"}

# doc_type enum (INTEGRATION SCHEMA.md)
CANONICAL_DOC_TYPES = {
    "entry", "observation", "analysis", "hypothesis", "discussion",
    "transcript", "glyph", "media", "reference",
}

# Seed IDs
CANONICAL_SEEDS = {f"s{i:02d}" for i in range(1, 41)}

# Layer IDs
CANONICAL_LAYERS = {"l01", "l02", "l03", "l04"}

# Pillar IDs
CANONICAL_PILLARS = {"p01", "p02", "p03"}

# Origin IDs
CANONICAL_ORIGINS = {"o01", "o02", "o03"}

# Correct counts
CORRECT_COUNTS = {
    "sections": 51,
    "domains": 51,
    "groups": 9,
    "tags": 320,
    "seeds": 40,
    "thresholds": 12,
    "layers": 4,
    "pillars": 3,
    "origins": 3,
    "nodes": 62,
    "detectors": 8,
    "anchors": 7,
}

# ── Scan directories ──────────────────────────────────────────────────────────

SCAN_DIRS = ["DESIGN", "PROTOCOL", "api", "backend", "frontend", "CLAUDE.md"]

# Files to skip (historical records, not living docs)
SKIP_FILES = {
    "ROT_CONTAMINATION_REPORT.md",
    "ARCPHASE_ROT_CLEANUP.md",
}

# ── Findings collection ──────────────────────────────────────────────────────

findings = []


def add_finding(category, severity, file_path, line_num, message, suggestion):
    findings.append({
        "category": category,
        "severity": severity,
        "file": os.path.relpath(file_path, PROJECT_ROOT).replace("\\", "/"),
        "line": line_num,
        "message": message,
        "suggestion": suggestion,
    })


def get_scan_files():
    """Get all files to scan."""
    scan_files = []
    for scan_target in SCAN_DIRS:
        target_path = os.path.join(PROJECT_ROOT, scan_target)
        if os.path.isfile(target_path):
            scan_files.append(target_path)
        elif os.path.isdir(target_path):
            for root, dirs, files in os.walk(target_path):
                # Skip node_modules, .svelte-kit, etc.
                dirs[:] = [d for d in dirs if d not in ("node_modules", ".svelte-kit", "__pycache__", ".git", ".venv", "venv")]
                for f in files:
                    if f in SKIP_FILES:
                        continue
                    scan_files.append(os.path.join(root, f))
    return scan_files


def read_file(path):
    """Read file, return (lines, content) or None on failure."""
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return content.split("\n"), content
    except Exception:
        return None, None


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 1: CONTAMINATION MARKERS
# ══════════════════════════════════════════════════════════════════════════════

def scan_contamination(files):
    """Known bad strings that should not appear in living documents."""

    markers = [
        # (pattern, description, severity, suggestion)
        (r'\barcPhase\b', "arcPhase reference", HIGH,
         "Replace with phase_state (12 canonical threshold names or null)"),
        (r'\baetherrot\b', "Misspelling: aetherrot", HIGH,
         "Correct to 'aetherroot' (Aetherroot Chord)"),
        (r'\bIDB\b', "Old architecture: IDB (IndexedDB)", HIGH,
         "Remove — current architecture uses PostgreSQL"),
        (r'\bIndexedDB\b', "Old architecture: IndexedDB", HIGH,
         "Remove — current architecture uses PostgreSQL"),
        (r'\bdata\.js\b', "Old architecture: data.js", HIGH,
         "Remove — current architecture uses FastAPI backend"),
        (r'\bemergence\.js\b', "Old architecture: emergence.js", HIGH,
         "Remove — current architecture uses FastAPI backend"),
        (r'\bschema\.js\b', "Old architecture: schema.js", HIGH,
         "Remove — current architecture uses FastAPI backend"),
        (r'\btags-vocab\.js\b', "Old architecture: tags-vocab.js", HIGH,
         "Remove — current architecture uses FastAPI backend"),
        (r'\bpages\.js\b', "Old architecture: pages.js", HIGH,
         "Remove — current architecture uses FastAPI backend"),
        (r'\bsnapshot\.js\b', "Old architecture: snapshot.js", HIGH,
         "Remove — current architecture uses FastAPI backend"),
        (r'window\.ThreadTraceUI', "Old architecture: window.ThreadTraceUI", HIGH,
         "Remove — current architecture uses Svelte components"),
        (r'\bindex\.html\b', "Old architecture: index.html", MEDIUM,
         "Verify — current architecture uses SvelteKit, not single HTML file"),
        (r'\bt0[1-9]\b|\bt1[0-2]\b', "Old threshold IDs (t01-t12)", HIGH,
         "Correct to th01-th12"),
        (r'Threshold Studies', "Wrong framework name", MEDIUM,
         "Correct to 'Threshold Pillars'"),
    ]

    for fpath in files:
        lines, content = read_file(fpath)
        if not lines:
            continue
        for i, line in enumerate(lines, 1):
            for pattern, desc, severity, suggestion in markers:
                if re.search(pattern, line):
                    add_finding(1, severity, fpath, i, desc, suggestion)


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 2: PHANTOM FILE REFERENCES
# ══════════════════════════════════════════════════════════════════════════════

def scan_phantom_refs(files):
    """File names referenced in documents that don't exist on disk."""

    # Patterns that look like .md file references:
    # - "SYSTEM_ Something.md"
    # - "SOMETHING SCHEMA.md"
    # - "SOMETHING SOMETHING.md" (2+ uppercase words)
    # Only match sequences of uppercase words, spaces, and underscores ending in .md
    # Do NOT use IGNORECASE — we only want uppercase file names
    file_patterns = [
        re.compile(r'\bSYSTEM_\s+[A-Z][A-Za-z\' ]+\.md'),
        re.compile(r'\b[A-Z][A-Z]{2,}[A-Z ]+SCHEMA\.md'),
        re.compile(r'\b[A-Z][A-Z]{3,} [A-Z][A-Z ]+\.md'),
    ]

    # Build index of existing .md files
    existing_files = set()
    for root, dirs, fnames in os.walk(PROJECT_ROOT):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".svelte-kit", "__pycache__", ".git", ".claude")]
        for f in fnames:
            if f.endswith(".md"):
                existing_files.add(f)

    seen = set()  # deduplicate per file

    for fpath in files:
        lines, content = read_file(fpath)
        if not lines:
            continue
        file_seen = set()
        for i, line in enumerate(lines, 1):
            for pattern in file_patterns:
                for match in pattern.finditer(line):
                    ref_name = match.group(0).strip()
                    if ref_name in file_seen:
                        continue
                    if ref_name not in existing_files:
                        # Check with different spacing
                        found = False
                        for ef in existing_files:
                            if ef.replace(" ", "") == ref_name.replace(" ", ""):
                                found = True
                                break
                        if not found:
                            file_seen.add(ref_name)
                            add_finding(2, HIGH, fpath, i,
                                        f"Phantom reference: {ref_name}",
                                        f"File '{ref_name}' not found on disk")


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 3: STALE COUNTS
# ══════════════════════════════════════════════════════════════════════════════

def scan_stale_counts(files):
    """Numbers that were true in the old build but not the current one."""

    stale_patterns = [
        (r'\b43\s+sections\b', "43 sections (correct: 51)", HIGH),
        (r'\b46\s+domains\b', "46 domains (correct: 51)", HIGH),
        (r'\b50\s+sections\b', "50 sections (correct: 51)", HIGH),
        (r'\b50\s+domains\b', "50 domains (correct: 51)", HIGH),
        (r'\b8\s+groups\b', "8 groups (correct: 9)", HIGH),
        (r'\beight\s+groups\b', "eight groups (correct: 9)", HIGH),
        (r'\b7\s+detectors?\b', "7 detectors (correct: 8)", HIGH),
        (r'\bseven\s+detectors?\b', "seven detectors (correct: 8)", HIGH),
        (r'\b200\s+tags\b', "200 tags (correct: 320)", HIGH),
        (r'\b20\s+seeds\b(?!.*analytical)', "20 seeds — verify context (total: 40, signal: 20)", MEDIUM),
        (r'\b47\s+nodes\b', "47 nodes (correct: 62)", HIGH),
        (r'\b13\s+thresholds\b', "13 thresholds (correct: 12)", HIGH),
    ]

    for fpath in files:
        lines, content = read_file(fpath)
        if not lines:
            continue
        for i, line in enumerate(lines, 1):
            for pattern, desc, severity in stale_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    add_finding(3, severity, fpath, i, desc,
                                "Update to correct count per SECTION MAP / TAG VOCABULARY")


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 4: CANONICAL VALUE VERIFICATION
# ══════════════════════════════════════════════════════════════════════════════

def scan_canonical_values(files):
    """IDs referenced that don't exist in canonical sources."""

    # Only scan design/protocol files for canonical value issues
    for fpath in files:
        if not fpath.endswith((".md", ".txt")):
            continue
        lines, content = read_file(fpath)
        if not lines:
            continue

        fname = os.path.basename(fpath)
        # Skip TAG VOCABULARY itself (it defines the canonical values)
        if fname == "TAG VOCABULARY.md" or fname == "SECTION MAP.md":
            continue

        for i, line in enumerate(lines, 1):
            # Check threshold IDs
            for match in re.finditer(r'\b(th\d{2})\b', line):
                tid = match.group(1)
                if tid not in CANONICAL_THRESHOLDS:
                    add_finding(4, HIGH, fpath, i,
                                f"Invalid threshold ID: {tid}",
                                f"Not in canonical set (th01-th12)")

            # Check seed IDs (only explicit references, not inside words)
            for match in re.finditer(r'\b(s\d{2})\b', line):
                sid = match.group(1)
                num = int(sid[1:])
                if 1 <= num <= 40 and sid not in CANONICAL_SEEDS:
                    add_finding(4, MEDIUM, fpath, i,
                                f"Invalid seed ID: {sid}",
                                f"Not in canonical set (s01-s40)")

            # Check layer IDs
            for match in re.finditer(r'\b(l\d{2})\b', line):
                lid = match.group(1)
                if lid not in CANONICAL_LAYERS and not lid.startswith("l0"):
                    continue
                if lid.startswith("l") and len(lid) == 3 and lid not in CANONICAL_LAYERS:
                    add_finding(4, MEDIUM, fpath, i,
                                f"Invalid layer ID: {lid}",
                                f"Not in canonical set (l01-l04)")


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 5: THRESHOLD ORDER VERIFICATION
# ══════════════════════════════════════════════════════════════════════════════

def scan_threshold_order(files):
    """Files listing thresholds with IDs — verify order matches canonical."""

    for fpath in files:
        lines, content = read_file(fpath)
        if not lines:
            continue

        fname = os.path.basename(fpath)
        if fname == "TAG VOCABULARY.md":
            continue

        # Find sequences of threshold ID + name pairs
        th_sequence = []
        for i, line in enumerate(lines, 1):
            match = re.search(r'\b(th\d{2})\b.*?(Aetherroot Chord|Solenne Arc|Thren Alae Kai.Reth|Shai.mara Veil|Vireth.s Anchor|Esh.Vala Breath|Orrin Wave|Lumora Thread|Hearth Song|Tahl.Veyra|Noirune Trai|StarWell Bloom)', line)
            if match:
                tid = match.group(1)
                name = match.group(2)
                # Normalize name
                for canon_name in CANONICAL_THRESHOLDS.values():
                    if canon_name.lower().replace("'", "").replace("'", "") in name.lower().replace("'", "").replace("'", ""):
                        name = canon_name
                        break
                th_sequence.append((i, tid, name))

        # Check if any threshold is mapped to the wrong name
        for line_num, tid, name in th_sequence:
            if tid in CANONICAL_THRESHOLDS:
                expected_name = CANONICAL_THRESHOLDS[tid]
                if name != expected_name:
                    add_finding(5, HIGH, fpath, line_num,
                                f"Wrong threshold mapping: {tid} listed as '{name}' (correct: '{expected_name}')",
                                f"Update to match TAG VOCABULARY.md (commit 881b3dc)")


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 6: FILE PATH HEADER VERIFICATION
# ══════════════════════════════════════════════════════════════════════════════

def scan_file_path_headers(files):
    """Files with path headers that don't match actual location."""

    for fpath in files:
        lines, content = read_file(fpath)
        if not lines:
            continue

        # Look for path headers in first 10 lines
        for i, line in enumerate(lines[:10], 1):
            match = re.search(r'/DESIGN/[Ss]ystems?/\S+\.md', line)
            if match:
                header_path = match.group(0)
                # Check for old-style paths
                if "_v1" in header_path or "_v2" in header_path:
                    add_finding(6, HIGH, fpath, i,
                                f"Old file path header: {header_path}",
                                "Update to current path — this indicates the file was not rewritten clean")
                # Check for lowercase 'systems' (old build used lowercase)
                if "/systems/" in header_path:
                    add_finding(6, MEDIUM, fpath, i,
                                f"Lowercase path header: {header_path}",
                                "Current directory is /DESIGN/Systems/ (capital S)")


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 7: SPELLING ENFORCEMENT
# ══════════════════════════════════════════════════════════════════════════════

def scan_spelling(files):
    """Project-specific terms with known misspellings."""

    misspellings = [
        (r'\baetherrot\b', "aetherrot", "aetherroot", HIGH),
        (r'\bArchitypes?\b', "Architype(s)", "Archetype(s)", MEDIUM),
        (r'\bLarrimar\b', "Larrimar", "Larimar", MEDIUM),
        (r'\bLaimar\b', "Laimar", "Larimar", MEDIUM),
        (r'\bInfinit\s+Intricacy\b', "Infinit Intricacy", "Infinite Intricacy", MEDIUM),
        (r'\bThreshold\s+Studies\b', "Threshold Studies", "Threshold Pillars", MEDIUM),
        (r'\bCael.Thera\b(?!.*correct)', None, None, None),  # skip — canonical spelling varies
    ]

    for fpath in files:
        lines, content = read_file(fpath)
        if not lines:
            continue
        for i, line in enumerate(lines, 1):
            for pattern, wrong, right, severity in misspellings:
                if severity is None:
                    continue
                if re.search(pattern, line, re.IGNORECASE):
                    add_finding(7, severity, fpath, i,
                                f"Misspelling: '{wrong}'",
                                f"Correct to '{right}'")


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 8: BUILD FLAG STATUS
# ══════════════════════════════════════════════════════════════════════════════

def scan_build_flags(files):
    """BUILD FLAGS not marked COMPLETE."""

    for fpath in files:
        lines, content = read_file(fpath)
        if not lines:
            continue
        for i, line in enumerate(lines, 1):
            if re.search(r'BUILD\s+FLAG|FLAG\s+—', line, re.IGNORECASE):
                # Check if this flag or the next few lines say COMPLETE
                context = " ".join(lines[i-1:min(i+3, len(lines))])
                if "COMPLETE" not in context and "complete" not in context:
                    add_finding(8, MEDIUM, fpath, i,
                                f"Open BUILD FLAG: {line.strip()[:80]}",
                                "Verify if this flag's work is done — mark COMPLETE if so")


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 9: TEMPORARY MARKERS
# ══════════════════════════════════════════════════════════════════════════════

def scan_temporary_markers(files):
    """TODO, TEMP, HACK, FIXME etc. that may be forgotten."""

    markers = [
        (r'\bTODO\b', "TODO marker"),
        (r'\bTEMP\b(?!ORAL)', "TEMP marker"),
        (r'\bHACK\b', "HACK marker"),
        (r'\bFIXME\b', "FIXME marker"),
        (r'\bPLACEHOLDER\b', "PLACEHOLDER marker"),
        (r'\bSTUB\b(?!bed)', "STUB marker"),
    ]

    for fpath in files:
        lines, content = read_file(fpath)
        if not lines:
            continue
        for i, line in enumerate(lines, 1):
            for pattern, desc in markers:
                if re.search(pattern, line):
                    add_finding(9, LOW, fpath, i,
                                f"{desc}: {line.strip()[:80]}",
                                "Verify if this is still needed — resolve or remove")


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 10: FORMATTING CORRUPTION
# ══════════════════════════════════════════════════════════════════════════════

def scan_formatting(files):
    """Box-drawing and encoding artifacts from old build."""

    for fpath in files:
        lines, content = read_file(fpath)
        if not lines:
            continue

        fname = os.path.basename(fpath)
        rel_path = os.path.relpath(fpath, PROJECT_ROOT).replace("\\", "/")

        # Skip files that document the patterns
        if fname in ("ENTROPY_EXCAVATION.md", "ROT_CONTAMINATION_REPORT.md"):
            continue

        for i, line in enumerate(lines, 1):
            # Box-drawing: only flag in Systems schemas (known corruption marker)
            # Domain files and manifests may use box formatting intentionally
            if re.search(r'[╔╗║╚╝]', line):
                if "DESIGN/Systems/" in rel_path:
                    add_finding(10, LOW, fpath, i,
                                "Box-drawing formatting in Systems file (old build encoding artifact)",
                                "Consider removing — indicates file was not rewritten clean")

            # Double-escaped underscores (corruption in any file)
            if re.search(r'\\_', line):
                add_finding(10, MEDIUM, fpath, i,
                            "Double-escaped underscore (encoding corruption)",
                            "Remove escape character")

            # HTML entities in markdown (corruption in any .md file)
            if fpath.endswith(".md") and re.search(r'&amp;|&lt;|&gt;|&#\d+;', line):
                add_finding(10, MEDIUM, fpath, i,
                            "HTML entity in markdown (encoding corruption)",
                            "Replace with plain character")


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 11: VERSION CONTAMINATION
# ══════════════════════════════════════════════════════════════════════════════

def scan_version_contamination(files):
    """Version numbers other than V1 in design files."""

    for fpath in files:
        if not fpath.endswith(".md"):
            continue
        lines, content = read_file(fpath)
        if not lines:
            continue

        fname = os.path.basename(fpath)
        if fname in ("ENTROPY_EXCAVATION.md", "CLAUDE.md"):
            continue

        for i, line in enumerate(lines, 1):
            # Look for version patterns that aren't V1 or v1
            for match in re.finditer(r'\b[Vv](\d+(?:\.\d+)?)\b', line):
                version = match.group(1)
                if version not in ("1", "1.0"):
                    # Skip if it's in a URL, a threshold (th01), or a technical context
                    context = line.lower()
                    if "http" in context or "localhost" in context:
                        continue
                    # v0.x pre-release versioning
                    if version.startswith("0."):
                        add_finding(11, MEDIUM, fpath, i,
                                    f"Pre-release version: v{version}",
                                    "Everything in this rebuild is V1 — no pre-release versioning")
                    else:
                        add_finding(11, MEDIUM, fpath, i,
                                    f"Version contamination: V{version}",
                                    "Everything in this rebuild is V1 — verify this isn't old-build drift")

            # "Updated for vX" or "version: X" patterns
            if re.search(r'[Uu]pdated\s+(?:for|to)\s+[Vv]\d', line):
                add_finding(11, MEDIUM, fpath, i,
                            "Version update reference in prose",
                            "Everything in this rebuild is V1 — remove version update language")


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 12: CROSS-FILE COUNT CONSISTENCY
# ══════════════════════════════════════════════════════════════════════════════

def scan_count_consistency(files):
    """Verify counts mentioned in prose match canonical values."""

    count_patterns = [
        (r'(\d+)\s+sections', "sections", 51),
        (r'(\d+)\s+groups', "groups", 9),
        (r'(\d+)\s+seeds', "seeds", 40),
        (r'(\d+)\s+tags\b(?!\s*,\s*and|\s*per)', "tags", 320),
        (r'(\d+)\s+thresholds', "thresholds", 12),
        (r'(\d+)\s+nodes', "nodes", 62),
        (r'(\d+)\s+layers', "layers", 4),
        (r'(\d+)\s+pillars', "pillars", 3),
        (r'(\d+)\s+origins', "origins", 3),
        (r'(\d+)\s+detectors', "detectors", 8),
        (r'(\d+)\s+anchors?', "anchors", 7),
        (r'(\d+)\s+domains', "domains", 51),
    ]

    for fpath in files:
        if not fpath.endswith(".md"):
            continue
        lines, content = read_file(fpath)
        if not lines:
            continue

        fname = os.path.basename(fpath)
        if fname in ("ENTROPY_EXCAVATION.md",):
            continue

        for i, line in enumerate(lines, 1):
            for pattern, item, correct in count_patterns:
                for match in re.finditer(pattern, line, re.IGNORECASE):
                    found = int(match.group(1))
                    if found != correct and found > 1:
                        # Check for "4 duplicates" (not about the count of the item type)
                        if "duplicate" in line.lower():
                            continue
                        add_finding(12, HIGH if abs(found - correct) > 2 else MEDIUM,
                                    fpath, i,
                                    f"Count mismatch: {found} {item} (canonical: {correct})",
                                    f"Verify against SECTION MAP / TAG VOCABULARY")


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 13: GITIGNORE COMPLETENESS
# ══════════════════════════════════════════════════════════════════════════════

REQUIRED_GITIGNORE = [
    ".env", "*.env", "*.log", "node_modules/", "dist/", "build/",
    ".DS_Store", "Thumbs.db", "desktop.ini", "npm-debug.log*",
    "*.exe", "*.dmg", "*.pkg", "*.msi",
]


def scan_gitignore(files):
    """Verify .gitignore contains all required entries per GITHUB_PROTOCOL.md §1."""
    gitignore_path = os.path.join(PROJECT_ROOT, ".gitignore")
    if not os.path.exists(gitignore_path):
        add_finding(13, HIGH, gitignore_path, 0,
                    ".gitignore file missing",
                    "Create .gitignore with required entries per GITHUB_PROTOCOL.md §1")
        return

    lines, content = read_file(gitignore_path)
    if not content:
        return

    for entry in REQUIRED_GITIGNORE:
        # Check if the entry or a pattern covering it exists
        if entry not in content:
            add_finding(13, HIGH, gitignore_path, 0,
                        f"Missing .gitignore entry: {entry}",
                        f"Add '{entry}' per GITHUB_PROTOCOL.md §1")


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 14: CREDENTIAL PATTERNS IN CODE
# ══════════════════════════════════════════════════════════════════════════════

def scan_credentials(files):
    """Detect hardcoded credentials in source files."""
    cred_patterns = [
        (r'(?:API_KEY|APIKEY|api_key)\s*[=:]\s*["\'][A-Za-z0-9_\-]{8,}', "Possible API key"),
        (r'(?:SECRET|secret|SECRET_KEY|secret_key)\s*[=:]\s*["\'][A-Za-z0-9_\-]{8,}', "Possible secret"),
        (r'(?:PASSWORD|password|passwd|PASSWD)\s*[=:]\s*["\'][^"\']{4,}', "Possible password"),
        (r'(?:TOKEN|token|AUTH_TOKEN|auth_token)\s*[=:]\s*["\'][A-Za-z0-9_\-]{8,}', "Possible token"),
        (r'(?:B2_KEY_ID|B2_APP_KEY)\s*[=:]\s*["\'][^"\']{8,}', "Backblaze credential"),
        (r'sk-[A-Za-z0-9]{20,}', "Possible API key (sk- prefix)"),
    ]

    for fpath in files:
        if not fpath.endswith((".py", ".js", ".ts", ".svelte", ".json", ".env.example")):
            continue
        # Skip .env files (they're supposed to have credentials)
        if os.path.basename(fpath).startswith(".env"):
            continue
        lines, content = read_file(fpath)
        if not lines:
            continue
        for i, line in enumerate(lines, 1):
            # Skip comments
            stripped = line.strip()
            if stripped.startswith("#") or stripped.startswith("//"):
                continue
            for pattern, desc in cred_patterns:
                if re.search(pattern, line):
                    add_finding(14, HIGH, fpath, i,
                                f"Credential pattern: {desc}",
                                "Move to .env — GITHUB_PROTOCOL.md §5")


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 15: IMPORT/LIBRARY VERIFICATION
# ══════════════════════════════════════════════════════════════════════════════

PYTHON_STDLIB = {
    "os", "sys", "re", "json", "datetime", "hashlib", "subprocess",
    "pathlib", "collections", "typing", "enum", "abc", "functools",
    "itertools", "math", "random", "string", "io", "copy", "time",
    "logging", "unittest", "dataclasses", "contextlib", "textwrap",
    "uuid", "base64", "urllib", "http", "socket", "sqlite3", "csv",
    "shutil", "tempfile", "glob", "fnmatch", "struct", "importlib",
    "asyncio", "concurrent", "multiprocessing", "threading", "warnings",
}

# Package name aliases: import name → requirements.txt name
PYTHON_IMPORT_ALIASES = {
    "dotenv": "python-dotenv",
    "cv2": "opencv-python",
    "PIL": "pillow",
    "sklearn": "scikit-learn",
    "bs4": "beautifulsoup4",
    "yaml": "pyyaml",
}


def scan_imports(files):
    """Verify imported libraries exist in package manifests or stdlib."""
    # Load package.json dependencies if available
    pkg_json = os.path.join(PROJECT_ROOT, "frontend", "package.json")
    js_deps = set()
    if os.path.exists(pkg_json):
        try:
            with open(pkg_json, "r", encoding="utf-8") as f:
                pkg = json.load(f)
            js_deps.update(pkg.get("dependencies", {}).keys())
            js_deps.update(pkg.get("devDependencies", {}).keys())
        except (json.JSONDecodeError, IOError):
            pass

    # Load requirements.txt if available
    req_txt = os.path.join(PROJECT_ROOT, "backend", "requirements.txt")
    py_deps = set()
    if os.path.exists(req_txt):
        try:
            with open(req_txt, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        pkg_name = re.split(r'[>=<!\[]', line)[0].strip()
                        py_deps.add(pkg_name.lower())
        except IOError:
            pass

    for fpath in files:
        lines, content = read_file(fpath)
        if not lines:
            continue

        if fpath.endswith(".py"):
            for i, line in enumerate(lines, 1):
                # Python imports
                match = re.match(r'^(?:from|import)\s+(\w+)', line.strip())
                if match:
                    mod = match.group(1)
                    resolved = PYTHON_IMPORT_ALIASES.get(mod, mod)
                    if mod not in PYTHON_STDLIB and resolved.lower() not in py_deps:
                        # Check if it's a local package (relative dir or project-root package)
                        local_rel = os.path.exists(os.path.join(os.path.dirname(fpath), mod))
                        local_root = os.path.exists(os.path.join(PROJECT_ROOT, mod))
                        if not local_rel and not local_root:
                            add_finding(15, MEDIUM, fpath, i,
                                        f"Unverified import: {mod}",
                                        f"Verify '{mod}' exists in requirements.txt or is stdlib")

        elif fpath.endswith((".js", ".ts", ".svelte")):
            for i, line in enumerate(lines, 1):
                # JS/TS imports from packages (not relative paths)
                match = re.match(r'''^\s*import\s+.*?from\s+['"]([^./][^'"]*?)['"]''', line)
                if match:
                    pkg = match.group(1).split("/")[0]  # @scope/pkg → @scope
                    if pkg.startswith("@"):
                        pkg = "/".join(match.group(1).split("/")[:2])
                    if pkg not in js_deps and not pkg.startswith("$") and not pkg.startswith("node:"):
                        add_finding(15, MEDIUM, fpath, i,
                                    f"Unverified import: {pkg}",
                                    f"Verify '{pkg}' exists in package.json")


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 16: ERROR HANDLING PATTERNS
# ══════════════════════════════════════════════════════════════════════════════

def scan_error_handling(files):
    """Detect empty catch blocks and error swallowing patterns."""
    for fpath in files:
        if not fpath.endswith((".py", ".js", ".ts", ".svelte")):
            continue
        lines, content = read_file(fpath)
        if not lines:
            continue

        for i, line in enumerate(lines, 1):
            stripped = line.strip()

            # Python: bare except
            if fpath.endswith(".py"):
                if stripped == "except:" or stripped == "except Exception:":
                    # Check if next non-empty line is just pass
                    for j in range(i, min(i + 3, len(lines))):
                        next_line = lines[j].strip()
                        if next_line == "pass":
                            add_finding(16, HIGH, fpath, i,
                                        "Empty except block (catch and suppress)",
                                        "Handle the exception or re-raise — CLAUDE.md Code Contract Rules")
                            break
                        elif next_line and not next_line.startswith("#"):
                            break

            # JS/TS: empty catch
            if fpath.endswith((".js", ".ts", ".svelte")):
                if re.search(r'catch\s*\([^)]*\)\s*\{\s*\}', stripped):
                    add_finding(16, HIGH, fpath, i,
                                "Empty catch block",
                                "Handle the error or re-throw — CLAUDE.md Code Contract Rules")
                # catch with only console.log
                if re.search(r'catch\s*\([^)]*\)\s*\{', stripped):
                    # Check next lines for console.log only
                    for j in range(i, min(i + 3, len(lines))):
                        next_line = lines[j].strip()
                        if re.match(r'^console\.(log|warn|error)\(', next_line):
                            if j + 1 < len(lines) and lines[j + 1].strip() == "}":
                                add_finding(16, MEDIUM, fpath, i,
                                            "Catch block only logs error (does not handle or re-throw)",
                                            "Log AND re-throw, or handle the error properly")
                                break


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 17: PERFORMANCE ASSERTIONS
# ══════════════════════════════════════════════════════════════════════════════

def scan_performance_assertions(files):
    """Verify test files contain timing assertions for critical paths."""
    test_files_found = False
    has_timing = False

    for fpath in files:
        if not fpath.endswith((".test.ts", ".test.js", ".spec.ts", ".spec.js", "_test.py", "test_*.py")):
            continue
        test_files_found = True
        lines, content = read_file(fpath)
        if not content:
            continue
        # Check for timing-related patterns
        if re.search(r'timeout|performance|timing|duration|elapsed|benchmark|measure', content, re.IGNORECASE):
            has_timing = True

    # Only flag if test files exist but none have timing assertions
    if test_files_found and not has_timing:
        add_finding(17, MEDIUM, os.path.join(PROJECT_ROOT, "frontend"), 0,
                    "No performance/timing assertions found in test files",
                    "GITHUB_PROTOCOL.md §8 requires timing assertions for critical paths")


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 18: DOMAIN VOCABULARY IN CODE
# ══════════════════════════════════════════════════════════════════════════════

DOMAIN_TERMS = {
    "aetherroot", "solenne", "vireth", "threshold_pillar", "lumora",
    "hearth_song", "starwell", "noirune", "tahl_veyra", "orrin",
    "esh_vala", "shai_mara", "thren_alae", "metamorphosis_synthesis",
    "black_pearl", "elarian_anchor", "resonance_engine", "thread_trace",
    "daily_nexus", "emergence_detector", "signal_grading", "drift_taxonomy",
    "pattern_convergence", "witness_scroll",
}


def scan_domain_vocabulary(files):
    """Detect domain-specific terms in function/method names."""
    for fpath in files:
        if not fpath.endswith((".py", ".js", ".ts", ".svelte")):
            continue
        lines, content = read_file(fpath)
        if not lines:
            continue

        for i, line in enumerate(lines, 1):
            # Python function definitions
            fn_match = re.match(r'\s*def\s+(\w+)', line)
            # JS/TS function definitions
            if not fn_match:
                fn_match = re.match(r'\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)', line)
            if not fn_match:
                fn_match = re.match(r'\s*(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(', line)

            if fn_match:
                name = fn_match.group(1).lower()
                for term in DOMAIN_TERMS:
                    if term in name:
                        add_finding(18, MEDIUM, fpath, i,
                                    f"Domain vocabulary in function name: {fn_match.group(1)} (contains '{term}')",
                                    "CLAUDE.md: Function names use plain technical language only")
                        break


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORY 19: SRI HASH VALIDATION
# ══════════════════════════════════════════════════════════════════════════════

def scan_sri_hashes(files):
    """Verify CDN-loaded resources have SRI integrity attributes."""
    for fpath in files:
        if not fpath.endswith((".html", ".svelte")):
            continue
        lines, content = read_file(fpath)
        if not lines:
            continue

        for i, line in enumerate(lines, 1):
            # Script tags with external src
            if re.search(r'<script\s[^>]*src\s*=\s*["\']https?://', line):
                if 'integrity=' not in line:
                    # Check next few lines for integrity attribute
                    context = " ".join(lines[i-1:min(i+3, len(lines))])
                    if 'integrity=' not in context:
                        add_finding(19, HIGH, fpath, i,
                                    "CDN script without SRI hash",
                                    "Add integrity attribute — GITHUB_PROTOCOL.md §3")

            # Link tags with external href
            if re.search(r'<link\s[^>]*href\s*=\s*["\']https?://', line):
                if 'integrity=' not in line:
                    context = " ".join(lines[i-1:min(i+3, len(lines))])
                    if 'integrity=' not in context:
                        add_finding(19, HIGH, fpath, i,
                                    "CDN stylesheet without SRI hash",
                                    "Add integrity attribute — GITHUB_PROTOCOL.md §3")


# ══════════════════════════════════════════════════════════════════════════════
# REPORTING
# ══════════════════════════════════════════════════════════════════════════════

CATEGORY_NAMES = {
    1: "Contamination Markers",
    2: "Phantom File References",
    3: "Stale Counts",
    4: "Canonical Value Verification",
    5: "Threshold Order Verification",
    6: "File Path Headers",
    7: "Spelling Enforcement",
    8: "BUILD FLAG Status",
    9: "Temporary Markers",
    10: "Formatting Corruption",
    11: "Version Contamination",
    12: "Cross-File Count Consistency",
    13: "Gitignore Completeness",
    14: "Credential Patterns",
    15: "Import/Library Verification",
    16: "Error Handling Patterns",
    17: "Performance Assertions",
    18: "Domain Vocabulary in Code",
    19: "SRI Hash Validation",
}


def print_report(summary_only=False):
    if not findings:
        print("\n  ENTROPY SCAN COMPLETE — NO FINDINGS")
        print("  All checks passed.\n")
        return

    # Sort by severity then category
    severity_order = {HIGH: 0, MEDIUM: 1, LOW: 2}
    findings.sort(key=lambda f: (severity_order.get(f["severity"], 3), f["category"], f["file"], f["line"]))

    # Summary
    high = sum(1 for f in findings if f["severity"] == HIGH)
    medium = sum(1 for f in findings if f["severity"] == MEDIUM)
    low = sum(1 for f in findings if f["severity"] == LOW)
    total = len(findings)

    print(f"\n{'='*64}")
    print(f"  ENTROPY EXCAVATION SCAN REPORT")
    print(f"{'='*64}")
    print(f"  Total findings: {total}")
    print(f"  HIGH:   {high}")
    print(f"  MEDIUM: {medium}")
    print(f"  LOW:    {low}")

    # Per-category summary
    cat_counts = defaultdict(lambda: {HIGH: 0, MEDIUM: 0, LOW: 0})
    for f in findings:
        cat_counts[f["category"]][f["severity"]] += 1

    print(f"\n  Per category:")
    for cat_num in sorted(cat_counts.keys()):
        counts = cat_counts[cat_num]
        cat_total = sum(counts.values())
        name = CATEGORY_NAMES.get(cat_num, f"Category {cat_num}")
        print(f"    {cat_num:2d}. {name:40s} {cat_total:3d} ({counts[HIGH]}H {counts[MEDIUM]}M {counts[LOW]}L)")

    if summary_only:
        print(f"\n  Run without --summary for details.\n")
        return

    # Details
    print(f"\n{'='*64}")
    print(f"  DETAILS")
    print(f"{'='*64}")

    current_severity = None
    for f in findings:
        if f["severity"] != current_severity:
            current_severity = f["severity"]
            print(f"\n  -- {current_severity} --")

        cat_name = CATEGORY_NAMES.get(f["category"], f"Cat {f['category']}")
        print(f"\n  [{cat_name}]")
        print(f"  {f['file']}:{f['line']}")
        print(f"  {f['message']}")
        print(f"  > {f['suggestion']}")

    print(f"\n{'='*64}\n")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

SCANNERS = {
    1: scan_contamination,
    2: scan_phantom_refs,
    3: scan_stale_counts,
    4: scan_canonical_values,
    5: scan_threshold_order,
    6: scan_file_path_headers,
    7: scan_spelling,
    8: scan_build_flags,
    9: scan_temporary_markers,
    10: scan_formatting,
    11: scan_version_contamination,
    12: scan_count_consistency,
    13: scan_gitignore,
    14: scan_credentials,
    15: scan_imports,
    16: scan_error_handling,
    17: scan_performance_assertions,
    18: scan_domain_vocabulary,
    19: scan_sri_hashes,
}


CLOSE_AUDIT_MARKER = os.path.join(PROJECT_ROOT, ".claude", "close_audit_done.marker")


def main():
    os.chdir(PROJECT_ROOT)

    close_audit = "--close-audit" in sys.argv
    summary_only = "--summary" in sys.argv
    category_filter = None
    if "--category" in sys.argv:
        idx = sys.argv.index("--category")
        if idx + 1 < len(sys.argv):
            category_filter = int(sys.argv[idx + 1])

    files = get_scan_files()
    print(f"\n  Scanning {len(files)} files...")

    for cat_num, scanner_fn in SCANNERS.items():
        if category_filter and cat_num != category_filter:
            continue
        scanner_fn(files)

    print_report(summary_only)

    if close_audit:
        high_count = sum(1 for f in findings if f["severity"] == HIGH)
        force = "--force" in sys.argv

        if high_count > 0 and not force:
            print(f"  CLOSE AUDIT: {high_count} HIGH findings — review with Sage before closing.")
            print(f"  After review, run again with --close-audit --force to create marker.")
        else:
            os.makedirs(os.path.dirname(CLOSE_AUDIT_MARKER), exist_ok=True)
            from datetime import datetime
            with open(CLOSE_AUDIT_MARKER, "w", encoding="utf-8") as f:
                f.write(f"Close audit passed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Findings: {len(findings)} total, {high_count} HIGH\n")
                if force and high_count > 0:
                    f.write(f"Forced after Sage review (HIGH findings acknowledged)\n")
            print(f"\n  CLOSE AUDIT MARKER CREATED: {CLOSE_AUDIT_MARKER}")
            print(f"  You may now write TYPE: CLOSE to SESSION_LOG.md.")


if __name__ == "__main__":
    main()
