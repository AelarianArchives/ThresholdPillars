# SESSION_PROTOCOL.md
# Aelarian Archives — Session Protocol
# Last updated: April 2026

---

## PURPOSE

Defines the required procedure for every session: open, close, interrupt
resume, ghost fix verification, and long session restatement. SESSION_LOG.md
is the persistent state record. It is written continuously during a session —
not only at close. A session that ends without a clean close still leaves a
recoverable state record.

All protocol files live in PROTOCOL/. CLAUDE.md lives at project root.

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

Run at the start of every session, in this order. Do not skip steps.
Do not reorder.

1. Read SESSION_LOG.md
2. Check the type of the last entry:
   - `CLOSE` — proceed to step 6
   - `WORK_UNIT`, `HOOK_WRITE`, or `OPEN` with no subsequent `CLOSE`
     — interrupted session. Go to section 3 (INTERRUPTED SESSION — RESUME)
     before proceeding
3. Read CLAUDE.md completely
4. Read ENFORCEMENT.md completely
5. Re-derive current file state from disk — not from memory, not from the log.
   Read the actual files. Confirm what exists, what is PLANNED, what is clean
6. Check DESIGN/Systems/ and DESIGN/Domains/ — confirm state matches last
   known record. Name any discrepancy before proceeding
6a. Spot-check SOT_BUILD_TODO.md — for every item marked [x], verify that
    Sage's explicit approval exists in SESSION_LOG.md. A Claude session marking
    its own decision [x] is not confirmation. If any [x] item cannot be traced
    to Sage's words in the log, downgrade it to [p] immediately and name it
    to Sage before any work begins. This check runs every session, no exceptions.
7. Write a `TYPE: OPEN` entry to SESSION_LOG.md with current confirmed state
8. State current confirmed state to Sage before any work begins

---

## 2. SESSION CLOSE — CLEAN

Run when a session ends cleanly. All steps required.

1. Confirm all changes from this session are committed — run git status,
   name any uncommitted files
2. Confirm no INCOMPLETE blocks exist in any file written this session
   without a named record in SESSION_LOG.md
3. Push to GitHub — confirm push succeeded
4. Write a `TYPE: CLOSE` entry to SESSION_LOG.md:
   - All files modified this session
   - Everything completed
   - Anything left in progress with exactly where it stopped
   - Any blocking gaps discovered during the session
   - Next action for the following session
5. Confirm SESSION_LOG.md itself is committed and pushed

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

## 6. CODE CONTRACT GATE

Run before implementing any function. This is a hard gate —
implementation does not begin until every step is complete.

1. State the function's full contract:
   - Name
   - Parameters — each with type and what it represents
   - Return type — including what it returns on failure
   - Side effects — every state change outside this function's scope
   - Dependencies — what it calls, what events it fires

2. State which file(s) this function lives in and which files call it.
   Cross-check against PROTOCOL/DEPENDENCY_MAP.json.

3. Sage approves the contract before any code is written.

4. Write the contract as a comment block at the top of the function
   before writing the body.

5. Implement against the approved contract only. Any deviation from
   the contract during implementation is named and stopped —
   not silently absorbed.

6. If the implementation reveals the contract was wrong: stop.
   Restate the corrected contract. Get approval. Then continue.

**No function body is written before its contract is approved.
No exceptions.**

---

## 7. TEST-ALONGSIDE RULE

Every function implementation requires a test spec written in the
same work unit. Not in a later session. Not after the build stabilizes.
The same work unit.

**What a test spec contains:**
- The function being tested (name, file)
- Happy path: expected input → expected output
- At minimum one failure case: bad input / missing data / error condition
- At minimum one edge case if the function handles boundaries

**The rule:**
A work unit that writes a function is not closed until the test spec
for that function is also written and recorded in SESSION_LOG.md.
"I'll write tests later" is not an acceptable state.
A function without a test spec is marked INCOMPLETE in SESSION_LOG.md
regardless of whether the implementation itself is correct.

**Why this exists:**
F06 (self-validates) has no mechanical check until a test suite exists.
Writing the test spec alongside the implementation creates the
external verification layer that prevents Claude from being the only
thing checking Claude's output.
