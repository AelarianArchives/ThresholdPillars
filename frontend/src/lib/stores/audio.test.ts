import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import {
	audioPlaybackStore,
	audioSettingsStore,
	ALL_NOTIFICATION_CATEGORIES,
	EVENT_CATEGORY_MAP,
	type NotificationCategory
} from './audio';
import { ALL_EVENT_TYPES, type NodeTier } from '$lib/audio/events';

describe('audio store — playback initial state', () => {
	it('starts with context suspended', () => {
		const state = get(audioPlaybackStore);
		expect(state.contextState).toBe('suspended');
	});

	it('starts with no playing voices', () => {
		const state = get(audioPlaybackStore);
		expect(state.playingVoices).toEqual([]);
	});

	it('starts with no decaying voice', () => {
		const state = get(audioPlaybackStore);
		expect(state.decayingVoice).toBeNull();
	});

	it('starts with SSE disconnected', () => {
		const state = get(audioPlaybackStore);
		expect(state.sseConnected).toBe(false);
	});
});

describe('audio store — settings initial state', () => {
	it('starts with master unmuted', () => {
		const state = get(audioSettingsStore);
		expect(state.masterMute).toBe(false);
	});

	it('starts with all tiers unmuted', () => {
		const state = get(audioSettingsStore);
		const tiers: NodeTier[] = ['origin', 'threshold', 'layer', 'pillar', 'seed'];
		for (const tier of tiers) {
			expect(state.tierMute[tier], `${tier} should be unmuted`).toBe(false);
		}
	});

	it('starts with all tier volumes at 1.0', () => {
		const state = get(audioSettingsStore);
		const tiers: NodeTier[] = ['origin', 'threshold', 'layer', 'pillar', 'seed'];
		for (const tier of tiers) {
			expect(state.tierVolume[tier], `${tier} volume should be 1.0`).toBe(1.0);
		}
	});

	it('starts with all notification categories enabled', () => {
		const state = get(audioSettingsStore);
		for (const category of ALL_NOTIFICATION_CATEGORIES) {
			expect(
				state.notificationToggles[category],
				`${category} should be enabled`
			).toBe(true);
		}
	});

	it('starts with ambient mode notification', () => {
		const state = get(audioSettingsStore);
		expect(state.ambientMode).toBe('notification');
	});

	it('starts with heartbeat interval at 60000ms', () => {
		const state = get(audioSettingsStore);
		expect(state.heartbeatIntervalMs).toBe(60000);
	});
});

describe('audio store — notification categories', () => {
	it('has exactly 10 notification categories', () => {
		expect(ALL_NOTIFICATION_CATEGORIES).toHaveLength(10);
	});

	it('maps every event type to a category', () => {
		for (const eventType of ALL_EVENT_TYPES) {
			expect(
				EVENT_CATEGORY_MAP[eventType],
				`Event "${eventType}" has no category mapping`
			).toBeDefined();
			expect(
				ALL_NOTIFICATION_CATEGORIES.includes(EVENT_CATEGORY_MAP[eventType]),
				`Event "${eventType}" maps to invalid category "${EVENT_CATEGORY_MAP[eventType]}"`
			).toBe(true);
		}
	});

	it('contains no unmapped categories', () => {
		const usedCategories = new Set(Object.values(EVENT_CATEGORY_MAP));
		for (const category of ALL_NOTIFICATION_CATEGORIES) {
			expect(
				usedCategories.has(category),
				`Category "${category}" is defined but no events map to it`
			).toBe(true);
		}
	});
});
