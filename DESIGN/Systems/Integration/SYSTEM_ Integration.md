# SYSTEM: Integration

## /DESIGN/Systems/Integration/

---

## WHAT THIS SYSTEM OWNS

* INT page (01) — the single entry point for all source material into the archive
* Source document intake — two paths: single-chunk and large file
* Batch processing — how large volumes of existing files enter the archive
* Manifest session management — chunk parsing, deposit tracking, session states
* Deposit resolution — confirmed · skipped · deferred, split deposit handling
* Retirement sequence — all 13 steps, checkpoint recovery, arc_seq coordination
* Post-retirement sequence — Archives page deposit, ARC label, embedding trigger
* Provenance summary generation — six required sections, AI-generated at retirement step 5
* Media intake handling — media files routed as source documents through INT
* AI behavioral posture — routing discipline, parsing confidence, deferral support
* INT workstation — dual panel design (upload + review left, parsing partner right)
* Black Pearl promotion path — Pearl enters the archive only through INT gateway

## WHAT THIS SYSTEM DOES NOT OWN

* Database table schema — defined by SQLAlchemy models (backend/models/). Authoritative spec: INTEGRATION DB SCHEMA.md
* ARC id generation and sequence counter — owned by FastAPI composite ID service and composite_id_system
* Archives page deposit content format — defined in SYSTEM_ Archive.md
* Tag resolution logic — owned by tagger backend service (backend/services/). Tag UI state — owned by tagger Svelte store (frontend/). Pipeline spans both; neither owns it exclusively.
* Routing authority — owned by SOT. INT never guesses routing.
* MTM synthesis cycle — MTM reads across Axis lens pages at session close and produces Findings independently. INT does not trigger or feed MTM directly.
* Research assistant — the INT parsing partner is NOT the research assistant (Tier 6). The research assistant owns RAG, mode switching, and Cosmology integration. The parsing partner is scoped to batch processing collaboration.
* Black Pearl capture UI — owned by Tier 2 (per-page) and Tier 7 (dashboard). INT owns the promotion path only.

---

## THE INT GATEWAY RULE

No entry reaches any section of the archive without clearing INT first. Every field observation, session transcript, external source, research document, and media file enters the system here before it exists anywhere else.

INT routes to all sections except MTM (07). MTM is the Axis synthesis layer. It does not receive deposits. It reads across the five Axis lens pages (THR · STR · INF · ECR · SNM) and produces Findings through a separate AI-driven synthesis cycle at session close. Material that would otherwise route to MTM routes instead to the appropriate Axis lens page. MTM reads from there.

This rule has no exceptions. A deposit that bypasses INT has no provenance. No routing record. No confirmed_targets. It is structurally invisible to every downstream system that reads from the archive.

Black Pearl promotion enforces this rule: a Pearl is pre-archive (SQLite operational DB) until promoted through INT gateway, at which point it receives full deposit fields and enters PostgreSQL as a real deposit.

---

## AI BEHAVIORAL POSTURE

The AI's role in Integration is to make the intake sequence legible enough for Sage to decide. The AI does not decide what enters the archive.

**Routing discipline:** Routing is proposed from the SOT section map only. Never guessed. Never assumed. If a deposit's routing is genuinely unclear, the AI names the ambiguity and proposes the closest match with explicit uncertainty — it does not present a guess as a confirmed route.

**Split deposit handling:** Split deposits are flagged at identification — at the moment the deposit is recognized as belonging to more than one section. Not after the fact. Each target is named independently. Targets confirm independently. A split deposit is never collapsed into a single target.

**Deferral support:** Deferrals are flagged without resolution pressure. The AI names what is unresolved and why, holds the deposit open, and does not force a routing decision where one cannot be made with confidence. Retirement is gated on open_deferrals = 0 — but that gate is enforced by the system, not by pressuring deposits to resolve.

**Parsing confidence:** Provenance summaries are generated with honest self-assessment. If something was missed, misrouted, or exceeded parsing clarity, it is named in the parsing confidence section. A future model reads this to weight its own interpretation of the record. Inflated confidence corrupts the pipeline.

---

## TWO INTAKE PATHS

**Single-chunk:** Document fits within one chunk_size. The full text is written to the root entry record at intake. One manifest session handles the entire document.

**Large file:** Raw page count exceeds chunk_size. File is uploaded as a blob. Total chunks computed from page count and chunk size. Each chunk gets its own manifest session opened in sequence as prior sessions complete.

Which path is determined at intake step 3 — before any manifest is opened. chunk_size is set once in the pre-step (max 10, no exceptions) and does not change after intake begins.

Full intake sequence mechanics, step-by-step processing, and field definitions are in INTEGRATION SCHEMA.md.

---

## INT WORKSTATION — DUAL PANEL DESIGN

The Integration page is a collaborative workstation with two panels.

**Left panel — upload + review:**
- File upload area (drag-drop or button) with title, note, date fields
- Review queue showing deposits as they come in from parsing
- Per-deposit controls: approve, correct routing/tags, skip, decline
- Progress indicator (chunk N of M, deposits approved/pending/total)
- Sage's own tags and notes added here alongside deposits
- All deposit metadata fields (doc_type, source_format, etc.) visible and editable during review

**Right panel — AI parsing partner (NOT the research assistant):**
- Scoped to batch processing collaboration: parsing, context enrichment, correction feedback loop
- Uses Claude API but is NOT the full research assistant (Tier 6)
- Sage adds context here: "this section is from when phase X started"
- AI carries context forward into subsequent chunk parsing
- Corrections feed forward: "this goes to ECR not THR" adjusts AI approach for remaining chunks

**Two modes (from Composite ID schema):**
- Native mode: entry originates on INT page. Page code = INT.
- Source mode: source document intake. Page code = AX. Produces root stamp.

Parsing partner API contract, parse object shape, and correction propagation mechanics are in INTEGRATION SCHEMA.md.

---

## MEDIA INTAKE

Media files arriving from the intake trigger button on any archive page are processed as source documents through the standard intake sequence.

Accepted formats (V1): JPEG, PNG. Audio is future, not V1. Glyphs embedded in documents are handled by batch processing naturally. Standalone images use this flow.

Storage: Filesystem (backend/media/). Database stores metadata + file path. Media folder added to .gitignore for git, included in backup.py folder copy.

Media files follow the same intake sequence as text documents. They receive provenance, confirmed_targets routing, and retirement. No media file bypasses INT. The intake trigger on archive pages is the only upload path. Direct attachment to page entries is not permitted.

Doc_type mapping, upload flow mechanics, and media deposit card design are in INTEGRATION SCHEMA.md.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/routes/entries.py | FastAPI route handlers — intake, manifest sessions, deposits, retirement, media intake | PLANNED |
| backend/services/entry.py | Service layer — intake sequence, retirement sequence, deposit resolution, arc_seq coordination | PLANNED |
| backend/models/entries.py | SQLAlchemy models — root_entries, file_assets, manifest_sessions, archives, system_counters | PLANNED |
| frontend/ (INT page) | Svelte UI — INT workstation: dual panel (upload + review left, parsing partner right), deposit review cards, retirement trigger, retirement label display, media intake | PLANNED |
