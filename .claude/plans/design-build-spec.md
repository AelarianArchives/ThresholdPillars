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

### 2.3–2.18 REMAINING SECTIONS (review in progress)

The following sections are pending Sage review. They will be added to
this document as each passes audit:

- ~~UI Architecture Foundation~~ — removed, deferred to master layout doc
- ~~Shared Shell + Navigation Contract~~ — removed, deferred to master layout doc
- Deposit Card Component
- ~~Page Load + Empty State~~ — removed, deferred to master layout doc
- Black Pearl Panel Interaction Spec
- Session Schema
- Instance Context
- Deposit Weight AI Suggestion
- Observatory Spec
- Duplicate Prevention on Re-Route
- Engine Baseline Recalibration
- AOS (Automated Observation Signal)
- Deposit Genealogy View
- Annotation Layer
- WSC HOLDING note
- Pipeline Segment (Tier 2)

**Already categorized — do not transfer:**
- DEAD: Sub-rhythms, Curation panel, Reflective Pearl Constellation,
  Page Identity type system, Page-Type Layout Anatomy, Session Opening
  Ritual, Research Velocity Indicator
- DRIFT: UI Error States (belongs in Pulse)

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
