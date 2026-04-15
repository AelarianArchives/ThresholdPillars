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

### 2.2 VOID — PAGE 51

page_code: VOI. section_id: void. Standalone page 52.
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
