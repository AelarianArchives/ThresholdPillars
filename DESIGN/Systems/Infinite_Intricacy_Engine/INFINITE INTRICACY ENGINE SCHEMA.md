# INFINITE INTRICACY ENGINE SCHEMA

## INF · V1

## /DESIGN/Systems/Infinite_Intricacy_Engine/INFINITE INTRICACY ENGINE SCHEMA.md

Mechanical spec — domain layer tracking, emergence detection, intersection
computation, density field visualization, INF→Cosmology boundary contract,
failure modes. Shared architecture in ENGINE COMPUTATION SCHEMA.md. This
schema extends the shared foundation with INF-specific logic.

INF watches. Cosmology works. INF tracks WHICH sciences emerge and WHERE
they intersect. Cosmology (Tier 5) investigates those connections with
computation and statistical tests. If INF investigates, it steps on
Cosmology. If Cosmology re-discovers what's present, INF is not doing
its job.


OWNERSHIP BOUNDARIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  OWNS
    INF domain layer registry — open set of scientific domains
    INF layer presence computation — per-domain weighted frequency
    INF intersection computation — domain pair co-occurrence
    INF emergence timeline computation — temporal tracking per domain
    INF dormancy detection — inactive-then-spike identification
    INF → Cosmology boundary contract — what INF surfaces for
      Cosmology to investigate
    INF-specific visualizations — density field map, emergence
      timeline, intersection detail
    INF pattern_id format and generation
    INF snapshot_data JSON structure
    TAG VOCABULARY layer → INF domain bridge mapping
    inf_domain_layers database table

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
    TAG VOCABULARY layer definitions (l01-l04) — owned by TAG VOCABULARY.md
    Cosmology investigation and computation — owned by Cosmology
      pages (HCO, COS, CLM, NHM) and ARTIS (Tier 5)
    Page 04 manifest and domain identity — owned by
      DESIGN/Domains/02_Axis/Manifest_04_Infinite_Intricacy.txt


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. INF operates on page 04 (Infinite Intricacy). Reads deposits
     where 'INF' is in the deposit's pages array.

  2. Five confirmed scientific domain layers. Open set — new
     domains will emerge as the research is live and generative.

       Harmonic Cosmology      — harmonic and wave structures,
                                  resonance, geometric and structural
                                  fields
       Coupling and Oscillation — relational connectivity,
                                  phase-locking, cross-frequency
                                  interaction, dynamic field coupling
       Celestial Mechanics     — orbital dynamics, gravitational
                                  binding, geometric spatial anchors
       Neuro-Harmonics         — neural fields, cognitive and quantum
                                  analogues, information systems
       Mirror Dynamics         — self-reference, reflection, observer
                                  effects, iterative pattern formation,
                                  morphogenesis

  3. Domains live in a config table (inf_domain_layers), not an
     enum. Adding a 6th domain is a data operation, not a code
     change. Math stays trivial because the set is always small.

  4. INF watches — it does not work the material. Tracking which
     sciences emerge and where they intersect is INF's function.
     Investigating those connections with computation and
     statistical tests is Cosmology's function (Tier 5).

  5. Direction of inference runs from field observation outward,
     never from established science inward. INF does not import
     scientific frameworks onto field data. It tracks what the
     field keeps pointing toward.

  6. Unnamed is not absent. When field observations point toward
     a science not yet in the domain registry, INF flags it as
     an emerging domain. The flag is data — it triggers review,
     not automatic registration.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAG VOCABULARY LAYER → INF DOMAIN BRIDGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TAG VOCABULARY routing layers (l01-l04) and INF domain layers are
separate systems. TAG VOCABULARY layers are tag routing categories
— they determine where a tag sits in the routing tree. INF domain
layers are scientific research domains that emerge from field data.
They are related but not identical.

A bridge table maps tag routing layers to INF domains. This is how
the INF engine indexes deposits: it reads the tag's layer_id from
the deposit's tags, resolves through the bridge to INF domain(s),
and indexes the deposit under those domains.

  TABLE: inf_layer_bridge (PostgreSQL config table)

    tag_layer_id     — text, not null
                       References TAG VOCABULARY layer (l01-l04)

    inf_domain_id    — text, not null
                       References inf_domain_layers.domain_id

    Primary key: (tag_layer_id, inf_domain_id)

  V1 BRIDGE MAPPING

    | tag_layer_id | inf_domain_id          |
    |--------------|------------------------|
    | l01          | coupling_oscillation   |
    | l02          | neuro_harmonics        |
    | l03          | celestial_mechanics    |
    | l03          | harmonic_cosmology     |
    | l04          | mirror_dynamics        |

  l03 (Metric) bridges to two INF domains: Celestial Mechanics
  and Harmonic Cosmology. A deposit tagged with an l03-routed tag
  is indexed under BOTH domains. This is correct — l03's scope
  (wave measurement, geometry, astronomy) spans the scientific
  content of both domains.

  All other layers are 1:1.

  The bridge is updatable. When new INF domains are added, the
  bridge table is extended. When tag vocabulary layers are
  reorganized, the bridge is updated to maintain correct mapping.
  The bridge is a config table, not hardcoded logic.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INF DOMAIN LAYERS TABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TABLE: inf_domain_layers (PostgreSQL config table)

    domain_id        — text, primary key
                       Lowercase snake_case identifier.

    display_name     — text, not null
                       Human-readable name for visualization.

    description      — text, not null
                       What scientific content this domain covers.

    sub_domain       — text, nullable
                       V1: null for all domains. Sub-domain depth
                       is Cosmology territory (Tier 5). When
                       sub-domains emerge naturally, INF can tag
                       without structural redesign. Empty now,
                       populated later.

    cosmology_page   — text, nullable
                       Page code of the corresponding Cosmology
                       investigation page, if one exists.
                       Null for domains without a Cosmology page.

    first_observed   — timestamp, nullable
                       When this domain was first detected in
                       field data. Populated by engine computation,
                       not at table creation.

    active           — boolean, not null, default true
                       Domains can be deactivated without deletion
                       if the field stops pointing toward them.
                       Deactivated domains are excluded from
                       computation but preserved in the registry.

    created_at       — timestamp, not null

  V1 SEED DATA

    | domain_id             | display_name              | cosmology_page |
    |-----------------------|---------------------------|----------------|
    | harmonic_cosmology    | Harmonic Cosmology        | HCO            |
    | coupling_oscillation  | Coupling and Oscillation  | COS            |
    | celestial_mechanics   | Celestial Mechanics       | CLM            |
    | neuro_harmonics       | Neuro-Harmonics           | NHM            |
    | mirror_dynamics       | Mirror Dynamics           | null           |


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INDEX (Step 1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Deposit arrives on page 04. Engine reads:
    - tags (each tag carries routing metadata including layer_id;
      engine resolves layer_id through inf_layer_bridge to INF
      domain(s))
    - deposit_weight
    - observation_presence
    - created_at (for temporal tracking in emergence timeline)
    - id (for source tracing)

  Indexes by which INF domain(s) the deposit touches, resolved
  through the bridge table. A deposit with tags routed to l01 and
  l03 is indexed under Coupling and Oscillation, Celestial
  Mechanics, AND Harmonic Cosmology (because l03 bridges to two
  domains).

  Multiple tags routed to the same layer count as one domain
  presence for that domain — same seed-level dedup logic as ECR.

  If a deposit carries tags whose layer_ids do not resolve through
  the bridge to any INF domain: the deposit is indexed (contributes
  to total examined denominator) but does not contribute to any
  domain-specific pattern. This is the signal for an unmapped
  domain — see EMERGING DOMAIN DETECTION below.

  Stale flag set to true in SQLite engine_stale_flags after
  indexing. See ENGINE COMPUTATION SCHEMA.md HYBRID COMPUTE TRIGGER.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPUTE (Step 2) — THREE COMPUTATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All three computations use the shared baseline formula, deposit
weight multipliers, null observation handling, and signal
classification from ENGINE COMPUTATION SCHEMA.md.

Small set (5 domains, 10 pairs). Trivial computation. The
analytical significance is in the intersections, not the volume.


COMPUTATION 1 — LAYER PRESENCE RATES

  Per domain: weighted frequency relative to total examined
  deposits. Which scientific domains are active vs. dormant.

  For each domain D:

    presence_rate:
      weighted count of deposits touching domain D
      ─────────────────────────────────────────────────
      total weighted examined deposits on page 04

    Each presence result carries weight_breakdown and
    null_contribution.

  PATTERN_ID FORMAT for presence:
    'inf_pres_[domain_id]'
    Example: 'inf_pres_harmonic_cosmology'


COMPUTATION 2 — INTERSECTION RATES

  Every domain pair: co-occurrence vs. baseline. Each intersection
  is analytically significant — a domain appearing in two layers
  simultaneously is a finding, not noise.

  5 domains = 10 unique pairs (5 choose 2).

  For each pair (D1, D2):

    observed_rate:
      weighted count of deposits touching BOTH D1 AND D2
      ─────────────────────────────────────────────────────
      total weighted examined deposits on page 04

    expected_rate:
      marginal(D1) * marginal(D2)

    ratio: observed_rate / expected_rate
    signal_band: classified per ENGINE COMPUTATION SCHEMA.md
    insufficient_data: true if expected_rate = 0

  Each intersection result carries:
    weight_breakdown, null_contribution
    first_observed: timestamp of earliest deposit in this
      intersection
    deposit_ids: list of all deposit IDs contributing to this
      intersection (for intersection detail view)

  PATTERN_ID FORMAT for intersection:
    'inf_isct_[domain_id_1]_[domain_id_2]'
    Example: 'inf_isct_coupling_oscillation_neuro_harmonics'
    Alphabetically first domain_id always first. Deterministic.


COMPUTATION 3 — EMERGENCE TIMELINE

  When each domain first appeared. Frequency change over time.
  Dormancy detection. Temporal, not just aggregate.

  Per domain D:

    first_appeared: timestamp of earliest deposit in domain D
    frequency_over_time: array of time-bucketed deposit counts
      (weighted). Bucket size is a calibration item — monthly
      for V1 unless deposit volume warrants finer granularity.
    dormancy_events: periods where domain D had zero deposits
      followed by a spike (deposits resume after gap). A
      dormancy event is:
        {
          dormancy_start: timestamp (last deposit before gap)
          dormancy_end: timestamp (first deposit after gap)
          gap_duration_days: integer
          spike_count: integer (deposits in first bucket after gap)
        }
    current_state: active | dormant
      active: at least one deposit in the most recent time bucket
      dormant: zero deposits in the most recent time bucket(s)

  The emergence timeline is per-domain temporal data. It does not
  use the co-occurrence baseline formula — it tracks presence over
  time, not presence relative to other domains. Signal
  classification does not apply to timeline data directly.

  PATTERN_ID FORMAT for emergence:
    'inf_emrg_[domain_id]'
    Example: 'inf_emrg_mirror_dynamics'


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMERGING DOMAIN DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  When a deposit on page 04 carries tags whose layer_ids do not
  resolve through the bridge to any INF domain, the engine logs
  an unmapped_layer_event:

    unmapped_layer_events (in snapshot_data):
      layer_id: text (the tag layer_id with no bridge mapping)
      deposit_id: text
      deposit_created_at: timestamp
      tag_ids: [list of specific tags that carried this layer_id]

  This is the detection mechanism for new scientific domains
  emerging in the field. The event does not trigger automatic
  domain creation — it surfaces the data for the researcher.
  Sage reviews and decides whether to register a new domain
  and create a bridge mapping.

  At V1 with the current bridge covering all four tag layers
  (l01-l04), this event fires only if new tag layers are added
  to TAG VOCABULARY. It is a forward-looking seam, not a V1
  active feature.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INF → COSMOLOGY BOUNDARY CONTRACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  INF produces this result structure. Cosmology (Tier 5) reads it
  and investigates from there. Cosmology does not re-derive which
  domains are present — INF has already done that work.

    inf_cosmology_handoff:
      layers_active: [list of domain_ids with current_state: active]
      intersections: [
        {
          domain_pair: [domain_id_1, domain_id_2]
          observed_rate: float
          expected_rate: float
          ratio: float
          signal_band: string
          first_observed: timestamp
          deposit_ids: [references]
        }
      ]
      emergence_timeline: [
        {
          domain_id: string
          first_appeared: timestamp
          current_state: active | dormant
          dormancy_events: [dormancy event objects]
          frequency_over_time: [time-bucketed counts]
        }
      ]

  Domains without a cosmology_page (currently: Mirror Dynamics)
  are included in the handoff. Cosmology decides whether and how
  to investigate them. The handoff is complete — it does not
  filter by whether a Cosmology page exists.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUALIZE (Step 3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All INF visualizations are SVG instruments rendered via LayerCake
+ D3 utilities. Rendering category: SVG instrument (see ENGINE
COMPUTATION SCHEMA.md VISUALIZATION ARCHITECTURE).

All visualizations render from computed results, never from raw
deposit data.


VISUALIZATION 1 — DENSITY FIELD MAP

  NOT a Venn diagram. d3-contour generates topographic contours
  from deposit point distributions.

  Each domain = a region of concentration with probabilistic
  boundaries. Deposits are points within the field. Overlap
  zones = gradient of co-presence, not clean intersection.

  Domain positioning: deposits are placed in 2D space based on
  their domain membership. A deposit touching one domain is
  positioned within that domain's region. A deposit touching
  two domains is positioned in the overlap zone. Positioning
  algorithm uses domain centroid distances derived from the
  intersection matrix — strongly intersecting domains have
  closer centroids.

  Shape evolves as deposits arrive. Boundaries are shown as
  probabilistic because that is what they are. Literally truthful.

  Color: each domain has a distinct hue. Overlap zones blend
  the hues of the domains involved. Contour lines show deposit
  density gradients.

  Hover on deposit point: deposit detail (id, tags, domains,
  weight, observation_presence).

  Hover on overlap zone: intersection detail (domain pair,
  observed rate, expected rate, ratio, signal band).


VISUALIZATION 2 — EMERGENCE TIMELINE

  Horizontal timeline. Each domain = one band. 5 bands for V1
  (grows with new domains).

  X-axis: time.
  Y-axis: domain bands stacked vertically.

  Band thickness = deposit frequency over time (from Computation
  3 frequency_over_time data). Thicker bands = more deposits in
  that time period.

  First-appearance markers: vertical indicator at each domain's
  first_appeared timestamp.

  Dormancy gaps visible: periods where a band thins to zero and
  then resumes. Dormancy events from Computation 3 are rendered
  as explicit gap markers.

  Color: each domain matches its density field map hue.


VISUALIZATION 3 — INTERSECTION DETAIL

  Click an overlap zone in the density field map → see specific
  deposits in that intersection. What was happening when two
  domains appeared together.

  Panel or modal showing:
    Domain pair
    Intersection rate, baseline, ratio, signal band
    First observed timestamp
    List of contributing deposits with:
      deposit id, content preview, tags, created_at,
      deposit_weight, observation_presence


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEED (Step 4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Standard snapshot + MTM drift tracking per ENGINE COMPUTATION
SCHEMA.md.

INF → Cosmology boundary contract is assembled from the snapshot
data and made available as a structured read endpoint. Cosmology
pages query this at their own cadence — INF does not push.

Visualization snapshots: density field map state (domain
positions, contour shapes, overlap zones) capturable via
Sage-triggered snapshot per ENGINE COMPUTATION SCHEMA.md.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SNAPSHOT_DATA STRUCTURE (INF-specific)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stored in engine_snapshots.snapshot_data (jsonb). This is the
INF-specific content within the shared snapshot record.

  {
    "presences": [
      {
        "pattern_id": "inf_pres_harmonic_cosmology",
        "domain_id": "harmonic_cosmology",
        "display_name": "Harmonic Cosmology",
        "presence_rate": float,
        "deposit_count": integer,
        "weighted_count": float,
        "weight_breakdown": { "high": int, "standard": int, "low": int },
        "null_contribution": {
          "null_count": int, "null_weighted": float,
          "positive_count": int, "positive_weighted": float
        }
      }
      // ... one per active domain
    ],

    "intersections": [
      {
        "pattern_id": "inf_isct_coupling_oscillation_neuro_harmonics",
        "domain_a": "coupling_oscillation",
        "domain_b": "neuro_harmonics",
        "observed_rate": float,
        "expected_rate": float,
        "ratio": float,
        "signal_band": "suppressed" | "mild" | "strong" | null,
        "insufficient_data": boolean,
        "deposit_count": integer,
        "weighted_count": float,
        "weight_breakdown": { "high": int, "standard": int, "low": int },
        "null_contribution": {
          "null_count": int, "null_weighted": float,
          "positive_count": int, "positive_weighted": float
        },
        "first_observed": timestamp,
        "deposit_ids": [string]
      }
      // ... one per domain pair (10 pairs for 5 domains)
    ],

    "emergence_timeline": [
      {
        "pattern_id": "inf_emrg_harmonic_cosmology",
        "domain_id": "harmonic_cosmology",
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
      // ... one per domain
    ],

    "unmapped_layer_events": [
      {
        "layer_id": string,
        "deposit_id": string,
        "deposit_created_at": timestamp,
        "tag_ids": [string]
      }
      // ... empty at V1 if all tag layers are bridged
    ]
  }


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. SPARSE DATA — FEW DEPOSITS ON PAGE 04
     With under 10 deposits, most intersections have zero
     observations. 10 pairs is small but data per pair is
     sparse early on.

     Guard: same as THR/ECR. deposit_count carried in every
     result. Visualizations render sparsity directly. The
     density field map will have few points and thin contours
     — that is an honest representation.

  2. BRIDGE TABLE OUT OF SYNC WITH TAG VOCABULARY
     A new tag layer is added to TAG VOCABULARY but the bridge
     table is not updated. Deposits with the new layer produce
     unmapped_layer_events but are not indexed under any INF
     domain.

     Guard: unmapped_layer_events surface the gap. The engine
     does not silently drop data — it logs every unresolvable
     layer_id. Sage reviews and updates the bridge. This is the
     designed detection mechanism.

  3. L03 DOUBLE-COUNTING IN INTERSECTION
     A deposit with l03-routed tags is indexed under both
     Celestial Mechanics and Harmonic Cosmology. This deposit
     appears in the intersection of those two domains — but the
     intersection is an artifact of the bridge mapping, not of
     the deposit simultaneously pointing to both sciences.

     Guard: the intersection between Celestial Mechanics and
     Harmonic Cosmology will have an elevated baseline because
     every l03 deposit contributes to both. The marginal
     product baseline accounts for this — if both domains have
     high presence rates, their expected co-occurrence rate is
     high, and the ratio remains near 1.0. Genuine intersections
     (deposits touching l03 AND another layer) will show as
     elevated ratios against that adjusted baseline. The math
     handles it. The researcher should be aware that the CM/HC
     intersection rate reflects the bridge topology, not
     independent scientific convergence.

  4. DOMAIN REGISTERED BUT NEVER OBSERVED
     A domain exists in inf_domain_layers with first_observed
     still null. No deposits have been indexed under it.

     Guard: the domain appears in the emergence timeline with
     first_appeared: null and current_state: dormant. It is
     visible as "registered but not yet seen" — distinct from
     "seen and then went dormant." Not an error.

  5. DORMANCY DETECTION FALSE POSITIVE
     A gap in deposits is due to the researcher not working in
     this area for a period, not due to the domain going dormant
     in the field.

     Guard: dormancy events are data, not interpretations. The
     engine surfaces the gap. Whether the gap means the domain
     went dormant or the researcher was elsewhere is an
     analytical decision for the researcher. The engine does not
     distinguish researcher absence from field absence — it
     reports what the deposit record shows.

  6. COSMOLOGY HANDOFF FOR DOMAIN WITHOUT PAGE
     Mirror Dynamics is included in the INF→Cosmology handoff
     but has no Cosmology investigation page at V1.

     Guard: the handoff is complete — it includes all active
     domains regardless of whether a Cosmology page exists.
     Cosmology's response to a domain without a page is a Tier 5
     design decision. INF's job is to surface the data. What
     happens downstream is not INF's concern.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  | File | Role | Status |
  | --- | --- | --- |
  | backend/services/engine_inf.py | INF engine — extends engine_base. Domain presence, intersection, emergence timeline computations. Bridge resolution. Emerging domain detection. Snapshot assembly. | PLANNED |
  | frontend/src/lib/components/InfDensityFieldMap.svelte | Density field map — LayerCake + d3-contour | PLANNED |
  | frontend/src/lib/components/InfEmergenceTimeline.svelte | Emergence timeline — LayerCake + d3-scale | PLANNED |
  | frontend/src/lib/components/InfIntersectionDetail.svelte | Intersection detail panel — triggered from density field map | PLANNED |
