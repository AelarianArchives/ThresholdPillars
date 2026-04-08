# SYSTEM: Thread Trace

## /DESIGN/Systems/Thread_Trace/

### Four thread builders · seed resolution · overlay navigation · saved threads

---

## WHAT THIS SYSTEM OWNS

* Four thread builders — Temporal · Relational · Cluster · Emergence
* Seed resolution — normalizing any entry point into a typed seed object
* Edge label generation per thread edge (pure function)
* Tag routing summary and routing snapshot across a thread's entry set
* Active filter state — reading tagger Svelte store for filter pre-population
* Overlay UI — ThreadTrace Svelte component: one shell, sequence view, graph view, filter bar, annotation layer
* Saved threads — PostgreSQL saved_threads table via FastAPI /threads/ endpoints
* Thread annotations — PostgreSQL thread_annotations table with typed annotation categories
* Session-only thread state — Svelte store, no API call or DB write until save is triggered
* Fallback chain with named reason — Sage always knows what thread type she's looking at and why

## WHAT THIS SYSTEM DOES NOT OWN

* Tag vocabulary or routing records — owned by TAG VOCABULARY.md, served via FastAPI
* Entry data, entry schema, or entry reads/writes — owned by INTEGRATION DB SCHEMA.md, served via FastAPI /entries/
* Emergence pattern detection — owned by EMERGENCE SCHEMA.md, served via FastAPI
* Tagger results or pipeline — owned by TAGGER SCHEMA.md, state held in tagger Svelte store
* The entries Thread Trace reads from — it receives via API, never writes entries

---

## THREAD TYPES

Four thread types. All four use the same overlay shell. The builder changes. The UI does not.

### TEMPORAL

Orders entries chronologically along a shared arc or phase trajectory. Default fallback for any thread type that cannot execute with the given seed.

When seed is an entry: scopes to entries sharing same phase_state or section. When seed is a tag: scopes to entries carrying that tag. When seed is a finding: scopes to the finding's involvedEntries.

Fallback: if scoped pool contains fewer than 3 entries, falls back to full corpus.

### RELATIONAL

Traverses entry-to-entry links via linkedEntries, then extends outward through shared tag routing to fill depth. BFS from seed entry. MAX_DEPTH = 4, MAX_ENTRIES = 30.

ACTIVE BLOCKER: Requires linkedEntries to be populated on entries. Until entries carry valid linkedEntries data, falls back to TEMPORAL. The builder is written and ready — it activates when the data exists.

### CLUSTER

Groups entries sharing a dominant tag cluster. Seed can be a tag ID or an entry — if entry, the dominant tag from that entry's routing record anchors the cluster. Ranked by tag overlap count. Full corpus, no section scoping.

### EMERGENCE

Entries linked by Emergence findings and co-occurrence patterns. Seed is a finding object from the emergence service. Builder reads involvedEntries from the finding and extends outward through shared tag routing.

Staleness check on load: saved Emergence threads may reference findings whose structure has evolved. The load sequence re-checks finding validity and surfaces a staleness notice when the pattern has changed significantly. Details in THREAD TRACE SCHEMA.md.

---

## SEED RESOLUTION

resolveSeed() normalizes any raw entry point into a typed seed object before the thread builder receives it. Five input types resolve to four seed types:

- Finding object → type: 'finding' → ['emergence', 'cluster']
- Tag string (tv_ prefix or short-code) → type: 'tag' → ['cluster', 'temporal']
- Entry ID string → type: 'entry' → ['relational', 'temporal']
- Query string (free text) → type: 'query' → ['temporal', 'cluster']
- Raw seed with explicit threadTypes → type guessed from id → threadTypes carried

Full resolution rules and seed shape in THREAD TRACE SCHEMA.md.

---

## TWO VIEWS

Both views render inside the same overlay shell. Switch without closing the thread.

**Sequence View** — ordered card list. Linear navigation (previous/next) with progress bar. Card content: title, body preview, phase_state, origin affinity, dominant tag routing, edge label to next card.

**Graph View** — structural map with nodes and edges. Edge labels show relationships. Graph export assembles ThreadGraphPayload and routes to the graph page (PLANNED — stub until graph page is live).

---

## FILTER BAR

Eight filter dimensions plus section. Active across both views. Filters rebuild the thread against the current corpus with new constraints. Applied server-side as query parameters on the /entries/ fetch.

Pre-populated from tagger Svelte store on overlay open when an active result exists.

Full dimension list and display labels in THREAD TRACE SCHEMA.md.

---

## FALLBACK CHAIN

When a thread builder fails and falls back to the next type in seed.threadTypes, the fallback is named — not silent. Sage always sees what kind of thread she's looking at and why the preferred type couldn't execute.

The overlay header surfaces the fallback reason as a single dismissible line below the thread title. Details in THREAD TRACE SCHEMA.md.

---

## NEXUS FEED

**Pattern Convergence (PCV · 50)**
Reads tag_routing_snapshot from saved threads as named cross-domain signal sources. A saved thread's routing distribution is a pre-aggregated alignment axis. Snapshots carry timestamps so PCV can weight old snapshots differently from recent ones.

**Liber Novus (LNV · 47)**
Receives processed Thread Trace outputs — sequence traces and structural visualizations — as part of the Daily Nexus Routine. Provenance intact: thread type, seed, routing snapshot, annotation types.

**Drift Taxonomy (DTX · 48)**
Reads phase_state sequences from Temporal threads. The phase_state transitions between cards — edge labels reading 'Solenne Arc → Aetherroot Chord' — are the state vectors DTX classifies. Thread Trace makes the trajectory legible. DTX receives it.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| frontend/src/lib/components/ThreadTrace.svelte | Overlay shell, sequence view, graph view, filter bar, annotation layer, entry point bindings | PLANNED |
| frontend/src/lib/thread-trace.ts | Pure logic — four builders, seed resolution, edge labels, routing summary/snapshot, fallback chain | PLANNED |
| frontend/src/lib/stores/thread.ts | Svelte store — session-only thread state | PLANNED |
| backend/routes/threads.py | FastAPI /threads/ — CRUD saved threads, annotations, touch | PLANNED |
| backend/models/thread.py | SQLAlchemy models — saved_threads, thread_annotations | PLANNED |

All mechanical specs — sequences, table schemas, filter dimensions, edge label logic, routing snapshot shape, annotation types, staleness check, failure modes — in THREAD TRACE SCHEMA.md.
