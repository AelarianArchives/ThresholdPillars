# SYSTEM: Composite ID

## composite_id_system.md

### /DESIGN/systems/

### Stamp format · preview rendering · sequence counter · retirement label

---

## WHAT THIS SYSTEM OWNS

* Composite ID stamp format — canonical structure for all entry IDs in the archive
* Three stamp types — root · native · child — and the rules governing each
* Preview stamp rendering across all panels (CompositeId Svelte component)
* Locked stamp assembly at save time (FastAPI composite ID service)
* Integration panel two-mode handling — native and source
* CompositeId Svelte component — stamp rendering across all panels via reactive prop bindings
* Phase select population from PHASE_CODES across all panels
* Archive retirement label — produced at retirement, shared at completion

## WHAT THIS SYSTEM DOES NOT OWN

* Entry reads or writes — owned by INTEGRATION DB SCHEMA.md, served via FastAPI `/entries/` endpoints
* Sequence counter storage — owned by PostgreSQL (`ts_sequence` SEQUENCE object), accessed by FastAPI composite ID service
* Entry schema — owned by INTEGRATION DB SCHEMA.md
* PHASE_CODES or PAGE_CODES definitions — owned by SECTION MAP.md, served via FastAPI
* Retirement sequence — owned by INTEGRATION SCHEMA.md
* Archives page deposit — owned by ARCHIVE SCHEMA.md
* Tag pipeline — owned by TAGGER SCHEMA.md, state held in tagger Svelte store

---

## THREE STAMP TYPES

### Root Stamp — source document intake

Produced when a source document enters Integration in source mode. The root stamp is the parent identity for all child deposits parsed from that document.

Format:   TS · AX · [PHASE] · [YYYY-MM] · [SEQ]
Preview:  TS · AX · [PHASE] · [YYYY-MM] · ——
Example:  TS · AX · EMG · 2026-03 · 0001

`AX` is the Axis root marker. It is hardcoded — not derived from a section. It signals that this ID is a parent record from source mode intake.

Root stamps in source mode are assembled with the AX page code directly in the CompositeId Svelte component. They do not pass through the native preview path.

### Native Stamp — standard entry

Produced for every entry that originates on a content page rather than from a source document intake.

Format:   TS · [PAGE-CODE] · [PHASE-CODE] · [YYYY-MM] · [SEQ]
Preview:  TS · [PAGE-CODE] · [PHASE-CODE] · [YYYY-MM] · ——
Example:  TS · TPL · EMG · 2026-03 · 0042

`[PAGE-CODE]` is the two-to-three character code for the section the entry belongs to. Sourced from PAGE_CODES in SECTION MAP.md, served to the frontend via API.

`[PHASE-CODE]` is the lifecycle phase code selected by the user, or `NUL` if no phase picker exists on the panel.

### Child Stamp — deposit from parsed source document

Produced for every deposit entry that originates from a parsed source document. Assembled in FastAPI composite ID service at write time. Not previewed in the UI — the preview surface shows the root stamp during parsing. The child stamp is locked at the moment of deposit commit.

Format:   TS · [PAGE] · [PHASE] · [YYYY-MM] · [SEQ] · root:[PARENT-ID]
Example:  TS · REC · EMG · 2026-03 · 0017 · root:TS·AX·EMG·2026-03·0001

`root:[PARENT-ID]` is embedded in the stamp string AND stored as `root_ref` on the entry record. The stamp is human-readable provenance. The field is machine-readable join key.

Child stamps are a backend concern at write time. The frontend CompositeId component does not preview or assemble them.

---

## PREVIEW VS LOCKED STAMP

**Preview** — shown in the stamp display element while the panel is open and before save. SEQ slot shows `——`. Updates reactively as date and phase inputs change via Svelte bindings.

**Locked** — written to the entry record at save time by the FastAPI composite ID service. SEQ slot is a zero-padded integer sourced from the PostgreSQL `ts_sequence` SEQUENCE. Once locked, the stamp does not change.

Preview runs in the CompositeId Svelte component — sync, reactive, no API call, no sequence counter interaction. Locked stamp assembly runs in FastAPI — calls `NEXTVAL('ts_sequence')` on PostgreSQL, must only be called on confirmed save.

Sequence numbers are permanently retired on use. They are never reused. PostgreSQL SEQUENCE objects guarantee this — `NEXTVAL` is not transactional.

---

## INTEGRATION PANEL — TWO MODES

The Integration panel operates in two modes. All other panels use native mode only.

**native** — entry originates on the Integration page itself. Page code = INT. Stamp preview uses the native preview path in the CompositeId component. Default mode.

**source** — source document intake. Page code = AX. Stamp preview assembled with AX code directly in the CompositeId component. Does not use the native preview path.

Mode is set when the panel opens via the `mode` prop on the CompositeId component, or toggled mid-session via reactive binding when the user switches the routing radio on the Integration panel.

Mode resets to `native` on panel close (component unmount).

---

## COMPOSITEID SVELTE COMPONENT

The CompositeId Svelte component manages stamp preview rendering across all panels. It is included as a child component in each panel. Context changes per panel via props. The component is the same.

**Default state with no panel active:**

When no panel is open, no CompositeId component is mounted. There is nothing to preview when no panel is open. This is correct behavior.

**Props:**

```
panelId     — which panel this instance belongs to
sectionId   — current section context
mode        — 'native' | 'source' (Integration only, default: 'native')
dateValue   — bound to the panel's date input
phaseValue  — bound to the panel's phase select (null if no picker)
```

**Reactive behavior:**

The component reactively computes the preview stamp whenever `dateValue`, `phaseValue`, `sectionId`, or `mode` changes. No manual refresh needed — Svelte reactivity handles updates automatically.

**Adding a new panel — all steps required:**

1. Add panel entry to all three panel configuration maps
2. Include CompositeId component in the new panel's Svelte component
3. Bind `dateValue` to the panel's date input
4. Bind `phaseValue` to the panel's phase select (or pass null)
5. Pass `panelId` and `sectionId` as props

Missing any step = stamp will not render or will show stale data.

---

## PHASE SELECT POPULATION

Phase selects on all panels are populated from PHASE_CODES data fetched from FastAPI at app initialization and held in a Svelte config store.

Never manually populate a phase select. Never hardcode phase options. All phase values come from PHASE_CODES via API.

Panels without a phase picker use `NUL` at save time.

---

## PANEL CONFIGURATION

16 panels total in v1. Each panel includes the CompositeId component and passes its configuration as props. In the Svelte architecture, panel wiring is expressed through component inclusion and prop bindings rather than DOM element ID maps.

### PANEL_DATE_MAP — which panels have date inputs

All 16 panels have date inputs:
invoke · kin · glyph · ll · eo · lin · lattice · ss ·
rituals · breath · melodies · spiral · memory · liber ·
venai · integration

### PANEL_PHASE_MAP — which panels have phase selects

Only Integration has a phase select. All other panels pass null:
invoke: null · kin: null · glyph: null · ll: null ·
eo: null · lin: null · lattice: null · ss: null ·
rituals: null · breath: null · melodies: null ·
spiral: null · memory: null · liber: null ·
venai: null (lexicon entries — always NUL) ·
integration: has phase select

### PANEL_STAMP_MAP — which panels have stamp displays

All 16 panels have stamp displays. The CompositeId component renders the stamp preview in every panel where it is included.

---

## ARCHIVE RETIREMENT LABEL

When a source document completes retirement, the system produces a retirement label. This label is the bridge between the PostgreSQL archives record, the Archives page deposit, and the physical file Sage places in the parent page.

**Format:**

[ARC-ID] · [YYYY-MM-DD]
Example: TS·ARC·EMG·2026-03·0001 · 2026-03-31

**What it connects:**

The ARC id is shared across three surfaces at retirement:

PostgreSQL archives record — id field. Machine-readable. System source of truth.
Archives page deposit      — metadata field. Human-browsable surface on the
                             Archives page. Written by AI at retirement.
Parent page deposit        — reference field on the entry Sage creates manually
                             in the section where the physical file is placed.

All three carry the same ARC id. The retirement label makes that id portable — copy-ready at retirement completion so Sage can apply it to the parent page deposit and the physical file without hunting for it.

**At retirement completion:**

The Integration UI displays the retirement label prominently — ARC id and `retired_at` timestamp, formatted and copy-ready. This is an Integration system requirement. The display is surfaced at the final step of the retirement sequence before the session closes.

The physical file naming convention: Sage appends the ARC id to the filename or adds it as a header reference on the document. No automation required. The id is the thread. Sage places it.

---

## SEQUENCES

### PANEL ACTIVATION SEQUENCE — strict order

1. App initialization: PHASE_CODES and PAGE_CODES fetched from FastAPI and stored in Svelte config store. All panels can reference these values via store subscription.
2. On every section navigation: `sectionId` prop updated on the active CompositeId component instance. Stamp preview recomputes reactively.
3. On panel open: CompositeId component mounts within the panel. Receives `panelId`, `sectionId`, `dateValue`, `phaseValue`, `mode` as props. Initial stamp preview renders automatically from prop values.
4. If Integration panel and user toggles routing radio: `mode` prop updates via reactive binding. Stamp re-renders in new mode immediately.
5. On panel close: CompositeId component unmounts. Mode state is discarded. No cleanup needed — Svelte handles component lifecycle.

Failure at step 1: PHASE_CODES not loaded. Phase selects cannot populate. Guard: app surfaces named error. Panels requiring phase selection cannot open until data is loaded.
Failure at step 3: CompositeId component not included in panel. Stamp does not render. Guard: every panel component includes CompositeId with correct prop bindings.

### SAVE SEQUENCE — strict order

1. Preview stamp displayed in panel while user edits. Computed reactively in CompositeId Svelte component. SEQ slot shows ——. No API call.
2. User confirms save. Save handler fires.
3. Frontend calls FastAPI composite ID service. Service reads `NEXTVAL('ts_sequence')` from PostgreSQL. Returns locked stamp with zero-padded SEQ. Counter increment is permanent — SEQ is retired whether or not the entry save succeeds.
4. Locked stamp written to entry record via FastAPI. `entry.compositeId` set. Not changed after this point.

Failure at step 3 (PostgreSQL SEQUENCE unavailable): stamp not assembled. Save halts. No entry written. Retry produces the next SEQ.
Failure between steps 3 and 4 (entry write fails after counter incremented): SEQ is permanently retired. A gap appears in the sequence. Gaps are not errors — they are the cost of the no-reuse rule.

---

## PUBLIC API

### Frontend (Svelte — src/lib/)

**CompositeId.svelte** — stamp preview component

Included as child in every panel. Receives `panelId`, `sectionId`, `mode`, `dateValue`, `phaseValue` as props. Reactively computes preview stamp. No API calls. No sequence counter interaction.

**src/lib/stores/config.ts** — configuration store

Holds PHASE_CODES and PAGE_CODES fetched from FastAPI at app initialization. All panels subscribe for phase select population and page code lookup.

### Backend (FastAPI)

**backend/services/composite_id.py** — locked stamp assembly

Called on confirmed save path only. Reads `NEXTVAL('ts_sequence')` from PostgreSQL. Assembles locked stamp string. Returns final composite ID. Also handles child stamp assembly for parsed source documents.

---

## KNOWN FAILURE MODES

**1. Locked stamp assembled during preview** FastAPI composite ID service called during preview rather than save. Sequence counter increments. Number permanently retired. Guard: locked stamp assembly (FastAPI) called only inside confirmed save path. Preview runs in Svelte component with no API call. These two paths are never substituted.

**2. Panel configuration not updated when a new panel is added** Stamp does not render. Phase select not wired. Guard: all three configuration maps updated together. All wiring steps completed. Never add a panel without updating all maps.

**3. Mode set on a non-Integration panel** No-op by design. But if mode state persists incorrectly (panel unmounts without reset), subsequent Integration panel may inherit wrong mode. Guard: mode resets on component unmount via Svelte lifecycle.

**4. Native preview path used in source mode** Source mode stamp uses AX page code. Native preview path produces INT page code — wrong stamp. Guard: source mode stamp assembly bypasses native preview path entirely. Mode check runs before any stamp computation.

**5. Retirement label not surfaced at completion** Sage cannot copy the ARC id without querying the database record. Guard: Integration UI displays retirement label prominently and copy-ready at final retirement step. Required UI element.

**6. Sequence counter unavailable** PostgreSQL connection fails when FastAPI attempts NEXTVAL. Guard: save fails with named error. No partial entry written. Entry remains in frontend panel state for retry.

**7. PHASE_CODES not loaded at app start** Frontend cannot populate phase selects. Guard: PHASE_CODES fetched at initialization and stored in Svelte config store. Fetch failure surfaces named error — panels cannot open until loaded.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| `src/lib/components/CompositeId.svelte` | Stamp preview rendering, phase select population, mode handling. Included as child in every panel. | PLANNED |
| `src/lib/stores/config.ts` | Svelte store for PHASE_CODES and PAGE_CODES from FastAPI | PLANNED |
| `backend/services/composite_id.py` | Locked stamp assembly — PostgreSQL SEQUENCE, stamp string, child stamps | PLANNED |
| `backend/db/migrations/` | PostgreSQL SEQUENCE definition (ts_sequence) managed via Alembic migration. Not a discrete model file. | PLANNED |
