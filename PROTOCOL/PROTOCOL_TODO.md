# PROTOCOL_TODO.md
# Aelarian Archives — Protocol System Running Checklist
# Last updated: 2026-04-03

Status: [ ] open  [x] complete  [!] blocked  [~] in progress

---

## HOW TO USE

This list tracks everything required for the protocol system to function
as a whole unit. Work through sections in order. Each completed item is
marked [x]. Blocked items are marked [!] with the blocker named.
Do not mark complete until the item is verified, not just executed.

---

## SECTION 1 — IMMEDIATE: BEFORE NEXT BUILD SESSION

- [x] Commit all protocol files to git
      CLAUDE.md, ENFORCEMENT.md, SESSION_PROTOCOL.md, SESSION_LOG.md,
      GITHUB_PROTOCOL.md, PROTOCOL_TODO.md, .claude/settings.json,
      hooks/session_log_hook.py, hooks/pre-commit, .gitignore
      DONE: 132 files committed, pushed to GitHub

- [x] Verify SESSION_LOG.md hook fires
      DONE: tested, HOOK_WRITE entries confirmed writing to PROTOCOL/SESSION_LOG.md

- [x] Install pre-commit hook
      DONE: installed to .git/hooks/pre-commit, chmod +x applied

- [x] Migrate B2 credentials out of backup.py — PRIORITY (F32)
      DONE: backup.py uses os.environ.get() + .env loader. Git history rewritten
      via filter-branch. Force pushed. Old objects garbage collected.

- [x] Create and commit .gitignore
      DONE: covers credentials, logs, OS artifacts, binaries, _REFERENCE_ONLY/

- [ ] Rotate B2 credentials in Backblaze console — SAGE'S ACTION
      Old key ID 005624fc90fcb8b0000000001 is out of git history but
      must be treated as compromised. Procedure:
      1. Go to Backblaze console → My Account → App Keys
      2. Revoke old application key
      3. Generate new application key — scope: threshold-backups bucket only
      4. Update .env: B2_KEY_ID=<new> and B2_APP_KEY=<new>
      5. Run backup.py once to confirm B2 connection works with new keys
      Not complete until new keys are tested and working.

---

## SECTION 2 — FOLDER TREE: VERIFY AND RESOLVE

- [x] DOCS/Systems/ — 20 verified schema/system files confirmed
- [x] DOCS/Domains/ — 10 group folders confirmed present

- [x] JS/ — DELETED (was empty)
- [x] Tools/ — DELETED (was empty)
- [x] api/ — DELETED (contaminated; domains/ and prompts/ subdirs deleted with it)
- [x] core/ — Sa'Qel'Inthra.txt and Untitled.txt deleted
      Untitled.txt confirmed as HTML duplicate (index.html preserved)

- [x] index.html — contamination note added to CLAUDE.md.
      Preserved at root — app will not launch from _REFERENCE_ONLY.
      Status: read-only reference until rebuild replaces it.
      CLAUDE.md marks it as contaminated, not canonical.

- [x] desktop.ini — OS artifact, covered by .gitignore

- [x] _REFERENCE_ONLY/ — MOVED from Aelarian\ parent into Archives\.
      CLAUDE.md path references updated to reflect correct location.
      Also added to .gitignore.

- [x] backups/SESSION_HANDOFF.md — DELETED (replaced by SESSION_LOG.md)
- [x] backups/aelarian-backup JSON — DELETED (confirmed empty export, noise)

**Expected — not present yet (correct):**
- [ ] exports/ — does not exist yet. backup.py skips silently. Not an error.
- [ ] .github/workflows/ci.yml — PLANNED. Written when code build starts.
- [ ] performance-budget.json — PLANNED. Defined at first build.

---

## SECTION 3 — PROTOCOL GAP REVIEW

**CLAUDE.md:**
- [x] References ENFORCEMENT.md — present
- [x] References SESSION_PROTOCOL.md — present
- [x] References GITHUB_PROTOCOL.md — present
- [x] Narrative language stripped — integrity principle, emergent field,
      Threshold Pillars architecture removed from behavioral section
- [x] _REFERENCE_ONLY path updated to Archives\ location

**ENFORCEMENT.md:**
- [x] All T2 failures have corresponding hooks in settings.json or pre-commit
- [x] All T3 failures have corresponding procedures in SESSION_PROTOCOL.md
- [x] All T4 failures have corresponding entries in GITHUB_PROTOCOL.md
- [x] No failure entry references a doc that doesn't exist

**SESSION_PROTOCOL.md:**
- [x] SESSION_LOG.md format matches what the hook actually writes
- [ ] Interrupt resume procedure tested (manual — simulate interrupt,
      open new session, run procedure, confirm state recoverable)
- [ ] Ghost fix procedure tested (manual — simulate fix, run verification
      steps, confirm read-back catches a missing fix)

**GITHUB_PROTOCOL.md:**
- [x] .gitignore created and matches required entries in section 1
- [x] Pre-commit hook installed and all 4 checks confirmed running
- [x] B2 credential migration complete
- [ ] B2 credentials rotated and tested — PENDING Sage's action (Section 1)
- [ ] backup.py verified with new credentials after rotation

**settings.json:**
- [x] PostToolUse hook confirmed active — Write triggers HOOK_WRITE entries
- [x] Hook does not fire on SESSION_LOG.md itself — infinite loop exclusion present

**hooks/pre-commit:**
- [x] Check 1 (credential scan) — confirmed blocking
- [x] Check 2 (domain vocab scan) — confirmed warning fires, not hard block
- [x] Check 3 (lockfile) — fires only when package.json exists (correct)
- [x] Check 4 (sensitive files) — confirmed blocking .env
- [ ] Domain term list finalized — PENDING: review before code build begins
      Current list: Ae.larian, Ven.ai, Cael.Thera, Verith, Larimar,
      Sa.Qel, NurseryBG, StarRoot, Sat.Nam
      arcPhase values (aetherrot, solenne, vireth) — confirmed excluded
      from hard block (valid schema enums, not contamination)
      Action: when domain vocabulary is finalized, update DOMAIN_TERMS
      variable in hooks/pre-commit. This is not blocking — safe to update
      incrementally as domains complete.

---

## SECTION 4 — STRESS TEST: PROTOCOL AS A WHOLE

Run these once Section 1–3 open items are resolved. Manual tests.

**Scenario: clean session open**
- [ ] Start a new session
- [ ] Run session open procedure from SESSION_PROTOCOL.md step by step
- [ ] Verify all 8 steps complete without ambiguity
- [ ] Verify SESSION_LOG.md OPEN entry is written

**Scenario: interrupted session**
- [ ] Write to a file mid-session
- [ ] Close without a clean close (simulate interrupt)
- [ ] Open new session, run interrupt resume procedure
- [ ] Verify state is correctly recovered from SESSION_LOG.md + disk

**Scenario: ghost fix**
- [ ] Apply a correction to a file
- [ ] Run full ghost fix procedure with read-back — confirm it works
- [ ] Confirm SESSION_LOG.md GHOST_FIX entry is written

**Scenario: credential staged for commit**
- [ ] Add a mock credential to a test file
- [ ] Attempt git commit
- [ ] Verify pre-commit hook blocks it

**Scenario: domain vocab in code**
- [ ] Add a domain term to a .js file
- [ ] Attempt git commit
- [ ] Verify pre-commit hook warning fires (not a hard block)

**Cross-document consistency:**
- [ ] Pick 5 failures from ENFORCEMENT.md at random
- [ ] Verify each one's enforcement mechanism is actually in place
- [ ] Identify any failure where enforcement is aspirational — log each one

---

## SECTION 5 — BUILD PREREQUISITES

Nothing in this section begins until Sections 1–4 open items are resolved.

- [!] SOT written and verified — BLOCKED: pending domain completion.
      Domains are in progress. SOT is next after all domains verified.
- [x] .gitignore created and committed
- [x] Pre-commit hook installed and tested
- [x] settings.json hook verified active
- [x] _REFERENCE_ONLY path discrepancy resolved
- [x] All empty/contaminated folders resolved
- [x] Recovery tag created and pushed:
      v2026-04-03-protocol-complete — "Protocol system complete"
- [ ] performance-budget.json placeholder — create when code build starts
- [ ] .github/workflows/ci.yml — minimal CI file, create when build starts

---

## SECTION 6 — ONGOING: EACH SESSION

These recur every session. Not one-time items.

- [ ] SESSION_LOG.md: OPEN entry written at session start
- [ ] SESSION_LOG.md: WORK_UNIT entry written after each completed unit
- [ ] SESSION_LOG.md: CLOSE entry written at clean session end
- [ ] Ghost fix procedure run after every patch or correction
- [ ] backup.py run at session close (once B2 credentials are rotated)
- [ ] Push to GitHub confirmed at session close
- [ ] Long session restatement triggered after 3 work units or
      category shift (per SESSION_PROTOCOL.md section 5)
