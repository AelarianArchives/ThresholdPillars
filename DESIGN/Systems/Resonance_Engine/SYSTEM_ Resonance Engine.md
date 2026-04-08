# SYSTEM: Resonance Engine

## /DESIGN/Systems/Resonance_Engine/

### Visual field rendering · live node physics · archive topology

---

## WHAT THIS SYSTEM OWNS

* Visual field rendering — the live node physics simulation showing the archive's signal topology
* Node registry — 62 fixed nodes across 5 tiers, initialized from historical archive data
* Node position calculation and animation loop with equilibrium idle state
* Resonance line drawing between nodes with shared tag history
* Tagger sync — receiving weight updates reactively when tags are deposited
* Pulse animation on tag deposit
* Threshold halos and historical halos
* Canvas integrity — dedicated canvas element, never shared, programmatically verified
* Activity score formula — canonical definition, referenced by Tagger and SGR
* Node weight initialization from archive history at session open

## WHAT THIS SYSTEM DOES NOT OWN

* Tag routing decisions — owned by tagger service
* Database reads or writes — owned by FastAPI service layer. Resonance Engine is read-only.
* Entry data or schema — owned by INTEGRATION DB SCHEMA.md
* Background rendering — if a background visual component exists, it is a separate Svelte component
* Node content or tag vocabulary — owned by TAG VOCABULARY.md
* Audio sonification — separate system (RESONANCE ENGINE AUDIO SPEC.md). Shares node registry and weight state, owns all audio playback, notification routing, and panel UI

---

## CANVAS RULES — NON-NEGOTIABLE

* Resonance Engine renders to its own dedicated `<canvas>` element inside the ResonanceCanvas Svelte component. This element is not shared with any other rendering system.
* If a background visual component exists, it is a separate Svelte component with its own element. Adding a second rendering target to this component produces screen-blend accumulation and void wash.
* ResonanceCanvas is layered via CSS z-index: above background elements, below UI panels.
* Squiggle/resonance line rendering is contained entirely within the ResonanceCanvas canvas. It does not bleed into other rendering contexts.
* Canvas integrity is verified programmatically at initialization — details in RESONANCE ENGINE PHYSICS SPEC.md.

---

## NODE REGISTRY

62 fixed nodes. Count never changes. Five tiers with descending weight and ascending mobility:

**Tier 1 — Origin Nodes (3):** o01 Larimar · o02 Verith · o03 Cael'Thera. Mobile. Heaviest. Hard pull on layers and pillars. Weight grows from tag activity on entries with matching origin affinity.

**Tier 2 — Threshold Nodes (12):** th01–th12. STATIONARY — never move. Fixed weight — never changes from tag activity. Ambient pull on all tiers. Reactive pull increases with neighbor density. Halos scale with neighbor count.

**Tier 3 — Layer Nodes (4):** l01 Coupling · l02 Connectome · l03 Metric · l04 Mirror. Mobile. Hard pull on seeds. Pulled by origins (hard) and thresholds (ambient).

**Tier 4 — Pillar Nodes (3):** p01 TRIA · p02 PRIA · p03 PARA. Mobile. Hard pull on seeds. Pulled by origins (hard) and thresholds (ambient).

**Tier 5 — Seed Nodes (40):** s01–s40. Mobile. Lightest. No outward pull — seeds are pulled only. All 40 visible at all times.

---

## PULL HIERARCHY

THRESHOLDS (stationary) → light ambient influence → ORIGINS → hard pull → LAYERS + PILLARS → hard pull → SEEDS

Influence flows downward only. Thresholds are the single exception — they reach up to touch origin nodes lightly. Seeds exert no outward pull. Differentiation between origins comes from tagger-driven weight growth only, not from base pull.

---

## WEIGHT SYSTEM

The activity score formula is canonical to this system. The Tagger system and SGR reference it — they do not define it.

    activityScore = Σ(tagWeight × e^(-ageDays / HALF_LIFE))
    totalWeight   = baseWeight + clamp(activityScore, 0, MAX_ACTIVITY)

HALF_LIFE and MAX_ACTIVITY are named constants defined in the physics spec. When calibration changes them, it changes in one place and all referencing systems inherit it.

Weight decays naturally — recent activity matters more than old. Thresholds do not participate in weight growth.

Full formulas, derived physics values, and calibration constants in RESONANCE ENGINE PHYSICS SPEC.md.

---

## NODE WEIGHT INITIALIZATION

At session open, the field reflects the archive's accumulated history — not zero. The component initializes base weights, then applies historical activity scores and connection topology from a single API call before the animation loop starts.

Without this, the Resonance Engine would be a session-scoped visualization of recent activity, not a representation of the archive's accumulated field. That gap is closed by design.

Details in RESONANCE ENGINE PHYSICS SPEC.md.

---

## RESONANCE LINES

Lines render only between nodes that share active tag history — at least one confirmed tag deposit that activated both nodes. No phantom connections. No faint potential connections. A line not earned by real field data does not render.

Line weight is proportional to shared tag connection strength. Stronger history = thicker, more active squiggle.

Lines are initialized from archive history at session open (same endpoint as node weights) and updated in real-time by the tagger sync.

---

## VISUAL ENHANCEMENTS

**Pulse on tag deposit:** All nodes affected by a new tag pulse outward briefly. Signal, not spectacle. Affected nodes: seed, layer, threshold, and pillar the tag routes through, plus origin node if entry carries matching originId.

**Threshold halos:** Each threshold emits a visible circular halo. Radius scales with neighbor density. Low opacity — ambient field condition, not dominant visual.

**Historical halos:** Seeds with significant historical activity that has decayed below the display threshold show a faint ring — smaller and subtler than threshold halos. Intensity proportional to peak historical activity score, fading over a longer window than the decay formula. Sage sees at a glance which parts of the field have deep history even when currently quiet. Distinguishes "quiet because nothing happened" from "quiet because what happened was long ago." Purely visual — no schema changes, computed from the same tag history the node-weights endpoint returns.

---

## TAGGER SYNC

The ResonanceCanvas component subscribes to the tagger Svelte store and reacts when new tag deposits arrive. It receives — it does not pull. Weight updates do not block the UI thread.

The sync triggers node weight recalculation, physics update, pulse animation, and resonance line re-evaluation. Full sequence in RESONANCE ENGINE PHYSICS SPEC.md.

---

## AUDIO SIBLING

The Resonance Engine has an audio layer — a clip-based notification and sonification system sharing the same node registry and weight state as the visual engine. Separate system, shared data.

The visual engine does not own audio. The audio engine reads from the same tagger sync payload and node weight calculations that drive the visual field. No changes to the visual system are required — the data is already available at the sync points.

52 notification events mapped to 15 notifier nodes (3 origins + 12 thresholds) + s20 Rupture three-tier system. Global engine persists across page navigation. Floating panel for controls and waveform visualization.

Full spec in RESONANCE ENGINE AUDIO SPEC.md.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| frontend/src/lib/components/ResonanceCanvas.svelte | Svelte component — physics simulation, node registry, animation loop, tagger store subscription, canvas element | PLANNED |
| backend/routes/resonance.py | FastAPI — GET /resonance/node-weights endpoint for historical weight initialization | PLANNED |

All physics mechanics — formulas, node tables, calibration constants, animation loop, equilibrium, sequences, failure modes — in RESONANCE ENGINE PHYSICS SPEC.md.
