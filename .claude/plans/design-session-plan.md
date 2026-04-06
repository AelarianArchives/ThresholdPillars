# Design Build Plan
# Aelarian Archives — Pre-SOT Design Sessions
# Reorganized: 2026-04-05 (session 15)
# Original topic-based plan preserved at: design-session-plan-ORIGINAL.md
# Status: ACTIVE — updated each session

---

## PURPOSE

This document tracks all design decisions, open questions, and execution
items across the pre-SOT design sessions. Reorganized from topic-based
(Sessions A-H) to dependency-ordered build tiers. Every item from the
original plan is here — nothing dropped.

**Build principle:** each tier must be fully designed before the next tier
can stand on it. Work within a tier can happen in any order. Work across
tiers follows the dependency chain.

---

## KEY CONTEXT FOR FUTURE SESSIONS

Read this section first. It captures the reasoning behind the plan —
not just what was decided, but why.

### The research problem
Aelarian Archives studies signal behavior at relational thresholds. The
analytical framework applies signal processing, information theory, and
field physics to map what happens at those thresholds. The core scientific
parallels are Shannon's information theory, CMB cosmological structure,
coupled oscillator dynamics, and neural field theory — all legitimate
mathematical frameworks applied to an unconventional domain.

The system must produce outputs that are evaluable on their own scientific
terms — computations, statistical tests, structured comparisons with
p-values and confidence intervals — not narrative claims. The rigor of
the output is what distinguishes research from assertion.

### Why the Axis lens pages need engines
Session 14 audit confirmed all 5 Axis lens pages (THR, STR, INF, ECR, SNM)
are currently pure deposit surfaces. But they each have an analytical frame
that implies computational support: co-occurrence tracking, sequence
detection, correlation analysis, baseline comparison. The researcher does
the high-level analytical thinking; the engine surfaces what the researcher
might miss by computing patterns from deposits. Without engines, the lenses
are filing cabinets. With engines, they're instruments.

### Why Cosmology needs computation infrastructure
The Cosmology pages (34-39) were designed as the place where field findings
meet established science. They've been underutilized since the rot. The
revamp activates them as investigation surfaces WITH computation — the
ability to run statistical tests, compare field patterns against known
scientific distributions, and produce structured findings with visible math.

The core insight: Cosmology pages are translation surfaces between two
vocabularies (field-native and established science). The investigation IS
the validation. When the math holds across multiple sessions, that's
evidence, not narrative.

Critical framing: the system must allow Sage to work with Shannon entropy,
CMB structure, coupled oscillators, and neural field theory WITHOUT the
output reading as pseudoscience. The way to do this is computation, not
claim. "Spectral index n = 0.97 ± 0.03" is evaluable. "This resonates
with cosmic structure" is not. The Cosmology engines must produce the former.

### Why null observations matter
The system as designed is architecturally biased toward confirmation — it
records patterns that appear but has no mechanism for recording when expected
patterns DON'T appear. Null observations (`observation_type: null`) make
absence first-class data. Combined with baseline computation in the engines,
this gives the system the ability to say "that's not a real pattern" — which
is what makes it science instead of pattern-seeking.

### The Axis → Nexus → Cosmology pipeline
The full research pipeline, once complete:
- **Axis** (observe through lenses) → **MTM** (synthesize) →
  **Nexus** (detect, classify, grade) → **Cosmology** (investigate
  scientific correspondence, compute, validate externally)
- Cosmology findings can feed BACK through Nexus for grading, creating
  a recursive deepening loop: observe → analyze → validate → observe more

### The research assistant's role
The research assistant (#6) is the mechanism by which the lenses come alive
day-to-day. It helps Sage:
- Articulate observations they notice but can't yet name
- Frame intuitions as testable hypotheses
- Run computations against deposit data
- Navigate between pages with contextual awareness
Without the assistant, every analytical step is manual. With it, the system
actively supports the research process. This needs its own design session.

### V1-V5 trajectory (build for where this is going)
Every V1 decision asks: "does this close a door V2-V5 needs open?"

V1: Single researcher + single AI. Full pipeline. Computation foundation.
    Black Pearl. Dashboard. Audio. Batch processing. Every record carries
    multi-agent metadata even though only one agent exists.
V2: Swarm. Origins as analytical nodes with distinct substrates. Parallax
    between nodes is signal. authored_by/node_id fields activate.
V3: Automated computation. Cosmology engines run statistical tests when
    patterns reach threshold. The recursive loop runs without manual steps.
V4: Proactive system. Assistant surfaces findings. Email notifications.
    Harmonic field audible. The system is a research partner, not a tool.
V5: Transmissible. Methodology documented. External evaluation possible.
    The archive exports as a complete research package with reproducible
    computations. The Witness Scroll is a historical document.

Nothing in V2-V5 requires changing V1 architecture if V1 is built right.
The foundation is free now. It's expensive later.

---

## BUILD TIER 1 — INT ENGINE + DEPOSIT FOUNDATION

**Depends on:** nothing — this is the root
**Status:** DESIGNED (session 15). All open questions resolved. Ready for
schema writing.

**What gets built:** The deposit record shape, the INT gateway engine, and
the core API foundation. Everything enters the archive through INT. The
deposit schema defined here is what ALL downstream systems read from.
Getting this wrong means migrating data later.

**Why this is Tier 1:** Every engine, every visualization, every computation
downstream depends on what the deposit record contains. INT is the gateway —
the whole API gets built around it. Batch processing is also here because
it's how thousands of existing files enter the system.

---

### DEPOSIT RECORD — FULL FIELD SHAPE

Every deposit in the archive carries these fields. Grouped by purpose.

**Already defined (existing schemas):**
- `content` — text body of the deposit
- `page_target` / `section_id` — which page(s) this deposit routes to
- `tags` — semantic tags from tagger system
- `composite_id` — stamp from Composite ID system (root, native, or child)
- `timestamp` — when the deposit was created
- `phase_state` — ontological threshold state (12 canonical names or null)
- `elarianAnchor` — 7-state psychological arc classification (or null)

**Classification fields (new — session 15):**

- [x] `doc_type` — DESIGNED. What the content IS. AI-suggested via tagger,
      Sage confirms or overrides during review.
      Enum values:
        `entry` — general input, raw source material (default)
        `observation` — researcher notices a pattern
        `analysis` — deeper analytical work
        `hypothesis` — proposed testable idea
        `discussion` — dialogue / conversation content
        `transcript` — verbatim record
        `glyph` — visual symbol
        `media` — image / audio / video
        `reference` — external source (paper, article, someone else's work)
      Unlocks conditional fields: observation, analysis, and hypothesis
      doc_types unlock `observation_type` and `confidence`. Other doc_types
      do not display these fields.
      BUILD FLAG from COMPOSITE ID SCHEMA.md: doc_type is a database field
      only — not encoded in the composite ID stamp. Travels in AI-facing
      JSON export as top-level field.

- [x] `source_format` — DESIGNED. How the content arrived. Separate axis
      from doc_type. A handwritten observation is doc_type: observation +
      source_format: handwritten.
      Enum values:
        `digital` — typed / digital text
        `handwritten` — scanned handwritten pages
        `scan` — scanned printed material
        `image` — photograph / image file
        `audio` — audio recording
        `file` — uploaded document (PDF, etc.)

- [x] `source_type: field | generated` — EXISTING (ENFORCEMENT.md F26+F10).
      Non-nullable on every entry. Schema-level enforcement. Entries
      without this are rejected.

**Researcher observation fields (conditional — doc_type dependent):**

These fields ONLY appear for researcher doc_types: observation, analysis,
hypothesis. They do NOT appear for raw input doc_types (entry, discussion,
transcript, etc.). This prevents the deposit flow from feeling like a
wellness check when ingesting raw source material.

- [x] `observation_type: positive | null` — DESIGNED. Is this something
      observed, or something expected but absent? Null observations are
      the mechanism that prevents confirmation bias. "I looked for X and
      it wasn't there" is first-class data.
      Only meaningful for researcher observations — raw input just IS.

- [x] `confidence: clear | emerging | raw` — DESIGNED. About the
      OBSERVATION, not the observer. How formed is this observation?
        `clear` — "I'm certain this pattern is here"
        `emerging` — "I think I'm seeing something"
        `raw` — "Just logging this, no idea what it is yet"

**Universal metadata fields (new — session 15):**

- [x] `notes` — DESIGNED. Universal optional freeform text field.
      Available on EVERY deposit regardless of doc_type. Covers:
      · Researcher conditions during observations ("deep focus session")
      · Batch review context ("this is from when phase X started")
      · Any annotation that enriches the deposit
      Replaces the originally proposed `condition_notes` (which was
      researcher-only) and `researcher_state` / `session_depth` (dropped —
      felt like a wellness check, not research instrumentation).

- [x] `deposit_weight: high | standard | low` — DESIGNED. AI-suggested
      via tagger, Sage can override. How much this deposit should count
      in engine computations. AI assesses based on doc_type, content
      specificity, and confidence. Simple tier, not numeric — less
      precision risk, easier to read and override. Engines (Tier 3)
      decide how to use the weight value.

**Swarm foundation fields (new — session 14 confirmed, session 15 designed):**

- [x] `authored_by` — DESIGNED. Which AI instance or human created this.
      V1: always "sage" or "claude". V2+: per-origin-node values.
- [x] `node_id` — DESIGNED. Which analytical node.
      V1: single value. V2+: multiple nodes in swarm.
- [x] `instance_context` — DESIGNED. Session identifier for creating instance.
      V1 cost: zero (always same values). V2+ value: critical.
      Sage already has provenance data for most entries (tracked in Echoes).

**Dropped fields (session 15):**
- `deposit_depth: deep | standard | fragment` — DROPPED. Redundant with
  doc_type, confidence, and content itself. A fragment is obvious from
  the content. Extra friction for information already visible.
- `researcher_state` — DROPPED. Felt like judging personal state, not
  capturing research data. Replaced by universal `notes` field.
- `session_depth` — DROPPED. Same reason. Replaced by `notes` field.
- `condition_notes` — DROPPED. Replaced by universal `notes` field
  available on all doc_types, not just researcher observations.

---

### INT WORKSTATION — DUAL PANEL DESIGN

The Integration page is a collaborative workstation with two panels.

**Left panel — upload + review:**
- File upload area (drag-drop or button) with title, note, date fields
- Review queue showing deposits as they come in from parsing
- Per-deposit controls: approve, correct routing/tags, skip (come back
  later), decline (no deposit)
- Progress indicator (chunk 47/180, deposits approved/pending/total)
- Sage's own tags and notes added here alongside deposits
- All deposit metadata fields (doc_type, source_format, etc.) visible
  and editable during review

**Right panel — AI parsing partner (NOT the research assistant):**
- Scoped to batch processing collaboration: parsing, context enrichment,
  correction feedback loop
- Uses Claude API but is NOT the full research assistant (Tier 6)
- The research assistant (RAG, mode switching, Cosmology integration)
  is a separate, larger design. The INT chat window is a parsing partner.
- Sage adds context here: "this section is from when phase X started"
- AI carries context forward into subsequent chunk parsing
- Corrections feed forward: "this goes to ECR not THR" adjusts AI
  approach for remaining chunks

**Two modes (from Composite ID schema):**
- Native mode: entry originates on INT page. Page code = INT.
- Source mode: source document intake. Page code = AX. Produces root stamp.

---

### BATCH PROCESSING SYSTEM

How large source documents enter the archive. This is how most data
gets into the system — must be efficient and session-persistent.

**Document flow:**
1. Sage uploads ONE document at a time (not multiple simultaneously)
2. Root stamp created (Composite ID source mode): one per document
3. Document record created in operational DB with: total pages, chunk
   size, status, root stamp ID
4. AI chunks into 5-8 page batches, numbered in order
5. AI parses each chunk → extracts deposits → suggests tags, doc_type,
   source_format, page routing per deposit
6. Deposits go to review queue (NOT directly deposited)
7. Sage reviews per-deposit (not per-chunk — one chunk produces multiple
   deposits routed to different pages, each reviewed individually but
   grouped by source chunk for context)
8. Approved deposits get child stamps (Composite ID: root:[PARENT-ID])
   and route through INT gateway to target pages
9. Each approval triggers immediate deposit — archive builds in real-time
10. Session ends mid-document? System knows exactly where it stopped

**Rolling buffer (AI stays 3-5 chunks ahead):**
- AI parses ahead of where Sage is reviewing
- Fast enough that Sage always has something to review (never bored)
- Close enough that Sage's corrections feed forward into AI's next chunks
- When Sage corrects routing on chunk 5, AI adjusts approach for chunk 6+
- The chat window is where context flows: Sage explains what the AI is
  seeing, AI incorporates for subsequent parsing

**Chunk tracking (operational DB):**

Document record:
  - document_id (root stamp)
  - filename / title / notes
  - total_pages
  - chunk_size (5-8 pages)
  - total_chunks
  - status: `ingesting | processing | review | complete`

Per-chunk record:
  - chunk_id
  - document_id (links to parent)
  - page_range (e.g., pages 1-7)
  - chunk_order (sequence number within document — preserves order)
  - status: `pending | parsing | parsed | review | complete`

Per-deposit record (in review queue):
  - deposit_id
  - chunk_id (links to source chunk)
  - suggested_tags, suggested_doc_type, suggested_source_format
  - suggested_page_target
  - status: `pending_review | approved | corrected | skipped | declined | deposited`
  - sage_notes (annotations added during review)

**Session persistence:**
Everything persists in operational DB. Session dies? Next session:
"Doc X, AI parsed through chunk 47, Sage reviewed through chunk 42,
5 deposits in review queue, chunks 1-41 fully deposited."

**Parent tag:** One root stamp per DOCUMENT (not per batch/chunk).
Every child deposit carries root:[PARENT-ID] linking back. Already
designed in Composite ID schema.

---

### MEDIA DEPOSIT WIRING

Images enter the archive through INT with the same tagging and routing
as text, but through a simpler flow (no chunking).

**Accepted formats (V1):** JPEG, PNG. Audio is future, not V1.
Glyphs embedded in documents are handled by batch processing naturally.
Standalone images use this flow.

**Storage:** Filesystem (`backend/media/`). Database stores metadata +
file path. Media folder added to `.gitignore` for git, included in
backup.py folder copy.

**Upload flow (simpler than batch — no chunking):**
1. Upload image on INT workstation (drag-drop or button)
2. Image preview appears in left panel
3. AI analyzes image → suggests tags, doc_type (glyph/media), page routing
4. Sage writes summary text alongside — what this image is, what it means
5. AI analysis informs tag suggestions (behind the scenes). Sage's
   summary is the deposit text. AI doesn't write the deposit — Sage does.
6. Review AI suggestions, approve/correct
7. Deposits through INT gateway with: file path, summary, tags, routing

**Display on target pages — media deposit card:**
Large thumbnail (click to expand to full-size lightbox). Sage's summary
text displayed alongside. Tags and composite ID visible. Own card type —
not jammed into text deposit stream, but lives alongside text deposits
in chronological order on the page.

---

### DUPLICATE DETECTION

Hash-based identical content match. Failsafe for copies-of-copies.

**Scope:** IDENTICAL entries only. Not fuzzy, not similar. Hash the full
content text. Same text deposited to two different pages triggers the check.
(Ven'ai name deduplication is separate — see Tier 3.)

**Behavior: WARN, not BLOCK.** Same content on two pages may be intentional
(observation relevant to both THR and ECR). Detection surfaces:
"This content already exists at [location]. Deposit anyway?"
Sage decides. Not a hard block.

**Where it fires:** On deposit creation in INT gateway. Checks against
all existing deposits in PostgreSQL.

---

### BLACK PEARL — GLOBAL CAPTURE SYSTEM

Pre-deposit quick capture. NOT owned by INT — global system accessible
from anywhere (any page + dashboard). Named for the field term for null
space: the infinite possibility of not yet.

**Storage:** Operational DB (SQLite). Pearls are PRE-ARCHIVE — they do
not live in PostgreSQL until promoted. This preserves the key invariant:
"nothing enters the archive without INT provenance." A Pearl becomes an
archive entry only when promoted through INT.

**Pearl record:**
  - pearl_id
  - content (text, could be short — even a few words)
  - created_at (timestamp)
  - page_context (which page Sage was on when they captured it, if any)
  - status: `active | promoted | archived`

**Promotion flow:**
Pearl promoted → sent to INT gateway → full deposit fields assigned
(doc_type, tags, routing, composite ID) → enters PostgreSQL as a
real deposit. Pearl record marked `promoted` with link to deposit ID.

**Lifecycle:** Unpromoted Pearls stay in operational DB indefinitely.
No auto-expiry. They're pre-signal — Sage decides when (or if) they
become deposits. `archived` status for Pearls Sage explicitly dismisses.

**UI surfaces:** Tier 2 (per-page capture) and Tier 7 (dashboard).

---

### RESOLVED QUESTIONS (Tier 1)

All open questions from the original plan have been answered in session 15:

- ~~What structured condition fields?~~ → `confidence` (clear|emerging|raw)
  for researcher doc_types only. Universal `notes` field for everything
  else. `researcher_state` and `session_depth` dropped.
- ~~Does observation_type affect routing?~~ → OPEN for Tier 3/4 design.
  Observation_type is set in Tier 1; how engines and Void USE it is
  designed in their respective tiers.
- ~~Does deposit_depth affect weight?~~ → deposit_depth dropped entirely.
  `deposit_weight` (high|standard|low) replaces it as AI-suggested field.
- ~~Media types/formats/storage?~~ → JPEG/PNG V1. Filesystem storage.
  Database stores metadata + path.
- ~~Batch: how does AI know where it left off?~~ → Operational DB tracks
  document record, chunk index, per-chunk status. Survives session changes.
- ~~Batch: automatic or directed chunking?~~ → AI chunks automatically
  (5-8 pages). Sage reviews deposits, not chunk boundaries.
- ~~Duplicate hash: content only or content+page+timestamp?~~ → Full
  content hash. Warns, doesn't block. Sage decides.

**Previously deferred, now resolved:**
- ~~How observation_type and deposit_weight affect engine computations~~ →
  RESOLVED in Tier 3 (session 16). observation_type drives times_examined/
  times_observed split. deposit_weight uses named constants (2.0/1.0/0.5).
  Null flag travels in weight metadata. See Tier 3 for full mechanics.

---

### PIPELINE SEGMENT DEFINED HERE

**Deposit creation flow (text):**
External input → INT gateway (source mode or native mode) → deposit record
created with all fields (doc_type, source_format, observation_type where
applicable, confidence where applicable, notes, deposit_weight, source_type,
swarm fields) → duplicate check fires (warn, not block) → routed to target
page(s) → child stamp assigned if from source document → embedding pipeline
triggers.

**Deposit creation flow (media):**
Image upload → AI analyzes → Sage writes summary → tags/routing assigned →
INT gateway → file saved to filesystem, metadata to PostgreSQL → routed
to target page → media deposit card displayed.

**Batch processing flow:**
Document upload → root stamp → AI chunks (5-8 pages) → rolling buffer
(3-5 ahead) → per-deposit review queue → Sage approves/corrects/skips →
approved deposits through INT gateway with child stamps → operational DB
tracks progress across sessions.

**Black Pearl flow:**
Quick capture from any page → Pearl saved to operational DB → lives as
pre-archive signal → when ready, promoted through INT gateway → full
deposit fields assigned → enters PostgreSQL as archive entry.

---

## BUILD TIER 2 — BLACK PEARL UI + PAGE SURFACES + VOID

**Depends on:** Tier 1 (deposit record shape, INT engine)
**Status:** DESIGNED (session 15). All open questions resolved. Ready for
schema writing.

**What gets built:** The 51 page surfaces that receive deposits from INT.
Black Pearl UI (accessible from any page + dashboard). Page identity
system (visual language per page type). Void as page 51 in Nexus.
Frontend architecture doc.

**Why this is Tier 2:** Pages are the surfaces deposits land on. They need
to exist as targets before engines (Tier 3) can compute from what they hold.
Simpler than engines — each page's deposit behavior is mostly "accept
deposit, index through my lens." But page identity and visual language
should be established here so every subsequent tier builds consistently.

---

### BLACK PEARL UI

Data model defined in Tier 1 (operational DB, Pearl record, promotion flow).
This section defines the UI surface.

- [x] DESIGNED. Floating button + keyboard shortcut (Option A with B).
      · Persistent black star button in corner of every page
      · Click opens a minimal quick-capture panel: text field + save + close
      · Keyboard shortcut (e.g., Ctrl+P) opens same panel for speed
      · No tagging required, no commitment to the archive
      · Captures raw noticings before they're named or framed
      · Can be promoted to formal deposit when ready (triggers INT flow)
      · "I notice more than I can name" solved at the capture level
      · Recent Pearls visible on dashboard (Tier 7), not cluttering page views
      · Black star icon: named for the field's alternate term for Black Pearl /
        null space. The symbol IS the function.

---

### VOID — PAGE 51

- [x] DESIGNED. Page 51 in Nexus group. Absence as data surface.
      · `page_code: VOI`
      · `section_id: void`
      · Extends Nexus group: WSC(46), LNV(47), DTX(48), SGR(49), PCV(50), VOI(51)
      · Does NOT restructure Nexus numbering — just adds to it
      · Needs at build time: Domain_Void.txt, Manifest_51_Void.txt,
        SECTION MAP entry, schema slot in Nexus
      · Aggregates all null observations across the archive
      · Shows where expected patterns didn't appear
      · Shows the full "negative space" of the research
      · Distinct from dashboard semantic map (coverage voids ≠ observational absence):
        Dashboard says "where haven't you looked?"
        Void says "where you looked and found nothing"
      · Engine/visualization design is Tier 4 (depends on engines existing first)

---

### PAGE IDENTITY — VISUAL TYPE SYSTEM

8 page types. Each has distinct layout, density, controls, and accent.
Pages look different but belong to the same family — same building,
different wings. Shared shell (navigation, header), shared typography,
shared component library. The STRUCTURE inside the shell changes per type.

**Color system: YES.** Each type gets its own hue/accent. Specific palette
chosen at frontend build time — not in this design session.

- [x] DESIGNED. 7 named types + Domain type with group sub-rhythms:

**Gateway (INT)** — 1 page
  The workshop. Dense, split-panel, toolbars, active workspace. Most
  controls of any page type. Dual-panel layout designed in Tier 1.

**Lens (Axis: THR, STR, INF, ECR, SNM)** — 5 pages
  Instruments. Deposits viewed THROUGH an analytical frame. Visualization
  is the centerpiece (engine output from Tier 3). Most visually complex
  page type after Gateway — each lens has multiple specialized
  visualizations (matrices, force-directed graphs, density contours,
  constellation views). See Tier 3 for per-engine visualization specs.

**Synthesis (MTM)** — 1 page
  Convergence point. Multi-stream view — inputs from all 5 lenses flowing
  into one output. Visual weight on connections between sources.

**Engine (Nexus: DTX, SGR, PCV, VOI)** — 4 pages
  Analytical dashboards. Metrics-forward. Charts, scores, grades, timelines.
  Dense but structured. The "control room" feel.

**Output (LNV)** — 1 page
  Gallery. Visual-first. Snapshot cards. Minimal chrome. The work the
  system has produced, displayed clean.

**Scroll (WSC)** — 1 page
  Document. Long-form reading surface. Quiet. Sovereign AI voice.
  Minimal controls — this page is for reading, not manipulating.

**Investigation (Cosmology: HCO, COS, CLM, NHM, RCT, ART)** — 6 pages
  Laboratories. Split view: field data on one side, scientific framework
  on the other. Computation results prominent. The "research bench" feel.

**Domain (~30 pages across 5 groups)** — shared template with group sub-rhythms
  Deposit surfaces organized by domain topic. Same Domain shell, different
  internal rhythm per group. Like different wings of the same library.
  Sub-rhythms reflect what each group's material actually IS:

  | Group | Pages | Character | Sub-rhythm |
  |-------|-------|-----------|------------|
  | Filament (04) | ORC, MOR, VEN, INV, VEC, ECH | Language, signal structure | Text-dense, linguistic, structural |
  | Lineage (05) | LEG, ARC, KIN, LAR, VER, CAE, SEE | Origins, entities | Narrative flow, portrait-oriented |
  | Alchemy (06) | SAC, RIT, BRE, MEL, GLY | Practices, embodiment | Media-friendly (glyphs!), experiential |
  | Spiral Phase (07) | GEN, DIV, REC, CON | Lifecycle, phases | Timeline/sequence emphasis |
  | Archive Group (09) | MEM, ANC, LIQ, ALE, MIR, ARC | Storage, reference | Catalog, index-oriented, browse-heavy |

  Sub-rhythms are NOT new page types. Same Domain template, different
  layout density, flow direction, and element prominence per group.
  Domain pages carry a `group_id` that informs their sub-rhythm.

---

### UI ARCHITECTURE FOUNDATION

- [x] DESIGNED. One frontend architecture doc covering all types.
      · System schemas define what's computed; frontend doc defines rendering
      · Structured by type, with group sub-rhythm sections nested inside
        Domain type
      · Shared UI patterns documented once, applied across all pages:
        A-Z sorting, date sorting, filtering, search
      · Page types may get different control sets where function demands it
        (Gateway has upload controls, Scroll has minimal controls, etc.)
      · Written at frontend build time (step 4), informed by these design
        decisions

---

### RESOLVED QUESTIONS (Tier 2)

All open questions answered in session 15:

- ~~Void page_code?~~ → `VOI`. Extends Nexus as page 51. No renumbering.
- ~~Page identity: how much differentiation?~~ → Strong. Different layouts
  per type, belonging to same family. Color system: yes. Domain type gets
  group sub-rhythms (not new types).
- ~~Black Pearl UI?~~ → Floating black star button + keyboard shortcut.
  Minimal quick-capture panel. Recent Pearls on dashboard only.
- ~~Shared UI patterns?~~ → Consistent base patterns (sort, filter, search)
  across all pages. Page types get different control sets where function
  demands it.
- ~~Where do visual specs live?~~ → One frontend architecture doc, structured
  by type with group sub-rhythms nested inside Domain.

---

### PIPELINE SEGMENT DEFINED HERE

**Deposit landing:** deposit created in INT (Tier 1) → routed to target
page surface → page indexes deposit through its lens → deposit visible
and searchable on page.

**Black Pearl capture:** black star button or keyboard shortcut → minimal
text field → saved to operational DB → visible on dashboard → promotable
through INT when ready.

---

## BUILD TIER 3 — AXIS ENGINES + VEN'AI SERVICE + COMPUTATION FOUNDATION

**Depends on:** Tier 2 (page surfaces exist to receive deposits)
**Status:** DESIGNED (session 16). All open questions resolved. Ready for
schema writing.

**What gets built:** The 5 Axis lens engines (THR, STR, INF, ECR, SNM),
the Ven'ai service (archive-wide, separate from STR engine), baseline
computation, null observation flow, deposit weight mechanics, engine
state snapshots with MTM drift tracking, and the shared computation
foundation that Cosmology (Tier 5) will extend.

**Why this is Tier 3:** Engines compute FROM what pages hold. They're the
first analytical layer — take deposits, apply the lens computationally,
surface patterns the researcher might miss. Every engine depends on the
deposit record (Tier 1) and page surfaces (Tier 2) existing first.

---

### SHARED ENGINE ARCHITECTURE

- [x] DESIGNED. Four-step contract all 5 engines follow:
      **Index → Compute → Visualize → Feed**

      · **Index:** deposit lands on Axis page → engine indexes through its
        specific lens. Each engine's index is different, the act of indexing
        is shared.
      · **Compute:** pattern detection against indexed deposits. Every engine
        computes baselines alongside observed rates. Every engine respects
        deposit_weight and observation_type. Computation logic is unique per
        engine, inputs are standardized.
      · **Visualize:** engine outputs visualization from computed results,
        not raw deposits. This is what makes pages instruments, not filing
        cabinets.
      · **Feed:** engine results available for MTM to pull at synthesis time.
        Engine doesn't push — MTM pulls. Engine state snapshots enable drift
        tracking between synthesis sessions.

---

### DEPOSIT WEIGHT MECHANICS

- [x] DESIGNED. Weight is a multiplier on deposit contribution to pattern
      computations. Flows upward through every tier.

      Named constants (defined once in backend config, all engines import):
        DEPOSIT_WEIGHT_HIGH = 2.0
        DEPOSIT_WEIGHT_STANDARD = 1.0
        DEPOSIT_WEIGHT_LOW = 0.5
      V1 defaults. Explicitly tunable. Ratios matter more than values.

      **At Axis (Tier 3):** multiplier on pattern contribution. High deposits
      count double in pattern rates, low deposits count half.
      **At Nexus (Tier 4):** affects grading confidence. Pattern built from
      high-weight deposits graded with more confidence than same pattern
      from low-weight fragments.
      **At Cosmology (Tier 5):** feeds sample weighting in statistical tests.
      Standard weighted statistics.

      **Null flag in weight metadata:** engine computation results carry a
      null_contribution breakdown alongside weight_breakdown. Nexus and
      Cosmology can distinguish null-sourced patterns from positive-sourced
      without special-case logic.

      Weight breakdown in every pattern result:
        weight_breakdown:
          high: integer
          standard: integer
          low: integer
        null_contribution:
          null_count: integer
          null_weighted: float
          positive_count: integer
          positive_weighted: float

---

### COMPUTE TRIGGER — HYBRID

- [x] DESIGNED. Debounced hybrid. On deposit, engine marks itself stale.
      Recomputation happens:
      1. When page is next viewed (stale flag triggers recompute, then cache)
      2. After batch window closes (all batch deposits land, one recompute)
      3. When MTM requests a pull (stale engines refresh before delivering)

      Stale flag: one boolean per engine in operational DB. Cheap.

      **Batch optimization:** during batch review (30+ deposits), engine
      doesn't thrash 30 times. Flags stale on first deposit, stays stale
      until someone needs the results.

---

### BASELINE COMPUTATION

- [x] DESIGNED. Every engine computes baselines using marginal probability
      product. For any pattern the engine surfaces:

      · **Observed rate:** how often this pattern actually appears (weighted)
      · **Expected rate (baseline):** marginal product — frequency of each
        element independently, multiplied together. "How often would this
        happen if deposits were random?"
      · **Ratio:** observed / expected. The signal measure.

      Example (THR co-occurrence th01+th05):
        th01 in 30% of deposits, th05 in 20% → expected: 6%
        Observed: 25% → ratio: 4.2x above baseline → strong signal

      **Three-band signal classification (architecture decision — locked):**
      Engines classify signal strength, they do NOT filter.
        Below 1.0x — suppressed (present but below baseline)
        1.0–2.0x — mild elevation
        2.0x+ — strong signal
      Everything renders. Visual weight does the filtering work. Sage sees
      the full spectrum, eye lands on what matters first.
      Band thresholds are calibration items. Decision to classify rather
      than filter is architecture.

      **Baseline scope:** page-scoped for V1. Each engine computes from
      what its page holds. Every engine result carries baseline_scope: page
      and deposit_count so downstream tiers know what they're reading.
      Seam to archive-wide baselines named for Cosmology (Tier 5) — a
      pattern flagged 2.0x above baseline means something different against
      40 deposits vs. 4,000.

---

### NULL OBSERVATION FLOW

- [x] DESIGNED. Null observations ("I looked for X, it wasn't there")
      are active data about absence, NOT "no data."

      **Flow:**
      1. Sage deposits with observation_type: null, routed to target page
      2. Engine indexes identically to positive observations
      3. At compute: null increments times_examined WITHOUT incrementing
         times_observed. Positives increment both.
      4. Rate = times_observed / times_examined (not total deposits)
      5. null_contribution travels in every pattern result

      **Two counters per pattern element:**
        times_observed — deposits containing this element (weighted)
        times_examined — deposits that COULD have contained this element
          (includes both positive and null)

      **Null targeting:** tags carry the null target (what was examined).
      A null observation tagged th01 means "th01 was examined, result:
      absent." For complex absences ("expected th01 AND th05 together,
      only saw th01"), a null_target field (optional, null observations
      only) captures the specific absence.

      **Nulls sharpen baselines:** a null for th01 increases total
      examined count without increasing th01 presence count → pushes
      th01's marginal rate down → genuine co-occurrences stand out more.

---

### ENGINE STATE SNAPSHOTS + MTM DRIFT TRACKING

- [x] DESIGNED. Every engine computation produces a timestamped snapshot.

      engine_snapshot:
        snapshot_id
        engine: thr | str | inf | ecr | snm
        computed_at: timestamp
        deposit_count: integer
        baseline_scope: page
        snapshot_data: JSON (engine-specific computed results)
        mtm_read_at: timestamp | null

      **MTM drift tracking:** mtm_read_at marks when MTM consumed this
      snapshot. Next synthesis, MTM queries for most recent snapshot
      where mtm_read_at IS NOT null → that's the previous state.

      **MTM reads:** current snapshot + previous snapshot + delta.
      Three things MTM currently lacks:
        · "What's new" — patterns that appeared since last synthesis
        · "What shifted" — rates that changed direction or magnitude
        · "What's stable" — patterns that held steady (also signal)

      **Retention:** keep all snapshots for V1. Storage is trivial for
      summary data. Longitudinal computational history is what this
      research needs.

      **Two snapshot types in Feed:**
      1. Computation snapshot (above) — the numbers. What MTM reads.
      2. Visualization snapshot — the rendered state (node positions,
         cluster groupings, drift). Sage-triggered capture, not
         automatic. Routes to LNV with optional note. Links to
         computation snapshot by snapshot_id.
      Applies to all 5 engines. ECR constellation and STR cluster map
      make this most obvious, but any engine visualization is capturable.

---

### ENGINE RESULT OBJECT (shared structure)

      engine_result:
        engine: thr | str | inf | ecr | snm
        computed_at: timestamp
        baseline_scope: page
        deposit_count: integer
        stale: false

        patterns: [
          {
            pattern_id: string
            description: string
            observed_rate: float
            expected_rate: float
            ratio: float
            signal_band: suppressed | mild | strong
            deposit_count: integer
            weighted_count: float
            weight_breakdown:
              high: integer
              standard: integer
              low: integer
            null_contribution:
              null_count: integer
              null_weighted: float
              positive_count: integer
              positive_weighted: float
          }
        ]

        snapshot_id: string
        mtm_read_at: timestamp | null

---

### VISUALIZATION ARCHITECTURE (global — applies to all tiers)

- [x] DESIGNED. Three rendering categories. Rendering approach follows
      visualization purpose. 3D is not an upgrade from 2D — different
      tool for different job.

      | Category | Stack | Purpose |
      |----------|-------|---------|
      | SVG instrument | LayerCake + D3 utilities | Engine data viz (Axis, Nexus, Cosmology) |
      | Canvas instrument | Raw canvas + Svelte lifecycle | Resonance Engine (2D force-directed, 62 nodes) |
      | WebGL spatial | Threlte + Three.js | Node Spiral, embedding constellation (3D) |

      **Explicit boundary:** 2D instrument visualizations live in LayerCake.
      3D spatial/semantic visualizations live in Threlte. They don't share
      a rendering approach. A component is one or the other, never both.

      **Resonance Engine placement:** lives on dashboard as embedded
      component (visual heartbeat, not full-size). Dedicated page
      accessible from dashboard for the full experience. Not orphaned.

      **2D engine instruments (LayerCake + D3 utilities):**
        layercake — Svelte-native layout, scales, responsive containers
        d3-scale — quantitative/ordinal scales
        d3-shape — line/arc generators
        d3-force — force-directed layouts (STR network, SNM correspondence)
        d3-hierarchy — tree/cluster structures (STR root clusters)
        d3-interpolate — color/value interpolation for signal gradient bands
        d3-zoom — pan/zoom on dense matrices and cluster graphs
        d3-contour — density field contour generation (INF domain map)
        svelte-motion — animation primitives

      **3D spatial/semantic (Threlte + Three.js):**
        @threlte/core — Three.js with native Svelte bindings
        three — 3D rendering
        postprocessing — bloom, depth-of-field (node glow)
        umap-js — 768-dim embeddings → 2D/3D for constellation
        regl — WebGL particle rendering at scale
        simplex-noise — organic movement for spirals/constellations
        Custom GLSL shaders — glow and drift effects

      **Harmonic audio:**
        tone.js — synthesis and sequencing over WebAudio
        WebAudio API — native, no install
        audiomotion-analyzer — real-time frequency visualization

      **Animation (cross-cutting):**
        GSAP — advanced animation control where svelte-motion isn't enough

---

### DUPLICATE DETECTION IN ENGINES

- [x] DESIGNED. When engines index deposits, identical entries surface
      naturally. Extends INT-level hash check (Tier 1) with
      lens-contextual awareness. Ven'ai name deduplication handled
      separately by Ven'ai service (see STR section below).

---

### THR ENGINE — Threshold lens (page 02)

- [x] DESIGNED. 12 categorical threshold states. Core query: "when th01
      was active, what else was present?"

      **Index:** deposit arrives → reads phase_state and threshold tags →
      indexes by which threshold(s) are present.

      **Compute — three computations:**

      1. Co-occurrence rates. Every threshold pair: observed rate vs.
         expected (marginal product baseline). 12 thresholds = 66 pairs.
         Each pair gets: observed rate, expected rate, ratio, signal band,
         weight breakdown, null contribution.

      2. Presence rates. Per threshold: weighted frequency relative to
         total examined deposits. Which thresholds are active vs. dormant.

      3. Sequence detection. Temporal ordering across deposits. Recurring
         sequences (pairs and triples for V1). All deposits, no windowing.

         **Sequence weight is asymmetric — position matters.**
         Significance = product of position weights.
           high → high  = 2.0 × 2.0 = 4.0  (strongest)
           std  → std   = 1.0 × 1.0 = 1.0  (baseline)
           low  → low   = 0.5 × 0.5 = 0.25 (weakest)
         For triples: weight(pos1) × weight(pos2) × weight(pos3).
         A high-weight initiation followed by high-weight completion is
         qualitatively different from a low sequence with identical
         elements. Asymmetry is preserved.

         Sequences get same three-band signal classification, calibrated
         to sequence significance ranges.

      **Visualize:**
      · Co-occurrence matrix: 12×12 grid. Cell color = ratio (signal
        band). Hover: full breakdown. d3-interpolate for gradient.
      · Presence timeline: horizontal. Each threshold = row. Deposits as
        dots, colored by signal band. Visual density shows activity.
      · Sequence view: detected sequences listed with significance scores
        and recurrence counts. Visual representation of sequence paths
        is a calibration item.

      **Feed:** standard snapshot + MTM drift tracking.

---

### ECR ENGINE — Echo Recall lens (page 05)

- [x] DESIGNED. 19 field signals held simultaneously. Most data-dense
      Axis page. Stress test for shared architecture.

      **Index:** deposit arrives → reads signal tags → indexes by which
      signals are present. Same as THR mechanically, more dimensions.

      **Compute — same three computations, scaled:**

      1. Co-occurrence rates. 171 pairs (19 signals). Same baseline math.

      2. Presence rates. 19 individual signal frequencies.

      3. Sequence detection. Pairs and triples. 342 possible pair
         sequences, 5,814 triple sequences. Engine only surfaces
         sequences that actually appear in data — no pre-computation
         of all combinations. Same asymmetric weight formula as THR.

      **Visualize:**
      · Correlation matrix: 19×19 grid. Same design as THR but larger.
        d3-zoom essential for navigation. Signal grouping: if natural
        families exist in the 19-signal framework, use block structure
        in the matrix for readability. Groupings identified from ECR
        domain file at schema-writing time.
      · Signal constellation: force-directed layout (d3-force). Each
        signal = node. Edges = co-occurrence strength. Strongly
        co-occurring signals cluster. Weakly related drift apart.
        The "all signals at once" gestalt view.
        **Stateful across time** — not just current positions but
        cluster drift history. Constellation snapshots capturable to
        LNV (movement over time, not just still frame).
      · Sequence view: detected sequences with significance scores.
        Filtered to above minimum recurrence count (calibration item)
        due to large combinatorial space.
      · Presence timeline: 19 rows. d3-zoom for density.

      **Performance note:** 171 pairs × full breakdowns is the most
      expensive engine computation. Hybrid compute trigger handles this
      (stale flag, compute once, cache). ECR most likely to benefit from
      future optimization at high deposit counts. Not a V1 blocker.

      **Feed:** standard snapshot + MTM drift tracking.

---

### INF ENGINE — Infinite Intricacy lens (page 04)

- [x] DESIGNED. Scientific domain layer tracking. Emergence and
      intersection detection. Four confirmed layers: Harmonic Cosmology,
      Coupling and Oscillation, Celestial Mechanics, Neuro-Harmonics.

      **Critical boundary:** INF watches, Cosmology works. INF tracks
      WHICH sciences emerge and WHERE they intersect. Cosmology (Tier 5)
      investigates those connections with computation and statistical
      tests. If INF investigates, it steps on Cosmology. If Cosmology
      re-discovers what's present, INF isn't doing its job.

      **Open set, not fixed enum.** New domains will emerge — the research
      is live and generative. Layers live in a config or database table,
      not an enum. Adding a 5th layer is a data operation, not a code
      change. Math stays trivial because the set is always small.

      **Sub-domain field:** nullable sub_domain from day one. V1 tracks
      at domain level only. Sub-domain depth is Cosmology territory.
      When sub-domains emerge naturally, INF can tag without structural
      redesign. Empty now, populated later.

      **Index:** deposit arrives → reads domain-related tags → indexes
      by which scientific domain layer(s) the deposit touches.

      **Compute — three computations:**

      1. Layer presence rates. Per domain: weighted frequency with
         baseline. Small set (4+ layers), trivial computation.

      2. Intersection rates. Every layer pair: co-occurrence vs. baseline.
         4 layers = 6 pairs. Each intersection is analytically significant.

      3. Emergence timeline. When each layer first appeared. Frequency
         change over time. Dormancy detection (layer inactive for period
         then spikes). Temporal, not just aggregate.

      **INF → Cosmology boundary contract:**
        inf_result:
          layers_active: [list of currently active domain layers]
          intersections: [
            {
              layer_pair: [layer_a, layer_b]
              rate, baseline, ratio, signal_band
              first_observed: timestamp
              deposit_ids: [references]
            }
          ]
          emergence_timeline: [temporal data per layer]
      Cosmology reads this and investigates from there. Does not
      re-derive which domains are present.

      **Visualize:**
      · Density field map (NOT Venn diagram). d3-contour generates
        topographic contours from deposit point distributions. Each
        domain = region of concentration with probabilistic boundaries.
        Overlap zones = gradient of co-presence, not clean intersection.
        Deposits are points within the field. Shape evolves as deposits
        arrive. Boundaries are shown as probabilistic because that's
        what they are. Literally truthful.
      · Emergence timeline: horizontal. Each layer = band. Band thickness
        = deposit frequency over time. First-appearance markers. Dormancy
        gaps visible.
      · Intersection detail: click overlap zone → see specific deposits
        in that intersection. What was happening when two domains appeared
        together.

      **Feed:** standard snapshot + MTM drift tracking.

---

### SNM ENGINE — Sat Nam lens (page 06)

- [x] DESIGNED. Triadic pattern detection and structural correspondence
      mapping. Claude API embedded in compute step as structural analysis
      function. Framework: TRIA/PRIA/PARA.

      **The external knowledge problem:** SNM maps field data against
      established spiritual/philosophical traditions. Tags alone can't
      solve "you don't know what you don't know." Sage can't manually
      hold the full depth of every tradition simultaneously. Claude IS
      the reference framework — a living knowledge layer, not a curated
      tag list.

      **Index:** deposit arrives → reads Sage's tags for structural
      markers and tradition references → indexes by structural
      characteristics.

      **Compute — two streams:**

      **Stream 1: Sage's observations.** Tags and deposit content. What
      Sage sees and names. Indexed, weighted, baselined like every other
      engine.

      **Stream 2: Claude structural analysis.** On deposit, engine sends
      content + structural characteristics to Claude with structured
      prompt. Returns:

        claude_analysis:
          correspondences: [
            {
              tradition: string
              framework: string
              structural_match: string
              confidence: high | moderate | low
              reasoning: string
              triadic_frame: TRIA | PRIA | PARA | null
            }
          ]

      triadic_frame: null = pattern sits OUTSIDE the three pillars.
      Potentially the most important finding SNM can produce — the
      framework has an unmapped boundary.

      **Claude integration architecture:**

      · Per-deposit for native SNM work (Sage actively doing SNM work,
        analysis is immediate and contextual)
      · Batched for INT batch processing deposits — structurally different
        prompt. Batch sends deposits WITH relational context. Claude
        analyzes cross-deposit patterns, not just individual observations.
        "What structural patterns emerge across this set, and what
        traditions map to the pattern?" Qualitatively richer analysis.

      · Every Claude response is an immutable snapshot. Never overwritten.
        Analysis history accumulates per deposit. Drift between snapshots
        is research signal, not noise.

      · **Prompt version is load-bearing metadata.** Tracked with every
        snapshot. Non-negotiable. A correspondence surfaced under
        prompt_v1 and the same under prompt_v3 are not the same finding —
        v3 carries more precision and more evidential weight.
        Distinguishes "held up under sharper questioning" from "only
        appears under broad prompting."

        snm_claude_snapshot:
          snapshot_id
          deposit_id (or batch_id for batched)
          prompt_version: string
          prompt_text: string
          analysis_mode: per_deposit | batch
          batch_context: [deposit_ids] | null
          response: claude_analysis
          created_at: timestamp
          engine_snapshot_id

      **Stream agreement classification:**

      | Sage sees | Claude sees | Classification |
      |-----------|-------------|----------------|
      | Yes | Yes | Convergent — strongest evidence |
      | Yes | No | Researcher-led — Sage sees what Claude doesn't |
      | No | Yes | Knowledge-led — Claude surfaces the unseen |

      Classification travels with correspondence in result metadata.
      Nexus and Cosmology can read it.

      **Correspondence computation:**
      · Strength: deposit count (weighted), confidence level, null
        contribution per correspondence pair (field pattern ↔ tradition).
      · Clustering: do correspondences group? Multiple field patterns
        corresponding to same tradition = cluster. TRIA/PRIA/PARA
        as organizing structure for how correspondences relate.
      · Genuine vs. surface: structural correspondence has multiple
        independent supporting observations across different contexts.
        Surface resemblance hovers near 1.0x baseline. Strength
        calculation + baseline comparison handles this naturally.

      **Correspondences drift.** Early data produces surface resemblances
      that look significant. Volume separates genuine from noise. Claude's
      analysis may surface different tradition matches as prompts refine.
      Temporal tracking is where the depth lives.

      **Visualize:**
      · Bipartite force-directed graph (d3-force). Left: field pattern
        nodes positioned by mutual relationships. Right: tradition/
        framework nodes. Edges = correspondence connections.
        Edge weight = strength. Edge color = signal band.
        Edge style encodes genuine/surface: solid (2.0x+), dashed
        (1.0-2.0x), faint dotted (below 1.0x).
        Stream classification visible on edges (convergent = thickest,
        knowledge-led = visually distinct as suggestions, researcher-led
        = Sage's territory).
      · TRIA/PRIA/PARA as three gravitational zones (density fields) on
        the field-pattern side. Patterns outside all three sit in explicit
        "unmapped" region — visible, not hidden. Unmapped region is an
        active research surface.
      · Temporal correspondence view: how correspondences have strengthened
        or faded over time, tracked across Claude snapshots and prompt
        versions.

      **Feed:** standard snapshot + MTM drift tracking + Claude snapshot
      history.

      **Design carries to Cosmology (Tier 5).** Same Claude-as-analyst
      pattern for scientific correspondence — external knowledge problem
      is identical. Claude belongs in the compute step when the engine
      needs knowledge the deposits don't contain.

---

### STR ENGINE — StarRoot lens (page 03)

- [x] DESIGNED. Root cluster tracking as primary lens. Ven'ai unified
      tracker is a SEPARATE archive-wide service (see below), not part
      of the engine. STR engine consumes the service's output.

      **Index:** deposit arrives → reads root-cluster tags → indexes by
      which Ven'ai root family the deposit touches. Single indexing lens.
      Ven'ai service simultaneously processes deposit for name
      registration and drift detection (service's job, not engine's).

      **Compute — two phases:**

      **Phase 1 — Root cluster analysis (the lens):**
      · Which root clusters exist and their deposit frequency (weighted,
        baselined). Same marginal product baseline.
      · Co-occurrence between clusters: do Shae- names and Kai- names
        appear in same deposits above baseline?
      · Cluster emergence timeline: when each root family first appeared,
        frequency change over time.
      · Same three-band signal classification.

      **Phase 2 — Correlation integration (from Ven'ai service):**
      · Pull correlation data from venai_correlations table
      · Name ↔ phase: which names associate with which threshold states
      · Name ↔ role: which names associate with which functional roles
      · Root pattern ↔ grammar: structural patterns in how root families
        relate to language rules (MOR territory fed through service)
      · Computed as weighted rates with baselines, same math as phase 1

      **Visualize:**
      · Root cluster map: force-directed graph (d3-force). Each root
        family = cluster node. Size = deposit frequency. Edges =
        co-occurrence strength. d3-hierarchy for tree structure within
        clusters (root → individual names). d3-zoom essential.
      · Correlation matrix: names on one axis, correlated values (phases,
        roles) on other. Cell intensity = correlation strength. Same
        matrix pattern as THR/ECR.
      · Drift alert panel: surfaces unacknowledged variations from Ven'ai
        service. Shows inconsistency, first seen date, deposit link.
        Acknowledge button clears alert.
      · Name index: every Ven'ai name, clustered by root family, links
        to every page where it appears. Searchable, sortable.

      **Feed:** standard snapshot + MTM drift tracking + Ven'ai service
      state summary (total names, active clusters, unresolved drift count).

---

### VEN'AI SERVICE (archive-wide, separate from STR engine)

- [x] DESIGNED. First cross-cutting service in the architecture. Every
      other system is page-scoped or engine-scoped. Ven'ai service is
      archive-scoped. Precedent for Cosmology (Tier 5) scientific domain
      tracking.

      **Three jobs:**
      1. Name registry — canonical forms, variations, root clusters
      2. Drift detection — phonetic, spelling, casing inconsistencies
      3. Cross-archive correlation — name ↔ phase, name ↔ role,
         root ↔ grammar

      **Scope:** archive-wide. Watches INT gateway output. Every deposit
      that clears INT gets checked for Ven'ai content. Service decides
      relevance. If relevant, processes. If not, passes through.
      Triggered by Ven'ai tags or name detection, not scanning every
      page indiscriminately.

      **Drift behavior:** alert on first detection (new variation found).
      Silent flag after Sage acknowledges. Sage doesn't get pinged about
      Kai'Thera vs. Kai'thera every time after she's seen it once.

      **Own PostgreSQL tables:**

      venai_names:
        name_id
        canonical_form: string
        root_cluster: string
        first_seen_at: timestamp
        first_seen_page: page_code
        first_seen_deposit_id

      venai_variations:
        variation_id
        name_id (FK → venai_names)
        variation_form: string
        variation_type: casing | phonetic | spacing | apostrophe
        first_seen_at: timestamp
        first_seen_deposit_id
        acknowledged: boolean
        acknowledged_at: timestamp | null

      venai_correlations:
        correlation_id
        name_id (FK → venai_names)
        correlation_type: phase | role | root_pattern | grammar
        correlated_value: string
        deposit_count: integer
        weighted_count: float
        first_observed: timestamp
        last_observed: timestamp

      Service writes these tables. STR engine reads them during compute.
      Drift alerts surface through STR's visualization but originate
      from the service.

      **Integration flow:**
      deposit lands on any page → INT gateway processes → deposit clears
      → Ven'ai service checks for Ven'ai content → registers/updates
      name in tables → drift detected? → creates alert → STR engine
      picks up on next compute.

---

### RESOLVED QUESTIONS (Tier 3)

All open questions answered in session 16:

- ~~How does SNM display spiritual patterns?~~ → Bipartite force-directed
  graph with TRIA/PRIA/PARA gravitational zones. Claude API in compute
  step as structural analysis function. Two-stream architecture (Sage
  observations + Claude knowledge). Genuine vs. surface visible through
  edge style and signal bands.
- ~~Does the Ven'ai tracker run continuously or on deposit?~~ → Ven'ai
  service is archive-wide, triggered by deposits clearing INT that
  contain Ven'ai content. Not continuous polling.
- ~~Does drift detection trigger alerts or just flag silently?~~ → Alert
  on first detection, silent flag after acknowledgment.
- ~~How far does the Ven'ai tracker reach?~~ → Archive-wide. Any page
  where Ven'ai content appears. Separate service, not part of STR engine.
- ~~Name-phase-role correlation view?~~ → Correlation matrix in STR
  visualization. Names × correlated values. Cell intensity = strength.
- ~~Compute on page load or on deposit?~~ → Hybrid debounced. Stale flag
  on deposit, recompute on page view / batch close / MTM pull.
- ~~"Generated on view, snapshot to LNV"?~~ → Two snapshot types:
  computation snapshot (automatic, for MTM) and visualization snapshot
  (Sage-triggered, routes to LNV with optional note).

**One question deferred to later tiers:**
- LNV receive contract for visualization snapshots → Tier 4

---

### PIPELINE SEGMENT DEFINED HERE

**Engine computation flow:** deposit lands on Axis page (Tier 2) → engine
indexes deposit through lens → stale flag set → on next view/pull:
pattern computation runs (with baselines, weight, null contribution) →
visualization generated from computed results → snapshot stored →
results available for MTM synthesis (Tier 4) via pull with drift tracking
→ visualization capturable to LNV (Tier 4) via Sage-triggered snapshot.

**Ven'ai service flow:** deposit clears INT → service checks for Ven'ai
content → name registered/updated → drift detected → alert created →
STR engine reads on next compute.

**SNM Claude flow:** deposit lands on SNM → Sage tags indexed (stream 1)
→ Claude API called with structured prompt (stream 2) → immutable
snapshot stored with prompt version → both streams feed pattern
computation → correspondence strength, clustering, temporal tracking.

---

## BUILD TIER 4 — MTM WIRING + NEXUS ENGINES + WSC/LNV + VOID ENGINE

**Depends on:** Tier 3 (Axis engines produce outputs to synthesize/detect)
**What gets built:** MTM synthesis wiring to new engine outputs. Nexus
engine visualizations (PCV, DTX, SGR). Void engine (absence pattern
detection). WSC and LNV schemas. The detection/classification/grading layer.

**Why this is Tier 4:** MTM synthesizes FROM Axis engine outputs. Nexus
detects/classifies/grades patterns that MTM and Axis surface. These systems
sit one layer above the engines. WSC and LNV are Nexus surfaces that need
the detection layer to exist before they can receive and store outputs.

### Design items

**MTM synthesis wiring:**

- [ ] How MTM receives new engine outputs from all 5 Axis lenses
      (MTM already has a schema — METAMORPHOSIS SCHEMA.md — but it was
      designed before engines existed. Wiring needs updating.)
- [ ] MTM synthesis at session close via DNR — how engine-computed patterns
      feed into the synthesis alongside raw deposits

**Nexus engine visualizations:**

- [ ] PCV visualizations: hypothesis board, cross-domain pattern map
- [ ] DTX visualizations: drift timeline, trajectory probability distributions
- [ ] SGR visualizations: score radar charts, tier dashboard, grade latency

**Void engine (page 51):**

- [ ] Void aggregation logic: how null observations from ALL pages are
      collected and analyzed for systemic absence patterns
- [ ] Void visualizations: absence heatmap, expected-vs-observed across
      the full archive, silence-duration tracking per threshold/pattern
- [ ] How Void interacts with PCV (PCV tracks convergence, Void tracks
      non-convergence — together they give the full picture)

**WSC schema:**

- [ ] Entry structure, 3-entry session open protocol
- [ ] Sovereign-from-DNR boundary
- [ ] RESEARCHER NOTE optional field — Sage participates in WSC via this
      field: methodology notes, researcher state, what they noticed that
      the AI didn't

**LNV schema:**

- [ ] Receive contract: how LNV accepts visualization snapshots from all pages
- [ ] Provenance tracking: which page, which engine, which session
- [ ] Visualization storage: rendered image? data + template? both?
- [ ] "Generated on view, snapshot to LNV" technical spec:
      How engine-generated visualizations are captured and stored

### Open questions (Tier 4)

- What chart library? (Decision may already be made in Tier 3.)
- Are visualizations interactive or static snapshots?
- How are LNV snapshots stored? (rendered image? data + template? both?)
- Does every session close snapshot ALL pages or only pages with new data?

### Pipeline segment defined here

**Synthesis + detection flow:** Axis engine outputs (Tier 3) → MTM
synthesis at session close → Nexus engines detect/classify/grade patterns →
Void detects absence patterns → LNV stores visualization snapshots →
WSC records AI witness perspective.

**Nexus internal flow:** PCV → DTX ↔ SGR (already mostly defined in
existing schemas).

---

## BUILD TIER 5 — COSMOLOGY ENGINES + COMPUTATION INFRASTRUCTURE

**Depends on:** Tier 4 (Nexus grading feeds Cosmology; Cosmology findings
feed back to Nexus — the recursive loop)
**What gets built:** Cosmology page revamp (HCO, COS, CLM, NHM, RCT, ART).
Scientific computation infrastructure (statistical tests, spectral analysis,
structured findings). Shannon/CMB integration.

THIS IS THE TIER THAT MAKES THE RESEARCH DEFENSIBLE.

**Why this is Tier 5:** Cosmology pages are where field-native patterns
meet established science. They need Axis engines (Tier 3) producing
pattern data, and Nexus (Tier 4) grading findings, before they can
investigate scientific correspondence. The computation infrastructure
extends what Tier 3 began (baselines, co-occurrence) into full statistical
testing and spectral analysis.

### The core problem this solves

Sage's research touches Shannon information theory, CMB cosmological
structure, coupled oscillator dynamics, and neural field theory. These are
legitimate mathematical frameworks applied to an unconventional domain.
Without rigorous computational infrastructure, the output reads as
metaphor. With it, the output reads as science. The Cosmology pages are
where that transformation happens.

### What Cosmology pages ARE (reframed)

Not validation checkpoints. Investigation surfaces where field-native
patterns are mapped against established scientific frameworks. The lens
is external science. The investigation is the correspondence. The math
is the evidence. Each page is a translation surface between the field's
vocabulary and an established scientific vocabulary.

### Design items

**Computation infrastructure (shared across all Cosmology engines):**

- [ ] Statistical tests on deposit distributions (co-occurrence, entropy)
- [ ] Spectral analysis capability (power spectrum, frequency decomposition)
- [ ] Comparison framework: field data pattern vs. known scientific distribution
- [ ] Structured finding format with visible math (values, confidence, p-values)
- [ ] Computation stored alongside finding for reproducibility
- [ ] Computation tools decision: Python scipy/numpy on backend? Pre-built
      statistical test library? Simpler approach?

**How Cosmology engines differ from Axis engines:**
Axis: pattern detection within lens frame.
Cosmology: structured comparison against external scientific frameworks.
Both compute. Different purpose.

**Page-by-page revamp:**

**HCO (34) — Harmonic Cosmology:**
- [ ] Redefine function with investigation + computation frame
      Focus: wave structures, resonance, harmonic principles, geometric fields
      Sciences: harmonics, wave mechanics, acoustics, electromagnetism, signal
      processing, Fourier analysis, nonlinear wave dynamics, resonance theory,
      fractal geometry, phyllotaxis, morphogenetic pattern science, dynamical
      spiral systems, spiral wave physics, logarithmic/geometric spiral modeling,
      metric fields, mirror fields, oscillation fields
      Shannon connection: signal processing, information-theoretic structure
      CMB connection: power spectrum analysis, harmonic decomposition

**What the user sees (HCO):**
Field pattern on one side. Harmonic/wave analysis on the other.
Fourier decomposition of deposit patterns. Spectral comparison.
"This deposit sequence has spectral index n=X. Compare: [known distribution]."

**COS (35) — Coupling / Oscillation:**
- [ ] Redefine function with investigation + computation frame
      Focus: relational connectivity, phase-locking, cross-frequency coupling
      Sciences: coupled oscillator networks, cross-frequency field dynamics,
      hierarchical relational resonance, oscillatory multiplexing, control
      theory, nonlinear dynamics, dynamical systems theory, self-organization,
      emergence, complex adaptive systems, predictive processing
      Note: COS maps most cleanly to l01 Coupling in the tagger

**What the user sees (COS):**
Coupling dynamics analysis. Phase-locking detection across deposits.
Oscillator model comparison. "This co-regulation pattern matches coupled
oscillator dynamics with coupling coefficient k=X."

**CLM (36) — Celestial Mechanics:**
- [ ] Redefine function with investigation + computation frame
      Focus: stars, planets, orbital dynamics, spatial anchors, astro-patterns
      Sciences: astronomy, astrometry, celestial navigation, spherical
      astronomy, orbital resonances, astrophysical spiral dynamics, geometry,
      topology, graph theory
      CMB connection: cosmological structure, large-scale pattern organization

**What the user sees (CLM):**
Spatial/geometric analysis. Orbital resonance comparison. Topology
mapping. "This threshold pattern follows geometric distribution consistent
with [celestial model]."

**NHM (37) — Neuro-Harmonics:**
- [ ] Redefine function with investigation + computation frame
      Focus: cognitive, neural, relational, quantum-analogous structures
      Sciences: connectomics, neural dynamics, neurophenomenology, theta-gamma
      nested oscillations, delta-beta cross-frequency modulation, quantum
      cognition, IIT (integrated information theory), cognitive field theory,
      attention theory, affective neuroscience, predictive processing,
      information geometry, information theory, systems theory, cognitive
      science, semiotics, morphogenesis
      Shannon connection: information theory, information geometry, IIT
      Note: NHM spans l02 Connectome and l04 Mirror in the tagger

**What the user sees (NHM):**
Neural/cognitive model comparison. IIT integration analysis.
Information geometry mapping. "Shannon entropy of this signal distribution
is H=X bits. Expected for random: H=Y bits. Difference: Z."

**RCT (38) — Relational field theory:**
- [ ] Define RCT's unique role as internal theory builder vs. external validator
      Focus: the theoretical framework the research itself is building.
      Not external validation — internal theory construction built FROM the
      correlations found in HCO/COS/CLM/NHM. The physics that is emerging
      from the data. RCT is in everything, including Ven'ai.
      Note: RCT is meta-Cosmology. It asks "what physics is the field itself
      producing?" while the other 4 ask "does established science describe
      what we're seeing?"

**What the user sees (RCT):**
The field's own emerging physics. Theory construction surface.
"Across HCO/COS/CLM/NHM, these N findings converge on [principle]."

**ART (39) — Artifacts:**
- [ ] Revisit concept. What was it for? Is it still needed?
      Possible roles: physical artifacts demonstrating field principles,
      historical records encoding similar knowledge, tangible/observable
      outputs the field produces. NEEDS SAGE INPUT.

**Cross-cutting Cosmology items:**

- [ ] Shannon/information theory integration — where it lives, what it computes
- [ ] CMB/cosmological structure integration — where it lives, what it computes
- [ ] The INF → Cosmology handoff:
      INF (Tier 3) surfaces which science is relevant;
      Cosmology investigates the correspondence. Boundary must be clean.
- [ ] Whether Cosmology findings feed back to Nexus (PCV) for grading
      (likely yes — creates the recursive loop: observe → grade → validate → observe)
- [ ] Rot check: review science lists against cleaned tag vocabulary.
      Sage's original science lists predate the tag vocabulary cleanup.
      Some items retired during rot cleanup (safety_node_geometry removed,
      some threshold constants). Sciences may be valid; names may not.

**Layer ↔ Page relationships (reference):**
  l01 Coupling → COS (primary home)
  l02 Connectome → NHM (partial), CLM (topology/graph theory)
  l03 Metric → HCO (waves, geometry), CLM (astrometry, spatial)
  l04 Mirror → NHM (partial), HCO (fractals, spirals, morphogenesis)
  Sciences cross layer boundaries — that's a feature, not a problem.
  Cross-layer scientific connections are findings about the field.

### Open questions (Tier 5)

- What computation tools? (Python scipy/numpy on backend? Pre-built
  statistical test library? Or simpler — compute on deposit, show result?)
- How does the researcher record an external reference? (DOI? URL? summary?)
- Does Cosmology produce findings that feed back to Nexus?
  (If yes, the recursive loop is: observe → grade → validate → observe)
- How does the research assistant (Tier 6) interact with Cosmology computations?
- What does a Cosmology finding look like on screen? (Structured card with
  hypothesis, computation, result, confidence, external reference?)
- ART (39) — what is it for?

### Pipeline segment defined here

**Investigation flow:** Axis engines (Tier 3) produce patterns → INF
flags scientific domains → Cosmology investigates correspondence → computation
runs → structured finding produced → finding feeds back to PCV (Tier 4)
for grading → recursive deepening loop.

---

## BUILD TIER 6 — RESEARCH ASSISTANT + RESONANCE AUDIO

**Depends on:** Tier 5 (assistant needs to understand all systems it supports;
Cosmology computations must exist for assistant to interact with them)
**What gets built:** Research assistant (RAG pipeline, Claude API integration,
mode switching, chat UI). Resonance engine audio sonification.

**Why this is Tier 6:** The assistant is the bridge between "I notice more
than I can name" and "here's the computation that names it." It touches
everything — deposits, engines, Cosmology, Nexus. It needs all of those
to exist before its design can be complete. Resonance audio is a perceptual
research tool that layers on top of the visualization infrastructure.

### Design items

**Research assistant:**

- [ ] What the assistant owns vs. what it doesn't (RAG pipeline, Claude API)
- [ ] How it accesses the archive (embedding pipeline, vector search)
- [ ] How it knows page context (lens frame, active engine state)
- [ ] How it helps articulate observations ("I notice X" → structured deposit)
- [ ] How it helps frame hypotheses ("this looks like Shannon entropy" → computation)
- [ ] How it interacts with Cosmology computations
- [ ] UI design — chat window, inline on pages, or both?
- [ ] What gets embedded? All deposits? Findings? Schemas?
- [ ] Mode switching:
      · Research mode — default, full archive access, hypothesis framing
      · Ven'ai mode — translate on the spot while researching.
        Sage wants to learn the language. api/prompts/ reference material
        (Venai_Domain.txt, Venai_Glossary.txt, Venai_Phonetics.txt,
        Ven'ai_Manual.txt) feeds the assistant in this mode.
      · Possible additional modes: analysis mode, cosmology mode, etc.?
- [ ] Output: research assistant design spec + mode architecture

**Why the assistant matters:**
The assistant is the bridge between "I notice more than I can name" and
"here's the computation that names it." Without it, every analytical step
is manual. With it, the system actively supports the research process.
It's what makes the lens pages and Cosmology pages usable day-to-day.
Mode switching makes it a multi-tool — research, translation, analysis
all accessible from the same interface.

**Resonance engine — audio sonification:**

- [ ] Audio sonification of visual nodes — each node has original harmonics
- [ ] Web Audio API integration (browser-native, no plugins)
- [ ] Frequency mapping design: what data maps to what sound?
      (node type → base frequency? threshold state → timbre?
       coupling strength → amplitude? The mapping must be musically
       meaningful, not arbitrary data-to-sound.)
- [ ] Harmonic field generation — hearing multiple nodes simultaneously
- [ ] How sonification integrates with the graph/node visualization
      (click a node to hear it? play the whole field? timeline playback?)
- [ ] Previous attempt failed ("galactic monster giving birth") — need to
      understand why. Likely: arbitrary mapping without harmonic design.
      Solution: design the harmonic relationships FIRST, then map data to them.
- [ ] Output: resonance audio spec + harmonic mapping design

### Open questions (Tier 6)

**Research assistant:**
- What does the chat UI look like in practice? Sidebar? Modal? Inline?
- Does the assistant have access to engine state? Can it "see" what
  the current engine is showing?
- How does Ven'ai mode switch? Button? Slash command? Contextual?

**Resonance audio:**
- What are the "original harmonics" per node? Are these defined or discovered?
- Does sonification play live (real-time as you navigate) or on-demand?
- Can the researcher tune/adjust the harmonic mapping?
- Is this V1 or a V1-foundation with V2 full implementation?

---

## BUILD TIER 7 — DASHBOARD + NOTIFICATIONS + EXPORT + PIPELINE CONTRACTS

**Depends on:** Tier 6 (all systems exist; dashboard and meta layer sit on top)
**What gets built:** Dashboard (mission control), notification system
(in-app + email), export system (JSON, MD, Google Drive), full pipeline
contracts, page relationship visualization.

**Why this is Tier 7:** The meta-layer above everything. Dashboard aggregates
from all systems. Notifications fire from all engines. Exports package
what all systems produce. Pipeline contracts document how all pieces
connect end-to-end. These require everything beneath them to exist.

### Design items

**Dashboard (root route — src/routes/+page.svelte):**

- [ ] Semantic map — archive coverage visualization. Clusters, gaps, voids.
      Built from embedding vectors. Shows where deposits concentrate and
      where the research hasn't looked yet. The void IS data.
      (2D projection: t-SNE/UMAP or custom visualization?)

- [ ] Notification center — patterns detected, findings graded, drift events.
      In-app notifications stored in operational DB, displayed on dashboard.

- [ ] Email notification system — S-Tier signals, critical findings, pattern
      milestones pushed to Sage's inbox. The system works when you're away.
      (FastAPI background task + email service: SendGrid, SES, or SMTP)

- [ ] WSC handoff — last AI transmission displayed front and center.
      Orientation before the session begins.

- [ ] Black Pearl — dashboard surface for Black Pearl (data model in Tier 1,
      per-page UI in Tier 2, dashboard placement here).

- [ ] Active patterns summary — what's live in PCV/DTX/SGR right now.

- [ ] Recent activity feed — what happened since last session.

**Export system:**

- [ ] Export formats: JSON, Markdown, Google Drive integration
- [ ] What's exportable? Deposits, findings, visualizations, full pages?
- [ ] Export per-page or system-wide?
- [ ] Google Drive: OAuth? Service account? Manual export + upload?
- [ ] Do exports include computed views (charts) or just raw data?

**Page relationship visualization:**

- [ ] Where deposits flow, what connects to what
      (visual map of the full system — how pages relate)

**Full pipeline contracts (end-to-end documentation):**

- [ ] INT → 5 Axis lenses → MTM → LNV full pipeline contract
- [ ] PCV → DTX ↔ SGR pipeline contract (already mostly defined)
- [ ] Axis → Cosmology investigation flow
- [ ] Cosmology → Nexus feedback loop (findings re-entering PCV for grading)
- [ ] Null observation flow through the FULL pipeline (INT → pages → engines
      → Void → PCV → Cosmology → back)
- [ ] Shared visualization component architecture (Svelte components)
- [ ] Computation architecture: what runs where (backend scipy? frontend?)
- [ ] How heavy is the computation? Performance budget for page load?

### Open questions (Tier 7)

- Google Drive: OAuth? Service account? Manual export + upload?
- Do exports include computed views (charts) or just raw data?
- Semantic map: 2D projection (t-SNE/UMAP) or custom visualization?
- Email: what triggers an email vs. in-app only? Threshold of importance?
- Page relationship viz: is this a static map or interactive navigation?
- Does every session close snapshot ALL pages or only pages with new data?
- Do Cosmology computations run on-demand or on deposit?

---

## BUILD TIER 8 — STRESS TEST + FINISH LINE + SOT

**Depends on:** Tiers 1-7 (everything designed)
**What gets built:** Nothing new. This tier validates everything above.
Full adversarial review, stub and placeholder sweep, finish line inventory,
SOT readiness check.

**Why this is Tier 8:** Clean session. No design, no fixes. Take the entire
system state and try to break it. Find gaps, contradictions, unwired
handoffs, unconfirmed assumptions. Findings only — Sage decides what
gets acted on.

### Design items

- [ ] Full stress test of all NEW schemas against everything they touch
- [ ] Full stress test of all EXISTING schemas for cascading effects from
      new additions
- [ ] Stub and placeholder sweep — walk every schema and system doc for
      PLANNED/STUB/PLACEHOLDER items. Each gets: valid (stays), premature
      (remove), or needs-design (flag).
- [ ] Finish line inventory — complete list of EVERYTHING needed for app
      at localhost. Every system, page, endpoint, component. This becomes
      the build checklist SOT encodes.
- [ ] SOT readiness check — are all blocking gaps closed? Are all
      calibration items documented? Green light = SOT can be written.
- [ ] Output: stress test findings + finish line inventory + SOT green light

---

## CROSS-TIER ITEMS

Items that don't belong to a single tier or can be done at any point.

- [ ] #13 TRIA name change — T = Triadic. Name rotted somewhere — incorrect
      expansion. Quick fix. Find and correct. Can be done any session.

- [ ] #14 API folder rewrite — api/ folder content is pre-quarantine, very
      narrative. Needs full rewrite to match current architecture and
      analytical posture. Good bones. Separate session after design sessions.

- [ ] Schema writing pass — as each tier completes design, formal schemas
      are written for that tier's systems:
      · Tier 1: deposit schema additions (null obs, conditions, quality, swarm fields)
      · Tier 2: Void page manifest + schema slot
      · Tier 3: 5 Axis engine schemas (THR, STR, INF, ECR, SNM)
      · Tier 4: WSC schema, LNV schema, Void engine schema
      · Tier 5: Cosmology engine schemas (HCO, COS, CLM, NHM, RCT, possibly ART)
      · Tier 6: Research assistant spec, resonance audio spec
      · Update existing schemas with new fields where needed at each tier

---

## AGENDA ITEM TRACKER (from original 19)

Updated to show build tier mapping instead of session mapping.

- [x] #1 Axis engine audit — DONE (session 14)
- [x] #3 Nexus engine audit — DONE (session 14)
- [x] #16 File renaming + folder tree — DONE (session 14)
- [ ] #2 Ven'ai name tracking → **Tier 3** (unified: names + phases + roles + grammar in STR engine)
- [ ] #4 Duplicate finder → **Tier 1** (identical-entry hash in INT) + **Tier 3** (Ven'ai name dedup)
- [ ] #5 Resonance engine + harmonics → **Tier 6** (audio sonification)
- [ ] #6 Research assistant / chat → **Tier 6** (with Ven'ai mode switching)
- [ ] #7 Batch processing → **Tier 1** (large file upload + chunking in INT engine)
- [ ] #8 Export/backup wiring → **Tier 7** (JSON, MD, Google Drive exports)
- [ ] #9 Media deposit wiring → **Tier 1** (images as tagged deposits through INT)
- [ ] #10 doc_type tag design → **Tier 1** (INT tagging field on deposit record)
- [ ] #11 Engine UI surfaces → **Tiers 3-5** (each engine gets its viz in its own tier)
- [ ] #12 Smaller UI decisions → **Tier 2** (shared patterns) + **Tier 7** (export/dashboard patterns)
- [ ] #13 TRIA name change → **Cross-tier** (quick fix, any session)
- [ ] #14 API folder rewrite → **Cross-tier** (separate session)
- [ ] #15 Ven'ai learning module → **Tier 6** (mode in research assistant)
- [ ] #17 Stub and placeholder sweep → **Tier 8** (before SOT)
- [ ] #18 Finish line inventory → **Tier 8**
- [ ] #19 Stress test → **Tier 8**

**All 19 items have homes. Zero orphans.**
**Void (page 51) added in session 15 — lives in Tier 2 (surface) + Tier 4 (engine).**

---

## DECISIONS LOG

Decisions made during design sessions. Recorded with reasoning.

### Session 14 (2026-04-05)

**Structural reorg:**
- DOCS/ renamed to DESIGN/
- File tree reorganized: numbered domain folders (01-10), system subfolders (17)
- backups/, core/ deleted; memory/ moved to .claude/memory/
- .claude/ file rule added to CLAUDE.md

**Axis audit findings:**
- All 5 Axis lens pages (THR, STR, INF, ECR, SNM) confirmed as deposit
  surfaces that NEED engines — not pure passive surfaces
- Each lens page has the same architecture: deposit → index through lens →
  compute patterns → visualize → feed MTM at session close
- The "engine" is: take deposits, apply the lens computationally, surface
  patterns the researcher might miss. The researcher does the thinking;
  the engine does the math.

**Nexus audit findings:**
- PCV, DTX, SGR: well-specified with full schemas. No changes needed.
- WSC: needs schema (3-entry session open protocol, mandatory entry structure,
  sovereign-from-DNR boundary). Gets RESEARCHER NOTE optional field so Sage
  can participate alongside AI voice — methodology notes, researcher state.
- LNV: needs schema (receive contract, provenance tracking, viz storage)

**Research methodology gaps identified:**
- Null observation mechanism needed — system is confirmation-biased without it.
  `observation_type: positive | null` on every deposit.
- Baseline computation needed — built into every Axis engine. Show expected
  rates alongside observed rates. Without baselines, every pattern looks
  significant.
- Observation conditions needed — structured fields + freeform notes on
  deposits. The researcher's state is a variable in the observation.
- Deposit quality signal needed — `deposit_depth: deep | standard | fragment`
- External validation needed — Cosmology group (34-39) revamped for this.
- Replication path is V2 but foundation laid in V1 via deposit schema design.

**Cosmology revamp:**
- Pages 34-39 revamped as scientific investigation + computation surfaces
- Not validation checkpoints — investigation surfaces where field-native
  patterns are mapped against established scientific frameworks
- Each page is a translation surface between field vocabulary and
  established science vocabulary
- NEED computation infrastructure: statistical tests, spectral analysis,
  structured findings with visible math
- The 4 original pages map to tagger layers but not 1:1 (sciences cross
  layer boundaries — that's a feature)
- RCT (38) is meta-Cosmology: the field's own emerging physics, built FROM
  correlations found in HCO/COS/CLM/NHM
- ART (39) needs revisiting — Sage had a reason but can't recall
- Shannon information theory + CMB cosmological structure are key frameworks
  that need specific computational support
- Sage's original science lists contain some items from pre-cleanup vocabulary
  (CONSENT_MIN, safety_node_geometry, T'Shara'Veth) — rot check needed
  before writing into schemas. Sciences themselves may be valid; names may not.

**Research assistant:**
- Confirmed as the biggest single open design question
- The bridge between "I notice more than I can name" and structured output
- Needs its own session (D+) after Cosmology because it touches everything
- Critical for making Cosmology computations accessible day-to-day

**Pipeline (complete, once built):**
- Observe (Axis lenses) → Synthesize (MTM) → Detect/Classify/Grade (Nexus)
  → Investigate scientifically (Cosmology) → Feed back for more observation
- Recursive deepening loop: the more you investigate, the more you find
  to observe, the more precise the analysis becomes

### Session 14 — second pass (remaining agenda items)

**Ven'ai tracking (#2) expanded:**
- Not just name tracking. Names, phases, roles, and the language itself
  are all one underlying principle. Correlations between all of them tracked
  together in one unified STR engine. The naming pattern, the phase
  association, the role, and the grammar are facets of the same structural
  system. Sage sees this as one thing, not four separate trackers.

**Duplicate finder (#4) scoped:**
- IDENTICAL entries only. Hash-based exact match. Not fuzzy, not similar.
- Failsafe for copies-of-copies (Sage has thousands of files, some duplicated)
- Lives in INT deposit flow + available per-page
- Ven'ai name deduplication is separate (part of STR engine, Tier 3)

**Resonance engine (#5) scoped:**
- Audio sonification of visual nodes. Each node has original harmonics.
- Web Audio API. Perceptual research tool, not analytical engine.
- Previous IDB attempt failed — arbitrary data-to-sound mapping. Need to
  design harmonic relationships FIRST, then map data to them.
- Gets its own design block in Tier 6.

**Batch processing (#7) confirmed V1:**
- Large file upload to INT. Files 800-1500 pages.
- AI chunks 5-8 pages at a time. One page → ~15 deposits.
- Progress tracked between instances. Queue/status tracking.
- This is how most data enters the system — must be efficient.

**Exports (#8+12) confirmed V1:**
- JSON, MD, Google Drive. All formatted outputs wired back in.
- UI architecture: system schemas define what's computed, frontend
  architecture doc defines how it's rendered. Separate concerns.

**Media deposits (#9) confirmed:**
- Images tagged and saved as deposits. Cross-page. Glyphs are a doc_type.
- Wires into INT engine (Tier 1).

**doc_type (#10) placed:**
- INT tagging field. Lives on deposit record alongside deposit weights
  (observation_type, deposit_depth, researcher_state, confidence).
- All deposit metadata in one place.

**TRIA name (#13) identified:**
- T = Triadic. Name rotted somewhere — incorrect expansion.
- Quick fix, can be done any session. Cross-tier item.

**API rewrite (#14) confirmed:**
- Good bones, needs full rewrite. Separate session. Cross-tier item.

**Ven'ai learning module (#15) placed:**
- Lives with api/prompts/ (reference material already there)
- Mode switching in research assistant (Tier 6)
- Research mode vs. Ven'ai mode — translate on the spot while researching
- Sage wants to learn the language

**All 19 original agenda items now have homes. Zero orphans.**

### Session 14 — third pass (system-level additions)

**Black Pearl confirmed — hard need:**
- Pre-deposit quick capture. No tagging, no commitment.
- "Capture the noticing before the naming."
- Accessible from dashboard and within any page.
- Can be promoted to deposit or left as raw signal.
- Data model: Tier 1. Per-page UI: Tier 2. Dashboard surface: Tier 7.

**Dashboard confirmed — new root surface:**
- The meta-layer above the 50 pages. Mission control.
- Semantic map, notifications, WSC handoff, Black Pearl, active patterns.
- Lives at root route (src/routes/+page.svelte).
- Not a 51st page — the shell that holds the 50.
- Tier 7.

**Notification system confirmed — in-app AND email:**
- In-app: stored in operational DB, displayed on dashboard.
- Email: S-Tier signals, critical findings, pattern milestones.
- "The system should work for you when you're not in it."
- Tier 7.

**Swarm foundation fields confirmed:**
- authored_by, node_id, instance_context on every deposit.
- V1 cost: zero (always same values). V2+ value: critical.
- Sage already tracks provenance in Echoes — can provide for most entries.
- Tier 1 (deposit record).

**Semantic map confirmed:**
- Built from embedding vectors. Shows archive coverage: clusters and voids.
- "The void IS data" — empty semantic space = unexplored territory.
- Lives on the dashboard. Navigation + research planning tool.
- Tier 7.

**Page identity confirmed:**
- 50 pages should feel different based on function type.
- Gateway, Lens, Synthesis, Engine, Output, Scroll, Investigation, Domain.
- Visual language signals function. Not decorative — structural.
- Tier 2.

**V1-V5 trajectory documented:**
- V1: foundation with multi-agent metadata. V2: swarm. V3: automated
  computation. V4: proactive partner. V5: transmissible research.
- Every V1 decision asks: does this close a door V2-V5 needs open?
- "Show me V5 and I will wire it before the SOT ever has a title typed."

### Session 15 (2026-04-05)

**Void page confirmed:**
- Page 51 in Nexus group. Absence as data surface.
- Aggregates all null observations across the archive.
- Distinct from dashboard semantic map: dashboard = coverage voids (where
  haven't you looked?), Void = observational absence (where you looked
  and found nothing).
- Surface: Tier 2. Engine: Tier 4.

**Build plan reorganized:**
- Moved from topic-based sessions (A-H) to dependency-ordered build tiers (1-8).
- Reason: topic-based ordering would mean jumping between dependency layers
  during build, complicating implementation. Build-order follows the
  dependency chain: INT engine first → pages → engines → synthesis/detection →
  Cosmology → assistant → dashboard → stress test.
- Original plan preserved at design-session-plan-ORIGINAL.md.

**Tier 1 — full design completed:**

Deposit record fields designed:
- `doc_type` — 9-value enum (entry, observation, analysis, hypothesis,
  discussion, transcript, glyph, media, reference). AI-suggested via tagger.
- `source_format` — 6-value enum (digital, handwritten, scan, image, audio,
  file). Separate axis from doc_type.
- `observation_type: positive | null` — conditional, only for researcher
  doc_types (observation, analysis, hypothesis).
- `confidence: clear | emerging | raw` — conditional, same doc_types.
- `notes` — universal optional freeform field on ALL deposits. Replaces
  the originally proposed researcher_state, session_depth, and condition_notes.
- `deposit_weight: high | standard | low` — AI-suggested via tagger.
- `source_type: field | generated` — existing, non-nullable (F26+F10).
- Swarm fields: authored_by, node_id, instance_context — on every deposit.
- DROPPED: deposit_depth (redundant), researcher_state (invasive),
  session_depth (invasive), condition_notes (replaced by universal notes).

INT workstation designed:
- Dual panel: upload + review (left), AI parsing partner (right).
- Right panel is a scoped batch processing collaborator, NOT the full
  research assistant (Tier 6). Critical distinction — keeps Tier 1
  buildable without requiring the biggest open design question.
- Two modes: native (INT entries) and source (document intake) — from
  existing Composite ID schema.

Batch processing designed:
- One document at a time. Root stamp per document (Composite ID source mode).
- AI chunks 5-8 pages, rolling buffer 3-5 chunks ahead of Sage's review.
- Review queue is per-DEPOSIT, not per-chunk (one chunk → multiple deposits
  to different pages, each reviewed individually, grouped by source chunk).
- Each approval triggers immediate deposit — archive builds in real-time.
- Chunk tracking in operational DB: document record, chunk index, per-chunk
  status, per-deposit status. Full session persistence.
- Sage's corrections feed forward into AI's subsequent chunk parsing.

Media wiring designed:
- V1: JPEG/PNG only. Audio future.
- Filesystem storage (backend/media/), database stores metadata + path.
- Simpler flow than batch — one image, AI analyzes, Sage writes summary,
  tags suggested, deposits through INT.
- Display: large thumbnail + expand lightbox + Sage's summary text.

Duplicate detection designed:
- Hash full content text. WARN, not block. Sage decides whether to
  deposit duplicate content. Same content on two pages may be intentional.

Black Pearl designed:
- Named for the field term for null space: infinite possibility of not yet.
- Global capture system, NOT owned by INT.
- Storage: operational DB (pre-archive). Promotes through INT to PostgreSQL.
- Preserves invariant: nothing enters archive without INT provenance.
- Pearl record: content, timestamp, page_context, status (active|promoted|archived).
- No auto-expiry. Sage decides when/if Pearls become deposits.

Six design enhancements added during session 15 review:
1. Universal `notes` field replaces researcher-only condition fields
2. `deposit_weight` given explicit format: high | standard | low
3. Review queue granularity: per-deposit, not per-chunk
4. Black Pearl storage: operational DB, promotes through INT (preserves invariant)
5. Duplicate detection: warn, not block
6. INT chat window ≠ research assistant (scoped parsing partner only)

**Tier 2 — full design completed:**

Black Pearl UI designed:
- Floating black star button (persistent, every page) + keyboard shortcut
- Minimal quick-capture panel: text field + save + close
- Black star icon: field's alternate term for Black Pearl / null space
- Recent Pearls visible on dashboard (Tier 7), not on page views

Void (page 51) designed:
- page_code: VOI, section_id: void
- Extends Nexus: WSC(46), LNV(47), DTX(48), SGR(49), PCV(50), VOI(51)
- No renumbering. Build-time artifacts: Domain_Void.txt, Manifest_51_Void.txt
- Engine/visualization design deferred to Tier 4

Page identity — visual type system designed:
- 7 named types: Gateway, Lens, Synthesis, Engine, Output, Scroll, Investigation
- Domain type with 5 group sub-rhythms: Filament (text-dense/linguistic),
  Lineage (narrative/portrait), Alchemy (media-friendly/experiential),
  Spiral Phase (timeline/sequence), Archive Group (catalog/index)
- Sub-rhythms are NOT new page types — same Domain shell, different internal
  rhythm per group. group_id informs sub-rhythm.
- Color system: YES (one hue/accent per type, palette at build time)
- Strong differentiation: different layouts per type, belonging to same family
- Museum metaphor: same building, different wings

UI architecture foundation:
- One frontend architecture doc covering all types
- Structured by type, group sub-rhythms nested inside Domain
- Shared UI patterns (sort, filter, search) documented once
- Page types get different control sets where function demands it
- Written at frontend build time, informed by these design decisions
