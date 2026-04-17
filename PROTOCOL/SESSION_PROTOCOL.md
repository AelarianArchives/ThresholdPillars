# SESSION_PROTOCOL.md
# Aelarian Archives — Session Protocol
# Last updated: April 2026

---

## PURPOSE

Defines the SESSION_LOG.md entry format, session lifecycle procedures
(open, close, interrupted resume, ghost fix verification), work-unit
definition, and long session restatement rule.

This file owns the mechanical procedures. Behavioral rules, mandatory
reads, code contract gates, test-alongside rules, and the confirmation
gate live in CLAUDE.md. The gate system lives in RECURSION_REPAIR.md.

All protocol files live in PROTOCOL/. Root documents (CLAUDE.md,
RECURSION_REPAIR.md, ENTROPY_EXCAVATION.md, ROT_REGISTRY.md,
ROT_OPEN.md) live at project root.

---

## SESSION_LOG.md — ENTRY FORMAT

Every entry written to SESSION_LOG.md uses this structure.
No fields are optional. If a field has nothing to report, write `none`.

```
---
TIMESTAMP: YYYY-MM-DD HH:MM
TYPE: OPEN | CLOSE | WORK_UNIT | RESUME | GHOST_FIX
FILES_MODIFIED:
  - [file path] — [COMPLETE | IN_PROGRESS | DELETED]
COMPLETED:
  - [description of what was finished]
IN_PROGRESS:
  - [description] — [file] — [exactly where it stopped]
NOT_STARTED:
  - [description of planned work not yet reached]
UNCOMMITTED: YES | NO
NEXT_ACTION: [first thing the next work unit or session must do]
---
```

**Hook entries** — a PostToolUse hook in settings.json appends a minimal
entry after every Write or Edit operation automatically:

```
---
TIMESTAMP: [auto]
TYPE: HOOK_WRITE
TOOL: Write | Edit
FILE: [file path]
---
```

Hook entries are the mechanical floor. They run regardless of session state.
Semantic entries (all other types) are written by Claude as part of the
work-unit discipline. Both exist in the log. They are not duplicates —
they serve different purposes.

---

## WORK-UNIT DEFINITION

A log entry is written when a work unit completes. A work unit is complete
when any of the following occurs:

- A file is written to its final state for this session
- A schema decision is made and committed to disk
- A task defined at session start is completed
- A file is deleted

Work units are not counted. A count of operations is not a work unit.
Five comment edits is not the same as one schema decision. The trigger
is task completion, not operation volume.

---

## 1. SESSION OPEN

The mandatory reads and confirmation gate are defined in CLAUDE.md
(BEFORE EVERY SESSION section). Complete those first. Then run
these mechanical steps:

0. Load 3 most recent WSC entries via GET /api/wsc/recent?limit=3.
   Read before any other context. This is the AI's self-orientation
   from its own prior voice. If 0 entries exist (first session), skip
   this step and proceed to step 1. Note: this step activates when the
   WSC system is live. Until then, proceed directly to step 1.
1. Read SESSION_LOG.md
2. Check the type of the last entry:
   - `CLOSE` — proceed to step 3
   - `WORK_UNIT`, `HOOK_WRITE`, or `OPEN` with no subsequent `CLOSE`
     — interrupted session. Go to section 3 (INTERRUPTED SESSION — RESUME)
     before proceeding
   - `VERIFICATION`, `VERIFICATION_CLOSED`, or any other Antigravity entry type
     — external system write. Not an interrupted Claude Code session.
     Scan back through the log to find the most recent Claude Code entry
     (CLOSE, WORK_UNIT, HOOK_WRITE, OPEN, or RESUME) and proceed based
     on that entry type.
3. Re-derive current file state from disk — not from memory, not from the log.
   Read the actual files. Confirm what exists, what is PLANNED, what is clean
4. Check DESIGN/Systems/ and DESIGN/Domains/ — confirm state matches last
   known record. Name any discrepancy before proceeding
5. Write a `TYPE: OPEN` entry to SESSION_LOG.md with current confirmed state
6. State current confirmed state to Sage before any work begins

---

## 2. SESSION CLOSE — CLEAN

Run when a session ends cleanly. All steps required.

1. Run the session close audit: `python hooks/entropy_scan.py --close-audit`
   This runs all 19 scanner categories and creates a marker file if clean.
   If HIGH findings exist, review with Sage, then re-run with `--force`
   to create the marker after review. The audit must complete before
   the CLOSE entry is written. Log any new rot in ROT_REGISTRY.md and
   ROT_OPEN.md.
2. Confirm all changes from this session are committed — run git status,
   name any uncommitted files.
   **Mechanically enforced:** `close_audit_gate.py` blocks the TYPE: CLOSE
   write if uncommitted project files exist (git status check) or if the
   audit marker is missing. Both checks must pass.
3. Confirm no INCOMPLETE blocks exist in any file written this session
   without a named record in SESSION_LOG.md
4. Push to GitHub — confirm push succeeded
5. Write a `TYPE: CLOSE` entry to SESSION_LOG.md:
   - All files modified this session
   - Everything completed
   - Anything left in progress with exactly where it stopped
   - Any blocking gaps discovered during the session
   - Next action for the following session
6. Confirm SESSION_LOG.md itself is committed and pushed

---

## 3. INTERRUPTED SESSION — RESUME

Run when SESSION OPEN (step 2) finds no clean CLOSE as the last entry.
This is the recovery procedure. Run before any new work.

1. Read the last entry in SESSION_LOG.md fully
2. Identify from that entry:
   - What was completed
   - What was in progress and where it stopped
   - Whether uncommitted changes exist
3. Read every file listed in the last entry from disk — confirm actual
   file state matches what the log records
4. If any file state does not match the log record: name the discrepancy
   to Sage explicitly before taking any action. Do not resolve silently
5. If uncommitted changes exist: confirm with Sage — commit, discard,
   or continue — before any new work begins
6. Write a `TYPE: RESUME` entry to SESSION_LOG.md recording confirmed
   current state
7. State confirmed current state to Sage. Wait for acknowledgment before
   proceeding to new work

---

## 4. GHOST FIX VERIFICATION

Run after every patch, correction, or fix — no exceptions.
"Fixed" is not a state. Confirmed present is a state.

**Mechanically enforced:** `ghost_fix_gate.py` runs on both PostToolUse
(writes a pending marker after every Edit) and PreToolUse (blocks the
next Write/Edit until the marker is cleared). The marker is cleared when
a `TYPE: GHOST_FIX` entry is written to SESSION_LOG.md. This is a hard
block (exit 2) — not a warning.

1. Identify the specific file and location the fix was applied to
2. Read that file
3. Locate the specific line or section the fix targets
4. Confirm it is present and correct as intended
5. State the confirmation explicitly:
   "Fix confirmed at [file] — [location] — now reads: [exact content]"
6. Write a `TYPE: GHOST_FIX` entry to SESSION_LOG.md:
   - File and location
   - What it was before
   - What it is now
   - Confirmed by read: YES
7. Only after step 6 is written does the session advance to the next task

If the fix is not present: name it immediately. Do not advance. Do not
attempt a second fix until the absence is acknowledged by Sage.

---

## 5. LONG SESSION RULE

**Trigger — restate key rules when any of the following occurs:**
- Three or more work units completed in a single session
- Switching from one category of work to another (e.g., schema work
  to code work, documentation to file edits)
- Sage indicates a significant context shift or change in direction

**What gets restated:**
- Current build phase and what is / is not started
- Active file state boundaries: what is CLEAN, what is PLANNED,
  what is REFERENCE_ONLY
- The specific task currently in progress

Restatement is not a summary. It is a direct read of current confirmed
state from SESSION_LOG.md and CLAUDE.md. Not paraphrased. Not recalled.
Read and restated.

---

## 6. SESSION LIFECYCLE HOOKS

Hooks configured in `.claude/settings.json` that fire at session lifecycle
boundaries. These run mechanically — Claude does not invoke them.

**PreToolUse (Write|Edit)** — 6 hooks chained:
  `session_open_gate.py` → `rot_open_gate.py` → `ghost_fix_gate.py` →
  `recursion_repair_gate.py` → `close_audit_gate.py` → `code_quality_gate.py`
  Fires before every Write or Edit. Each gate checks a different
  condition and blocks (exit 2) if violated. All 6 must pass for the
  write to proceed.

  `code_quality_gate.py` is the prevention gate. It scans the CONTENT
  being written and blocks or warns on:
  - Empty catch blocks / silent exception suppression (hard block)
  - Domain vocabulary in function names (hard block)
  - Hardcoded credentials in code (hard block)
  - Contamination markers: arcPhase, old threshold IDs, old architecture
    refs, wrong framework name (hard block)
  - CDN resources without SRI integrity hashes (hard block)
  - Resource opens without finally/context manager (warn)
  - Unhandled promise rejections (warn)
  - Dead code / unreachable branches (warn)
  - Unverified imports not in manifests (warn)
  - Unsourced precision values in docs (warn)
  - INCOMPLETE/TODO/HACK markers (warn)
  - Stale counts, version contamination, box-drawing (warn)
  - package.json without lockfile (warn)

**PreToolUse (Bash)** — `hooks/bash_safety_gate.py`
  Fires before every Bash command. Hard blocks npm install, --no-verify,
  --no-gpg-sign, inline credentials. Soft warns on git add ., push to
  main, non-standard tag names. Checks lockfile existence on npm ci.

**PostToolUse (Write|Edit)** — 2 hooks:
  `session_log_hook.py` — Appends HOOK_WRITE entry to SESSION_LOG.md
  for every file write. Also checks DEPENDENCY_MAP.json for cascade
  alerts (inactive until map is populated in core files phase).
  `ghost_fix_gate.py` (PostToolUse phase) — Writes a pending ghost fix
  marker after every Edit. The PreToolUse phase reads this marker and
  blocks the next write until verified.

**SessionStart** — `hooks/session_start.py`
  Fires when a session begins. Reads SESSION_LOG.md, ROT_OPEN.md, and
  phase_state.json. Outputs a status summary injected into Claude's
  context: last session state (clean close vs interrupted), open rot
  count, active phase tracking, pending ghost fixes.

**SessionEnd** — `hooks/session_end.py`
  Fires when a session terminates. Logs a warning to
  `.claude/session_end_warning.log` if the session ends with uncommitted
  changes or without a TYPE: CLOSE entry. Cannot block — safety net only.

**UserPromptSubmit** — `hooks/user_prompt_context.py`
  Fires before Claude processes each user message. Injects a compact
  status line: work unit count, open rot count, active phases, in-progress
  items. After 3 work units, adds long session restatement reminder.

**PreCompact** — `hooks/pre_compact.py`
  Fires before context compaction (when conversation approaches context
  limit). Writes a COMPACT_CHECKPOINT entry to SESSION_LOG.md with
  current state (work units, phases, open rot). Addresses F08 (long
  session degradation).

**PostToolUse (Bash)** — `hooks/session_log_hook.py`
  Captures Python and file-writing Bash commands in SESSION_LOG.md as
  HOOK_BASH entries.

**TaskCompleted** — `hooks/self_exam_gate.py`
  Fires when a task is marked complete. If the task involves self-
  examination (audit, analysis, verification, comparison, review),
  blocks completion unless a report artifact exists in `.claude/audits/`
  written today with required sections: Task, Files examined, Findings,
  Conclusion. Build tasks that mention audit terminology are excluded
  (subject starting with build/create/write/update/fix verbs).
  Addresses F06 (self-validates bad output) — the executor cannot
  mark examination work complete without producing a record.

**Known limitation:** Cascade detection via DEPENDENCY_MAP.json is
  INACTIVE. The session_log_hook.py CASCADE_ALERT system works but
  DEPENDENCY_MAP.json needs to be populated during the core files
  phase. Until then, cascade detection is behavioral only.

---

## 7. SELF-EXAMINATION ARTIFACT RULE

Any task categorized as self-examination — audit, analysis, verification,
comparison, review, gap analysis — produces a written artifact or it did
not happen.

**Artifact requirements:**
1. Written to `.claude/audits/` directory
2. Filename: descriptive, date-stamped (e.g., `re-audit-2026-04-09.md`)
3. Required sections with content:
   - `## Task` — what was examined and why
   - `## Files examined` — every file read, with paths
   - `## Findings` — what was found (stale refs, gaps, clean passes)
   - `## Conclusion` — summary assessment

**Mechanically enforced:** `self_exam_gate.py` (TaskCompleted hook)
blocks task completion if no valid artifact exists. The artifact gets
committed with the session's work — auditable after the fact.

**Why this exists:** F06 — the executor and the verifier are the same
entity. The artifact does not validate itself. It is a record that Sage
can read. The hook enforces that the record exists. Sage evaluates
whether the record is honest.

---

## CROSS-REFERENCES

Code contract gates: defined in CLAUDE.md (CODE CONTRACT RULES section).
Test-alongside rule: defined in CLAUDE.md (CODE CONTRACT RULES section).
Recursion Repair gate system: defined in RECURSION_REPAIR.md.
Mandatory reads and confirmation gate: defined in CLAUDE.md (BEFORE
  EVERY SESSION section).
Session close audit: defined in CLAUDE.md (ROT REGISTRY — SESSION
  CLOSE AUDIT section).
