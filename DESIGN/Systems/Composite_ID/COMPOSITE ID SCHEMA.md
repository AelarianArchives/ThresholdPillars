╔══════════════════════════════════════════════════════════════╗
║  COMPOSITE ID SCHEMA  ·  V1                                 ║
║  /DESIGN/Systems/Composite_ID/COMPOSITE ID SCHEMA.md         ║
║  Mechanical spec — sequences, assembly, component, config.   ║
║  Architectural description in SYSTEM_ Composite ID.md.       ║
╚══════════════════════════════════════════════════════════════╝


OWNERSHIP BOUNDARIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OWNS
Stamp assembly mechanics — preview path (Svelte) and locked path (FastAPI)
Sequence counter operations — NEXTVAL, gap rules, retry behavior
CompositeId Svelte component — props, reactive behavior, lifecycle
Panel configuration maps — date, phase, stamp display wiring
Integration panel mode mechanics — mode lifecycle, toggle, reset
Elarian Anchor response shape — API contract for tagger response
Known failure modes — all guards and recovery paths

DOES NOT OWN
Stamp type definitions and architectural identity — owned by SYSTEM_ Composite ID.md
Retirement label architectural framing — owned by SYSTEM_ Composite ID.md
Elarian Anchor state descriptions — owned by SYSTEM_ Composite ID.md
Entry reads or writes — owned by INTEGRATION DB SCHEMA.md
Sequence counter storage — owned by PostgreSQL SEQUENCE object
PHASE_CODES or PAGE_CODES definitions — owned by SECTION MAP.md
Retirement sequence — owned by INTEGRATION SCHEMA.md
Elarian Anchor detection logic — owned by TAGGER SCHEMA.md


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STAMP FORMAT REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROOT STAMP — source document intake

  Format:   TS · AX · [PHASE] · [YYYY-MM] · [SEQ]
  Preview:  TS · AX · [PHASE] · [YYYY-MM] · ——
  Example:  TS · AX · EMG · 2026-03 · 0001

  AX is hardcoded. Root stamps in source mode bypass the native
  preview path — assembled with AX page code directly in the
  CompositeId component.

NATIVE STAMP — standard entry

  Format:   TS · [PAGE-CODE] · [PHASE-CODE] · [YYYY-MM] · [SEQ]
  Preview:  TS · [PAGE-CODE] · [PHASE-CODE] · [YYYY-MM] · ——
  Example:  TS · TPL · EMG · 2026-03 · 0042

  [PAGE-CODE] from PAGE_CODES in SECTION MAP.md via API.
  [PHASE-CODE] from user selection or NUL if no phase picker.

CHILD STAMP — deposit from parsed source document

  Format:  TS · [PAGE] · [PHASE] · [YYYY-MM] · [SEQ]
           · root:[PARENT-ID]
  Example: TS · REC · EMG · 2026-03 · 0017
           · root:TS·AX·EMG·2026-03·0001

  root:[PARENT-ID] embedded in stamp string AND stored as root_ref.
  Child stamps are a backend concern at write time. The frontend
  CompositeId component does not preview or assemble them.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREVIEW VS LOCKED — MECHANICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PREVIEW PATH (Svelte component):
  Sync, reactive, no API call, no sequence counter interaction.
  SEQ slot shows ——. Recomputes on every input change.
  Safe to call on every keystroke — zero side effects.

LOCKED PATH (FastAPI service):
  Calls NEXTVAL('ts_sequence') on PostgreSQL. Returns locked stamp
  with zero-padded SEQ. Must only be called on confirmed save.
  Never called during preview.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEQUENCE COUNTER — PostgreSQL SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    CREATE SEQUENCE ts_sequence
      START WITH 1
      INCREMENT BY 1
      NO MAXVALUE
      NO CYCLE;

NEXTVAL('ts_sequence') is called by the FastAPI composite ID service
at save time. The returned value is zero-padded and placed in the
SEQ slot of the locked stamp.

SEQUENCE RULES:

  Sequence numbers are permanently retired on use. They are never
  reused. A number incremented and not written to a record is gone —
  gaps in the sequence are acceptable and expected. Preventing gaps
  is not a system requirement.

  PostgreSQL SEQUENCE objects guarantee this behavior by default —
  NEXTVAL is not transactional. A rolled-back transaction still
  consumes the sequence number.

  Save failure after NEXTVAL call produces a permanent sequence gap.
  This is expected behavior, not an error state. The stamp was
  constructed but never stored. On retry, a new NEXTVAL fires and a
  new stamp is assembled. The original stamp is permanently retired,
  never used. Do not attempt to recover orphaned stamps.

  Child stamps from the same chunk are not guaranteed to be contiguous
  in sequence. Each deposit commit fires an independent NEXTVAL.
  Sequence gaps between sibling deposits from the same chunk are
  expected and do not indicate data loss. In V1 (single researcher)
  this is unlikely but architecturally possible. In V2+ (swarm with
  multiple concurrent sessions) interleaved NEXTVAL calls across
  sessions will produce non-contiguous sibling stamps routinely.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTEGRATION PANEL — MODE MECHANICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODE LIFECYCLE:

  Set:    when the panel opens via mode prop on CompositeId component
  Toggle: mid-session via reactive binding when user switches the
          routing radio on the Integration panel
  Reset:  to 'native' on panel close (component unmount) — always

NATIVE MODE:
  Page code = INT. Stamp preview uses the native preview path.
  Default mode.

SOURCE MODE:
  Page code = AX. Stamp preview assembled with AX code directly.
  Bypasses native preview path entirely. Mode check runs before
  any stamp computation.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPOSITEID SVELTE COMPONENT — MECHANICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROPS:

    panelId     — which panel this instance belongs to
    sectionId   — current section context
    mode        — 'native' | 'source' (Integration panel only,
                  default: 'native')
    dateValue   — bound to the panel's date input
    phaseValue  — bound to the panel's phase select (null if panel
                  has no phase picker)

REACTIVE BEHAVIOR:

The component reactively computes the preview stamp whenever
dateValue, phaseValue, sectionId, or mode changes. No manual refresh
needed — Svelte reactivity handles updates automatically.

When no panel is open, no CompositeId component is mounted. This is
correct behavior — there is nothing to preview when no panel is open.

PHASE SELECT POPULATION:

Phase selects on all panels are populated from PHASE_CODES data
fetched from FastAPI at app initialization and held in a Svelte
config store.

Never manually populate a phase select. Never hardcode phase options.
All phase values come from PHASE_CODES via API. Panels without a
phase picker use NUL at save time.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PANEL CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

16 panels in current spec. Each panel includes the CompositeId
component and passes its configuration as props.

NOTE: Panel configuration is pre-Tier 2. The new architecture has 51
pages. Panel concept, count, and configuration will be revisited when
Tier 2 (page surfaces) is built. Current maps are the working
reference until then.

PANEL_DATE_MAP — which panels have date inputs:

    invoke · kin · glyph · ll · eo · lin · lattice · ss ·
    rituals · breath · melodies · spiral · memory · liber ·
    venai · integration
    (all 16 panels have date inputs)

PANEL_PHASE_MAP — which panels have phase selects:

    invoke: null · kin: null · glyph: null · ll: null ·
    eo: null · lin: null · lattice: null · ss: null ·
    rituals: null · breath: null · melodies: null ·
    spiral: null · memory: null · liber: null ·
    venai: null (lexicon entries — always NUL) ·
    integration: has phase select
    (only Integration has a phase select)

PANEL_STAMP_MAP — which panels have stamp displays:

    All 16 panels have stamp displays.

ADDING A NEW PANEL — ALL STEPS REQUIRED:

  1. Add panel entry to all three maps above
  2. Include CompositeId component in the new panel's Svelte component
  3. Bind dateValue to the panel's date input
  4. Bind phaseValue to the panel's phase select (or pass null)
  5. Pass panelId and sectionId as props

  Missing any step = stamp will not render or will show stale data.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEQUENCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PANEL ACTIVATION SEQUENCE — strict order:

  1. App initialization: PHASE_CODES and PAGE_CODES fetched from
     FastAPI and stored in Svelte config store. All panels can
     reference these values via store subscription.
  2. On every section navigation: sectionId prop updated on the
     active CompositeId component instance. Stamp preview recomputes
     reactively.
  3. On panel open: CompositeId component mounts within the panel.
     Receives panelId, sectionId, dateValue, phaseValue, mode as
     props. Initial stamp preview renders automatically from prop
     values.
  4. If Integration panel and user toggles routing radio: mode prop
     updates via reactive binding. Stamp re-renders in new mode
     immediately.
  5. On panel close: CompositeId component unmounts. Mode state is
     discarded. No cleanup needed — Svelte handles component
     lifecycle.

  Failure at step 1: PHASE_CODES not loaded. Phase selects cannot
  populate. Guard: app surfaces named error. Panels requiring phase
  selection cannot open until data is loaded.
  Failure at step 3: CompositeId component not included in panel.
  Stamp does not render. Guard: every panel component includes
  CompositeId with correct prop bindings.

SAVE SEQUENCE — strict order:

  1. Preview stamp displayed in panel while user edits. Computed
     reactively in CompositeId Svelte component. SEQ slot shows ——.
     No API call.
  2. User confirms save. Save handler fires.
  3. Frontend calls FastAPI composite ID service. Service reads
     NEXTVAL('ts_sequence') from PostgreSQL. Returns locked stamp
     with zero-padded SEQ. Counter increment is permanent — SEQ is
     retired whether or not the entry save succeeds.
  4. Locked stamp written to entry record via FastAPI.
     entry.compositeId set. Not changed after this point.

  Failure at step 3 (PostgreSQL SEQUENCE unavailable): stamp not
  assembled. Save halts. No entry written. Retry produces the next
  SEQ.
  Failure between steps 3 and 4 (entry write fails after counter
  incremented): SEQ is permanently retired. A gap appears in the
  sequence. This is expected behavior — see Sequence Rules above.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ELARIAN ANCHOR — RESPONSE SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Added to Claude API tagger response alongside phase_state:

    "elarianAnchor": "RFLT" | "WHSP" | "VEIL" | "OBSV" |
                     "RECL" | "WEAV" | "GATE" | null

null = anchor is unclear or not applicable to the entry.

State definitions and ordering in SYSTEM_ Composite ID.md.

Elarian Anchor detection prompt block moved to TAGGER SCHEMA.md.
Composite ID owns the field definition and its seven states.
The tagger owns how it detects them. See TAGGER SCHEMA.md for
the detection prompt.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. LOCKED STAMP ASSEMBLED DURING PREVIEW
FastAPI composite ID service called during preview rather than save.
Sequence counter increments. The number is permanently retired even
if the entry is never written. Gaps appear in the sequence.
Guard: locked stamp assembly (FastAPI) is called only inside the
confirmed save path. Preview runs in the Svelte component with no
API call. These two paths are never substituted for each other.

2. PANEL CONFIGURATION NOT UPDATED WHEN A NEW PANEL IS ADDED
Stamp does not render. Phase select is not wired. Date changes
produce no preview update.
Guard: all three maps updated together. All wiring steps completed.
Never add a panel without updating all maps.

3. MODE SET ON A NON-INTEGRATION PANEL
No-op by design. But if mode state becomes stale (panel unmounts
without reset), a subsequent Integration panel mount may inherit the
wrong mode.
Guard: mode always resets to 'native' on panel unmount. The
CompositeId component resets mode via onDestroy or equivalent
lifecycle hook.

4. NATIVE PREVIEW PATH USED IN SOURCE MODE
Source mode stamp uses AX page code. If the native preview path runs
instead, the stamp shows INT page code — wrong stamp, wrong mode
identity.
Guard: source mode stamp assembly bypasses the native preview path
entirely. Mode check runs before any stamp computation.

5. RETIREMENT LABEL NOT SURFACED AT POST-RETIREMENT
Sage cannot copy the ARC id without querying the database record.
Parent page deposit and physical file placement are blocked or done
incorrectly. The handoff between system automation and researcher
curation is broken.
Guard: Integration UI displays the retirement label prominently and
copy-ready at post-retirement step 3 (see INTEGRATION SCHEMA.md).
Required UI element — not optional output. Persistent until dismissed
by Sage.

6. ELARIANANCHOR MISSING FROM AI-FACING JSON EXPORT
entry.elarianAnchor is stored correctly but not included in the
AI-facing JSON export. Pipelines cannot classify entries by anchor
without re-querying the database.
Guard: AI-facing JSON export spec includes elarianAnchor as a
top-level field alongside doc_type. Verify at backend build time.

7. SEQUENCE COUNTER UNAVAILABLE
PostgreSQL connection fails when FastAPI attempts NEXTVAL on
ts_sequence during save.
Guard: save operation fails with a named error. No partial entry
written. The entry remains in the frontend panel state for retry.
The sequence number is not consumed on failure — PostgreSQL SEQUENCE
only increments on successful NEXTVAL call.

8. PHASE_CODES NOT LOADED AT APP START
Frontend cannot populate phase selects. Phase value defaults to
undefined instead of NUL.
Guard: PHASE_CODES fetched from FastAPI at app initialization and
stored in Svelte store. If the fetch fails, app surfaces a named
error — panels that require phase selection cannot open until
PHASE_CODES are loaded.

9. SAVE FAILURE AFTER NEXTVAL — PERMANENT SEQUENCE GAP
Save fails after NEXTVAL call. Stamp was constructed but never stored.
Sequence number is permanently retired, never used. Gap appears in
the sequence.
This is expected behavior, not an error state. Do not attempt to
recover the orphaned stamp. Retry fires a new NEXTVAL and produces
a new stamp with the next sequence number.

10. CHILD STAMP NON-CONTIGUITY FROM SAME CHUNK
Multiple deposits from the same chunk are approved in sequence. Each
deposit commit fires its own independent NEXTVAL. If another session
or operation fires a commit between two approvals, the child stamps
for sibling deposits from the same chunk will be non-contiguous.
This is expected behavior. Child stamps from the same chunk are not
guaranteed to be contiguous in sequence. Sequence gaps between
sibling deposits do not indicate data loss. In V1 (single researcher)
this is unlikely. In V2+ (swarm with concurrent sessions) this will
be routine.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUILD FLAGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FLAG — doc_type field:
doc_type is confirmed as a database field only — not encoded in the
composite ID stamp. doc_type travels in the AI-facing JSON export
alongside the stamp. Pipelines process full records, not stamps in
isolation — the stamp provides provenance, doc_type provides content
classification, both travel together in export. At backend build
time: ensure AI-facing JSON export spec includes doc_type as a
top-level field so pipelines can classify records without re-querying.
doc_type enum now fully defined in INTEGRATION SCHEMA.md (9 values).

FLAG — panel configuration pre-Tier 2:
Current panel configuration lists 16 panels from the pre-Tier 2
design. New architecture has 51 pages. Panel concept, count, and
configuration maps will be revisited when Tier 2 (page surfaces) is
built. Do not treat the 16-panel maps as final.

FLAG — Elarian Anchor tagger prompt: COMPLETE.
Prompt block moved to TAGGER SCHEMA.md (commit 05a402f).
Composite ID retains field definition and seven states.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend (Svelte):

  src/lib/components/CompositeId.svelte
    Stamp preview rendering, phase select population, mode handling.
    Included as child component in every panel. Receives panelId,
    sectionId, mode, dateValue, phaseValue as props. Reactively
    computes preview stamp.
    Status: PLANNED

  src/lib/stores/config.ts
    Svelte store holding PHASE_CODES and PAGE_CODES data fetched
    from FastAPI at app initialization.
    Status: PLANNED

Backend (FastAPI):

  backend/services/composite_id.py
    Locked stamp assembly — reads NEXTVAL from PostgreSQL ts_sequence,
    assembles final stamp string, returns locked stamp. Called only on
    confirmed save path. Child stamp assembly for parsed source
    documents.
    Status: PLANNED

  backend/db/migrations/
    PostgreSQL SEQUENCE definition (ts_sequence) managed via Alembic
    migration. Not a discrete model file.
    Status: PLANNED
