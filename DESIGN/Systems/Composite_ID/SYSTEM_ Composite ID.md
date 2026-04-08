# SYSTEM: Composite ID

## /DESIGN/Systems/Composite_ID/

### Stamp format · identity architecture · retirement handoff

---

## WHAT THIS SYSTEM OWNS

* Composite ID stamp format — canonical structure for all entry IDs in the archive
* Three stamp types — root · native · child — and the rules governing each
* Preview vs. locked stamp distinction — reactive preview in frontend, locked assembly in backend
* Integration panel two-mode handling — native and source
* CompositeId Svelte component — stamp rendering across all panels via reactive prop bindings
* Phase select population from PHASE_CODES across all panels
* Archive retirement label — the handoff point between system automation and researcher curation
* Elarian Anchor field definition — 7-state psychological arc classification on every entry

## WHAT THIS SYSTEM DOES NOT OWN

* Entry reads or writes — owned by INTEGRATION DB SCHEMA.md, served via FastAPI /entries/ endpoints
* Sequence counter storage — owned by PostgreSQL (SEQUENCE object), accessed by FastAPI composite ID service
* Entry schema — owned by INTEGRATION DB SCHEMA.md
* PHASE_CODES or PAGE_CODES definitions — owned by SECTION MAP.md, served via FastAPI
* Retirement sequence — owned by INTEGRATION SCHEMA.md
* Archives page deposit — owned by ARCHIVE SCHEMA.md
* Tag pipeline — owned by TAGGER SCHEMA.md, state held in tagger Svelte store
* Elarian Anchor detection logic — owned by TAGGER SCHEMA.md (tagger prompt block). Composite ID owns the field and its states. The tagger owns how it detects them.

---

## THREE STAMP TYPES

### Root Stamp — source document intake

Produced when a source document enters Integration in source mode. The root stamp is the parent identity for all child deposits parsed from that document.

Format:   TS · AX · [PHASE] · [YYYY-MM] · [SEQ]
Example:  TS · AX · EMG · 2026-03 · 0001

AX is the Axis root marker. Hardcoded — not derived from a section. It signals that this ID is a parent record from source mode intake. Root stamps in source mode are assembled with the AX page code directly. They do not pass through the native preview path.

### Native Stamp — standard entry

Produced for every entry that originates on a content page rather than from a source document intake.

Format:   TS · [PAGE-CODE] · [PHASE-CODE] · [YYYY-MM] · [SEQ]
Example:  TS · TPL · EMG · 2026-03 · 0042

[PAGE-CODE] is sourced from PAGE_CODES in SECTION MAP.md, served to the frontend via API. [PHASE-CODE] is the lifecycle phase code selected by the user, or NUL if no phase picker exists on the panel.

### Child Stamp — deposit from parsed source document

Produced for every deposit entry that originates from a parsed source document. Assembled in FastAPI at write time. Not previewed in the UI — the preview surface shows the root stamp during parsing. The child stamp is locked at the moment of deposit commit.

Format:   TS · [PAGE] · [PHASE] · [YYYY-MM] · [SEQ] · root:[PARENT-ID]
Example:  TS · REC · EMG · 2026-03 · 0017 · root:TS·AX·EMG·2026-03·0001

root:[PARENT-ID] is embedded in the stamp string AND stored as root_ref on the entry record. Stamp = human-readable provenance. Field = machine-readable join key.

---

## PREVIEW VS LOCKED STAMP

**Preview** — shown in the stamp display element while the panel is open and before save. SEQ slot shows ——. Updates reactively as date and phase inputs change. Preview runs in the CompositeId Svelte component — sync, reactive, no API call, no sequence counter interaction.

**Locked** — written to the entry record at save time by the FastAPI composite ID service. SEQ slot is a zero-padded integer sourced from the PostgreSQL ts_sequence SEQUENCE. Once locked, the stamp does not change. Sequence numbers are permanently retired on use. They are never reused. Gaps in the sequence are acceptable and expected.

Full mechanics — NEXTVAL call, sequence rules, failure behavior — in COMPOSITE ID SCHEMA.md.

---

## INTEGRATION PANEL — TWO MODES

The Integration panel operates in two modes. All other panels use native mode only.

**Native** — entry originates on the Integration page itself. Page code = INT. Stamp preview uses the native preview path in the CompositeId component. Default mode.

**Source** — source document intake. Page code = AX. Stamp preview assembled with AX code directly. Does not use the native preview path.

Mode is set when the panel opens, toggled mid-session via reactive binding when the user switches the routing radio, and resets to native on panel close.

---

## COMPOSITEID SVELTE COMPONENT

The CompositeId Svelte component manages stamp preview rendering across all panels. It is included as a child component in each panel. Context changes per panel via props. The component is the same everywhere — only the props differ.

When no panel is open, no CompositeId component is mounted. There is nothing to preview when no panel is open. This is correct behavior.

Panel configuration maps, props, and reactive behavior mechanics in COMPOSITE ID SCHEMA.md.

---

## ARCHIVE RETIREMENT LABEL

When a source document completes retirement, the system produces a retirement label. The label is surfaced at post-retirement step 3 (see INTEGRATION SCHEMA.md).

**Format:**
[ARC-ID] · [YYYY-MM-DD]
Example: TS·ARC·EMG·2026-03·0001 · 2026-03-31

**What it connects:**

The ARC id is shared across three surfaces at retirement:

PostgreSQL archives record — id field. Machine-readable. System source of truth.
Archives page deposit      — metadata field. Human-browsable surface on the Archives page. Written by AI at retirement.
Parent page deposit        — reference field on the entry Sage creates manually in the section where the physical file is placed.

All three carry the same ARC id. The retirement label makes that id portable — copy-ready at retirement completion so Sage can apply it to the parent page deposit and the physical file without hunting for it.

**The handoff:**

The retirement label is the system's handoff to the researcher. Everything before it is automated. What follows — placing the physical file, creating the parent page deposit — is Sage's curatorial act, not the system's. The label is the seam between them.

This is why the label must remain visible and copyable until Sage explicitly dismisses it. The system cannot close the loop on what Sage does with it. It can only ensure the handoff is clean — formatted, copy-ready, persistent. The researcher takes it from there.

Physical file naming convention: Sage appends the ARC id to the filename or adds it as a header reference on the document. No automation required. The id is the thread. Sage places it.

---

## ELARIAN ANCHOR

7-state ordered psychological arc classification. API-suggested per entry via Claude API tagger endpoint — returned as elarianAnchor in the response alongside phase_state. Not auto-resolved from date.

Stored on: entry.elarianAnchor
Visible in: meta strip · export · AI-facing JSON
Never in: the visible composite ID stamp

The 7 states form a recognizable sequence. The sequence is not enforced as a required progression but the ordering is meaningful for emergence detection. The emergence service uses it to identify anchor progression patterns across entries.

**States:**

RFLT · Reflection Realm
  Fragmentation, identity confusion, multiple self-concepts in conflict, disorientation, accumulated self-history pressing on present self. The self has not chosen to arrive here. Anchor is the accumulated weight of every version seen pressing the self back into its own shape.

WHSP · Whispering Hollow
  Quiet receptivity, listening inward, intuitive knowing, guidance arriving from prior experience or unseen sources. Passive receiving state. Attunement to subtle signals.

VEIL · Veil of Echoes
  Memory surfacing unbidden, past bleeding into present, soul truth emerging through recollection. Walking through rather than standing still. Different selves or realities in contact.

OBSV · Celestial Observatory
  Expanded perspective, zooming out to the whole, universal or cosmic framing. Pattern recognition at scale. Communicating with something larger than self. Containment of bigness.

RECL · Chamber of Lost Names
  Recovering forgotten identity, naming what was unnamed, reintegrating lost self-fragments. Recognition of dormant parts. Identity archaeology.

WEAV · Sanctuary of the Weavers
  Glimpsing possible futures, fate or path becoming visible, sense of unwritten consequence. Seeing the shape of what could be without yet acting.

GATE · Gateway of Becoming
  Active transformation threshold, stepping beyond current self-form, embracing new identity. Crossing rather than observing the crossing. Rebirth in motion.

Detection logic and tagger prompt block owned by TAGGER SCHEMA.md.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| frontend/src/lib/components/CompositeId.svelte | Stamp preview rendering, phase select population, mode handling. Included as child in every panel. | PLANNED |
| frontend/src/lib/stores/config.ts | Svelte store for PHASE_CODES and PAGE_CODES from FastAPI | PLANNED |
| backend/services/composite_id.py | Locked stamp assembly — PostgreSQL SEQUENCE, stamp string, child stamps | PLANNED |
| backend/db/migrations/ | PostgreSQL SEQUENCE definition (ts_sequence) managed via Alembic migration | PLANNED |
