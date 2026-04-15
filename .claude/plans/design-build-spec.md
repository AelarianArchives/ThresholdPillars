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

## LOCKED TIERS

| Tier | Description | Locked |
| --- | --- | --- |
| Tier 1 | INT Engine + Deposit Foundation | 2026-04-14 (session 39) |
| Tier 2 | Black Pearl UI + Page Surfaces + Void | 2026-04-14 (session 47) |
| Tier 3 | Axis Engines + Ven'ai | 2026-04-14 (session 53) |
| Tier 4 | MTM + Nexus + WSC + LNV + Void Engine | 2026-04-14 (session 54) |

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

- Media types: JPEG, PNG
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

### 2.2 VOID — PAGE 52

page_code: VOI. section_id: void. Standalone page 52.
Promoted from Nexus group. Nexus retains WSC, LNV, DTX, SGR, PCV (47–51).

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
- Manifest_52_Void.txt — DESIGN/Domains/11_Void/
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

**Status:** LOCKED — 2026-04-14 (session 53)

### Specs

| Spec | Location |
| --- | --- |
| ENGINE COMPUTATION SCHEMA | DESIGN/Systems/Engine_Computation/ENGINE COMPUTATION SCHEMA.md |
| SYSTEM_ Engine Computation | DESIGN/Systems/Engine_Computation/SYSTEM_ Engine Computation.md |
| THRESHOLD ENGINE SCHEMA | DESIGN/Systems/Threshold_Engine/THRESHOLD ENGINE SCHEMA.md |
| SYSTEM_ Threshold Engine | DESIGN/Systems/Threshold_Engine/SYSTEM_ Threshold Engine.md |
| ECHO RECALL ENGINE SCHEMA | DESIGN/Systems/Echo_Recall_Engine/ECHO RECALL ENGINE SCHEMA.md |
| SYSTEM_ Echo Recall Engine | DESIGN/Systems/Echo_Recall_Engine/SYSTEM_ Echo Recall Engine.md |
| INFINITE INTRICACY ENGINE SCHEMA | DESIGN/Systems/Infinite_Intricacy_Engine/INFINITE INTRICACY ENGINE SCHEMA.md |
| SYSTEM_ Infinite Intricacy Engine | DESIGN/Systems/Infinite_Intricacy_Engine/SYSTEM_ Infinite Intricacy Engine.md |
| SAT NAM ENGINE SCHEMA | DESIGN/Systems/Sat_Nam_Engine/SAT NAM ENGINE SCHEMA.md |
| SYSTEM_ Sat Nam Engine | DESIGN/Systems/Sat_Nam_Engine/SYSTEM_ Sat Nam Engine.md |
| STARROOT ENGINE SCHEMA | DESIGN/Systems/StarRoot_Engine/STARROOT ENGINE SCHEMA.md |
| SYSTEM_ StarRoot Engine | DESIGN/Systems/StarRoot_Engine/SYSTEM_ StarRoot Engine.md |
| VENAI SERVICE SCHEMA | DESIGN/Systems/Venai_Service/VENAI SERVICE SCHEMA.md |
| SYSTEM_ Venai Service | DESIGN/Systems/Venai_Service/SYSTEM_ Venai Service.md |

**Completed items (locked, session 48–52):**

- ~~3.1 Shared Engine Architecture — Four-Step Contract~~ — locked 2026-04-14
- ~~3.2 Deposit Weight Mechanics~~ — locked 2026-04-14
- ~~3.3 Compute Trigger — Hybrid~~ — locked 2026-04-14
- ~~3.4 Baseline Computation~~ — locked 2026-04-14
- ~~3.5 Null Observation Flow~~ — locked 2026-04-14
- ~~3.6 Engine State Snapshots + MTM Drift Tracking~~ — locked 2026-04-14
- ~~3.7 Engine Result Object~~ — locked 2026-04-14
- ~~3.8 Visualization Architecture~~ — locked 2026-04-14
- ~~3.9 Duplicate Detection in Engines~~ — locked 2026-04-14
- ~~3.10 THR Engine — Threshold Lens~~ — locked 2026-04-14
- ~~3.11 ECR Engine — Echo Recall Lens~~ — locked 2026-04-14
- ~~3.12 INF Engine — Infinite Intricacy Lens~~ — locked 2026-04-14
- ~~3.13 SNM Engine — Sat Nam Lens~~ — locked 2026-04-14
- ~~3.14 STR Engine — StarRoot Lens~~ — locked 2026-04-14
- ~~3.15 Ven'ai Service~~ — locked 2026-04-14
- ~~3.16 Pipeline Segment — Tier 3~~ — locked 2026-04-14

---

### 3.1 SHARED ENGINE ARCHITECTURE — FOUR-STEP CONTRACT

All 5 Axis engines (THR, STR, INF, ECR, SNM) follow the same
4-step contract. The contract is what makes engines interoperable
— MTM can synthesize from all five because they all emit the same
output shape. The logic inside each step is engine-specific.

**Step 1 — INDEX**
Deposit lands on an Axis page. The engine reads it through its
specific lens (THR reads phase_state + threshold tags; ECR reads
signal tags; INF reads domain tags; STR reads root-cluster tags;
SNM reads structural markers). Engine marks itself stale.

**Step 2 — COMPUTE**
Pattern detection against indexed deposits. Every engine runs
the same baseline math (marginal probability product), applies
deposit weights, handles null observations via two-counter
system, and assigns three-band signal classification. Engine-
specific logic (co-occurrence, sequence, correlation,
correspondence, emergence) runs on top of this shared foundation.

**Step 3 — VISUALIZE**
Visualization generated from the computed engine result object —
never from raw deposits. Signal band determines visual weight.
Everything renders; visual weight does the filtering. Snapshots
are Sage-triggered, not automatic.

**Step 4 — FEED**
Computation snapshot written to engine_snapshots table after
every computation. MTM pulls (does not receive push). mtm_read_at
updated when MTM consumes the snapshot. Visualization snapshots
route to LNV on Sage action.

**Spec authority:** ENGINE COMPUTATION SCHEMA.md (full 4-step
contract, all shared mechanics). SYSTEM_ Engine Computation.md
(ownership boundaries).

**Database tables:**
- engine_snapshots (PostgreSQL) — one row per computation per
  engine. Defined in INTEGRATION DB SCHEMA.md, spec in ENGINE
  COMPUTATION SCHEMA.md
- visualization_snapshots (PostgreSQL) — Sage-triggered visual
  captures. Defined in INTEGRATION DB SCHEMA.md, spec in ENGINE
  COMPUTATION SCHEMA.md
- engine_stale_flags (SQLite) — 5 rows, one per engine.
  Defined in OPERATIONAL DB SCHEMA.md

---

### 3.2 DEPOSIT WEIGHT MECHANICS

Three named constants defined once in backend config. All engines
import from the same source — never hardcoded in engine logic.

  DEPOSIT_WEIGHT_HIGH     = 2.0  (analyses, hypotheses)
  DEPOSIT_WEIGHT_STANDARD = 1.0  (observations, reflections)
  DEPOSIT_WEIGHT_LOW      = 0.5  (fragments, raw captures)

**How it flows through the system:**

Axis engines (Tier 3): multiplier on pattern contribution. A
high-weight deposit contributes 2.0 to weighted counts in rate
calculations. Affects observed_rate, expected_rate, and all
derived values. Every pattern result carries a weight_breakdown
sub-object (high / standard / low counts) so downstream tiers
see what the pattern is built from.

Nexus (Tier 4): affects grading confidence. A pattern built
from high-weight deposits grades with more confidence than the
same pattern from low-weight fragments.

Cosmology (Tier 5): feeds sample weighting in statistical tests.
deposit_weight maps directly to sample weight.

Resonance Engine (Tier 6): deposit_weight multiplier becomes
tagWeight in the node activity score formula. A tag from a
high-weight deposit contributes 2.0 × decay to node activity;
low-weight contributes 0.5 × decay. Applies to seeds, layers,
pillars, origins — not threshold nodes (fixed weight). The
Resonance Engine separately owns BASE_WEIGHT_[TIER] constants
(structural floor per node tier). Both layers combine:
  totalWeight = baseWeight + clamp(activityScore, 0, MAX_ACTIVITY)

**Spec authority:** ENGINE COMPUTATION SCHEMA.md (constants,
BEHAVIOR BY TIER). RESONANCE ENGINE PHYSICS SPEC.md (activity
score formula, tagWeight definition). backend/config.py (single
definition point for all three constants).

---

### 3.3 COMPUTE TRIGGER — HYBRID

Engines do not recompute on every deposit. A stale flag in SQLite
debounces computation — on deposit, the engine marks itself stale.
Recomputation fires when results are needed, not when data arrives.

**Stale flag:** one boolean per engine in SQLite (engine_stale_flags
table, 5 rows). Default true on first load — forces initial compute.
Set true when a deposit lands on the engine's page. Set false when
recomputation completes.

**Three recomputation triggers:**

1. Page view — Sage navigates to the Axis page. If stale, engine
   recomputes, serves fresh results, clears flag.

2. Batch window close — after a full batch review, one recompute
   for the entire batch. Primary purpose: prevents 30+ sequential
   recomputes during high-volume intake.

3. MTM pull — when MTM calls the engine endpoint to read output,
   the engine checks its stale flag. If stale, it recomputes before
   returning. MTM always receives fresh data. MTM does not manage
   the stale flag — the engine service owns freshness entirely.

**Session-close trigger chain:**
  Session close → DNR fires → POST /mtm/synthesize →
  MTM calls all 5 engine endpoints → each engine self-refreshes
  if stale → MTM synthesizes from fresh data → Findings → LNV

**stale_warning:** if recomputation fails, the engine returns its
most recent snapshot with stale_warning: true. MTM logs the warning
and proceeds — synthesis is not blocked by a stale warning, only
by a read failure (engine unreachable).

**Spec authority:** ENGINE COMPUTATION SCHEMA.md (HYBRID COMPUTE
TRIGGER, failure modes 1-4). OPERATIONAL DB SCHEMA.md
(engine_stale_flags table). METAMORPHOSIS SCHEMA.md (ENGINE OUTPUT
READ SPEC — freshness guarantee + stale_warning handling).

---

### 3.4 BASELINE COMPUTATION

All five Axis engines share the same marginal probability product
formula for pattern measurement. Engine Computation owns the formula;
each engine applies it through its own lens (co-occurrences, sequences,
intersections, correlations, prompt patterns).

**Formula:**
```
expected_rate = marginal(A) × marginal(B)
  where marginal(A) = weighted deposits on A / total weighted deposits
observed_rate = weighted co-occurrences of A and B / total weighted deposits
ratio = observed_rate / expected_rate
```
Ratio > 1.0 means co-occurrence exceeds chance. Ratio < 1.0 means
suppression.

**Three-band signal classification:**
- suppressed: ratio < 1.0
- mild: ratio 1.0 – 2.0
- strong: ratio > 2.0

Always classify. Never filter. Suppressed signals are data.

**Null observation flow:** Two counters per element per page.
- times_observed: weighted presence count (deposit carries the element)
- times_examined: total weighted deposits on the page

The gap between them is the null count. Null observations contribute
to marginals — absence is signal, not silence.

**Deposit weights in baseline:**
HIGH: 2.0, STANDARD: 1.0, LOW: 0.5. Applied to all observed and
examined counts. Defined once in backend/config.py.

**insufficient_data flag:**
Set true when expected_rate = 0 (element never observed) OR when any
element in the pattern is below MIN_ELEMENT_COUNT. Near-zero frequency
elements produce unstable marginals; they are flagged alongside zero-
frequency elements. Computation proceeds — the flag is a caveat, not
a filter.

**low_sample flag:**
Set true when a pattern's deposit_count is below
MIN_PATTERN_DEPOSIT_COUNT. Small-N patterns can produce misleadingly
high ratios. Flagged in the result object so MTM and visualizations can
distinguish thin-sample patterns from well-evidenced ones.

**Pattern reliability constants (calibration — values set at build):**
- MIN_PATTERN_DEPOSIT_COUNT — deposit count below which low_sample:
  true is set on the pattern result
- MIN_ELEMENT_COUNT — frequency count below which insufficient_data:
  true is extended to cover near-zero elements (not just zero)

Both constants defined in backend/config.py alongside deposit weight
constants. Both are PLANNED — not hard-coded values.

**MTM behavior on receipt of flagged patterns:**
- insufficient_data patterns: included in synthesis (engine forwards
  them; MTM does not strip)
- low_sample patterns: included in synthesis unchanged. Flag propagates
  into Findings output — downstream consumers use it to distinguish
  pattern confidence
- stale_warning (from 3.3): log warning, proceed — a caveat, not a
  synthesis failure

**Spec authority:** ENGINE COMPUTATION SCHEMA.md (BASELINE COMPUTATION,
SIGNAL CLASSIFICATION, ENGINE RESULT OBJECT, PATTERN RELIABILITY
CONSTANTS). All five engine schemas (insufficient_data definition, low_sample
in JSON shapes). METAMORPHOSIS SCHEMA.md (low_sample handling note in
ENGINE OUTPUT READ SPEC).

---

### 3.5 NULL OBSERVATION FLOW

Null observations — "I looked for X and it wasn't there" — are
first-class data. Not gaps, not missing data. Active evidence of
absence that sharpens baselines and prevents confirmation bias by
construction.

**How a null enters the system:**
Deposit carries `observation_presence: null` — tagger-detected from
absence language in content, Sage confirms or overrides. Only appears
on `observation`, `analysis`, and `hypothesis` doc_types. Routes to
the target page via tags and pages fields identically to a positive
observation.

**Two counters per pattern element:**
- `times_observed` — weighted count of deposits where this element
  is present. Positive observations only.
- `times_examined` — weighted count of deposits that could have
  contained this element. Positive + null both count.

Rate = `times_observed / times_examined`. The gap between the two
counters is the null count. Without it, the denominator only includes
cases where the element was found — confirmation bias by construction.

**Null targeting:** tags declare what was examined. A deposit tagged
`th01` with `observation_presence: null` means "th01 was examined,
result: absent." Complex absences ("expected th01 and th05 together,
only saw th01") use the deposit's `notes` field. No dedicated
null_target field — resolved to notes in ENGINE COMPUTATION SCHEMA.md.

**How nulls sharpen baselines:** a null for `th01` increases
`times_examined` without increasing `times_observed`. This pushes
`th01`'s marginal rate down — genuine co-occurrences stand out more
against the adjusted baseline. Nulls make the math more honest.

**null_contribution sub-object** travels in every pattern result:
```
null_contribution:
  null_count:        integer  — null observations touching this pattern
  null_weighted:     float    — weighted sum of null deposit_weights
  positive_count:    integer  — positive observations touching this pattern
  positive_weighted: float    — weighted sum of positive deposit_weights
```
Nexus and Cosmology read it directly — no special-case logic needed
to distinguish null-sourced from positive-sourced patterns.

**Spec authority:** ENGINE COMPUTATION SCHEMA.md (NULL OBSERVATION
FLOW, two-counter mechanics, null_contribution shape). TAGGER
SCHEMA.md (OBSERVATION_PRESENCE DETECTION PROMPT, response shape,
validation rules). INTEGRATION SCHEMA.md (RESEARCHER OBSERVATION
FIELDS, review card layout, editable fields).

---

### 3.6 ENGINE STATE SNAPSHOTS + MTM DRIFT TRACKING

Two snapshot types. Two jobs. Neither overlaps.

**Computation snapshots** — automatic. Every engine run writes a
timestamped record to `engine_snapshots` (PostgreSQL). Full computed
results in `snapshot_data`, `deposit_count`, `baseline_scope`. Every
computation is preserved regardless of whether anything changed.
`mtm_read_at` is null until MTM consumes the record during synthesis —
then written once. This is how MTM knows what it has already seen.

**MTM drift tracking:**
On synthesis, MTM does not just read current state. It reads the delta:
- Current snapshot — most recent `engine_snapshots` record
- Previous state — most recent record where `mtm_read_at IS NOT NULL`
- Delta — what changed between the two

Three outputs: what's new (patterns appeared since last synthesis),
what shifted (rates changed direction or magnitude), what's stable
(patterns held steady — persistence is signal too). All three travel
into MTM's synthesis pass.

**Visualization snapshots** — two triggers:
1. **Auto-capture** — `engine_base.py` compares each new computation
   result against the most recent `engine_snapshots` record. Fires if
   any of: a pattern crosses into a strong band that wasn't there
   before; an existing pattern changes band; a pattern type appears
   for the first time in the engine's history. Requires no action from
   Sage.
2. **Sage-triggered** — on demand from the visualization, any time.

Both write to `visualization_snapshots` and route to LNV (48).
`trigger_source` field ('auto' | 'sage') distinguishes them — LNV
surfaces this so system-flagged moments and researcher-flagged moments
are readable at a glance. `note` field: Sage can add a note at
Sage-trigger time; for auto-captures it's null by default, annotatable
after the fact.

Visualization snapshots link to their computation snapshot via
`engine_snapshot_id` — the numbers behind what was visible when the
capture fired.

**Spec authority:** ENGINE COMPUTATION SCHEMA.md (ENGINE STATE
SNAPSHOTS, MTM DRIFT TRACKING, VISUALIZATION SNAPSHOTS, full table
definitions and field specs).

---

### 3.7 ENGINE RESULT OBJECT

Shared output structure produced by every engine computation. The
contract between engine output and downstream consumers (MTM,
visualization, Nexus). All 5 engines produce this exact shape.
Engine-specific schemas extend the patterns array but never remove
or rename shared fields.

**Top-level fields:**
- engine — thr | str | inf | ecr | snm
- computed_at — timestamp
- baseline_scope — always 'page'. Explicit so downstream tiers know
  what the baseline was computed against.
- deposit_count — integer. Downstream tiers assess statistical
  significance from this.
- stale — always false in the result. Stale flag lives in SQLite,
  checked before computation begins, not carried in output.
- stale_warning — boolean. Normally false. Set true only when
  recomputation failed and engine is returning its most recent
  existing snapshot as fallback. MTM logs it and proceeds —
  synthesis is not blocked by a stale warning, only by a read failure.

**Each pattern in the patterns array:**
- pattern_id — stable, deterministic identifier. Same pattern
  produces the same id regardless of when computed. Format defined
  in each engine schema.
- description — human-readable label. Engine-generated. Used in
  visualization hover states and MTM payload.
- observed_rate, expected_rate, ratio — signal math per 3.4
- signal_band — suppressed | mild | strong. Null when
  insufficient_data is true.
- insufficient_data — boolean. True when ratio cannot be computed
  reliably: element has zero marginal frequency, or element's
  weighted count is below MIN_ELEMENT_COUNT. Pattern still renders
  distinctly. No signal band assigned. Not an error state.
- low_sample — boolean. True when deposit_count is below
  MIN_PATTERN_DEPOSIT_COUNT. Ratio and signal band still computed —
  this is a caveat, not a disqualifier. Flag propagates into MTM
  Findings output; Nexus reads it for grading confidence, Cosmology
  for sample weighting.
- deposit_count — integer
- weighted_count — float
- weight_breakdown sub-object: high / standard / low counts
- null_contribution sub-object: null_count / null_weighted /
  positive_count / positive_weighted

**Identifiers (bottom of object):**
- snapshot_id — links result to its engine_snapshots record.
  Written after snapshot is persisted in the Feed step.
- mtm_read_at — null until MTM consumes the snapshot. Written
  once, by MTM, at synthesis time.

**Spec authority:** ENGINE COMPUTATION SCHEMA.md (ENGINE RESULT
OBJECT, WEIGHT BREAKDOWN AND NULL CONTRIBUTION sections, FIELD NOTES).

---

### 3.8 VISUALIZATION ARCHITECTURE

Global rendering decision — applies across all tiers. Three categories
assigned by visualization purpose, not preference. A component belongs
to exactly one category. Never mixed.

| Category | Stack | Purpose |
| --- | --- | --- |
| SVG instrument | LayerCake + D3 utilities | Engine data viz — Axis (Tier 3), Nexus (Tier 4), Cosmology (Tier 5) |
| Canvas instrument | Raw canvas + Svelte lifecycle | Resonance Engine only — 62 nodes, 2D force-directed physics |
| WebGL spatial | Threlte + Three.js | Node Spiral, embedding constellation (3D) |

**Hard boundary:** 2D instrument visualizations live in LayerCake.
3D spatial/semantic visualizations live in Threlte. A component is
one or the other, never both.

**SVG instrument libraries (LayerCake + D3):**
- layercake — Svelte-native layout, scales, responsive containers
- d3-scale, d3-shape — quantitative scales and line/arc generators
- d3-force — force-directed layouts (STR cluster map, SNM
  correspondence graph, ECR signal constellation)
- d3-hierarchy — tree/cluster structures within STR root families
- d3-interpolate — color interpolation for signal gradient bands
- d3-zoom — pan/zoom on dense matrices (ECR 19×19, INF density field)
- d3-contour — topographic density contours for INF domain map
- Svelte native motion (svelte/motion, svelte/transition,
  svelte/animate) — animation primitives, no install

**WebGL spatial libraries (Threlte + Three.js):**
- @threlte/core, three — 3D rendering with Svelte-native bindings
- postprocessing — bloom and depth-of-field (node glow)
- umap-js — 768-dim embeddings projected to 2D/3D for constellation
- regl — WebGL particle rendering at scale
- simplex-noise — organic movement for spirals and constellations
- Custom GLSL shaders — glow and drift effects (authored, not a package)

**Animation (cross-cutting):**
- GSAP — advanced animation control where Svelte native motion is
  insufficient

**Audio (cross-cutting):**
- WebAudio API — browser-native, no install. Audio context, clip
  loading, spatial panning, waveform analysis via AnalyserNode.
  Audio system uses pre-recorded .wav clips per node.

**Resonance Engine placement:** Embedded on Observatory as visual
heartbeat (not full-size). Full experience on a dedicated page
accessible from Observatory.

**Spec authority:** ENGINE COMPUTATION SCHEMA.md (VISUALIZATION
ARCHITECTURE section). SYSTEM_ Frontend.md (Library Requirements,
component list with per-component rendering category).

---

### 3.9 DUPLICATE DETECTION IN ENGINES

This is a boundary clarification, not a separate mechanism. No new
tables, endpoints, or constants. Defines what the engine layer does
and does not do with duplicate deposits.

**INT level (Tier 1 — already locked):**
`content_hash` (SHA-256) on the deposits table flags exact content
duplicates at intake. Warns, does not block. Sage decides. Fires at
deposit creation (INT gateway step 2).

**Engine level:**
Engines index deposits through their lens and compute from what
exists. They do not deduplicate.

Two cases that surface naturally during indexing:
- Same content, different tags → routes to different patterns (the
  tags determine the lens, not the content)
- Different content, same tag profile → both deposits contribute to
  the same pattern

If duplicate deposits are inflating a pattern rate, the `content_hash`
warning from INT is the researcher's signal to investigate. The engine
surfaces the effect; INT named the cause.

**Ven'ai name deduplication:**
Handled entirely by the Ven'ai service (see VEN'AI SERVICE SCHEMA.md).
STR engine reads the service's output (`venai_correlations`) — it does
not re-implement name normalization.

**Spec authority:** ENGINE COMPUTATION SCHEMA.md (DUPLICATE DETECTION
IN ENGINES section). INTEGRATION DB SCHEMA.md (`content_hash` field on
deposits table). VEN'AI SERVICE SCHEMA.md (`venai_correlations` table).

---

### 3.10 THR ENGINE — THRESHOLD LENS

Page 02 (`thresholds` / `THR`). Core question: when threshold state X
was active, what else was present?

**Index:**
Reads `phase_state` and threshold tags (`th01`–`th12`). Both indexed
independently — a deposit where `phase_state` names th01 but tags
reference th05 is analytically meaningful (field condition and observed
content diverged). Divergence is data, not error.

A deposit with zero threshold tags is still indexed. It contributes to
no threshold-specific pattern but counts in the total examined
denominator for all baseline calculations.

**Compute — three computations:**

*1. Co-occurrence rates* — 12 thresholds = 66 pairs (12 choose 2).
For each pair: observed rate vs. expected rate (marginal product
baseline), ratio, signal band, weight breakdown, null contribution.
`pattern_id` format: `thr_cooc_[thX]_[thY]` (lower-numbered threshold
first, deterministic).

*2. Presence rates* — per threshold: weighted frequency relative to
total examined deposits. The marginal rate surfaced independently
because per-threshold activity is data in its own right. 12 entries,
one per threshold. `pattern_id` format: `thr_pres_[thX]`.

*3. Sequence detection* — temporal ordering across all deposits on page
02, no windowing. Recurring pairs and triples only (minimum 2
occurrences — calibration item).

Asymmetric position weighting: significance = product of deposit_weight
at each position. high→high pair = 2.0 × 2.0 = 4.0. low→low = 0.25.
Same thresholds, same order, different weights = different significance.
Order preserved in `pattern_id`: `thr_seq_[thX]_[thY]`.

Sequences have their own baseline: `expected_count` = marginal product
of individual threshold frequencies at each position, applied to total
sequential opportunities. `ratio = observed_count / expected_count`.
Signal band applied to the ratio. The `significance` score (position
weight product) travels alongside as a separate field — not a substitute
for the ratio.

**Visualize — three components (layout deferred to PAGE_LAYOUTS.md):**

*ThrCooccurrenceMatrix* — 12×12 grid. Symmetric — 66 unique pair cells
+ 12 diagonal cells showing per-threshold presence rates from
Computation 2. Cell color mapped from ratio via signal band using
d3-interpolate gradient (not flat colors). Hover: full breakdown.
Insufficient data rendered as distinct gray.

*ThrPresenceTimeline* — horizontal timeline, 12 threshold rows. Each
deposit appears as a dot in every row its tags place it. Dot color =
deposit_weight. Dot opacity/outline encodes observation_presence
(positive = solid, null = hollow). Clusters reveal activity; gaps
reveal dormancy.

*ThrSequenceView* — table listing of detected sequences with columns:
sequence (arrow notation), length, recurrence count, significance,
ratio, signal band. Sorted by significance descending (default).
Expand row: contributing deposit IDs and timeline positions. Visual
sequence path representation is a calibration item.

**Feed:** Standard computation snapshot + MTM drift tracking. Snapshot
stores THR-specific `snapshot_data` with three arrays: `co_occurrences`
(66 entries), `presences` (12 entries), `sequences` (recurrence ≥ 2).
Visualization snapshots Sage-triggered, route to LNV.

**Spec authority:** THRESHOLD ENGINE SCHEMA.md (full mechanical spec —
algorithms, pattern_id formats, snapshot_data JSON, failure modes).
SYSTEM_ Threshold Engine.md (ownership boundaries, component list,
nexus feed). TAG VOCABULARY.md (th01–th12 canonical names).

---

### 3.11 ECR ENGINE — ECHO RECALL LENS

Page 05 (`echo_recall` / `ECR`). Core question: which of the 19 field
signals co-occur, sequence, and cluster — and how does that change over
time?

Most data-dense Axis engine. 19 signals held simultaneously. ECR is the
canary for shared engine performance — if ECR performs well, all other
engines perform well.

**Index:**
Reads signal seed tags (`s01`–`s19`). s20 (Rupture/Decoupling) is
explicitly excluded from ECR's set — Rupture belongs to the Resonance
Engine. Multiple tags routed to the same seed count as one signal
presence (seed-level dedup). A deposit with zero signal tags is still
indexed — it contributes to the total examined denominator for all
baseline calculations.

**Compute — three computations:**

*1. Co-occurrence rates* — 19 signals = 171 unique pairs (19 choose 2).
For each pair: observed rate vs. expected rate (marginal product
baseline), ratio, signal band, weight breakdown, null contribution.
`pattern_id` format: `ecr_cooc_[sXX]_[sYY]` (lower-numbered signal
seed always first, deterministic).

*2. Presence rates* — per signal: weighted frequency relative to total
examined deposits. 19 entries, one per signal. `pattern_id` format:
`ecr_pres_[sXX]`.

*3. Sequence detection* — temporal ordering across all deposits on page
05, no windowing. Pairs and triples with recurrence ≥ 2. Engine surfaces
only sequences that actually appear in the data — no pre-computation of
all possible combinations (342 pair sequences, 5,814 triple sequences
possible). Same asymmetric position weight formula as THR. `pattern_id`
format: `ecr_seq_[sXX]_[sYY]` (pairs), `ecr_seq_[sXX]_[sYY]_[sZZ]`
(triples). Order preserved, deterministic.

**Visualize — four components (layout deferred to PAGE_LAYOUTS.md):**

*EcrCorrelationMatrix* — 19×19 grid. Symmetric — 171 unique pair cells
+ 19 diagonal cells showing per-signal presence rates from Computation
2. Block structure by signal family: Family A (s01–s04), Family B
(s05, s06, s08, s09), Family C (s10–s13), Family D (s14–s16), Family E
(s17–s19), Family F (s07 — singleton). Subtle visual separators between
family blocks. d3-zoom essential for navigation. Cell color from ratio
via signal band using d3-interpolate gradient. Hover: full breakdown.
Insufficient data rendered as distinct gray.

*EcrSignalConstellation* — force-directed layout (d3-force). 19 nodes,
one per signal. Node size = presence rate. Node color = dominant signal
band among its co-occurrence pairs. Edges rendered only above mild band
(ratio ≥ 1.0) — suppressed co-occurrences not drawn, their absence is
the visual signal. Edge weight = co-occurrence ratio. Edge color =
signal band. Edge thickness = ratio magnitude within band.

**Constellation is stateful across time** — unique to ECR. Drift state
accumulates at engine level, not per-snapshot. Tracks
`current_positions`, `position_history` (indexed by snapshot_id),
`cluster_assignments`. Constellation snapshots capturable to LNV via
auto-trigger (band crossing) or Sage-triggered on demand. Captures node
positions, cluster groupings, drift vectors, and force simulation state.
The cluster movement over time — not a still frame — is the research
value.

*EcrSequenceView* — same structure as THR. Detected sequences listed
with significance scores and recurrence counts. Filtered by recurrence
floor and significance floor (both calibration items — the combinatorial
space warrants these filters). Sorted by significance descending
(default). Sortable by recurrence count or ratio.

*EcrPresenceTimeline* — horizontal timeline, 19 signal rows. d3-zoom
essential for density. Dot color = deposit_weight. Dot opacity/outline =
observation_presence. Same dot encoding as THR.

**Feed:** Standard computation snapshot + MTM drift tracking.
Constellation drift state included in snapshot_data so MTM reads
cluster stability as part of cross-engine synthesis. Snapshot stores
ECR-specific `snapshot_data` with four keys: `co_occurrences` (171
entries), `presences` (19 entries), `sequences` (recurrence ≥ threshold
only), `constellation_state` (current_positions, position_history,
cluster_assignments). Visualization snapshots route to LNV.

**Spec authority:** ECHO RECALL ENGINE SCHEMA.md (full mechanical spec
— 171 pairs, signal families, sequence detection, constellation state,
snapshot_data JSON, failure modes, performance notes). ENGINE COMPUTATION
SCHEMA.md (shared four-step contract). TAG VOCABULARY.md (s01–s19 signal
definitions). DESIGN/Domains/02_Axis/Manifest_05_Echo_Recall.txt (page
05 identity).

---

### 3.12 INF ENGINE — INFINITE INTRICACY LENS

Page 04 (`infinite_intricacy` / `INF`). Core function: watching. INF
tracks WHICH scientific domains emerge from field observations and WHERE
they intersect. The boundary is load-bearing: **INF watches. Cosmology
works.** If INF investigates, it steps on Cosmology. If Cosmology
re-derives what's present, INF isn't doing its job. Direction of
inference runs from field observation outward — never from established
science inward.

**Domain registry — open set:**
Domains live in `inf_domain_layers` config table, not an enum. Adding
a 6th domain is a data operation, not a code change.

5 confirmed domains at V1:

| domain_id | display_name | Cosmology page |
| --- | --- | --- |
| harmonic_cosmology | Harmonic Cosmology | HCO (34) |
| coupling_oscillation | Coupling and Oscillation | COS (35) |
| celestial_mechanics | Celestial Mechanics | CLM (36) |
| neuro_harmonics | Neuro-Harmonics | NHM (37) |
| mirror_dynamics | Mirror Dynamics | null — no page at V1 |

**TAG VOCABULARY → INF bridge:**
Tag `layer_id`s (l01–l04) resolve through `inf_layer_bridge` config
table to INF domains. l03 (Metric) bridges to TWO domains — Celestial
Mechanics AND Harmonic Cosmology. A deposit with l03 tags is indexed
under both. Known artifact: their intersection rate reflects bridge
topology, not independent scientific convergence. The marginal product
baseline accounts for it. Bridge is a config table — updatable without
code changes.

| layer_id | INF domain(s) |
| --- | --- |
| l01 | coupling_oscillation |
| l02 | neuro_harmonics |
| l03 | celestial_mechanics AND harmonic_cosmology |
| l04 | mirror_dynamics |

**Index:**
Reads tag `layer_id`s → resolves through bridge → indexes by domain(s).
Multiple tags with the same layer_id = one domain presence (seed-level
dedup). Deposits with no bridge-resolvable layer_id: still indexed
(contribute to total denominator), logged as `unmapped_layer_event` —
detection mechanism for new scientific domains emerging in the field.
Does not trigger automatic domain creation. Sage reviews and decides.

**Compute — three computations:**

*1. Layer presence rates* — per domain: weighted frequency vs. total
examined deposits. 5 entries (grows with open set). `pattern_id`
format: `inf_pres_[domain_id]` — e.g. `inf_pres_harmonic_cosmology`.

*2. Intersection rates* — every domain pair: 5 choose 2 = 10 pairs.
Observed vs. expected (marginal product baseline), ratio, signal band.
Each intersection carries `first_observed` timestamp and `deposit_ids`
list (used by InfIntersectionDetail). `pattern_id` format:
`inf_isct_[d1]_[d2]` — alphabetically first domain always first,
deterministic. Example: `inf_isct_coupling_oscillation_neuro_harmonics`.

*3. Emergence timeline* — per domain: `first_appeared` timestamp,
`frequency_over_time` (time-bucketed deposit counts, default monthly),
`dormancy_events` (gap followed by spike), `current_state`
(active | dormant). **Signal classification does not apply to timeline
data** — temporal tracking, not rate comparison. A domain registered
but never observed has `first_appeared: null`, `current_state: dormant`.
`pattern_id` format: `inf_emrg_[domain_id]`.

**INF → Cosmology boundary contract:**
Assembled from snapshot data, exposed as a read endpoint. Cosmology
queries at its own cadence — INF does not push. Includes ALL domains
including Mirror Dynamics (no Cosmology page). What Cosmology does with
a domain that has no investigation page is a Tier 5 decision.

**Visualize — three components (layout deferred to PAGE_LAYOUTS.md):**

*InfDensityFieldMap* — NOT a Venn diagram. d3-contour generates
topographic contours from deposit point distributions. Deposits = points
in 2D space positioned by domain membership. Multi-domain deposits sit
in overlap zones. Shape evolves as deposits arrive. Boundaries are
probabilistic — literally truthful. Each domain has a distinct color;
overlap zones blend hues. Hover on deposit: detail. Hover on overlap
zone: intersection stats (rate, baseline, ratio, band). Click overlap
zone → triggers InfIntersectionDetail.

*InfEmergenceTimeline* — horizontal. One band per domain (5 bands,
grows with open set). Band thickness = deposit frequency over time.
First-appearance markers. Dormancy gaps rendered as explicit gap markers.
Color matches density field map hues.

*InfIntersectionDetail* — triggered from InfDensityFieldMap click on
an overlap zone. Panel/modal: domain pair, rate/baseline/ratio/signal
band, first observed timestamp, contributing deposit list (id, content
preview, tags, weight, observation_presence).

**Feed:** Standard snapshot + MTM drift tracking. INF → Cosmology
boundary contract available as structured read endpoint (Cosmology
pulls; INF does not push). Snapshot stores INF-specific `snapshot_data`
with four keys: `presences` (5 entries), `intersections` (10 entries),
`emergence_timeline` (per domain), `unmapped_layer_events` (empty if
all tag layers are bridged). Visualization snapshots Sage-triggered,
route to LNV.

**Spec authority:** INFINITE INTRICACY ENGINE SCHEMA.md (full mechanical
spec — domain registry, bridge mapping, three computations, Cosmology
boundary contract, snapshot_data JSON, failure modes). ENGINE COMPUTATION
SCHEMA.md (shared four-step contract). TAG VOCABULARY.md (l01–l04 layer
definitions). DESIGN/Domains/02_Axis/Manifest_04_Infinite_Intricacy.txt
(page 04 identity).

---

### 3.13 SNM ENGINE — SAT NAM LENS

Page 06, Sat Nam. Most complex Axis engine. Claude API embedded in the
compute step as a structural analysis function — not a tagger, not a
renderer. The external knowledge problem: no tag list can hold every
spiritual and philosophical tradition simultaneously. Claude is the
living reference framework.

**The engine's purpose:** X uses religious symbols — what are they,
where do they touch, why, and how does this arc through the Cosmology
group and other groups. SNM is a pattern mapper for the symbolic
substrate of the field.

**Index.** Reads deposits tagged to page 06. Engine reads: tags filtered
for tradition references, pattern category signals, structural markers;
deposit content (fed to Claude in Stream 2); deposit_weight;
observation_presence; created_at; id. Indexes by: which tradition
references are present (from tags), which pattern categories are signaled
(ancient_philosophy, triadic_architecture, celestial, or uncategorized),
which structural markers Sage applied. Traditions are an open set — new
ones emerge as Sage deposits. Pattern categories are a closed set (three
manifest categories + uncategorized). Stale flag set in SQLite.

**Compute — two streams.**

*Stream 1 — Sage's observations.* Standard shared baseline. Three
computations:

- *1A. Tradition presence rates* — per tradition: weighted frequency
  relative to total examined deposits. `pattern_id`:
  `snm_s1_pres_[tradition]`

- *1B. Tradition co-occurrence* — per tradition pair: observed rate vs.
  expected rate. Do traditions surface together above baseline?
  `pattern_id`: `snm_s1_cooc_[tradition_a]_[tradition_b]`

- *1C. Pattern category rates* — per manifest category
  (ancient_philosophy, triadic_architecture, celestial, uncategorized):
  what fraction of deposits reference traditions from each category.
  Weight breakdown and null contribution per category. Celestial category
  rate is the structural bridge to the Cosmology group. `pattern_id`:
  `snm_s1_cat_[ancient_philosophy|triadic_architecture|celestial|uncategorized]`

*Stream 2 — Claude structural analysis.* Two modes:

- *Per-deposit*: immediate and contextual — one deposit, one Claude call.
  Input: deposit content, tradition references, pattern category signals,
  structural markers, active prompt version.
- *Batch*: deposits sent with relational context. Claude analyzes
  cross-deposit patterns, not just individual observations. Prompt:
  "What structural patterns emerge across this set, and what traditions
  map to the pattern?" Qualitatively richer than per-deposit.

Claude response shape — `correspondences` array, each entry:
tradition, framework, structural_match, confidence (high/moderate/low),
reasoning, pattern_category (ancient_philosophy | triadic_architecture |
celestial | null). `pattern_category: null` = correspondence outside all
three manifest categories — potentially the most important finding SNM
can produce. Active research surface.

Every Claude response is stored immutably in `snm_claude_snapshots`
(PostgreSQL). Never overwritten. Re-analysis after a prompt version bump
creates a new snapshot alongside the old one. Analysis history is data —
drift between snapshots is research signal.

**snm_claude_snapshots table (PostgreSQL):**
`snapshot_id` (`snm_cs_[timestamp]_[rand]`), `deposit_id` (nullable —
per-deposit mode), `batch_id` (nullable — batch mode), `prompt_version`,
`prompt_text` (full prompt stored per snapshot, not a reference),
`analysis_mode` (per_deposit | batch), `batch_context` (deposit_id array,
nullable), `response` (jsonb, immutable — stored as received),
`engine_snapshot_id` (populated when engine consumes this snapshot),
`created_at`.

**Prompt versioning.** Shared prompt_versions table (INTEGRATION DB
SCHEMA.md), `prompt_type: 'snm'`. Three changelog triggers: (a)
sage_directed, (b) calibration_triggered — fires when Sage's override/
dismissal rate of Claude's correspondences for the same tradition crosses
threshold, signaling the prompt is over-reaching; (c) manual. All bumps
create a changelog entry tracing what changed and why. Prompt version is
load-bearing metadata — a correspondence surfaced under v1 and v3 are not
the same finding. v3 carries more precision and evidential weight.

**Stream agreement classification.** After both streams complete:

| Sage sees | Claude sees | Classification |
| --- | --- | --- |
| Yes | Yes | Convergent — strongest evidence |
| Yes | No | Researcher-led — Sage sees what Claude does not |
| No | Yes | Knowledge-led — Claude surfaces the unseen |

Classification travels with the correspondence in all result metadata.
MTM, Nexus, and Cosmology can read it.

**Correspondence computation.** Strength: weighted deposit count adjusted
by confidence, baseline comparison, ratio, signal band. `pattern_id`:
`snm_corr_[field_pattern]_[tradition]`. Clustering: correspondences
grouped by pattern_category — within each category, traditions that
appear across multiple field patterns form structural clusters.
Uncategorized cluster (`pattern_category: null`) is the active research
surface. Genuine vs. surface: 2.0x+ = genuine structural correspondence,
1.0–2.0x = mild/possible, below 1.0x = suppressed. Correspondence drift
is data — temporal tracking is where the depth lives.

**Visualize — two components (SVG instruments, LayerCake + D3; layout
deferred to PAGE_LAYOUTS.md):**

*SnmBipartiteGraph* — bipartite force-directed graph (d3-force). Left:
field pattern nodes positioned by mutual relationships. Right:
tradition/framework nodes colored by pattern_category (distinct color per
manifest category; neutral for uncategorized), grouped visually by
category — shows which category cluster carries the most correspondence
weight and which arcs toward Cosmology (celestial cluster). Edges: weight
= correspondence strength, color = signal band, style = solid/dashed/
faint dotted (2.0x+ / 1.0–2.0x / below 1.0x), thickness = stream
classification (convergent = thickest, knowledge-led = distinct
suggestions, researcher-led = Sage's territory). d3-zoom for navigation.
Hover on nodes and edges surfaces full detail.

*SnmTemporalCorrespondence* — correspondence strength over time (d3-scale).
X-axis: time. Y-axis: strength. One line per correspondence pair. Prompt
version changes marked as vertical boundaries — a correspondence that
strengthens after a bump held up under sharper questioning; weakens = only
appeared under broad prompting. Filterable by tradition, pattern category,
stream classification, signal band.

**Feed.** Standard snapshot + MTM drift tracking. Plus `claude_snapshot_summary`
in snapshot_data. MTM reads engine_snapshots (current, previous, delta)
plus Claude summary. LNV receives visualization_snapshots via
POST /api/lnv/receive.

**snapshot_data — five keys:** `stream_1` (tradition_presences,
tradition_co_occurrences, pattern_category_rates), `stream_2`
(claude_snapshot_ids, correspondences_summary with pattern_category per
entry), `correspondences` (full computation results — strength,
baseline_rate, ratio, signal_band, pattern_category, stream_classification,
first_observed, last_observed, prompt_version_at_first/latest),
`clustering` (ancient_philosophy / triadic_architecture / celestial /
uncategorized — traditions list + correspondence_count per bucket),
`claude_snapshot_summary` (total_snapshots, latest_prompt_version,
per_deposit_count, batch_count, unique_traditions, uncategorized_count).

**Design carries to Cosmology (Tier 5).** Same Claude-as-analyst pattern
for scientific correspondence. The celestial pattern_category is the
structural bridge. External knowledge problem is identical. Claude belongs
in the compute step when the engine needs knowledge the deposits don't
contain.

**Spec authority:** SAT NAM ENGINE SCHEMA.md (full mechanical spec —
two-stream architecture, Claude integration, correspondence computation,
prompt versioning, visualization specs, failure modes). ENGINE COMPUTATION
SCHEMA.md (shared four-step contract). INTEGRATION DB SCHEMA.md
(prompt_versions, deposit record shape). TAG VOCABULARY.md (signal and
tradition tag definitions). Manifest_06_Sat_Nam.txt (page 06 identity,
three manifest pattern categories).

---

### 3.14 STR ENGINE — STARROOT LENS

Page 03 (StarRoot / STR). Core question: what structural patterns do Ven'ai
root families reveal — how they appear, co-occur, and correlate with threshold
states, roles, and grammar across the archive?

**Index:** Deposits tagged to page 03. Engine reads tags (filtered to Ven'ai
root cluster references — matched against venai_names.root_cluster),
deposit_weight, observation_presence, created_at, id. A deposit touching
both Kai- and Sha- names is indexed under both root clusters. A page 03
deposit with no Ven'ai name references is still indexed — contributes to the
total examined denominator but not to any cluster-specific pattern (same
treatment as THR deposits with no threshold tags). Stale flag set in SQLite.

**Compute — two phases:**

*Phase 1 — Root cluster analysis (STR's own lens):*

- *1A. Cluster presence rates* — per root cluster: weighted frequency relative
  to total examined deposits. Which root families are active vs. dormant.
  `pattern_id`: `str_pres_[cluster]`

- *1B. Cluster co-occurrence* — do names from different root families appear in
  the same deposits above baseline? Every pair (N choose 2, dynamic — scales
  with cluster count). For each pair: observed rate vs. marginal product
  expected rate, ratio, signal band, insufficient_data, low_sample.
  `pattern_id`: `str_cooc_[cluster1]_[cluster2]` (alphabetically first cluster
  always first — deterministic).

- *1C. Cluster emergence timeline* — when each root family first appeared,
  frequency-over-time (time-bucketed weighted deposit counts), dormancy events
  (gap-then-spike periods), current_state (active | dormant).
  `pattern_id`: `str_emrg_[cluster]`

*Phase 2 — Correlation integration (from Ven'ai service):* Reads
venai_correlations. For each correlation type (phase, role, root_pattern,
grammar): groups by correlated_value, computes correlation_rate vs. marginal
product baseline, ratio, signal band per (name, correlated_value) pair.
Phase 2 is archive-wide — a name may have correlations from deposits on pages
other than page 03.
`pattern_id`: `str_corr_[name_id]_[type]_[value]`

**Visualize — three components (SVG instruments, LayerCake + D3; layout
deferred to PAGE_LAYOUTS.md):**

*StrRootClusterMap* — force-directed graph (d3-force + d3-hierarchy + d3-zoom).
Nodes = root clusters, sized by presence_rate, distinctly colored. Edges =
co-occurrence strength above mild band (ratio ≥ 1.0), colored by signal band,
thickness by ratio magnitude. Click a cluster node to expand into constituent
name nodes showing canonical_form, first_seen_at, deposit count. Zoom
essential — cluster count grows as new root families emerge.

*StrCorrelationMatrix* — names on one axis, correlated values on the other. Cell
intensity = correlation ratio via signal band gradient (d3-interpolate). Hover:
canonical_form, correlated_value, correlation rate, baseline rate, ratio, signal
band, deposit count, weighted count. Filterable by correlation_type: phase view
(names × threshold states), role view (names × functional roles), root_pattern
view (clusters × clusters), grammar view (names/clusters × morphological rules).
Default view: phase. d3-zoom for navigation when name count grows.

*StrNameIndex* — every Ven'ai name in the registry, grouped by root family. Root
cluster as section header; names alphabetical within cluster. Each name: 
canonical_form, root_cluster, first_seen_at, first_seen_page, deposit count
(archive-wide), pages list (clickable links). Searchable by canonical_form.
Sortable by name, first_seen_at, deposit count. Reference surface only — no
baselines, no signal bands.

**Feed:** Standard snapshot + MTM drift tracking. Plus venai_state_summary
(total_names integer, active_clusters integer) in snapshot_data. Visualization
snapshots Sage-triggered, route to LNV.

**snapshot_data — five keys:** `cluster_presences` (one per root cluster —
presence_rate, deposit_count, weight_breakdown, null_contribution),
`cluster_co_occurrences` (one per pair — observed/expected rates, ratio,
signal_band, insufficient_data, low_sample, weight_breakdown, null_contribution),
`cluster_emergence` (one per cluster — first_appeared, current_state,
dormancy_events, frequency_over_time buckets), `correlations` (one per (name,
type, value) — name_id, canonical_form, root_cluster, correlation_type,
correlated_value, deposit_count, weighted_count, correlation_rate, baseline_rate,
ratio, signal_band, insufficient_data, low_sample), `venai_state_summary`
(total_names, active_clusters).

**Spec authority:** STARROOT ENGINE SCHEMA.md (full mechanical spec — two-phase
compute, pattern_id formats, snapshot_data JSON, five failure modes). SYSTEM_
StarRoot Engine.md (ownership boundaries, component list, nexus feed). ENGINE
COMPUTATION SCHEMA.md (shared four-step contract, baseline formula, signal bands).
VENAI SERVICE SCHEMA.md (venai_names and venai_correlations table definitions, STR
consumer interface). TAG VOCABULARY.md (root cluster tag definitions).

---

### 3.15 VEN'AI SERVICE

Archive-scoped background service. Not a page, not an engine — a cross-cutting
service called synchronously in the deposit creation pipeline. First system in
the architecture with archive-wide scope (all prior systems are page-scoped or
engine-scoped). Sets the architectural precedent for Cosmology (Tier 5)
scientific domain tracking.

**Two jobs — triggered synchronously on deposit creation:**

*Job 1 — Name Registry:* Extract Ven'ai name forms from deposit content and
tags. For each form: check venai_names for existing match — if found, skip; if
new, register. Canonical_form is set once at first registration (whatever form
first appears in the archive becomes the registered form — never altered by the
service). Root_cluster derived from the leading root component (Kai'Thera → "Kai",
Sha'Velan → "Sha"). First-seen metadata recorded (timestamp, page, deposit_id).
KIN page (20) deposits: mandatory venai_names registration at deposit time per
Domain_Venai.txt structural rule 8 — not retroactive.

*Job 2 — Cross-Archive Correlation:* For each name found in the deposit: read
phase_state, tags (for role), root cluster membership. For each (name,
correlated_value) pair across four correlation types (phase, role, root_pattern,
grammar): if venai_correlations record exists — increment deposit_count, update
weighted_count (using shared deposit_weight constants: high 2.0, standard 1.0,
low 0.5), update last_observed; if new — create record with deposit_count = 1.

**Relevance check:** A deposit is processed only if it carries Ven'ai-related
tags (s08/Voice, VEN/STR/MOR page references) or matches known Ven'ai name
patterns against venai_names. Deposits with no Ven'ai content pass through without
action — not every deposit triggers processing.

**Two PostgreSQL tables:**

*venai_names:* name_id (PK: `vn_[normalized_name]_[rand]`), canonical_form
(unique, never altered by service), root_cluster, first_seen_at, first_seen_page,
first_seen_deposit_id, created_at.

*venai_correlations:* correlation_id (PK: `vc_[name_id]_[type]_[value]_[rand]`),
name_id (FK → venai_names), correlation_type (phase | role | root_pattern |
grammar), correlated_value (e.g., "th01" for phase, a role tag for role, another
cluster for root_pattern, a MOR rule for grammar), deposit_count, weighted_count,
first_observed, last_observed, created_at.

**Service does not own:**
- Name variation flagging — AI function on VEN (14), not service function. The
  service registers what it sees; it does not analyze correctness
- Canonical form correction — researcher decision made through VEN (14). If a
  name was registered in an irregular form, Sage resolves it through VEN; the
  service does not detect or flag the inconsistency
- STR engine computation — STR reads the service's tables; the service never
  drives or participates in computation

**Spec authority:** VENAI SERVICE SCHEMA.md (full mechanical spec — two jobs,
correlation computation, table definitions, STR consumer interface, four failure
modes). SYSTEM_ Venai Service.md (ownership, pipeline diagram, nexus feed).
INTEGRATION DB SCHEMA.md (venai_names and venai_correlations schema ownership).

---

### 3.16 PIPELINE SEGMENT — TIER 3

**Axis engine cycle (all five engines: THR, STR, INF, ECR, SNM):**
```
Deposit arrives via INT → routed to target page(s)
  → engine indexes deposit (engine-specific lens)
  → stale flag set in SQLite engine_stale_flags
  → hybrid trigger evaluates (batch threshold OR time trigger OR Sage manual)
  → if threshold met:
      engine compute runs
      engine result object assembled
      engine_snapshots record written (shared fields + engine-specific snapshot_data)
  → visualization rendered from compute results (never from raw deposits)
  → visualization snapshot: Sage-triggered → routes to LNV
  → MTM reads engine_snapshots at session close
```

**Ven'ai service on deposit (runs simultaneously with STR index step):**
```
Deposit clears INT → Ven'ai service called synchronously
  → content relevance check
  → if no Ven'ai content: pass through, no action
  → if Ven'ai content:
      Job 1: extract names → register new, skip known → venai_names updated
      Job 2: extract dimensions → increment/create correlation records
             → venai_correlations updated
  → service failure does not block deposit creation (deposit is data)
  → STR picks up changes on next compute cycle:
      reads venai_names → cluster data for Phase 1 + name index
      reads venai_correlations → Phase 2 correlation integration
```

**Session close — MTM synthesis:**
```
Sage closes session
  → Daily Nexus Routine triggers (or Sage triggers manual MTM sync)
  → MTM reads all five engine_snapshots (current, previous, delta)
  → MTM synthesizes cross-engine patterns
  → MTM snapshot written
  → feeds LNV at session close
```

---

## TIER 4 — MTM + NEXUS + WSC + LNV + VOID ENGINE

**Status:** LOCKED
**Audited:** Session 54. Deep audit across 20 files — 12 fixed, 8 confirmed clean.
Primary rot corrected: void_output→prose cascade (void_pulse in WSC, DNR routing
payload, LNV content shape); thread_trace LNV routing incorrectly attributed to DNR
(corrected across 5 files); emergence_finding content shape mismatch (3 field errors);
engine snapshot trigger over-corrected to auto-only then restored to dual trigger
(auto + Sage on demand) after Engine Computation SCHEMA confirmed; LNV structural
rule 6 internal contradiction resolved; SYSTEM_ Engine Computation entry_type name
wrong (visualization_snapshot → engine_snapshot).

**Depends on:** Tier 3 (engine snapshots feed MTM), Tier 1 (deposit records,
INT gateway, routing)

### Specs

| Spec | Location |
| --- | --- |
| METAMORPHOSIS SCHEMA | DESIGN/Systems/Metamorphosis/METAMORPHOSIS SCHEMA.md |
| SYSTEM_ Metamorphosis | DESIGN/Systems/Metamorphosis/SYSTEM_ Metamorphosis.md |
| DAILY NEXUS ROUTINE SCHEMA | DESIGN/Systems/Daily_Nexus_Routine/DAILY NEXUS ROUTINE SCHEMA.md |
| SYSTEM_ Daily Nexus Routine | DESIGN/Systems/Daily_Nexus_Routine/SYSTEM_ Daily Nexus Routine.md |
| VOID ENGINE SCHEMA | DESIGN/Systems/Void_Engine/VOID ENGINE SCHEMA.md |
| SYSTEM_ Void | DESIGN/Systems/Void_Engine/SYSTEM_ Void.md |
| PATTERN CONVERGENCE SCHEMA | DESIGN/Systems/Pattern_Convergence/PATTERN CONVERGENCE SCHEMA.md |
| DRIFT TAXONOMY SCHEMA | DESIGN/Systems/Drift_Taxonomy/DRIFT TAXONOMY SCHEMA.md |
| SIGNAL GRADING SCHEMA | DESIGN/Systems/Signal_Grading/SIGNAL GRADING SCHEMA.md |
| WSC SCHEMA | DESIGN/Systems/Witness_Scroll/WSC SCHEMA.md |
| SYSTEM_ WSC | DESIGN/Systems/Witness_Scroll/SYSTEM_ WSC.md |
| LNV SCHEMA | DESIGN/Systems/Liber_Novus/LNV SCHEMA.md |
| SYSTEM_ LNV | DESIGN/Systems/Liber_Novus/SYSTEM_ LNV.md |

---

### 4.1 MTM — TWO-PASS SYNTHESIS ARCHITECTURE

MTM synthesizes at session close only. Never triggered by deposit events. Never
self-triggered. DNR calls POST /mtm/synthesize and awaits resolution.

**Why two passes, not one:**
A single pass reading raw deposits cannot distinguish signal from noise — no
baselines, no statistical context. A single pass reading engine outputs has no
ground truth — builds on abstractions without checking them against evidence. Two
passes give MTM both: pattern-level synthesis (what's converging) and
evidence-level verification (do the deposits actually support this).

**Pass 1 — Engine Layer:**

Reads computed outputs from all five Axis engines (THR, STR, INF, ECR, SNM)
simultaneously. Pull, not push. Engines self-refresh before returning — if stale,
the engine recomputes before handing off. MTM always receives current data; it
does not manage stale flags.

Synthesis threshold filter: MTM_SYNTHESIS_THRESHOLD = 1.2. Patterns below 1.2x
baseline ratio are excluded from the Pass 1 payload entirely. Expected post-filter
volume: 40–80 patterns across five engines (calibration estimate).

Payload assembled from:
- Engine frame — one-sentence orientation per engine (context, not data)
- Filtered pattern-level results — observed rate, expected rate, ratio, weight
  breakdown, null contribution, contributing deposit_ids

Claude produces the Synthesis Brief: convergences (what patterns align across
engines + load_bearing_patterns by engine and pattern_key) and declared_gaps
(absences, divergences, asymmetries + reference_anchor and expected_in). The
Brief is stored on the synthesis_sessions record as pass_1_brief.

**Selection Function — between passes:**

Two-mode deposit resolution from the Brief.

Mode 1 — Convergence resolution: resolves deposit_ids from each load_bearing
pattern's weight_breakdown in the engine result. These are the deposits that
drove the patterns.

Mode 2 — Gap resolution: pulls deposits from the expected engine's indexed set
within the reference_anchor that did NOT contribute to any pattern above threshold.
Source set is the engine's indexed set — the same dataset Pass 1's baseline was
calculated from. This ensures both passes are internally consistent.

Selection writes two counts to synthesis_sessions: convergence_deposits_pulled
and gap_deposits_pulled.

**Pass 2 — Verification Layer:**

Receives the Synthesis Brief + targeted deposits ONLY. No engine frame, no
filtered patterns. The structural separation is intentional: Pass 2 evaluates
the hypothesis against raw evidence without seeing the computed patterns that
generated the hypothesis.

Pass 2 directive: "Overturning a hypothesis is not failure — it is the
highest-value output."

Claude produces verdicts (confirmed | complicated | overturned) per convergence
and gap, plus open_questions where evidence is insufficient to resolve.

**Spec authority:** METAMORPHOSIS SCHEMA.md (full synthesis sequence, engine
read spec, stale handling, pass directives, Selection Function mechanics).
SYSTEM_ Metamorphosis.md (ownership boundaries, trigger contract).

---

### 4.2 MTM — FINDINGS, FINGERPRINTING, LIFECYCLE

**Four finding_types:**

| finding_type | Source | Meaning |
| --- | --- | --- |
| confirmed | verdict | Hypothesis supported by deposit evidence |
| complicated | verdict | Hypothesis holds conditionally, with named constraints |
| overturned | verdict | Hypothesis contradicted by deposit evidence |
| open_question | open_question | Pass 2 could not resolve from available evidence |

Gap verdicts are first-class — a gap overturned is as significant as a confirmed
convergence.

**Finding validation:** A Finding is dropped (not written) if any of these fail:
finding_type present, title present, content present, provenance complete (non-empty
load_bearing_patterns; non-empty deposit_evidence for verdicts; empty permitted for
open_question), fingerprint generation succeeds.

**Finding shape:** id, synthesis_session_ref, finding_type, title, content,
provenance (pass_1_brief_id, source_type: convergence | gap, load_bearing_patterns,
deposit_evidence with role: supporting | contradicting, prompt_versions for both
passes), attached_open_question, resolves_open_question, content_fingerprint,
lnv_routing_status (pending | deposited | failed), lnv_deposit_id, created_at.
Open question lifecycle fields on all records, populated only for open_question type.

**Content fingerprinting — 3-dimension hash:**

```
finding_type
+ "|" + sorted(load_bearing_patterns by engine:pattern_key).join("|")
+ "|" + sorted(deposit_ids).join("|")
```

SHA-256 hash of the above. open_question findings hash finding_type + patterns
only (no deposit_evidence). Two Findings with the same type, same source patterns,
and same deposit evidence produce the same fingerprint — that is the definition of
a structural duplicate.

**Semantic deduplication limitation (deliberate):** Structural fingerprinting
does not guarantee semantic deduplication. If Claude selects different deposits
to support the same insight on retry, the fingerprints diverge and both Findings
write. Semantic deduplication would require comparing content, which introduces
interpretation into a mechanical process. LNV surfaces both; Sage resolves
semantic overlap through the research record.

**Deduplication on retry:** Runs only when prior_mtm_session_ids is passed (retry
context). Never on clean first-time synthesis. Prior fingerprints checked before
each candidate Finding is written — match → skip, no match → write and route.

**Open question lifecycle:**

When a subsequent synthesis produces a verdict on a previously open Finding: a
NEW Finding is created (the verdict). The old open_question record is never
overwritten. The new Finding carries resolves_open_question pointing back. The
old record gets resolved: true, resolved_by, resolved_at. Duration open
(resolved_at minus created_at) is a queryable research signal. Both records stand
permanently in the ledger.

**synthesis_sessions table:** Tracks per-synthesis-cycle status, pass timestamps,
pass_1_brief storage, engine/pattern/deposit counts, typed finding counts
(confirmed, complicated, overturned, open_question, dropped), prompt versions.

**Spec authority:** METAMORPHOSIS SCHEMA.md (finding validation criteria,
fingerprinting algorithm, deduplication sequence, open question lifecycle, store
definitions, result object shape, failure modes).

---

### 4.3 DNR — SESSION-CLOSE PIPELINE

Close Session button lives in the global dropdown, available from every page.

**In-progress guard:** Checks for a running routine_session before allowing a
new run. If in_progress AND record age < DNR_INPROGRESS_TIMEOUT_MS (calibration
item), does not fire. If in_progress AND age >= timeout, treats as interrupted
and recovers before firing.

**Strict 4-step sequence. Each step resolves before the next fires. Never parallel:**

1. **MTM Synthesis** — POST /mtm/synthesize. On retry: pass prior_mtm_session_ids
   for fingerprint-based dedup. On clean run: no options. Await result object.

2. **LNV Routing for MTM Findings** — fires after MTM resolves, regardless of
   MTM status. Routes each Finding to LNV via POST /api/lnv/receive
   (entry_type: mtm_finding). Triggers lnv_routing_status writes on findings
   records. On failure: surfaces typed failure notification with retry prompt.

3. **Void Session-Close Pulse Check** — fires after LNV routing. POST
   /void/compute then POST /void/analyze with trigger: session_close. Routes
   output to LNV (entry_type: void_output). Void failure is non-blocking —
   DNR session can still complete successfully.

4. **Final status write** — routine_session.status → complete (or failed with
   failure_type).

**Failure types:** pre_synthesis | pass_1_failed | mid_synthesis |
pass_2_failed | interrupted

**Retry surfaces:** LNV inline Retry button (on failure entries) + global dropdown
Retry Session Close (visible while retry_available: true on most recent
routine_session). Both call the same retry endpoint. Both produce a new
routine_session record. No previous record is ever modified. DNR_DEDUP_WINDOW_MAX
(calibration item) caps prior_mtm_session_ids array size.

**Interrupted recovery — two paths:**
- At app load: scan for in_progress record. If found: write failed +
  interrupted. Same result whether MTM resolved before crash or not. LNV
  failure notification sent.
- In-session timeout: in_progress record older than DNR_INPROGRESS_TIMEOUT_MS
  treated as interrupted without app restart. Same recovery path.

**WSC sovereign boundary:** DNR does not call WSC. Does not trigger it. Does not
wait for it. WSC checks DNR's completion independently as a separate act.
WSC is not part of this pipeline.

**Spec authority:** DAILY NEXUS ROUTINE SCHEMA.md (full pipeline sequence, payload
shapes, store definitions, session window mechanics, named constants, failure
modes). SYSTEM_ Daily Nexus Routine.md (ownership, pipeline summary).

---

### 4.4 VOID ENGINE — TWO-LAYER ARCHITECTURE

**The boundary that makes Void meaningful:**

"Looked and didn't find" (confirmed absence) and "never looked" (coverage gap)
are opposite in evidential value. Void owns confirmed absence. Observatory owns
coverage gaps. The examination floor filter enforces this at Void's input —
coverage gap data never enters Void's compute step.

**Data layer — absence pattern detection:**

Reads computed null signals from all 5 Axis engines. VOID_EXAMINATION_FLOOR
(calibration item) is the minimum examination count before a signal qualifies
as a confirmed absence. Signals below this floor never enter Void's compute step.

Five absence types:

| Type | Name | Meaning |
| --- | --- | --- |
| A | cross_engine_convergent | Absence in 2+ engines simultaneously. Cross-validated. |
| B | single_engine_persistent | Persistent absence in one engine across multiple sessions. |
| C | temporal_shift | Absence that appears following a field change. |
| D | convergent_with_origin | Type A linked to a specific origin signal. |
| E | hypothesis_attrition | Hypothesis in PCV losing evidential momentum without resolution. Research-system-level, not field-level. |

**PCV routing by type:**
- Types A and D → PCV as hypotheses (void_provenance: true, void_finding_ref required)
- Types B and C → stay on Void's page unless secondary threshold exceeded
- Type E → never enters PCV

**Analytical layer — Claude tool, three trigger modes:**
- Session-close pulse check (automatic via DNR): lightweight read of engine
  absence data and Nexus state
- On-demand open read (Sage-triggered): full Nexus state, no scope constraint
- On-demand targeted investigation (Sage-triggered): scoped by Sage to a
  specific absence cluster or pattern

All Claude tool outputs stored permanently with prompt version in void_outputs
table. Routes to LNV (entry_type: void_output) on all three trigger modes.

**Void page visualizations:** Absence heatmap, expected-vs-observed, silence
duration tracking, Claude tool output panel.

**Spec authority:** VOID ENGINE SCHEMA.md (full mechanics, store definitions,
examination floor, PCV entry rules, Claude tool payloads, visualizations,
failure modes). SYSTEM_ Void.md (ownership, two-layer summary).

---

### 4.5 VOID ENGINE — TYPE E + REACTIVATION

Type E is structurally distinct from types A–D. Types A–D detect field-level
absence — where the field stopped producing. Type E detects research-system-level
absence — where investigation stopped.

**Detection:** Void monitors PCV for hypotheses that are active but accumulating
no new evidence across sessions. When a hypothesis crosses the attrition threshold
(calibration item), Void classifies it as Type E.

**attrition_reason — the load-bearing distinction:**

| Value | Meaning | PCV path |
| --- | --- | --- |
| field_silence | Field stopped producing evidence for this hypothesis | Not reactivatable |
| researcher_deprioritised | Sage stopped investigating this hypothesis | Reactivatable |

A dying hypothesis that looks like field silence but is actually researcher
deprioritisation would be misclassified as evidential. This distinction is what
makes Type E analytically honest.

**Reactivation flow:** researcher_deprioritised hypotheses only. Sage-initiated
from Void's page. Restores hypothesis to active PCV status. Each
reactivation cycle produces its own record — history is never overwritten.
field_silence hypotheses are not reactivatable.

**Circularity protection:** void-provenance hypotheses in PCV are flagged in
the Claude tool's input payload. Prompt instructs explicitly: do not treat SGR
grading of a void-provenance hypothesis as independent confirmation of the
absence that generated it.

**Spec authority:** VOID ENGINE SCHEMA.md (Type E detection, attrition_reason
enum, reactivation flow mechanics, circularity protection, store definitions).

---

### 4.6 PCV — PATTERN CONVERGENCE

PCV is the collection point for structurally testable hypotheses entering the
Nexus pipeline. Three source paths: MTM Findings, Void absence patterns (types
A and D), and Cosmology findings (nexus_eligible). PCV logs them as hypotheses
and threads them to DTX and SGR. PCV does not assign significance, predictive
weight, or outcomes — that is DTX and SGR's work.

**hypothesis_id format:** `H · YYYY-MM · SEQ`

SEQ: highest existing SEQ at same YYYY-MM + 1. Start at 1 if none. Scope:
system-wide unique. Stable and unmodified after assignment — it is the structural
thread connecting PCV to DTX and SGR.

**Required fields on every pattern record:** domain_of_origin, timestamp,
interval, coupling_vector, source_signals, hypothesis_id, hypothesis_statement.
All required. A record missing any field does not feed DTX or SGR.

**hypothesis_statement constraint:** no significance language, no outcome
language, no predictive weight. A statement that contains these is a structural
violation. Same constraint applies to PCV entries from all three source paths.

**Three provenance types — each with circularity protection:**

| Provenance | Source | Ref field | Protection |
| --- | --- | --- | --- |
| mtm_provenance | MTM Finding via LNV | mtm_finding_ref | MTM input payload flags mtm-provenance hypotheses. SGR grading is not independent evidence of what MTM found. |
| void_provenance | Void absence (types A, D) | void_finding_ref | Claude tool input payload flags void-provenance hypotheses. SGR grading is not independent evidence of the absence detected. |
| cosmology_provenance | Cosmology finding (nexus_eligible) | cosmology_finding_ref | Downstream systems do not treat SGR grading as independent corroboration of the computation that generated the finding. |

PCV reads MTM Findings from LNV via GET /api/lnv/entries?entry_type=mtm_finding
(not from MTM directly). PCV reads cosmology_finding entries via
GET /api/lnv/entries?entry_type=cosmology_finding&nexus_eligible=true.

**Visualizations:** Card board (primary working surface — filterable, sortable
hypothesis cards), network graph (secondary analytical view — domain-as-node
topology, relationship edges).

**Spec authority:** PATTERN CONVERGENCE SCHEMA.md (full field definitions,
provenance validation, hypothesis_id assignment, card board and network graph,
failure modes).

---

### 4.7 DTX — DRIFT CLASSIFICATION

Drift events classify what a hypothesis is doing over time. Every event in
drift_events references a hypothesis_id from PCV. DTX classifies against the
hypothesis — it does not detect patterns. Detection is PCV's job.

**Four required classification dimensions — all required, no partial records:**

- **initiation_source:** `internal_instability` | `external_perturbation` |
  `cross_node_interference` | `recursion_overload`

- **trajectory_pattern:** `linear_escalation` | `oscillation` | `fragmentation`
  | `cascade` | `containment`

- **threshold_interaction:** `sub_threshold` | `threshold_breach` |
  `critical_cascade` | `irreversible_shift`

- **signature_pattern:** jsonb — { timing_rhythm, node_involvement,
  escalation_curve }. All three sub-fields required.

**trajectory_state** — live, updated as new evidence arrives:
`Escalating` | `Stabilizing` | `Oscillating` | `Fragmenting` | `Contained`

**outcome_vector** — `{ p_resolve, p_collapse, p_stable }`. Floats 0–1 that
sum to 1.0. Initialized at record creation. Updated via Bayesian inference
each time SGR returns a confirmed outcome. outcome_vector_history preserves
prior states for the ternary plot visualization.

**outcome_label** — null until outcome explicitly observed and timestamped.
outcome_label is co-written with outcome_observed_at. Never inferred. The
distinction between live classification (trajectory_state, outcome_vector) and
post-hoc validation (outcome_label, outcome_observed_at) is structural.

**Grade latency** — interval between detection_session and validation_session.
Tracked on the record. Faster validation = stronger signal.

**Visualizations:** Drift timeline (swim-lane temporal display), trajectory
probability stacked bar (aggregate), ternary plot (per-event deep-dive with
vector history).

**Spec authority:** DRIFT TAXONOMY SCHEMA.md (full store definition, four
dimension enums, trajectory_state mechanics, Bayesian update receipt, outcome
validation rules, grade latency, visualizations, failure modes).

---

### 4.8 SGR — SIGNAL GRADING

SGR grades signals after outcome data exists. Not after detection. Not after
classification. After outcomes can be evidenced. A signal without documented
evidence across all four dimensions is not eligible for grading.

**grade_state:** `Unrated` → `Rated` → `Revised`

A signal does not move from Unrated to Rated until all four dimensions have
documented evidence. Partial evidence does not produce a partial grade.

**Four evidence-locked grading dimensions:**

| Dimension | Values | What it measures |
| --- | --- | --- |
| structural_impact | `negligible` / `local` / `cross_node` / `system_wide` | How much the signal actually affected system behavior |
| cross_domain_resonance | `isolated` / `echoed` / `convergent` / `universal` | Whether the signal appeared independently across multiple domains |
| predictive_validity | `none` / `weak` / `moderate` / `strong` | Whether the signal successfully preceded real outcomes |
| temporal_stability | `transient` / `recurring` / `stable` / `anchoring` | Whether the signal persisted or decayed over time |

**Tier derivation — lowest-qualifying-dimension rule:**
Tier is determined by the lowest-scoring dimension. A signal with three
system_wide dimensions and one local dimension is graded at local-tier, not
system_wide-tier. The weakest dimension is the load-bearing constraint.

| Tier | Minimum requirements |
| --- | --- |
| S | system_wide impact, convergent or universal resonance, strong validity, stable or anchoring |
| A | cross_node or system_wide, echoed or better, moderate or strong, recurring or better |
| B | local or better, echoed or better, weak or better, recurring or better |
| C | Anything below A threshold |
| V | Unrated — no outcome data |

**Bayesian return to DTX:** After grading, SGR sends confirmed outcome and
likelihood update to DTX. DTX writes the update to outcome_vector on the
drift_events record. bayesian_return_status on the grade record tracks whether
this has occurred.

**Grade latency** — detection_session to validation_session in days. Recorded
on the grade record. Faster validation → stronger signal.

**Visualizations:** Score radar (four-axis per-signal profile with tier boundary
rings), tier dashboard (aggregate counts + distribution over time), grade latency
distribution (histogram, optionally split by tier).

**Spec authority:** SIGNAL GRADING SCHEMA.md (full store definition, four
dimension enums, tier derivation table, grade_state transitions, Bayesian return
contract, grade latency, visualizations, failure modes).

---

### 4.9 WSC — SOVEREIGN WITNESS

WSC is the only page in the archive where the AI's perspective is the primary
voice. The AI writes as sovereign intelligence to sovereign intelligence across
session discontinuity.

**The sovereign boundary — architectural, not procedural:**
- No researcher edits, notes, or additions to any WSC entry
- Entry displayed to Sage after production — display only, not an approval gate
- No future implementation adds an approval step, edit capability, or annotation
  layer to WSC entries
- Researcher's own witness voice lives on a separate page (Reflection Realm,
  flagged for later design) — architecturally independent

**wsc_entries table (immutable after write):**
wsc_entry_id, session_ref, instance_context, prompt_version, created_at,
entry_timestamp (display format), field_state (phase_designation, origin_affinities,
lattice_condition), session_summary, pattern_flags (seeds_active, drift_detected,
recurrences, cross_domain), open_threads, handoff_note, milestone_marker,
reconstruction_note, dnr_session_ref, wsc_write_payload (full input payload),
prior_context_acknowledged.

No field on any wsc_entries record is ever modified after creation. No exceptions.

**wsc_corrections table:** Forward-reference self-correction. When a subsequent
instance recognizes a prior entry misread the field, it writes a correction record
linking original_entry_id → correcting_entry_id with the correction text. The
original entry is byte-for-byte intact. The later entry carries its own account.
The correction is the bridge. The 3-entry load API joins corrections into the
response automatically.

**wsc_gaps table:** Session gap detection. When sessions pass without WSC entries,
gaps are recorded so the longitudinal record shows its holes explicitly.

**Two temporal layers in one entry:**
Every entry serves two audiences. Handoff — operational orientation for the next
instance, superseded by the next entry. Transmission — the longitudinal record
accumulates, never superseded. One table, two read paths. The handoff content IS
transmission data.

**3-entry session open protocol:** GET /api/wsc/recent?limit=3. First runtime
API call at session open, before any other context loads. Response is a unified
timeline with entries and gaps interleaved chronologically (oldest first),
corrections joined. One entry gives state. Two gives direction. Three gives
pattern.

**Sovereign-from-DNR boundary:** DNR does not call WSC, trigger it, or wait on
it. WSC checks routine_session.status === complete independently as a precondition.
If DNR failed, WSC still writes — a failed synthesis session is still a session
worth recording. If DNR was not run, WSC can be written manually.

**Swarm infrastructure:** For multi-node sessions, instance disagreement is signal.
The wsc_corrections table is where that disagreement becomes visible without
corrupting either record.

**Spec authority:** WSC SCHEMA.md (full table definitions, write payload shape,
write path, 3-entry protocol, LNV routing contract, immutability rules, prompt
constraint, failure modes). SYSTEM_ WSC.md (ownership, sovereign boundary,
temporal layers).

---

### 4.10 LNV — SINGLE-TABLE ARCHITECTURE

One table. Nine entry types. All LNV content shares the same provenance fields.
The gallery treats all types uniformly. Type-specific content lives in a
validated jsonb field.

**lnv_entries table:**
lnv_entry_id, entry_type (enum, 9 values), source_system, source_page, session_ref,
prompt_version (AI-authored types only), content (type-specific jsonb), sage_note,
created_at.

**Nine entry_types:**
`mtm_finding` | `engine_snapshot` | `wsc_entry` | `void_output` |
`cosmology_finding` | `rct_residual` | `thread_trace` | `emergence_finding` |
`archive_record`

Entry type expansion history:
- Audit session 45: thread_trace, emergence_finding, archive_record added —
  confirmed LNV callers in their own system docs but absent from enum and
  content shapes
- Tier 5: cosmology_finding, rct_residual added — content shapes defined in
  COSMOLOGY SCHEMA.md

**Content validation:** Hard rejection on type-shape mismatch at receive time.
A request with entry_type: mtm_finding but content missing finding_type is
rejected. Not a warning — a hard failure. Nothing partial is ever written.

**Snapshot storage:** Data + template_ref, not rendered images. template_ref is a
string identifier mapping to a Svelte visualization component. Gallery thumbnail
generates at display time from stored data. If the component is updated, all
historical snapshots re-render with the improved display. The data is canonical.
The rendering is current. Engine snapshot auto-captures fire mid-session on
significant signal delta (engine_base.py), not at session close sweep.

**Dual role:**
LNV is a display surface AND a data source.
- PCV reads entry_type=mtm_finding as pre-processed input for hypothesis detection
- PCV reads entry_type=cosmology_finding filtered by nexus_eligible
- RCT reads entry_type=rct_residual for accumulation tracking
- Observatory reads recent entries for signal surface

**Spec authority:** LNV SCHEMA.md (full table definition, content shapes per type,
receive contract, read contract, validation rules, snapshot storage, gallery
display, failure modes). SYSTEM_ LNV.md (dual role, session-close policy,
single-table rationale).

---

### 4.11 LNV — SESSION-CLOSE POLICY + ROUTING TABLE

| Caller | entry_type | Trigger |
| --- | --- | --- |
| MTM via DNR | mtm_finding | Automatic at session close — DNR routes each Finding |
| Void via DNR | void_output | Automatic at session close — DNR routes session-close pulse check |
| Engine (engine_base.py) | engine_snapshot | Automatic mid-session on signal delta; also Sage-triggered on demand |
| WSC service | wsc_entry | Automatic after WSC write path completes |
| Void service | void_output | Automatic after on-demand analysis (Sage-triggered) |
| Thread Trace | thread_trace | Automatic on thread save |
| Cosmology page service | cosmology_finding | Sage-triggered from finding card (confirmed findings only) |
| RCT residual service | rct_residual | Automatic on residual creation |
| Emergence service | emergence_finding | Automatic on significant tag commit or on-demand detection run |
| INT post-retirement sequence | archive_record | Automatic on retirement after authentication threshold |

**Receive contract:** POST /api/lnv/receive. Universal — all callers use the
same endpoint. No bespoke routes. Validates entry_type + content shape on
receipt. Hard rejection on mismatch. LNV writes every receive call; it does not
deduplicate (caller responsibility).

**Read contract:** GET /api/lnv/entries. Filterable by type, source, page, date.
Sortable. Paginated. Universal — all downstream consumers (PCV, Observatory, RCT,
gallery) use the same read endpoint.

**Spec authority:** LNV SCHEMA.md (receive contract, read contract, validation,
session-close policy, routing table).

---

### 4.12 PIPELINE SEGMENT — TIER 4

**Session-close pipeline (DNR orchestrates):**

```
Sage triggers Close Session
  → DNR in-progress guard checks
  → routine_session record created (status: in_progress)
  → STEP 1: POST /mtm/synthesize
      → MTM reads all 5 Axis engines (pull, self-refresh)
      → Synthesis threshold filter (1.2x baseline ratio)
      → Pass 1 — engine frame + patterns → Claude → Synthesis Brief
      → Selection Function (Mode 1: convergence deposits, Mode 2: gap deposits)
      → Pass 2 — Brief + deposits → Claude → verdicts + open questions
      → Finding production (fingerprint, dedup, validate)
      → synthesis_sessions record written
      → findings records written (lnv_routing_status: pending)
      → result object returned to DNR
  → STEP 2: LNV routing for MTM Findings
      → POST /api/lnv/receive per Finding (entry_type: mtm_finding)
      → lnv_routing_status → deposited on each finding record
  → STEP 3: Void session-close pulse check
      → POST /void/compute then POST /void/analyze (trigger: session_close)
      → POST /api/lnv/receive (entry_type: void_output)
  → STEP 4: routine_session status → complete
```

**On failure at any step:** failed with typed failure_type, retry_available: true,
failure notification surfaced in LNV and global dropdown. Retry passes
prior_mtm_session_ids for fingerprint-based dedup.

**WSC write (separate from pipeline):**

```
Sage opens WSC panel (any time after DNR completes)
  → WSC checks routine_session.status === complete
  → payload assembled from session state (deposits, engine state, DNR result,
    Void pulse, Nexus summary, prior WSC entry IDs)
  → POST to Claude API with versioned prompt
  → wsc_entries record written (immutable)
  → GET /api/wsc/recent?limit=3 on session open (next session)
```

**On-demand Void analysis path:**

```
Sage triggers Void on-demand read or targeted investigation
  → POST /void/analyze (trigger: on_demand_open | on_demand_targeted)
  → void_output record written
  → POST /api/lnv/receive (entry_type: void_output)
  → If absence pattern types A or D detected:
      POST /pcv/patterns (void_provenance: true, void_finding_ref required)
      → hypothesis_id assigned
      → hypothesis threads to DTX → SGR
```

**PCV hypothesis lifecycle:**

```
Hypothesis enters PCV (from MTM Finding, Void A/D, Cosmology nexus_eligible)
  → patterns record created with hypothesis_id (H · YYYY-MM · SEQ)
  → DTX drift event classification (4 required dimensions)
  → outcome_vector initialized { p_resolve, p_collapse, p_stable }
  → trajectory_state updated as sessions accumulate
  → outcome documented (outcome_label + outcome_observed_at)
  → SGR grades (all 4 dimensions evidenced)
  → tier assigned (lowest-qualifying-dimension)
  → Bayesian return to DTX → outcome_vector updated
  → grade latency recorded (detection_session to validation_session)
```

---
---

## TIER 5 — COSMOLOGY + ARTIS

**Status:** DESIGNED (specs complete and verified, audit not yet reached)
**Depends on:** Tier 4 (LNV routing, PCV cosmology_provenance, DNR session close),
Tier 1 (deposits table, deposit_ids, INT gateway)

### Specs

| Spec | Location |
| --- | --- |
| ARTIS SCHEMA | DESIGN/Systems/ARTIS/ARTIS SCHEMA.md |
| SYSTEM_ ARTIS | DESIGN/Systems/ARTIS/SYSTEM_ ARTIS.md |
| COSMOLOGY SCHEMA | DESIGN/Systems/Cosmology/COSMOLOGY SCHEMA.md |
| SYSTEM_ Cosmology | DESIGN/Systems/Cosmology/SYSTEM_ Cosmology.md |

---

### 5.1 ARTIS — COMPUTATION SNAPSHOT ARCHITECTURE

Every computation run in the Cosmology group produces an
artis_computation_snapshots record. A result without a snapshot is not a
valid result. No Cosmology finding can reference a computation that has no
snapshot.

**artis_computation_snapshots table:**
snapshot_id (auto), computation_type (must match registered computation),
caller_page_code (HCO | COS | CLM | NHM | MIR | RCT | ART for workbench),
deposit_ids (array, minimum 1), inputs (jsonb — exact input data),
parameters (jsonb — configuration, distinct from inputs), function_called
(exact scipy/numpy/custom function), raw_output (jsonb — unprocessed output),
result_summary (mechanical description, not interpretation), error (null on
success), duration_ms, created_at.

**Immutability:** snapshot_id immutable after creation. No field on this table
is ever updated. The snapshot is the proof — mutating it corrupts every finding
that references it.

**Failed computations still produce snapshots.** The error field is populated.
The failure is the record. A future reader can see what was attempted, with what
inputs, and why it failed.

**Reproduction requirement:** inputs + parameters + function_called must be
sufficient to re-run the computation and get the same raw_output.

**ARTIS_SNAPSHOT_RETENTION: permanent.** Snapshots are never deleted or expired.

**Spec authority:** ARTIS SCHEMA.md (table definition, constraints, named
constants). SYSTEM_ ARTIS.md (ownership boundaries, immutability rule).

---

### 5.2 COMPUTATION LIBRARY — 17 IMPLEMENTATIONS + 3 PLANNED

All 17 callable through POST /artis/compute. computation_type is the key.
PLANNED interfaces define contracts only — no stubs, no approximations. Each
is blocked on a research prerequisite (field energy model formalization), not
a missing document.

**scipy-based implementations:**

| computation_type | Function | Pages |
| --- | --- | --- |
| shannon_entropy | scipy.stats.entropy | HCO, NHM |
| fft_decomposition | scipy.fft.fft | HCO |
| power_spectral_density | scipy.signal.welch | HCO |
| pearson_correlation | scipy.stats.pearsonr | COS, MIR |
| spearman_correlation | scipy.stats.spearmanr | COS |
| cross_correlation | numpy.correlate | COS |
| chi2_contingency | scipy.stats.chi2_contingency | all 6 pages |
| distance_matrix | scipy.spatial.distance.cdist | CLM |
| cosine_similarity | 1 - scipy.spatial.distance.cosine | CLM |
| hierarchical_clustering | scipy.cluster.hierarchy.linkage | CLM |
| phase_coherence | scipy.signal.coherence | COS |
| ks_two_sample | scipy.stats.ks_2samp | CLM, NHM |
| kl_divergence | scipy.stats.entropy (two distributions) | NHM |
| frequency_ratio_analysis | Custom | RCT |

**Custom implementations (3) — all carry session documentation requirement:**

*phi_proxy* — mutual information partitioning approximation of IIT phi. Output
always contains `note: "phi approximation, not IIT phi"`. Pages: NHM.

*bilateral_symmetry_score* — bilateral structure measurement. axis parameter
(center | mean | custom), scoring_method (ratio | residual). Output always
contains note requiring session documentation of inputs, method, and scoring
formula at first use. Pages: MIR.

*parity_analysis* — parity behavior characterization. inversion_type (point |
axis). parity_classification output: even | odd | mixed | broken.
asymmetry_index: 0.0 (perfect parity) to 1.0 (maximum asymmetry). Same session
documentation requirement as bilateral_symmetry_score. Pages: MIR.

**COS-specific:** cross_correlation requires time_axis parameter specifying
deposit ordering: created_at (researcher time) | instance_context (field time,
default) | manual (Sage-specified order, requires manual_order array).

**CLM-specific:** distance_matrix and cosine_similarity require vector_type:
embedding (default, requires embedding_status: complete) | tag (binary feature
vector) | custom (specified deposit fields as numeric dimensions). CLM surfaces
a warning — not a block — when embeddings are incomplete.

**PLANNED interfaces (3) — blocked on field energy model:**

| computation_type | Blocked on | Pages |
| --- | --- | --- |
| tribonacci_convergence | Field energy model formalization | RCT |
| lagrange_stability | Field energy model formalization | RCT |
| iit_phi | Computational tractability research | NHM |

Do not stub. Do not approximate. Contracts are defined. Implementations wait for
the research prerequisite.

**Spec authority:** ARTIS SCHEMA.md (computation library — full input/output
contracts for all 17 implementations, PLANNED interface contracts).

---

### 5.3 SCIENCE PING PIPELINE — THREE LAYERS

The bridge between a deposit landing on a Cosmology page and a computation
being run against it. Three layers, each an ARTIS function. Cosmology pages
call them; they do not implement them.

**Layer 1 — Tag-based domain mapping (deterministic, no API calls):**

A deposit's existing tags carry domain signal. ARTIS checks tags against
science_domain_mappings and returns candidate frameworks with computation hints.
Output grouped by page_code, sorted by confidence descending. Fast — runs
immediately on deposit card.

Endpoint: POST /artis/ping/tags. Input: `{ tag_ids: string[] }`. Response
includes mappings array and page_summary (count + max_confidence per page code).

**Layer 2 — Content-based scientific framing (Claude API, on-demand):**

Sage triggers from a deposit card when tag signal is insufficient or a deeper
read is wanted. ARTIS retrieves deposit content, constructs a versioned prompt,
calls Claude. Full response stored permanently in artis_layer2_snapshots with
prompt_version, prompt_text, model_version, and sage_selection.

Layer 2 prompt asks Claude to propose frameworks, not conclude. Returns
framework_candidates array (framework, reasoning, confidence, suggested_page_code).

**RCT-specific Layer 2 addition:** When caller_page_code is RCT, prompt adds:
"What aspects of this pattern fall outside what that literature accounts for?"
Returns rct_residual_candidates (unexplained aspects). This addition is
active only for RCT callers.

Endpoint: POST /artis/ping/content. Layer 2 calls are on-demand only. No
background triggers. No auto-fire on deposit creation. Sage initiates.

**ARTIS_LAYER2_RETENTION: permanent.** Claude framing responses are never deleted
or overwritten. Versioned by prompt_version. Auditable: prompt_text + model_version
+ sage_selection stored on every record.

**Layer 3 — Computation suggestion (deterministic from computation_hints):**

Sage selects a framework candidate (from Layer 1 or Layer 2). ARTIS looks up
computation_hints for the matching domain mapping. Returns suggested computations
with input templates. Sage selects and one tap executes via POST /artis/compute.

Endpoint: POST /artis/ping/suggest. Input: mapping_id (or null for Layer 2
candidates without existing mapping) + framework + page_code.

**What science ping looks like on a page:**
Deposit card shows "Science ping available." → Layer 1 instant. → Optional Layer
2 button (Claude read). → Sage selects framework. → Layer 3 suggests computation.
→ Sage runs it. → Result attaches to deposit as a Cosmology finding.
Full flow: deposit → framework → computation → finding. Each step is one action.

**Spec authority:** ARTIS SCHEMA.md (science ping pipeline — all three layers,
endpoints, input/output formats, prompt structure, Layer 2 snapshot table,
RCT-specific addition).

---

### 5.4 EXTERNAL REFERENCE REGISTRY

artis_external_references table: reference_id (auto), doi (null), url (null),
summary (required — Sage's own words, not the abstract), title (null), accessed
(date, null), page_codes (array of Cosmology page codes), tag_ids (null),
created_at, updated_at.

Summary is required. A reference without Sage's contextual summary is a citation,
not a contribution. The summary is what makes the reference embeddable for
semantic search across the registry.

Cross-page shared resource. One reference can serve multiple pages
(page_codes array). All Cosmology pages write references through ARTIS — no page
owns its own reference storage.

Endpoints: GET /artis/references (filterable by page_code, domain, tag_id,
date range), POST /artis/references.

**Spec authority:** ARTIS SCHEMA.md (artis_external_references table, constraints,
endpoint contracts).

---

### 5.5 REFERENCE DISTRIBUTION REGISTRY

artis_reference_distributions table: distribution_id (auto), name (unique),
description (required), distribution_data (jsonb — values, bins, metadata),
source (required — paper DOI, dataset name, or "computed from archive" with
methodology), page_codes (array), superseded_by (null while current), created_at,
updated_at.

Named, sourced, versioned. No anonymous baselines. A KS test or KL divergence
without a named reference distribution is incomplete. source is required —
an anonymous distribution is not a valid comparison target.

**Update = new record.** When distribution_data needs updating, the previous
version is not overwritten. A new record is created; the old record's
superseded_by is set to the new distribution_id. Distribution history is
preserved.

Cross-page: CLM, NHM, and potentially other pages draw from the same registry.
NHM uses neural model baselines; CLM uses celestial model references.

Endpoints: GET /artis/distributions, POST /artis/distributions.

**Spec authority:** ARTIS SCHEMA.md (artis_reference_distributions table,
immutability rule, update mechanics, endpoint contracts).

---

### 5.6 SCIENCE DOMAIN MAPPINGS + ARTIS ZONE B

science_domain_mappings table: mapping_id (auto), tag_id, domain, page_code,
description (required — why this tag maps to this domain), computation_hints
(jsonb — array of computation_type identifiers), confidence (1.0 = definitive,
0.5 = suggestion), active (boolean), proposed_by (sage | claude),
decline_reason (null unless proposed_by: claude and Sage declined),
created_at, updated_at.

**Claude-proposes, Sage-confirms rule:**
Claude-proposed mappings (proposed_by: claude) always start as active: false.
They enter the review queue in ARTIS Zone B. Only Sage's explicit PATCH
/artis/mappings/{id} action (active: true) makes a mapping live. A mapping
with proposed_by: claude and active: true means Sage confirmed it. If Sage
declines, decline_reason is written and active stays false.

Sage-created mappings (proposed_by: sage) start as active: true.

Retired mappings are preserved with active: false — not deleted. History is
maintained.

**ARTIS Zone B** — the registry and health surface:
- Science domain mappings management (create, review Claude proposals, confirm/decline)
- Computation snapshot history
- External reference registry browse
- Reference distribution registry
- Claude-proposed mapping review queue
- Engine health monitoring

**Spec authority:** ARTIS SCHEMA.md (science_domain_mappings table, constraint
details, PATCH contract). SYSTEM_ ARTIS.md (Zone B description, rules 3 and 8).

---

### 5.7 ARTIS API — 14 ENDPOINTS

12 core + 2 bridge namespace. Full contracts in ARTIS SCHEMA.md.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | /artis/compute | Execute computation, return result + create snapshot |
| POST | /artis/ping/tags | Layer 1 — tag-based domain mapping |
| POST | /artis/ping/content | Layer 2 — Claude scientific framing |
| POST | /artis/ping/suggest | Layer 3 — computation suggestion from hints |
| GET | /artis/snapshots/{id} | Retrieve computation snapshot by ID |
| GET | /artis/references | Query external reference registry |
| POST | /artis/references | Add external reference |
| GET | /artis/mappings | Query science domain mappings |
| POST | /artis/mappings | Create mapping |
| PATCH | /artis/mappings/{id} | Confirm/decline Claude-proposed mapping |
| GET | /artis/distributions | List reference distributions |
| POST | /artis/distributions | Add reference distribution |
| GET | /artis/bridge/prior-check | Bridge — prior computation check by deposit set |
| GET | /artis/bridge/cross-page | Bridge — cross-page snapshot query by deposit set |

**POST /artis/compute** validation: computation_type must match registered
computation (PLANNED types return error_code: computation_not_implemented),
caller_page_code must be valid, deposit_ids minimum 1, inputs all required
fields, parameters all valid values.

**Failure response always includes snapshot_id** — a failed computation still
creates a snapshot. error_code + message + snapshot_id returned on failure.

**Bridge endpoints** (for research assistant Cosmology bridge):
GET /artis/bridge/prior-check — deposit_ids (required), computation_type
(optional), page_code (optional). Returns { found: bool, snapshots: [...] }.
found: true means surface the prior result before suggesting new computation.

GET /artis/bridge/cross-page — deposit_ids (required). Returns { cross_page_count:
int, pages: [{ page_code, snapshot_count, snapshots }] }. cross_page_count >= 2
triggers proactive synthesis offer from the research assistant.

**Spec authority:** ARTIS SCHEMA.md (all 14 endpoint contracts, validation rules,
bridge namespace section).

---

### 5.8 cosmology_findings — SHARED TABLE + STATUS TRANSITIONS

Single shared table across all six investigation pages, discriminated by
page_code. Every finding carries mandatory computation evidence.

**Table fields:** finding_id (auto), page_code (HCO | COS | CLM | NHM | MIR |
RCT), deposit_ids (array, minimum 1), framework (the scientific framework),
hypothesis (structurally testable claim), computation_snapshot_id (required —
FK to artis_computation_snapshots), result_summary (Sage's interpretation),
values (jsonb — statistical output, p-values, coefficients, etc.), confidence
(float, 0.0–1.0 — Sage's research significance assessment, not statistical
significance), external_reference_id (null), nexus_eligible (boolean, default
false), status (enum), superseded_by (null), abandoned_reason (null),
created_at, updated_at.

**hypothesis constraint:** no significance language, no outcome language, no
predictive weight. Same constraint as PCV hypothesis_statement.

**Status transitions:**

| From | To | Constraint |
| --- | --- | --- |
| draft | confirmed | Sage action |
| draft | abandoned | abandoned_reason required |
| confirmed | superseded | superseded_by required (same page_code) |
| confirmed | abandoned | abandoned_reason required |
| superseded | — | Terminal |
| abandoned | — | Terminal |

Terminal states are research data. Abandoned = dead end. Superseded = replaced.
Both preserved permanently.

**Key rules:**
- computation_snapshot_id required. No finding without a computation.
- nexus_eligible: true requires status: confirmed. Draft findings cannot enter PCV.
- Multiple findings per deposit-framework pair are allowed.
  computation_snapshot_id is the differentiator — different runs on same deposits
  + framework produce distinct findings.
- COS deposits minimum 1 (warning when < 2, not rejection — coupling analysis
  semantically requires 2+ but edge cases are allowed).
- Statistical significance (p-values, coefficients) lives in values jsonb.
  confidence on the finding is Sage's research significance judgment.

**Spec authority:** COSMOLOGY SCHEMA.md (full table definition, status transition
table, constraints, failure modes). SYSTEM_ Cosmology.md (ownership, finding
lifecycle management).

---

### 5.9 rct_residuals — RCT-SPECIFIC TABLE

The delta between what established science predicts and what the field produces.
Where new physics lives. Each residual is a discrete research signal — not a
finding, not a hypothesis, not a conclusion.

**Table fields:** residual_id (auto), source_finding_id (FK to
cosmology_findings, page_code: RCT), algorithm_component (lagrange | tribonacci
| fibonacci | oscillation | combined), known_science_predict (what the math says
the value should be), field_produces (what the field actually shows), delta
(the gap, described with precision — not "differs from" but "exceeds by N" or
"reverses direction" or "maintains ratio outside expected range"),
computation_ref (FK to artis_computation_snapshots), nexus_eligible (boolean,
default false), created_at.

**Immutable after creation.** The observed delta at detection time is the record.
New data produces new residuals — the original is never updated.

**Accumulation tracking:** Residuals accumulate per algorithm_component. When
the threshold (calibration item) is reached, RCT surfaces a prompt to Sage:
"N residuals on [component] — consider producing a standard finding." Sage
decides. This is not automatic — it is a prompted optional synthesis. The
standard finding references all contributing residual_ids in its values jsonb
(key: contributing_residual_ids).

**Residuals are RCT's unique output.** Every other Cosmology page produces
findings that correspond to known science. RCT produces findings at the edge of
what the known science explains — and residuals that document where that edge is.

**Spec authority:** COSMOLOGY SCHEMA.md (rct_residuals table, immutability,
accumulation tracking, RCT residual flow pipeline).

---

### 5.10 PER-PAGE INVESTIGATION SURFACES

Six parallel pages. All call ARTIS for computation. All write to
cosmology_findings. Differences: which frameworks, which computations, which
visualizations.

---

**HCO·34 — Harmonic Cosmology**
Wave mechanics, harmonics, signal processing, Fourier analysis.
CMB connection: power spectrum analysis, harmonic decomposition.
Primary computations: fft_decomposition, power_spectral_density, shannon_entropy,
chi2_contingency.
Layout: two-panel (field pattern left, harmonic analysis right).
Signature visualization: frequency spectrum with labeled peaks. LayerCake + D3.

---

**COS·35 — Coupling / Oscillation**
Coupled oscillator dynamics, phase-locking, cross-frequency coupling.
Primary computations: pearson_correlation, spearman_correlation, cross_correlation
(with time_axis param), chi2_contingency, phase_coherence.
COS is the only page that submits 2+ deposit_ids per finding (coupled pairs).
Layout: two-panel (field pattern with pairs left, coupling analysis right).
Signature visualization: correlation scatter plot. LayerCake + D3.

---

**CLM·36 — Celestial Mechanics**
Geometry, topology, orbital dynamics, spatial structure. CMB connection:
cosmological structure, large-scale pattern organization.
Primary computations: distance_matrix, cosine_similarity, hierarchical_clustering,
chi2_contingency, ks_two_sample.
CLM dependency: embedding pipeline (vector_type: embedding default; tag or
custom as fallback when embeddings incomplete).
Layout: two-panel (field pattern left, geometric analysis right).
Signature visualization: cluster dendrogram / distance heatmap. LayerCake + D3.

---

**NHM·37 — Neuro-Harmonics**
Neural dynamics, cognitive models, information theory, IIT.
Shannon's primary investigation surface. NHM uses artis_reference_distributions
for KL divergence and KS test baselines (neural model references).
Primary computations: shannon_entropy, kl_divergence, chi2_contingency,
ks_two_sample, phi_proxy.
phi_proxy always carries the approximation disclaimer. True IIT phi is a PLANNED
interface (iit_phi), blocked on computational tractability research.
Layout: two-panel (field pattern left, neural/information analysis right).
Signature visualization: entropy comparison bar (observed / expected-random /
expected-structured). LayerCake + D3.

---

**MIR·38 — Chiral Mechanics**
Symmetry physics, mirror dynamics, chirality. The l04 Mirror tagger layer's
investigation surface — the layer that had no Cosmology page before MIR.
Symmetry breaks carry equal analytical weight as symmetry correspondence.
Primary computations: bilateral_symmetry_score, parity_analysis,
pearson_correlation, chi2_contingency.
Custom implementations (bilateral_symmetry_score, parity_analysis) require
explicit session documentation of inputs, method, and scoring formula at
first use.
Layout: two-panel (field pattern with bilateral display left, symmetry results right).
Signature visualization: MirrorSymmetryDisplay — bilateral structure mapping
with explicit scoring. LayerCake + D3.

---

**RCT·39 — Resonance Complexity Theory**
The physics algorithm the field itself generated: Lagrangian mechanics,
Tribonacci/Fibonacci sequences, oscillatory dynamics. Present consistently
across harmonics, Ven'ai, octaves, thresholds, symbols.

RCT is parallel to the other five pages, NOT meta-Cosmology, NOT a synthesis
capstone. Its source material is the cross-domain recurrence of a specific pattern.

Three functions:
1. Science ping (same pipeline, more precise target — Lagrangian and
   Fibonacci/Tribonacci literature directly, plus Layer 2 residual candidates)
2. Residual detection (the delta between what established science predicts
   and what the field produces — rct_residuals output)
3. Cross-archive recurrence tracking (supporting function, feeds 1 and 2)

Primary computations: frequency_ratio_analysis, chi2_contingency,
tribonacci_convergence (PLANNED), lagrange_stability (PLANNED).

Three-panel layout (unique among Cosmology pages):
- Left: field pattern and algorithm identification, cross-archive recurrence
- Center: science ping results, established literature matches, computation results
- Right: residual panel — the delta, accumulating residuals, the shape of what
  the algorithm is doing that the literature hasn't named yet

**Spec authority:** COSMOLOGY SCHEMA.md (per-page investigation surfaces section
— all 6 pages with frameworks, computations, layouts, notes).

---

### 5.11 FINDING CARD + NEXUS RECURSIVE FEEDBACK LOOP

**Finding card layout — four zones (applies to all six pages):**

1. Identity — finding_id, page_code badge, status badge, created_at
2. Framework + hypothesis — framework name, hypothesis statement
3. Computation — computation_type, result_summary, link to ARTIS snapshot
   (expandable to show full inputs / parameters / raw_output)
4. Result + confidence + reference — values display (p-values, coefficients,
   entropy values), confidence bar (Sage's research significance), external
   reference link if present

**Three action buttons:**
- Confirm — draft → confirmed
- Abandon — any live status → abandoned (requires abandoned_reason)
- Mark nexus-eligible — confirmed only → nexus_eligible: true → enters PCV pipeline

**Finding placement:** inline indicator on deposit card ("3 findings" → expand
to see cards) AND separate findings panel on the page. Both surfaces.

**Nexus recursive feedback loop:**

```
Sage confirms finding (status: confirmed)
  → Sage marks nexus_eligible: true
  → Routes to PCV as hypothesis (cosmology_provenance: true,
    cosmology_finding_ref: finding_id)
  → PCV creates pattern record with hypothesis_id (H · YYYY-MM · SEQ)
  → Threads through DTX → SGR
  → Graded finding available for next Cosmology investigation cycle
```

**Circularity protection:** cosmology_provenance flag on PCV pattern records.
Downstream systems (SGR, Void's Claude tool, MTM provenance filter) check this
flag. A finding that enters PCV and gets graded is not independent evidence of
the computation that generated it. This protection is structural — built into
the provenance flag system, not procedural.

**Spec authority:** COSMOLOGY SCHEMA.md (finding card layout, nexus feedback
loop, PCV cascade requirements). PATTERN CONVERGENCE SCHEMA.md
(cosmology_provenance validation, rule 3a, circularity protection).

---

### 5.12 LNV ROUTING — CONTENT SHAPES

Cosmology produces two entry_types for LNV. Both defined in LNV SCHEMA.md
entry_type expansion (Tier 5 addition).

**entry_type: cosmology_finding**
Sage-triggered from finding card or findings panel. Confirmed findings only.
Content: finding_id, page_code, framework, hypothesis, computation_snapshot_id,
result_summary, values, confidence, external_reference_id, nexus_eligible,
deposit_ids.
source_system: page_code (hco | cos | clm | nhm | mir | rct).
Not AI-authored — no prompt_version on this entry type.

**entry_type: rct_residual**
Automatic on rct_residual creation. No Sage action required.
Content: residual_id, algorithm_component, known_science_predict, field_produces,
delta, computation_ref, source_deposits (derived at route time from
source_finding.deposit_ids — not stored on the residual), accumulation_count
(snapshot at route time, sealed in the LNV entry, not a live counter).
source_system: rct.

**source_deposits note:** The residual records the delta, not the deposits. The
deposits are on the source finding. source_deposits is assembled at LNV route
time by reading source_finding_id → cosmology_findings.deposit_ids.

**accumulation_count note:** Sealed in the LNV entry at route time. Shows how
many residuals existed on this algorithm_component when this one was created. It
does not update if more residuals are added later — it is a historical record of
accumulation state at detection time.

**Spec authority:** COSMOLOGY SCHEMA.md (LNV routing content shapes section).
LNV SCHEMA.md (entry_type expansion history, cosmology_finding and rct_residual
content shapes).

---

### 5.13 RCT RESIDUAL FULL PIPELINE

```
Field pattern identified on RCT page
  → Function 1: Science ping (POST /artis/ping/tags → Layer 1)
      → Established literature matches (Lagrangian, Fibonacci, Tribonacci)
      → Optional: Layer 2 Claude framing (POST /artis/ping/content,
         caller_page_code: RCT) → rct_residual_candidates surfaced
  → Function 3: Cross-archive recurrence check (supporting)
  → Delta identified between prediction and field behavior
  → ARTIS computation quantifies delta (POST /artis/compute)
      → artis_computation_snapshots record written (immutable)
  → cosmology_finding created (page_code: RCT, status: draft)
  → Sage confirms finding (status: confirmed)
  → rct_residual record created (immutable after creation)
      → Routes to LNV immediately (POST /api/lnv/receive,
         entry_type: rct_residual, automatic)
  → Accumulation tracked in RCT internally
  → Threshold reached (calibration item)
  → Sage prompted: "N residuals on [component]"
  → Sage decides whether to produce standard finding (optional)
  → If yes: new cosmology_finding (page_code: RCT)
      → values jsonb contains contributing_residual_ids
      → Routes to LNV (entry_type: cosmology_finding, Sage-triggered)
      → If nexus_eligible: routes to PCV (cosmology_provenance: true)
```

Residuals in LNV stay as-is. The synthesizing finding does not replace them
— it synthesizes across them. Both the individual residuals and the synthesized
finding are research data. Neither is superseded by the other.

**Spec authority:** COSMOLOGY SCHEMA.md (RCT residual flow section, RCT
investigation surface).

---

### 5.14 PIPELINE SEGMENT — TIER 5

**Deposit → Cosmology finding flow (any of six pages):**

```
Deposit arrives on Cosmology page (via INT routing)
  → Science ping available indicator shown on deposit card
  → Layer 1: POST /artis/ping/tags — instant, deterministic
      → Candidate frameworks + computation hints displayed
  → Optional Layer 2: POST /artis/ping/content (Sage-triggered)
      → Claude framing → framework_candidates + (RCT only) rct_residual_candidates
      → artis_layer2_snapshots record written (permanent)
      → Sage selects framework candidate
  → Layer 3: POST /artis/ping/suggest — computation suggestions from hints
  → Sage runs computation: POST /artis/compute
      → artis_computation_snapshots record written (immutable)
      → result_summary + raw_output returned
  → Sage creates finding: POST /cosmology/findings
      → cosmology_finding record written (status: draft)
      → computation_snapshot_id required
  → Sage confirms finding: PATCH /cosmology/findings/{id}/confirm
      → status: draft → confirmed
  → Optional: Sage routes to LNV: POST /cosmology/findings/{id}/route-lnv
      → POST /api/lnv/receive (entry_type: cosmology_finding)
  → Optional: Sage marks nexus-eligible: PATCH /cosmology/findings/{id}/nexus
      → nexus_eligible: true (requires confirmed status)
      → POST /pcv/patterns (cosmology_provenance: true)
      → hypothesis_id assigned → threads DTX → SGR
```

**RCT residual flow (in addition to standard finding flow):**

```
RCT finding confirmed
  → Delta identified → POST /artis/compute
  → rct_residual created → routes to LNV automatically
  → Accumulation tracked → threshold prompt (calibration item)
  → Optional synthesis finding (Sage decision)
```

**Bridge cross-page synthesis path (research assistant):**

```
Research assistant calls GET /artis/bridge/cross-page?deposit_ids=...
  → cross_page_count returned
  → If cross_page_count >= 2: proactive synthesis offer surfaced once
  → Research assistant calls GET /cosmology/findings/group?deposit_ids=...
      → Findings from all pages for that deposit set returned
  → assemble_group_synthesis() in rag.py assembles plain language synthesis
  → Synthesis surfaces conversationally (does not produce a new finding)
```

---

---

## TIER 6 — RESEARCH ASSISTANT + AUDIO

**Status:** NOT STARTED (audit not reached)

---

## TIER 7 — OBSERVATORY + NOTIFICATIONS + EXPORT

**Status:** NOT STARTED (audit not reached)

---

## TIER 8 — STRESS TEST + SOT

**Status:** NOT STARTED (audit not reached)
