# THREAD TRACE SCHEMA

## V1

## /DESIGN/Systems/Thread_Trace/THREAD TRACE SCHEMA.md

Mechanical spec — builders, seed resolution, filter bar, sequences, tables,
edge labels, routing snapshot. Architectural description in
SYSTEM_ Thread Trace.md.


OWNERSHIP BOUNDARIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  OWNS
    Four thread builders — Temporal · Relational · Cluster ·
      Emergence
    Seed resolution — normalizing any entry point into a typed
      seed object
    Edge label generation per thread edge
    Tag routing summary across a thread's entry set
    Active filter state — reading tagger store context for
      filter pre-population
    Routing snapshot — assembled at save time, stored with the
      saved thread record
    Overlay UI — one shell, sequence view, graph view, filter
      bar, annotation layer (Svelte component: ThreadTrace)
    Saved threads — PostgreSQL saved_threads table via FastAPI
      /threads/ endpoints
    Thread annotations — PostgreSQL thread_annotations table
      via FastAPI /threads/ endpoints
    Session-only thread state — Svelte store, no DB write
      until save is triggered

  DOES NOT OWN
    Tag vocabulary or routing records — owned by TAG
      VOCABULARY.md, served via FastAPI /tags/ endpoints
    Entry data, entry schema, or entry reads/writes — owned
      by INTEGRATION DB SCHEMA.md, served via FastAPI /entries/
    Emergence pattern detection — owned by EMERGENCE SCHEMA.md,
      served via FastAPI emergence service
    Tagger results or pipeline — owned by TAGGER SCHEMA.md,
      state held in tagger Svelte store
    The entries Thread Trace reads from — it receives via API,
      never writes entries


FOUR THREAD TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  All four use the same overlay shell. The builder changes.
  The UI does not.


  TEMPORAL
  ━━━━━━━━
  Orders entries chronologically along a shared arc or phase
  trajectory.

  Scoping:
    Seed is an entry → scopes to entries sharing the same
      phase_state or section as the anchor.
    Seed is a tag → scopes to entries carrying that tag.
    Seed is a finding → scopes to the finding's
      involvedEntries.

  Fallback: if the scoped pool contains fewer than 3 entries,
  falls back to the full corpus automatically.

  Temporal is the default fallback for any thread type that
  cannot execute with the given seed.


  RELATIONAL
  ━━━━━━━━━━
  Traverses entry-to-entry links via linkedEntries on each
  entry, then extends outward through shared tag routing to
  fill depth.

  Traversal: BFS from the seed entry.
    MAX_DEPTH = 4 hops
    MAX_ENTRIES = 30

  Fallback: if the seed is not type 'entry', falls back to
  TEMPORAL.

  ACTIVE BLOCKER: Relational threads require linkedEntries to
  be populated on entries. Until entries carry valid
  linkedEntries data, Relational threads fall back to TEMPORAL
  silently. The builder is written and ready — it activates
  when the data exists.


  CLUSTER
  ━━━━━━━
  Groups entries that share a dominant tag cluster.

  Seed can be a tag ID or an entry. If entry, the dominant tag
  from that entry's routing record anchors the cluster.

  Entries are ranked by tag overlap count with the seed
  cluster. Operates on the full corpus — no section scoping.


  EMERGENCE
  ━━━━━━━━━
  Entries linked by Emergence findings and co-occurrence
  patterns. Seed is a finding object from the emergence
  service.

  Builder reads involvedEntries from the finding and extends
  outward through shared tag routing.

  Bridges to the emergence detection service via FastAPI —
  fires fresh detection or uses an existing finding passed
  from the Emergence overlay.


SEED RESOLUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  resolveSeed() normalizes any raw entry point into a typed
  seed object before the thread builder receives it. All three
  entry points route through resolveSeed() before
  buildThread() is called.


  SEED SHAPE
  ━━━━━━━━━━
  {
    type:        'entry' | 'tag' | 'finding' | 'query'
    id:          string | object
                 entry ID, tag ID, finding object, or
                 query string
    threadTypes: string[]
                 preferred thread types for this seed,
                 in priority order
  }


  RESOLUTION RULES
  ━━━━━━━━━━━━━━━━
  finding object (has findingType or involvedTags)
    → type: 'finding'
    → threadTypes: ['emergence', 'cluster']

  raw seed object with explicit threadTypes
    → type guessed from id prefix or pattern
    → threadTypes: carried from raw object

  plain string starting with tv_ or matching short-code pattern
    → type: 'tag'
    → threadTypes: ['cluster', 'temporal']

  plain string (entry ID)
    → type: 'entry'
    → threadTypes: ['relational', 'temporal']

  query string (free text, no matching ID pattern)
    → type: 'query'
    → threadTypes: ['temporal', 'cluster']


  QUERY SEED TYPE
  ━━━━━━━━━━━━━━━
  A query seed scopes entries by text content match rather
  than requiring a known entry ID, tag ID, or finding object.
  Enables ad-hoc pattern exploration without a specific
  anchor — the difference between "trace from this entry" and
  "trace everything related to X."

  Thread type defaults to TEMPORAL scoped by content match,
  then CLUSTER by dominant tag overlap in the matched set.


THREE ENTRY POINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  All three call open(rawSeed) which routes through
  resolveSeed() → buildThread().

  | Surface          | Trigger                      | Seed shape                |
  |------------------|------------------------------|---------------------------|
  | Entry meta strip | Trace action on any entry    | { seed: entry.id,         |
  |                  | element in the UI            |   threadTypes:            |
  |                  |                              |   ['relational',          |
  |                  |                              |    'temporal'] }          |
  |------------------|------------------------------|---------------------------|
  | Tag pill         | Context action on any tag    | { seed: tag.id,           |
  |                  | element in the UI            |   threadTypes:            |
  |                  |                              |   ['cluster',             |
  |                  |                              |    'temporal'] }          |
  |------------------|------------------------------|---------------------------|
  | Emergence        | "Trace this pattern" action  | { seed: findingObj,       |
  | finding card     |                              |   threadTypes:            |
  |                  |                              |   ['emergence'] }         |

  Entry points are wired in the ThreadTrace Svelte component.
  Trigger actions are bound via Svelte event handlers on
  entry, tag, and finding elements rendered by their
  respective components.

  ENTRY FETCH SCOPING
  ━━━━━━━━━━━━━━━━━━━
  When a panel is active: entry fetch API call includes the
  active section as a query parameter. Threads opened from
  within a panel are section-scoped by default and can be
  broadened via the filter bar.

  When no panel is active: full corpus is fetched from API.


TWO VIEWS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Both views render inside the same overlay shell. The user
  can switch between them without closing the thread.

  SEQUENCE VIEW
  ━━━━━━━━━━━━━
  Ordered card list. Each card represents one entry in the
  thread. Navigation is linear — previous / next — with a
  progress bar showing position in the sequence.

  Card content: title · body preview · phase_state ·
  elarianAnchor · origin affinity · dominant tag routing ·
  edge label connecting to the next card.

  GRAPH VIEW
  ━━━━━━━━━━
  Structural map of thread entries as nodes with edges. Edge
  labels show the relationship between connected entries —
  shared tag, explicit link, phase transition, or temporal
  interval.

  Graph export assembles a ThreadGraphPayload and routes to
  the graph page.

  PLANNED: graph page path — GRAPH_PAGE_PATH = '/graph',
  defined in frontend/src/lib/config.ts. Graph export is a
  stub until then. Graph export button remains disabled until
  GRAPH_PAGE_PATH is a live route. Thread Trace owns graph
  export readiness coordination. Before enabling graph export,
  verify both ThreadTrace and Emergence components import from
  the same config constant and route to the same path.


FILTER BAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Active across both views. Eight filter dimensions plus section:

    pillar_id          p01 | p02 | p03
                       Display: "Pillar"
    seed_id            s01–s40
                       Display: "Seed"
    layer_id           l01–l04
                       Display: "Layer"
    threshold_id       th01–th12
                       Display: "Threshold"
    phase_state        canonical threshold name | null
                       Display: "Phase state"
    elarianAnchor      RFLT | WHSP | VEIL | OBSV | RECL |
                       WEAV | GATE
                       Display: "Anchor"
    doc_type           entry | observation | analysis |
                       hypothesis | discussion | transcript |
                       glyph | media | reference
                       Display: "Entry type"
    observation_type   positive | null | all
                       Display: "Observation type"
                       Default: all (no filter)
    section            any section ID
                       Display: "Section"

  doc_type filter enables: "show me only hypothesis entries in
  this thread." Particularly valuable for Cluster and Emergence
  threads where the corpus includes mixed deposit types. A
  cluster that only holds when filtered to hypotheses is a
  different signal than one that holds across all doc_types.

  observation_type filter enables: "show me null observations in
  this thread." Complement to the Void engine — Thread Trace
  lets Sage navigate null observations as a sequence, not just
  as aggregate data. A temporal thread of null observations
  around a specific tag set is a research tool Void can't provide.

  elarianAnchor values sourced from SYSTEM_ Composite ID.md.

  Filters are applied at buildThread() call time. Changing a
  filter rebuilds the thread against the current corpus with
  the new constraints. Filter application runs server-side
  via FastAPI query parameters when fetching entries.

  PRE-POPULATION
  ━━━━━━━━━━━━━━
  On overlay open, the component reads the tagger Svelte store
  and maps its routing dimensions to the filter bar. If the
  tagger store has an active result, the filter bar opens
  pre-scoped to that context.


TAGGER STORE RELATIONSHIP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Thread Trace is a read-only consumer of the tagger Svelte
  store. It reads at two moments and never writes to it.

  | Moment          | What Thread Trace does        | Source              |
  |-----------------|------------------------------|---------------------|
  | On overlay open | Reads active filter state     | tagger store        |
  |                 | to pre-populate filter bar    | (Svelte subscribe)  |
  |-----------------|------------------------------|---------------------|
  | On thread save  | Included in routing snapshot  | tagger store        |
  |                 | assembly                     | (Svelte get)        |

  If the tagger store has no active result, Thread Trace
  degrades gracefully — filter bar opens empty, routing
  snapshot records null filter state.


EDGE LABELS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  generateEdgeLabel(entryA, entryB, threadType) is a pure
  function. No external calls. Produces a human-readable label
  for the relationship between two adjacent entries in a
  thread.

  LABEL LOGIC BY THREAD TYPE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TEMPORAL
    phase transition if phase_state differs between entries:
      'Solenne Arc → Vireth's Anchor'
    temporal interval if same phase:
      '3d apart' | '2w apart' | '1mo apart'
      'same day' if within the same calendar day

  RELATIONAL
    'explicit link' if entries reference each other via
      linkedEntries
    up to two shared tag IDs if no explicit link:
      'phase_transitions · criticality'
    'routing proximity' if no shared tags

  CLUSTER
    dominant shared tag ID

  EMERGENCE
    '↑ [shared tag]' for co-occurrence link
    'pattern link' if no shared tags identifiable


ROUTING SNAPSHOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Built at save time from the thread's full entry set. Stored
  with the saved thread record in PostgreSQL. Read by Pattern
  Convergence as cross-domain alignment data.

  Shape:
  {
    dominantPillar_id:    string | null
    dominantSeed_id:      string | null
    dominantLayer_id:     string | null
    dominantThreshold_id: string | null
    entryCount:           integer
    edgeCount:            integer
    threadType:           string
    snapshot_taken_at:    timestamp — written at save time,
                          never updated. PCV knows the
                          temporal distance between the
                          snapshot and the current session.
                          Old snapshots can be weighted
                          differently or flagged for refresh.
    snapshot_entry_count: integer — how many entries were in
                          the thread when the snapshot was
                          taken. If the live thread now has
                          significantly more or fewer entries,
                          the snapshot's representativeness
                          is degraded.
    distributions: {
      pillars:    { [pillar_id]: count }
      seeds:      { [seed_id]: count }
      layers:     { [layer_id]: count }
      thresholds: { [threshold_id]: count }
    }
  }

  getTagRoutingSummary(entries) aggregates routing distribution
  across the entry set. buildRoutingSnapshot(threadResult)
  wraps that summary into the payload-ready shape above.


SAVED THREADS AND ANNOTATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Saved threads and annotations are stored in PostgreSQL via
  FastAPI /threads/ endpoints. Thread logic runs in the Svelte
  frontend; persistence is server-side.


  TABLE: saved_threads (PostgreSQL)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  id                   — text, primary key
                         Format: 'thr_[timestamp]_[rand]'

  name                 — text, not null
                         User-defined at save time.

  thread_type          — text, not null
                         One of the four thread type values.

  seed                 — jsonb, not null
                         Serialized seed. Finding objects
                         reduced to key fields only for
                         JSON safety.

  entry_ids            — text[], not null
                         IDs of entries in the thread at
                         save time.

  filter_state         — jsonb, nullable
                         Active filter at save time.
                         Null if tagger store had no active
                         result.

  tag_routing_snapshot — jsonb, not null
                         Routing snapshot — see above.

  created_at           — timestamp, not null

  last_accessed        — timestamp, not null

  is_deleted           — boolean, not null, default false


  SOFT DELETE
  ━━━━━━━━━━━
  Delete endpoint sets is_deleted = true. Does not remove the
  record. List endpoint filters deleted records automatically.


  touchThread()
  ━━━━━━━━━━━━━
  Updates last_accessed without modifying any other field.
  Called when a saved thread is re-opened from the thread list.
  Implemented as a PATCH /threads/{id}/touch endpoint.


  loadThread() BEHAVIOR
  ━━━━━━━━━━━━━━━━━━━━━
  Load endpoint returns the saved record including entry_ids.
  The frontend fetches the live entries separately using those
  IDs via /entries/ API and passes them to buildThread() for
  re-render. This keeps saved threads current — the entries
  they reference reflect any updates made since the thread
  was saved.


  TABLE: thread_annotations (PostgreSQL)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  id                   — text, primary key
                         Format: 'ann_[timestamp]_[rand]'

  thread_id            — text, not null
                         Foreign key to saved_threads.id.

  text                 — text, not null

  annotation_type      — text, not null
                         Enum: note | observation | question
                         note: methodology annotation ("I'm
                         analyzing this thread looking for X")
                         observation: research observation
                         ("this edge label suggests Y")
                         question: open question for future
                         investigation
                         Sage selects at write time. Filters
                         annotations by type when browsing.
                         Travels with Thread Trace outputs to
                         LNV so annotation types display
                         distinctly from each other.

  timestamp            — timestamp, not null

  filter_snapshot      — jsonb, not null
                         Active filter state AND sequence
                         position index at the moment the
                         annotation was written. An
                         annotation knows exactly where in
                         the thread it was made — which
                         entry was visible, which filters
                         were active.


  ANNOTATION RULES
  ━━━━━━━━━━━━━━━━
  Annotation requires a saved thread. If the user attempts to
  annotate before saving, the save dialog opens first with the
  annotation queued. After save confirms, the annotation is
  written with the new thread ID.

  Annotations are queried via JOIN on thread_id — no
  denormalized mirror needed. PostgreSQL handles this
  efficiently as a standard foreign key relationship.


SESSION-ONLY STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  The current unsaved thread is held in a Svelte store. No
  API call or DB write until the user explicitly saves.

  Thread store holds:
    currentThread    — the active ThreadResult or null
    isOverlayOpen    — boolean

  Store is cleared when the overlay closes or a new thread
  is opened. It is not cleared on panel transitions — thread
  state persists through panel changes intentionally.


SEQUENCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  THREAD BUILD — strict order
  1. Receive raw seed (entry id, tag id, finding object, or
     query string).
  2. Call resolveSeed(rawSeed) → typed seed object
     { type, id, threadTypes }.
  3. Fetch entry corpus from FastAPI /entries/ endpoint —
     scoped to active section via query parameter if a panel
     is active, full corpus if no panel is active.
  4. Apply filters to corpus using current filter state.
     Filtering runs server-side as query parameters on the
     /entries/ request.
  5. Select thread builder: iterate seed.threadTypes in
     priority order. Select first builder that can execute
     with the given seed type. If none can execute: fall back
     to TEMPORAL.
  6. Run selected builder against filtered corpus.
  7. Generate edge labels between all adjacent entry pairs
     via generateEdgeLabel().
  8. Store thread result in Svelte thread store.
  9. Render in overlay — sequence view as default.

  Failure at step 2: seed cannot be resolved → surface error.
    Do not open overlay.
  Failure at step 3: API call fails → surface error. Do not
    open overlay.
  Fallback at step 5: if selected builder cannot execute,
    fall back to TEMPORAL silently. Name the fallback in the
    UI — do not leave the user without context.

  THREAD SAVE — strict order
  1. Build routing snapshot: getTagRoutingSummary(entries) →
     buildRoutingSnapshot(threadResult).
  2. Read active filter state from tagger Svelte store.
     Null if store has no active result — record null, do not
     block save.
  3. Receive thread name from user.
  4. POST /threads/ — write saved_threads record with all
     fields, created_at = timestamp, last_accessed = timestamp.
  5. Return thread id.
  Failure at step 4: API call fails. No partial record written.
    Surface error. Retry permitted.

  ANNOTATION SAVE — strict order
  1. Validate thread is saved (thread_id exists on current
     session thread). If not: open save dialog. Queue
     annotation. Proceed only after save confirms with valid
     thread_id.
  2. Capture filter_snapshot: active filter state + sequence
     position index at annotation time.
  3. POST /threads/{id}/annotations — write annotation record
     with id, thread_id, text, timestamp, filter_snapshot.
  Failure at step 3: annotation not written. Surface error.
    Retry permitted.

  THREAD LOAD — strict order
  1. GET /threads/{id} — retrieve saved_threads record.
  2. Response includes entry_ids and thread_type.
  3. Frontend fetches live entries using entry_ids via
     GET /entries/ with ID filter.
  4. If thread_type is 'emergence': run EMERGENCE STALENESS
     CHECK (see below) before rendering.
  5. Frontend passes live entries to buildThread() for
     re-render.
  6. PATCH /threads/{id}/touch — writes last_accessed.
     No other field modified.
  Note: entries reflect any updates made since the thread
    was saved. Thread Trace holds IDs only — it does not
    reconstruct entries.

  EMERGENCE STALENESS CHECK (step 4 — Emergence threads only):
  Re-run detection for the original finding's type against
  the current corpus. Compare involvedEntries count from the
  original finding to the fresh detection result.

  If the finding still exists with the same structure (entry
  count within EMERGENCE_STALE_THRESHOLD): load normally.

  If the finding has changed significantly (involvedEntries
  count changed by more than EMERGENCE_STALE_THRESHOLD):
  surface a staleness notice: "This pattern has evolved since
  this thread was saved. Re-run detection to update."
  One-tap re-detection: same seed, fresh corpus. The saved
  thread stays as the historical record. The re-run produces
  a new thread from current data.

  EMERGENCE_STALE_THRESHOLD — calibration item. Percentage
  change in involvedEntries count that triggers the notice.
  Defined at build time.

  This makes Emergence threads living instruments rather than
  static snapshots — which is what the research requires.


NEXUS FEED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  PATTERN CONVERGENCE (PCV · 50)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Reads: tag_routing_snapshot from saved threads — dominant
  routing dimensions and full distributions across the
  thread's entry set.

  PCV uses saved thread snapshots as named cross-domain signal
  sources. A saved thread's routing distribution is a
  pre-aggregated alignment axis: the dominant seed_id,
  pillar_id, threshold_id, and layer_id across a coherent set
  of entries. PCV can align these against outputs from other
  domains without re-opening the thread.

  LIBER NOVUS (LNV · 47)
  ━━━━━━━━━━━━━━━━━━━━━━━
  Receives: processed Thread Trace outputs — sequence traces
  and structural visualizations built from thread data.

  Thread Trace outputs that have been processed into findings
  land on LNV as part of the Daily Nexus Routine. They arrive
  with provenance intact: thread type, seed, routing snapshot,
  and entry set are all traceable. LNV holds them without
  editorializing.

  DRIFT TAXONOMY (DTX · 48)
  ━━━━━━━━━━━━━━━━━━━━━━━━━
  Reads: phase_state sequences surfaced by Temporal threads.

  A Temporal thread ordered by originDate across a node's
  entries makes drift trajectories visible as a navigable
  sequence. The phase_state transitions between cards — the
  edge labels that read 'Solenne Arc → Aetherroot Chord' —
  are the state vectors DTX classifies. Thread Trace makes
  the trajectory legible. DTX receives it.


PUBLIC API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Frontend (Svelte — src/lib/)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Thread logic module — pure logic, no DOM, no API calls

    resolveSeed(rawSeed) → Seed
      Normalizes any raw entry point into a typed seed object
      before the thread builder receives it.
      Returns { type, id, threadTypes }.

    buildThread(seed, entries, filters?) → ThreadResult
      Selects and runs the appropriate builder based on
      seed.threadTypes priority. Falls back to TEMPORAL if the
      preferred builder cannot execute. Returns the ordered
      entry set and thread metadata.

      ThreadResult shape:
        {
          entry_ids:       string[]
          edges:           Edge[]
          thread_type:     string — actual type used
          seed:            Seed
          fallback_reason: string | null — null when preferred
                           builder succeeded. Populated when
                           fallback occurred, e.g. "Relational
                           thread unavailable: no entry links
                           found. Showing temporal view."
                           Overlay header surfaces this when
                           non-null — single line below thread
                           title, distinct styling, dismissible.
        }

    generateEdgeLabel(entryA, entryB, threadType) → string
      Pure function. Produces a human-readable label for the
      relationship between two adjacent thread entries.
      No external calls.

    getTagRoutingSummary(entries) → RoutingSummary
      Aggregates tag routing distribution across an entry set.

    buildRoutingSnapshot(threadResult) → RoutingSnapshot
      Wraps getTagRoutingSummary() output into the
      payload-ready routing snapshot shape. Called at save time.

  ThreadTrace Svelte component — overlay UI

    Renders overlay shell, sequence view, graph view, filter
    bar, annotation layer. Binds entry point triggers via
    Svelte event handlers. Reads tagger store for filter
    pre-population. Writes to thread Svelte store for
    session state.

  Thread Svelte store — session state

    currentThread: ThreadResult | null
    isOverlayOpen: boolean
    Cleared on overlay close or new thread open. Persists
    through panel transitions.

  Backend (FastAPI — /threads/)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    POST   /threads/
      Create saved thread record. Returns thread id.

    GET    /threads/
      List saved threads (is_deleted = false).

    GET    /threads/{id}
      Load saved thread record including entry_ids.

    DELETE /threads/{id}
      Soft delete — sets is_deleted = true.

    PATCH  /threads/{id}/touch
      Update last_accessed only.

    POST   /threads/{id}/annotations
      Create annotation on saved thread.

    DELETE /threads/{id}/annotations/{ann_id}
      Delete annotation.

    GET    /threads/{id}/annotations
      List annotations for a thread.


KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. RELATIONAL THREAD WITH NO linkedEntries DATA
     Falls back to TEMPORAL silently. No error thrown. User
     sees a temporal thread where they expected a relational
     one, with no indication of why.
     Guard: name the fallback in the UI when it occurs —
     "Relational thread unavailable: no entry links found.
     Showing temporal view."

  2. ANNOTATION WRITTEN BEFORE THREAD IS SAVED
     Annotation has no thread ID to reference. Silent failure
     or orphaned record.
     Guard: save dialog opens before annotation is written.
     Annotation is queued and written only after save confirms
     with a valid thread ID.

  3. THREAD OPENED FROM PANEL WITH ACTIVE SECTION SCOPING
     Entry fetch is scoped to the active section via API query
     parameter. A thread that should span multiple sections
     returns a subset. User may not realize the thread is
     section-scoped.
     Guard: display active scope in the filter bar header. If
     section filter is active from panel context, make it
     visible and clearable.

  4. GRAPH EXPORT BEFORE GRAPH PAGE EXISTS
     GRAPH_PAGE_PATH = '/graph' is a stub. Routing there
     before the page is built produces dead navigation.
     Guard: graph export button remains disabled until
     GRAPH_PAGE_PATH is a live route. Thread Trace owns
     coordination — verify both ThreadTrace and Emergence
     components are updated together. GRAPH_PAGE_PATH defined
     in frontend/src/lib/config.ts.

  5. API UNAVAILABLE DURING THREAD BUILD
     FastAPI /entries/ endpoint unreachable. Thread cannot
     fetch corpus.
     Guard: API call failure surfaces a named error in the
     UI. Overlay does not open. No partial thread rendered.

  6. API UNAVAILABLE DURING THREAD SAVE
     FastAPI /threads/ endpoint unreachable. Thread data
     assembled but cannot persist.
     Guard: save failure surfaces a named error. Thread
     remains in Svelte store (session state). User can retry
     save when API is available. No data lost — the thread
     result is held in memory until explicitly cleared.

  7. STALE ENTRY IDS ON THREAD LOAD
     A saved thread references entry_ids that no longer exist
     (entries deleted or IDs changed since save).
     Guard: frontend fetches live entries by ID. Missing IDs
     return empty. The thread renders with available entries
     and surfaces a notice: "N entries from this thread are
     no longer available." The saved record is not modified —
     the original entry_ids are preserved as historical
     reference.


FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Frontend (Svelte):

    src/lib/components/ThreadTrace.svelte
      Overlay shell, sequence view, graph view, filter bar,
      annotation layer, entry point trigger bindings.
      Status: PLANNED

    src/lib/thread-trace.ts
      Pure logic module — four thread builders, seed
      resolution, edge label generation, routing summary,
      filter state mapping, routing snapshot assembly.
      No DOM. No API calls.
      Status: PLANNED

    src/lib/stores/thread.ts
      Svelte store for session-only thread state.
      currentThread, isOverlayOpen.
      Status: PLANNED

  Backend (FastAPI):

    backend/routes/threads.py
      FastAPI routes for /threads/ namespace — CRUD for
      saved threads, annotations, touch endpoint.
      Status: PLANNED

    backend/models/thread.py
      SQLAlchemy models for saved_threads and
      thread_annotations tables.
      Status: PLANNED
