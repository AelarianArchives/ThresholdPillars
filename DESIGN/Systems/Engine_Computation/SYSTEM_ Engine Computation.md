# SYSTEM: Engine Computation

## /DESIGN/Systems/Engine_Computation/

### Shared four-step contract · baseline formula · signal classification · deposit weights · snapshot writes

---

## WHAT THIS SYSTEM OWNS

* Four-step contract that all 5 Axis engines follow: INDEX → COMPUTE →
  VISUALIZE → FEED. Every engine implements these four steps. The contract
  defines the shape — each engine fills it with its own lens
* Deposit weight constants — HIGH: 2.0 (analyses, hypotheses), STANDARD:
  1.0 (observations, reflections), LOW: 0.5 (fragments, raw captures).
  Applied universally across all engines and Emergence
* Baseline computation formula — marginal probability product. Observed
  co-occurrence rate divided by expected rate (product of individual
  marginal rates). Ratio > 1.0 means co-occurrence exceeds chance
* Three-band signal classification — suppressed (ratio < 1.0), mild
  (1.0–2.0), strong (> 2.0). Always classify, never filter. Suppressed
  signals are data, not noise
* Null observation flow — two-counter system: times_observed (weighted
  presence count) vs. times_examined (total deposits on the page).
  Null is the gap between them. Null contributes to baselines
* Hybrid compute trigger — stale flag set when a deposit lands on a
  page, cleared when computation completes. Engines recompute on stale,
  not on every deposit
* Engine state snapshot writes — engine_snapshots table (PostgreSQL).
  One row per engine per computation. Carries baseline_scope, timestamp,
  snapshot_data (engine-specific JSON), mtm_read_at for drift tracking
* Visualization snapshot writes — visualization_snapshots table
  (PostgreSQL). Auto-triggered on signal delta or Sage-triggered on
  demand. trigger_source field distinguishes the two. Route to LNV
* Shared engine result object structure — standardized shape for
  computation output including weight_breakdown, null_contribution,
  insufficient_data, low_sample, and stale_warning fields
* Pattern reliability constants — MIN_PATTERN_DEPOSIT_COUNT (flags
  low_sample patterns) and MIN_ELEMENT_COUNT (extends insufficient_data
  to near-zero frequency elements). Calibration items defined in
  backend config alongside deposit weight constants
* Duplicate detection contract — extends INT hash check with
  lens-contextual awareness per engine

## WHAT THIS SYSTEM DOES NOT OWN

* Individual engine lenses — each Axis engine (THR, STR, INF, ECR, SNM)
  owns what it indexes, how it computes through its specific lens, and
  what its visualizations render. Engine Computation owns the shared
  contract they all implement
* Database table definitions — owned by INTEGRATION DB SCHEMA.md
  (engine_snapshots, visualization_snapshots) and OPERATIONAL DB
  SCHEMA.md (engine_stale_flags)
* Stale flag storage — the flag lives in SQLite (Operational DB).
  Engine Computation defines the mechanic; Operational DB owns the table
* Tag vocabulary, seeds, routing — owned by TAG VOCABULARY.md
* Entry data — owned by INTEGRATION DB SCHEMA.md, served via FastAPI
* Frontend visualization components — each engine owns its own Svelte
  components. Engine Computation defines the VISUALIZE step contract;
  engines implement their own renderers
* MTM synthesis — MTM reads engine snapshots but owns its own synthesis
  logic. Engines feed MTM; they do not participate in synthesis

---

## FOUR-STEP CONTRACT

**INDEX** — Deposit lands on page. Engine reads and indexes through its
lens. Which tags, which relationships, which dimensions the engine
attends to. Marks stale flag.

**COMPUTE** — Baseline computation runs. Marginal product formula
applied. Deposit weights applied. Null observations tracked. Signal
classification assigns three-band labels. Engine-specific computations
extend the baseline (co-occurrence, sequences, correlations — depends
on the engine).

**VISUALIZE** — Results rendered to visualization. Visual weight does
the filtering (suppressed signals render but are visually de-emphasized).
Visualization reads from computation results, never from raw deposits.
Snapshots capturable on Sage action.

**FEED** — Snapshot written to engine_snapshots with timestamp,
baseline_scope, and engine-specific snapshot_data. Stale flag cleared.
mtm_read_at tracks when MTM last consumed this snapshot for drift
detection.

---

## NEXUS FEED

**Metamorphosis (MTM)**
Reads engine_snapshots — current state, previous state, and delta.
All 5 engine snapshots consumed at synthesis time. mtm_read_at field
tracks consumption for drift detection.

**Liber Novus (LNV · 47)**
Receives visualization_snapshots via POST /api/lnv/receive
(entry_type: visualization_snapshot). Auto-triggered on signal delta
or Sage-triggered on demand.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| DESIGN/Systems/Engine_Computation/ENGINE COMPUTATION SCHEMA.md | Full mechanical spec — four-step contract, baseline formula, weights, null flow, snapshot shapes, visualization architecture | COMPLETE |
| backend/services/engine_base.py | Shared computation — baseline math, weight application, null handling, signal classification, snapshot write, stale flag check | PLANNED |
| backend/routes/engines.py | Shared endpoints — compute trigger, result read, snapshot read, visualization snapshot capture | PLANNED |
| backend/config.py | Deposit weight constants (HIGH, STANDARD, LOW) — added to existing config | PLANNED |
