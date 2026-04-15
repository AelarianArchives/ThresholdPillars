# ENGINE COMPUTATION SCHEMA

## /DESIGN/Systems/Engine_Computation/ENGINE COMPUTATION SCHEMA.md

Shared computation foundation for all 5 Axis engines (THR, STR, INF, ECR, SNM).
Defines the four-step contract, baseline math, deposit weight mechanics, null
observation flow, signal classification, compute trigger, state snapshots, and
shared result object. Individual engine schemas extend this — they do not
redefine it.


OWNERSHIP BOUNDARIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  OWNS
    Shared engine architecture — four-step contract all engines follow
    Deposit weight constants — defined once, all engines import
    Baseline computation formula — marginal probability product
    Three-band signal classification — architecture decision (classify, not filter)
    Null observation flow — two-counter mechanics
    Hybrid compute trigger — stale flag mechanics and recomputation rules
    Engine state snapshot schema — computation snapshot table shape
    Visualization snapshot schema — Sage-triggered capture table shape
    Engine result object — shared output structure
    Weight breakdown and null contribution sub-objects
    Duplicate detection contract — lens-contextual extension of INT hash check
    Visualization architecture — rendering category assignments and library list

  DOES NOT OWN
    Individual engine compute logic — owned by each engine schema
      (THR, STR, INF, ECR, SNM)
    Individual engine visualization design — owned by each engine schema
    Engine-specific tables — owned by each engine schema
    Ven'ai service — owned by VEN'AI SERVICE SCHEMA.md
    SNM Claude API integration — owned by SAT NAM ENGINE SCHEMA.md
    MTM synthesis — owned by METAMORPHOSIS SCHEMA.md
    Deposit record shape — owned by INTEGRATION DB SCHEMA.md
    Tag vocabulary and routing — owned by TAG VOCABULARY.md
    Embedding pipeline — owned by EMBEDDING PIPELINE SCHEMA.md
    Stale flag table definition — documented here, lives in
      OPERATIONAL DB SCHEMA.md (SQLite)
    engine_snapshots and visualization_snapshots table definitions —
      documented here, materialized in INTEGRATION DB SCHEMA.md (PostgreSQL)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHARED ENGINE ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Four-step contract. All 5 engines follow this sequence. The act of
indexing, computing, visualizing, and feeding is shared. The logic
within each step is engine-specific.

  STEP 1 — INDEX
    Deposit lands on an Axis page. The engine indexes the deposit
    through its specific lens.

    Shared behavior:
      - Engine reads the deposit from the deposits table (PostgreSQL)
      - Deposit fields consumed: id, content, tags, pages,
        observation_presence, deposit_weight, phase_state, created_at
      - Engine marks itself stale (see HYBRID COMPUTE TRIGGER)

    Engine-specific behavior:
      - Which tags or fields the engine reads as its lens
      - How the deposit is categorized within the engine's domain
      - THR reads phase_state and threshold tags
      - ECR reads signal tags
      - INF reads domain-related tags
      - STR reads root-cluster tags
      - SNM reads structural markers and tradition references

  STEP 2 — COMPUTE
    Pattern detection against indexed deposits. Every engine computes
    baselines alongside observed rates. Every engine respects
    deposit_weight and observation_presence.

    Shared behavior:
      - Baseline computation using marginal probability product
        (see BASELINE COMPUTATION)
      - Deposit weight applied as multiplier
        (see DEPOSIT WEIGHT CONSTANTS)
      - Null observations handled via two-counter system
        (see NULL OBSERVATION FLOW)
      - Three-band signal classification applied to results
        (see SIGNAL CLASSIFICATION)
      - Weight breakdown and null contribution carried in every
        pattern result

    Engine-specific behavior:
      - What patterns the engine looks for (co-occurrence, sequence,
        correlation, correspondence, emergence)
      - How many dimensions the computation covers
      - Whether external services are called (SNM calls Claude API,
        STR reads Ven'ai service)

  STEP 3 — VISUALIZE
    Engine outputs visualization from computed results, not raw
    deposits. This is what makes pages instruments, not filing
    cabinets.

    Shared behavior:
      - Visualization generated from engine result object, never
        from raw deposit data
      - Visualization snapshots auto-capture on significant signal
        delta, and are also Sage-triggerable on demand
      - Signal band determines visual weight — everything renders,
        visual weight does the filtering work

    Engine-specific behavior:
      - Visualization type (matrix, force-directed graph, density
        field, timeline, constellation — per engine schema)
      - Rendering category (see VISUALIZATION ARCHITECTURE)
      - Layout, interaction, and animation design

  STEP 4 — FEED
    Engine results available for MTM to pull at synthesis time.
    Engine does not push — MTM pulls.

    Shared behavior:
      - Engine state snapshot written to engine_snapshots table
        after every computation (see ENGINE STATE SNAPSHOTS)
      - mtm_read_at updated when MTM consumes the snapshot
      - MTM reads: current snapshot + previous snapshot + delta
      - Visualization snapshot written to LNV on significant signal
        delta or Sage-triggered capture (see VISUALIZATION SNAPSHOTS)

    Engine-specific behavior:
      - snapshot_data JSON structure varies per engine
      - What MTM extracts from the snapshot for synthesis


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPOSIT WEIGHT CONSTANTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Named constants defined once in backend config. All engines import
from the same source. Never hardcoded in engine logic.

  DEPOSIT_WEIGHT_HIGH     = 2.0
  DEPOSIT_WEIGHT_STANDARD = 1.0
  DEPOSIT_WEIGHT_LOW      = 0.5

Explicitly tunable. Ratios matter more than absolute
values — high counts double relative to standard, low counts half.

  BEHAVIOR BY TIER

  Axis (Tier 3):
    Multiplier on pattern contribution. A high-weight deposit
    contributes 2.0 to weighted counts in pattern rate calculations.
    A low-weight deposit contributes 0.5. Standard contributes 1.0.
    Affects observed_rate, expected_rate, and all derived values.

  Nexus (Tier 4):
    Affects grading confidence. A pattern built from high-weight
    deposits is graded with more confidence than the same pattern
    from low-weight fragments.

  Cosmology (Tier 5):
    Does not consume deposit_weight. Cosmology computations (FFT,
    Pearson, KS test, entropy, etc.) are statistical tests for
    scientific correspondence — the question is whether a pattern
    maps to an established scientific framework, not how significant
    the deposit is in the archive hierarchy. None of the 15 ARTIS
    computation implementations have a weight parameter. This entry
    was added in error during Tier 3 audit (session 48) as a general
    propagation without verification against ARTIS computation contracts.

  Resonance Engine (Tier 6):
    deposit_weight multiplier becomes tagWeight in the Resonance
    Engine node activity score formula:
      activityScore = Σ(tagWeight × e^(-ageDays / HALF_LIFE))
    A tag from a high-weight deposit contributes 2.0 × decay to
    the relevant node's activity. A tag from a low-weight deposit
    contributes 0.5 × decay. Applies to all node tiers that
    receive tag-driven weight growth (seeds, layers, pillars,
    origins). Threshold nodes are excluded — their weight is
    fixed and never updated by tag activity.
    The Resonance Engine separately owns its BASE_WEIGHT_[TIER]
    constants — the structural floor for each node tier. These
    are independent of deposit_weight. Both layers combine:
      totalWeight = baseWeight + clamp(activityScore, 0, MAX_ACTIVITY)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BASELINE COMPUTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every engine computes baselines using marginal probability product.
For any pattern the engine surfaces:

  OBSERVED RATE
    How often this pattern actually appears, weighted by
    deposit_weight. Computed as:

      sum of deposit_weight for deposits containing this pattern
      ─────────────────────────────────────────────────────────────
      sum of deposit_weight for all deposits examined

  EXPECTED RATE (BASELINE)
    Marginal product — frequency of each element independently,
    multiplied together. "How often would this pattern appear if
    deposits were random?"

    For a two-element pattern (A co-occurring with B):

      marginal_A = weighted count of A / total weighted examined
      marginal_B = weighted count of B / total weighted examined
      expected_rate = marginal_A * marginal_B

    For a three-element pattern (A + B + C):

      expected_rate = marginal_A * marginal_B * marginal_C

  RATIO
    observed_rate / expected_rate

    The signal measure. A ratio of 1.0 means the pattern occurs
    exactly as often as random chance predicts. Above 1.0 means
    the pattern is more common than chance. Below 1.0 means the
    pattern is suppressed — present, but less often than expected.

    Division by zero / low frequency guard: ratio is not computed
    when either of the following is true:
      (a) expected_rate is 0 — one or more elements has zero
          marginal frequency. Element has never been observed.
      (b) Any element's weighted occurrence count is below
          MIN_ELEMENT_COUNT — element is too rare to produce
          a meaningful ratio.
    In both cases the pattern is flagged insufficient_data: true.
    Not an error, not suppressed — statistically unreliable data.
    Pattern still renders distinctly.

  EXAMPLE (THR co-occurrence th01 + th05)
    th01 present in 30% of deposits (weighted)
    th05 present in 20% of deposits (weighted)
    Expected co-occurrence: 0.30 * 0.20 = 0.06 (6%)
    Observed co-occurrence: 25%
    Ratio: 0.25 / 0.06 = 4.2x above baseline — strong signal

  BASELINE SCOPE
    Page-scoped. Each engine computes from what its page
    holds. Every engine result carries baseline_scope: "page" and
    deposit_count so downstream tiers know what they are reading.

    Seam to archive-wide baselines named for Cosmology (Tier 5).
    A pattern flagged 2.0x above baseline means something different
    against 40 deposits vs. 4,000. The scope tag makes this
    explicit.

  HOW DEPOSIT WEIGHT ENTERS THE FORMULA
    Every count in the formula is weighted. A high-weight deposit
    adds 2.0 to the numerator and denominator where it appears.
    A standard deposit adds 1.0. A low deposit adds 0.5.

    This means:
    - High-weight deposits pull rates toward themselves
    - Low-weight deposits still contribute but with less influence
    - The formula is identical for all engines — only what
      constitutes a "pattern" differs per engine


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNAL CLASSIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Three-band classification applied to every pattern ratio.
Architecture decision (locked): engines classify signal strength,
they do NOT filter. Everything renders. Visual weight does the
filtering work — Sage sees the full spectrum, eye lands on what
matters first.

  BANDS

    suppressed  — ratio below 1.0x
                   Pattern present but below baseline. Occurs less
                   often than random chance predicts. Still renders.
                   Still data. Suppression patterns are analytically
                   significant — what ISN'T happening is signal.

    mild        — ratio 1.0x to 2.0x (inclusive of 1.0, exclusive of 2.0)
                   Pattern mildly elevated above baseline. Present
                   more than chance predicts, not yet strong.

    strong      — ratio 2.0x and above
                   Pattern strongly elevated above baseline. The
                   signal the researcher looks for first.

  Band thresholds (1.0 and 2.0) are calibration items. The
  decision to classify rather than filter is architecture — locked.
  The specific threshold values may be tuned with experience.

  Patterns with insufficient_data (expected_rate = 0 or element
  below MIN_ELEMENT_COUNT) do not receive a signal band. They are
  rendered distinctly as insufficient data, not classified into
  any band.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN RELIABILITY CONSTANTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Named calibration constants for pattern statistical reliability.
Defined in backend config alongside deposit weight constants.
Values are PLANNED — set at build and tuned with experience.

  MIN_PATTERN_DEPOSIT_COUNT   — calibration item
    Minimum deposit_count for a pattern to be considered
    statistically reliable. Patterns below this threshold are
    flagged low_sample: true. They still render and still receive
    a signal band — the flag is a caveat, not a filter.
    Rationale: with very few deposits on a page, ratios can look
    significant but reflect sample noise rather than real signal.
    Early-stage pages and low-activity engines will surface this
    flag frequently until deposits accumulate.

  MIN_ELEMENT_COUNT           — calibration item
    Minimum weighted occurrence count for an element to
    participate in co-occurrence calculations. Elements below
    this threshold — even if non-zero — are treated as
    insufficient_data. Rationale: a tag appearing in 1 out of
    300 deposits produces a near-zero marginal rate. When that
    rare element co-occurs once with another rare element, the
    ratio can reach 80x or higher — a number that looks like a
    strong signal but is based on a single observation.
    Extending insufficient_data to cover near-zero (not only
    zero) prevents these phantom ratios from surfacing as
    findings.

Both thresholds interact: a pattern can have sufficient element
frequency (above MIN_ELEMENT_COUNT) but still be low_sample if
the pattern itself has few contributing deposits. Both flags
travel independently in the pattern result.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NULL OBSERVATION FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Null observations ("I looked for X, it was not there") are active
data about absence. NOT "no data." Every engine handles nulls
identically at the mechanical level.

  FLOW

  1. Deposit carries observation_presence: null (tagger-detected,
     Sage-confirmed), routed to target page via tags and pages fields
  2. Engine indexes the deposit identically to positive
     observations — same step 1 (INDEX)
  3. At compute (step 2): null increments times_examined WITHOUT
     incrementing times_observed. Positive observations increment
     both counters.
  4. Rate = times_observed / times_examined (not total deposits)
  5. null_contribution travels in every pattern result

  TWO COUNTERS PER PATTERN ELEMENT

    times_observed  — weighted count of deposits where this
                      element is present (observation_presence:
                      positive or null for observation_presence
                      field)
                      Only positive observations increment this.

    times_examined  — weighted count of deposits that COULD have
                      contained this element. Includes both
                      positive and null observations.

    The distinction: times_observed / times_examined gives the
    rate of actual presence among all occasions where the
    researcher was looking. Without the null counter, the
    denominator only includes cases where the element was found —
    confirmation bias by construction.

  NULL TARGETING

    Tags carry the null target — what was examined. A null
    observation tagged th01 means "th01 was examined, result:
    absent."

    For complex absences ("expected th01 AND th05 together, only
    saw th01"), the deposit's notes field captures the specific
    absence context. The engine indexes what the tags declare.

  HOW NULLS SHARPEN BASELINES

    A null for th01 increases total examined count without
    increasing th01 presence count. This pushes th01's marginal
    rate down. When genuine co-occurrences do appear, they stand
    out more against the adjusted baseline. Nulls make the math
    more honest.

  NULL CONTRIBUTION IN RESULTS

    Every pattern result carries:

      null_contribution:
        null_count:      integer  — how many null observations
                                    touched this pattern
        null_weighted:   float    — weighted sum of null
                                    observation deposit_weights
        positive_count:  integer  — how many positive observations
                                    touched this pattern
        positive_weighted: float  — weighted sum of positive
                                    observation deposit_weights

    Downstream tiers (Nexus, Cosmology) can distinguish
    null-sourced patterns from positive-sourced without
    special-case logic. A pattern with high null_count and low
    positive_count reads differently than one with zero nulls.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HYBRID COMPUTE TRIGGER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Debounced hybrid. On deposit, engine marks itself stale.
Recomputation happens on demand, not on every deposit.

  STALE FLAG

    One row per engine in SQLite operational DB. stale stored as
    integer (0|1) — SQLite has no native boolean type.
    Table: engine_stale_flags (see OPERATIONAL DB SCHEMA.md)
    5 rows, one per engine: thr, str, inf, ecr, snm.
    Default: true (stale on first load — forces initial compute).

    Set to true: when a deposit lands on the engine's page
    Set to false: when engine recomputation completes

  THREE RECOMPUTATION TRIGGERS

    1. PAGE VIEW — when the page is next viewed after being
       marked stale. Stale flag triggers recompute, results
       cached, flag cleared. User sees fresh results.

    2. BATCH WINDOW CLOSE — after batch review completes and
       all batch deposits have landed. One recompute for the
       entire batch, not one per deposit.

    3. MTM PULL — when MTM requests engine output for synthesis.
       Stale engines refresh before delivering snapshot to MTM.
       MTM always reads fresh data.

  BATCH OPTIMIZATION

    During batch review (30+ deposits potentially landing in
    sequence), the engine does not thrash 30 times. Flags stale
    on first deposit, stays stale until someone needs the results.
    This is the primary purpose of the stale flag — prevent
    redundant computation during high-volume intake.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENGINE STATE SNAPSHOTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every engine computation produces a timestamped snapshot. These
are PostgreSQL records — engine computation results have research
value and must survive session boundaries.

  TABLE: engine_snapshots (PostgreSQL)

    snapshot_id     — text, primary key
                      Format: '[engine]_snap_[timestamp]_[rand]'

    engine          — text, not null
                      enum: 'thr' | 'str' | 'inf' | 'ecr' | 'snm'

    computed_at     — timestamp, not null
                      When this computation completed.

    deposit_count   — integer, not null
                      How many deposits were in scope for this
                      computation. Downstream tiers need this to
                      assess statistical significance.

    baseline_scope  — text, not null
                      Always 'page'. Carried explicitly so
                      downstream tiers know what the baseline was
                      computed against. Seam to archive-wide scope
                      for Cosmology (Tier 5).

    snapshot_data   — jsonb, not null
                      Engine-specific computed results. Structure
                      varies per engine — defined in each engine
                      schema. Contains the full engine result
                      object minus the snapshot metadata fields
                      (which live on the snapshot record itself).

    mtm_read_at     — timestamp, nullable
                      Written when MTM consumes this snapshot
                      during synthesis. Null until consumed.

    created_at      — timestamp, not null
                      Written once at record creation.

  MTM DRIFT TRACKING

    mtm_read_at marks when MTM consumed this snapshot. On next
    synthesis, MTM queries for:
    - Most recent snapshot (current state)
    - Most recent snapshot where mtm_read_at IS NOT null
      (previous state MTM saw)
    - Delta between the two

    Three things this gives MTM:
      "What's new"    — patterns that appeared since last synthesis
      "What shifted"  — rates that changed direction or magnitude
      "What's stable" — patterns that held steady (also signal)

  RETENTION

    Keep all snapshots. Storage is trivial for summary
    data. Longitudinal computational history is what this research
    needs. No pruning, no archival policy.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUALIZATION SNAPSHOTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Captures of engine visualization state. Two triggers: (1) automatic
on significant signal delta — new strong pattern, band change, or new
pattern type detected by engine_base.py comparing computation result
to most recent engine_snapshot; (2) Sage-triggered on demand. Routes
to LNV (47) with optional note. Distinct from computation snapshots
(which are automatic and feed MTM).

  TABLE: visualization_snapshots (PostgreSQL)

    viz_snapshot_id     — text, primary key
                          Format: '[engine]_viz_[timestamp]_[rand]'

    engine              — text, not null
                          enum: 'thr' | 'str' | 'inf' | 'ecr' | 'snm'

    engine_snapshot_id  — text, not null
                          References engine_snapshots.snapshot_id.
                          Links this visual capture to the computation
                          state it was generated from. The numbers
                          behind what Sage saw.

    trigger_source      — enum: 'auto' | 'sage', not null
                          How this capture was initiated. 'auto':
                          engine_base.py detected a significant signal
                          delta and fired the capture. 'sage': Sage
                          triggered manually. LNV uses this to
                          distinguish system-flagged moments from
                          researcher-flagged moments.

    viz_data            — jsonb, not null
                          The rendered state — node positions, cluster
                          groupings, drift vectors, layout state.
                          Structure varies per engine visualization.

    note                — text, nullable
                          Optional note on this capture. For
                          trigger_source 'sage': Sage's note at
                          capture time — why this moment was worth
                          preserving. For trigger_source 'auto': null
                          by default; Sage can annotate after the fact
                          if she wants to record what the system caught.

    lnv_routed          — boolean, not null, default false
                          Set true when successfully routed to LNV.
                          Routing contract defined in Tier 4 (LNV
                          receive contract).

    captured_at         — timestamp, not null
                          When the capture was created.

    created_at          — timestamp, not null
                          Written once at record creation.

  Applies to all 5 engines. ECR constellation and STR cluster map
  make this most obvious, but any engine visualization is
  capturable.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENGINE RESULT OBJECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Shared output structure produced by every engine computation.
Engine-specific schemas extend the patterns array with additional
fields where needed but never remove or rename shared fields.

  engine_result:
    engine:          'thr' | 'str' | 'inf' | 'ecr' | 'snm'
    computed_at:     timestamp
    baseline_scope:  'page'
    deposit_count:   integer
    stale:           false
    stale_warning:   boolean

    patterns: [
      {
        pattern_id:      string
        description:     string
        observed_rate:   float
        expected_rate:   float
        ratio:           float
        signal_band:     'suppressed' | 'mild' | 'strong'
                          — null if insufficient_data
        insufficient_data: boolean
        low_sample:      boolean
        deposit_count:   integer
        weighted_count:  float

        weight_breakdown:
          high:          integer
          standard:      integer
          low:           integer

        null_contribution:
          null_count:      integer
          null_weighted:   float
          positive_count:  integer
          positive_weighted: float
      }
    ]

    snapshot_id:     string
    mtm_read_at:     timestamp | null

  FIELD NOTES

    stale: always false in the result object — if the engine
    just computed, it is not stale. The stale flag lives in
    SQLite and is checked BEFORE computation, not carried in
    results.

    stale_warning: normally false. Set true only when the engine
    attempted recomputation but failed, and is returning the most
    recent existing snapshot instead of fresh results. MTM receives
    this flag, logs it, and proceeds with synthesis — synthesis is
    not blocked by a stale_warning, only by a read failure.

    insufficient_data: true when expected_rate cannot be
    computed reliably. Two triggers:
      (a) An element has zero marginal frequency — ratio
          is mathematically undefined.
      (b) An element's weighted occurrence count is below
          MIN_ELEMENT_COUNT — ratio would be computed but
          is statistically meaningless (phantom ratios from
          rare element co-occurrence).
    Pattern still appears in the array — rendered distinctly,
    not hidden. No signal band assigned.

    low_sample: true when the pattern's deposit_count is
    below MIN_PATTERN_DEPOSIT_COUNT. The ratio and signal
    band are still computed and assigned — low_sample is a
    caveat, not a disqualifier. Rendered with a visual
    distinction so early-stage pages don't mislead. MTM
    can note the flag when synthesizing from low-sample
    patterns. Nexus and Cosmology read it for grading
    confidence and sample weighting respectively.

    pattern_id: engine-specific identifier. Format defined in
    each engine schema. Must be deterministic and stable across
    computations — the same pattern produces the same id
    regardless of when it is computed.

    description: human-readable label for the pattern. Generated
    by the engine. Used in visualization hover states and MTM
    payload.

    snapshot_id: links this result to the engine_snapshots record
    written during the Feed step (Step 4 of the four-step contract).
    Not present during Step 3 (Visualize) — visualization renders
    from the patterns array only and does not require this field.
    Available when MTM reads the result after Feed completes.

    mtm_read_at: null until MTM consumes this result during
    synthesis. Written once by MTM at the point it reads the
    snapshot. Used by MTM to determine delta — the most recent
    snapshot where mtm_read_at IS NOT null is the last state MTM
    saw. The gap between that snapshot and the current one is what
    MTM synthesizes from.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WEIGHT BREAKDOWN AND NULL CONTRIBUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every pattern result carries two sub-objects that give downstream
tiers full visibility into what composed the pattern.

  WEIGHT BREAKDOWN

    weight_breakdown:
      high:      integer  — count of high-weight deposits in pattern
      standard:  integer  — count of standard-weight deposits
      low:       integer  — count of low-weight deposits

    Sum of high + standard + low = total deposit count for pattern.
    Nexus reads this to assess grading confidence. Cosmology reads
    this for sample weighting.

  NULL CONTRIBUTION

    null_contribution:
      null_count:        integer  — null observations in pattern
      null_weighted:     float    — weighted sum of null deposit_weights
      positive_count:    integer  — positive observations in pattern
      positive_weighted: float    — weighted sum of positive deposit_weights

    Sum of null_count + positive_count = total observations examined
    for this pattern. The ratio of null to positive indicates how much
    absence data shaped the rate.

  NULL FLAG IN WEIGHT METADATA

    Engine computation results carry null_contribution alongside
    weight_breakdown. Nexus and Cosmology can distinguish
    null-sourced patterns from positive-sourced without special-case
    logic. A pattern built primarily from null observations reads
    as "we looked many times and it was not there" — which is
    a different claim than "we have not looked."


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DUPLICATE DETECTION IN ENGINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When engines index deposits, identical entries surface naturally.
Extends INT-level hash check (content_hash on deposits table) with
lens-contextual awareness.

  INT-LEVEL: content_hash (SHA-256) on the deposits table flags
  exact content duplicates at intake. Warns, does not block.

  ENGINE-LEVEL: engines index deposits through their lens. Two
  deposits with identical content but different tags route to
  different patterns. Two deposits with different content but
  identical tag profiles may contribute to the same pattern. The
  engine does not deduplicate deposits — it computes from what
  exists. If duplicate deposits inflate a pattern rate, the
  content_hash warning from INT is the researcher's signal to
  investigate.

  Ven'ai name deduplication is handled separately by the Ven'ai
  service (see VEN'AI SERVICE SCHEMA.md). STR engine reads the
  service's output (venai_correlations) — it does not re-implement
  name normalization.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUALIZATION ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Three rendering categories. Rendering approach follows
visualization purpose. 3D is not an upgrade from 2D — different
tool for different job.

  | Category         | Stack                         | Purpose                                          |
  |------------------|-------------------------------|--------------------------------------------------|
  | SVG instrument   | LayerCake + D3 utilities      | Engine data viz (Axis, Nexus, Cosmology)         |
  | Canvas instrument| Raw canvas + Svelte lifecycle | Resonance Engine (2D force-directed, 62 nodes)   |
  | WebGL spatial    | Threlte + Three.js            | Node Spiral, embedding constellation (3D)        |

  EXPLICIT BOUNDARY: 2D instrument visualizations live in
  LayerCake. 3D spatial/semantic visualizations live in Threlte.
  They do not share a rendering approach. A component is one or
  the other, never both.

  RESONANCE ENGINE PLACEMENT: lives on Observatory as embedded
  component (visual heartbeat, not full-size). Dedicated page
  accessible from Observatory for the full experience. Not orphaned.

  2D ENGINE INSTRUMENTS (LayerCake + D3 utilities)

    layercake       — Svelte-native layout, scales, responsive containers
    d3-scale        — quantitative/ordinal scales
    d3-shape        — line/arc generators
    d3-force        — force-directed layouts (STR cluster map, SNM correspondence graph, ECR signal constellation)
    d3-hierarchy    — tree/cluster structures (STR root clusters)
    d3-interpolate  — color/value interpolation for signal gradient bands
    d3-zoom         — pan/zoom on dense matrices and cluster graphs
    d3-contour      — density field contour generation (INF domain map)
    Svelte native motion (svelte/motion, svelte/transition,
                      svelte/animate) — animation primitives,
                      no install required

  3D SPATIAL/SEMANTIC (Threlte + Three.js)

    @threlte/core   — Three.js with native Svelte bindings
    three           — 3D rendering
    postprocessing  — bloom, depth-of-field (node glow)
    umap-js         — 768-dim embeddings to 2D/3D for constellation
    regl            — WebGL particle rendering at scale
    simplex-noise   — organic movement for spirals/constellations
    Custom GLSL shaders — glow and drift effects

  HARMONIC AUDIO

    WebAudio API    — native, no install. Audio context, clip
                      loading and playback, spatial panning,
                      waveform analysis via AnalyserNode.
                      Audio system uses pre-recorded .wav clips
                      per node — not synthesis.

  ANIMATION (cross-cutting)

    GSAP            — advanced animation control where
                      svelte-motion is not sufficient


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. STALE FLAG STUCK TRUE
     Engine marked stale but recomputation never triggers (page
     never viewed, no MTM pull, no batch close).

     Guard: stale is a valid resting state. The engine simply has
     not been asked for results. When it is asked, it recomputes.
     No timeout. No forced recompute. Staleness is not a failure —
     it is deferred computation.

  2. STALE FLAG STUCK FALSE AFTER DEPOSIT
     Deposit lands but stale flag is not set. Engine serves
     outdated results on next view.

     Guard: stale flag write is part of the deposit creation
     pipeline in the FastAPI service layer. If the flag write
     fails, the deposit creation still succeeds (the archive
     record is more important). The failure is logged. The
     engine serves stale results until the next deposit sets
     the flag. Not silent — logged, but not blocking.

  3. SNAPSHOT WRITE FAILURE
     Engine computation completes but snapshot cannot be written
     to PostgreSQL.

     Guard: computation results are held in memory after compute.
     If snapshot write fails: log the failure, serve the computed
     results to the current viewer (they are in memory), and set
     stale flag back to true so the next trigger recomputes and
     reattempts the write. Results are not lost — they are served
     once and recomputed on next access.

  4. MTM READS STALE DATA
     MTM pulls engine output but the stale flag refresh fails.
     MTM synthesizes from outdated snapshots.

     Guard: MTM pull trigger checks stale flag first. If stale,
     engine recomputes before delivering. If recomputation fails,
     the engine returns the most recent existing snapshot with
     stale_warning: true in the engine_result object. MTM logs
     the warning and proceeds — synthesis is not blocked by a
     stale warning. The caveat is recorded in the synthesis result.
     This is preferable to blocking synthesis entirely.

  5. WEIGHT CONSTANT MISMATCH
     Deposit_weight constants are defined in one place but an
     engine uses a hardcoded value instead of importing.

     Guard: constants are defined once in backend config. All
     engines import from that source. Code review and test
     coverage verify that no engine hardcodes weight values.
     A test asserts all five engines resolve the same constants.

  6. DIVISION BY ZERO IN BASELINE
     Expected rate is zero because an element has zero marginal
     frequency.

     Guard: documented in BASELINE COMPUTATION section. Pattern
     flagged as insufficient_data. Ratio not computed. Pattern
     still included in results with insufficient_data: true.
     Signal band is null. Rendered distinctly in visualization.

  7. VISUALIZATION SNAPSHOT ORPHANED
     Sage captures a visualization snapshot but the linked
     engine_snapshot_id no longer exists (should not happen
     given retention policy, but defensive).

     Guard: engine_snapshot_id is a required field on
     visualization_snapshots. The snapshot record references
     a computation snapshot that exists at capture time.
     The retention policy is to keep all snapshots, so orphaning
     requires a manual deletion. If encountered: the
     visualization snapshot is still valid as a visual record.
     The computation context is missing. Flag to researcher.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  | File | Role | Status |
  | --- | --- | --- |
  | backend/config.py | DEPOSIT_WEIGHT_HIGH, DEPOSIT_WEIGHT_STANDARD, DEPOSIT_WEIGHT_LOW constants | NOT STARTED (constants not yet added to existing LIVE file) |
  | backend/services/engine_base.py | Shared engine computation: baseline math, weight application, null handling, signal classification, snapshot write, stale flag check | NOT STARTED |
  | backend/services/engine_thr.py | THR engine — extends engine_base | NOT STARTED |
  | backend/services/engine_ecr.py | ECR engine — extends engine_base | NOT STARTED |
  | backend/services/engine_inf.py | INF engine — extends engine_base | NOT STARTED |
  | backend/services/engine_str.py | STR engine — extends engine_base, reads Ven'ai service | NOT STARTED |
  | backend/services/engine_snm.py | SNM engine — extends engine_base, calls Claude API | NOT STARTED |
  | backend/routes/engines.py | FastAPI engine endpoints — compute trigger, result read, snapshot capture | NOT STARTED |
