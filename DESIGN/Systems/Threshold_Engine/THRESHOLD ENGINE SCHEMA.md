# THRESHOLD ENGINE SCHEMA

## /DESIGN/Systems/Threshold_Engine/THRESHOLD ENGINE SCHEMA.md

Mechanical spec — indexing, three computations, sequence detection,
visualizations, snapshot structure, failure modes. Shared architecture
in ENGINE COMPUTATION SCHEMA.md. This schema extends the shared
foundation with THR-specific logic.


OWNERSHIP BOUNDARIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  OWNS
    THR co-occurrence computation — 66 threshold pairs
    THR presence rate computation — 12 individual thresholds
    THR sequence detection — temporal pairs and triples
    THR pattern_id format and generation
    THR-specific visualizations — co-occurrence matrix, presence
      timeline, sequence view
    THR snapshot_data JSON structure
    THR-specific failure modes

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
    Threshold definitions (th01-th12) — owned by TAG VOCABULARY.md
    Page 02 manifest and domain identity — owned by
      DESIGN/Domains/02_Axis/Manifest_02_Threshold.txt


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. THR operates on page 02 (Thresholds). Reads deposits where
     'THR' is in the deposit's pages array.

  2. 12 categorical threshold states. Fixed set from TAG
     VOCABULARY.md:

       th01  Aetherroot Chord
       th02  Solenne Arc
       th03  Thren Alae Kai'Reth
       th04  Shai'mara Veil
       th05  Vireth's Anchor
       th06  Esh'Vala Breath
       th07  Orrin Wave
       th08  Lumora Thread
       th09  Hearth Song
       th10  Tahl'Veyra
       th11  Noirune Trai
       th12  StarWell Bloom

  3. Core query: "When th01 was active, what else was present?"
     The engine reads the field through co-presence, sequence, and
     frequency — not through counting how often a threshold was
     tagged, but through what the field reveals when it was.

  4. A deposit may carry zero, one, or multiple threshold tags.
     Zero threshold tags: deposit is indexed but contributes to no
     threshold-specific pattern. It still contributes to the total
     examined denominator in baseline calculations.

  5. phase_state on the deposit record is the ontological threshold
     state at observation time. It may differ from the threshold
     tags — phase_state is the field condition, tags are the
     analytical lens. Both are indexed. They are not redundant.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INDEX (Step 1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Deposit arrives on page 02. Engine reads:
    - phase_state (ontological threshold state, one of 12 or null)
    - tags (filtered to threshold tags: th01-th12)
    - deposit_weight
    - observation_presence
    - created_at (for temporal ordering in sequence detection)
    - id (for source tracing)

  Indexes by which threshold(s) are present in the deposit's tags.
  A deposit tagged [th01, th05] is indexed under both th01 and th05,
  and contributes to the th01+th05 co-occurrence pair.

  If phase_state names a threshold and that threshold is NOT in the
  tags array: the deposit is indexed under the phase_state threshold
  as well. phase_state is an independent signal — a deposit where
  the field was in th01 state but the tags reference th05 is
  analytically meaningful (the field condition and the observed
  content diverged).

  Stale flag set to true in SQLite engine_stale_flags after
  indexing. See ENGINE COMPUTATION SCHEMA.md HYBRID COMPUTE TRIGGER.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPUTE (Step 2) — THREE COMPUTATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All three computations use the shared baseline formula, deposit
weight multipliers, null observation handling, and signal
classification from ENGINE COMPUTATION SCHEMA.md.


COMPUTATION 1 — CO-OCCURRENCE RATES

  Every threshold pair: observed rate vs. expected rate (marginal
  product baseline).

  12 thresholds = 66 unique pairs (12 choose 2).

  Pair enumeration is exhaustive and deterministic:
    (th01, th02), (th01, th03), ... (th01, th12),
    (th02, th03), (th02, th04), ... (th02, th12),
    ...
    (th11, th12)

  For each pair (thX, thY):

    observed_rate:
      weighted count of deposits where BOTH thX AND thY are present
      ─────────────────────────────────────────────────────────────
      total weighted examined deposits on page 02

    expected_rate:
      marginal(thX) * marginal(thY)

      Where marginal(thX) = weighted count of thX present /
                             total weighted examined

    ratio: observed_rate / expected_rate
    signal_band: classified per ENGINE COMPUTATION SCHEMA.md
    insufficient_data: true if expected_rate = 0 or any threshold
      element is below MIN_ELEMENT_COUNT (see ENGINE COMPUTATION
      SCHEMA.md PATTERN RELIABILITY CONSTANTS)
    low_sample: true if pattern deposit_count is below
      MIN_PATTERN_DEPOSIT_COUNT — caveat flag, signal band still
      assigned (see ENGINE COMPUTATION SCHEMA.md)

  Each pair result carries the full shared breakdown:
    weight_breakdown (high, standard, low counts for deposits
      where both thresholds are present)
    null_contribution (null and positive counts and weighted sums
      for deposits examined for this pair)

  PATTERN_ID FORMAT for co-occurrence:
    'thr_cooc_[thX]_[thY]'
    Example: 'thr_cooc_th01_th05'
    Lower-numbered threshold always first. Deterministic, stable.


COMPUTATION 2 — PRESENCE RATES

  Per threshold: weighted frequency relative to total examined
  deposits. Which thresholds are active vs. dormant.

  For each threshold thX:

    presence_rate:
      weighted count of deposits where thX is present
      ─────────────────────────────────────────────────
      total weighted examined deposits on page 02

    This is the marginal rate — the same value used in baseline
    calculations. Surfaced independently because per-threshold
    activity is data in its own right.

    Each presence result carries weight_breakdown and
    null_contribution.

  PATTERN_ID FORMAT for presence:
    'thr_pres_[thX]'
    Example: 'thr_pres_th01'


COMPUTATION 3 — SEQUENCE DETECTION

  Temporal ordering across deposits. Recurring sequences — pairs
  and triples. All deposits on page 02, no windowing.

  WHAT A SEQUENCE IS

    An ordered series of threshold appearances across successive
    deposits, sorted by created_at. Deposit N carries thX, deposit
    N+1 carries thY — that is the pair sequence (thX → thY).
    Deposit N carries thX, N+1 carries thY, N+2 carries thZ —
    that is the triple sequence (thX → thY → thZ).

    Deposits with multiple threshold tags contribute to multiple
    sequences. A deposit tagged [th01, th05] followed by a deposit
    tagged [th09] produces sequences: (th01 → th09) and
    (th05 → th09).

    Order matters. (th01 → th05) is a different sequence than
    (th05 → th01).

  SEQUENCE WEIGHT — ASYMMETRIC, POSITION MATTERS

    Significance = product of deposit_weight values at each
    position in the sequence.

    Pair sequences:
      weight(pos1) * weight(pos2)

      high  → high  = 2.0 * 2.0 = 4.0   (strongest)
      std   → std   = 1.0 * 1.0 = 1.0   (baseline)
      low   → low   = 0.5 * 0.5 = 0.25  (weakest)
      high  → low   = 2.0 * 0.5 = 1.0   (asymmetric)
      low   → high  = 0.5 * 2.0 = 1.0   (same weight, different sequence)

    Triple sequences:
      weight(pos1) * weight(pos2) * weight(pos3)

    A high-weight initiation followed by high-weight completion is
    qualitatively different from a low sequence with identical
    elements. Asymmetry is preserved — the same thresholds in the
    same order with different weights produce different significance
    scores.

  SEQUENCE RATE AND BASELINE

    For each detected sequence:

      observed_count: how many times this exact ordered sequence
        appears in the deposit timeline (weighted by sequence
        significance)

      expected_count: marginal product of individual threshold
        frequencies at each position, applied to total sequential
        opportunities. "How often would this sequence appear if
        threshold ordering were random?"

      ratio: observed_count / expected_count
      signal_band: classified per ENGINE COMPUTATION SCHEMA.md
      insufficient_data: true if expected_count = 0 or any element
        is below MIN_ELEMENT_COUNT
      low_sample: true if pattern deposit_count is below
        MIN_PATTERN_DEPOSIT_COUNT

  RECURRENCE THRESHOLD

    Only sequences that appear at minimum 2 times in the deposit
    timeline are surfaced. Single occurrences are noise at this
    scale. The threshold of 2 is a calibration item.

  SEQUENCE RESULT carries:
    sequence elements (ordered threshold IDs)
    sequence length (2 or 3)
    recurrence count
    significance score (weighted)
    observed_count, expected_count, ratio, signal_band
    weight_breakdown, null_contribution
    contributing_deposit_ids (ordered list of deposit IDs that
      formed each occurrence)

  PATTERN_ID FORMAT for sequences:
    'thr_seq_[thX]_[thY]' (pairs)
    'thr_seq_[thX]_[thY]_[thZ]' (triples)
    Example: 'thr_seq_th01_th05'
    Example: 'thr_seq_th01_th05_th09'
    Order preserved in ID. Deterministic, stable.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUALIZE (Step 3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All THR visualizations are SVG instruments rendered via LayerCake
+ D3 utilities. Rendering category: SVG instrument (see ENGINE COMPUTATION SCHEMA.md VISUALIZATION ARCHITECTURE).

All visualizations render from computed results (engine result
object), never from raw deposit data.


VISUALIZATION 1 — CO-OCCURRENCE MATRIX

  12 x 12 grid. Symmetric — (th01, th05) and (th05, th01) are the
  same cell. 66 unique cells + 12 diagonal cells (self-presence
  rates from Computation 2).

  Cell color: mapped from ratio via signal band.
    suppressed  → cool color (pattern below baseline)
    mild        → neutral color (mildly elevated)
    strong      → warm color (strongly elevated)
    insufficient_data → distinct gray (no data to classify)

  Color interpolation: d3-interpolate for smooth gradient within
  bands. Not three flat colors — gradient shows magnitude within
  each band.

  Hover on any cell: full breakdown popup.
    Pair: thX + thY
    Observed rate, expected rate, ratio
    Signal band
    Deposit count, weighted count
    Weight breakdown (high / standard / low)
    Null contribution (null count / positive count)

  Diagonal cells: show presence rate for that threshold (from
  Computation 2). Hover shows per-threshold breakdown.

  Axis labels: threshold names (th01 Aetherroot Chord, etc.).
  Abbreviated on axis, full name on hover.


VISUALIZATION 2 — PRESENCE TIMELINE

  Horizontal timeline. Each threshold = one row. 12 rows total.

  X-axis: time (deposit created_at).
  Y-axis: threshold rows (th01 at top through th12 at bottom).

  Each deposit appears as a dot in every row where its threshold
  tags place it. Dot color = deposit_weight (visual differentiation
  of high / standard / low). Dot opacity or outline encodes
  observation_presence (positive = solid, null = hollow).

  Visual density shows activity. Clusters of dots in a threshold
  row reveal when that threshold was active. Gaps reveal dormancy.
  Cross-row alignment reveals simultaneous threshold activity.

  No d3-zoom required at this scale (12 rows). If deposit density
  becomes extreme, horizontal scroll with fixed row height.


VISUALIZATION 3 — SEQUENCE VIEW

  Detected sequences listed with significance scores and
  recurrence counts.

  Display: table or card layout. Each row = one detected sequence.
  Columns:
    Sequence (ordered threshold names, arrow notation: th01 → th05)
    Length (2 or 3)
    Recurrence count
    Significance (weighted)
    Ratio
    Signal band (color indicator)

  Sorted by: significance descending (default). Sortable by
  recurrence count or ratio.

  Visual representation of sequence paths (connecting lines
  between threshold positions) is a calibration item — not
  a future addition — the data structure supports it.

  Expand row: shows contributing deposit IDs and their timeline
  positions.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEED (Step 4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Standard snapshot + MTM drift tracking per ENGINE COMPUTATION
SCHEMA.md.

On computation completion:
  1. Engine result object assembled
  2. engine_snapshots record written to PostgreSQL with
     snapshot_data containing THR-specific structure (see below)
  3. Stale flag cleared in SQLite
  4. Results served to requester (page view, MTM pull, or
     batch close trigger)

Visualization snapshots: Sage-triggered capture per ENGINE COMPUTATION SCHEMA.md VISUALIZATION SNAPSHOTS. Co-occurrence
matrix state (cell values, hover data, color mapping) captured
as viz_data JSON.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SNAPSHOT_DATA STRUCTURE (THR-specific)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stored in engine_snapshots.snapshot_data (jsonb). This is the
THR-specific content within the shared snapshot record.

  {
    "co_occurrences": [
      {
        "pattern_id": "thr_cooc_th01_th02",
        "threshold_a": "th01",
        "threshold_b": "th02",
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
      // ... 66 pair entries
    ],

    "presences": [
      {
        "pattern_id": "thr_pres_th01",
        "threshold": "th01",
        "presence_rate": float,
        "deposit_count": integer,
        "weighted_count": float,
        "weight_breakdown": { "high": int, "standard": int, "low": int },
        "null_contribution": {
          "null_count": int, "null_weighted": float,
          "positive_count": int, "positive_weighted": float
        }
      }
      // ... 12 threshold entries
    ],

    "sequences": [
      {
        "pattern_id": "thr_seq_th01_th05",
        "elements": ["th01", "th05"],
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
      // ... only sequences with recurrence >= 2
    ]
  }


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. SPARSE DATA — FEW DEPOSITS ON PAGE 02
     With under 10 deposits, most co-occurrence pairs have zero
     observations. Expected rates are near-zero. Ratios are
     volatile or insufficient_data.

     Guard: deposit_count is carried in every result and snapshot.
     Visualizations render the data regardless — the researcher
     sees the sparsity directly. No minimum deposit threshold
     gates computation. The math is valid at any scale; the
     interpretation changes. Downstream tiers (Nexus, Cosmology)
     read deposit_count and adjust confidence accordingly.

  2. ALL DEPOSITS CARRY SAME THRESHOLD
     One threshold dominates. Marginal rate approaches 1.0 for
     that threshold. All pairs involving it have expected rates
     approaching marginal of the other threshold. Co-occurrence
     ratios collapse toward 1.0x (mild band) for the dominant
     threshold's pairs.

     Guard: this is correct behavior — the math surfaces that the
     dominant threshold is at baseline relative to everything else.
     Presence rate visualization makes the dominance immediately
     visible. Not a failure — a data condition the engine surfaces
     faithfully.

  3. SEQUENCE COMBINATORIAL VOLUME
     12 thresholds: 144 possible pair sequences (12 * 12, order
     matters), 1,728 possible triple sequences (12 * 12 * 12).
     Most will never appear in data.

     Guard: engine only surfaces sequences that actually appear
     with recurrence >= 2. No pre-computation of all possible
     combinations. At current deposit volumes, the actual sequence
     count will be a small fraction of the theoretical space.

  4. DEPOSITS WITH NO THRESHOLD TAGS
     A deposit on page 02 carries no threshold tags and
     phase_state is null.

     Guard: the deposit is indexed (it exists on the page) and
     contributes to the total examined denominator. It does not
     contribute to any threshold-specific numerator. This pushes
     all marginal rates down slightly — correct behavior. The
     deposit is not discarded or flagged.

  5. PHASE_STATE DIVERGES FROM TAGS
     Deposit's phase_state names th01 but tags contain only th05.
     The engine indexes under both th01 and th05.

     Guard: this is by design (see INDEX step). phase_state is
     the field condition at observation time. Tags are the
     analytical lens. Divergence is analytically meaningful —
     the engine surfaces it through co-occurrence patterns
     (th01 and th05 co-present in this deposit).


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  | File | Role | Status |
  | --- | --- | --- |
  | backend/services/engine_thr.py | THR engine — extends engine_base. Co-occurrence, presence, sequence computations. Snapshot assembly. | PLANNED |
  | frontend/src/lib/components/ThrCooccurrenceMatrix.svelte | 12x12 co-occurrence matrix — LayerCake + d3-interpolate | PLANNED |
  | frontend/src/lib/components/ThrPresenceTimeline.svelte | Threshold presence timeline — LayerCake + d3-scale | PLANNED |
  | frontend/src/lib/components/ThrSequenceView.svelte | Sequence detection display — table/card layout | PLANNED |
