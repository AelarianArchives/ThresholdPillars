# SYSTEM: StarRoot Engine

## /DESIGN/Systems/StarRoot_Engine/

### Page 03 · root cluster analysis · Ven'ai correlation integration · drift alert panel

---

## WHAT THIS SYSTEM OWNS

* STR root cluster analysis — presence rates, co-occurrence, and
  emergence timeline computed per root cluster. Dynamic pair count
  (N choose 2 where N = number of root clusters)
* STR correlation integration — reads venai_correlations table to
  compute correlation rates per (name, correlated_value) pair against
  marginal product baseline. Signal band classification applied
* Four visualizations: root cluster map (force-directed), correlation
  matrix, drift alert panel, name index
* STR pattern_id format and generation
* STR-specific snapshot_data JSON structure including venai_state_summary
  (total_names, active_clusters, unresolved_drift_count)
* STR failure modes

## WHAT THIS SYSTEM DOES NOT OWN

* Shared computation framework — owned by Engine Computation.
  Engine_Computation owns the four-step contract, baseline formula,
  deposit weight constants, signal classification, null observation
  flow, snapshot writes, and stale flag mechanics. STR implements
  its lens within that contract
* Ven'ai name registry, drift detection, and correlation tracking —
  owned by Ven'ai Service. STR reads from venai_names,
  venai_variations, and venai_correlations. STR never writes to
  Ven'ai tables
* Database table definitions — owned by INTEGRATION DB SCHEMA.md
  and OPERATIONAL DB SCHEMA.md
* Tag vocabulary and root cluster definitions — owned by
  TAG VOCABULARY.md
* Entry data — owned by INTEGRATION DB SCHEMA.md
* MTM synthesis — MTM reads STR snapshots; STR does not participate
  in synthesis
* Ven'ai linguistic analysis — STR never applies external linguistic
  frameworks. Ven'ai is not analyzed as human language

---

## LENS

Root clusters from Ven'ai names. STR indexes deposits by matching tag
content against venai_names.root_cluster — which root families a deposit
touches.

Two computation phases: Phase 1 is STR's own lens (cluster presence,
co-occurrence, emergence timeline). Phase 2 integrates correlation data
already tracked by Ven'ai Service (phase, role, root_pattern, grammar
correlations).

The Ven'ai service runs simultaneously with STR indexing — both triggered
on deposit. STR consumes Ven'ai tables as a reader; Ven'ai Service owns
the writes.

All mechanical detail in STARROOT ENGINE SCHEMA.md.

---

## NEXUS FEED

**Metamorphosis (MTM)**
Reads engine_snapshots — current, previous, delta. STR cluster patterns,
correlation data, and Ven'ai state summary consumed at synthesis time.

**Liber Novus (LNV · 47)**
Receives visualization_snapshots via POST /api/lnv/receive. Sage-triggered
captures only.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| DESIGN/Systems/StarRoot_Engine/STARROOT ENGINE SCHEMA.md | Full mechanical spec — cluster analysis, correlation integration, Ven'ai table reads, visualization specs, failure modes | V1 |
| backend/services/engine_str.py | STR computation — root cluster analysis, correlation integration, Ven'ai state summary | PLANNED |
| frontend/src/lib/components/StrRootClusterMap.svelte | Force-directed graph, node size = presence_rate, edges = co-occurrence — d3-force + d3-hierarchy + d3-zoom | PLANNED |
| frontend/src/lib/components/StrCorrelationMatrix.svelte | Names × dimensions, filterable by correlation type — d3-interpolate + d3-zoom | PLANNED |
| frontend/src/lib/components/StrDriftAlertPanel.svelte | Unacknowledged variations from Ven'ai service, acknowledge action | PLANNED |
| frontend/src/lib/components/StrNameIndex.svelte | Ven'ai names grouped by root, searchable, sortable | PLANNED |
