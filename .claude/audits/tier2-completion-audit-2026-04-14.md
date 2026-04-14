## Task
Audit all eight Tier 2 items Sage listed to determine whether each is
complete at the design file level, and whether each is properly
represented in design-build-spec.md. Goal: identify anything that fell
through so Tier 2 can be fully locked.

Items audited:
  Instance Context, Deposit Weight AI Suggestion, Engine Baseline
  Recalibration, AOS (Automated Observation Signal), Deposit Genealogy
  View, Annotation Layer, WSC HOLDING note, Pipeline Segment (Tier 2).

## Files examined

- .claude/plans/design-build-spec.md — Tier 2 section (full)
- .claude/plans/design-session-plan.md — lines 73-198 (lock records),
  lines 1656-1848 (individual item sections)
- PROTOCOL/SESSION_LOG.md — session 46 CLOSE entry

## Findings

### SESSION 46 LOCK RECORD (design-session-plan.md lines 73-198)

All six of the following items were fully locked in session 46
(approved 2026-04-10). Files were written, bugs fixed, cross-file
scans run. This is confirmed in the session plan lock record.

  Item 5  — Deposit Card Component: LOCKED
  Item 9  — Instance Context: LOCKED
  Item 10 — Deposit Weight AI Suggestion: LOCKED
  Items 13+15 — Engine Baseline Recalibration + AOS: LOCKED (merged)
  Item 16 — Deposit Genealogy View: LOCKED
  Item 17 — Annotation Layer: LOCKED

WSC HOLDING note and Pipeline Segment: handled session 47 (today).

### BUILD SPEC STATUS — THE GAP

The design-build-spec.md pending list does not reflect session 46's
work. Specific status per item:

  Deposit Card Component
    Pending list: not struck — shows as still pending
    Build spec content: none
    Canonical spec: SYSTEM_ Frontend.md — DEPOSIT CARD COMPONENT section
    Session 46 scope: base card, 3 provenance icons, expand view,
      per-page variations, sort behavior, MediaDepositCard.
    Status: MISSING FROM BUILD SPEC

  Instance Context
    Pending list: struck — "locked session 46" ✓
    Build spec content: none — struck without content extraction
    Canonical spec: INTEGRATION SCHEMA.md (Definition B, field +
      JSON block), WSC SCHEMA.md (registry pointer correction)
    Session 46 scope: instance_context = pointer to instance registry.
      Phase period + date range. Agent ID + system continuity.
      Validated non-null at deposit creation.
    Status: STRUCK BUT NO CONTENT — minor gap (struck is acceptable
      minimum; content would be consistent with other locked items)

  Deposit Weight AI Suggestion
    Pending list: not struck — shows as still pending
    Build spec content: none
    Canonical spec: TAGGER SCHEMA.md (DEPOSIT_WEIGHT ASSESSMENT PROMPT),
      INTEGRATION DB SCHEMA.md (field definition)
    Session 46 scope: 3-factor priority heuristic (doc_type → specificity
      → confidence). Default standard. Sage override free. Null sorts to
      bottom. Multipliers 2.0/1.0/0.5 in engine schemas.
    Status: MISSING FROM BUILD SPEC

  Engine Baseline Recalibration + AOS
    Pending list: two separate line items, neither struck
    Build spec content: AOS flow summary in section 2.8 (pipeline),
      but no dedicated section
    Canonical spec: SYSTEM_ AOS.md, AOS SCHEMA.md (new files, session 46).
      Items 13+15 merged — Engine Baseline absorbed into AOS trigger
      registry.
    Session 46 scope: two-layer system (signal + delivery). Corpus 2×
      or variance threshold triggers recalibration. delivery_error field.
      Google delivery (Gmail OAuth, Drive, 11:11 PM cron). Pulse fallback.
    Status: MISSING FROM BUILD SPEC (two pending list entries to strike)

  Deposit Genealogy View
    Pending list: not struck — shows as still pending
    Build spec content: none
    Canonical spec: SYSTEM_ Frontend.md — component, expanded card spec
    Session 46 scope: read-only lifecycle timeline on card expand. No
      dedicated table — assembled from existing tables. Stages: Pearl
      capture → INT review → deposit creation → page routing → engine
      indexing → pattern/finding/hypothesis contribution. Future stages
      grayed. Click navigates to stage context.
    Status: MISSING FROM BUILD SPEC

  Annotation Layer
    Pending list: not struck — shows as still pending
    Build spec content: none
    Canonical spec: INTEGRATION DB SCHEMA.md — annotations table
    Session 46 scope: researcher marginalia on any analytical object.
      Polymorphic reference (annotated_type + annotated_id). Zero schema
      cascades. annotated_type: deposit | finding | hypothesis |
      void_output | engine_snapshot. WSC + AOS excluded. Visible in
      expanded view only. Exportable per page.
    Status: MISSING FROM BUILD SPEC

### CLEAN (no action needed)

  WSC HOLDING note: handled session 47 — struck, recorded as HOLD ✓
  Pipeline Segment: handled session 47 — struck, section 2.8 written ✓

### ROOT CAUSE

Session 46 correctly locked all six items at the file level and recorded
them in the design-session-plan.md lock record. However, none were
extracted to design-build-spec.md. The session was interrupted before
the build spec could be updated. The build spec pending list was not
updated at session 46 close.

## Conclusion

Six items need build spec representation:
  1. Deposit Card Component — needs section + strike
  2. Instance Context — struck already, needs content (minor)
  3. Deposit Weight AI Suggestion — needs section + strike
  4. Engine Baseline Recalibration + AOS — needs one section + two strikes
  5. Deposit Genealogy View — needs section + strike
  6. Annotation Layer — needs section + strike

All design work is DONE in canonical files. The build spec is the only
thing lagging. No new design decisions required — extraction only.
