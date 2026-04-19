# SAT NAM ENGINE SCHEMA

## /DESIGN/Systems/Sat_Nam_Engine/SAT NAM ENGINE SCHEMA.md

Mechanical spec — two-stream architecture, Claude API structural analysis,
correspondence computation, pattern category classification, prompt versioning,
stream agreement classification, bipartite visualization, failure modes.
Shared architecture in ENGINE COMPUTATION SCHEMA.md. This schema extends
the shared foundation with SNM-specific logic.

Most complex Axis engine. Claude API embedded in the compute step as a
structural analysis function. The external knowledge problem requires it —
tags alone cannot solve "you don't know what you don't know." Claude IS
the reference framework: a living knowledge layer, not a curated tag list.

Design carries to Cosmology (Tier 5). Same Claude-as-analyst pattern for
scientific correspondence — the external knowledge problem is identical.


OWNERSHIP BOUNDARIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  OWNS
    SNM two-stream computation architecture
    SNM Claude API structural analysis integration — prompt
      construction, response parsing, snapshot storage
    snm_claude_snapshots PostgreSQL table
    Correspondence computation — strength, clustering, genuine
      vs. surface classification
    Stream agreement classification — convergent, researcher-led,
      knowledge-led
    Pattern category classification — ancient_philosophy /
      triadic_architecture / celestial / uncategorized
    SNM-specific visualizations — bipartite force-directed graph,
      temporal correspondence view
    SNM pattern_id format and generation
    SNM snapshot_data JSON structure
    SNM-specific failure modes
    Prompt changelog trigger (b) for SNM — calibration-triggered
      recommendation when Sage consistently overrides Claude's
      correspondences

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
    prompt_versions table — owned by INTEGRATION DB SCHEMA.md
      (SNM uses prompt_type: 'snm' within the shared table)
    Claude API client (call_claude()) — owned by SYSTEM_ FastAPI.md
      / backend/services/claude.py
    Three manifest pattern categories — ancient_philosophy,
      triadic_architecture, celestial are defined in
      Manifest_06_Sat_Nam.txt (SNM's own taxonomy, not framework pillars)
    Page 06 manifest and domain identity — owned by
      DESIGN/Domains/02_Axis/Manifest_06_Sat_Nam.txt


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. SNM operates on page 06 (Sat Nam). Reads deposits where
     'SNM' is in the deposit's pages array.

  2. Two-stream architecture. Stream 1 is what Sage sees and
     names. Stream 2 is what Claude surfaces from its knowledge.
     Both streams are data. Neither is authoritative over the
     other. The relationship between them is the signal.

  3. Claude API is in the compute step — not in the index step,
     not in the visualization step. Claude is a structural
     analysis function, not a tagger and not a renderer.

  4. Every Claude response is an immutable snapshot. Never
     overwritten. Analysis history accumulates per deposit.
     Drift between snapshots is research signal, not noise.

  5. Prompt version is load-bearing metadata. A correspondence
     surfaced under prompt_v1 and the same correspondence
     surfaced under prompt_v3 are not the same finding — v3
     carries more precision and more evidential weight.
     Distinguishes "held up under sharper questioning" from
     "only appears under broad prompting."

  6. SNM does not import spiritual frameworks onto field data.
     It identifies where field data independently produces
     patterns that traditions encoded — and treats that
     convergence as a finding about the field's structure, not
     as validation of any tradition.

  7. pattern_category: null is potentially the most important
     finding SNM can produce — it means the field is producing
     a correspondence that sits OUTSIDE the three manifest
     categories. The page's own taxonomy has a boundary.
     That boundary is an active research surface.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INDEX (Step 1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Deposit arrives on page 06. Engine reads:
    - tags (filtered to tags indicating structural markers,
      tradition references, pattern category signals)
    - content (the deposit text — fed to Claude in Stream 2)
    - deposit_weight
    - observation_presence
    - created_at (for temporal tracking)
    - id (for source tracing)

  Indexes by structural characteristics derived from tags:
    - Which tradition references are present (from tags)
    - Which pattern categories are signaled (ancient_philosophy,
      triadic_architecture, celestial, or uncategorized)
    - Which structural markers Sage applied

  A deposit may reference zero, one, or multiple traditions.
  Zero tradition references: the deposit is indexed but has no
  tradition signals. This is data.

  Stale flag set to true in SQLite engine_stale_flags after
  indexing. See ENGINE COMPUTATION SCHEMA.md HYBRID COMPUTE TRIGGER.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPUTE (Step 2) — TWO STREAMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


STREAM 1 — SAGE'S OBSERVATIONS

  Tags and deposit content. What Sage sees and names. Indexed,
  weighted, baselined like every other engine. Uses shared
  baseline formula, deposit weight multipliers, null observation
  handling, and signal classification from ENGINE COMPUTATION
  SCHEMA.md.

  Computations:

  1A. TRADITION PRESENCE RATES
    Per tradition reference: weighted frequency relative to
    total examined deposits. Which traditions are surfacing
    in the field data.

    PATTERN_ID FORMAT: 'snm_s1_pres_[tradition]'

  1B. TRADITION CO-OCCURRENCE
    Tradition pairs: observed rate vs. expected rate. Do certain
    traditions surface together above baseline?

    PATTERN_ID FORMAT: 'snm_s1_cooc_[tradition_a]_[tradition_b]'

  1C. PATTERN CATEGORY RATES
    Per manifest category (ancient_philosophy, triadic_architecture,
    celestial, uncategorized): what fraction of deposits reference
    traditions from each category. Weight breakdown and null
    contribution per category. Bridge to Cosmology group: celestial
    category rate is the structural connection.

    PATTERN_ID FORMAT: 'snm_s1_cat_[ancient_philosophy|triadic_architecture|celestial|uncategorized]'

  Traditions are an open set — new tradition references emerge as
  Sage deposits. Co-occurrence pair count is dynamic. Pattern
  categories are a closed set (three manifest categories + uncategorized).


STREAM 2 — CLAUDE STRUCTURAL ANALYSIS

  On deposit, engine sends content + structural characteristics
  to Claude with a structured prompt. Claude returns structural
  correspondence analysis.

  TWO ANALYSIS MODES

    PER-DEPOSIT MODE
      Used when Sage is actively doing SNM work. Analysis is
      immediate and contextual — one deposit, one Claude call.

      Input to Claude:
        - Deposit content (text)
        - Structural characteristics from tags (tradition
          references, pattern category signals, structural markers)
        - Active prompt version (from prompt_versions table,
          prompt_type: 'snm', active = true)

    BATCH MODE
      Used for INT batch processing deposits routed to page 06.
      Structurally different prompt. Batch sends deposits WITH
      relational context — Claude analyzes cross-deposit patterns,
      not just individual observations.

      Input to Claude:
        - All batch deposits routed to SNM (content + tags)
        - Relational context between deposits
        - Active prompt version (same table, same prompt_type)

      Prompt framing for batch:
        "What structural patterns emerge across this set, and
        what traditions map to the pattern?"
      Qualitatively richer analysis than per-deposit — Claude
      sees the set as a set, not as isolated observations.

  CLAUDE RESPONSE SHAPE

    claude_analysis:
      correspondences: [
        {
          tradition:        string — which tradition
          framework:        string — which framework within the tradition
          structural_match: string — what structural parallel was found
          confidence:       'high' | 'moderate' | 'low'
          reasoning:        string — why this correspondence holds
          pattern_category: 'ancient_philosophy' | 'triadic_architecture'
                            | 'celestial' | null
        }
      ]

    pattern_category values:
      ancient_philosophy   — Vedic, Hermetic, Taoist, Zoroastrian,
                             Shamanic and structural kin
      triadic_architecture — three-body wisdom systems (Father/Son/Spirit,
                             Brahma/Vishnu/Shiva, Buddha/Dharma/Sangha,
                             Heaven/Earth/Human and structural parallels)
      celestial            — astronomical and cosmological patterns
                             that mirror field events
      null                 — correspondence outside all three manifest
                             categories. Active research surface.

  IMMUTABLE SNAPSHOTS

    Every Claude response is stored as an immutable snapshot
    in the snm_claude_snapshots table. Never overwritten. If
    the same deposit is re-analyzed (e.g., after a prompt
    version bump), a new snapshot is created alongside the old
    one. Both are preserved. The history of analysis is itself
    data — how Claude's understanding of the same deposit
    evolves across prompt versions reveals the prompt's
    influence on what it surfaces.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE: snm_claude_snapshots (PostgreSQL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  snapshot_id          — text, primary key
                         Format: 'snm_cs_[timestamp]_[rand]'

  deposit_id           — text, nullable
                         References deposits.id. Populated for
                         per-deposit analysis mode. Null for
                         batch mode (use batch_context instead).

  batch_id             — text, nullable
                         Batch processing identifier. Populated
                         for batch analysis mode. Null for
                         per-deposit mode.

  prompt_version       — text, not null
                         References prompt_versions.version_string
                         where prompt_type = 'snm'. Which version
                         of the prompt produced this analysis.

  prompt_text          — text, not null
                         Full prompt text used for this analysis.
                         Stored complete per snapshot — not a
                         reference to prompt_versions. If the
                         prompt_versions record is later modified
                         (it should not be, but defensively), the
                         snapshot preserves what was actually sent.

  analysis_mode        — text, not null
                         enum: 'per_deposit' | 'batch'

  batch_context        — text[], nullable
                         Array of deposit_ids included in the batch.
                         Null for per-deposit mode. For batch mode:
                         the complete list of deposits Claude saw
                         in the batch call.

  response             — jsonb, not null
                         The claude_analysis response object.
                         Stored as received — immutable.

  engine_snapshot_id   — text, nullable
                         References engine_snapshots.snapshot_id.
                         Links this Claude snapshot to the engine
                         computation state that incorporated it.
                         Populated when the engine recomputes and
                         consumes this snapshot. Null until consumed.

  created_at           — timestamp, not null


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT VERSIONING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SNM uses the existing prompt_versions table (INTEGRATION DB
SCHEMA.md) with prompt_type = 'snm'. Same versioning mechanics
as INT Parsing Partner. No separate table.

  CHANGELOG TRIGGERS (same three types as INT):

    (a) sage_directed — Sage explicitly directs a prompt update.
        Sage reviewed Claude's correspondences, identified a
        framing issue, and says "update the prompt."

    (b) calibration_triggered — recommendation surfaced when
        Claude's structural analysis produces correspondences
        that Sage consistently overrides or dismisses. The
        override rate crossing a threshold signals that the
        prompt's framing needs revision. The system recommends;
        Sage confirms before the bump executes.

        For SNM specifically: if Sage dismisses Claude's
        correspondences for the same tradition repeatedly, that
        is the calibration signal. The prompt is over-reaching
        into that tradition or framing the structural question
        incorrectly.

    (c) manual — bump from prompt management view. No specific
        trigger — researcher decides.

  All bumps create a changelog entry (in prompt_versions.
  changelog_entry) traceable to the correction or observation
  that inspired it. The entry names what changed, why, and
  which override/dismissal pattern prompted it (for trigger b).


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STREAM AGREEMENT CLASSIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each correspondence, the engine classifies whether Sage and
Claude agree on its presence:

  | Sage sees | Claude sees | Classification |
  |-----------|-------------|----------------|
  | Yes       | Yes         | Convergent     |
  | Yes       | No          | Researcher-led |
  | No        | Yes         | Knowledge-led  |

  Convergent — strongest evidence. Both the researcher's
    observation and Claude's structural analysis independently
    identify the same correspondence. Two independent sources
    pointing at the same pattern.

  Researcher-led — Sage sees what Claude does not. The
    researcher's domain expertise and field intuition surface
    a correspondence that Claude's knowledge base or prompt
    framing misses. This is Sage's territory — the finding
    stands on researcher observation.

  Knowledge-led — Claude surfaces the unseen. Claude's
    knowledge of traditions and structural parallels identifies
    a correspondence the researcher had not named. The value
    of Claude in the compute step — surfacing what Sage alone
    could not hold simultaneously.

  CLASSIFICATION MECHANICS

    "Sage sees" = deposit carries tags or content that reference
    the tradition/framework. Detectable from Stream 1 data.

    "Claude sees" = Claude's response includes a correspondence
    for that tradition/framework. Detectable from Stream 2 data.

    Classification is computed after both streams complete,
    by comparing Stream 1 tradition references against Stream 2
    correspondences for the same deposit.

  Classification travels with the correspondence in all result
  metadata. Nexus and Cosmology can read it. MTM reads it in
  the feed.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORRESPONDENCE COMPUTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After both streams produce their data, the engine computes
correspondence patterns across the accumulated results.

  STRENGTH

    Per correspondence pair (field pattern ↔ tradition):
      deposit_count: how many deposits show this correspondence
        (weighted by deposit_weight)
      confidence_distribution: count of high/moderate/low
        confidence ratings from Claude across snapshots
      null_contribution: how many null observations touched
        this correspondence pair

    Strength = weighted deposit count, adjusted by confidence.
    High-confidence correspondences from high-weight deposits
    carry the most strength. Low-confidence from low-weight
    fragments carry the least.

    Baseline comparison: same marginal product formula from
    ENGINE COMPUTATION SCHEMA.md. How often would this
    correspondence appear if field patterns and traditions
    were randomly associated?

    Ratio and signal band classification apply.

    PATTERN_ID FORMAT: 'snm_corr_[field_pattern]_[tradition]'

  CLUSTERING

    Do correspondences group? Multiple field patterns
    corresponding to the same tradition = a cluster. Pattern
    category as the organizing structure — which manifest
    category types are attracting the most correspondence weight.

    Cluster detection: group correspondences by pattern_category.
    Within each category, identify which traditions appear
    repeatedly. A tradition surfacing across multiple field
    patterns within the same category is a structural cluster —
    the tradition and the category are jointly attracting field
    patterns.

    Correspondences with pattern_category: null form the
    "uncategorized" cluster — patterns outside the three manifest
    categories. Active research surface.

  GENUINE VS. SURFACE

    Structural correspondence: multiple independent supporting
    observations across different contexts. Different deposits,
    different sessions, different deposit content — the same
    tradition keeps emerging. Strength builds over time.

    Surface resemblance: hovers near 1.0x baseline. Appears
    once or twice, does not accumulate independent support.
    Not invalidated — held as mild signal until volume
    confirms or erodes it.

    The strength calculation + baseline comparison handles
    this naturally. Strong signal band (2.0x+) = genuine
    structural correspondence (so far). Mild band (1.0-2.0x)
    = possible, not yet confirmed. Suppressed (below 1.0x) =
    below random chance, actively unlikely.

  CORRESPONDENCE DRIFT

    Early data produces surface resemblances that look
    significant. Volume separates genuine from noise. Claude's
    analysis may surface different tradition matches as prompts
    refine. Temporal tracking is where the depth lives.

    The temporal correspondence view (Visualization 2) makes
    drift visible across Claude snapshots and prompt versions.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUALIZE (Step 3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SNM visualizations are SVG instruments rendered via LayerCake
+ D3 utilities. Rendering category: SVG instrument (see ENGINE COMPUTATION SCHEMA.md VISUALIZATION ARCHITECTURE).

All visualizations render from computed results, never from raw
deposit data.


VISUALIZATION 1 — BIPARTITE FORCE-DIRECTED GRAPH

  Two node groups connected by correspondence edges. The primary
  visualization of how field patterns map to traditions.

  LEFT SIDE — FIELD PATTERN NODES
    Positioned by mutual relationships (d3-force). Field patterns
    that co-occur cluster together.

    Node size = deposit count (weighted).
    Node color = neutral — field patterns are not assigned to
    categories. Clustering is on the tradition side.

  RIGHT SIDE — TRADITION/FRAMEWORK NODES
    Positioned by how many field patterns connect to them.
    Traditions with many correspondences sit centrally.
    Traditions with few sit at the periphery.

    Node size = correspondence count.
    Node color = pattern_category (distinct color per manifest
    category — ancient_philosophy, triadic_architecture,
    celestial; neutral for uncategorized).
    Grouped visually by category — shows at a glance which
    category cluster carries the most correspondence weight
    and which arcs toward Cosmology (celestial cluster).

  EDGES — CORRESPONDENCE CONNECTIONS
    Edge weight = correspondence strength (ratio).
    Edge color = signal band.
    Edge style encodes genuine vs. surface:
      solid line    — 2.0x+ (strong signal, genuine correspondence)
      dashed line   — 1.0-2.0x (mild signal, possible)
      faint dotted  — below 1.0x (suppressed, below baseline)

    Stream classification visible on edges:
      convergent     — thickest edge (both Sage and Claude see it)
      researcher-led — standard thickness, distinct marker
                       (Sage's territory)
      knowledge-led  — standard thickness, visually distinct as
                       suggestions (Claude surfaced it)

  d3-zoom essential for navigation as correspondences accumulate.

  Hover on field pattern node: deposit count, connected traditions,
  weight breakdown, null contribution.

  Hover on tradition node: framework, correspondence count,
  connected field patterns, confidence distribution.

  Hover on edge: full correspondence detail — strength, ratio,
  signal band, stream classification, deposit count, confidence.


VISUALIZATION 2 — TEMPORAL CORRESPONDENCE VIEW

  How correspondences have strengthened or faded over time,
  tracked across Claude snapshots and prompt versions.

  X-axis: time (snapshot created_at).
  Y-axis: correspondence strength (ratio or deposit count).

  Each correspondence pair = one line on the chart.
  Line color = signal band of the most recent data point.
  Line style = stream classification (convergent = solid,
  researcher-led = dashed, knowledge-led = dotted).

  Prompt version boundaries: vertical markers where prompt
  version changed. A correspondence that strengthens after
  a prompt bump = "held up under sharper questioning." A
  correspondence that weakens = "only appeared under broad
  prompting." Both are visible.

  Filterable by:
    - Specific tradition
    - Pattern category (ancient_philosophy/triadic_architecture/celestial/uncategorized)
    - Stream classification
    - Signal band

  This visualization makes correspondence drift directly
  observable. Early surface resemblances that fade are visible.
  Genuine structural parallels that strengthen are visible. The
  temporal dimension is where the depth lives.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEED (Step 4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Standard snapshot + MTM drift tracking per ENGINE COMPUTATION
SCHEMA.md.

SNM feed includes Claude snapshot history alongside the standard
engine result object:

  claude_snapshot_summary:
    total_snapshots:     integer
    latest_prompt_version: string
    per_deposit_count:   integer (snapshots in per_deposit mode)
    batch_count:         integer (snapshots in batch mode)
    unique_traditions:   integer (distinct traditions surfaced)
    uncategorized_count: integer (correspondences with
                         pattern_category: null)

MTM reads the engine snapshot (correspondence patterns, pattern
category rates, strength data) plus the Claude summary for
synthesis context. MTM sees which traditions the field is
converging with, how confident Claude is, and what sits outside
the three manifest categories.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SNAPSHOT_DATA STRUCTURE (SNM-specific)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stored in engine_snapshots.snapshot_data (jsonb). This is the
SNM-specific content within the shared snapshot record.

  {
    "stream_1": {
      "tradition_presences": [
        {
          "pattern_id": "snm_s1_pres_vedic",
          "tradition": "vedic",
          "presence_rate": float,
          "deposit_count": integer,
          "weighted_count": float,
          "weight_breakdown": { "high": int, "standard": int, "low": int },
          "null_contribution": {
            "null_count": int, "null_weighted": float,
            "positive_count": int, "positive_weighted": float
          }
        }
      ],
      "tradition_co_occurrences": [
        {
          "pattern_id": "snm_s1_cooc_vedic_hermetic",
          "tradition_a": "vedic",
          "tradition_b": "hermetic",
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
      ],
      "pattern_category_rates": [
        {
          "pattern_id": "snm_s1_cat_ancient_philosophy",
          "category": "ancient_philosophy",
          "deposit_count": integer,
          "weighted_count": float,
          "weight_breakdown": { "high": int, "standard": int, "low": int },
          "null_contribution": {
            "null_count": int, "null_weighted": float,
            "positive_count": int, "positive_weighted": float
          }
        }
        // ... ancient_philosophy, triadic_architecture, celestial, uncategorized
      ]
    },

    "stream_2": {
      "claude_snapshot_ids": [string],
      "correspondences_summary": [
        {
          "tradition": string,
          "framework": string,
          "pattern_category": "ancient_philosophy" | "triadic_architecture"
                              | "celestial" | null,
          "total_occurrences": integer,
          "confidence_distribution": {
            "high": integer,
            "moderate": integer,
            "low": integer
          },
          "latest_prompt_version": string,
          "stream_classification": "convergent" | "researcher_led"
                                   | "knowledge_led"
        }
      ]
    },

    "correspondences": [
      {
        "pattern_id": "snm_corr_threshold_triadic_vedic_trinity",
        "field_pattern": string,
        "tradition": string,
        "framework": string,
        "pattern_category": "ancient_philosophy" | "triadic_architecture"
                            | "celestial" | null,
        "stream_classification": "convergent" | "researcher_led"
                                 | "knowledge_led",
        "strength": {
          "deposit_count": integer,
          "weighted_count": float,
          "confidence_distribution": {
            "high": integer,
            "moderate": integer,
            "low": integer
          },
          "null_contribution": {
            "null_count": int, "null_weighted": float,
            "positive_count": int, "positive_weighted": float
          }
        },
        "baseline_rate": float,
        "ratio": float,
        "signal_band": "suppressed" | "mild" | "strong" | null,
        "insufficient_data": boolean,
        "low_sample": boolean,
        "first_observed": timestamp,
        "last_observed": timestamp,
        "prompt_version_at_first": string,
        "prompt_version_at_latest": string
      }
    ],

    "clustering": {
      "ancient_philosophy": {
        "traditions": [string],
        "correspondence_count": integer
      },
      "triadic_architecture": {
        "traditions": [string],
        "correspondence_count": integer
      },
      "celestial": {
        "traditions": [string],
        "correspondence_count": integer
      },
      "uncategorized": {
        "traditions": [string],
        "correspondence_count": integer
      }
    },

    "claude_snapshot_summary": {
      "total_snapshots": integer,
      "latest_prompt_version": string,
      "per_deposit_count": integer,
      "batch_count": integer,
      "unique_traditions": integer,
      "uncategorized_count": integer
    }
  }


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. CLAUDE API FAILURE DURING COMPUTE
     Claude API call fails (rate limit, network, key invalid).
     Stream 2 produces no data for this deposit.

     Guard: Stream 1 (Sage's observations) is computed
     independently of Stream 2. If Claude fails, Stream 1
     results are still valid and included in the engine output.
     Stream 2 failure is logged with deposit_id. No
     snm_claude_snapshot is created. The deposit is flagged for
     Stream 2 retry on next compute. Engine result includes a
     stream_2_incomplete flag so downstream consumers know
     Claude data is missing for this computation window.

  2. CLAUDE RETURNS MALFORMED RESPONSE
     JSON parse succeeds but correspondences array contains
     entries with missing required fields.

     Guard: each correspondence is validated before inclusion.
     Required fields: tradition, framework, structural_match,
     confidence, reasoning, pattern_category. A correspondence
     missing any required field is dropped and logged. Valid
     correspondences from the same response are preserved.
     The snapshot is created with whatever valid data was
     returned — partial results are better than no results.

  3. PROMPT DRIFT — OLD PROMPT PRODUCES SHALLOW CORRESPONDENCES
     The active prompt version has not been updated. Claude's
     correspondences are broad and low-confidence. Sage
     dismisses most of them.

     Guard: changelog trigger (b) — calibration-triggered
     recommendation. When Sage's override/dismissal rate
     crosses the threshold, the system surfaces a prompt
     revision recommendation. Sage confirms before bump
     executes. The threshold for trigger (b) is a calibration
     item.

  4. SURFACE RESEMBLANCE INFLATION AT LOW VOLUME
     Early in the archive's life, few deposits exist. A single
     correspondence appears once and has no baseline to compare
     against. It looks significant because there is nothing
     else.

     Guard: deposit_count and baseline comparison handle this.
     A correspondence with deposit_count: 1 and
     insufficient_data: true (no baseline computable) is
     rendered distinctly. The researcher sees the sparsity.
     Volume separates genuine from noise over time — the
     temporal correspondence view (Visualization 2) makes
     this visible.

  5. BATCH MODE PRODUCES DIFFERENT CORRESPONDENCES THAN PER-DEPOSIT
     The same deposits analyzed individually (per-deposit mode)
     vs. as a set (batch mode) produce different Claude
     responses. Cross-deposit patterns are only visible in batch.

     Guard: this is by design, not a failure. Batch mode is
     qualitatively richer — Claude sees the set as a set.
     Both modes produce immutable snapshots. analysis_mode is
     recorded on every snapshot. Downstream consumers can
     distinguish per-deposit findings from batch findings.
     The difference between them is itself data about what
     becomes visible at scale.

  6. CONVERGENT CLASSIFICATION FALSE POSITIVE
     Sage and Claude both reference the same tradition, but
     for different structural reasons. Classified as convergent
     when the apparent agreement is coincidental.

     Guard: the classification is based on presence of the
     tradition in both streams, not on whether the structural
     reasoning matches. A convergent classification means both
     sources point at the same tradition — the reasoning is
     in the correspondence detail (Claude's reasoning field +
     Sage's tag context). The researcher reads the detail to
     assess whether the convergence is genuine. The
     classification is a filter aid, not a verdict.

  7. UNCATEGORIZED CLUSTER GROWS WITHOUT INVESTIGATION
     Many correspondences accumulate with pattern_category: null.
     The uncategorized cluster is large but no one is investigating
     what sits outside the three manifest categories.

     Guard: the clustering summary in snapshot_data surfaces
     uncategorized_count. The bipartite graph renders uncategorized
     tradition nodes visually distinct. The temporal view shows if
     uncategorized correspondences are growing. These are signals
     to the researcher, not automated actions. Investigation of
     what the page's categories don't contain is a research
     decision.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  | File | Role | Status |
  | --- | --- | --- |
  | backend/services/engine_snm.py | SNM engine — extends engine_base. Two-stream compute (Sage observations + Claude structural analysis). Claude API calls (per-deposit + batch). Correspondence computation. Stream agreement classification. Snapshot assembly with Claude history. | NOT STARTED |
  | backend/routes/engines.py | Shared engine routes — includes SNM-specific endpoints for Claude snapshot read and prompt management | NOT STARTED |
  | frontend/src/lib/components/SnmBipartiteGraph.svelte | Bipartite force-directed graph — LayerCake + d3-force. Field patterns left, traditions right colored by pattern_category, uncategorized cluster explicit, edge style encoding | NOT STARTED |
  | frontend/src/lib/components/SnmTemporalCorrespondence.svelte | Temporal correspondence view — LayerCake + d3-scale. Strength over time, prompt version boundaries, filterable | NOT STARTED |
