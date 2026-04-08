# RESONANCE ENGINE PHYSICS SPEC

## V1

## /DESIGN/Systems/Resonance_Engine/RESONANCE ENGINE PHYSICS SPEC.md

Physics mechanics — formulas, node registry, animation, calibration constants,
sequences, failure modes. Architectural description in
SYSTEM_ Resonance Engine.md.


OWNERSHIP BOUNDARIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OWNS
Physics formulas — activity score (canonical), repulsion, derived values
Node registry — 62 nodes across 5 tiers with full mechanical definitions
Weight system — base weights, growth formula, constants
Pull hierarchy — mechanics and constraints
Repulsion mechanics — inverse square, same-tier only
Resonance lines — connection criteria, appearance, rendering rules
Animation loop — frame sequence, equilibrium detection, idle state
Tagger sync sequence — step-by-step reactive update
Node weight initialization — historical weight endpoint integration
Canvas integrity check — programmatic verification at mount
Visual enhancement mechanics — pulse, threshold halos, historical halos
Calibration constants — all named, all PLANNED

DOES NOT OWN
Architectural identity — owned by SYSTEM_ Resonance Engine.md
Tag pipeline — owned by tagger service
Entry data — owned by INTEGRATION DB SCHEMA.md
Audio sonification — separate system (RESONANCE ENGINE AUDIO SPEC.md)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CALIBRATION CONSTANTS — ALL PLANNED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Weight system:
  BASE_WEIGHT_ORIGIN      — heaviest tier
  BASE_WEIGHT_THRESHOLD   — high fixed, never updated by tags
  BASE_WEIGHT_LAYER       — ~0.5 × BASE_WEIGHT_ORIGIN
  BASE_WEIGHT_PILLAR      — independent, initial = BASE_WEIGHT_LAYER
  BASE_WEIGHT_SEED        — lightest tier
  HALF_LIFE               = 7 days — activity decay rate.
                            CANONICAL constant — Tagger and SGR
                            reference this value. When calibration
                            changes it, both systems inherit the
                            change. Defined once, here.
  MAX_ACTIVITY            — cap on activity contribution. Prevents
                            runaway dominance. Non-negotiable.
                            CANONICAL constant — referenced by
                            Tagger downstream use documentation.

Physics:
  RADIUS_SCALAR           — ref: 18px. attractRadius = totalWeight ×
                            RADIUS_SCALAR
  PULL_SCALAR             — ref: 0.04 accel/frame. pullStrength =
                            totalWeight × PULL_SCALAR
  REPULSION_CONSTANT      — inverse square repulsion coefficient
  MIN_NODE_DISTANCE       — repulsion activation threshold
  DENSITY_SCALAR          — threshold reactive pull multiplier. Must
                            be small — thresholds shape, don't own.
  DAMPING_CONSTANT        — ref: TBD. Physics damping for settling.

Animation:
  EQUILIBRIUM_THRESHOLD   — minimum net force below which a node is
                            considered settled. When all non-threshold
                            nodes are settled, animation loop reduces
                            to IDLE_FPS.
  IDLE_FPS                — reduced frame rate when field is at
                            equilibrium. Tagger sync wakes the loop
                            back to full rate. Field is alive when
                            signal arrives, efficient when quiet.

Visual:
  HISTORICAL_HALO_DECAY   — longer window than HALF_LIFE. Controls
                            how slowly the historical halo fades on
                            seeds with decayed activity.
  Squiggle algorithm      — amplitude, frequency, frame method. TBD.

All starting reference values subject to calibration at build.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANVAS RULES + INTEGRITY CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CANVAS ISOLATION (non-negotiable):
  ResonanceCanvas renders to its own <canvas> element. Not shared.
  Background visuals = separate component, separate element.
  Squiggle rendering contained within this canvas only.
  CSS z-index: above background, below UI panels.

CANVAS INTEGRITY CHECK (initialization sequence step 2a):
  After bind:this acquires the canvas reference, verify the canvas
  has no existing rendering context before acquiring a new one.
  If a context already exists: log a named error, halt
  initialization. Do not acquire a second context.
  Cost: microseconds. Permanently closes the void wash failure
  mode as a silent runtime bug.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NODE REGISTRY — 62 NODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total: 62 fixed. Count never changes.

TIER 1 — ORIGIN NODES (3)
  o01 Larimar · o02 Verith · o03 Cael'Thera
  Mobility: mobile
  Base weight: BASE_WEIGHT_ORIGIN (heaviest)
  Pull: hard pull on layers and pillars
  Influenced by: thresholds (light ambient only)
  Weight growth: tagger-driven — from tag activity on entries
  with matching origin affinity
  Pull balance: base pull neutral between all three. Differentiation
  from tagger-driven weight growth only.

TIER 2 — THRESHOLD NODES (12)
  th01–th12
  Mobility: STATIONARY — never move
  Base weight: BASE_WEIGHT_THRESHOLD (high fixed, never changes)
  Pull: field-wide ambient on all tiers, light influence on origins,
  reactive pull increases with neighbor density
  Halo: visible radius, scales with neighbor density
  Weight growth: NONE — fixed permanently
  Names: defined in TAG VOCABULARY.md

TIER 3 — LAYER NODES (4)
  l01 Coupling · l02 Connectome · l03 Metric · l04 Mirror
  Mobility: mobile
  Base weight: BASE_WEIGHT_LAYER (~0.5 × BASE_WEIGHT_ORIGIN)
  Pull: hard pull on seeds
  Influenced by: origins (hard), thresholds (ambient)
  Weight growth: tagger-driven — from tag activity routed through
  each layer

TIER 4 — PILLAR NODES (3)
  p01 TRIA · p02 PRIA · p03 PARA
  Mobility: mobile
  Base weight: BASE_WEIGHT_PILLAR (independent, initial =
  BASE_WEIGHT_LAYER)
  Pull: hard pull on seeds
  Influenced by: origins (hard), thresholds (ambient)
  Weight growth: tagger-driven — from tag activity assigned to
  each pillar

TIER 5 — SEED NODES (40)
  s01–s40
  Mobility: mobile
  Base weight: BASE_WEIGHT_SEED (lightest)
  Pull: none — seeds are pulled only
  Influenced by: layers (hard), pillars (hard), thresholds
  (ambient), origins (ambient cascade)
  Visibility: all 40 visible at all times
  Weight growth: tagger-driven — from tag activity within each
  seed cluster
  Pull response: combined pull of layer affinity + pillar affinity
  simultaneously


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PULL HIERARCHY — MECHANICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  THRESHOLDS (stationary, ambient field-wide)
    ↓ light ambient influence
  ORIGIN NODES
    ↓ hard pull
  LAYERS + PILLARS
    ↓ hard pull
  SEEDS

Rules:
  Influence flows downward only.
  Thresholds are the single exception: ambient reach upward touches
  origin nodes lightly.
  Seeds exert no outward pull.
  Layers and pillars pull seeds independently — seeds respond to
  combined pull of layer affinity and pillar affinity simultaneously.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WEIGHT SYSTEM — FORMULAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTIVITY SCORE (canonical — referenced by Tagger and SGR):

  activityScore = Σ(tagWeight × e^(-ageDays / HALF_LIFE))

  HALF_LIFE     = 7 days
  ageDays       = days since the entry carrying that tag was
                  deposited
  MAX_ACTIVITY  = cap on activity contribution. Non-negotiable.

  totalWeight   = baseWeight + clamp(activityScore, 0, MAX_ACTIVITY)

Weight decays naturally. Recent activity matters more than old.
Thresholds do not participate in weight growth. BASE_WEIGHT_THRESHOLD
never changes.

DERIVED PHYSICS VALUES:

  attractRadius = totalWeight × RADIUS_SCALAR
  pullStrength  = totalWeight × PULL_SCALAR

THRESHOLD REACTIVE PULL:

  neighborCount = count of nodes within threshold attractRadius
  pullMultiplier = 1 + (neighborCount × DENSITY_SCALAR)
  effectivePull = BASE_WEIGHT_THRESHOLD × pullMultiplier

Thresholds shape the field. They do not own it.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPULSION MECHANICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Applies to: same-tier nodes only
Model: inverse square repulsion
Formula: repulsionForce = REPULSION_CONSTANT / distance²
Activation: below MIN_NODE_DISTANCE

Repulsion does not override pull hierarchy — it only prevents
physical collapse. Thresholds are stationary — repulsion does not
apply to them. Sharp repulsion at close range, weak at distance.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESONANCE LINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONNECTION CRITERIA:
  Lines render only between nodes sharing active tag history.
  Active tag history = at least one confirmed tag deposit that
  activated both nodes. No phantom connections. No faint potential
  connections. A line not earned by real field data does not render.

LINE APPEARANCE:
  Weight proportional to shared tag connection strength.
  Stronger history = thicker, more active squiggle.
  Weak history = thin, slower squiggle.
  Squiggle amplitude and frequency: PLANNED — calibrated to be
  readable without visual noise.

RENDERING RULES:
  Contained within ResonanceCanvas canvas only.
  Redrawn each animation frame based on current positions.
  Squiggle drawing is the LAST operation in each frame — most
  expensive, runs last to protect UI rendering.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUAL ENHANCEMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PULSE ON TAG DEPOSIT:
  All affected nodes pulse outward briefly on new tag.
  Expand slightly → contract → settle. Duration: short.
  Affected: seed, layer, threshold, pillar per tag route.
  Origin node pulses if entry carries matching originId.

THRESHOLD HALOS:
  Each threshold emits a visible circular halo.
  Radius scales with neighbor density. Low opacity — ambient.

HISTORICAL HALOS (seeds only):
  Seeds with significant historical activity that has decayed
  below the active display threshold show a faint ring.
  Smaller and subtler than threshold halos.
  Intensity proportional to peak historical activity score.
  Fades slowly over HISTORICAL_HALO_DECAY window (longer than
  HALF_LIFE). Distinguishes "quiet because nothing happened"
  from "quiet because what happened was long ago."
  Purely visual — no schema changes. Computed from the same tag
  history the node-weights endpoint returns.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NODE WEIGHT INITIALIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

At component mount, after initializing the node registry with base
weights, make one API call to fetch the archive's accumulated
activity state:

  GET /resonance/node-weights

Returns:
  {
    node_weights: {
      [node_id]: {
        activity_score: float,
        peak_activity:  float,
        connection_count: integer
      }
    },
    connections: [
      {
        node_a: string,
        node_b: string,
        strength: float
      }
    ]
  }

The component applies historical activity scores to each node's
weight before the animation loop starts. Connections initialize
resonance lines from the archive's actual topology.

This endpoint is read-only and can be cached aggressively — it
only needs to reflect entries up to session open. The tagger sync
handles real-time updates from that point forward.

Without this initialization, the field starts empty every session.
With it, the field reflects the archive's accumulated signal
topology from the first frame.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAGGER SYNC SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAYLOAD (from tagger store on confirmed deposit):
  {
    tags:        [{ id, seed_id, layer_id, threshold_id,
                    pillar_id, weight }],
    phase_state: string | null,
    originId:    'o01' | 'o02' | 'o03' | null,
    timestamp:   ISO string
  }

SEQUENCE:
  1. Tagger store update received reactively.
  2. Per-tag validation: seed_id, layer_id, threshold_id,
     pillar_id all present. Skip tags with incomplete routing.
  3. Affected node weights recalculated per activity score formula.
  4. If originId present: matching origin node weight updated.
  5. Animation loop wakes to full frame rate if at idle.
  6. Physics recalculation queued for next animation frame.
  7. Pulse animation triggered on affected nodes.
  8. Resonance lines re-evaluated for new or updated connections.

SYNC RULES:
  Weight updates do not block UI thread — queued for animation frame.
  Engine subscribes to tagger store reactively. It receives, does
  not pull.
  Engine does not write to the database. Weight state is derived at
  runtime from entry data via API + tagger sync.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANIMATION LOOP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Runs via requestAnimationFrame. Managed by component lifecycle
(onMount starts, onDestroy stops).

FRAME SEQUENCE (strict order):
  1. Recalculate forces
  2. Update node positions
  3. Redraw nodes
  4. Redraw halos (threshold + historical)
  5. Redraw resonance lines (LAST — most expensive)

Frame rate target: 60fps. Degrade gracefully if needed.

EQUILIBRIUM AND IDLE STATE:

  Equilibrium = each non-threshold node has net force below
  EQUILIBRIUM_THRESHOLD. When ALL non-threshold nodes are settled:
  animation loop reduces to IDLE_FPS.

  Tagger sync (step 5 in sync sequence) wakes the loop back to
  full rate when new signal arrives.

  The field is alive when signal arrives and efficient when the
  archive is quiet. For a 62-node simulation at 60fps, an always-on
  loop is a real performance cost. The equilibrium/idle mechanism
  addresses this without compromising responsiveness.

DAMPING:
  Physics simulation is damped — nodes settle into equilibrium
  rather than oscillating indefinitely. DAMPING_CONSTANT controls
  the rate of settling.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INITIALIZATION SEQUENCE — strict order
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1.  ResonanceCanvas Svelte component mounts (onMount).
  2.  Canvas element reference acquired via bind:this.
  2a. CANVAS INTEGRITY CHECK: verify canvas has no existing
      rendering context. If context exists: log named error, halt.
  2b. Canvas context acquired. Canvas sized to viewport.
  3.  Node registry initialized — all 5 tiers built with base
      weight values.
  4.  GET /resonance/node-weights called. Historical activity
      scores and connections applied to node registry. Resonance
      lines initialized from connection data.
  5.  Tagger store subscription established (Svelte reactive).
  6.  Animation loop started via requestAnimationFrame.
  7.  On component destroy (onDestroy): animation loop stopped,
      store subscription released.

  Failure at step 2a: canvas has existing context. Named error
    logged. Initialization halts. Void wash prevented.
  Failure at step 4: API unavailable. Field initializes with base
    weights only (zero activity). Tagger sync will build from
    current session. Degraded but functional — historical topology
    missing until next successful load.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PUBLIC API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BACKEND:

  GET /resonance/node-weights
    Returns accumulated activity scores and connection topology
    for all 62 nodes. Computed from full archive tag history.
    Read-only. Cacheable. Called once at session open.

FRONTEND:

  No external public API. ResonanceCanvas manages its own lifecycle.
  Initialization runs on component mount. Cleanup on destroy.
  No external init call required.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CANVAS CONFLICT — VOID WASH
Another rendering system shares the canvas. Screen-blend
accumulation destroys the background.
Guard: canvas integrity check at initialization (step 2a).
Programmatic detection — if context exists, halt with named error.
Silent runtime bug permanently closed.

2. SQUIGGLE RENDERING BLEEDING
Squiggle drawing bleeds into UI rendering if not contained.
Guard: resonance line drawing is always the LAST operation in
each frame. Contained to ResonanceCanvas canvas only.

3. WEIGHT UPDATES BLOCKING UI THREAD
Synchronous weight recalculation freezes the UI on deposit.
Guard: all weight updates queued for next animation frame. Never
synchronous with the commit handler.

4. RUNAWAY WEIGHT DOMINANCE
Heavily-tagged node accumulates weight collapsing the field.
Guard: MAX_ACTIVITY cap. Non-negotiable.

5. THRESHOLD OVER-DOMINANCE AT HIGH DENSITY
DENSITY_SCALAR too large allows thresholds to dominate.
Guard: DENSITY_SCALAR must be small. Calibration item.

6. FIELD STARTS EMPTY AT SESSION OPEN
No historical weight initialization. All nodes at base weight.
Resonance lines absent. Field doesn't reflect archive state.
Guard: GET /resonance/node-weights at initialization (step 4).
Historical activity and connections applied before animation starts.

7. NODE-WEIGHTS ENDPOINT UNAVAILABLE
Historical topology cannot load. Field starts at base weights.
Guard: degraded initialization — field functions with base weights
and builds from current session via tagger sync. Not a crash.
Historical topology loads on next successful session open.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

frontend/src/lib/components/ResonanceCanvas.svelte
  Svelte component — physics simulation, node registry, animation
  loop with equilibrium idle, tagger store subscription, canvas
  integrity check, historical weight initialization, historical
  halos. Owns <canvas> element.
  Status: PLANNED

backend/routes/resonance.py
  FastAPI — GET /resonance/node-weights. Computes accumulated
  activity scores and connection topology from full archive tag
  history. Read-only, cacheable.
  Status: PLANNED

backend/services/resonance.py
  Service layer — node weight computation from archive entries,
  connection strength calculation from shared tag history.
  Status: PLANNED
