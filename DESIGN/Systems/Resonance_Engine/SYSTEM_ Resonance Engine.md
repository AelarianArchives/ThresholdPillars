# **SYSTEM: Resonance Engine**

## **resonance\_engine\_system.md**

### **/DESIGN/systems/**

---

## **WHAT THIS SYSTEM OWNS**

* Visual field rendering — the live node physics simulation  
* Node position calculation and animation loop  
* Resonance line drawing between nodes with active shared tag history  
* Tagger sync — receiving weight updates when tags are deposited  
* Pulse animation on tag deposit  
* Threshold halo rendering  
* Its own `<canvas>` element within the ResonanceCanvas Svelte component

## **WHAT THIS SYSTEM DOES NOT OWN**

* Tag routing decisions — owned by tagger store (Svelte) backed by FastAPI `/tagger/` endpoint  
* Database reads or writes — owned by FastAPI service layer (PostgreSQL via API)  
* Entry data or schema — owned by FastAPI models and service layer  
* Background rendering — if a background visual component exists, it is a separate Svelte component. Does not belong to this system.  
* Node content or tag vocabulary — owned by TAG VOCABULARY.md / backend tag vocabulary model

---

## **CANVAS RULES — NON-NEGOTIABLE**

* Resonance Engine renders to its own dedicated `<canvas>` element inside the ResonanceCanvas Svelte component. This element is not shared with any other rendering system.  
* If a background visual component exists, it is a separate Svelte component with its own element. Adding a second rendering target to this component produces screen-blend accumulation and void wash.  
* ResonanceCanvas component is layered via CSS z-index: above background elements, below UI panels.  
* Squiggle/resonance line rendering is contained entirely within the ResonanceCanvas component's canvas. It does not bleed into other rendering contexts.

---

## **NODE REGISTRY**

### **Tier 1 — Origin Nodes (super nodes)**

Count:        3  
IDs:          o01 Larimar · o02 Verith · o03 Cael'Thera  
Mobility:     mobile  
Base weight:  heaviest tier — value TBD at calibration  
Pull:         hard pull on layers and pillars  
Influenced by: thresholds (light ambient influence only)  
Weight growth: tagger-driven — grows from tag activity  
               on entries with matching origin affinity

### **Tier 2 — Threshold Nodes (gravity nodes)**

Count:        12  
IDs:          th01–th12  
Mobility:     STATIONARY — never move  
Base weight:  high fixed — never changes from tag activity  
Pull:         field-wide ambient pull on all node tiers  
              light influence on origin nodes  
              reactive pull increases with neighbor density  
              does not dominate — weighted carefully  
Halo:         visible field radius emitted from each threshold  
              halo scale increases with neighbor density  
Weight growth: NONE — fixed permanently

### **Tier 3 — Layer Nodes**

Count:        4  
IDs:          l01 Coupling · l02 Connectome  
              l03 Metric · l04 Mirror  
Mobility:     mobile  
Base weight:  \~half of origin node base weight  
Pull:         hard pull on seeds  
Influenced by: origin nodes (hard pull), thresholds (ambient)  
Weight growth: tagger-driven — grows from tag activity  
               routed through each layer

### **Tier 4 — Pillar Nodes**

Count:        3  
IDs:          p01 TRIA · p02 PRIA · p03 PARA  
Mobility:     mobile  
Base weight:  \~half of origin node base weight  
Pull:         hard pull on seeds  
Influenced by: origin nodes (hard pull), thresholds (ambient)  
Weight growth: tagger-driven — grows from tag activity  
               assigned to each pillar

### **Tier 5 — Seed Nodes (cluster nodes)**

Count:        40  
IDs:          s01–s40  
Mobility:     mobile  
Base weight:  lightest tier  
Pull:         none — seeds are pulled only  
Influenced by: layers (hard), pillars (hard),  
               thresholds (ambient), origins (ambient cascade)  
Visibility:   all 40 visible at all times  
Weight growth: tagger-driven — grows from tag activity  
               within each seed cluster

---

## **PULL HIERARCHY**

THRESHOLDS (stationary)  
  ↓ light ambient influence  
ORIGIN NODES  
  ↓ hard pull  
LAYERS \+ PILLARS  
  ↓ hard pull  
SEEDS

* Influence flows downward only  
* Thresholds are the single exception — they reach up to touch origin nodes lightly  
* Seeds exert no outward pull  
* Origin nodes pull layers and pillars with equal strength — base pull is neutral between the three origins. Differentiation comes from tagger-driven weight growth only.  
* Layers and pillars pull seeds independently — seeds respond to the combined pull of their layer affinity and pillar affinity simultaneously

---

## **WEIGHT SYSTEM**

### **Base Weight Values (calibration targets)**

Origin nodes    — BASE\_WEIGHT\_ORIGIN    (heaviest)  
Thresholds      — BASE\_WEIGHT\_THRESHOLD (high fixed, never updated)  
Layers          — BASE\_WEIGHT\_LAYER     (\~0.5 × BASE\_WEIGHT\_ORIGIN)  
Pillars         — BASE\_WEIGHT\_PILLAR    (independent, initial value = BASE\_WEIGHT\_LAYER)  
Seeds           — BASE\_WEIGHT\_SEED      (lightest)

Exact values determined at calibration. Ratios above are fixed constraints.

### **Tagger-Driven Weight Growth**

activityScore   \= Σ(tagWeight × e^(-ageDays / HALF\_LIFE))  
HALF\_LIFE       \= 7 days  
totalWeight     \= baseWeight \+ clamp(activityScore, 0, MAX\_ACTIVITY)

* MAX\_ACTIVITY: caps activity contribution to prevent runaway dominance  
* ageDays: days since the entry carrying that tag was deposited  
* Weight decays naturally — recent activity matters more than old

### **Derived Physics Values**

attractRadius   \= totalWeight × RADIUS\_SCALAR  
pullStrength    \= totalWeight × PULL\_SCALAR

RADIUS\_SCALAR and PULL\_SCALAR are calibration constants. Starting reference from prior implementation: 18px and 0.04 acceleration/frame respectively. Subject to calibration.

### **Threshold Reactive Pull**

* Threshold base weight is fixed  
* Effective pull increases when neighbor node density within attractRadius is high  
* Neighbor density \= count of nodes currently within threshold attractRadius  
* Pull multiplier \= 1 \+ (neighborCount × DENSITY\_SCALAR)  
* DENSITY\_SCALAR: small value, prevents thresholds from dominating at high density

---

## **REPULSION MECHANICS**

Applies to:     same-tier nodes only  
Model:          inverse square repulsion  
Formula:        repulsionForce \= REPULSION\_CONSTANT / distance²  
Activation:     below MIN\_NODE\_DISTANCE  
Effect:         nodes repel sharply at close range, weakly at distance  
Purpose:        prevents cluster collapse without hardcoded spacing

* MIN\_NODE\_DISTANCE and REPULSION\_CONSTANT are calibration constants  
* Repulsion does not override pull hierarchy — it only prevents physical collapse  
* Thresholds are stationary — repulsion does not apply to them

---

## **RESONANCE LINES**

### **Connection Criteria**

* Lines render only between nodes that share active tag history  
* Active tag history \= at least one confirmed tag deposit that activated both nodes  
* No phantom connections — a line that has not been earned by real field data does not render  
* Faint/phantom potential connections are not shown

### **Line Weight and Appearance**

* Line weight proportional to shared tag connection strength  
* Stronger shared history \= thicker, more active squiggle  
* Weak shared history \= thin, slower squiggle  
* Squiggle amplitude and frequency are calibrated to be readable without visual noise

### **Rendering Rules**

* Squiggle rendering is contained within Resonance Engine canvas only  
* Lines are redrawn each animation frame based on current node positions  
* When a node moves, all its resonance lines move with it  
* Lines are contained to the Resonance Engine canvas — they do not bleed into other rendering contexts

---

## **VISUAL ENHANCEMENTS**

### **Pulse on Tag Deposit**

* When a new tag is deposited, all nodes affected by that tag pulse outward briefly  
* Pulse: expand slightly → contract back to normal size → settle  
* Duration: short — signal, not spectacle  
* Affected nodes: the seed, layer, threshold, and pillar the tag is routed through  
* Origin node pulses if entry carries matching originId

### **Threshold Halos**

* Each stationary threshold emits a visible circular halo  
* Halo radius scales with neighbor density — more nodes nearby \= larger halo  
* Halo opacity is low — ambient field condition, not dominant visual

---

## **TAGGER SYNC CONTRACT**

### **What Tagger Hands Off**

On every confirmed tag deposit, Resonance Engine receives:

{  
  tags:       \[{id, seed\_id, layer\_id, threshold\_id, pillar\_id, weight}\],  
  phase_state: string | null,  
  originId:   'o01' | 'o02' | 'o03' | null,  
  timestamp:  ISO string  
}

### **Sync Trigger Sequence**

The Resonance Engine owns the reactive update sequence. The tagger store (Svelte)
is the source of tag deposit events. The ResonanceCanvas component subscribes to
the tagger store and reacts when new deposits arrive.

1. Tagger store updates with confirmed tag deposit.  
   Payload: `{ tags, phase_state, originId, timestamp }`.  
2. ResonanceCanvas component's store subscription fires reactively.  
3. Affected node weights recalculated. For each tag: seed\_id, layer\_id,  
   threshold\_id, and pillar\_id node weights updated per activity score formula.  
4. If originId present: matching origin node weight updated.  
5. Physics recalculation queued for next animation frame. Does not block UI thread.  
6. Pulse animation triggered on all affected nodes.  
7. Resonance lines re-evaluated for new or updated connections.

### **Sync Rules**

* Weight updates do not block the UI thread — queued and processed on animation frame  
* Resonance Engine does not call tagger service directly — it subscribes to the tagger store reactively. It receives, it does not pull  
* Resonance Engine does not write to the database — weight state is derived at runtime from entry data fetched via API

---

## **ANIMATION LOOP**

* Runs continuously while archive is open  
* Each frame: recalculate forces → update positions → redraw nodes → redraw halos → redraw resonance lines  
* Frame rate target: 60fps — degrade gracefully if performance requires  
* Physics simulation is damped — nodes settle into equilibrium rather than oscillating indefinitely  
* Damping constant: calibration variable

---

## **SEQUENCES**

### **INITIALIZATION SEQUENCE — strict order**

1. ResonanceCanvas Svelte component mounts (`onMount` lifecycle).
2. `<canvas>` element reference acquired via Svelte `bind:this`. Canvas context acquired. Canvas sized to viewport.
3. Node registry initialized — all 5 tiers built with base weight values.
4. Tagger store subscription established (Svelte reactive subscription).
5. Animation loop started via `requestAnimationFrame`. Runs continuously while component is mounted.
6. On component destroy (`onDestroy`): animation loop stopped, store subscription released.

Failure at step 2 (canvas element not available): component cannot initialize rendering. Guard:
  `bind:this` guarantees element availability at `onMount` — no timing risk.
Failure at step 4 (store subscription fails): engine never receives tag deposit
  events. Weight updates never arrive. Guard: subscription established inside
  `onMount` — no external call required.

### **TAG DEPOSIT SYNC SEQUENCE — fires on tagger store update**

1. Tagger store update received reactively. Payload extracted:
   `{ tags, phase_state, originId, timestamp }`.
2. For each tag: validate seed\_id, layer\_id, threshold\_id, and pillar\_id present.
   Skip tags with incomplete routing chain — they cannot update nodes.
3. Affected node weights recalculated per activity score formula.
4. If originId present: matching origin node weight updated.
5. Physics recalculation queued for next animation frame. Does not block UI thread.
6. Pulse animation triggered on all affected nodes (seed, layer, threshold,
   pillar for each tag; origin node if originId present).
7. Resonance lines re-evaluated for new or updated connections.

Failure at step 2 (malformed payload or missing routing fields): affected tags
  skipped. Remaining valid tags processed. Guard: per-tag validation before any
  weight write. A tag without a complete routing chain produces no node update.
Failure at step 5 (animation frame unavailable): physics update deferred to next
  available frame. No data loss.

---

## **PUBLIC API**

**No external public API.** The ResonanceCanvas Svelte component manages its own
lifecycle. Initialization runs automatically on component mount (`onMount`):
acquires canvas reference via `bind:this`, initializes node registry with base
weights, subscribes to tagger store, and starts the animation loop. Cleanup
runs on component destroy (`onDestroy`). No external init call required.

---

## **KNOWN FAILURE MODES**

1. **Canvas conflict with other rendering components** — ResonanceCanvas must render to its own `<canvas>` element only. Any attempt to share a canvas with another rendering system (e.g. a background visual component) destroys the background and produces void wash. Guard: component owns its element via `bind:this` — no external reference sharing.

2. **Squiggle rendering breaking other systems** — Squiggle drawing is expensive. If not contained to its own canvas and animation frame budget, it bleeds into UI rendering. Keep resonance line drawing as the last operation in each frame.

3. **Weight updates blocking UI thread** — Node weight recalculation must be queued, not synchronous with the commit handler. A deposit that freezes the UI is a broken sync contract.

4. **Runaway weight dominance** — Without MAX\_ACTIVITY cap, a single heavily-tagged node can accumulate weight that collapses the field around it. Cap is non-negotiable.

5. **Threshold over-dominance at high density** — DENSITY\_SCALAR must be small. Thresholds shape the field. They do not own it.

---

## **PLANNED**

* PLANNED: exact base weight values — determined at calibration session  
* PLANNED: RADIUS\_SCALAR · PULL\_SCALAR · REPULSION\_CONSTANT · MIN\_NODE\_DISTANCE · DENSITY\_SCALAR · DAMPING\_CONSTANT — all calibration variables, values TBD  
* PLANNED: squiggle rendering algorithm — amplitude, frequency, frame update method  
* PLANNED: ResonanceCanvas component CSS z-index positioning relative to other UI layers

---

## **FILES**

| File | Role | Status |
| ----- | ----- | ----- |
| `frontend/src/lib/components/ResonanceCanvas.svelte` | Svelte component — physics simulation, node registry, animation loop, tagger store subscription, owns `<canvas>` element | PLANNED |

