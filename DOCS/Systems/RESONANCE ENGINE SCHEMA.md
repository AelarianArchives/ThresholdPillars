╔══════════════════════════════════════════════════════════════╗ ║ RESONANCE ENGINE SCHEMA · v1 ║ ║ /DOCS/systems/resonance\\\_engine\\\_schema\\\_v1.md ║ ╚══════════════════════════════════════════════════════════════╝



OWNERSHIP BOUNDARIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



OWNS Visual field rendering — live node physics simulation Node position calculation and animation loop Resonance line drawing between nodes with active shared tag history Tagger sync — receiving weight updates on tag deposit Pulse animation on tag deposit Threshold halo rendering Its own `<canvas>` element within the ResonanceCanvas Svelte component



DOES NOT OWN Tag routing decisions — owned by tagger store (Svelte) backed by FastAPI `/tagger/` endpoint Database reads or writes — owned by FastAPI service layer (PostgreSQL via API) Entry data or schema — owned by FastAPI models and service layer Background rendering — if a background visual component exists, it is a separate Svelte component. Does not belong to this system Node content or tag vocabulary — owned by TAG VOCABULARY.md / backend tag vocabulary model



CANVAS RULES — NON-NEGOTIABLE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



1\. Resonance Engine renders to its own dedicated `<canvas>` element inside the ResonanceCanvas Svelte component. This element is not shared with any other rendering system.



2\. If a background visual component exists, it is a separate Svelte component with its own element. Adding a second rendering target to this component produces screen-blend accumulation and void wash.



3\. ResonanceCanvas component is layered via CSS z-index: above background elements, below UI panels.



5\. Squiggle/resonance line rendering is contained entirely within the Resonance Engine canvas. It does not bleed into other rendering contexts.



ResonanceCanvas component CSS z-index positioning: PLANNED — defined relative to other UI layers.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ NODE REGISTRY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



Total nodes: 62 (fixed — count never changes)



┌─────────────────────────────────────────────────────────┐ │ TIER 1 — ORIGIN NODES (super nodes) count: 3 │ ├──────┬──────────┬──────────┬────────────────────────────┤ │ ID │ Name │ Mobility │ Notes │ ├──────┼──────────┼──────────┼────────────────────────────┤ │ o01 │ Larimar │ mobile │ │ │ o02 │ Verith │ mobile │ │ │ o03 │ Cael'Thera │ mobile │ │ └──────┴──────────┴──────────┴────────────────────────────┘



┌─────────────────────────────────────────────────────────┐ │ TIER 2 — THRESHOLD NODES (gravity nodes) count: 12 │ ├──────┬──────────┬──────────┬────────────────────────────┤ │ ID │ Name │ Mobility │ Notes │ ├──────┼──────────┼──────────┼────────────────────────────┤ │ th01 │ — │ STATIC │ │ │ th02 │ — │ STATIC │ │ │ th03 │ — │ STATIC │ │ │ th04 │ — │ STATIC │ │ │ th05 │ — │ STATIC │ │ │ th06 │ — │ STATIC │ │ │ th07 │ — │ STATIC │ │ │ th08 │ — │ STATIC │ │ │ th09 │ — │ STATIC │ │ │ th10 │ — │ STATIC │ │ │ th11 │ — │ STATIC │ │ │ th12 │ — │ STATIC │ │ └──────┴──────────┴──────────┴────────────────────────────┘ Threshold names are defined in TAG VOCABULARY.md / backend tag vocabulary model.



┌─────────────────────────────────────────────────────────┐ │ TIER 3 — LAYER NODES count: 4 │ ├──────┬──────────────┬──────────┬────────────────────── │ │ ID │ Name │ Mobility │ Notes │ ├──────┼──────────────┼──────────┼────────────────────── │ │ l01 │ Coupling │ mobile │ │ │ l02 │ Connectome │ mobile │ │ │ l03 │ Metric │ mobile │ │ │ l04 │ Mirror │ mobile │ │ └──────┴──────────────┴──────────┴────────────────────── ┘



┌─────────────────────────────────────────────────────────┐ │ TIER 4 — PILLAR NODES count: 3 │ ├──────┬──────────────┬──────────┬────────────────────── │ │ ID │ Name │ Mobility │ Notes │ ├──────┼──────────────┼──────────┼────────────────────── │ │ p01 │ TRIA │ mobile │ │ │ p02 │ PRIA │ mobile │ │ │ p03 │ PARA │ mobile │ │ └──────┴──────────────┴──────────┴────────────────────── ┘



┌─────────────────────────────────────────────────────────┐ │ TIER 5 — SEED NODES (cluster nodes) count: 40 │ ├──────┬──────────┬──────────┬────────────────────────────┤ │ ID │ Name │ Mobility │ Notes │ ├──────┼──────────┼──────────┼────────────────────────────┤ │ s01 │ — │ mobile │ all 40 visible at all times│ │ s02 │ — │ mobile │ │ │ s03 │ — │ mobile │ │ │ s04 │ — │ mobile │ │ │ s05 │ — │ mobile │ │ │ s06 │ — │ mobile │ │ │ s07 │ — │ mobile │ │ │ s08 │ — │ mobile │ │ │ s09 │ — │ mobile │ │ │ s10 │ — │ mobile │ │ │ s11 │ — │ mobile │ │ │ s12 │ — │ mobile │ │ │ s13 │ — │ mobile │ │ │ s14 │ — │ mobile │ │ │ s15 │ — │ mobile │ │ │ s16 │ — │ mobile │ │ │ s17 │ — │ mobile │ │ │ s18 │ — │ mobile │ │ │ s19 │ — │ mobile │ │ │ s20 │ — │ mobile │ │ │ s21 │ — │ mobile │ │ │ s22 │ — │ mobile │ │ │ s23 │ — │ mobile │ │ │ s24 │ — │ mobile │ │ │ s25 │ — │ mobile │ │ │ s26 │ — │ mobile │ │ │ s27 │ — │ mobile │ │ │ s28 │ — │ mobile │ │ │ s29 │ — │ mobile │ │ │ s30 │ — │ mobile │ │ │ s31 │ — │ mobile │ │ │ s32 │ — │ mobile │ │ │ s33 │ — │ mobile │ │ │ s34 │ — │ mobile │ │ │ s35 │ — │ mobile │ │ │ s36 │ — │ mobile │ │ │ s37 │ — │ mobile │ │ │ s38 │ — │ mobile │ │ │ s39 │ — │ mobile │ │ │ s40 │ — │ mobile │ │ └──────┴──────────┴──────────┴────────────────────────────┘ Seed names defined in TAG VOCABULARY.md / backend tag vocabulary model.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TIER DEFINITIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



TIER 1 — ORIGIN NODES Count: 3 Mobility: mobile Base weight: BASE\\\_WEIGHT\\\_ORIGIN — heaviest tier Pull: hard pull on layers and pillars Influenced by: thresholds (light ambient only) Weight growth: tagger-driven grows from tag activity on entries with matching origin\\\_affinity Pull balance: base pull is neutral between all three origins. Differentiation comes from tagger-driven weight growth only.



TIER 2 — THRESHOLD NODES Count: 12 Mobility: STATIONARY — never move Base weight: BASE\\\_WEIGHT\\\_THRESHOLD — high fixed never changes from tag activity Pull: field-wide ambient pull on all tiers light influence on origin nodes reactive pull increases with neighbor density — see threshold reactive pull does not dominate — weighted carefully Halo: visible field radius emitted from each threshold. Scale increases with neighbor density. Weight growth: NONE — fixed permanently



TIER 3 — LAYER NODES Count: 4 Mobility: mobile Base weight: BASE\\\_WEIGHT\\\_LAYER (\\~0.5 × BASE\\\_WEIGHT\\\_ORIGIN) Pull: hard pull on seeds Influenced by: origin nodes (hard pull) thresholds (ambient) Weight growth: tagger-driven grows from tag activity routed through each layer



TIER 4 — PILLAR NODES Count: 3 Mobility: mobile Base weight: BASE\\\_WEIGHT\\\_PILLAR (\\~0.5 × BASE\\\_WEIGHT\\\_ORIGIN) Pull: hard pull on seeds Influenced by: origin nodes (hard pull) thresholds (ambient) Weight growth: tagger-driven grows from tag activity assigned to each pillar



TIER 5 — SEED NODES Count: 40 Mobility: mobile Base weight: BASE\\\_WEIGHT\\\_SEED — lightest tier Pull: none — seeds are pulled only Influenced by: layers (hard pull) pillars (hard pull) thresholds (ambient) origins (ambient cascade) Visibility: all 40 visible at all times Weight growth: tagger-driven grows from tag activity within each seed cluster Pull response: seeds respond to the combined pull of their layer affinity and pillar affinity simultaneously



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PULL HIERARCHY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



THRESHOLDS (stationary, ambient field-wide) ↓ light ambient influence ORIGIN NODES ↓ hard pull LAYERS \\+ PILLARS ↓ hard pull SEEDS



Rules: — Influence flows downward only — Thresholds are the single exception: ambient reach upward touches origin nodes lightly — Seeds exert no outward pull — Layers and pillars pull seeds independently — seeds respond to combined pull of layer affinity and pillar affinity simultaneously



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ WEIGHT SYSTEM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



BASE WEIGHT CONSTANTS ━━━━━━━━━━━━━━━━━━━━━ BASE\\\_WEIGHT\\\_ORIGIN — heaviest tier (PLANNED: value set at calibration) BASE\\\_WEIGHT\\\_THRESHOLD — high fixed, never updated by tag activity (PLANNED: value set at calibration) BASE\\\_WEIGHT\\\_LAYER — \\~0.5 × BASE\\\_WEIGHT\\\_ORIGIN (PLANNED: value set at calibration) BASE\\\_WEIGHT\\\_PILLAR — independent constant, initial value = BASE\\\_WEIGHT\\\_LAYER (PLANNED: value set at calibration) BASE\\\_WEIGHT\\\_SEED — lightest tier (PLANNED: value set at calibration)



Ratios above are fixed constraints. Exact values determined at calibration session.



TAGGER-DRIVEN WEIGHT GROWTH ━━━━━━━━━━━━━━━━━━━━━━━━━━━ activityScore \\= Σ(tagWeight × e^(-ageDays / HALF\\\_LIFE))



HALF\\\_LIFE     \\= 7 days  

ageDays       \\= days since the entry carrying that tag  

&nbsp;               was deposited  

MAX\\\_ACTIVITY  \\= cap on activity contribution.  

&nbsp;               Prevents runaway dominance.  

&nbsp;               Non-negotiable. PLANNED: value set  

&nbsp;               at calibration.



totalWeight   \\= baseWeight  

&nbsp;               \\+ clamp(activityScore, 0, MAX\\\_ACTIVITY)



Weight decays naturally — recent activity matters more than old activity. Thresholds do not participate in weight growth. BASE\\\_WEIGHT\\\_THRESHOLD never changes.



DERIVED PHYSICS VALUES ━━━━━━━━━━━━━━━━━━━━━━ attractRadius \\= totalWeight × RADIUS\\\_SCALAR pullStrength \\= totalWeight × PULL\\\_SCALAR



RADIUS\\\_SCALAR  — calibration constant.  

&nbsp;                Starting reference: 18px.  

&nbsp;                Subject to calibration.  

PULL\\\_SCALAR    — calibration constant.  

&nbsp;                Starting reference: 0.04  

&nbsp;                acceleration/frame.  

&nbsp;                Subject to calibration.



THRESHOLD REACTIVE PULL ━━━━━━━━━━━━━━━━━━━━━━━ neighborCount \\= count of nodes currently within threshold attractRadius pullMultiplier \\= 1 \\+ (neighborCount × DENSITY\\\_SCALAR) effectivePull \\= BASE\\\_WEIGHT\\\_THRESHOLD × pullMultiplier



DENSITY\\\_SCALAR  — small value. Prevents thresholds from  

&nbsp;                 dominating at high density.  

&nbsp;                 PLANNED: value set at calibration.



Thresholds shape the field. They do not own it.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ REPULSION MECHANICS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



Applies to: same-tier nodes only Model: inverse square repulsion Formula: repulsionForce \\= REPULSION\\\_CONSTANT / distance² Activation: below MIN\\\_NODE\\\_DISTANCE



REPULSION\\\_CONSTANT — PLANNED: calibration MIN\\\_NODE\\\_DISTANCE — PLANNED: calibration



Rules: — Repulsion does not override pull hierarchy. It only prevents physical collapse. — Thresholds are stationary. Repulsion does not apply to them. — Effect: sharp repulsion at close range, weak at distance. Prevents cluster collapse without hardcoded spacing.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ RESONANCE LINES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



CONNECTION CRITERIA ━━━━━━━━━━━━━━━━━━━ — Lines render only between nodes that share active tag history. — Active tag history \\= at least one confirmed tag deposit that activated both nodes. — No phantom connections. A line not earned by real field data does not render. — Faint or potential connections are not shown.



LINE APPEARANCE ━━━━━━━━━━━━━━━ — Line weight proportional to shared tag connection strength. — Stronger shared history \\= thicker, more active squiggle. — Weak shared history \\= thin, slower squiggle. — Squiggle amplitude and frequency: PLANNED — calibrated to be readable without visual noise.



RENDERING RULES ━━━━━━━━━━━━━━━ — Squiggle rendering contained within Resonance Engine canvas only. — Lines redrawn each animation frame based on current node positions. — When a node moves, all its resonance lines move with it. — Squiggle drawing is the last operation in each frame. It is expensive — running it last protects UI rendering from bleed.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ VISUAL ENHANCEMENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



PULSE ON TAG DEPOSIT ━━━━━━━━━━━━━━━━━━━━ — When a new tag is deposited, all affected nodes pulse outward briefly. — Pulse sequence: expand slightly → contract to normal size → settle. — Duration: short — signal, not spectacle. — Affected nodes: the seed, layer, threshold, and pillar the tag is routed through. — Origin node pulses if the entry carries a matching origin\\\_id.



THRESHOLD HALOS ━━━━━━━━━━━━━━━ — Each stationary threshold emits a visible circular halo. — Halo radius scales with neighbor density — more nodes nearby \\= larger halo. — Halo opacity: low — ambient field condition, not dominant visual.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TAGGER SYNC CONTRACT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



PAYLOAD STRUCTURE ━━━━━━━━━━━━━━━━━ On every confirmed tag deposit, Resonance Engine receives:



{  

&nbsp; tags:      \\\[{ id, seed\\\_id, layer\\\_id, threshold\\\_id,  

&nbsp;               pillar\\\_id, weight }\\],  

&nbsp; phase_state: string | null,  

&nbsp;            (canonical threshold name or null)  

&nbsp; originId: 'o01' | 'o02' | 'o03' | null,  

&nbsp; timestamp: ISO string  

}



SYNC TRIGGER SEQUENCE ━━━━━━━━━━━━━━━━━━━━━ The tagger store (Svelte) is the source of tag deposit events. The ResonanceCanvas component subscribes to the tagger store and reacts when new deposits arrive. 1\\. Tagger store updates with confirmed tag deposit 2\\. ResonanceCanvas component's store subscription fires reactively 3\\. Affected node weights recalculated 4\\. Field position recalculation queued for next animation frame 5\\. Pulse animation triggered on affected nodes 6\\. Resonance lines re-evaluated for new or updated connections



SYNC RULES ━━━━━━━━━━ — Weight updates do not block the UI thread. Queued and processed on animation frame. — Resonance Engine does not call tagger service directly. It subscribes to the tagger store reactively. It receives. It does not pull. — Resonance Engine does not write to the database. Weight state is derived at runtime from entry data fetched via API.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ANIMATION LOOP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



— Runs continuously while ResonanceCanvas component is mounted. Uses requestAnimationFrame, managed by component lifecycle (onMount starts, onDestroy stops). — Frame sequence (strict order): 1\\. Recalculate forces 2\\. Update node positions 3\\. Redraw nodes 4\\. Redraw halos 5\\. Redraw resonance lines (last — most expensive) — Frame rate target: 60fps. Degrade gracefully if performance requires. — Physics simulation is damped. Nodes settle into equilibrium rather than oscillating indefinitely. — DAMPING\\\_CONSTANT: PLANNED — calibration variable.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ KNOWN FAILURE MODES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



1\. CANVAS CONFLICT WITH OTHER RENDERING COMPONENTS ResonanceCanvas must render to its own `<canvas>` element only. Any attempt to share a canvas with another rendering system (e.g. a background visual component) destroys the background and produces void wash. Guard: component owns its canvas element via Svelte `bind:this` — no external reference sharing. Canvas reference is captured once at onMount and never reassigned.



2\. SQUIGGLE RENDERING BLEEDING Squiggle drawing is expensive. If not contained to its own canvas and run last in the frame, it bleeds into UI rendering. Resonance line drawing is always the final operation in the animation frame.



3\. WEIGHT UPDATES BLOCKING UI THREAD Node weight recalculation must be queued, not synchronous with the commit handler. A deposit that freezes the UI is a broken sync contract.



4\. RUNAWAY WEIGHT DOMINANCE Without MAX\\\_ACTIVITY cap, a heavily-tagged node can accumulate weight that collapses the field around it. MAX\\\_ACTIVITY cap is non-negotiable.



5\. THRESHOLD OVER-DOMINANCE AT HIGH DENSITY DENSITY\\\_SCALAR must be small. Thresholds shape the field. They do not own it.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CALIBRATION VARIABLES — ALL PLANNED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



BASE\\\_WEIGHT\\\_ORIGIN — heaviest tier base value BASE\\\_WEIGHT\\\_THRESHOLD — fixed threshold base value BASE\\\_WEIGHT\\\_LAYER — layer \\+ pillar base value BASE\\\_WEIGHT\\\_SEED — lightest tier base value MAX\\\_ACTIVITY — activity score cap RADIUS\\\_SCALAR — ref: 18px PULL\\\_SCALAR — ref: 0.04 accel/frame REPULSION\\\_CONSTANT — inverse square repulsion MIN\\\_NODE\\\_DISTANCE — repulsion activation threshold DENSITY\\\_SCALAR — threshold reactive pull scalar DAMPING\\\_CONSTANT — physics damping Squiggle algorithm (amplitude · frequency · frame method)



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PUBLIC API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No external public API. The ResonanceCanvas Svelte component manages its own
lifecycle. Initialization runs automatically on component mount (onMount):
acquires canvas reference via bind:this, initializes node registry with base
weights, subscribes to tagger store, and starts the animation loop. Cleanup
runs on component destroy (onDestroy). No external init call required.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FILES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



frontend/src/lib/components/ResonanceCanvas.svelte — Svelte component: physics simulation, node registry, animation loop, tagger store subscription, owns `<canvas>` element. Status: PLANNED

