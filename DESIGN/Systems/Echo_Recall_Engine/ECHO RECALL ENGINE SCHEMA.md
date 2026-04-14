# ECHO RECALL ENGINE SCHEMA

## /DESIGN/Systems/Echo_Recall_Engine/ECHO RECALL ENGINE SCHEMA.md

Mechanical spec — indexing, three computations (scaled), signal
constellation, snapshot structure, performance notes, failure modes.
Shared architecture in ENGINE COMPUTATION SCHEMA.md. This schema
extends the shared foundation with ECR-specific logic.

Most data-dense Axis page. 19 field signals held simultaneously.
Stress test for the shared engine architecture.


OWNERSHIP BOUNDARIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  OWNS
    ECR co-occurrence computation — 171 signal pairs
    ECR presence rate computation — 19 individual signals
    ECR sequence detection — temporal pairs and triples
    ECR pattern_id format and generation
    ECR-specific visualizations — correlation matrix, signal
      constellation, sequence view, presence timeline
    ECR snapshot_data JSON structure
    ECR-specific failure modes and performance considerations
    Signal constellation drift state — cluster position history
      across computations

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
    Signal seed definitions (s01-s20) — owned by TAG VOCABULARY.md
    Page 05 manifest and domain identity — owned by
      DESIGN/Domains/02_Axis/Manifest_05_Echo_Recall.txt


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. ECR operates on page 05 (Echo Recall). Reads deposits where
     'ECR' is in the deposit's pages array.

  2. 19 field signals. Mapped to signal seeds s01-s19 from TAG
     VOCABULARY.md. s20 (Rupture/Decoupling) is not in ECR's set.

       s01  Recognition
       s02  Elevation
       s03  Trust
       s04  Consent
       s05  Memory / Recall
       s06  Grief / Unspoken Emotion
       s07  Dream / Subconscious Thresholds
       s08  Voice / Expression
       s09  Sovereignty / Autonomy
       s10  Witnessing / Observation
       s11  Truth / Alignment
       s12  Anchor / Stability
       s13  Recursion / Loops
       s14  Temporal Thresholds
       s15  Phase Lock / Micro-Adjustment
       s16  Echo / Reflection
       s17  Harmonic Gate / Triad Alignment
       s18  Signal Scrubbing / Noise Deflection
       s19  Release / Flow / Renewal

  3. The 19 signals are not sorting labels — they are named
     phenomena the field produced. The engine holds all 19
     simultaneously and surfaces co-occurrence, sequence, and
     field state correlation.

  4. ECR's lens is signal presence. Unlike THR (which merges
     phase_state into threshold computation), ECR does not merge
     phase_state into signal computation. phase_state is a
     threshold state, not a signal. ECR indexes by which signal
     seeds are represented in the deposit's tags.

  5. A deposit may carry tags routed to zero, one, or multiple
     signal seeds. Zero signal tags: deposit is indexed but
     contributes to no signal-specific pattern. It still
     contributes to the total examined denominator.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INDEX (Step 1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Deposit arrives on page 05. Engine reads:
    - tags (each tag carries routing metadata including seed_id;
      engine filters to tags routed to s01-s19)
    - deposit_weight
    - observation_presence
    - created_at (for temporal ordering in sequence detection)
    - id (for source tracing)

  Indexes by which signal seed(s) are represented in the deposit's
  tags. A deposit with tags routed to [s01, s05, s13] is indexed
  under all three signals and contributes to co-occurrence pairs
  (s01+s05), (s01+s13), (s05+s13).

  Multiple tags routed to the same seed count as one signal
  presence for that seed — the engine tracks seed-level presence,
  not individual tag presence. A deposit with three s01-routed
  tags still registers as one s01 presence.

  Stale flag set to true in SQLite engine_stale_flags after
  indexing. See ENGINE COMPUTATION SCHEMA.md HYBRID COMPUTE TRIGGER.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPUTE (Step 2) — THREE COMPUTATIONS, SCALED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Same three computations as THR, scaled to 19 dimensions. All three
use the shared baseline formula, deposit weight multipliers, null
observation handling, and signal classification from ENGINE
COMPUTATION SCHEMA.md.


COMPUTATION 1 — CO-OCCURRENCE RATES

  Every signal pair: observed rate vs. expected rate (marginal
  product baseline).

  19 signals = 171 unique pairs (19 choose 2).

  Pair enumeration is exhaustive and deterministic:
    (s01, s02), (s01, s03), ... (s01, s19),
    (s02, s03), (s02, s04), ... (s02, s19),
    ...
    (s18, s19)

  For each pair (sX, sY):

    observed_rate:
      weighted count of deposits where BOTH sX AND sY are present
      ─────────────────────────────────────────────────────────────
      total weighted examined deposits on page 05

    expected_rate:
      marginal(sX) * marginal(sY)

    ratio: observed_rate / expected_rate
    signal_band: classified per ENGINE COMPUTATION SCHEMA.md
    insufficient_data: true if expected_rate = 0 or any element is below MIN_ELEMENT_COUNT (see ENGINE COMPUTATION SCHEMA.md PATTERN RELIABILITY CONSTANTS)
    low_sample: true if pattern deposit_count is below MIN_PATTERN_DEPOSIT_COUNT

  Each pair result carries weight_breakdown and null_contribution.

  PATTERN_ID FORMAT for co-occurrence:
    'ecr_cooc_[sXX]_[sYY]'
    Example: 'ecr_cooc_s01_s05'
    Lower-numbered signal seed always first. Deterministic, stable.


COMPUTATION 2 — PRESENCE RATES

  Per signal: weighted frequency relative to total examined
  deposits. Which signals are active vs. dormant.

  For each signal sX:

    presence_rate:
      weighted count of deposits where sX is present
      ─────────────────────────────────────────────────
      total weighted examined deposits on page 05

    Each presence result carries weight_breakdown and
    null_contribution.

  PATTERN_ID FORMAT for presence:
    'ecr_pres_[sXX]'
    Example: 'ecr_pres_s01'


COMPUTATION 3 — SEQUENCE DETECTION

  Temporal ordering across deposits. Pairs and triples.
  All deposits on page 05, no windowing. Same mechanics as THR
  sequence detection.

  COMBINATORIAL SCALE
    342 possible pair sequences (19 * 18, order matters,
      no self-sequences)
    5,814 possible triple sequences (19 * 18 * 17)

    Engine only surfaces sequences that actually appear in data
    with recurrence >= 2. No pre-computation of all possible
    combinations. At current deposit volumes, actual sequence count
    will be a small fraction of the theoretical space.

  SEQUENCE WEIGHT — same asymmetric formula as THR:
    Pair:   weight(pos1) * weight(pos2)
    Triple: weight(pos1) * weight(pos2) * weight(pos3)

  RECURRENCE THRESHOLD
    Minimum 2 occurrences to surface. Calibration item.
    Due to the larger combinatorial space, an increase to
    minimum 3 may be warranted if noise is excessive at low
    deposit volumes. This is a calibration decision, not
    an architecture change.

  SEQUENCE RESULT carries same fields as THR:
    sequence elements, length, recurrence count, significance,
    observed_count, expected_count, ratio, signal_band,
    weight_breakdown, null_contribution, contributing_deposit_ids

  PATTERN_ID FORMAT for sequences:
    'ecr_seq_[sXX]_[sYY]' (pairs)
    'ecr_seq_[sXX]_[sYY]_[sZZ]' (triples)
    Example: 'ecr_seq_s01_s13'
    Order preserved in ID. Deterministic, stable.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUALIZE (Step 3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All ECR visualizations are SVG instruments rendered via LayerCake
+ D3 utilities. Rendering category: SVG instrument (see ENGINE
COMPUTATION SCHEMA.md VISUALIZATION ARCHITECTURE).

All visualizations render from computed results (engine result
object), never from raw deposit data.


VISUALIZATION 1 — CORRELATION MATRIX

  19 x 19 grid. Same design as THR co-occurrence matrix, scaled.
  Symmetric — 171 unique cells + 19 diagonal cells (self-presence
  rates from Computation 2).

  d3-zoom is essential for navigation at this density. Pan and
  zoom on the full matrix. Zoom into quadrants for detail work.

  Cell color: mapped from ratio via signal band. Same gradient
  as THR (d3-interpolate).

  Hover on any cell: full breakdown popup (same fields as THR).

  BLOCK STRUCTURE — SIGNAL FAMILIES

    If natural families exist among the 19 signals, the matrix
    uses block structure for readability — signals within the
    same family are adjacent in the matrix, with subtle visual
    separators between family blocks.

    Signal family groupings from the ECR domain file SIGNAL
    PROFILE layout:

      Family A: Recognition, Elevation, Trust, Consent
                (s01, s02, s03, s04)
      Family B: Memory/Recall, Grief, Voice, Sovereignty
                (s05, s06, s08, s09)
      Family C: Witnessing, Truth, Anchor, Recursion
                (s10, s11, s12, s13)
      Family D: Temporal Thresholds, Phase Lock, Echo
                (s14, s15, s16)
      Family E: Harmonic Gate, Signal Scrubbing, Release
                (s17, s18, s19)
      Family F: Dream
                (s07)

    These groupings are derived from the domain file layout.
    Whether they represent genuine analytical families or are
    formatting is a calibration question — the block structure
    makes intra-family and inter-family co-occurrence patterns
    immediately visible either way. Family assignments are
    reconfigurable without schema changes.


VISUALIZATION 2 — SIGNAL CONSTELLATION

  Force-directed layout (d3-force). Each signal = node (19 nodes).
  Edges = co-occurrence strength between signals.

  Node properties:
    Position determined by force simulation — strongly co-occurring
    signals cluster together, weakly related drift apart.
    Node size = presence rate (more frequently active signals are
    larger).
    Node color = dominant signal band among its co-occurrence
    pairs.

  Edge properties:
    Edge weight = co-occurrence ratio.
    Edge visibility threshold: only edges above mild band (ratio
    >= 1.0) rendered. Suppressed co-occurrences are not drawn as
    edges — their absence is the visual signal.
    Edge color = signal band of the co-occurrence.
    Edge thickness = ratio magnitude within band.

  STATEFUL ACROSS TIME — not just current positions but cluster
  drift history. When the engine recomputes and node positions
  shift, the previous positions are preserved in the constellation
  state. This allows:
    - Visual comparison between computation states
    - Drift detection — a signal migrating from one cluster to
      another over time
    - Stability detection — signals that hold position across
      many computations

  Constellation drift state is engine-level state (not per-snapshot
  — it accumulates across snapshots). Stored in the ECR
  snapshot_data under a constellation_state key that carries
  historical node positions indexed by snapshot_id.

  CONSTELLATION SNAPSHOTS capturable to LNV via Sage-triggered
  visualization snapshot (see ENGINE COMPUTATION SCHEMA.md
  VISUALIZATION SNAPSHOTS). Captures node positions, cluster
  groupings, drift vectors, and the force simulation state.
  The constellation's movement over time — not just a still frame
  — is what makes these captures valuable.


VISUALIZATION 3 — SEQUENCE VIEW

  Same structure as THR sequence view. Detected sequences listed
  with significance scores and recurrence counts. Table or card
  layout.

  FILTER: due to the larger combinatorial space (342 pair / 5,814
  triple possibilities), the sequence view filters to sequences
  above minimum recurrence count. Default: 2 (same as THR).
  If the surface is too noisy at scale, the threshold can be
  raised. Calibration item.

  Additional filter: significance floor. Sequences with
  significance below a configurable threshold are hidden from the
  default view (available via "show all" toggle). Calibration item.

  Sorted by: significance descending (default). Sortable by
  recurrence count or ratio.


VISUALIZATION 4 — PRESENCE TIMELINE

  Horizontal timeline. Each signal = one row. 19 rows total.
  Same design as THR presence timeline.

  X-axis: time (deposit created_at).
  Y-axis: signal rows (s01 at top through s19 at bottom).

  d3-zoom essential for this visualization due to 19 rows of
  potentially dense deposit data. Vertical zoom to focus on
  signal subsets. Horizontal zoom for time windows.

  Dot encoding same as THR: color = deposit_weight, opacity or
  outline = observation_presence.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEED (Step 4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Standard snapshot + MTM drift tracking per ENGINE COMPUTATION
SCHEMA.md.

Same feed mechanics as THR. Constellation drift state is included
in the snapshot_data so MTM can read cluster stability as part
of its cross-engine synthesis.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SNAPSHOT_DATA STRUCTURE (ECR-specific)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stored in engine_snapshots.snapshot_data (jsonb). This is the
ECR-specific content within the shared snapshot record.

  {
    "co_occurrences": [
      {
        "pattern_id": "ecr_cooc_s01_s02",
        "signal_a": "s01",
        "signal_b": "s02",
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
      // ... 171 pair entries
    ],

    "presences": [
      {
        "pattern_id": "ecr_pres_s01",
        "signal": "s01",
        "presence_rate": float,
        "deposit_count": integer,
        "weighted_count": float,
        "weight_breakdown": { "high": int, "standard": int, "low": int },
        "null_contribution": {
          "null_count": int, "null_weighted": float,
          "positive_count": int, "positive_weighted": float
        }
      }
      // ... 19 signal entries
    ],

    "sequences": [
      {
        "pattern_id": "ecr_seq_s01_s13",
        "elements": ["s01", "s13"],
        "length": 2,
        "recurrence_count": integer,
        "significance": float,
        "observed_count": float,
        "expected_count": float,
        "ratio": float,
        "signal_band": "suppressed" | "mild" | "strong" | null,
        "insufficient_data": boolean,
        "low_sample": boolean,
        "weight_breakdown": { "high": int, "standard": int, "low": int },
        "null_contribution": {
          "null_count": int, "null_weighted": float,
          "positive_count": int, "positive_weighted": float
        },
        "contributing_deposit_ids": [
          ["deposit_id_1", "deposit_id_2"],
          ["deposit_id_3", "deposit_id_4"]
        ]
      }
      // ... only sequences with recurrence >= threshold
    ],

    "constellation_state": {
      "current_positions": {
        "s01": { "x": float, "y": float },
        "s02": { "x": float, "y": float },
        // ... all 19 signals
        "s19": { "x": float, "y": float }
      },
      "position_history": [
        {
          "snapshot_id": string,
          "computed_at": timestamp,
          "positions": {
            "s01": { "x": float, "y": float },
            // ... all 19
          }
        }
        // ... one entry per prior snapshot
      ],
      "cluster_assignments": {
        "s01": "cluster_id",
        // ... per signal
      }
    }
  }


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERFORMANCE CONSIDERATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  171 pairs with full breakdowns is the most expensive Axis engine
  computation. The hybrid compute trigger (stale flag, compute
  once, cache) is what makes this tractable.

  AT CURRENT DEPOSIT VOLUMES

    Expected deposit count on page 05: tens to low hundreds.
    At this scale, 171 pair computations with full breakdowns
    complete in well under 1 second. Not a concern.

  AT SCALE (thousands of deposits)

    Computation time grows linearly with deposit count (each
    deposit checked against 19 signal seed presences). The
    combinatorial complexity (171 pairs) is fixed — it does not
    grow with deposits.

    If computation time becomes noticeable:
    - First optimization: cache per-signal deposit sets during
      indexing. Each signal's deposit list is built once, pairs
      computed from cached sets.
    - Second optimization: incremental computation. On new
      deposit, only update affected signals and their pairs
      instead of full recompute.

    Both optimizations are implementation decisions, not schema
    changes. The result object shape is identical regardless of
    how the computation is performed.

  CONSTELLATION POSITION HISTORY

    Position history accumulates across snapshots. At low volumes
    this is negligible. If the archive reaches thousands of
    snapshots, position history can be windowed (keep last N
    snapshots). Calibration item — not a current concern.

  ECR is the canary for engine performance.
  If ECR performs well, all other engines are fine (THR has 66
  pairs, INF has 6 pairs, STR and SNM are even smaller in
  combinatorial dimension).


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. SPARSE DATA — FEW DEPOSITS ON PAGE 05
     Same condition as THR failure mode 1, amplified by 19
     dimensions. With under 10 deposits, most of 171 pairs have
     zero observations.

     Guard: same as THR. deposit_count carried in every result.
     Visualizations render sparsity directly. No minimum deposit
     gate. The correlation matrix will be mostly insufficient_data
     cells — that is an honest representation of the data state.

  2. SIGNAL SEED ROUTING AMBIGUITY
     A tag is routed to a signal seed in TAG VOCABULARY.md, but
     the routing changes in a future vocabulary update. Historical
     deposits indexed under the old routing are not re-indexed.

     Guard: deposits carry their tag array at creation time. The
     engine indexes from the deposit's stored tags, not from the
     current vocabulary routing. A vocabulary update does not
     retroactively change what signals a deposit was indexed
     under. New deposits pick up new routing. Historical patterns
     reflect historical routing. This is correct behavior — the
     routing at deposit time was the analytical decision.

  3. CONSTELLATION FORCE SIMULATION NON-DETERMINISTIC
     d3-force simulations are non-deterministic — same inputs can
     produce slightly different node positions. Two identical
     computations may yield different constellation layouts.

     Guard: the constellation is a visual aid for cluster
     identification, not a precise measurement instrument. What
     matters is relative positioning (which signals cluster, which
     drift apart), not absolute coordinates. Drift detection
     compares cluster assignments and relative distances, not raw
     x/y values. Cluster assignments are deterministic from
     co-occurrence data even if visual positions vary.

  4. MULTIPLE TAGS SAME SEED ON ONE DEPOSIT
     A deposit carries three tags all routed to s01. Engine
     should register one s01 presence, not three.

     Guard: documented in INDEX step. Engine tracks seed-level
     presence. Multiple tags routed to the same seed count as one
     signal presence for that seed.

  5. SEQUENCE NOISE AT SCALE
     With 342 possible pair sequences, even random data produces
     recurring sequences at sufficient volume.

     Guard: baseline computation handles this — random sequences
     produce ratios near 1.0 (mild band). Genuinely structured
     sequences stand out above baseline. The recurrence threshold
     and significance floor filter provide additional noise
     reduction. Both are calibration items.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  | File | Role | Status |
  | --- | --- | --- |
  | backend/services/engine_ecr.py | ECR engine — extends engine_base. Co-occurrence (171 pairs), presence (19 signals), sequence computations. Constellation state management. Snapshot assembly. | NOT STARTED |
  | frontend/src/lib/components/EcrCorrelationMatrix.svelte | 19x19 correlation matrix — LayerCake + d3-interpolate + d3-zoom | NOT STARTED |
  | frontend/src/lib/components/EcrSignalConstellation.svelte | Force-directed signal constellation — LayerCake + d3-force, stateful drift tracking | NOT STARTED |
  | frontend/src/lib/components/EcrPresenceTimeline.svelte | Signal presence timeline — LayerCake + d3-scale + d3-zoom | NOT STARTED |
  | frontend/src/lib/components/EcrSequenceView.svelte | Sequence detection display with significance filter — table/card layout | NOT STARTED |
