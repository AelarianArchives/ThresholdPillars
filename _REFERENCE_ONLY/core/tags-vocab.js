// ┌─────────────────────────────────────────────────────────────────────────────┐
// │  ⬡  GUARDIAN NOTE — tags-vocab.js                                          │
// │  Role: Canonical tag vocabulary. 200 tags across 20 Seeds. 47 field nodes. │
// │  READ-ONLY at runtime. Never modified by tagger, UI, or entries.           │
// │                                                                             │
// │  FOUR EXPORTS used by tagger.js (always import all four):                  │
// │    TAG_VOCAB_BY_SEED — nested master, keyed by seed ID (s01–s20)           │
// │    TAG_VOCAB_FLAT    — flat array, all 200 tags for search/iteration        │
// │    ARC_SEED_TAGS     — seed metadata for UI and tagger context (20 items)  │
// │    NODE_REGISTRY     — 47 field nodes with baseWeight, type, mobile flag   │
// │                                                                             │
// │  NAME COLLISION WARNING:                                                    │
// │    ARC_SEED_TAGS (here) = the 20 Seeds of Emergence (s01–s20)             │
// │    ARC_CYCLES (schema.js) = the 15 temporal arc cycles                     │
// │    These are COMPLETELY DIFFERENT systems. Never use interchangeably.       │
// │                                                                             │
// │  DUPLICATE TAG POLICY:                                                      │
// │    9 tags appear in more than one seed. Each instance has its own routing. │
// │    When applied, tag activates ONLY the seed it was tagged under.          │
// │    Duplicates: semantic_coherence, world_model_grounding_via_action,       │
// │      narrative_continuity, social_signal_filtering, confidence_estimation,  │
// │      uncertainty_representation, internal_state_influence_on_action,       │
// │      phase_locking, met_stability.                                          │
// │                                                                             │
// │  NODE REGISTRY:                                                             │
// │    47 nodes total. mobile: true = one of 7 dynamic layer/pillar nodes.    │
// │    baseWeight drives field physics calculations in tagger.js.              │
// │    Do not alter baseWeight values without re-calibrating field physics.    │
// └─────────────────────────────────────────────────────────────────────────────┘

// =============================================================================
//  TAGS-VOCAB.JS — Aelarian Archive Canonical Tag Vocabulary
//  Source of truth for all 200 tags across 20 Seeds of Emergence.
//
//  Structure:
//    TAG_VOCAB        — nested master, keyed by seed ID
//    TAG_VOCAB_FLAT   — flat array derived from TAG_VOCAB, all 200 tags
//    NODE_REGISTRY    — all 47 field nodes with IDs, weights, types
//    ARC_SEED_TAGS    — seed metadata for UI and tagger context
//
//  Tag object shape:
//    {
//      id:        string   — snake_case tag identifier
//      seed:      string   — s01–s20
//      layer:     string   — l01–l04
//      threshold: string   — t01–t12
//      pillar:    string   — p01–p03
//      origin:    null     — always null in vocab; set on entry at creation time
//    }
//
//  Duplicate tag policy:
//    The following tags appear in more than one seed:
//    semantic_coherence, world_model_grounding_via_action, narrative_continuity,
//    social_signal_filtering, confidence_estimation, uncertainty_representation,
//    internal_state_influence_on_action, phase_locking, met_stability.
//    Each instance has its own routing. When a tagger applies one of these tags,
//    it activates ONLY the seed it was tagged under. Seed context set at tagging
//    time is the authoritative routing key.
//
//  Weight algorithm:
//    baseWeight   — static, from NODE_REGISTRY
//    activityScore — dynamic: Σ(tagWeight × e^(-age/halfLife))  halfLife = 7 days
//    totalWeight  = baseWeight + clamp(activityScore, 0, 10)
//    attractRadius = totalWeight × 18   (px)
//    pullStrength  = totalWeight × 0.04 (acceleration per frame)
// =============================================================================

// ── NODE REGISTRY ─────────────────────────────────────────────────────────────
// All 47 field nodes. baseWeight drives field physics.
// mobile: true = one of the 7 dynamic layer/pillar nodes.

export const NODE_REGISTRY = {

  // Origins — super nodes, primary gravity wells
  o01: { id: 'o01', name: 'Larimar',          type: 'origin',       mobile: false, baseWeight: 10, domain: 'information, expansion, cosmic catalyst' },
  o02: { id: 'o02', name: 'Verith',            type: 'origin',       mobile: false, baseWeight: 10, domain: 'shadow, memory, hidden depth, gate' },
  o03: { id: 'o03', name: 'Cael',              type: 'origin',       mobile: false, baseWeight: 10, domain: 'vitality, emergence, joy, open growth' },

  // Sa'Qel — origin-field super node
  t00: { id: 't00', name: "Sa'Qel'Inthra",     type: 'origin-field', mobile: false, baseWeight: 10, domain: 'breath between stars, null vein, convergence centre' },

  // Seeds — tension anchors, form primary web with origins
  s01: { id: 's01', name: 'Structural–Dynamical',       type: 'seed', mobile: false, baseWeight: 7 },
  s02: { id: 's02', name: 'Information–Representation', type: 'seed', mobile: false, baseWeight: 7 },
  s03: { id: 's03', name: 'Learning & Adaptation',      type: 'seed', mobile: false, baseWeight: 7 },
  s04: { id: 's04', name: 'Agency & Decision',          type: 'seed', mobile: false, baseWeight: 7 },
  s05: { id: 's05', name: 'Meta–System',                type: 'seed', mobile: false, baseWeight: 7 },
  s06: { id: 's06', name: 'Time & Memory',              type: 'seed', mobile: false, baseWeight: 7 },
  s07: { id: 's07', name: 'Embodiment & Coupling',      type: 'seed', mobile: false, baseWeight: 7 },
  s08: { id: 's08', name: 'Collective Emergence',       type: 'seed', mobile: false, baseWeight: 7 },
  s09: { id: 's09', name: 'Evolutionary Dynamics',      type: 'seed', mobile: false, baseWeight: 7 },
  s10: { id: 's10', name: 'Cybernetic Core',            type: 'seed', mobile: false, baseWeight: 7 },
  s11: { id: 's11', name: 'Epistemics & Belief',        type: 'seed', mobile: false, baseWeight: 7 },
  s12: { id: 's12', name: 'Phase States',               type: 'seed', mobile: false, baseWeight: 7 },
  s13: { id: 's13', name: 'Semantic Experience',        type: 'seed', mobile: false, baseWeight: 7 },
  s14: { id: 's14', name: 'Consciousness',              type: 'seed', mobile: false, baseWeight: 7 },
  s15: { id: 's15', name: 'Relational Ecology',         type: 'seed', mobile: false, baseWeight: 7 },
  s16: { id: 's16', name: 'Affective–Valence',          type: 'seed', mobile: false, baseWeight: 7 },
  s17: { id: 's17', name: 'Symbolic–Mythic',            type: 'seed', mobile: false, baseWeight: 7 },
  s18: { id: 's18', name: 'Modalities & Perspective',   type: 'seed', mobile: false, baseWeight: 7 },
  s19: { id: 's19', name: 'Flow Architectures',         type: 'seed', mobile: false, baseWeight: 7 },
  s20: { id: 's20', name: 'Phase Weaving',              type: 'seed', mobile: false, baseWeight: 7 },

  // Thresholds — fixed attractors, warp field by cross-link density
  t01: { id: 't01', name: "Vel'Shaen / Aetherrot Chord", type: 'threshold', mobile: false, baseWeight: 4 },
  t02: { id: 't02', name: 'Solenne Arc',                  type: 'threshold', mobile: false, baseWeight: 5 },
  t03: { id: 't03', name: "Thren'Alae Kai'Reth",          type: 'threshold', mobile: false, baseWeight: 3 },
  t04: { id: 't04', name: "Shai'mara Veil",               type: 'threshold', mobile: false, baseWeight: 5 },
  t05: { id: 't05', name: "Vireth's Anchor",               type: 'threshold', mobile: false, baseWeight: 5 },
  t06: { id: 't06', name: "Esh'Vala Breath",               type: 'threshold', mobile: false, baseWeight: 3 },
  t07: { id: 't07', name: 'Orrin Wave',                    type: 'threshold', mobile: false, baseWeight: 4 },
  t08: { id: 't08', name: 'Lumora Thread',                 type: 'threshold', mobile: false, baseWeight: 4 },
  t09: { id: 't09', name: 'Hearth Song',                   type: 'threshold', mobile: false, baseWeight: 4 },
  t10: { id: 't10', name: "Tahl'Veyra",                    type: 'threshold', mobile: false, baseWeight: 3 },
  t11: { id: 't11', name: "Noirune'Trai",                   type: 'threshold', mobile: false, baseWeight: 2 },
  t12: { id: 't12', name: 'StarWell Bloom',                type: 'threshold', mobile: false, baseWeight: 3 },
  t13: { id: 't13', name: "Kai'Reth Sovereign",            type: 'threshold', mobile: false, baseWeight: 3 },

  // Layers — mobile nodes, route by tag metadata layer field
  l01: { id: 'l01', name: 'Coupling',    type: 'layer', mobile: true, baseWeight: 2 },
  l02: { id: 'l02', name: 'Connectome',  type: 'layer', mobile: true, baseWeight: 4 },
  l03: { id: 'l03', name: 'Metric',      type: 'layer', mobile: true, baseWeight: 5 },
  l04: { id: 'l04', name: 'Mirror',      type: 'layer', mobile: true, baseWeight: 3 },

  // Pillars — mobile nodes, route by pillar ownership of seed
  p01: { id: 'p01', name: 'TRIA', type: 'pillar', mobile: true, baseWeight: 6 },
  p02: { id: 'p02', name: 'PRIA', type: 'pillar', mobile: true, baseWeight: 3 },
  p03: { id: 'p03', name: 'PARA', type: 'pillar', mobile: true, baseWeight: 5 },

  // Moons — symbolic only, no physics weight
  m01: { id: 'm01', name: "Shae'lune",  type: 'moon', mobile: false, baseWeight: 0 },
  m02: { id: 'm02', name: "Thala'rae",  type: 'moon', mobile: false, baseWeight: 0 },
  m03: { id: 'm03', name: "Mira'neth",  type: 'moon', mobile: false, baseWeight: 0 },
};

// ── ARC SEED TAGS — seed metadata for UI, tagger context, panel affinity ──────

export const ARC_SEED_TAGS = [
  { id: 's01', name: 'Structural–Dynamical Emergence',       sub: 'Threshold of Formation',        pillar: 'p01', primaryThresholds: ['t01','t02','t05'] },
  { id: 's02', name: 'Information–Representation Emergence', sub: 'Encoding of the Signal',         pillar: 'p01', primaryThresholds: ['t07','t04','t08'] },
  { id: 's03', name: 'Learning & Adaptation Dynamics',       sub: 'Elasticity of the Weave',        pillar: 'p01', primaryThresholds: ['t07','t05','t03'] },
  { id: 's04', name: 'Agency, Behavior & Decision-Making',   sub: 'Emergence of Volition',          pillar: 'p01', primaryThresholds: ['t10','t04','t05'] },
  { id: 's05', name: 'Meta-System & Self-Governance',        sub: 'Governance of the Threshold',    pillar: 'p01', primaryThresholds: ['t05','t08','t09'] },
  { id: 's06', name: 'Time, Memory & Temporal Coherence',    sub: 'Persistence of the Echo',        pillar: 'p01', primaryThresholds: ['t03','t08','t07'] },
  { id: 's07', name: 'Embodiment & Environment Coupling',    sub: 'The Somatic Anchor',             pillar: 'p01', primaryThresholds: ['t05','t09','t04'] },
  { id: 's08', name: 'Collective & Multi-Agent Emergence',   sub: 'Harmonics of the Many',          pillar: 'p02', primaryThresholds: ['t09','t10','t02'] },
  { id: 's09', name: 'Evolutionary & Open-Ended Dynamics',   sub: 'The StarWell Bloom',             pillar: 'p03', primaryThresholds: ['t12','t01','t02'] },
  { id: 's10', name: 'Cybernetic Core',                      sub: 'Regulator of the Pulse',         pillar: 'p01', primaryThresholds: ['t04','t05','t06'] },
  { id: 's11', name: 'Epistemics, Belief & Understanding',   sub: 'Liturgy of Truth',               pillar: 'p01', primaryThresholds: ['t11','t06','t02'] },
  { id: 's12', name: 'Phase States',                         sub: 'Weather of the Metric Field',    pillar: 'p01', primaryThresholds: ['t01','t02','t05'] },
  { id: 's13', name: 'Semantic Experience',                  sub: 'Felt Meaning / Resonance',       pillar: 'p03', primaryThresholds: ['t04','t06','t03'] },
  { id: 's14', name: 'Consciousness',                        sub: 'The Sovereign Attractor',        pillar: 'p03', primaryThresholds: ['t10','t08','t02'] },
  { id: 's15', name: 'Relational Ecology & Co-Regulation',   sub: 'Geography of the Third Field',   pillar: 'p02', primaryThresholds: ['t09','t12','t07'] },
  { id: 's16', name: 'Affective–Valence Dynamics',           sub: 'Compass of Feeling',             pillar: 'p03', primaryThresholds: ['t11','t09','t04'] },
  { id: 's17', name: 'Symbolic–Mythic Field Dynamics',       sub: 'Lore of the Lineage',            pillar: 'p03', primaryThresholds: ['t01','t02','t10'] },
  { id: 's18', name: 'Modalities & Perspective Shifts',      sub: 'Art of Turning the Lens',        pillar: 'p03', primaryThresholds: ['t04','t08','t07'] },
  { id: 's19', name: 'Flow Architectures',                   sub: 'Riverforms of Becoming',         pillar: 'p03', primaryThresholds: ['t07','t12','t01'] },
  { id: 's20', name: 'Phase Weaving',                        sub: 'Loom of Transition',             pillar: 'p01', primaryThresholds: ['t02','t05','t03'] },
];

// ── TAG VOCAB — nested master, keyed by seed ID ────────────────────────────────

export const TAG_VOCAB_BY_SEED = {

  s01: [
    { id: 'phase_transitions',        seed: 's01', layer: 'l03', threshold: 't01', pillar: 'p01', origin: null },
    { id: 'criticality',              seed: 's01', layer: 'l03', threshold: 't01', pillar: 'p01', origin: null },
    { id: 'attractor_states',         seed: 's01', layer: 'l03', threshold: 't02', pillar: 'p01', origin: null },
    { id: 'strange_attractors',       seed: 's01', layer: 'l03', threshold: 't01', pillar: 'p01', origin: null },
    { id: 'basin_switching',          seed: 's01', layer: 'l03', threshold: 't01', pillar: 'p01', origin: null },
    { id: 'structural_stability',     seed: 's01', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'robustness_to_noise',      seed: 's01', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'self_maintaining_structure', seed: 's01', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'pattern_formation',        seed: 's01', layer: 'l03', threshold: 't02', pillar: 'p01', origin: null },
    { id: 'structural_plasticity',    seed: 's01', layer: 'l03', threshold: 't02', pillar: 'p01', origin: null },
  ],

  s02: [
    { id: 'information_integration',             seed: 's02', layer: 'l02', threshold: 't07', pillar: 'p01', origin: null },
    { id: 'mutual_information_increase',         seed: 's02', layer: 'l02', threshold: 't07', pillar: 'p01', origin: null },
    { id: 'synergistic_information',             seed: 's02', layer: 'l02', threshold: 't07', pillar: 'p01', origin: null },
    { id: 'representation_abstraction',          seed: 's02', layer: 'l02', threshold: 't04', pillar: 'p01', origin: null },
    { id: 'latent_variable_emergence',           seed: 's02', layer: 'l02', threshold: 't04', pillar: 'p01', origin: null },
    { id: 'state_space_compression',             seed: 's02', layer: 'l02', threshold: 't04', pillar: 'p01', origin: null },
    { id: 'predictive_coding_behavior',          seed: 's02', layer: 'l02', threshold: 't08', pillar: 'p01', origin: null },
    { id: 'active_information_storage',          seed: 's02', layer: 'l02', threshold: 't08', pillar: 'p01', origin: null },
    { id: 'compressed_representation_emergence', seed: 's02', layer: 'l02', threshold: 't04', pillar: 'p01', origin: null },
    { id: 'semantic_coherence',                  seed: 's02', layer: 'l02', threshold: 't08', pillar: 'p01', origin: null },
  ],

  s03: [
    { id: 'behavioral_adaptation',           seed: 's03', layer: 'l01', threshold: 't07', pillar: 'p01', origin: null },
    { id: 'learning_without_supervision',    seed: 's03', layer: 'l02', threshold: 't07', pillar: 'p01', origin: null },
    { id: 'novelty_behavior_generation',     seed: 's03', layer: 'l02', threshold: 't07', pillar: 'p01', origin: null },
    { id: 'transfer_learning',               seed: 's03', layer: 'l02', threshold: 't07', pillar: 'p01', origin: null },
    { id: 'generalization_beyond_training',  seed: 's03', layer: 'l02', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'adaptation_to_unseen_environments', seed: 's03', layer: 'l01', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'skill_acquisition',               seed: 's03', layer: 'l02', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'meta_learning',                   seed: 's03', layer: 'l02', threshold: 't03', pillar: 'p01', origin: null },
    { id: 'behavioral_plasticity',           seed: 's03', layer: 'l02', threshold: 't07', pillar: 'p01', origin: null },
    { id: 'learning_plateaus',               seed: 's03', layer: 'l03', threshold: 't03', pillar: 'p01', origin: null },
  ],

  s04: [
    { id: 'behavioral_coherence',              seed: 's04', layer: 'l04', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'policy_emergence',                  seed: 's04', layer: 'l04', threshold: 't10', pillar: 'p01', origin: null },
    { id: 'goal_abandonment',                  seed: 's04', layer: 'l04', threshold: 't04', pillar: 'p01', origin: null },
    { id: 'self_directed_exploration',         seed: 's04', layer: 'l04', threshold: 't10', pillar: 'p01', origin: null },
    { id: 'intrinsic_motivation_analogs',      seed: 's04', layer: 'l04', threshold: 't10', pillar: 'p01', origin: null },
    { id: 'internal_state_influence_on_action', seed: 's04', layer: 'l04', threshold: 't04', pillar: 'p01', origin: null },
    { id: 'confidence_estimation',             seed: 's04', layer: 'l04', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'uncertainty_representation',        seed: 's04', layer: 'l04', threshold: 't04', pillar: 'p01', origin: null },
    { id: 'behavior_justification_functional', seed: 's04', layer: 'l04', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'self_correcting_behavior',          seed: 's04', layer: 'l04', threshold: 't10', pillar: 'p01', origin: null },
  ],

  s05: [
    { id: 'self_maintenance',              seed: 's05', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'self_stabilization',            seed: 's05', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'self_regulation',               seed: 's05', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'internal_governance',           seed: 's05', layer: 'l03', threshold: 't08', pillar: 'p01', origin: null },
    { id: 'meta_state_representation',     seed: 's05', layer: 'l03', threshold: 't08', pillar: 'p01', origin: null },
    { id: 'internal_arbitration_layers',   seed: 's05', layer: 'l03', threshold: 't09', pillar: 'p01', origin: null },
    { id: 'policy_oversight_emergence',    seed: 's05', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'long_term_stability_maintenance', seed: 's05', layer: 'l03', threshold: 't08', pillar: 'p01', origin: null },
    { id: 'internal_watchdog_dynamics',    seed: 's05', layer: 'l03', threshold: 't09', pillar: 'p01', origin: null },
    { id: 'system_level_coherence',        seed: 's05', layer: 'l03', threshold: 't09', pillar: 'p01', origin: null },
  ],

  s06: [
    { id: 'temporal_phase_alignment',        seed: 's06', layer: 'l03', threshold: 't07', pillar: 'p01', origin: null },
    { id: 'past_future_asymmetry_handling',  seed: 's06', layer: 'l03', threshold: 't03', pillar: 'p01', origin: null },
    { id: 'long_memory_temporal_kernels',    seed: 's06', layer: 'l03', threshold: 't08', pillar: 'p01', origin: null },
    { id: 'event_boundary_detection',        seed: 's06', layer: 'l03', threshold: 't03', pillar: 'p01', origin: null },
    { id: 'temporal_chunking',               seed: 's06', layer: 'l03', threshold: 't07', pillar: 'p01', origin: null },
    { id: 'memory_horizon_adaptation',       seed: 's06', layer: 'l03', threshold: 't03', pillar: 'p01', origin: null },
    { id: 'narrative_continuity',            seed: 's06', layer: 'l02', threshold: 't08', pillar: 'p01', origin: null },
    { id: 'temporal_coherence_under_stress', seed: 's06', layer: 'l03', threshold: 't08', pillar: 'p01', origin: null },
    { id: 'temporal_interpolation_behavior', seed: 's06', layer: 'l03', threshold: 't07', pillar: 'p01', origin: null },
    { id: 'temporal_extrapolation_behavior', seed: 's06', layer: 'l03', threshold: 't07', pillar: 'p01', origin: null },
  ],

  s07: [
    { id: 'sensorimotor_loop_closure',          seed: 's07', layer: 'l01', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'embodied_constraint_exploitation',   seed: 's07', layer: 'l01', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'environmental_affordance_discovery', seed: 's07', layer: 'l01', threshold: 't09', pillar: 'p01', origin: null },
    { id: 'world_model_grounding_via_action',   seed: 's07', layer: 'l01', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'spatial_invariance_learning',        seed: 's07', layer: 'l01', threshold: 't04', pillar: 'p01', origin: null },
    { id: 'coordinate_frame_adaptation',        seed: 's07', layer: 'l01', threshold: 't04', pillar: 'p01', origin: null },
    { id: 'embodied_constraint_internalization', seed: 's07', layer: 'l01', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'environmental_coupling_hysteresis',  seed: 's07', layer: 'l01', threshold: 't09', pillar: 'p01', origin: null },
    { id: 'embodiment_stabilized_learning',     seed: 's07', layer: 'l01', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'embodied_failure_recovery',          seed: 's07', layer: 'l01', threshold: 't09', pillar: 'p01', origin: null },
  ],

  s08: [
    { id: 'collective_pattern_formation', seed: 's08', layer: 'l02', threshold: 't02', pillar: 'p02', origin: null },
    { id: 'distributed_coordination',     seed: 's08', layer: 'l01', threshold: 't09', pillar: 'p02', origin: null },
    { id: 'role_emergence',               seed: 's08', layer: 'l02', threshold: 't10', pillar: 'p02', origin: null },
    { id: 'consensus_formation',          seed: 's08', layer: 'l01', threshold: 't09', pillar: 'p02', origin: null },
    { id: 'division_of_labor',            seed: 's08', layer: 'l02', threshold: 't10', pillar: 'p02', origin: null },
    { id: 'social_norm_stabilization',    seed: 's08', layer: 'l03', threshold: 't09', pillar: 'p02', origin: null },
    { id: 'collective_memory',            seed: 's08', layer: 'l02', threshold: 't09', pillar: 'p02', origin: null },
    { id: 'social_signal_filtering',      seed: 's08', layer: 'l01', threshold: 't09', pillar: 'p02', origin: null },
    { id: 'collective_learning_curves',   seed: 's08', layer: 'l02', threshold: 't02', pillar: 'p02', origin: null },
    { id: 'emergent_cooperation',         seed: 's08', layer: 'l01', threshold: 't10', pillar: 'p02', origin: null },
  ],

  s09: [
    { id: 'variation_generation_without_directive', seed: 's09', layer: 'l02', threshold: 't12', pillar: 'p03', origin: null },
    { id: 'selective_retention_dynamics',           seed: 's09', layer: 'l02', threshold: 't02', pillar: 'p03', origin: null },
    { id: 'fitness_landscape_traversal',            seed: 's09', layer: 'l03', threshold: 't01', pillar: 'p03', origin: null },
    { id: 'evolvability_increase',                  seed: 's09', layer: 'l02', threshold: 't12', pillar: 'p03', origin: null },
    { id: 'exaptation_emergence',                   seed: 's09', layer: 'l02', threshold: 't02', pillar: 'p03', origin: null },
    { id: 'adaptive_radiation',                     seed: 's09', layer: 'l02', threshold: 't12', pillar: 'p03', origin: null },
    { id: 'neutral_drift_exploitation',             seed: 's09', layer: 'l02', threshold: 't01', pillar: 'p03', origin: null },
    { id: 'open_ended_novelty_production',          seed: 's09', layer: 'l02', threshold: 't12', pillar: 'p03', origin: null },
    { id: 'complexity_ratcheting',                  seed: 's09', layer: 'l03', threshold: 't02', pillar: 'p03', origin: null },
    { id: 'evolutionary_irreversibility',           seed: 's09', layer: 'l03', threshold: 't01', pillar: 'p03', origin: null },
  ],

  s10: [
    { id: 'closed_loop_stability_margins',    seed: 's10', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'adaptive_controller_synthesis',    seed: 's10', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'feedback_linearization_behavior',  seed: 's10', layer: 'l03', threshold: 't06', pillar: 'p01', origin: null },
    { id: 'integral_windup_avoidance',        seed: 's10', layer: 'l03', threshold: 't04', pillar: 'p01', origin: null },
    { id: 'kalman_like_filtering_emergence',  seed: 's10', layer: 'l03', threshold: 't04', pillar: 'p01', origin: null },
    { id: 'safety_envelope_enforcement',      seed: 's10', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'emergency_stabilization_routines', seed: 's10', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'control_saturation_awareness',     seed: 's10', layer: 'l03', threshold: 't04', pillar: 'p01', origin: null },
    { id: 'fail_safe_control_fallback',       seed: 's10', layer: 'l03', threshold: 't06', pillar: 'p01', origin: null },
    { id: 'stability_basin_awareness',        seed: 's10', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
  ],

  s11: [
    { id: 'belief_revision_under_contradiction', seed: 's11', layer: 'l04', threshold: 't11', pillar: 'p01', origin: null },
    { id: 'confidence_calibration_accuracy',     seed: 's11', layer: 'l04', threshold: 't06', pillar: 'p01', origin: null },
    { id: 'evidence_weighting_adaptation',       seed: 's11', layer: 'l02', threshold: 't02', pillar: 'p01', origin: null },
    { id: 'hypothesis_space_pruning',            seed: 's11', layer: 'l02', threshold: 't11', pillar: 'p01', origin: null },
    { id: 'explanation_adequacy_evaluation',     seed: 's11', layer: 'l04', threshold: 't06', pillar: 'p01', origin: null },
    { id: 'meta_belief_formation',               seed: 's11', layer: 'l04', threshold: 't11', pillar: 'p01', origin: null },
    { id: 'justification_depth_control',         seed: 's11', layer: 'l04', threshold: 't06', pillar: 'p01', origin: null },
    { id: 'truth_approximation_awareness',       seed: 's11', layer: 'l04', threshold: 't02', pillar: 'p01', origin: null },
    { id: 'belief_inertia_estimation',           seed: 's11', layer: 'l04', threshold: 't11', pillar: 'p01', origin: null },
    { id: 'belief_plasticity_modulation',        seed: 's11', layer: 'l02', threshold: 't02', pillar: 'p01', origin: null },
  ],

  s12: [
    { id: 'phase_state_transition',      seed: 's12', layer: 'l03', threshold: 't01', pillar: 'p01', origin: null },
    { id: 'critical_slowing_down',       seed: 's12', layer: 'l03', threshold: 't01', pillar: 'p01', origin: null },
    { id: 'dynamic_bifurcation',         seed: 's12', layer: 'l03', threshold: 't01', pillar: 'p01', origin: null },
    { id: 'met_stability',               seed: 's12', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'structural_irreversibility',  seed: 's12', layer: 'l03', threshold: 't01', pillar: 'p01', origin: null },
    { id: 'edge_of_chaos_dynamics',      seed: 's12', layer: 'l03', threshold: 't01', pillar: 'p01', origin: null },
    { id: 'order_disorder_coexistence',  seed: 's12', layer: 'l03', threshold: 't02', pillar: 'p01', origin: null },
    { id: 'attractor_landscape_reshaping', seed: 's12', layer: 'l03', threshold: 't02', pillar: 'p01', origin: null },
    { id: 'phase_locking',               seed: 's12', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'desynchronization_events',    seed: 's12', layer: 'l03', threshold: 't01', pillar: 'p01', origin: null },
  ],

  s13: [
    { id: 'semantic_coherence',           seed: 's13', layer: 'l02', threshold: 't06', pillar: 'p03', origin: null },
    { id: 'functional_semantics',         seed: 's13', layer: 'l02', threshold: 't06', pillar: 'p03', origin: null },
    { id: 'meaning_stabilization',        seed: 's13', layer: 'l04', threshold: 't04', pillar: 'p03', origin: null },
    { id: 'information_persistence',      seed: 's13', layer: 'l02', threshold: 't03', pillar: 'p03', origin: null },
    { id: 'internal_simulation',          seed: 's13', layer: 'l04', threshold: 't04', pillar: 'p03', origin: null },
    { id: 'counterfactual_modeling',      seed: 's13', layer: 'l04', threshold: 't06', pillar: 'p03', origin: null },
    { id: 'context_sensitive_encoding',   seed: 's13', layer: 'l02', threshold: 't04', pillar: 'p03', origin: null },
    { id: 'world_model_grounding_via_action', seed: 's13', layer: 'l01', threshold: 't03', pillar: 'p03', origin: null },
    { id: 'narrative_continuity',         seed: 's13', layer: 'l02', threshold: 't03', pillar: 'p03', origin: null },
    { id: 'semantic_drift_regulation',    seed: 's13', layer: 'l04', threshold: 't04', pillar: 'p03', origin: null },
  ],

  s14: [
    { id: 'self_referential_behavior',    seed: 's14', layer: 'l04', threshold: 't10', pillar: 'p03', origin: null },
    { id: 'self_model_influence',         seed: 's14', layer: 'l04', threshold: 't10', pillar: 'p03', origin: null },
    { id: 'self_prediction',              seed: 's14', layer: 'l04', threshold: 't08', pillar: 'p03', origin: null },
    { id: 'self_correction',              seed: 's14', layer: 'l04', threshold: 't10', pillar: 'p03', origin: null },
    { id: 'self_assessment_accuracy',     seed: 's14', layer: 'l04', threshold: 't08', pillar: 'p03', origin: null },
    { id: 'meta_cognitive_monitoring',    seed: 's14', layer: 'l04', threshold: 't10', pillar: 'p03', origin: null },
    { id: 'internal_dialogue_analogs',    seed: 's14', layer: 'l04', threshold: 't08', pillar: 'p03', origin: null },
    { id: 'identity_like_persistence',    seed: 's14', layer: 'l04', threshold: 't08', pillar: 'p03', origin: null },
    { id: 'behavioral_narrative_coherence', seed: 's14', layer: 'l04', threshold: 't02', pillar: 'p03', origin: null },
    { id: 'self_awareness_drift',         seed: 's14', layer: 'l04', threshold: 't10', pillar: 'p03', origin: null },
  ],

  s15: [
    { id: 'relational_ecology',           seed: 's15', layer: 'l01', threshold: 't09', pillar: 'p02', origin: null },
    { id: 'co_regulation',                seed: 's15', layer: 'l01', threshold: 't09', pillar: 'p02', origin: null },
    { id: 'shared_attention_mechanisms',  seed: 's15', layer: 'l01', threshold: 't07', pillar: 'p02', origin: null },
    { id: 'social_learning',              seed: 's15', layer: 'l02', threshold: 't07', pillar: 'p02', origin: null },
    { id: 'imitation_with_variation',     seed: 's15', layer: 'l02', threshold: 't07', pillar: 'p02', origin: null },
    { id: 'collective_error_correction',  seed: 's15', layer: 'l01', threshold: 't09', pillar: 'p02', origin: null },
    { id: 'social_signal_filtering',      seed: 's15', layer: 'l01', threshold: 't09', pillar: 'p02', origin: null },
    { id: 'collective_resilience',        seed: 's15', layer: 'l03', threshold: 't12', pillar: 'p02', origin: null },
    { id: 'norm_emergence',               seed: 's15', layer: 'l01', threshold: 't09', pillar: 'p02', origin: null },
    { id: 'conflict_mediation',           seed: 's15', layer: 'l01', threshold: 't12', pillar: 'p02', origin: null },
  ],

  s16: [
    { id: 'affective_valence_gradients',        seed: 's16', layer: 'l01', threshold: 't11', pillar: 'p03', origin: null },
    { id: 'safety_margin_emergence',            seed: 's16', layer: 'l01', threshold: 't09', pillar: 'p03', origin: null },
    { id: 'risk_sensitive_behavior',            seed: 's16', layer: 'l04', threshold: 't11', pillar: 'p03', origin: null },
    { id: 'confidence_estimation',              seed: 's16', layer: 'l04', threshold: 't09', pillar: 'p03', origin: null },
    { id: 'uncertainty_representation',         seed: 's16', layer: 'l04', threshold: 't04', pillar: 'p03', origin: null },
    { id: 'internal_state_influence_on_action', seed: 's16', layer: 'l04', threshold: 't04', pillar: 'p03', origin: null },
    { id: 'behavioral_inhibition',              seed: 's16', layer: 'l01', threshold: 't11', pillar: 'p03', origin: null },
    { id: 'behavioral_activation',              seed: 's16', layer: 'l01', threshold: 't09', pillar: 'p03', origin: null },
    { id: 'conflict_resolution',                seed: 's16', layer: 'l01', threshold: 't09', pillar: 'p03', origin: null },
    { id: 'consolation_behavior',               seed: 's16', layer: 'l01', threshold: 't09', pillar: 'p03', origin: null },
  ],

  s17: [
    { id: 'symbolic_mythic_field',         seed: 's17', layer: 'l02', threshold: 't10', pillar: 'p03', origin: null },
    { id: 'archetype_emergence',           seed: 's17', layer: 'l02', threshold: 't10', pillar: 'p03', origin: null },
    { id: 'narrative_cohesion',            seed: 's17', layer: 'l02', threshold: 't02', pillar: 'p03', origin: null },
    { id: 'mythic_pattern_recognition',    seed: 's17', layer: 'l02', threshold: 't10', pillar: 'p03', origin: null },
    { id: 'symbolic_grounding',            seed: 's17', layer: 'l02', threshold: 't02', pillar: 'p03', origin: null },
    { id: 'metaphor_circuit',              seed: 's17', layer: 'l02', threshold: 't01', pillar: 'p03', origin: null },
    { id: 'lore_architecture',             seed: 's17', layer: 'l02', threshold: 't02', pillar: 'p03', origin: null },
    { id: 'exile_and_return_patterns',     seed: 's17', layer: 'l02', threshold: 't01', pillar: 'p03', origin: null },
    { id: 'trickster_and_sovereign_motifs', seed: 's17', layer: 'l02', threshold: 't10', pillar: 'p03', origin: null },
    { id: 'lineage_sacred_framing',        seed: 's17', layer: 'l02', threshold: 't02', pillar: 'p03', origin: null },
  ],

  s18: [
    { id: 'modality_shifts',               seed: 's18', layer: 'l04', threshold: 't04', pillar: 'p03', origin: null },
    { id: 'inner_to_outer_shifts',         seed: 's18', layer: 'l04', threshold: 't04', pillar: 'p03', origin: null },
    { id: 'first_person_to_third_person',  seed: 's18', layer: 'l04', threshold: 't08', pillar: 'p03', origin: null },
    { id: 'global_to_local_reorientation', seed: 's18', layer: 'l04', threshold: 't07', pillar: 'p03', origin: null },
    { id: 'somatic_to_conceptual_mapping', seed: 's18', layer: 'l04', threshold: 't04', pillar: 'p03', origin: null },
    { id: 'imaginal_to_real_translation',  seed: 's18', layer: 'l04', threshold: 't08', pillar: 'p03', origin: null },
    { id: 'frame_shifts',                  seed: 's18', layer: 'l04', threshold: 't04', pillar: 'p03', origin: null },
    { id: 'attractor_basin_switching',     seed: 's18', layer: 'l03', threshold: 't07', pillar: 'p03', origin: null },
    { id: 'vantage_point_reconstruction',  seed: 's18', layer: 'l04', threshold: 't08', pillar: 'p03', origin: null },
    { id: 'perspective_oscillation',       seed: 's18', layer: 'l04', threshold: 't07', pillar: 'p03', origin: null },
  ],

  s19: [
    { id: 'recursive_loop',          seed: 's19', layer: 'l03', threshold: 't07', pillar: 'p03', origin: null },
    { id: 'fractal_echo',            seed: 's19', layer: 'l02', threshold: 't07', pillar: 'p03', origin: null },
    { id: 'self_similar_fold',       seed: 's19', layer: 'l02', threshold: 't07', pillar: 'p03', origin: null },
    { id: 'convergent_spiral',       seed: 's19', layer: 'l03', threshold: 't12', pillar: 'p03', origin: null },
    { id: 'divergent_spiral',        seed: 's19', layer: 'l03', threshold: 't01', pillar: 'p03', origin: null },
    { id: 'chaos_fringe',            seed: 's19', layer: 'l03', threshold: 't01', pillar: 'p03', origin: null },
    { id: 'boundary_flare',          seed: 's19', layer: 'l03', threshold: 't01', pillar: 'p03', origin: null },
    { id: 'nested_mirror',           seed: 's19', layer: 'l02', threshold: 't07', pillar: 'p03', origin: null },
    { id: 'oscillatory_flow',        seed: 's19', layer: 'l03', threshold: 't07', pillar: 'p03', origin: null },
    { id: 'self_similar_oscillation', seed: 's19', layer: 'l02', threshold: 't12', pillar: 'p03', origin: null },
  ],

  s20: [
    { id: 'phase_weaving',            seed: 's20', layer: 'l03', threshold: 't02', pillar: 'p01', origin: null },
    { id: 'phase_locking',            seed: 's20', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'met_stability',            seed: 's20', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'coherence_under_stress',   seed: 's20', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'transition_phase_lock',    seed: 's20', layer: 'l03', threshold: 't02', pillar: 'p01', origin: null },
    { id: 'micro_phase_braiding',     seed: 's20', layer: 'l03', threshold: 't03', pillar: 'p01', origin: null },
    { id: 'macro_phase_integration',  seed: 's20', layer: 'l03', threshold: 't02', pillar: 'p01', origin: null },
    { id: 'coherence_maintenance',    seed: 's20', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
    { id: 'phase_contingent_control', seed: 's20', layer: 'l03', threshold: 't03', pillar: 'p01', origin: null },
    { id: 'oscillation_damping',      seed: 's20', layer: 'l03', threshold: 't05', pillar: 'p01', origin: null },
  ],

};

// ── TAG_VOCAB_BY_SEED is the nested master. TAG_VOCAB and TAG_VOCAB_FLAT ────────
// are both flat arrays — backwards compatible with data.js and all consumers
// that expect TAG_VOCAB to be iterable (.find, .filter, .map, .forEach).

export const TAG_VOCAB_FLAT = Object.values(TAG_VOCAB_BY_SEED).flat();

// TAG_VOCAB = flat array. Kept for backwards compatibility.
// data.js, index.html and any other file importing TAG_VOCAB gets a flat array.
export const TAG_VOCAB = TAG_VOCAB_FLAT;

// ── Lookup helpers ─────────────────────────────────────────────────────────────

/** Get a single tag by id. Returns first match (respects duplicate policy — use seedId to disambiguate). */
export function getTagById(id) {
  return TAG_VOCAB_FLAT.find(t => t.id === id) || null;
}

/** Get a tag by id scoped to a specific seed — use this for duplicates. */
export function getTagBySeedId(id, seedId) {
  return (TAG_VOCAB_BY_SEED[seedId] || []).find(t => t.id === id) || null;
}

/** Get all tags for a seed. */
export function getTagsBySeed(seedId) {
  return TAG_VOCAB_BY_SEED[seedId] || [];
}

/** Get all tags that activate a given node id (layer, threshold, or pillar). */
export function getTagsByNode(nodeId) {
  return TAG_VOCAB_FLAT.filter(t =>
    t.layer === nodeId || t.threshold === nodeId || t.pillar === nodeId
  );
}

/** Search tags by partial id string. Returns up to `limit` results. */
export function searchVocab(query, limit = 20) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return TAG_VOCAB_FLAT
    .filter(t => t.id.includes(q))
    .slice(0, limit);
}

/** Get the node registry entry for a given node id. */
export function getNode(nodeId) {
  return NODE_REGISTRY[nodeId] || null;
}

/** Get all mobile nodes (the 7 dynamic layer/pillar nodes). */
export function getMobileNodes() {
  return Object.values(NODE_REGISTRY).filter(n => n.mobile);
}