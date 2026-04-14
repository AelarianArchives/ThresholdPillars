# Design Build Spec
# Aelarian Archives
# Created: 2026-04-09 (session 41)

Assembled from audited design content. Every section in this file has
been cross-referenced against verified specs and reviewed by Sage.
Content enters this file only after audit and approval. Content that
contradicts a verified spec does not enter this file.

**Status key:**
- LOCKED — audited, spec-verified, ready for build
- DESIGNED — designed, specs exist (verified or unverified)
- PARTIAL — partially designed, gaps remain
- NOT STARTED — no design exists

**Source authority:** Verified DESIGN/ specs are the mechanical source
of truth for field names, enums, contracts, and data shapes. This
document describes what gets built and how it connects. When in doubt,
the spec wins.

---

## TIER 1 — INT ENGINE + DEPOSIT FOUNDATION

**Status:** LOCKED
**Audited:** Session 39. 13 sections confirmed against 10 verified specs.
5 fixes applied to INTEGRATION SCHEMA.md during audit.
**Audit artifact:** .claude/audits/design-doc-audit-tier-1.md

### Specs (all VERIFIED)

| Spec | Location |
| --- | --- |
| INTEGRATION SCHEMA | DESIGN/Systems/Integration/INTEGRATION SCHEMA.md |
| INTEGRATION DB SCHEMA | DESIGN/Systems/Integration/INTEGRATION DB SCHEMA.md |
| SYSTEM_ Integration | DESIGN/Systems/Integration/SYSTEM_ Integration.md |
| SYSTEM_ Integration DB | DESIGN/Systems/Integration/SYSTEM_ Integration DB.md |
| COMPOSITE ID SCHEMA | DESIGN/Systems/Composite_ID/COMPOSITE ID SCHEMA.md |
| SYSTEM_ Composite ID | DESIGN/Systems/Composite_ID/SYSTEM_ Composite ID.md |
| TAGGER SCHEMA | DESIGN/Systems/Tagger/TAGGER SCHEMA.md |
| SYSTEM_ Tagger | DESIGN/Systems/Tagger/SYSTEM_ Tagger.md |
| EMBEDDING PIPELINE SCHEMA | DESIGN/Systems/Embedding_Pipeline/EMBEDDING PIPELINE SCHEMA.md |
| OPERATIONAL DB SCHEMA | DESIGN/Systems/Operational_DB/OPERATIONAL DB SCHEMA.md |

---

### 1.1 DEPOSIT RECORD — FULL FIELD SHAPE

Every deposit in the archive carries these fields. This shape is what
all downstream systems read from.

**Core fields:**
- content — text body
- page_target / section_id — routing target(s)
- tags — semantic tags from tagger system
- composite_id — stamp from Composite ID system
- timestamp — creation time
- phase_state — one of 12 canonical threshold names, or null
- elarianAnchor — structured field (TAGGER SCHEMA prompt block)

**Classification fields:**
- doc_type — 9-value enum: entry | observation | analysis | hypothesis |
  discussion | transcript | glyph | media | reference
  (database field only, not in stamp — per COMPOSITE ID SCHEMA)
- source_format — 7-value enum: digital | handwritten | scan | image |
  audio | file | json
- source_type — field | generated (non-nullable)

**Conditional fields (observation/analysis/hypothesis doc_types only):**
- observation_presence — positive | null (NOT observation_type)
- confidence — clear | emerging | raw (researcher-assigned)

**Universal metadata:**
- notes — optional freeform text, available on every deposit regardless of doc_type

**Weight and provenance:**
- deposit_weight — high | standard | low (AI-suggested, Sage override)
  Multipliers: 2.0 / 1.0 / 0.5
- pearl_captured_at — timestamp | null (from Pearl's created_at if promoted)

**Swarm fields:**
- authored_by — agent identity
- node_id — agent node
- instance_context — active instance reference

**Spec authority:** INTEGRATION DB SCHEMA.md (field definitions),
INTEGRATION SCHEMA.md (deposit anatomy), TAGGER SCHEMA.md (prompt
blocks), COMPOSITE ID SCHEMA.md (stamp construction and BUILD FLAGS)

---

### 1.2 INT WORKSTATION — DUAL PANEL

- Left panel: upload + review queue with per-deposit controls
- Right panel: AI parsing partner (NOT research assistant — scoped to
  batch processing collaboration only)
- Two modes: Native (page code INT) and Source (page code AX, root stamp)

**Spec authority:** SYSTEM_ Integration.md

---

### 1.3 INT PARSING PARTNER — API CONTRACT

**chunk_parse object:**
- chunk_id, parse_version, suggested_deposits[], parse_flags[],
  chunk_summary, correction_hooks

**Simplified type enum:** observation | pattern | question | note
Type-to-doc_type mapping table in INTEGRATION SCHEMA.md

**Correction propagation:** 4-step distillation with active_rules,
superseded_rules. Step 1a conflict check + candidate gate.

**Prompt versioning:** 3 trigger types (sage-directed, calibration,
manual). Prompt version travels with every output.

**Confidence calibration tracking** per tier — parse confidence
(high | medium | low) is distinct from deposit confidence
(clear | emerging | raw). Different fields, different contexts.

**Spec authority:** INTEGRATION SCHEMA.md (parsing partner section)

---

### 1.4 BATCH PROCESSING FLOW

10-step document flow:
1. Upload source document
2. Chunk into processable segments
3. Rolling buffer (3-5 chunks ahead)
4. Parse each chunk via AI partner
5. Generate suggested deposits per chunk
6. Surface parse_flags for review
7. Queue deposits for review
8. Sage reviews, edits, approves/skips per deposit
9. Approved deposits enter INT gateway
10. Session persists across interruptions

One root stamp per document. Session persistence in PostgreSQL.

**Spec authority:** INTEGRATION SCHEMA.md (batch processing section)

---

### 1.5 BATCH PROCESSING STATE MACHINE

**Chunk workflow phases:** pending → parsing → parsed → review → complete

These are application-layer workflow derivations. Database stores session
state via manifest_sessions.status and deposit status per INTEGRATION DB
SCHEMA.md.

**Failure states:** parse_failed (with failure_type enum), manual_required,
partial. Retry limit: 3, then manual_required. context_overflow triggers
chunk split before retry.

**Database tables (PostgreSQL):** root_entries, manifest_sessions with
nested deposits[] array. Status enums per INTEGRATION DB SCHEMA.md.

**Spec authority:** INTEGRATION SCHEMA.md (state machine), INTEGRATION DB
SCHEMA.md (table definitions)

---

### 1.6 REVIEW QUEUE INTERACTION SPEC

**Review card:** doc_type dropdown, parse_flags surface above deposits
**Editable fields:** content, tags, doc_type, routing
**Actions:** Approve, Edit, Skip (no Decline — not a valid DB status)
**Skip state:** skipped_at, skip_reason, re_queue_eligible, no expiry
**Staleness:** SKIP_STALENESS_WINDOW_DAYS = 90 (calibration item)
**Cross-chunk context:** sidebar showing related chunks for reference

**Spec authority:** INTEGRATION SCHEMA.md (review queue section)

---

### 1.7 MEDIA DEPOSIT WIRING

- V1 media types: JPEG, PNG
- Storage: filesystem (backend/media/), metadata to PostgreSQL
- Simplified flow: no chunking
- 7-step upload flow in INTEGRATION SCHEMA.md

**Spec authority:** INTEGRATION SCHEMA.md (media deposit section)

---

### 1.8 DUPLICATE DETECTION

- Hash-based identical content match
- WARN not BLOCK — Sage decides, system never auto-resolves
- Fires at deposit creation (INT gateway step 2)

**Spec authority:** INTEGRATION SCHEMA.md (duplicate detection section)

---

### 1.9 BLACK PEARL PROMOTION FLOW

Black Pearl is Sage's reflection space. Lives in page nav, left side.
Captures raw noticings before they are named or framed. Pre-archive —
Pearls live in SQLite operational DB until promoted through INT.

**Pearl record (7 fields):**
- pearl_id — text, primary key
- content — text, not null
- created_at — timestamp
- page_context — which page Sage was on, nullable
- status — active | promoted | archived
- promoted_deposit_id — references deposit ID, null until promotion
- promoted_via — panel | null (null until promotion)

**Promotion:** Pearl promoted from panel → enters INT gateway → receives
full deposit fields → enters PostgreSQL as real deposit. pearl_captured_at
populated from Pearl's created_at.

**Key invariant:** Nothing enters the archive without INT provenance.
A Pearl becomes an archive entry only when promoted through INT.

**Spec authority:** OPERATIONAL DB SCHEMA.md (Pearl record), INTEGRATION
SCHEMA.md (promotion flow)

---

### 1.10 INT GATEWAY — DEPOSIT CREATION CONTRACT

**Endpoint:** POST /api/deposits/create

**Request:** all deposit record fields with session context, provenance

**Response success:** deposit_id, stamp, status, routing_confirmed,
embedding_status, created_at

**Response failure:** error_code enum, failed_at_step, partial_state,
retry_safe

**Spec authority:** INTEGRATION SCHEMA.md (gateway contract section)

---

### 1.11 DEPOSIT ATOMICITY BOUNDARY

6-step pipeline with boundary after step 3:

**Above boundary (all-or-nothing):**
1. Validate deposit fields
2. Duplicate check (hash-based, warn)
3. Create deposit record

**Below boundary (deposit exists, downstream recoverable async):**
4. Assign composite ID stamp (stamp pending queue on failure)
5. Queue embedding (embedding retry queue on failure)
6. Route to target pages (routing_status: partial | failed on failure)

**Spec authority:** INTEGRATION SCHEMA.md (atomicity section)

---

### 1.12 EMBEDDING PIPELINE — DEPOSIT LEVEL

Async, queued at deposit creation, never blocks.

**Status lifecycle:** queued | processing | complete | failed |
retry_queued | failed_permanent

**Retry:** 3 attempts (immediate, 5min, 30min)

**Invalidation:** embedding_dirty on post-creation content edit.
Engine stale flag on tag edit (engine_stale_flags table in
OPERATIONAL DB SCHEMA).

**Scope note:** This covers deposit-level embedding only. Archive-level
embedding (post-retirement, provenance_summary input) is defined in
EMBEDDING PIPELINE SCHEMA.md. Both write to the embeddings table but
serve different retrieval needs.

**Spec authority:** INTEGRATION SCHEMA.md (embedding section),
EMBEDDING PIPELINE SCHEMA.md (archive-level scope)

---

### 1.13 HUMAN READABILITY RULE

Cross-cutting design principle: every UI-surfacing field gets a plain
language translation. Applied throughout Integration specs in
Sage-facing surfaces sections.

---

### TIER 1 — DROPPED FIELDS (do not build)

- deposit_depth (deep | standard | fragment) — dropped session 15,
  redundant with doc_type + confidence + content
- researcher_state — dropped session 15, replaced by universal notes
- session_depth — dropped session 15, same reason
- condition_notes — dropped session 15, replaced by universal notes

---

### TIER 1 — PIPELINE SEGMENT

**Text deposit flow:**
Upload/native entry → INT gateway validates → duplicate check (warn) →
deposit created → stamp assigned → routed to target page(s) → embedding
queued async

**Batch processing flow:**
Source document uploaded → chunked → rolling buffer → AI parse per chunk →
suggested deposits queued for review → Sage reviews → approved deposits
enter INT gateway → standard deposit flow from there

**Media deposit flow:**
Image uploaded → filesystem storage → metadata to PostgreSQL → simplified
INT flow (no chunking) → standard routing + embedding

**Black Pearl promotion flow:**
Pearl captured from panel (page nav, left side) → lives in SQLite →
Sage promotes when ready → enters INT gateway with
provenance.source: black_pearl_promoted → standard deposit flow

---
---

## TIER 2 — BLACK PEARL UI + PAGE SURFACES + VOID

**Status:** DESIGNED (audit in progress)
**Depends on:** Tier 1 (deposit record shape, INT engine)

### Specs

| Spec | Location | Verified |
| --- | --- | --- |
| SYSTEM_ Frontend | DESIGN/Systems/Frontend/SYSTEM_ Frontend.md | Yes (content review in progress — ROT ENTRY 006) |
| OPERATIONAL DB SCHEMA | DESIGN/Systems/Operational_DB/OPERATIONAL DB SCHEMA.md | Yes |
| SYSTEM_ Black Pearl | DESIGN/Systems/Black_Pearl/SYSTEM_ Black Pearl.md | Yes |
| BLACK PEARL SCHEMA | DESIGN/Systems/Black_Pearl/BLACK PEARL SCHEMA.md | Yes |
| SECTION MAP | DESIGN/Systems/SECTION MAP.md | Yes (on disk) |
| VOID ENGINE SCHEMA | DESIGN/Systems/Void_Engine/VOID ENGINE SCHEMA.md | No |
| SYSTEM_ Void | DESIGN/Systems/Void_Engine/SYSTEM_ Void.md | No |
| PAGE_LAYOUTS.md | Sage building separately | N/A |

---

### 2.1 BLACK PEARL UI

Black Pearl is Sage's reflection space — her thoughts. Lives in page
nav, left side. Panel opens from left side.

- Quick-capture panel: text field + save + close
- No tagging required, no commitment to the archive
- Captures raw noticings before they are named or framed
- Promote to INT when ready (triggers full INT deposit flow)
- Keyboard shortcuts: deferred to Tier 7 (dedicated session)
- Nothing about Black Pearl lives in Observatory
- Data model: Pearl record in operational DB (SQLite, pre-archive)
- Detailed interaction spec: see section 2.7 (Black Pearl Panel)

---

### 2.2 VOID — PAGE 51

page_code: VOI. section_id: void. Standalone page 51.
Promoted from Nexus group. Nexus retains WSC, LNV, DTX, SGR, PCV (46–50).

Aggregates all null observations across the archive — where the
researcher looked and found nothing. Without this surface, the system
is architecturally biased toward confirmation.

**Distinct from Observatory coverage gap view:**
- Observatory shows where the researcher hasn't looked yet (attention
  distribution)
- Void shows where the researcher looked and found nothing
  (observational absence)
- Both are signal. They are not the same signal.

**Build-time artifacts (all complete on disk):**
- Domain_Void.txt — DESIGN/Domains/11_Void/
- Manifest_51_Void.txt — DESIGN/Domains/11_Void/
- SECTION MAP entry — line 66, standalone
- VOID ENGINE SCHEMA.md — DESIGN/Systems/Void_Engine/
- SYSTEM_ Void.md — DESIGN/Systems/Void_Engine/

**Engine design (complete, Tier 4):**
Two-layer architecture:
- Data layer: cross-engine absence pattern detection. Input is computed
  null signals from all 5 Axis engines (not raw deposits). Examination
  floor filter enforces boundary between confirmed absence and coverage
  gaps.
- Analytical layer: Claude interpretive intelligence reading across all
  Nexus outputs. Three trigger modes (session-close, on-demand open,
  on-demand targeted).

Five absence types: A (cross_engine_convergent), B
(single_engine_persistent), C (temporal_shift), D
(convergent_with_origin), E (hypothesis_attrition).

PCV routing: A and D enter PCV as hypotheses (void_provenance = true).
B and C stay on Void (threshold exceptions aside). E never enters PCV
(detected FROM PCV — feeding back creates loop).

Type E reactivation: researcher_deprioritised hypotheses reactivatable
from Void's page. Field silence hypotheses are not.

Full mechanical spec in VOID ENGINE SCHEMA.md.

**VOI registrations (session 18):**
- VOI-4: Void prompt is a versioned artifact with changelog triggers
- VOI-5: void_provenance flag formally registered on PCV hypothesis record
- VOI-6: coverage gap view assigned to Observatory semantic map
- VOI-7: PCV entry filter + secondary thresholds for absence types B and C registered
- Void on-demand reads are AOS-eligible entry points

**Cross-system:**
- void_output is an annotatable type (Annotation Layer)
- Void's Claude analytical layer is distinct from WSC's Claude tool

---

### 2.7 BLACK PEARL PANEL — INTERACTION SPEC

**Status:** LOCKED
**Audited:** Session 47. Source: design-session-plan.md (BLACK PEARL —
GLOBAL CAPTURE SYSTEM, BLACK PEARL UI, BLACK PEARL PANEL — INTERACTION
SPEC). Four design decisions resolved with Sage before lock.

**Spec authority:** BLACK PEARL SCHEMA.md (canonical Pearl record,
full endpoint set, lifecycle state machine), OPERATIONAL DB SCHEMA.md
(pearls table SQLite constraints), SYSTEM_ Black Pearl.md (ownership
boundaries), SYSTEM_ Frontend.md (panel behavior, stores),
INTEGRATION SCHEMA.md (promotion mechanics, provenance.source)

---

**Pearl record (SQLite, operational DB):**
- pearl_id — primary key, format: prl_[timestamp]_[rand]
- content — text, not null
- label — text, not null. Required journal entry title. Sage-entered at
  capture. Not AI-assigned.
- created_at — ISO timestamp, not null. Becomes pearl_captured_at on the
  deposit record at promotion. The gap between Pearl creation and deposit
  creation is itself data.
- page_context — nullable. Which page Sage was on at capture. Informational,
  does not constrain promotion routing.
- status — active | promoted | archived
- promoted_deposit_id — nullable. Links Pearl to its post-promotion deposit.
- promoted_via — nullable enum: panel | null

**Trigger:**
- Black star button in page nav (left side)
- Keyboard shortcut: deferred to Tier 7. Unbound for now.

**Panel:**
Slides in from left (page nav). Page visible behind — overlay, does not
push content. page_id and instance_context auto-populated silently on open.

**Capture mode** (only mode — Reflect mode abandoned, not built):
- Label input (required)
- Expanding text area for content
- [Save] [Close]
- Post-save: panel stays open, inline confirmation fades 2s, text area
  clears. No navigation away. Rapid capture — 5 Pearls in 30 seconds.

**Pearl list:**
- Keyword search input filters Pearls by content text
- Default (no search): last 5 active Pearls
- Search active: matching Pearls
- Each Pearl: read-only, expandable inline, promotion button on card

**Promotion:**
- Button on Pearl card → queues for INT review queue with
  provenance.source: black_pearl_promoted
- INT tagger runs on content at promotion. No pre-tagging on Pearl.
- Sage stays on current page — INT is not opened.

**Provenance discoverability:**
- Pearl-originated deposits are discoverable via provenance filter
  (Source: Black Pearl) in the archive UI
- Not a TAG VOCABULARY entry. provenance.source is the canonical signal.
  Pearl origin is provenance data, not content classification.

**Lifecycle:**
- Unpromoted Pearls live in SQLite indefinitely. No auto-expiry.
- Sage decides when or if to promote or archive.
- archived: explicitly dismissed by Sage. Record preserved, not deleted.

**What Black Pearl does not do:**
- No Observatory integration — Tier 7 owns that surface if it exists
- Does not deposit directly — promotes through INT only
- Does not own any page or system
- No Reflect mode

---

### 2.8 PIPELINE SEGMENT — TIER 2 END-TO-END FLOWS

**Status:** LOCKED
**Audited:** Session 47. Black Pearl flow corrected against locked spec.

---

**Deposit landing (with deposit card + duplicate check):**
Deposit created in INT (Tier 1) → routed to target page(s) →
  duplicate hash checked on page arrival →
  if duplicate: flagged, Sage resolves (keep_both | keep_original |
    keep_incoming | merge) →
  if clean: deposit card rendered per page's card variant →
  deposit visible and searchable on page via virtualized list.

**Black Pearl capture (with promotion):**
Black Pearl panel from page nav (left side) → slide-in panel →
  label (required) + content entered →
  saved to SQLite operational DB with page_context →
  Pearl list visible below input (keyword search or last 5 active) →
  promotion: button on Pearl card → queued for INT review queue with
  provenance.source: black_pearl_promoted. Sage stays on current page.

**Navigation flow:**
Sidebar nav → 9 collapsible groups → page list → page state indicators
  (new deposit badge, engine stale dot) → keyboard: /, G+N, [, ] →
  global search anchors to deposit card with 300ms highlight.

**AOS flow:**
Engine trigger fires (or Sage triggers from analytical surface) →
  AOS record created with integrity hash →
  delivery: immediate (high-signal) or daily digest (lower-signal) →
  email: signal_type + event + AI summary + evidence + integrity block →
  AOS record persists permanently.

---

### 2.3 DEPOSIT CARD COMPONENT

**Status:** LOCKED
**Audited:** Session 46 (2026-04-10). Canonical spec: SYSTEM_ Frontend.md.

Base card layout — three zones:
- Top: DOC_TYPE · TAGS · STAMP
- Middle: content preview
- Bottom: SESSION DATE · PROVENANCE ICON · WEIGHT BADGE

Three provenance icons: INT batch · Manual · Black Pearl promoted

Expand-on-click reveals: full content, metadata, provenance chain,
engine signal (patterns this deposit contributes to + signal bands),
edit access (tags and annotations only), genealogy timeline, annotations.

**Per-page card variations:**
- THR / STR / INF / ECR / SNM — colored left edge
- DTX / SGR / PCV / VOI — compact 1-line, sort default: deposit_weight desc
- MTM — no deposit cards
- WSC — no deposit cards
- Domain pages — provenance icon prominent
- HCO / COS / CLM / NHM / RCT / ART — base card, no variation
- LNV — uses LnvGalleryCard (separate component, no deposit cards)
- Media deposits — MediaDepositCard: large thumbnail, summary alongside,
  lightbox on click

Sort behavior: per-page defaults in PAGE_LAYOUTS.md. Null weight sorts
to bottom across all pages.

**Spec authority:** SYSTEM_ Frontend.md — DEPOSIT CARD COMPONENT section

---

### 2.4 INSTANCE CONTEXT

**Status:** LOCKED
**Audited:** Session 46 (2026-04-10). Corrections applied to two files.

instance_context on the deposit record is a pointer to an active entry
in the instance registry. Not a literal value — a registry reference.

Instance = phase period with a date range. Sage creates instances
manually. One active at a time. Registry entry tracks: agent ID, phase
state, date range, system continuity flag.

Validated non-null at deposit creation — every deposit must have an
active instance context.

**Spec authority:** INTEGRATION SCHEMA.md (Definition B — field
description + JSON block), WSC SCHEMA.md (registry pointer correction)

---

### 2.5 DEPOSIT WEIGHT — AI SUGGESTION LOGIC

**Status:** LOCKED
**Audited:** Session 46 (2026-04-10). Canonical prompt in TAGGER SCHEMA.

AI suggests deposit_weight (high | standard | low) using three factors
in priority order:

1. doc_type — observations, analyses, hypotheses trend higher than
   entries, transcripts, or discussion
2. Content specificity — named patterns, concrete detail, specific
   cross-references signal higher weight
3. Confidence — clear > raw when content quality is otherwise equal

Default to standard when ambiguous. Sage overrides freely — AI
suggestion is a starting point, not a gate.

Null weight sorts to bottom on all deposit lists (edge case —
weight is always populated at deposit creation).

Multiplier constants (2.0 / 1.0 / 0.5) live in engine schemas and
are not reassigned here.

**Spec authority:** TAGGER SCHEMA.md (DEPOSIT_WEIGHT ASSESSMENT PROMPT),
INTEGRATION DB SCHEMA.md (deposit_weight field definition)

---

### 2.6 ENGINE BASELINE RECALIBRATION + AOS

**Status:** LOCKED
**Audited:** Session 46 (2026-04-10). Items 13 + 15 merged. Two new
system files created: SYSTEM_ AOS.md, AOS SCHEMA.md.

Engine Baseline Recalibration is fully absorbed into the AOS trigger
registry — it is not a separate system. AOS is the unified system.

**Two-layer architecture:**

Signal layer — detection, record creation, integrity hash, delivery
routing. Triggers: engine corpus doubles (2× multiplier threshold),
engine variance exceeds threshold, Sage manual trigger from analytical
surface. Each trigger creates an aos_record with an integrity hash.
Delivery routed by signal_type (immediate for high-signal, daily
digest for lower-signal).

Delivery layer — Gmail OAuth (Larimar → Threshold Studies), Drive
pipeline, APScheduler 11:11 PM daily cron. delivery_error field on
aos_records captures failed delivery attempts. Pulse node is the
fallback when email delivery itself fails (system alert surface, not
email).

AOS records persist permanently. They are not cleared after delivery.

**Spec authority:** SYSTEM_ AOS.md (system overview, ownership
boundaries), AOS SCHEMA.md (full schema, triggers, delivery contract)

---

### 2.9 DEPOSIT GENEALOGY VIEW

**Status:** LOCKED
**Audited:** Session 46 (2026-04-10). Canonical spec: SYSTEM_ Frontend.md.

Read-only lifecycle timeline rendered on deposit card expand. Never
visible on the card face — expand only.

No dedicated table. Assembled at read time from existing tables:
deposits, batch records, engine state, PCV, MTM.

Component: DepositGenealogy

Stage sequence (in order):
  Pearl capture (if applicable) → INT review → deposit creation →
  page routing → engine indexing → pattern contribution →
  finding contribution → hypothesis contribution

Future stages (not yet reached) render grayed out. Click on any
completed stage navigates to its context (e.g., clicking INT review
opens the batch record, clicking a pattern opens the pattern entry).

**Spec authority:** SYSTEM_ Frontend.md — expanded card spec,
DepositGenealogy component, component list

---

### 2.10 ANNOTATION LAYER

**Status:** LOCKED
**Audited:** Session 46 (2026-04-10). Table defined in INTEGRATION DB
SCHEMA.md. Bug fix applied (annotation → note in two files).

Researcher marginalia on any analytical object in the archive.

One table: annotations. Polymorphic reference via annotated_type +
annotated_id. Zero changes to existing schemas — no cascades.

annotated_type enum:
  deposit | finding | hypothesis | void_output | engine_snapshot

Explicitly excluded:
  WSC entries — immutable by architecture. AI-sovereign record.
  AOS records — system records only. Sage-confirmed exclusion.

Visible only in the expanded view of the annotated object. Never
on the card face or list surface. Exportable per page as a research
commentary layer.

**Spec authority:** INTEGRATION DB SCHEMA.md — annotations table

---

### 2.3–2.18 REMAINING SECTIONS (review in progress)

The following sections are pending Sage review. They will be added to
this document as each passes audit:

- ~~UI Architecture Foundation~~ — removed, deferred to master layout doc
- ~~Shared Shell + Navigation Contract~~ — removed, deferred to master layout doc
- ~~Deposit Card Component~~ — locked session 46 (section 2.3)
- ~~Page Load + Empty State~~ — removed, deferred to master layout doc
- ~~Black Pearl Panel Interaction Spec~~ — locked 2026-04-14 (section 2.7)
- ~~Session Schema~~ — locked session 46 (section 2.4 note)
- ~~Instance Context~~ — locked session 46 (section 2.4)
- ~~Deposit Weight AI Suggestion~~ — locked session 46 (section 2.5)
- ~~Observatory Spec~~ — audited clean 2026-04-10, no file changes needed
- ~~Duplicate Prevention on Re-Route~~ — corrected 2026-04-10 (INTEGRATION SCHEMA + DB SCHEMA updated, duplicate_flagged field added)
- ~~Engine Baseline Recalibration~~ — locked session 46, merged into AOS (section 2.6)
- ~~AOS (Automated Observation Signal)~~ — locked session 46 (section 2.6)
- ~~Deposit Genealogy View~~ — locked session 46 (section 2.9)
- ~~Annotation Layer~~ — locked session 46 (section 2.10)
- ~~WSC HOLDING note~~ — recorded below, held for Tier 4
- ~~Pipeline Segment (Tier 2)~~ — locked 2026-04-14 (section 2.8)

**Already categorized — do not transfer:**
- DEAD: Sub-rhythms, Curation panel, Reflective Pearl Constellation,
  Page Identity type system, Page-Type Layout Anatomy, Session Opening
  Ritual, Research Velocity Indicator
- DRIFT: UI Error States (belongs in Pulse)
- HOLD: WSC Design — held for Tier 4 by architecture. WSC depends on
  DNR (Daily Nexus Routine), designed alongside LNV in Tier 4 session.
  Do not design or build until Tier 4. Full WSC schemas exist in
  DESIGN/Systems/Witness_Scroll/ — Tier 4 session will finalize design.

---
---

## TIER 3 — AXIS ENGINES + VEN'AI

**Status:** NOT STARTED (audit not reached)

---

## TIER 4 — MTM + NEXUS + WSC + LNV + VOID ENGINE

**Status:** NOT STARTED (audit not reached)

---

## TIER 5 — COSMOLOGY + ARTIS

**Status:** NOT STARTED (audit not reached)

---

## TIER 6 — RESEARCH ASSISTANT + AUDIO

**Status:** NOT STARTED (audit not reached)

---

## TIER 7 — OBSERVATORY + NOTIFICATIONS + EXPORT

**Status:** NOT STARTED (audit not reached)

---

## TIER 8 — STRESS TEST + SOT

**Status:** NOT STARTED (audit not reached)
