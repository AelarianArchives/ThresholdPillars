# SYSTEM: Echo Recall Engine

## /DESIGN/Systems/Echo_Recall_Engine/

### Page 05 · 19 signals · 171 pairs · constellation drift state · most data-dense Axis engine

---

## WHAT THIS SYSTEM OWNS

* ECR co-occurrence computation — 171 signal pairs (19 choose 2).
  Observed rate vs. expected rate (marginal product baseline) per pair.
  Weight breakdown and null contribution per pair
* ECR presence rate computation — 19 signals (s01–s19). Weighted
  frequency vs. total examined
* ECR sequence detection — temporal pairs (342 possible) and triples
  (5,814 possible). Recurrence threshold >= 2 to surface. Significance
  floor can filter noisy sequences
* Signal constellation drift state — accumulates across snapshots (not
  per-snapshot). Tracks current_positions, position_history (indexed by
  snapshot_id), cluster_assignments. Stored in snapshot_data under
  constellation_state key
* Signal families — derived from domain file layout: Family A (s01–s04),
  Family B (s05, s06, s08, s09), Family C (s10–s13), Family D (s14–s16),
  Family E (s17–s19), Family F (s07)
* Four visualizations: correlation matrix (19x19 with block structure),
  signal constellation (force-directed, stateful drift tracking),
  sequence view, presence timeline
* ECR pattern_id format and generation
* ECR-specific snapshot_data JSON structure with constellation_state
* ECR performance considerations — canary engine for the architecture.
  If ECR performs well, all others are fine
* ECR failure modes

## WHAT THIS SYSTEM DOES NOT OWN

* Shared computation framework — owned by Engine Computation.
  Engine_Computation owns the four-step contract, baseline formula,
  deposit weight constants, signal classification, null observation
  flow, snapshot writes, and stale flag mechanics. ECR implements
  its lens within that contract
* Database table definitions — owned by INTEGRATION DB SCHEMA.md
  and OPERATIONAL DB SCHEMA.md
* Signal definitions (s01–s19) — owned by TAG VOCABULARY.md
* Entry data — owned by INTEGRATION DB SCHEMA.md
* MTM synthesis — MTM reads ECR snapshots; ECR does not participate
  in synthesis

---

## LENS

19 relational signals. ECR indexes deposits by filtering tags to
s01–s19 routed seeds. Multiple tags with the same seed produce one
signal presence (seed-level dedup).

Three computations extend the shared baseline: 171-pair co-occurrence,
19 individual presence rates, and temporal sequence detection.

The constellation drift state is unique to ECR — it tracks how signal
clusters move relative to each other across computations. This is
engine-level state that accumulates, not per-snapshot state that
resets. Visualization snapshots for LNV capture node positions, cluster
groupings, drift vectors, and force simulation state.

All mechanical detail in ECHO RECALL ENGINE SCHEMA.md.

---

## NEXUS FEED

**Metamorphosis (MTM)**
Reads engine_snapshots — current, previous, delta. ECR co-occurrence
patterns, sequence data, and constellation drift state (cluster
stability) consumed at synthesis time.

**Liber Novus (LNV · 47)**
Receives visualization_snapshots via POST /api/lnv/receive. Sage-triggered
captures only. Constellation snapshots carry drift vectors and cluster
groupings.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| DESIGN/Systems/Echo_Recall_Engine/ECHO RECALL ENGINE SCHEMA.md | Full mechanical spec — 171 pairs, 19 signals, sequence detection, constellation state, visualization specs, performance notes, failure modes | V1 |
| backend/services/engine_ecr.py | ECR computation — 171 pairs, 19 presence rates, sequence detection, constellation state management | PLANNED |
| frontend/src/lib/components/EcrCorrelationMatrix.svelte | 19x19 with signal family block structure — d3-zoom essential | PLANNED |
| frontend/src/lib/components/EcrSignalConstellation.svelte | Force-directed, stateful drift tracking — d3-force | PLANNED |
| frontend/src/lib/components/EcrPresenceTimeline.svelte | 19 signal rows, deposit dots — d3-scale + d3-zoom | PLANNED |
| frontend/src/lib/components/EcrSequenceView.svelte | Significance filter, recurrence counts, sortable | PLANNED |
