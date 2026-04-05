# PROTOCOL_TODO.md
# Aelarian Archives — Protocol System Running Checklist
# Last updated: 2026-04-04

Status: [ ] open  [x] complete  [!] blocked  [~] in progress

---

## HOW TO USE

This list tracks everything required for the protocol system to function
as a whole unit. Work through sections in order. Each completed item is
marked [x]. Blocked items are marked [!] with the blocker named.
Do not mark complete until the item is verified, not just executed.

---

## SECTION 0 — PRIORITY: SAFEGUARD GAPS — RESOLVE BEFORE CODE BUILD

Identified 2026-04-04 during directive audit. All six items close before
any code writing begins. These are not optional.

- [x] Fix ENFORCEMENT.md T2 mismatch — F15, F44, F06
      F15 (dead code detection), F44 (variable shadowing linter), and F06
      (pre-commit runs test suite) are listed in ENFORCEMENT.md as T2 hook
      enforcement. None are implemented in pre-commit. Documentation says
      mechanical protection exists when it does not.
      Action: either implement each check, or downgrade their tier in
      ENFORCEMENT.md to T1 (behavioral) with an honest note that mechanical
      enforcement is deferred until the build produces code to check. Do not
      leave the tier claim and the missing implementation in contradiction.

- [x] Fix pre-commit Check 2 severity — warning vs. hard block
      Check 2 (domain vocab scan) fires as a WARNING in the hook script.
      ENFORCEMENT.md says it should be a hard block. Implementation and
      documentation disagree.
      Action: decide which is correct. If hard block — update hook script.
      If warning — update ENFORCEMENT.md. Record the decision here.

- [x] Add mechanical guard for _REFERENCE_ONLY
      Currently protected only by a T1 behavioral rule in CLAUDE.md.
      Nothing in the hook or pre-commit prevents a write into _REFERENCE_ONLY.
      Action: add a path check to pre-commit (or the PostToolUse hook) that
      hard-blocks any write to _REFERENCE_ONLY/ and logs the attempt.

- [x] Remove NurseryBG from DOMAIN_TERMS in hooks/pre-commit
      NurseryBG is from the infected build — it is not a domain term.
      It is currently in the DOMAIN_TERMS list, which means it will trigger
      the domain vocab scan on legitimate commits. Remove it.
      Do this alongside domain term list finalization (Section 3).

- [!] Write SYSTEM_ doc and SCHEMA for schema.js — BLOCKED: pending SOT
      SYSTEM_ Schema.md and the schema.js SCHEMA are written when schema.js
      is built. schema.js is blocked on SOT. SOT is blocked on DOCS completion.
      These documents are not a pre-SOT action — they are a build phase step.
      This item was incorrectly listed as a Section 0 safeguard gap. Correct
      placement: Section 5, build prerequisites, after SOT is verified.

- [~] Section 4 stress tests — run all 6 manual protocol scenarios
      Section 4 tests the protocol machinery itself. No code required.
      Must complete before build begins.
      Section 5 tagger prerequisites are NOT part of this batch —
      they are build phase items blocked on SOT. Correctly placed in Section 5.

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

- [x] DESIGN/Systems/ — 20 verified schema/system files confirmed
- [x] DESIGN/Domains/ — 10 group folders confirmed present

- [x] JS/ — DELETED (was empty)
- [x] Tools/ — DELETED (was empty)
- [!] api/ — DELETION FAILED. Folder is valid — do not delete.
      Contains working API drafts: domains/venai/ (Domain, Glossary, Phonetics,
      Manual) and prompts/ (GLOBAL_KNOWLEDGE_BASE, GENESIS_Origin_Node,
      _Global_Identity). This folder is the API-facing reference layer.
      api/domains/ = domain-specific context for API sessions.
      api/prompts/ = system-level context loaded across all API calls.
      Status: active, valid, untouched. Not contaminated.
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
- [x] Domain term list approach retired — Check 2 rewritten
      DOMAIN_TERMS list removed from hooks/pre-commit entirely.
      Check 2 now scans for function declarations that do not start with a
      recognized technical verb — catches mythic behavioral naming without
      requiring an exhaustive term list. No list to maintain.

---

## SECTION 4 — STRESS TEST: PROTOCOL AS A WHOLE

Run these once Section 1–3 open items are resolved. Manual tests.

**Scenario: clean session open**
- [x] Verified 2026-04-04 — all 8 steps ran in order during this session open.
      TYPE: OPEN entry confirmed written before any work began.

**Scenario: interrupted session**
- [~] Procedure verified present — SESSION_PROTOCOL.md section 3, 7-step structure complete.
      Live test deferred: requires an actual interrupt to occur. Mark [x] after first
      real interrupted session is recovered successfully.

**Scenario: ghost fix**
- [x] Verified 2026-04-04 — procedure run three times during session.
      Check 7 hook, ENFORCEMENT.md F14, Check 2 replacement — all read-back confirmed,
      specific lines stated before session advanced each time.

**Scenario: credential staged for commit**
- [x] Verified 2026-04-04 — mock credential staged, hook blocked at Check 1,
      commit did not proceed, file cleaned up. Exit code 1 confirmed.

**Scenario: function naming warning (formerly: domain vocab in code)**
- [x] Verified 2026-04-04 — function aelarianWeave() staged, Check 2 warning fired
      with correct message, commit proceeded to Check 6 (eslint hard block).
      Both checks behaved as designed.

**Cross-document consistency:**
- [x] Verified 2026-04-04 — 5 failures checked across all 4 tiers:
      F20 (T2 lockfile), F32 (T2 credentials), F55 (T3 ghost fix),
      F36 (T4 backup), F09 (T1 prior session data). All mechanisms confirmed present.
      No aspirational entries found in these five.

---

## SECTION 5 — BUILD PREREQUISITES

Nothing in this section begins until Sections 1–4 open items are resolved.

- [!] SOT written and verified — BLOCKED: pending explicit session direction from Sage.
      DOCS stage is complete — all stage gate items verified (2026-04-04).
      SOT is the next build phase step. Begins when Sage opens a SOT session.
- [x] .gitignore created and committed
- [x] Pre-commit hook installed and tested
- [x] settings.json hook verified active
- [x] _REFERENCE_ONLY path discrepancy resolved
- [x] All empty/contaminated folders resolved
- [x] Recovery tag created and pushed:
      v2026-04-03-protocol-complete — "Protocol system complete"
- [ ] performance-budget.json placeholder — create when code build starts
- [ ] .github/workflows/ci.yml — minimal CI file, create when build starts

- [!] eslint installed as dev dependency — HARD BLOCK: no .js files can be committed until complete
      Pre-commit Check 6 hard blocks any .js commit if node_modules/.bin/eslint is absent.
      Action: when package.json is created at build phase start, add eslint as a dev dependency,
      run npm ci, commit package.json and package-lock.json together. Check 6 becomes active
      automatically once node_modules/.bin/eslint exists.

- [!] npm test script wired in package.json — HARD BLOCK: test suite enforcement inactive until complete
      Pre-commit Check 5 runs npm test when test files exist. Requires a "test" script in
      package.json pointing to the test runner. No test framework is specified here — that
      decision is made when build phase begins. Once wired, Check 5 becomes active automatically.

**tagger.js rewrite prerequisites — resolve before tagger.js is written:**
- [ ] API key / proxy decision — fetch calls have no x-api-key header. Confirm
      whether a proxy is assumed or key is injected at runtime. Architectural
      decision. Must be resolved before any API call is written.
- [ ] Consolidate suggestTags / suggestArcPhase / suggestOrigin into one unified
      call. All three return together in one response. Standalones are redundant.
      elarianAnchor joins the same response shape.
- [ ] Define error handling pattern once before implementation begins.
      suggestTags checks response.ok — the others don't. One pattern, applied
      consistently across all API functions.
- [ ] Update CLAUDE_MODEL constant to claude-sonnet-4-6.
- [ ] arcSeedId field in buildEngineSyncPayload — not found in any schema doc.
      Confirm or remove before rewrite. Possible contamination from old build.
- [ ] Backfill path decision — entries written before elarianAnchor existed will
      have no elarianAnchor field. Decide: backfill needed, or archive starts
      fresh from rebuild. Record decision here before build begins.
- [ ] elarianAnchor added to AI-facing JSON export spec alongside arcCode and
      doc_type. Verify at schema.js build time (failure mode 7 in COMPOSITE ID
      SCHEMA).

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
