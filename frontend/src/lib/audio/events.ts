import { writable } from 'svelte/store';

// --- Node IDs ---

export const ORIGIN_IDS = ['o01', 'o02', 'o03'] as const;
export type OriginId = (typeof ORIGIN_IDS)[number];

export const THRESHOLD_IDS = [
	'th01', 'th02', 'th03', 'th04', 'th05', 'th06',
	'th07', 'th08', 'th09', 'th10', 'th11', 'th12'
] as const;
export type ThresholdId = (typeof THRESHOLD_IDS)[number];

export const LAYER_IDS = ['l01', 'l02', 'l03', 'l04'] as const;
export type LayerId = (typeof LAYER_IDS)[number];

export const PILLAR_IDS = ['p01', 'p02', 'p03'] as const;
export type PillarId = (typeof PILLAR_IDS)[number];

export const SEED_IDS = [
	's01', 's02', 's03', 's04', 's05', 's06', 's07', 's08', 's09', 's10',
	's11', 's12', 's13', 's14', 's15', 's16', 's17', 's18', 's19', 's20',
	's21', 's22', 's23', 's24', 's25', 's26', 's27', 's28', 's29', 's30',
	's31', 's32', 's33', 's34', 's35', 's36', 's37', 's38', 's39', 's40'
] as const;
export type SeedId = (typeof SEED_IDS)[number];

export type NodeId = OriginId | ThresholdId | LayerId | PillarId | SeedId;

export const ALL_NODE_IDS: readonly NodeId[] = [
	...ORIGIN_IDS,
	...THRESHOLD_IDS,
	...LAYER_IDS,
	...PILLAR_IDS,
	...SEED_IDS
];

// --- Node Tiers ---

export type NodeTier = 'origin' | 'threshold' | 'layer' | 'pillar' | 'seed';

// --- Rupture Tiers ---

export type RuptureTier = 1 | 2 | 3;

// --- Audio Event Types (52 events) ---
// Source: RESONANCE ENGINE AUDIO SPEC.md notification event map

export const ALL_EVENT_TYPES = [
	// Origin node events (1-10)
	'origin_weight_spike',
	'origin_weight_decay',
	'origin_affiliated_deposit',
	'origin_new_connection',
	'origin_connection_broken',
	'origin_presence_change',
	'multi_origin_convergence',
	'origin_divergence',
	'origin_sovereignty_event',
	'origin_pull_shift',
	// Threshold field topology (11-14) — self-routing
	'phase_state_assigned',
	'threshold_density_spike',
	'threshold_density_drop',
	'threshold_halo_expansion',
	// Threshold field state (15-16)
	'field_equilibrium_reached',
	'field_equilibrium_broken',
	// Resonance line events (17-20)
	'resonance_line_formed',
	'resonance_line_strengthened',
	'resonance_line_weakened',
	'resonance_line_broken',
	// Seed & layer events (21-25)
	'seed_activation',
	'seed_went_quiet',
	'historical_halo_appeared',
	'layer_weight_spike',
	'pillar_weight_spike',
	// Deposit events (26-28)
	'deposit_confirmed',
	'deposit_embedding_complete',
	'deposit_embedding_failed',
	// Emergence events (29-35)
	'emergence_cluster_formed',
	'emergence_bridge_node',
	'emergence_high_influence',
	'emergence_cross_category',
	'emergence_drift_detected',
	'emergence_void_zone',
	'emergence_null_cluster',
	// PCV / DTX / SGR cycle (36-43)
	'pcv_pattern_created',
	'dtx_drift_event_created',
	'dtx_trajectory_shift',
	'sgr_signal_graded',
	'sgr_s_tier_signal',
	'sgr_bayesian_return',
	'dtx_outcome_converging',
	'pattern_archived',
	// Research & memory events (44-51)
	'mtm_synthesis_finding',
	'void_absence_detected',
	'wsc_witness_entry',
	'cosmology_finding_confirmed',
	'cosmology_finding_nexus_eligible',
	'rct_residual_detected',
	'research_memory_updated',
	'retrieval_gap_detected',
	// Rupture three-tier system (52)
	'rupture'
] as const;

export type AudioEventType = (typeof ALL_EVENT_TYPES)[number];

// --- Notifier Routing Map ---
// 'self' = notifier resolved by the event emitter, not fixed.
// Array = multiple notifiers fire simultaneously.
// Source: RESONANCE ENGINE AUDIO SPEC.md event map tables.

type NotifierValue = NodeId | readonly NodeId[] | 'self';

export const NOTIFIER_MAP: Record<AudioEventType, NotifierValue> = {
	// Origin events (1-10): self-routing except #9
	origin_weight_spike: 'self',
	origin_weight_decay: 'self',
	origin_affiliated_deposit: 'self',
	origin_new_connection: 'self',
	origin_connection_broken: 'self',
	origin_presence_change: 'self',
	multi_origin_convergence: 'self',
	origin_divergence: 'self',
	origin_sovereignty_event: 'o03',        // fixed — sovereignty is her domain
	origin_pull_shift: 'self',

	// Threshold topology (11-14): self-routing
	phase_state_assigned: 'self',
	threshold_density_spike: 'self',
	threshold_density_drop: 'self',
	threshold_halo_expansion: 'self',

	// Field state (15-16)
	field_equilibrium_reached: 'th05',      // Vireth's Anchor — stabilization
	field_equilibrium_broken: 'th01',       // Aetherroot Chord — disruption

	// Resonance lines (17-20)
	resonance_line_formed: 'th08',          // Lumora Thread — connection forming
	resonance_line_strengthened: 'th06',    // Esh'Vala Breath — life-force influx
	resonance_line_weakened: 'th07',        // Orrin Wave — temporal fading
	resonance_line_broken: 'th03',          // Thren Alae Kai'Reth — encoded loss

	// Seed & layer (21-25)
	seed_activation: 'th12',               // StarWell Bloom (3510 Hz) — new cycle
	seed_went_quiet: 'th11',               // Noirune Trai — shadow archive
	historical_halo_appeared: 'th03',      // Thren Alae Kai'Reth — past surfacing
	layer_weight_spike: 'th05',            // Vireth's Anchor — structural mass
	pillar_weight_spike: 'th10',           // Tahl'Veyra — sovereign becoming

	// Deposits (26-28)
	deposit_confirmed: 'th09',             // Hearth Song (351 Hz) — homecoming
	deposit_embedding_complete: 'th08',    // Lumora Thread — vector connection
	deposit_embedding_failed: 'th01',      // Aetherroot Chord — connection fracture

	// Emergence (29-35)
	emergence_cluster_formed: 'th10',      // Tahl'Veyra — emergence beginning
	emergence_bridge_node: 'th08',         // Lumora Thread — connecting territories
	emergence_high_influence: 'th02',      // Solenne Arc — predictive signal
	emergence_cross_category: 'th07',      // Orrin Wave — crossing layers
	emergence_drift_detected: 'th07',      // Orrin Wave — motion through time
	emergence_void_zone: 'th11',           // Noirune Trai — absence archive
	emergence_null_cluster: 'th11',        // Noirune Trai — deep archive

	// PCV / DTX / SGR (36-43)
	pcv_pattern_created: 'th12',           // StarWell Bloom — new cycle
	dtx_drift_event_created: 'th07',       // Orrin Wave — drift
	dtx_trajectory_shift: 'th10',          // Tahl'Veyra — redirect
	sgr_signal_graded: 'th05',             // Vireth's Anchor — anchored
	sgr_s_tier_signal: ['th02', 'o03'] as const,  // dual — S-Tier
	sgr_bayesian_return: 'th08',           // Lumora Thread — evidence loop
	dtx_outcome_converging: 'th10',        // Tahl'Veyra — sovereign moment
	pattern_archived: 'th11',              // Noirune Trai — into the deep

	// Research & memory (44-51)
	mtm_synthesis_finding: 'th04',         // Shai'mara Veil — delicate weaving
	void_absence_detected: 'th11',         // Noirune Trai — the void
	wsc_witness_entry: 'o02',              // Verith — witnessing
	cosmology_finding_confirmed: 'th02',   // Solenne Arc — turning point
	cosmology_finding_nexus_eligible: 'th12', // StarWell Bloom — new cycles
	rct_residual_detected: 'th01',         // Aetherroot Chord — fracture
	research_memory_updated: 'o02',        // Verith — memory keeper
	retrieval_gap_detected: 'th11',        // Noirune Trai — gap in archive

	// Rupture (52)
	rupture: 's20'                         // 3 tiers, same clip, different playback
};

// --- Audio Event (store shape) ---

export interface AudioEvent {
	event_type: AudioEventType;
	notifier: NodeId | NodeId[];
	tier?: RuptureTier;
	metadata: Record<string, unknown>;
	timestamp: number;
}

// --- Event Store ---
// The audio engine subscribes to this store reactively.
// Event emitters (frontend field topology + backend SSE listener) write to it.
// Notifier is always resolved before writing — 'self' routing is resolved
// by the emitter, not by the engine.

export const audioEventStore = writable<AudioEvent | null>(null);
