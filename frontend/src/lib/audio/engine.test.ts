import { describe, it, expect } from 'vitest';
import {
	getClipPath,
	getDecayTailMs,
	getVelocityGainDb,
	getClusterGainBoostDb,
	dbToLinear,
	applyAmbientMode,
	getActiveAmbientMode,
	CLIP_BASE_PATH,
	MAX_VOICES,
	VELOCITY_WINDOW_MS,
	VELOCITY_MAX_STACK_DB,
	RUPTURE_T3_FADE_MS,
	HEARTBEAT_ORIGIN_SPACING_MS
} from './engine';

describe('engine.ts — clip path resolution', () => {
	it('returns correct path for a threshold node', () => {
		expect(getClipPath('th01')).toBe(`${CLIP_BASE_PATH}/th01.wav`);
	});

	it('returns correct path for an origin node', () => {
		expect(getClipPath('o03')).toBe(`${CLIP_BASE_PATH}/o03.wav`);
	});

	it('returns correct path for a seed node', () => {
		expect(getClipPath('s40')).toBe(`${CLIP_BASE_PATH}/s40.wav`);
	});
});

describe('engine.ts — decay tail length', () => {
	it('returns 3000ms for solo notification (cluster size 0 or 1)', () => {
		expect(getDecayTailMs(0)).toBe(3000);
		expect(getDecayTailMs(1)).toBe(3000);
	});

	it('returns 3000ms for small cluster (2-3)', () => {
		expect(getDecayTailMs(2)).toBe(3000);
		expect(getDecayTailMs(3)).toBe(3000);
	});

	it('returns 4000ms for medium cluster (4-6)', () => {
		expect(getDecayTailMs(4)).toBe(4000);
		expect(getDecayTailMs(5)).toBe(4000);
		expect(getDecayTailMs(6)).toBe(4000);
	});

	it('returns 5000ms for large cluster (7+)', () => {
		expect(getDecayTailMs(7)).toBe(5000);
		expect(getDecayTailMs(10)).toBe(5000);
	});
});

describe('engine.ts — velocity stacking', () => {
	it('returns 0 dB for first fire (count 1)', () => {
		expect(getVelocityGainDb(1)).toBe(0);
	});

	it('returns +1 dB per successive fire', () => {
		expect(getVelocityGainDb(2)).toBe(1);
		expect(getVelocityGainDb(3)).toBe(2);
		expect(getVelocityGainDb(4)).toBe(3);
	});

	it('caps at +4 dB (VELOCITY_MAX_STACK_DB)', () => {
		expect(getVelocityGainDb(5)).toBe(VELOCITY_MAX_STACK_DB);
		expect(getVelocityGainDb(10)).toBe(VELOCITY_MAX_STACK_DB);
	});

	it('returns 0 dB for count 0 (no fires)', () => {
		expect(getVelocityGainDb(0)).toBe(0);
	});
});

describe('engine.ts — cluster gain boost', () => {
	it('returns 0 dB for cluster size 0-1', () => {
		expect(getClusterGainBoostDb(0)).toBe(0);
		expect(getClusterGainBoostDb(1)).toBe(0);
	});

	it('returns +1 dB for small cluster (2-3)', () => {
		expect(getClusterGainBoostDb(2)).toBe(1);
		expect(getClusterGainBoostDb(3)).toBe(1);
	});

	it('returns +2 dB for medium cluster (4-6)', () => {
		expect(getClusterGainBoostDb(4)).toBe(2);
		expect(getClusterGainBoostDb(6)).toBe(2);
	});

	it('returns +3 dB for large cluster (7+)', () => {
		expect(getClusterGainBoostDb(7)).toBe(3);
		expect(getClusterGainBoostDb(10)).toBe(3);
	});
});

describe('engine.ts — dB to linear conversion', () => {
	it('converts 0 dB to 1.0', () => {
		expect(dbToLinear(0)).toBeCloseTo(1.0);
	});

	it('converts +6 dB to ~2.0', () => {
		expect(dbToLinear(6)).toBeCloseTo(1.9953, 3);
	});

	it('converts -6 dB to ~0.5', () => {
		expect(dbToLinear(-6)).toBeCloseTo(0.5012, 3);
	});

	it('converts +1 dB correctly', () => {
		expect(dbToLinear(1)).toBeCloseTo(1.1220, 3);
	});
});

describe('engine.ts — constants from spec', () => {
	it('MAX_VOICES is 2', () => {
		expect(MAX_VOICES).toBe(2);
	});

	it('VELOCITY_WINDOW_MS is 5000', () => {
		expect(VELOCITY_WINDOW_MS).toBe(5000);
	});

	it('VELOCITY_MAX_STACK_DB is 4', () => {
		expect(VELOCITY_MAX_STACK_DB).toBe(4);
	});

	it('RUPTURE_T3_FADE_MS is 80', () => {
		expect(RUPTURE_T3_FADE_MS).toBe(80);
	});
});

// --- Documented test specs for browser-only tests ---
// These cannot run in jsdom (no Web Audio API).
// They document the expected behavior for browser integration tests.

// TEST SPEC: initAudioEngine
// - Creates AudioContext in suspended state
// - Fetches and decodes all 62 clips into AudioBuffers
// - Creates AnalyserNode (fftSize 2048) connected to destination
// - Creates master GainNode
// - Subscribes to audioEventStore
// - Sets audioPlaybackStore.contextState to 'suspended'
// - Logs missing/failed clips but does not throw

// TEST SPEC: resumeContext
// - Calls audioCtx.resume()
// - Updates audioPlaybackStore.contextState to 'running'

// TEST SPEC: playNode (single clip)
// - Creates AudioBufferSourceNode with the node's buffer
// - Creates GainNode with tier volume * velocity gain * cluster boost
// - Connects: source → gain → analyser → destination
// - Starts playback
// - Updates audioPlaybackStore.playingVoices
// - On ended: removes from playingVoices

// TEST SPEC: voice queue (3rd voice triggers decay)
// - With 2 voices active, playing a 3rd:
//   - Oldest voice moved to decayingVoice
//   - Decay fade applied (500ms default handoff)
//   - New voice starts
//   - playingVoices still max 2

// TEST SPEC: Rupture Tier 1
// - Plays s20, normal gain, 3-5s decay
// - Normal queue rules apply

// TEST SPEC: Rupture Tier 2
// - Plays s20, truncated at ~1500ms
// - Hard stop, ~1.5s decay
// - Normal queue rules apply

// TEST SPEC: Rupture Tier 3
// - All active voices fast-fade (80ms)
// - Plays s20 at maximum gain
// - Longest decay tail (5000ms)
// - Is the only interrupt in the system

// TEST SPEC: playFieldRead
// - Plays thresholds simultaneously as drone (~1.5s)
// - Then origins in succession (500ms spacing) with spatial panning
// - Then layers (400ms spacing)
// - Then pillars (400ms spacing)
// - Then active seeds weakest→strongest (200ms spacing)
// - Rupture Tier 3 cancels an active field read

describe('engine.ts — ambient mode constants', () => {
	it('HEARTBEAT_ORIGIN_SPACING_MS is 500', () => {
		expect(HEARTBEAT_ORIGIN_SPACING_MS).toBe(500);
	});
});

describe('engine.ts — ambient mode state (no AudioContext)', () => {
	it('starts in notification mode', () => {
		expect(getActiveAmbientMode()).toBe('notification');
	});

	it('applyAmbientMode switches to heartbeat', () => {
		applyAmbientMode('heartbeat', 60000);
		expect(getActiveAmbientMode()).toBe('heartbeat');
		// Clean up — heartbeat timer fires but playHeartbeatPulse
		// is a no-op without AudioContext, so no side effects
		applyAmbientMode('notification', 60000);
	});

	it('applyAmbientMode switches to drone', () => {
		applyAmbientMode('drone', 60000);
		expect(getActiveAmbientMode()).toBe('drone');
		applyAmbientMode('notification', 60000);
	});

	it('applyAmbientMode switches back to notification', () => {
		applyAmbientMode('heartbeat', 60000);
		applyAmbientMode('notification', 60000);
		expect(getActiveAmbientMode()).toBe('notification');
	});

	it('switching modes clears previous heartbeat (no double timers)', () => {
		// Switch to heartbeat, then immediately to drone
		// If heartbeat timer leaked, it would fire later — but without
		// AudioContext it's a no-op. This test verifies state tracking.
		applyAmbientMode('heartbeat', 60000);
		applyAmbientMode('drone', 60000);
		expect(getActiveAmbientMode()).toBe('drone');
		applyAmbientMode('notification', 60000);
	});
});

// --- Documented test specs for browser-only ambient mode tests ---

// TEST SPEC: heartbeat mode
// - Switching to heartbeat starts an interval timer at heartbeatIntervalMs
// - First pulse plays immediately on mode switch
// - Each pulse plays o01, o02, o03 in succession at 500ms spacing
// - Switching away from heartbeat clears the interval timer
// - Switching away aborts any in-progress heartbeat pulse
// - destroyAudioEngine clears the heartbeat timer
// - Heartbeat pulse is a no-op if AudioContext is not running

// TEST SPEC: drone mode
// - Switching to drone sets activeAmbientMode but produces no audio
// - Blocked on resonance engine field weight data
// - When field data is available: continuous low-gain playback from weights

// TEST SPEC: notification mode
// - Default behavior — events trigger clips via audioEventStore subscription
// - No additional timer or continuous playback
// - Switching to notification clears any heartbeat timer

// TEST SPEC: settings subscription mode detection
// - When audioSettingsStore.ambientMode changes, engine calls applyAmbientMode
// - When heartbeatIntervalMs changes while in heartbeat mode, timer restarts
//   with new interval
