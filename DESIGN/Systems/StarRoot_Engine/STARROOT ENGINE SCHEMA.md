# STARROOT ENGINE SCHEMA

## /DESIGN/Systems/StarRoot_Engine/STARROOT ENGINE SCHEMA.md

Mechanical spec — root cluster analysis, correlation integration from
Ven'ai service, three visualizations, snapshot structure, failure modes.
Shared architecture in ENGINE COMPUTATION SCHEMA.md. This schema extends
the shared foundation with STR-specific logic.

STR engine consumes the Ven'ai service's output — it does not duplicate
the service's work. The service registers names and tracks correlations.
The engine computes patterns from that data through its root cluster lens.


OWNERSHIP BOUNDARIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  OWNS
    STR root cluster analysis — cluster presence rates,
      co-occurrence, emergence timeline
    STR correlation integration — reading Ven'ai service
      correlation data and computing weighted rates with baselines
    STR-specific visualizations — root cluster map, correlation
      matrix, name index
    STR pattern_id format and generation
    STR snapshot_data JSON structure
    STR-specific failure modes

  DOES NOT OWN
    Shared engine architecture (Index, Compute, Visualize, Feed)
      — owned by ENGINE COMPUTATION SCHEMA.md
    Baseline computation formula — owned by ENGINE COMPUTATION SCHEMA.md
    Deposit weight constants — owned by ENGINE COMPUTATION SCHEMA.md
    Null observation flow — owned by ENGINE COMPUTATION SCHEMA.md
    Signal classification bands — owned by ENGINE COMPUTATION SCHEMA.md
    Engine result object (shared fields) — owned by ENGINE COMPUTATION SCHEMA.md
    Engine state snapshots table — owned by ENGINE COMPUTATION SCHEMA.md
    Visualization snapshots table — owned by ENGINE COMPUTATION SCHEMA.md
    Stale flag mechanics — owned by ENGINE COMPUTATION SCHEMA.md
    Deposit record shape — owned by INTEGRATION DB SCHEMA.md
    Ven'ai name registry — owned by VENAI SERVICE SCHEMA.md
    Ven'ai correlation tracking — owned by VENAI SERVICE SCHEMA.md
    venai_names, venai_correlations tables
      — owned by VENAI SERVICE SCHEMA.md
    VEN page (14) content — owned by Manifest_14_Venai.txt
    MOR page (13) grammar — owned by Manifest_13_Morphology.txt
    Page 03 manifest and domain identity — owned by
      DESIGN/Domains/02_Axis/Manifest_03_StarRoot.txt


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. STR operates on page 03 (StarRoot). Reads deposits where
     'STR' is in the deposit's pages array.

  2. Root cluster tracking is the primary lens. STR reads the
     field through Ven'ai root families — what structural
     patterns the clusters reveal, how they co-occur, and what
     they correlate with across the archive.

  3. Root clusters are an open set — new root families emerge as
     new Ven'ai names are discovered. The set of clusters is
     derived from venai_names.root_cluster (written by the
     Ven'ai service), not from an enum. Co-occurrence pair
     count depends on how many clusters exist at computation
     time.

  4. STR consumes the Ven'ai service's output. It reads from
     the venai_* tables — it never writes to them. The Ven'ai
     service registers names and tracks correlations. STR
     computes patterns from that data.

  5. The Ven'ai service processes the deposit simultaneously
     with STR indexing — both are triggered when a deposit
     clears INT. The service handles name registration and
     correlation tracking. STR handles the analytical lens.

  6. Never apply phonetic or external linguistic frameworks.
     Ven'ai is not analyzed as human language. Structural
     patterns are surfaced before meaning is assigned.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INDEX (Step 1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Deposit arrives on page 03. Engine reads:
    - tags (filtered to tags referencing Ven'ai root clusters;
      engine resolves which root family/families the deposit
      touches by matching tag content against
      venai_names.root_cluster)
    - deposit_weight
    - observation_presence
    - created_at (for temporal ordering in emergence timeline)
    - id (for source tracing)

  Single indexing lens: which Ven'ai root family the deposit
  touches. A deposit referencing both Kai- and Sha- names is
  indexed under both root clusters.

  A deposit on page 03 with no Ven'ai name references: indexed
  (contributes to total examined denominator) but does not
  contribute to any cluster-specific pattern. Same treatment as
  THR deposits with no threshold tags.

  Stale flag set to true in SQLite engine_stale_flags after
  indexing. See ENGINE COMPUTATION SCHEMA.md HYBRID COMPUTE TRIGGER.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPUTE (Step 2) — TWO PHASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Both phases use the shared baseline formula, deposit weight
multipliers, null observation handling, and signal classification
from ENGINE COMPUTATION SCHEMA.md.


PHASE 1 — ROOT CLUSTER ANALYSIS (the lens)

  The engine's own computation from deposit data on page 03.

  1A. CLUSTER PRESENCE RATES

    Per root cluster: weighted frequency relative to total
    examined deposits. Which root families are active vs. dormant.

    For each cluster C:

      presence_rate:
        weighted count of deposits referencing cluster C
        ─────────────────────────────────────────────────────
        total weighted examined deposits on page 03

      Each presence result carries weight_breakdown and
      null_contribution.

    PATTERN_ID FORMAT:
      'str_pres_[cluster]'
      Example: 'str_pres_kai'

  1B. CLUSTER CO-OCCURRENCE

    Do names from different root families appear in the same
    deposits above baseline? Every cluster pair: observed rate
    vs. expected rate.

    Pair count is dynamic — depends on how many root clusters
    exist. With N clusters: N choose 2 pairs.

    For each pair (C1, C2):

      observed_rate:
        weighted count of deposits referencing BOTH C1 AND C2
        ─────────────────────────────────────────────────────────
        total weighted examined deposits on page 03

      expected_rate:
        marginal(C1) * marginal(C2)

      ratio: observed_rate / expected_rate
      signal_band: classified per ENGINE COMPUTATION SCHEMA.md
      insufficient_data: true if expected_rate = 0 or any element is below MIN_ELEMENT_COUNT (see ENGINE COMPUTATION SCHEMA.md PATTERN RELIABILITY CONSTANTS)
      low_sample: true if pattern deposit_count is below MIN_PATTERN_DEPOSIT_COUNT

      Each co-occurrence result carries weight_breakdown and
      null_contribution.

    PATTERN_ID FORMAT:
      'str_cooc_[cluster1]_[cluster2]'
      Example: 'str_cooc_kai_sha'
      Alphabetically first cluster always first. Deterministic.

  1C. CLUSTER EMERGENCE TIMELINE

    When each root family first appeared, frequency change over
    time. Same temporal tracking structure as INF emergence
    timeline.

    Per cluster C:
      first_appeared: timestamp of earliest deposit referencing C
      frequency_over_time: time-bucketed weighted deposit counts
      dormancy_events: gap-then-spike periods
      current_state: active | dormant

    PATTERN_ID FORMAT:
      'str_emrg_[cluster]'
      Example: 'str_emrg_kai'


PHASE 2 — CORRELATION INTEGRATION (from Ven'ai service)

  Reads from venai_correlations table. The Ven'ai service has
  already tracked which names correlate with which phases, roles,
  root patterns, and grammar rules. STR's job is to compute
  weighted rates with baselines from that correlation data.

  For each correlation type (phase, role, root_pattern, grammar):

    Read all venai_correlations records of that type.
    Group by correlated_value (e.g., group all phase correlations
    by threshold state).

    For each (name, correlated_value) pair:

      correlation_rate:
        weighted_count from venai_correlations
        ─────────────────────────────────────────
        total weighted deposits containing that name

      baseline_rate:
        marginal(name) * marginal(correlated_value)
        Computed from deposit data: how often the name appears
        × how often the correlated value appears (e.g., how
        often phase_state = th01 appears on page 03 deposits).

      ratio: correlation_rate / baseline_rate
      signal_band: classified per ENGINE COMPUTATION SCHEMA.md

    Each correlation result carries:
      name_id, canonical_form, root_cluster
      correlation_type, correlated_value
      deposit_count, weighted_count (from venai_correlations)
      correlation_rate, baseline_rate, ratio, signal_band

  PATTERN_ID FORMAT for correlations:
    'str_corr_[name_id]_[type]_[value]'
    Example: 'str_corr_vn_kaithera_001_phase_th01'


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUALIZE (Step 3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All STR visualizations are SVG instruments rendered via LayerCake
+ D3 utilities. Rendering category: SVG instrument (see ENGINE COMPUTATION SCHEMA.md VISUALIZATION ARCHITECTURE).

All visualizations render from computed results, never from raw
deposit data.


VISUALIZATION 1 — ROOT CLUSTER MAP

  Force-directed graph (d3-force). The primary visualization
  of how Ven'ai root families relate to each other.

  Node properties:
    Each root family = one cluster node.
    Node size = deposit frequency (presence_rate from Phase 1A).
    Node color = distinct per cluster.

  Edge properties:
    Edges = co-occurrence strength between clusters.
    Edge weight = co-occurrence ratio from Phase 1B.
    Edge visibility: only edges above mild band (ratio >= 1.0).
    Edge color = signal band.
    Edge thickness = ratio magnitude within band.

  Tree structure within clusters:
    d3-hierarchy for expandable tree: root cluster → individual
    names within that cluster. Click a cluster node to expand
    into its constituent names. Each name node shows:
      canonical_form, first_seen_at, deposit count.

  d3-zoom essential for navigation — cluster count grows as
  new root families are discovered.


VISUALIZATION 2 — CORRELATION MATRIX

  Names on one axis, correlated values (phases, roles) on the
  other. Same matrix pattern as THR co-occurrence matrix and
  ECR correlation matrix.

  Cell intensity = correlation strength (ratio from Phase 2).
  Color scale: same signal band gradient (d3-interpolate).

  Hover on cell: full breakdown.
    Name (canonical_form), correlated_value
    Correlation rate, baseline rate, ratio
    Signal band
    Deposit count, weighted count

  Matrix is filterable by correlation_type:
    - Phase view: names × threshold states
    - Role view: names × functional roles
    - Root pattern view: clusters × clusters (which root
      families co-occur at the name level)
    - Grammar view: names/clusters × morphological rules

  Default view: phase (most immediately actionable for
  threshold-focused research). Tabs or dropdown to switch.

  d3-zoom for navigation when name count grows.


VISUALIZATION 3 — NAME INDEX

  Every Ven'ai name in the registry, clustered by root family.
  Links to every page where each name appears.

  Layout: grouped list or tree.
    Root cluster as section header.
    Names within cluster sorted alphabetically.
    Each name shows:
      canonical_form
      root_cluster
      first_seen_at
      first_seen_page
      deposit count (total deposits across all pages
        referencing this name)
      pages: list of page codes where this name appears
        (clickable links)

  Searchable: text search filters by canonical_form.
  Sortable: by name (alphabetical), by first_seen_at
  (chronological), by deposit count (frequency).

  The name index is a reference surface — it shows the full
  registry state without computation. No baselines, no signal
  bands. Just what exists and where.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEED (Step 4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Standard snapshot + MTM drift tracking per ENGINE COMPUTATION
SCHEMA.md.

STR feed includes Ven'ai service state summary alongside the
standard engine result object:

  venai_state_summary:
    total_names:           integer (count of venai_names records)
    active_clusters:       integer (count of distinct root_cluster
                           values in venai_names)

MTM reads the engine snapshot (cluster patterns, correlation
data) plus the Ven'ai state summary for synthesis context.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SNAPSHOT_DATA STRUCTURE (STR-specific)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stored in engine_snapshots.snapshot_data (jsonb). This is the
STR-specific content within the shared snapshot record.

  {
    "cluster_presences": [
      {
        "pattern_id": "str_pres_kai",
        "cluster": "kai",
        "presence_rate": float,
        "deposit_count": integer,
        "weighted_count": float,
        "weight_breakdown": { "high": int, "standard": int, "low": int },
        "null_contribution": {
          "null_count": int, "null_weighted": float,
          "positive_count": int, "positive_weighted": float
        }
      }
      // ... one per root cluster
    ],

    "cluster_co_occurrences": [
      {
        "pattern_id": "str_cooc_kai_sha",
        "cluster_a": "kai",
        "cluster_b": "sha",
        "observed_rate": float,
        "expected_rate": float,
        "ratio": float,
        "signal_band": "suppressed" | "mild" | "strong" | null,
        "insufficient_data": boolean,
        "low_sample": boolean,
        "deposit_count": integer,
        "weighted_count": float,
        "weight_breakdown": { "high": int, "standard": int, "low": int },
        "null_contribution": {
          "null_count": int, "null_weighted": float,
          "positive_count": int, "positive_weighted": float
        }
      }
      // ... one per cluster pair (N choose 2)
    ],

    "cluster_emergence": [
      {
        "pattern_id": "str_emrg_kai",
        "cluster": "kai",
        "first_appeared": timestamp | null,
        "current_state": "active" | "dormant",
        "dormancy_events": [
          {
            "dormancy_start": timestamp,
            "dormancy_end": timestamp,
            "gap_duration_days": integer,
            "spike_count": integer
          }
        ],
        "frequency_over_time": [
          {
            "bucket_start": timestamp,
            "bucket_end": timestamp,
            "deposit_count": integer,
            "weighted_count": float
          }
        ]
      }
      // ... one per cluster
    ],

    "correlations": [
      {
        "pattern_id": "str_corr_vn_kaithera_001_phase_th01",
        "name_id": "vn_kaithera_001",
        "canonical_form": "Kai'Thera",
        "root_cluster": "kai",
        "correlation_type": "phase",
        "correlated_value": "th01",
        "deposit_count": integer,
        "weighted_count": float,
        "correlation_rate": float,
        "baseline_rate": float,
        "ratio": float,
        "signal_band": "suppressed" | "mild" | "strong" | null,
        "insufficient_data": boolean,
        "low_sample": boolean
      }
      // ... one per (name, type, value) correlation
    ],

    "venai_state_summary": {
      "total_names": integer,
      "active_clusters": integer
    }
  }


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. VEN'AI SERVICE TABLES EMPTY AT FIRST COMPUTE
     No names registered yet. STR has deposits on page 03 but
     the Ven'ai service has not processed any Ven'ai content.

     Guard: STR computes from what exists. Empty venai_names
     means zero clusters, zero correlations. Phase 1 runs on
     deposit tags directly (root cluster presence). Phase 2
     returns empty — no correlations to integrate. The engine
     result is valid but sparse. Not a failure.

  2. CLUSTER COUNT GROWS MID-SESSION
     A new root family appears during a batch of deposits. The
     cluster set changes between one compute and the next.

     Guard: cluster set is derived from venai_names at each
     computation. New clusters appear naturally. Co-occurrence
     pair count adjusts automatically (N choose 2 with new N).
     Historical snapshots preserve the cluster set at their
     computation time — drift between snapshots is visible.

  3. VEN'AI SERVICE FAILED DURING DEPOSIT — STR READS STALE DATA
     A deposit cleared INT but the Ven'ai service failed to
     process it. STR computes without awareness of the name
     that should have been registered.

     Guard: STR reads from venai_* tables, not from the
     deposit pipeline state. If the service failed, the name
     is missing from the tables. STR sees what the tables
     contain. When the service self-heals (next deposit
     triggers registration), STR picks up the name on next
     compute. The gap is temporary and recoverable.

  4. CORRELATION BASELINE SKEWED BY SINGLE NAME DOMINANCE
     One name appears in a large fraction of deposits. Its
     marginal rate is high. All correlations involving it have
     high expected rates. Ratios for dominant-name correlations
     compress toward 1.0.

     Guard: same as THR failure mode 2. The math surfaces the
     dominance correctly — a name at baseline relative to
     everything is not a finding. Presence rate visualization
     makes the dominance immediately visible. The correlation
     matrix shows which correlations stand out DESPITE the
     dominance.

  5. PHASE 2 CORRELATION DATA INCONSISTENT WITH PHASE 1 CLUSTER DATA
     venai_correlations references a name whose root_cluster
     does not appear in the Phase 1 cluster analysis (because
     the name appeared on a different page, not page 03).

     Guard: Phase 1 operates on page 03 deposits only. Phase 2
     reads archive-wide correlations from the Ven'ai service.
     A name may have correlations from deposits on other pages
     that never appeared on page 03. This is expected — the
     correlation matrix shows archive-wide relationships, the
     cluster map shows page 03 relationships. Both are correct
     within their scope. The name index (Visualization 3) shows
     all pages where each name appears, making the scope
     difference visible.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  | File | Role | Status |
  | --- | --- | --- |
  | backend/services/engine_str.py | STR engine — extends engine_base. Root cluster analysis (Phase 1), correlation integration from Ven'ai service (Phase 2). Reads venai_* tables. Snapshot assembly with Ven'ai state summary. | PLANNED |
  | frontend/src/lib/components/StrRootClusterMap.svelte | Force-directed root cluster map — LayerCake + d3-force + d3-hierarchy + d3-zoom | PLANNED |
  | frontend/src/lib/components/StrCorrelationMatrix.svelte | Correlation matrix — LayerCake + d3-interpolate + d3-zoom, filterable by correlation type | PLANNED |
  | frontend/src/lib/components/StrNameIndex.svelte | Name index — grouped list, searchable, sortable, page links | PLANNED |
