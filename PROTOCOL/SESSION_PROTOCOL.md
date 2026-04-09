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
3. Re-derive current file state from disk — not from memory, not from the log.
   Read the actual files. Confirm what exists, what is PLANNED, what is clean
4. Check DESIGN/Systems/ and DESIGN/Domains/ — confirm state matches last
   known record. Name any discrepancy before proceeding
5. Write a `TYPE: OPEN` entry to SESSION_LOG.md with current confirmed state
6. State current confirmed state to Sage before any work begins

---

## 2. SESSION CLOSE — CLEAN

Run when a session ends cleanly. All steps required.

1. Run the session close audit defined in CLAUDE.md (ROT REGISTRY —
   SESSION CLOSE AUDIT section). This includes: scanning for open rot,
   running verification commands, checking against the 57-pattern
   watchlist, reporting findings to Sage, and logging any new rot in
   ROT_REGISTRY.md and ROT_OPEN.md. The audit must complete before
   the CLOSE entry is written.
2. Confirm all changes from this session are committed — run git status,
   name any uncommitted files
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

## CROSS-REFERENCES

Code contract gates: defined in CLAUDE.md (CODE CONTRACT RULES section).
Test-alongside rule: defined in CLAUDE.md (CODE CONTRACT RULES section).
Recursion Repair gate system: defined in RECURSION_REPAIR.md.
Mandatory reads and confirmation gate: defined in CLAUDE.md (BEFORE
  EVERY SESSION section).
Session close audit: defined in CLAUDE.md (ROT REGISTRY — SESSION
  CLOSE AUDIT section).
