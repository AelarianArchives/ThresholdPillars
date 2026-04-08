# SYSTEM: Threshold Engine

## /DESIGN/Systems/Threshold_Engine/

### Page 02 · 12 thresholds · 66 pairs · co-occurrence + presence + sequence detection

---

## WHAT THIS SYSTEM OWNS

* THR co-occurrence computation — 66 threshold pairs (12 choose 2).
  Observed rate vs. expected rate (marginal product baseline) per pair.
  Weight breakdown and null contribution per pair
* THR presence rate computation — 12 individual thresholds. Weighted
  frequency vs. total examined
* THR sequence detection — temporal pairs and triples. Order matters.
  Weight = product of deposit_weight at each position (asymmetric).
  Recurrence threshold >= 2 to surface. Carries contributing_deposit_ids
* THR pattern_id format and generation
* THR-specific snapshot_data JSON structure
* Three visualizations: co-occurrence matrix (12x12), presence timeline,
  sequence view
* THR failure modes

## WHAT THIS SYSTEM DOES NOT OWN

* Shared computation framework — owned by Engine Computation.
  Engine_Computation owns the four-step contract, baseline formula,
  deposit weight constants, signal classification, null observation
  flow, snapshot writes, and stale flag mechanics. THR implements
  its lens within that contract
* Database table definitions — owned by INTEGRATION DB SCHEMA.md
  (engine_snapshots, visualization_snapshots) and OPERATIONAL DB
  SCHEMA.md (engine_stale_flags)
* Threshold names and IDs (th01–th12) — owned by TAG VOCABULARY.md
* Entry data — owned by INTEGRATION DB SCHEMA.md
* MTM synthesis — MTM reads THR snapshots; THR does not participate
  in synthesis

---

## LENS

12 canonical threshold states (th01–th12). THR indexes deposits by
which thresholds are present via tags. If phase_state names a threshold
not in the tags, THR indexes under phase_state as well — divergence
between phase_state and tags is data.

Three computations extend the shared baseline: co-occurrence across
66 pairs, presence rates for each of the 12 thresholds, and temporal
sequence detection for pairs and triples.

All mechanical detail — algorithms, thresholds, calibration constants —
in THRESHOLD ENGINE SCHEMA.md.

---

## NEXUS FEED

**Metamorphosis (MTM)**
Reads engine_snapshots — current, previous, delta. THR co-occurrence
patterns and sequence data consumed at synthesis time.

**Liber Novus (LNV · 47)**
Receives visualization_snapshots via POST /api/lnv/receive. Sage-triggered
captures only.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| DESIGN/Systems/Threshold_Engine/THRESHOLD ENGINE SCHEMA.md | Full mechanical spec — co-occurrence, presence, sequence algorithms, visualization specs, failure modes | V1 |
| backend/services/engine_thr.py | THR computation — 66 pairs, 12 presence rates, sequence detection | PLANNED |
| frontend/src/lib/components/ThrCooccurrenceMatrix.svelte | 12x12 grid, cell color by signal band, hover breakdown — LayerCake + d3-interpolate | PLANNED |
| frontend/src/lib/components/ThrPresenceTimeline.svelte | Threshold rows, deposit dots — LayerCake + d3-scale | PLANNED |
| frontend/src/lib/components/ThrSequenceView.svelte | Table/card listing, significance scores, recurrence counts, sortable | PLANNED |
