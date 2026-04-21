Answer these in chat-do not create a file.

Add anything not listed that you alsow ant or need in ANTIGRAVITY.md and pls answer;

1. SPEC authorship rules
  CLAUDE.md says "don't author SPECs unilaterally." ANTIGRAVITY.md needs the
  positive: what a valid SPEC artifact contains, what format it follows, and what
   state it must be in before Claude Code can build against it. That definition
  doesn't exist anywhere yet.

  2. SPEC_REQUEST format
  The failure-mode clause we just discussed names SPEC_REQUEST entries. What does
   one look like? Who receives it, what does it contain, where does it land?
  Claude Code is the receiver — Antigravity is the producer. The format needs to
  live in Antigravity's contract.

  3. Bounded-build definition
  AGENTS.md says Antigravity "may execute simple, bounded builds." Neither
  document defines what "simple and bounded" means — scope limits, what triggers
  escalation to Claude Code instead. Without a definition, the phrase is
  unenforceable.

  4. Handoff producing side
  CLAUDE.md references TYPE: HANDOFF from the receiving end. Antigravity's
  contract needs the producing side: what a SPEC-complete handoff carries, what
  Claude Code is entitled to expect before it can begin BUILD.

  Things I can't derive — need Sage or Antigravity to define:
  - Whether Antigravity writes to SESSION_LOG.md and in what format
  - Whether Antigravity opens PRs or only hands to Claude Code to open
  - What "orchestration" means mechanically