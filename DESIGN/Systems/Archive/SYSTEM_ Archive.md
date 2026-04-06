# SYSTEM: Archive

## /DESIGN/Systems/Archive/

### Sealed record surface · three-surface architecture · chain of custody

---

## WHAT THIS SYSTEM OWNS

* Archives page (ARV · 45) — the permanent sealed record surface
* Three-surface architecture — PostgreSQL archives record + Archives page deposit + parent page placement
* Authentication threshold — criteria for what qualifies for sealing
* Sealed record rule — no reopening, no reinterpretation after seal
* Archives page deposit format — what AI writes here at retirement
* page_deposit_id — field on PostgreSQL archives record linking to the page deposit
* Media intake trigger — dropdown button on all pages routing media files to INT
* Nexus feed definition — how downstream systems treat sealed records

## WHAT THIS SYSTEM DOES NOT OWN

* Retirement sequence — owned by INTEGRATION SCHEMA.md
* Post-retirement sequence — owned by INTEGRATION SCHEMA.md (Archive's write sequence is the Archive-side view of post-retirement steps 1-2)
* PostgreSQL archives table schema — owned by INTEGRATION DB SCHEMA.md
* Provenance summary generation — owned by INTEGRATION SCHEMA.md (AI generates at retirement step 5; content surfaces here but originates there)
* ARC id generation or stamp assembly — owned by Composite ID system and FastAPI composite ID service
* Media intake processing — owned by INTEGRATION SCHEMA.md
* Source document parsing — owned by INTEGRATION SCHEMA.md
* Routing authority — owned by SOT

---

## THREE-SURFACE ARCHITECTURE

Every retired source document produces three outputs that share the same ARC id. The first two are automated. The third is manual. The ARC id is the structural thread connecting all three surfaces.

### Surface 1 — PostgreSQL Archives Record

Machine-readable. System source of truth. Created at retirement step 6 (see INTEGRATION SCHEMA.md retirement sequence). Contains the full provenance record, routing data, statistical summary, provenance fields, and methodology fields — all carried forward from root_entries at retirement. Not directly browsable on the Archives page.

Schema fully specified in INTEGRATION DB SCHEMA.md.

### Surface 2 — Archives Page Deposit

Human-browsable. Written by AI at post-retirement step 1 (see INTEGRATION SCHEMA.md post-retirement sequence). A structured entry on the Archives page drawn from the provenance_summary on the PostgreSQL record. This is what Sage reads, searches, and retrieves on the Archives page.

Carries the ARC id and retired_at as metadata fields — the same values on the PostgreSQL record. The ARC id is the thread between all three surfaces.

Deposit format and field definitions in ARCHIVE SCHEMA.md.

### Surface 3 — Parent Page Placement

Not automated. Sage manually creates a deposit entry on the source document's parent page — the section where the physical file contextually belongs (e.g., Recursion for a document parsed across Recursion entries). The deposit carries the ARC id as provenance, linking it to the PostgreSQL record and the Archives page deposit.

The system produces the retirement label. Sage creates the entry. The ARC id is what connects them.

Format: [ARC-ID] · [YYYY-MM-DD]
Example: TS·ARC·EMG·2026-03·0001 · 2026-03-31

The retirement label is the system's handoff to the researcher (see SYSTEM_ Composite ID.md). It is displayed copy-ready at post-retirement step 3. Sage uses it to create the parent page deposit and place the physical file. The label persists until Sage explicitly dismisses it.

Surface 3 is outside the automated system boundary. It requires no system logic — the retirement label supplies everything Sage needs to complete it.

No surface is authoritative over the others — each serves a distinct function. The PostgreSQL record is the system source. The page deposit is the browsable index. The parent page placement is the contextual home of the physical file.

---

## AUTHENTICATION THRESHOLD

The Archives page receives only retired source documents. It is not a thematic page. It does not receive deposits routed from INT parsing. It receives the retirement record of the document itself — after that document has been fully parsed, all deposits resolved or deferred, and the provenance_summary generated with honest confidence reporting.

**What qualifies for the Archives page:**

- Source document has completed the full INT retirement sequence
- confirmed_targets is fully written on root_entries
- provenance_summary contains all six required sections
- retirement_status on root_entries = 'complete'
- open_deferrals = 0, or Sage has explicitly accepted remaining deferrals as unresolvable

**What does not qualify:**

- Partially parsed documents with open pending deposits
- Documents where provenance_summary is incomplete
- Native entries from any content page — those live on their own pages
- Any entry that has not passed through INT retirement

Rejection behavior defined in ARCHIVE SCHEMA.md.

---

## SEALED RECORD RULE

Once an entry is written to the Archives page with status `sealed`, it is not reopened and not reinterpreted. The record reflects what the system found at retirement. If new analysis reveals something missed, that finding lives in the relevant content page or in a new INT intake — not as a modification to the sealed record. The ledger records what happened. It does not revise it.

The sealed record rule is not administrative caution. It is the integrity guarantee that makes the archive's provenance claims defensible. A finding produced from a record that was later modified cannot be attributed to what the record said at the time of the finding. Sealed means the record is what it was when the research happened. That is the only condition under which the archive can be treated as evidence.

Anyone building against this system in V2+ needs to understand: this is not a soft convention. It is the chain of custody. A record that can be reopened is not a chain of custody. It is a draft.

Enforcement mechanics in ARCHIVE SCHEMA.md.

---

## MEDIA INTAKE TRIGGER

A media intake button appears in a dropdown on every page in the archive. Its function is a routing shortcut — it sends a media file to INT as a new source document intake. It does not attach files directly to entries. Nothing enters the archive without INT provenance.

**Why this rule exists:**

An image that is relevant to both Convergence and Lineage must not be siloed to one page entry. It needs INT intake so confirmed_targets can route it to all relevant sections cleanly. Direct attachment bypasses that routing and creates a cross-mapping dead end. The button exists to make INT intake frictionless — not to circumvent it.

**Button placement:**

Dropdown on every page. Consistent position and label across all pages. Does not replace or interfere with the page's primary deposit flow. It is an entry point to INT, not a page-level function.

Mechanical details — form fields, file type handling, INT handoff sequence — in ARCHIVE SCHEMA.md. Full media deposit wiring in INTEGRATION SCHEMA.md.

---

## NEXUS FEED

Archives feeds three pages. What makes Archives a distinct nexus source is epistemic weight — sealed records are authenticated and fixed. Nexus pages reading from Archives are reading from the most verified layer of the system.

**Pattern Convergence (PCV · 50)**

PCV treats sealed records as confirmed historical signal — not hypotheses awaiting validation. When PCV aligns cross-domain signals on shared axes, sealed archive records carry more weight than provisional entries. A pattern that appears in both live entries and sealed archive records is structurally confirmed, not just emergent.

**Liber Novus (LNV · 47)**

LNV holds sealed records as permanent provenance anchors for findings that reference the same material. Sealed records arriving on LNV carry their provenance intact — arc_id, retired_at, source origin, confirmed routing. LNV holds them without editorializing.

**RCT (38)**

RCT reads sealed records as fixed reference points for the physics algorithm — the algorithm's behavior at retirement time is documented and stable. What is archived is what the system was confident enough to seal — that confidence is the data RCT needs, and the fixedness is what makes the reference point usable.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/services/entry.py | PostgreSQL archives table — record creation, page_deposit_id write, sealed entry enforcement | PLANNED |
| frontend/ (Archives page) | Svelte — Archives page render, media intake trigger dropdown, sealed entry display | PLANNED |
