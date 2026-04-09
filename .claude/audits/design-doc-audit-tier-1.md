## Task

Tier 1 deep audit of design-session-plan.md (lines 203-1287) cross-referenced
against all verified specs mapped to this tier. Per the design document audit
and extraction plan: check spec existence, spec alignment, gap detection, drift
detection, dead material. Categorize every item as CONFIRMED, DRAFT, DEAD,
DRIFT, or DECISION CONTEXT.

Tier 1 covers: INT Engine + Deposit Foundation
Design doc status: COMPLETE (session 26)


## Files examined

Design document:
  .claude/plans/design-session-plan.md — lines 203-1287 (Tier 1 section)

Verified specs (all on ENTROPY_EXCAVATION.md VERIFIED list):
  DESIGN/Systems/Integration/INTEGRATION SCHEMA.md
  DESIGN/Systems/Integration/INTEGRATION DB SCHEMA.md
  DESIGN/Systems/Integration/SYSTEM_ Integration.md
  DESIGN/Systems/Integration/SYSTEM_ Integration DB.md
  DESIGN/Systems/Composite_ID/COMPOSITE ID SCHEMA.md
  DESIGN/Systems/Composite_ID/SYSTEM_ Composite ID.md
  DESIGN/Systems/Tagger/TAGGER SCHEMA.md
  DESIGN/Systems/Tagger/SYSTEM_ Tagger.md

Additional specs checked (mapped in tier plan):
  DESIGN/Systems/Embedding_Pipeline/EMBEDDING PIPELINE SCHEMA.md
  DESIGN/Systems/Operational_DB/OPERATIONAL DB SCHEMA.md


## Findings

Two audit passes performed. First pass: 13 CONFIRMED, 2 DRIFT, 4 DEAD,
1 DECISION CONTEXT, 0 DRAFT. Second pass after fixes: found and resolved
5 additional issues (declined status stale, Pearl record incomplete,
calibration markers needed). All cross-file inconsistencies resolved.
5 spec fixes applied to INTEGRATION SCHEMA.md.

### CATEGORY SUMMARY

  CONFIRMED:        13 sections
  DRIFT:             2 items (1 structural, 1 location)
  DEAD:              4 dropped fields
  DECISION CONTEXT:  1 section (~100 lines of resolved questions)
  DRAFT:             0 items


### CONFIRMED (13 sections — matches verified specs)

1. DEPOSIT RECORD FIELDS (lines 223-346)
   All 19+ fields confirmed across INTEGRATION DB SCHEMA, INTEGRATION SCHEMA,
   TAGGER SCHEMA, and COMPOSITE ID SCHEMA:
   - Core fields: content, page_target/section_id, tags, composite_id,
     timestamp, phase_state, elarianAnchor — all present
   - doc_type 9-value enum: entry | observation | analysis | hypothesis |
     discussion | transcript | glyph | media | reference — exact match
     (INTEGRATION DB SCHEMA)
   - source_format 7-value enum including json — exact match
   - source_type: field | generated, non-nullable — confirmed
   - Conditional fields (observation_presence, confidence) — correctly
     scoped to observation/analysis/hypothesis doc_types
   - deposit_weight: high | standard | low — confirmed in both INTEGRATION DB
     SCHEMA and TAGGER SCHEMA (AI-suggested, Sage override)
   - pearl_captured_at: timestamp | null — confirmed
   - Swarm fields (authored_by, node_id, instance_context) — confirmed in
     INTEGRATION DB SCHEMA, not referenced in Composite ID or Tagger specs
     (architecturally correct — not their domain)
   - doc_type BUILD FLAG: "database field only, not in stamp" — exact match
     in COMPOSITE ID SCHEMA BUILD FLAGS section

2. INT WORKSTATION — DUAL PANEL (lines 351-380)
   Confirmed via SYSTEM_ Integration.md:
   - Left panel: upload + review queue with per-deposit controls
   - Right panel: AI parsing partner (NOT research assistant)
   - Two modes: Native (page code INT) and Source (page code AX, root stamp)

3. INT PARSING PARTNER — API CONTRACT (lines 382-600)
   Confirmed via INTEGRATION SCHEMA.md:
   - chunk_parse object: chunk_id, parse_version, suggested_deposits[],
     parse_flags[], chunk_summary, correction_hooks — all fields match
   - Simplified type enum: observation | pattern | question | note — matches
   - Type-to-doc_type mapping table — matches
   - Correction propagation: 4-step distillation, active_rules,
     superseded_rules — matches
   - Step 1a conflict check + candidate gate — both documented
   - Prompt versioning: 3 trigger types (sage-directed, calibration,
     manual) — matches
   - Confidence calibration tracking per tier — matches

4. BATCH PROCESSING FLOW (lines 603-632)
   Confirmed via INTEGRATION SCHEMA.md:
   - 10-step document flow — matches
   - Rolling buffer (3-5 chunks ahead) — matches
   - Session persistence concept — matches
   - One root stamp per document — matches

5. BATCH PROCESSING STATE MACHINE (lines 669-722)
   Confirmed via INTEGRATION SCHEMA.md:
   - Chunk status transitions: pending -> parsing -> parsed -> review ->
     complete — matches
   - Failure states: parse_failed (with failure_type enum), manual_required,
     partial — matches
   - Retry limit: 3, then manual_required — matches
   - context_overflow triggers chunk split before retry — matches
   NOTE: The INTEGRATION SCHEMA state machine describes application-layer
   workflow phases. The INTEGRATION DB SCHEMA stores session state with
   different status enums. INTEGRATION SCHEMA now includes a DB mapping
   note clarifying the relationship (FIX-2). Both are verified and
   internally consistent.

6. REVIEW QUEUE INTERACTION SPEC (lines 725-818)
   Confirmed via INTEGRATION SCHEMA.md:
   - Review card layout with doc_type dropdown — matches
   - parse_flags surface above deposits — matches
   - Editable fields: content, tags, doc_type, routing — matches
   - Review actions: Approve, Edit, Skip (no Decline — removed as stale)
   - Skip state: skipped_at, skip_reason, re_queue_eligible, no expiry
   - Staleness signal: SKIP_STALENESS_WINDOW_DAYS = 90 (calibration item)
   - Cross-chunk context sidebar — matches

7. MEDIA DEPOSIT WIRING (lines 821-849)
   Confirmed via INTEGRATION SCHEMA.md:
   - JPEG/PNG V1 — matches
   - Filesystem storage (backend/media/), metadata to PostgreSQL — matches
   - Simplified flow (no chunking) — matches
   - 7-step upload flow — matches

8. DUPLICATE DETECTION (lines 852-867)
   Confirmed via INTEGRATION SCHEMA.md:
   - Hash-based identical content match — matches
   - WARN not BLOCK behavior — matches
   - Fires at deposit creation (INT gateway step 2) — matches

9. BLACK PEARL (lines 870-899)
   Confirmed via INTEGRATION SCHEMA.md + OPERATIONAL DB SCHEMA.md:
   - Pearl record: pearl_id, content, created_at, page_context, status
     (active | promoted | archived) — exact match in OPERATIONAL DB SCHEMA
   - Stored in SQLite operational DB — confirmed
   - Promotion flow through INT gateway — confirmed
   - pearl_captured_at populated from Pearl's created_at — confirmed

10. INT GATEWAY — DEPOSIT CREATION CONTRACT (lines 902-991)
    Confirmed via INTEGRATION SCHEMA.md:
    - POST /api/deposits/create — matches
    - Request: all deposit record fields with session context, provenance
    - Response success: deposit_id, stamp, status, routing_confirmed,
      embedding_status, created_at — matches
    - Response failure: error_code enum, failed_at_step, partial_state,
      retry_safe — matches

11. DEPOSIT ATOMICITY BOUNDARY (lines 994-1033)
    Confirmed via INTEGRATION SCHEMA.md:
    - 6-step pipeline with boundary after step 3 — matches
    - Above boundary: all-or-nothing (validate, duplicate check, create)
    - Below boundary: deposit exists, downstream recoverable async
    - Stamp pending queue, embedding retry queue, partial routing — matches

12. EMBEDDING PIPELINE — DEPOSIT LEVEL (lines 1036-1117)
    Confirmed via INTEGRATION SCHEMA.md (NOT via EMBEDDING PIPELINE SCHEMA):
    - Async, queued at deposit creation, never blocks — matches
    - Status: queued | processing | complete | failed | retry_queued |
      failed_permanent — matches
    - 3-attempt retry (immediate, 5min, 30min) — matches
    - embedding_dirty on post-creation edit — matches
    - Engine stale flag on tag edit — confirmed via OPERATIONAL DB SCHEMA
      (engine_stale_flags table)
    NOTE: EMBEDDING PIPELINE SCHEMA.md covers ARCHIVE-level embedding
    (post-retirement, provenance_summary as input). Deposit-level embedding
    is defined entirely within INTEGRATION SCHEMA.md. Both write to the
    embeddings table but serve different retrieval needs. The tier-to-spec
    mapping should note this distinction.

13. HUMAN READABILITY RULE (lines 1120-1137)
    Confirmed as cross-cutting design principle: every UI-surfacing field
    gets a plain language translation. Applied throughout Integration specs
    in Sage-facing surfaces sections.


### DRIFT (2 items — design doc contradicts verified spec)

DRIFT-1: BATCH PROCESSING DATABASE STRUCTURE (lines 633-661)

  Design doc claims (line 633): "Chunk tracking (operational DB):"
  Then defines 3 flat tables:
    - Document record: document_id, filename/title/notes, total_pages,
      chunk_size, total_chunks, status: ingesting | processing | review |
      complete
    - Per-chunk record: chunk_id, document_id, page_range, chunk_order,
      status: pending | parsing | parsed | review | complete
    - Per-deposit record: deposit_id, chunk_id, suggested_tags,
      suggested_doc_type, suggested_source_format, suggested_page_target,
      status: pending_review | approved | corrected | skipped | declined |
      deposited, sage_notes

  Verified spec (INTEGRATION DB SCHEMA.md) has:
    - root_entries table (PostgreSQL, not SQLite): intake_status
      (blob_pending | complete) + retirement_status + root_integrity.
      NOT the design doc's 4-value ingesting/processing/review/complete enum
    - manifest_sessions table: status (active | complete | deferred |
      interrupted | blob_error). NOT the design doc's 5-value chunk enum
    - Deposits NESTED within manifest_sessions (deposits[] array with
      deposit_num, section_id, page_code, status: pending | confirmed |
      skipped | deferred). NOT a separate table. NOT the design doc's
      6-value deposit status enum
    - correction_context stored as JSONB field on manifest_sessions
      (not separate table, but content structure matches: active_rules,
      superseded_rules, corrections array)
    - prompt_versions table exists with matching structure (prompt_type,
      version_string, trigger_type enum matches)

  What happened: the design doc (session 15) has the earlier conceptual
  model. INTEGRATION DB SCHEMA.md (later, verified) refined it into a
  more sophisticated structure. The spec is authoritative. The design doc's
  batch DB section is superseded.

  Impact on transfer: The FLOW description (steps 1-10, rolling buffer,
  session persistence) is CONFIRMED and transfers. The DATABASE TABLE
  STRUCTURE (field names, status enums, table relationships) does NOT
  transfer — the verified spec supersedes it.

DRIFT-2: DATABASE LOCATION FOR BATCH TABLES (line 633)

  Design doc: "Chunk tracking (operational DB):"
  Verified spec: Batch tables (root_entries, manifest_sessions) are in
  INTEGRATION DB SCHEMA.md = PostgreSQL, not SQLite operational DB.
  OPERATIONAL DB SCHEMA.md (SQLite) contains: sessions, presence_log,
  pearls, operational_state, engine_stale_flags, researcher_memory,
  conversation_summary, venai_drift_log. No batch tables.

  Transfer: Location claim does not transfer. Correct location is
  PostgreSQL per verified spec.


### DEAD (4 dropped fields — lines 339-347)

  - deposit_depth: deep | standard | fragment — DROPPED session 15.
    Redundant with doc_type, confidence, and content itself.
  - researcher_state — DROPPED session 15. Replaced by universal notes.
  - session_depth — DROPPED session 15. Same reason.
  - condition_notes — DROPPED session 15. Replaced by universal notes.

  All four correctly marked as dropped in the design doc with reasoning.
  None transfer to new document.


### DECISION CONTEXT (1 section — lines 1140-1243)

  RESOLVED QUESTIONS section: ~100 lines of resolved design questions
  with answers, gap resolutions from sessions 15/18/19, and 9 cross-tier
  enhancements. All questions answered and incorporated into the confirmed
  sections above.

  Transfer: Goes to decision context appendix, not main document.
  Key load-bearing decisions to preserve:
  - Conditional fields scoped to researcher doc_types only (lines 1143-1146)
  - deposit_depth dropped, deposit_weight replaces (line 1150)
  - Correction rule contradiction detection is load-bearing (lines 1196-1198)
  - Embedding invalidation on edit is load-bearing (lines 1202-1204)
  - Distillation confirm step is load-bearing (lines 1208-1210)
  - MTM circular provenance filter is load-bearing (lines 1216-1218)


### PIPELINE SEGMENT SUMMARY (lines 1246-1287)

  Four pipeline flow summaries (text deposit, media deposit, batch
  processing, batch failure, Black Pearl). All summarize confirmed content
  from sections above. Transfers as confirmed — it is a clean summary,
  not new content.


## Spec Mapping Notes

1. EMBEDDING PIPELINE SCHEMA.md is listed in the tier-to-spec mapping but
   covers ARCHIVE-level embedding only (post-retirement, provenance_summary
   input). Tier 1's deposit-level embedding is defined in INTEGRATION
   SCHEMA.md. Both are valid specs — they serve different scopes. The
   mapping note should clarify this.

2. OPERATIONAL DB SCHEMA.md maps correctly for Black Pearl (pearl record
   fields confirmed) and engine_stale_flags. It does NOT contain batch
   processing tables — those are in INTEGRATION DB SCHEMA.md.

3. Two distinct "confidence" scales exist in Tier 1 (not a conflict):
   - Deposit confidence: clear | emerging | raw (researcher observation)
   - Parse confidence: high | medium | low (AI parsing certainty)
   Different fields, different contexts. Both correctly specified.


## Pre-Identified Drift Items (from audit plan)

Of the 5 items spotted during structural mapping, only #5 touches Tier 1:

  Item 5: Decisions Log line 6039 lists deposit_depth: deep | standard |
  fragment — dropped in session 15. Log doesn't note the drop.
  Status: Confirmed stale. Design doc Tier 1 correctly marks deposit_depth
  as DROPPED (line 340). The Decisions Log (outside Tier 1 line range) is
  the stale reference. Will be caught in the Decisions Log audit.


## Spec Fixes Applied (session 39)

All fixes applied to INTEGRATION SCHEMA.md. No other verified files
required changes.

FIX-1: BATCH TRACKING SECTION (lines 885-919)
  Replaced stale 3-flat-table model labeled "operational DB" with
  references to actual PostgreSQL tables (root_entries,
  manifest_sessions, deposits[]) per INTEGRATION DB SCHEMA.md.
  Session persistence updated from "operational DB" to "PostgreSQL."
  Verified: zero references to old model remain.

FIX-2: STATE MACHINE DB MAPPING (lines 926-935)
  Added clarifying note: workflow phases (pending → parsing → parsed →
  review → complete) are application-layer derivations. DB stores
  session state via manifest_sessions.status and deposit status.
  Renamed section header: "CHUNK STATUS TRANSITIONS" →
  "CHUNK WORKFLOW PHASES."
  Verified: no stale status enums introduced.

FIX-3: DECLINED STATUS REMOVED (lines 945, 1009, 1057, 1062-1081)
  "Declined" was not a valid deposit status in INTEGRATION DB SCHEMA
  (deposit status: pending | confirmed | skipped | deferred).
  Removed from: state machine transition description (line 945),
  review card UI buttons (line 1009), staleness text (line 1057),
  entire DECLINE BEHAVIOR section (lines 1062-1075), flag display
  values (line 1081).
  Verified: zero "declined" references remain in any Integration file.

FIX-4: PEARL RECORD COMPLETED (lines 1133-1152)
  Added missing fields from OPERATIONAL DB SCHEMA: promoted_deposit_id,
  pearl_type (capture | reflective), swarm_visible, promoted_via
  (panel | dashboard | null). Updated promotion flow to describe
  Pearl record updates on promotion (status, promoted_deposit_id,
  promoted_via).
  Verified: INTEGRATION SCHEMA Pearl record now matches OPERATIONAL
  DB SCHEMA field list.

FIX-5: CALIBRATION MARKER (line 1060-1061)
  SKIP_STALENESS_WINDOW_DAYS = 90 marked as "(calibration item)."


## Second-Pass Findings (design doc issues — handled during extraction)

These are issues in the DESIGN DOC that do NOT require spec fixes.
They will be corrected in the new extracted document.

1. observation_type / observation_presence confusion
   Design doc lines 251, 979 use "observation_type" when they mean
   "observation_presence." The verified specs use the correct name.
   The design doc itself warns at line 6467: "If you see observation_type
   in a deposit context, it's wrong."
   Transfer action: use "observation_presence" in new document.

2. source_format enum inconsistency (design doc internal)
   Line 267 lists 7 values (includes json). The INT Gateway contract
   section in the design doc lists 6 values (no json). The verified
   spec (INTEGRATION SCHEMA.md line 544 and INTEGRATION DB SCHEMA.md)
   includes json. Spec is authoritative.
   Transfer action: use 7-value enum with json in new document.

3. Pearl record incomplete in design doc
   Design doc lists 5 fields. OPERATIONAL DB SCHEMA has 9. Now fixed
   in INTEGRATION SCHEMA.md (FIX-4 above).
   Transfer action: new document uses full 9-field Pearl record.

4. Calibration values
   30% correction rate threshold (line 577) and 90-day staleness
   window (line 795) are configurable. Transfer as calibration items,
   not fixed specs.

5. Pearl extensions tier boundary
   Design doc Tier 2 section lists pearl_type, swarm_visible,
   promoted_via as "extending Tier 1 schema." OPERATIONAL DB SCHEMA
   has them as canonical Tier 1 fields.
   Transfer action: list all Pearl fields together, no tier split.


## Conclusion

Tier 1 is the best-documented tier in the design doc. After two audit
passes and 5 spec fixes, all cross-file inconsistencies are resolved.

Category totals (final):
  CONFIRMED:        13 sections (exact field-level match to verified specs)
  DRIFT:             2 items in design doc (batch DB structure and location
                     — both superseded by verified spec, noted for transfer)
  DEAD:              4 dropped fields (do not transfer)
  DECISION CONTEXT:  1 section (~100 lines of resolved questions →
                     appendix)
  DRAFT:             0 items

Verified spec state after fixes:
  INTEGRATION SCHEMA.md — 5 fixes applied, all verified clean
  INTEGRATION DB SCHEMA.md — no changes needed (was already correct)
  SYSTEM_ Integration.md — no changes needed (confirmed clean)
  SYSTEM_ Integration DB.md — no changes needed (confirmed clean)
  COMPOSITE ID SCHEMA.md — no changes needed (confirmed clean)
  SYSTEM_ Composite ID.md — no changes needed (confirmed clean)
  TAGGER SCHEMA.md — no changes needed (confirmed clean)
  SYSTEM_ Tagger.md — no changes needed (confirmed clean)
  EMBEDDING PIPELINE SCHEMA.md — no changes needed (archive scope only)
  OPERATIONAL DB SCHEMA.md — no changes needed (Pearl record is SOT)

Transfer recommendation:
  - 13 CONFIRMED sections transfer verbatim (using spec-authoritative
    values where design doc was internally inconsistent)
  - Batch processing FLOW transfers; batch DB structure references the
    verified spec instead of carrying the superseded model
  - 4 DEAD fields do not transfer
  - Resolved questions go to decision context appendix
  - Calibration values marked as calibration items
  - observation_presence used consistently (not observation_type)
  - source_format uses 7-value enum (includes json)
  - Pearl record uses full 9-field list from OPERATIONAL DB SCHEMA
