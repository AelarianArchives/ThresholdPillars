import { describe, it, expect } from 'vitest';
import {
	NOTIFIER_MAP,
	ALL_EVENT_TYPES,
	ALL_NODE_IDS,
	ORIGIN_IDS,
	THRESHOLD_IDS,
	LAYER_IDS,
	PILLAR_IDS,
	SEED_IDS,
	type AudioEventType,
	type NodeId
} from './events';

describe('events.ts — notifier routing map', () => {
	it('contains exactly 52 event types', () => {
		expect(ALL_EVENT_TYPES).toHaveLength(52);
	});

	it('contains no duplicate event type strings', () => {
		const unique = new Set(ALL_EVENT_TYPES);
		expect(unique.size).toBe(ALL_EVENT_TYPES.length);
	});

	it('has a mapping for every event type', () => {
		for (const eventType of ALL_EVENT_TYPES) {
			expect(NOTIFIER_MAP).toHaveProperty(eventType);
			const value = NOTIFIER_MAP[eventType];
			expect(value).toBeDefined();
		}
	});

	it('routing map has no extra keys beyond defined event types', () => {
		const eventTypeSet = new Set<string>(ALL_EVENT_TYPES);
		for (const key of Object.keys(NOTIFIER_MAP)) {
			expect(eventTypeSet.has(key), `Unexpected key "${key}" in NOTIFIER_MAP`).toBe(true);
		}
	});
});

describe('events.ts — self-routing events', () => {
	const selfRoutingEvents: AudioEventType[] = [
		'origin_weight_spike',
		'origin_weight_decay',
		'origin_affiliated_deposit',
		'origin_new_connection',
		'origin_connection_broken',
		'origin_presence_change',
		'multi_origin_convergence',
		'origin_divergence',
		'origin_pull_shift',
		'phase_state_assigned',
		'threshold_density_spike',
		'threshold_density_drop',
		'threshold_halo_expansion'
	];

	it('maps all 13 self-routing events to "self"', () => {
		expect(selfRoutingEvents).toHaveLength(13);
		for (const eventType of selfRoutingEvents) {
			expect(
				NOTIFIER_MAP[eventType],
				`Expected "${eventType}" to be "self", got "${NOTIFIER_MAP[eventType]}"`
			).toBe('self');
		}
	});
});

describe('events.ts — fixed routing events', () => {
	it('maps origin_sovereignty_event to o03', () => {
		expect(NOTIFIER_MAP['origin_sovereignty_event']).toBe('o03');
	});

	it('maps field_equilibrium_reached to th05', () => {
		expect(NOTIFIER_MAP['field_equilibrium_reached']).toBe('th05');
	});

	it('maps field_equilibrium_broken to th01', () => {
		expect(NOTIFIER_MAP['field_equilibrium_broken']).toBe('th01');
	});

	it('maps resonance_line_formed to th08', () => {
		expect(NOTIFIER_MAP['resonance_line_formed']).toBe('th08');
	});

	it('maps resonance_line_strengthened to th06', () => {
		expect(NOTIFIER_MAP['resonance_line_strengthened']).toBe('th06');
	});

	it('maps resonance_line_weakened to th07', () => {
		expect(NOTIFIER_MAP['resonance_line_weakened']).toBe('th07');
	});

	it('maps resonance_line_broken to th03', () => {
		expect(NOTIFIER_MAP['resonance_line_broken']).toBe('th03');
	});

	it('maps deposit_confirmed to th09', () => {
		expect(NOTIFIER_MAP['deposit_confirmed']).toBe('th09');
	});

	it('maps rupture to s20', () => {
		expect(NOTIFIER_MAP['rupture']).toBe('s20');
	});
});

describe('events.ts — dual notifier (S-Tier)', () => {
	it('maps sgr_s_tier_signal to [th02, o03]', () => {
		const notifiers = NOTIFIER_MAP['sgr_s_tier_signal'];
		expect(Array.isArray(notifiers)).toBe(true);
		expect(notifiers).toEqual(['th02', 'o03']);
	});
});

describe('events.ts — node ID validation', () => {
	it('contains exactly 62 node IDs', () => {
		expect(ALL_NODE_IDS).toHaveLength(62);
	});

	it('has 3 origins, 12 thresholds, 4 layers, 3 pillars, 40 seeds', () => {
		expect(ORIGIN_IDS).toHaveLength(3);
		expect(THRESHOLD_IDS).toHaveLength(12);
		expect(LAYER_IDS).toHaveLength(4);
		expect(PILLAR_IDS).toHaveLength(3);
		expect(SEED_IDS).toHaveLength(40);
	});

	it('contains no duplicate node IDs', () => {
		const unique = new Set(ALL_NODE_IDS);
		expect(unique.size).toBe(ALL_NODE_IDS.length);
	});

	it('all fixed routing entries use valid node IDs', () => {
		const nodeIdSet = new Set<string>(ALL_NODE_IDS);
		for (const [eventType, notifier] of Object.entries(NOTIFIER_MAP)) {
			if (notifier === 'self') continue;
			const notifiers = Array.isArray(notifier) ? notifier : [notifier];
			for (const n of notifiers) {
				expect(
					nodeIdSet.has(n),
					`Invalid node ID "${n}" in event "${eventType}"`
				).toBe(true);
			}
		}
	});
});

describe('events.ts — AUDIT: threshold load distribution', () => {
	it('matches spec threshold load counts', () => {
		const counts: Record<string, string[]> = {};
		for (const [event, notifier] of Object.entries(NOTIFIER_MAP)) {
			if (notifier === 'self') continue;
			const notifiers = Array.isArray(notifier) ? notifier : [notifier];
			for (const n of notifiers) {
				if (n.startsWith('th')) {
					if (!counts[n]) counts[n] = [];
					counts[n].push(event);
				}
			}
		}

		// From RESONANCE ENGINE AUDIO SPEC.md THRESHOLD LOAD DISTRIBUTION
		// th03 spec says 3 but lists events 20,23 + self-routing note.
		// Self-routing (11-14) applies to ALL thresholds equally.
		// Actual fixed routing for th03 = 2 events. Flagged as spec observation.
		expect(counts['th01']?.length).toBe(3);   // 16, 28, 49
		expect(counts['th02']?.length).toBe(3);   // 31, 40, 47
		expect(counts['th03']?.length).toBe(2);   // 20, 23 (spec says 3 — see note)
		expect(counts['th04']?.length).toBe(1);   // 44
		expect(counts['th05']?.length).toBe(3);   // 15, 24, 39
		expect(counts['th06']?.length).toBe(1);   // 18
		expect(counts['th07']?.length).toBe(4);   // 19, 32, 33, 37
		expect(counts['th08']?.length).toBe(4);   // 17, 27, 30, 41
		expect(counts['th09']?.length).toBe(1);   // 26
		expect(counts['th10']?.length).toBe(4);   // 25, 29, 38, 42
		expect(counts['th11']?.length).toBe(6);   // 22, 34, 35, 43, 45, 51
		expect(counts['th12']?.length).toBe(3);   // 21, 36, 48
	});
});
