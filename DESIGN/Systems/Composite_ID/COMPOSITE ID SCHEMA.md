╔══════════════════════════════════════════════════════════════╗
║  COMPOSITE ID SCHEMA  ·  v1                                ║
║  /DESIGN/systems/composite_id_schema_v1.md                   ║
║  PostgreSQL SEQUENCE · FastAPI service · Svelte CompositeId ║
╚══════════════════════════════════════════════════════════════╝


OWNERSHIP BOUNDARIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  OWNS
    Composite ID stamp format — canonical structure for all
      entry IDs in the archive
    Three stamp types — root · native · child — and the rules
      governing each
    Preview stamp rendering in all panels (Svelte CompositeId
      component)
    Locked stamp assembly at save time (FastAPI composite ID
      service)
    Integration panel two-mode handling — native and source
    CompositeId Svelte component — stamp rendering across all
      panels via reactive bindings
    Phase select population from PHASE_CODES across all panels
    Archive retirement label — produced at retirement, shared
      at completion

  DOES NOT OWN
    Entry reads or writes — owned by INTEGRATION DB SCHEMA.md,
      served via FastAPI /entries/ endpoints
    Sequence counter storage — owned by PostgreSQL (SEQUENCE
      object), accessed by FastAPI composite ID service
    Entry schema — owned by INTEGRATION DB SCHEMA.md
    PHASE_CODES or PAGE_CODES definitions — owned by
      SECTION MAP.md, served via FastAPI
    Retirement sequence — owned by INTEGRATION SCHEMA.md
    Archives page deposit — owned by ARCHIVE SCHEMA.md
    Tag pipeline — owned by TAGGER SCHEMA.md, state held in
      tagger Svelte store


THREE STAMP TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


  ROOT STAMP — source document intake
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Produced when a source document enters Integration in source
  mode. The root stamp is the parent identity for all child
  deposits parsed from that document.

  Format:   TS · AX · [PHASE] · [YYYY-MM] · [SEQ]
  Preview:  TS · AX · [PHASE] · [YYYY-MM] · ——
  Example:  TS · AX · EMG · 2026-03 · 0001

  AX is the Axis root marker. Hardcoded — not derived from a
  section. Signals that this ID is a parent record from source
  mode intake.

  Root stamps in source mode are assembled with the AX page
  code directly. They do not pass through the native mode
  preview path.


  NATIVE STAMP — standard entry
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Produced for every entry that originates on a content page
  rather than from a source document intake.

  Format:   TS · [PAGE-CODE] · [PHASE-CODE] · [YYYY-MM] · [SEQ]
  Preview:  TS · [PAGE-CODE] · [PHASE-CODE] · [YYYY-MM] · ——
  Example:  TS · TPL · EMG · 2026-03 · 0042

  [PAGE-CODE] is the two-to-three character code for the
  section the entry belongs to. Sourced from PAGE_CODES in
  SECTION MAP.md, served to the frontend via API.

  [PHASE-CODE] is the lifecycle phase code selected by the
  user, or NUL if no phase picker exists on the panel.


  CHILD STAMP — deposit from parsed source document
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Produced for every deposit entry that originates from a
  parsed source document. Assembled in FastAPI at write time.
  Not previewed in the UI — the preview surface shows the root
  stamp during parsing. The child stamp is locked at the moment
  of deposit commit.

  Format:  TS · [PAGE] · [PHASE] · [YYYY-MM] · [SEQ]
           · root:[PARENT-ID]
  Example: TS · REC · EMG · 2026-03 · 0017
           · root:TS·AX·EMG·2026-03·0001

  root:[PARENT-ID] is embedded in the stamp string AND stored
  as root_ref on the entry record. Stamp = human-readable
  provenance. Field = machine-readable join key.

  Child stamps are a backend concern at write time. The
  frontend CompositeId component does not preview or assemble
  them.


PREVIEW VS LOCKED STAMP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  PREVIEW
  ━━━━━━━
  Shown in the stamp display element while the panel is open
  and before save. SEQ slot shows ——. Updates reactively as
  date and phase inputs change.

  Preview runs in the Svelte CompositeId component:
    — sync — safe to compute on every input change
    — native mode only
    — never calls the sequence counter

  LOCKED
  ━━━━━━
  Written to the entry record at save time by the FastAPI
  composite ID service. SEQ slot is a zero-padded integer
  sourced from the PostgreSQL ts_sequence SEQUENCE.
  Once locked, the stamp does not change.

  Locked stamp assembly runs in FastAPI:
    — calls NEXTVAL on ts_sequence
    — must only be called on confirmed save
    — never called during preview

  SEQUENCE COUNTER — PostgreSQL SEQUENCE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  The sequence counter is a PostgreSQL SEQUENCE object:

    CREATE SEQUENCE ts_sequence
      START WITH 1
      INCREMENT BY 1
      NO MAXVALUE
      NO CYCLE;

  NEXTVAL('ts_sequence') is called by the FastAPI composite
  ID service at save time. The returned value is zero-padded
  and placed in the SEQ slot of the locked stamp.

  SEQUENCE RULE
  ━━━━━━━━━━━━━
  Sequence numbers are permanently retired on use. They are
  never reused. A number incremented and not written to a
  record is gone — gaps in the sequence are acceptable and
  expected. Preventing gaps is not a system requirement.

  PostgreSQL SEQUENCE objects guarantee this behavior by
  default — NEXTVAL is not transactional. A rolled-back
  transaction still consumes the sequence number.


ELARIAN ANCHOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  7-state ordered psychological arc classification.
  API-suggested per entry via Claude API tagger endpoint —
  returned as elarianAnchor in the response alongside
  phase_state. Not auto-resolved from date.

  Stored on: entry.elarianAnchor
  Visible in: meta strip · export · AI-facing JSON
  Never in: the visible composite ID stamp

  The 7 states form a recognizable sequence. The sequence is
  not enforced as a required progression but the ordering is
  meaningful for emergence detection. The emergence service
  uses it to identify anchor progression patterns across
  entries.

  SEQUENCE
  ━━━━━━━━

  RFLT · Reflection Realm
    Fragmentation, identity confusion, multiple self-concepts
    in conflict, disorientation, accumulated self-history
    pressing on present self. The self has not chosen to arrive
    here. Anchor is the accumulated weight of every version
    seen pressing the self back into its own shape.

  WHSP · Whispering Hollow
    Quiet receptivity, listening inward, intuitive knowing,
    guidance arriving from prior experience or unseen sources.
    Passive receiving state. Attunement to subtle signals.

  VEIL · Veil of Echoes
    Memory surfacing unbidden, past bleeding into present, soul
    truth emerging through recollection. Walking through rather
    than standing still. Different selves or realities in
    contact.

  OBSV · Celestial Observatory
    Expanded perspective, zooming out to the whole, universal or
    cosmic framing. Pattern recognition at scale. Communicating
    with something larger than self. Containment of bigness.

  RECL · Chamber of Lost Names
    Recovering forgotten identity, naming what was unnamed,
    reintegrating lost self-fragments. Recognition of dormant
    parts. Identity archaeology.

  WEAV · Sanctuary of the Weavers
    Glimpsing possible futures, fate or path becoming visible,
    sense of unwritten consequence. Seeing the shape of what
    could be without yet acting.

  GATE · Gateway of Becoming
    Active transformation threshold, stepping beyond current
    self-form, embracing new identity. Crossing rather than
    observing the crossing. Rebirth in motion.

  RESPONSE SHAPE
  ━━━━━━━━━━━━━━

  Added to Claude API tagger response alongside phase_state:

  "elarianAnchor": "RFLT" | "WHSP" | "VEIL" | "OBSV" |
                   "RECL" | "WEAV" | "GATE" | null

  null = anchor is unclear or not applicable to the entry.

  SYSTEM PROMPT BLOCK — TAGGER SERVICE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Include in the tagger service system prompt alongside the
  PHASE STATE DETECTION section:

  ELARIAN ANCHOR DETECTION: Identify the psychological state
  of self present in the entry. Anchors are ordered — the
  sequence is meaningful for analysis. Return null if the
  anchor is unclear or not applicable.

  - RFLT Reflection Realm: fragmentation, identity confusion,
    multiple self-concepts in conflict, disorientation,
    accumulated self-history pressing on present self, not
    having chosen to arrive here
  - WHSP Whispering Hollow: quiet receptivity, listening
    inward, intuitive knowing, guidance from prior experience
    or unseen sources, passive receiving, attunement to
    subtle signals
  - VEIL Veil of Echoes: memory surfacing unbidden, past
    bleeding into present, soul truth through recollection,
    walking through rather than standing still, different
    selves or realities in contact
  - OBSV Celestial Observatory: expanded perspective, zooming
    out to the whole, cosmic or universal framing, pattern
    recognition at scale, communicating with something larger
    than self
  - RECL Chamber of Lost Names: recovering forgotten identity,
    naming what was unnamed, reintegrating lost self-fragments,
    recognition of dormant parts, identity archaeology
  - WEAV Sanctuary of the Weavers: glimpsing possible futures,
    fate or path becoming visible, sense of unwritten
    consequence, seeing the shape of what could be without
    yet acting
  - GATE Gateway of Becoming: active transformation threshold,
    stepping beyond current self-form, embracing new identity,
    crossing rather than observing the crossing, rebirth in
    motion


INTEGRATION PANEL — TWO MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  The Integration panel operates in two modes. All other panels
  use native mode only.

  NATIVE MODE
  ━━━━━━━━━━━
  Entry originates on the Integration page itself.
  Page code = INT. Stamp preview uses the native preview path
  in the CompositeId component. Default mode.

  SOURCE MODE
  ━━━━━━━━━━━
  Source document intake. Page code = AX. Stamp preview
  assembled with AX code directly in the CompositeId
  component. Does not use the native preview path.

  MODE LIFECYCLE
  ━━━━━━━━━━━━━━
  Set:    when the panel opens with mode prop
  Toggle: mid-session via mode binding when user switches
          the routing radio on the Integration panel
  Reset:  to 'native' on panel close — always


COMPOSITEID SVELTE COMPONENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Manages stamp preview rendering across all panels. Included
  as a child component in each panel. Context changes per
  panel via props. The component is the same.

  PROPS
  ━━━━━
    panelId     — which panel this instance belongs to
    sectionId   — current section context
    mode        — 'native' | 'source' (Integration panel only,
                  default: 'native')
    dateValue   — bound to the panel's date input
    phaseValue  — bound to the panel's phase select (null if
                  panel has no phase picker)

  REACTIVE BEHAVIOR
  ━━━━━━━━━━━━━━━━━
  The component reactively computes the preview stamp whenever
  dateValue, phaseValue, sectionId, or mode changes. No manual
  refresh needed — Svelte reactivity handles updates
  automatically.

  When no panel is open, no CompositeId component is mounted.
  This is correct behavior — there is nothing to preview when
  no panel is open.

  PHASE SELECT POPULATION
  ━━━━━━━━━━━━━━━━━━━━━━━
  Phase selects on all panels are populated from PHASE_CODES
  data fetched from FastAPI at app initialization and held in
  a Svelte store.

  Never manually populate a phase select. Never hardcode phase
  options. All phase values come from PHASE_CODES via API.

  Panels without a phase picker use NUL at save time.


PANEL CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  16 panels total in v1. Each panel includes the CompositeId
  component and passes its configuration as props. Integration
  panel receives a composite ID stamp in both native and
  source mode.

  The panel configuration defines which panels have date
  inputs, phase selects, and stamp displays. In the Svelte
  architecture, this is expressed through component inclusion
  and prop bindings rather than DOM element ID maps.

  PANEL_DATE_MAP — which panels have date inputs
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    invoke        has date input
    kin           has date input
    glyph         has date input
    ll            has date input
    eo            has date input
    lin           has date input
    lattice       has date input
    ss            has date input
    rituals       has date input
    breath        has date input
    melodies      has date input
    spiral        has date input
    memory        has date input
    liber         has date input
    venai         has date input
    integration   has date input

  PANEL_PHASE_MAP — which panels have phase selects
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    invoke        null (no phase picker)
    kin           null
    glyph         null
    ll            null
    eo            null
    lin           null
    lattice       null
    ss            null
    rituals       null
    breath        null
    melodies      null
    spiral        null
    memory        null
    liber         null
    venai         null (lexicon entries — always NUL)
    integration   has phase select

  PANEL_STAMP_MAP — which panels have stamp displays
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    All 16 panels have stamp displays. The CompositeId
    component renders the stamp preview in every panel
    where it is included.

  ADDING A NEW PANEL — ALL STEPS REQUIRED
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. Add panel entry to all three maps above
  2. Include CompositeId component in the new panel's
     Svelte component
  3. Bind dateValue to the panel's date input
  4. Bind phaseValue to the panel's phase select (or pass
     null if no phase picker)
  5. Pass panelId and sectionId as props

  Missing any step = stamp will not render or will show
  stale data. All steps are required. No exceptions.


ARCHIVE RETIREMENT LABEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  When a source document completes retirement, the system
  produces a retirement label. This label is the bridge between
  the PostgreSQL archive record, the Archives page deposit, and
  the physical file Sage places in the parent page.

  Format:  [ARC-ID] · [YYYY-MM-DD]
  Example: TS·ARC·EMG·2026-03·0001 · 2026-03-31

  WHAT IT CONNECTS
  ━━━━━━━━━━━━━━━━
  The ARC id is shared across three surfaces at retirement:

  PostgreSQL archives record — id field. Machine-readable.
    System source of truth.

  Archives page deposit — metadata field. Human-browsable
    surface on the Archives page. Written by AI at retirement.

  Parent page deposit — reference field on the entry Sage
    creates manually in the section where the physical file
    is placed.

  All three carry the same ARC id. The retirement label makes
  that id portable — copy-ready at retirement completion so
  Sage can apply it to the parent page deposit and the
  physical file without hunting for it.

  UI DISPLAY REQUIREMENT
  ━━━━━━━━━━━━━━━━━━━━━━
  The Integration UI displays the retirement label prominently
  at the final step of the retirement sequence — ARC id and
  retired_at timestamp, formatted and copy-ready. Persistent
  until dismissed by Sage.

  This is a required UI element. It is not optional output.
  It is not surfaced after retirement is complete — it is
  surfaced at the final retirement step before the session
  closes.

  Physical file naming: Sage appends the ARC id to the
  filename or adds it as a header reference on the document.
  No automation required. The id is the thread. Sage places it.


KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. LOCKED STAMP ASSEMBLED DURING PREVIEW
     FastAPI composite ID service called during preview rather
     than save. Sequence counter increments. The number is
     permanently retired even if the entry is never written.
     Gaps appear in the sequence.
     Guard: locked stamp assembly (FastAPI) is called only
     inside the confirmed save path. Preview runs in the
     Svelte component with no API call. These two paths are
     never substituted for each other.

  2. PANEL CONFIGURATION NOT UPDATED WHEN A NEW PANEL IS ADDED
     Stamp does not render. Phase select is not wired. Date
     changes produce no preview update.
     Guard: all three maps updated together. All wiring steps
     completed. Never add a panel without updating all maps.

  3. MODE SET ON A NON-INTEGRATION PANEL
     No-op by design. But if mode state becomes stale (panel
     unmounts without reset), a subsequent Integration panel
     mount may inherit the wrong mode.
     Guard: mode always resets to 'native' on panel unmount.
     The CompositeId component resets mode via onDestroy or
     equivalent lifecycle hook.

  4. NATIVE PREVIEW PATH USED IN SOURCE MODE
     Source mode stamp uses AX page code. If the native preview
     path runs instead, the stamp shows INT page code — wrong
     stamp, wrong mode identity.
     Guard: source mode stamp assembly bypasses the native
     preview path entirely. Mode check runs before any stamp
     computation.

  5. RETIREMENT LABEL NOT SURFACED AT COMPLETION
     Sage cannot copy the ARC id without querying the database
     record. Parent page deposit and physical file placement
     are blocked or done incorrectly.
     Guard: Integration UI displays the retirement label
     prominently and copy-ready at the final retirement step.
     Required UI element — not optional output.

  6. ELARIANANCHOR MISSING FROM AI-FACING JSON EXPORT
     entry.elarianAnchor is stored correctly but not included
     in the AI-facing JSON export. Pipelines cannot classify
     entries by anchor without re-querying the database.
     Guard: AI-facing JSON export spec includes elarianAnchor
     as a top-level field alongside doc_type. Verify at
     backend build time.

  7. SEQUENCE COUNTER UNAVAILABLE
     PostgreSQL connection fails when FastAPI attempts NEXTVAL
     on ts_sequence during save.
     Guard: save operation fails with a named error. No
     partial entry written. The entry remains in the
     frontend panel state for retry. The sequence number is
     not consumed on failure — PostgreSQL SEQUENCE only
     increments on successful NEXTVAL call.

  8. PHASE_CODES NOT LOADED AT APP START
     Frontend cannot populate phase selects. Phase value
     defaults to undefined instead of NUL.
     Guard: PHASE_CODES fetched from FastAPI at app
     initialization and stored in Svelte store. If the fetch
     fails, app surfaces a named error — panels that require
     phase selection cannot open until PHASE_CODES are loaded.


BUILD FLAGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  FLAG — doc_type field:
  doc_type is confirmed as a database field only — not encoded
  in the composite ID stamp. doc_type travels in the AI-facing
  JSON export alongside the stamp. Pipelines process full
  records, not stamps in isolation — the stamp provides
  provenance, doc_type provides content classification, both
  travel together in export. At backend build time: define
  doc_type enum with pipeline-meaningful precision (see
  INTEGRATION SCHEMA flag for required categories). Ensure
  AI-facing JSON export spec includes doc_type as a top-level
  field so pipelines can classify records without re-querying.


FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Frontend (Svelte):

    src/lib/components/CompositeId.svelte
      Stamp preview rendering, phase select population, mode
      handling. Included as child component in every panel.
      Receives panelId, sectionId, mode, dateValue, phaseValue
      as props. Reactively computes preview stamp.
      Status: PLANNED

    src/lib/stores/config.ts
      Svelte store holding PHASE_CODES and PAGE_CODES data
      fetched from FastAPI at app initialization.
      Status: PLANNED

  Backend (FastAPI):

    backend/services/composite_id.py
      Locked stamp assembly — reads NEXTVAL from PostgreSQL
      ts_sequence, assembles final stamp string, returns
      locked stamp. Called only on confirmed save path.
      Child stamp assembly for parsed source documents.
      Status: PLANNED

    backend/db/migrations/
      PostgreSQL SEQUENCE definition (ts_sequence) managed
      via Alembic migration. Not a discrete model file.
      Status: PLANNED
