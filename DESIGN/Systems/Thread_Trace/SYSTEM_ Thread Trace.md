# SYSTEM: Thread Trace

## thread_trace_system.md

### /DESIGN/systems/

### Four thread builders · seed resolution · overlay UI · saved threads

---

## WHAT THIS SYSTEM OWNS

* Four thread builders — Temporal · Relational · Cluster · Emergence
* Seed resolution — normalizing any entry point into a typed seed object
* Edge label generation per thread edge
* Tag routing summary across a thread's entry set
* Active filter state — reading tagger Svelte store for filter pre-population
* Routing snapshot — assembled at save time, stored with the saved thread record in PostgreSQL
* Overlay UI — ThreadTrace Svelte component: one shell, sequence view, graph view, filter bar, annotation layer
* Saved threads — PostgreSQL `saved_threads` table via FastAPI `/threads/` endpoints
* Thread annotations — PostgreSQL `thread_annotations` table via FastAPI `/threads/` endpoints
* Session-only thread state — Svelte store, no API call or DB write until save is triggered

## WHAT THIS SYSTEM DOES NOT OWN

* Tag vocabulary or routing records — owned by TAG VOCABULARY.md, served via FastAPI `/tags/` endpoints
* Entry data, entry schema, or entry reads/writes — owned by INTEGRATION DB SCHEMA.md, served via FastAPI `/entries/` endpoints
* Emergence pattern detection — owned by EMERGENCE SCHEMA.md, served via FastAPI emergence service
* Tagger results or pipeline — owned by TAGGER SCHEMA.md, state held in tagger Svelte store
* The entries Thread Trace reads from — it receives via API, never writes entries

---

## THREAD TYPES

Four thread types. All four use the same overlay shell. The builder changes. The UI does not.

### TEMPORAL

Orders entries chronologically along a shared arc or phase trajectory.

When the seed is an entry, scopes to entries sharing the same phase_state or section as the anchor. When the seed is a tag, scopes to entries carrying that tag. When the seed is a finding, scopes to the finding's involved entries.

**Fallback:** if the scoped pool contains fewer than 3 entries, falls back to the full corpus automatically. Temporal is the default fallback for any thread type that cannot execute with the given seed.

### RELATIONAL

Traverses entry-to-entry links via `linkedEntries` on each entry, then extends outward through shared tag routing to fill depth.

Traversal is BFS from the seed entry. MAX_DEPTH = 4 hops. MAX_ENTRIES = 30.

**Fallback:** if the seed is not type `entry`, falls back to TEMPORAL.

**BLOCKER:** Relational threads require `linkedEntries` to be populated on entries. Until entries carry valid `linkedEntries` data, Relational threads fall back to TEMPORAL silently. The builder is written and ready — it activates when the data exists.

### CLUSTER

Groups entries that share a dominant tag cluster. Seed can be a tag ID or an entry — if entry, the dominant tag from that entry's routing record anchors the cluster.

Entries are ranked by tag overlap count with the seed cluster. Operates on the full corpus — no section scoping.

### EMERGENCE

Entries linked by Emergence findings and co-occurrence patterns. Seed is a finding object from the emergence service.

Builder reads `involvedEntries` from the finding and extends outward through shared tag routing. Bridges to the emergence detection service via FastAPI — fires fresh detection or uses an existing finding passed from the Emergence overlay.

---

## SEED RESOLUTION

`resolveSeed()` normalizes any raw entry point into a typed seed object before the thread builder receives it. All three entry points route through `resolveSeed()` before `buildThread()` is called.

**Seed shape:**

```
{
  type:        'entry' | 'tag' | 'finding' | 'query'
  id:          string | object
  threadTypes: string[]
}
```

**Resolution rules:**

finding object (has findingType or involvedTags)
  → type: 'finding' → threadTypes: ['emergence', 'cluster']

raw seed object with explicit threadTypes
  → type guessed from id prefix → threadTypes: carried from object

plain string starting with tv_ or matching short-code pattern
  → type: 'tag' → threadTypes: ['cluster', 'temporal']

plain string (entry ID)
  → type: 'entry' → threadTypes: ['relational', 'temporal']

query string (free text, no matching ID pattern)
  → type: 'query' → threadTypes: ['temporal', 'cluster']

**Query seed type:** scopes entries by text content match rather than requiring a known ID or object. Enables ad-hoc pattern exploration. Defaults to TEMPORAL scoped by content match, then CLUSTER by dominant tag overlap.

---

## ENTRY POINTS

Three surfaces trigger Thread Trace. All three call `open(rawSeed)` which routes through `resolveSeed()` → `buildThread()`.

| Surface | Trigger | Seed shape passed |
| --- | --- | --- |
| Entry meta strip | Trace action on entry element | `{ seed: entry.id, threadTypes: ['relational', 'temporal'] }` |
| Tag pill | Context action on tag element | `{ seed: tag.id, threadTypes: ['cluster', 'temporal'] }` |
| Emergence finding card | "Trace this pattern" action | `{ seed: findingObj, threadTypes: ['emergence'] }` |

Entry points are wired in the ThreadTrace Svelte component via event handlers on entry, tag, and finding elements rendered by their respective components.

**Entry fetch scoping:** when a panel is active, thread entry fetch API call includes the active section as a query parameter. Threads opened from a panel are section-scoped by default and can be broadened via the filter bar. When no panel is active, the full corpus is fetched.

---

## TWO VIEWS

Both views render inside the same overlay shell. The user can switch between them without closing the thread.

### Sequence View

Ordered card list. Each card represents one entry in the thread. Navigation is linear — previous / next — with a progress bar showing position in the sequence. Card content: title, body preview, phase_state, origin affinity, dominant tag routing, and edge label connecting to the next card.

### Graph View

Structural map of thread entries as nodes with edges. Edge labels show the relationship between connected entries — shared tag, explicit link, phase transition, or temporal interval. Graph export assembles a `ThreadGraphPayload` and routes to the graph page.

**PLANNED:** graph page path — `GRAPH_PAGE_PATH = '/graph'`, defined in frontend/src/lib/config.ts. Graph export is a stub until then. Thread Trace owns graph export readiness coordination — verify both ThreadTrace and Emergence components are updated together.

---

## FILTER BAR

Active across both views. Six filter dimensions:

```
pillar_id       p01 | p02 | p03
seed_id         s01–s40
layer_id        l01–l04
threshold_id    th01–th12
phase_state     canonical threshold name | null
elarianAnchor   RFLT | WHSP | VEIL | OBSV | RECL | WEAV | GATE
section         any section ID
```

Filters are applied at `buildThread()` call time. Filter application runs server-side as query parameters on the FastAPI `/entries/` request. Changing a filter rebuilds the thread with new constraints.

**Pre-population:** on overlay open, the ThreadTrace component reads the tagger Svelte store and maps its routing dimensions to the filter bar. If the tagger store has an active result, the filter bar opens pre-scoped to that context.

---

## TAGGER STORE RELATIONSHIP

Thread Trace is a read-only consumer of the tagger Svelte store. It reads at two moments and never writes to it.

| Moment | What Thread Trace does | Source |
| --- | --- | --- |
| On overlay open | Reads active filter state to pre-populate filter bar | tagger store (Svelte subscribe) |
| On thread save | Included in routing snapshot assembly | tagger store (Svelte get) |

If the tagger store has no active result, Thread Trace degrades gracefully — filter bar opens empty, routing snapshot records null filter state.

---

## EDGE LABELS

`generateEdgeLabel(entryA, entryB, threadType)` is a pure function. No external calls. Produces a human-readable label for the relationship between two adjacent entries in a thread.

**Label logic by thread type:**

TEMPORAL
  — phase transition if phase_state differs: 'Solenne Arc → Vireth's Anchor'
  — temporal interval if same phase: '3d apart' | '2w apart' | '1mo apart'
  — 'same day' if within the same calendar day

RELATIONAL
  — 'explicit link' if entries reference each other via linkedEntries
  — up to two shared tag IDs if no explicit link
  — 'routing proximity' if no shared tags

CLUSTER
  — dominant shared tag ID

EMERGENCE
  — '↑ [shared tag]' for co-occurrence link
  — 'pattern link' if no shared tags identifiable

---

## ROUTING SNAPSHOT

Built at save time from the thread's full entry set. Stored with the saved thread record in PostgreSQL. Read by Pattern Convergence as cross-domain alignment data.

**Shape:**

```
{
  dominantPillar_id:    string | null
  dominantSeed_id:      string | null
  dominantLayer_id:     string | null
  dominantThreshold_id: string | null
  entryCount:           integer
  edgeCount:            integer
  threadType:           string
  distributions: {
    pillars:    { [pillar_id]: count }
    seeds:      { [seed_id]: count }
    layers:     { [layer_id]: count }
    thresholds: { [threshold_id]: count }
  }
}
```

`getTagRoutingSummary(entries)` aggregates routing distribution across the entry set. `buildRoutingSnapshot(threadResult)` wraps that summary into the payload-ready shape above.

---

## SAVED THREADS AND ANNOTATIONS

Saved threads and annotations are stored in PostgreSQL via FastAPI `/threads/` endpoints. Thread logic runs in the Svelte frontend; persistence is server-side. Full table definitions in THREAD TRACE SCHEMA.md.

### Saved Thread Record

```
{
  id:                   text PK — 'thr_[timestamp]_[rand]'
  name:                 text — user-defined at save time
  thread_type:          text — one of the four types
  seed:                 jsonb — serialized seed
  entry_ids:            text[] — entry IDs at save time
  filter_state:         jsonb — active filter at save time
  tag_routing_snapshot: jsonb — routing snapshot
  created_at:           timestamp
  last_accessed:        timestamp
  is_deleted:           boolean, default false
}
```

**Soft delete:** delete endpoint sets `is_deleted = true`. Does not remove the record. List endpoint filters deleted records automatically.

**`touchThread()`:** updates `last_accessed` without modifying any other field. Called when a saved thread is re-opened.

**`loadThread()` does not reconstruct entries.** It returns the saved record including `entry_ids`. The frontend fetches the live entries separately via `/entries/` API and passes them to `buildThread()` for re-render. Entries reflect any updates made since the thread was saved.

### Annotations

```
{
  id:              text PK — 'ann_[timestamp]_[rand]'
  thread_id:       text FK — references saved_threads.id
  text:            text
  timestamp:       timestamp
  filter_snapshot: jsonb — filter state + sequence position
}
```

**Annotation requires a saved thread.** If the user attempts to annotate before saving, the save dialog opens first with the annotation queued.

**Positioned annotations:** `filter_snapshot` carries both the active routing filter state and the sequence position index at time of writing. An annotation knows exactly where in the thread it was made.

Annotations are queried via JOIN on `thread_id` — no denormalized mirror needed. PostgreSQL handles this as a standard foreign key relationship.

---

## SESSION-ONLY STATE

The current unsaved thread is held in a Svelte store. No API call or DB write until the user explicitly saves.

Thread store holds:
  `currentThread`  — the active ThreadResult or null
  `isOverlayOpen`  — boolean

Store is cleared when the overlay closes or a new thread is opened. It is not cleared on panel transitions — thread state persists through panel changes intentionally.

---

## NEXUS FEED

**Pattern Convergence (PCV · 50)**

Reads: `tag_routing_snapshot` from saved threads — dominant routing dimensions and full distributions across the thread's entry set.

PCV uses saved thread snapshots as named cross-domain signal sources. A saved thread's routing distribution is a pre-aggregated alignment axis: the dominant seed_id, pillar_id, threshold_id, and layer_id across a coherent set of entries.

**Liber Novus (LNV · 47)**

Receives: processed Thread Trace outputs — sequence traces and structural visualizations built from thread data.

Thread Trace outputs that have been processed into findings land on LNV as part of the Daily Nexus Routine. They arrive with provenance intact: thread type, seed, routing snapshot, and entry set are all traceable.

**Drift Taxonomy (DTX · 48)**

Reads: phase_state sequences surfaced by Temporal threads.

A Temporal thread ordered by originDate across a node's entries makes drift trajectories visible as a navigable sequence. The phase_state transitions between cards — the edge labels that read `Solenne Arc → Aetherroot Chord` — are the state vectors DTX classifies.

---

## SEQUENCES

### THREAD BUILD SEQUENCE — strict order

1. `resolveSeed(rawSeed)` called. Raw entry point normalized into typed seed object.
2. Entry corpus fetched from FastAPI `/entries/` endpoint. Scoped to active section via query parameter if a panel is active; full corpus if not.
3. Filters applied server-side as query parameters on the `/entries/` request.
4. Preferred thread type selected from `seed.threadTypes` in order. Builder attempted.
5. If builder cannot execute: fallback to next type in `seed.threadTypes`. If all preferred types fail: TEMPORAL with full corpus.
6. Builder produces ThreadResult: entry_ids, edges, edge labels, thread type.

Failure at step 1 (seed cannot be resolved): thread build aborted. `resolveSeed()` returns null. `buildThread()` checks for null seed before proceeding.
Failure at step 2 (API call fails): thread build cannot proceed. Error surfaced to caller. Overlay shows error state — not empty thread.
Failure at step 4 (builder throws): fallback to TEMPORAL with full corpus. Each builder runs in isolation.

### THREAD SAVE SEQUENCE — strict order

1. `buildRoutingSnapshot(threadResult)` called. Routing distributions computed from thread's entry set.
2. Active filter state read from tagger Svelte store. Null if store has no active result.
3. `POST /threads/` — write `saved_threads` record with all fields.
4. Return saved thread id.

Failure at step 3 (API call fails): no record created. Save has not occurred. Error surfaced. User can retry.

### ANNOTATION SAVE SEQUENCE — strict order

1. Validate thread is saved — saved thread id must exist. If not: open save dialog, queue annotation. Resume after save confirms.
2. Capture `filter_snapshot`: active filter state + current sequence position index.
3. `POST /threads/{id}/annotations` — write annotation record.

Failure at step 3: annotation not written. Error surfaced. Retry permitted.

### THREAD LOAD SEQUENCE — strict order

1. `GET /threads/{id}` — retrieve `saved_threads` record.
2. Response includes `entry_ids`.
3. Frontend fetches live entries via `GET /entries/` with ID filter. Entry data reflects any updates since save.
4. Frontend passes live entries and saved seed to `buildThread()` for re-render.
5. `PATCH /threads/{id}/touch` — `last_accessed` updated.

Failure at step 1 (record not found or deleted): load aborted.
Failure at step 3 (API call fails): thread cannot be re-rendered. Saved record intact. Retry resolves when API recovers.

---

## PUBLIC API

### Frontend (Svelte — src/lib/)

**Thread logic module** — pure logic, no DOM, no API calls

* `resolveSeed(rawSeed) → Seed` — normalizes entry point into typed seed
* `buildThread(seed, entries, filters?) → ThreadResult` — selects builder, runs, falls back to TEMPORAL
* `generateEdgeLabel(entryA, entryB, threadType) → string` — pure function, no external calls
* `getTagRoutingSummary(entries) → RoutingSummary` — aggregates routing distribution
* `buildRoutingSnapshot(threadResult) → RoutingSnapshot` — payload-ready snapshot for save

**ThreadTrace Svelte component** — overlay UI

Renders overlay shell, sequence view, graph view, filter bar, annotation layer. Binds entry point triggers via Svelte event handlers. Reads tagger store for filter pre-population. Writes to thread Svelte store for session state.

**Thread Svelte store** — session state

`currentThread`, `isOverlayOpen`. Cleared on overlay close or new thread open. Persists through panel transitions.

### Backend (FastAPI — /threads/)

* `POST /threads/` — create saved thread record, returns thread id
* `GET /threads/` — list saved threads (is_deleted = false)
* `GET /threads/{id}` — load saved thread record including entry_ids
* `DELETE /threads/{id}` — soft delete (is_deleted = true)
* `PATCH /threads/{id}/touch` — update last_accessed only
* `POST /threads/{id}/annotations` — create annotation
* `DELETE /threads/{id}/annotations/{ann_id}` — delete annotation
* `GET /threads/{id}/annotations` — list annotations for thread

---

## KNOWN FAILURE MODES

**1. Relational thread with no linkedEntries data** Falls back to TEMPORAL silently. User sees a temporal thread where they expected a relational one. Guard: name the fallback in the UI — "Relational thread unavailable: no entry links found. Showing temporal view."

**2. Annotation written before thread is saved** Annotation has no thread ID to reference. Guard: save dialog opens before annotation is written. Annotation queued and written only after save confirms.

**3. Thread opened from panel with active section scoping** Entry fetch scoped to active section via API query parameter. Thread that should span multiple sections returns a subset. Guard: display active scope in filter bar header. Make section filter visible and clearable.

**4. Graph export before graph page exists** `GRAPH_PAGE_PATH = '/graph'` (defined in frontend/src/lib/config.ts) is a stub. Guard: graph export button disabled until path is a live route. Thread Trace owns coordination — verify both components updated together.

**5. API unavailable during thread build** FastAPI `/entries/` endpoint unreachable. Guard: error surfaced in UI. Overlay does not open.

**6. API unavailable during thread save** FastAPI `/threads/` endpoint unreachable. Guard: save failure surfaced. Thread remains in Svelte store for retry.

**7. Stale entry IDs on thread load** Saved thread references entry_ids that no longer exist. Guard: frontend fetches live entries by ID. Missing IDs return empty. Thread renders with available entries and surfaces notice.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| `src/lib/components/ThreadTrace.svelte` | Overlay shell, sequence view, graph view, filter bar, annotation layer, entry point trigger bindings | PLANNED |
| `src/lib/thread-trace.ts` | Pure logic — four thread builders, seed resolution, edge labels, routing summary, routing snapshot. No DOM. No API. | PLANNED |
| `src/lib/stores/thread.ts` | Svelte store for session-only thread state. currentThread, isOverlayOpen. | PLANNED |
| `backend/routes/threads.py` | FastAPI routes for `/threads/` — CRUD saved threads, annotations, touch | PLANNED |
| `backend/models/thread.py` | SQLAlchemy models for saved_threads and thread_annotations tables | PLANNED |
