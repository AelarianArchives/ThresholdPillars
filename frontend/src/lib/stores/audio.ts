import { writable } from 'svelte/store';
import type { NodeId, NodeTier, AudioEventType } from '$lib/audio/events';

// --- Playing Voice ---

export interface PlayingVoice {
	nodeId: NodeId;
	startTime: number;
	gain: number;
}

// --- Playback State (transient) ---

export interface AudioPlaybackState {
	contextState: AudioContextState;
	playingVoices: PlayingVoice[];    // max 2 active
	decayingVoice: PlayingVoice | null; // fading out
	sseConnected: boolean;
}

export const audioPlaybackStore = writable<AudioPlaybackState>({
	contextState: 'suspended',
	playingVoices: [],
	decayingVoice: null,
	sseConnected: false
});

// --- Notification Categories ---
// Groups from RESONANCE ENGINE AUDIO SPEC.md event map sections.

export const ALL_NOTIFICATION_CATEGORIES = [
	'origin',
	'threshold_topology',
	'field_state',
	'resonance_line',
	'seed_layer',
	'deposit',
	'emergence',
	'pcv_dtx_sgr',
	'research_memory',
	'rupture'
] as const;

export type NotificationCategory = (typeof ALL_NOTIFICATION_CATEGORIES)[number];

// Maps every AudioEventType to its notification category.
// The engine checks this before playing: if the category is toggled off,
// the notification is silently skipped.

export const EVENT_CATEGORY_MAP: Record<AudioEventType, NotificationCategory> = {
	// Origin events (1-10)
	origin_weight_spike: 'origin',
	origin_weight_decay: 'origin',
	origin_affiliated_deposit: 'origin',
	origin_new_connection: 'origin',
	origin_connection_broken: 'origin',
	origin_presence_change: 'origin',
	multi_origin_convergence: 'origin',
	origin_divergence: 'origin',
	origin_sovereignty_event: 'origin',
	origin_pull_shift: 'origin',

	// Threshold topology (11-14)
	phase_state_assigned: 'threshold_topology',
	threshold_density_spike: 'threshold_topology',
	threshold_density_drop: 'threshold_topology',
	threshold_halo_expansion: 'threshold_topology',

	// Field state (15-16)
	field_equilibrium_reached: 'field_state',
	field_equilibrium_broken: 'field_state',

	// Resonance lines (17-20)
	resonance_line_formed: 'resonance_line',
	resonance_line_strengthened: 'resonance_line',
	resonance_line_weakened: 'resonance_line',
	resonance_line_broken: 'resonance_line',

	// Seed & layer (21-25)
	seed_activation: 'seed_layer',
	seed_went_quiet: 'seed_layer',
	historical_halo_appeared: 'seed_layer',
	layer_weight_spike: 'seed_layer',
	pillar_weight_spike: 'seed_layer',

	// Deposits (26-28)
	deposit_confirmed: 'deposit',
	deposit_embedding_complete: 'deposit',
	deposit_embedding_failed: 'deposit',

	// Emergence (29-35)
	emergence_cluster_formed: 'emergence',
	emergence_bridge_node: 'emergence',
	emergence_high_influence: 'emergence',
	emergence_cross_category: 'emergence',
	emergence_drift_detected: 'emergence',
	emergence_void_zone: 'emergence',
	emergence_null_cluster: 'emergence',

	// PCV / DTX / SGR (36-43)
	pcv_pattern_created: 'pcv_dtx_sgr',
	dtx_drift_event_created: 'pcv_dtx_sgr',
	dtx_trajectory_shift: 'pcv_dtx_sgr',
	sgr_signal_graded: 'pcv_dtx_sgr',
	sgr_s_tier_signal: 'pcv_dtx_sgr',
	sgr_bayesian_return: 'pcv_dtx_sgr',
	dtx_outcome_converging: 'pcv_dtx_sgr',
	pattern_archived: 'pcv_dtx_sgr',

	// Research & memory (44-51)
	mtm_synthesis_finding: 'research_memory',
	void_absence_detected: 'research_memory',
	wsc_witness_entry: 'research_memory',
	cosmology_finding_confirmed: 'research_memory',
	cosmology_finding_nexus_eligible: 'research_memory',
	rct_residual_detected: 'research_memory',
	research_memory_updated: 'research_memory',
	retrieval_gap_detected: 'research_memory',

	// Rupture (52)
	rupture: 'rupture'
};

// --- Panel Toggle (UI state) ---

export const audioPanelOpen = writable<boolean>(false);

// --- Ambient Modes ---

export type AmbientMode = 'notification' | 'drone' | 'heartbeat';

// --- Settings State (user preferences) ---

export interface AudioSettingsState {
	masterMute: boolean;
	tierMute: Record<NodeTier, boolean>;
	tierVolume: Record<NodeTier, number>;  // 0.0 - 1.0
	notificationToggles: Record<NotificationCategory, boolean>;
	ambientMode: AmbientMode;
	heartbeatIntervalMs: number;
}

export const audioSettingsStore = writable<AudioSettingsState>({
	masterMute: false,
	tierMute: {
		origin: false,
		threshold: false,
		layer: false,
		pillar: false,
		seed: false
	},
	tierVolume: {
		origin: 1.0,
		threshold: 1.0,
		layer: 1.0,
		pillar: 1.0,
		seed: 1.0
	},
	notificationToggles: {
		origin: true,
		threshold_topology: true,
		field_state: true,
		resonance_line: true,
		seed_layer: true,
		deposit: true,
		emergence: true,
		pcv_dtx_sgr: true,
		research_memory: true,
		rupture: true
	},
	ambientMode: 'notification',
	heartbeatIntervalMs: 60000
});
