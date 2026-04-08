import { get } from 'svelte/store';
import { audioEventStore, NOTIFIER_MAP, ORIGIN_IDS, type AudioEvent, type NodeId } from './events';
import {
	audioPlaybackStore,
	audioSettingsStore,
	EVENT_CATEGORY_MAP,
	type AudioSettingsState,
	type PlayingVoice
} from '$lib/stores/audio';

// --- Constants (from RESONANCE ENGINE AUDIO SPEC.md) ---

export const CLIP_BASE_PATH = '/Audio/Nodes';
export const MAX_VOICES = 2;
export const VELOCITY_WINDOW_MS = 5000;
export const VELOCITY_GAIN_STEP_DB = 1;
export const VELOCITY_MAX_STACK_DB = 4;
export const RUPTURE_T3_FADE_MS = 80;
export const RUPTURE_T2_DURATION_MS = 1500;
const DECAY_HANDOFF_MS = 500;

// --- Pure helpers (exported for testing) ---

export function getClipPath(nodeId: string): string {
	return `${CLIP_BASE_PATH}/${nodeId}.wav`;
}

export function getDecayTailMs(clusterSize: number): number {
	if (clusterSize <= 3) return 3000;
	if (clusterSize <= 6) return 4000;
	return 5000;
}

export function getVelocityGainDb(fireCount: number): number {
	if (fireCount <= 1) return 0;
	return Math.min(fireCount - 1, VELOCITY_MAX_STACK_DB);
}

export function getClusterGainBoostDb(clusterSize: number): number {
	if (clusterSize <= 1) return 0;
	if (clusterSize <= 3) return 1;
	if (clusterSize <= 6) return 2;
	return 3;
}

export function dbToLinear(db: number): number {
	return Math.pow(10, db / 20);
}

// --- Module state ---

let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let masterGain: GainNode | null = null;
let clipBuffers: Map<string, AudioBuffer> = new Map();
let loaded = false;

interface Voice {
	nodeId: NodeId;
	source: AudioBufferSourceNode;
	gainNode: GainNode;
	startTime: number;
}

let activeVoices: Voice[] = [];
let decayingVoice: Voice | null = null;
let velocityTracker: Map<string, { count: number; lastFire: number }> = new Map();
let fieldReadAbort: AbortController | null = null;
let eventUnsub: (() => void) | null = null;
let settingsSnapshot: AudioSettingsState = get(audioSettingsStore);
let settingsUnsub: (() => void) | null = null;

// Spatial panning hook — set by spatial.ts via registerSpatialPanning
let getPanValue: ((nodeId: NodeId) => number) | null = null;

// --- Node tier lookup ---

const ORIGIN_SET: ReadonlySet<string> = new Set(ORIGIN_IDS);

function getNodeTier(nodeId: string): 'origin' | 'threshold' | 'layer' | 'pillar' | 'seed' {
	if (ORIGIN_SET.has(nodeId)) return 'origin';
	if (nodeId.startsWith('th')) return 'threshold';
	if (nodeId.startsWith('l')) return 'layer';
	if (nodeId.startsWith('p')) return 'pillar';
	return 'seed';
}

// --- Initialization ---

export async function initAudioEngine(): Promise<void> {
	audioCtx = new AudioContext();

	// AnalyserNode for waveform visualizer
	analyser = audioCtx.createAnalyser();
	analyser.fftSize = 2048;

	// Master gain node
	masterGain = audioCtx.createGain();
	masterGain.connect(analyser);
	analyser.connect(audioCtx.destination);

	// Update store with initial context state
	audioPlaybackStore.update((s) => ({ ...s, contextState: audioCtx!.state }));

	// Listen for context state changes
	audioCtx.addEventListener('statechange', () => {
		if (audioCtx) {
			audioPlaybackStore.update((s) => ({ ...s, contextState: audioCtx!.state }));
		}
	});

	// Load all clips
	await loadClips();

	// Subscribe to event store for notifications
	eventUnsub = audioEventStore.subscribe(handleAudioEvent);

	// Subscribe to settings store for live updates
	settingsUnsub = audioSettingsStore.subscribe((s) => {
		settingsSnapshot = s;
		applyMasterMute();
	});
}

async function loadClips(): Promise<void> {
	const { ALL_NODE_IDS } = await import('./events');

	const loadPromises = ALL_NODE_IDS.map(async (nodeId) => {
		try {
			const response = await fetch(getClipPath(nodeId));
			if (!response.ok) {
				console.warn(`[audio] clip missing: ${nodeId} (${response.status})`);
				return;
			}
			const arrayBuffer = await response.arrayBuffer();
			const audioBuffer = await audioCtx!.decodeAudioData(arrayBuffer);
			clipBuffers.set(nodeId, audioBuffer);
		} catch (err) {
			console.warn(`[audio] clip load failed: ${nodeId}`, err);
		}
	});

	await Promise.all(loadPromises);
	loaded = true;
	console.log(`[audio] loaded ${clipBuffers.size}/62 clips`);
}

// --- Context resume ---

export async function resumeContext(): Promise<void> {
	if (audioCtx && audioCtx.state === 'suspended') {
		await audioCtx.resume();
	}
}

// --- Spatial panning registration ---

export function registerSpatialPanning(fn: (nodeId: NodeId) => number): void {
	getPanValue = fn;
}

// --- AnalyserNode access ---

export function getAnalyserNode(): AnalyserNode | null {
	return analyser;
}

// --- Master mute ---

function applyMasterMute(): void {
	if (masterGain && audioCtx) {
		const target = settingsSnapshot.masterMute ? 0 : 1;
		masterGain.gain.setValueAtTime(target, audioCtx.currentTime);
	}
}

// --- Velocity tracking ---

function getVelocityCount(nodeId: string, now: number): number {
	const entry = velocityTracker.get(nodeId);
	if (!entry || now - entry.lastFire > VELOCITY_WINDOW_MS) {
		velocityTracker.set(nodeId, { count: 1, lastFire: now });
		return 1;
	}
	const newCount = entry.count + 1;
	velocityTracker.set(nodeId, { count: newCount, lastFire: now });
	return newCount;
}

// --- Voice queue ---

function computeGain(nodeId: string, clusterSize: number): number {
	const tier = getNodeTier(nodeId);
	const tierVol = settingsSnapshot.tierVolume[tier];
	const now = Date.now();
	const velocityCount = getVelocityCount(nodeId, now);
	const velocityDb = getVelocityGainDb(velocityCount);
	const clusterDb = getClusterGainBoostDb(clusterSize);
	return tierVol * dbToLinear(velocityDb + clusterDb);
}

function createVoice(nodeId: NodeId, gain: number): Voice | null {
	if (!audioCtx || !masterGain || !loaded) return null;

	const buffer = clipBuffers.get(nodeId);
	if (!buffer) {
		console.warn(`[audio] no buffer for node: ${nodeId}`);
		return null;
	}

	const source = audioCtx.createBufferSource();
	source.buffer = buffer;

	const gainNode = audioCtx.createGain();
	gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);

	source.connect(gainNode);

	// Spatial panning for origin nodes
	if (ORIGIN_SET.has(nodeId) && getPanValue) {
		const panValue = getPanValue(nodeId);
		const panner = audioCtx.createStereoPanner();
		panner.pan.setValueAtTime(panValue, audioCtx.currentTime);
		gainNode.connect(panner);
		panner.connect(masterGain);
	} else {
		gainNode.connect(masterGain);
	}

	const voice: Voice = {
		nodeId,
		source,
		gainNode,
		startTime: audioCtx.currentTime
	};

	source.addEventListener('ended', () => {
		removeVoice(voice);
	});

	source.start();
	return voice;
}

function fadeOutVoice(voice: Voice, durationMs: number): void {
	if (!audioCtx) return;
	const endTime = audioCtx.currentTime + durationMs / 1000;
	voice.gainNode.gain.linearRampToValueAtTime(0, endTime);
	voice.source.stop(endTime);
}

function removeVoice(voice: Voice): void {
	activeVoices = activeVoices.filter((v) => v !== voice);
	if (decayingVoice === voice) {
		decayingVoice = null;
	}
	syncPlaybackStore();
}

function enqueueVoice(nodeId: NodeId, gain: number): void {
	// If queue is full, decay the oldest voice
	if (activeVoices.length >= MAX_VOICES) {
		const oldest = activeVoices.shift()!;
		if (decayingVoice) {
			// Force-stop the previous decaying voice
			decayingVoice.source.stop();
		}
		decayingVoice = oldest;
		fadeOutVoice(oldest, DECAY_HANDOFF_MS);
	}

	const voice = createVoice(nodeId, gain);
	if (voice) {
		activeVoices.push(voice);
		syncPlaybackStore();
	}
}

// --- Rupture handling ---

function handleRupture(event: AudioEvent): void {
	if (!audioCtx) return;

	const tier = event.tier ?? 1;

	if (tier === 3) {
		// INTERRUPT — fast fade all active voices
		for (const voice of activeVoices) {
			fadeOutVoice(voice, RUPTURE_T3_FADE_MS);
		}
		if (decayingVoice) {
			fadeOutVoice(decayingVoice, RUPTURE_T3_FADE_MS);
		}
		activeVoices = [];
		decayingVoice = null;

		// Cancel active field read
		if (fieldReadAbort) {
			fieldReadAbort.abort();
			fieldReadAbort = null;
		}

		// Play s20 at max gain with longest decay
		const voice = createVoice('s20', 1.0);
		if (voice) {
			activeVoices.push(voice);
			// Schedule decay tail (longest = 5000ms)
			const clipDuration = clipBuffers.get('s20')?.duration ?? 3;
			scheduleDecayTail(voice, clipDuration, 5000);
			syncPlaybackStore();
		}
	} else if (tier === 2) {
		// Truncated clip, hard stop at ~1500ms
		enqueueVoice('s20', computeGain('s20', 0));
		// Truncate: stop after RUPTURE_T2_DURATION_MS
		const latestVoice = activeVoices[activeVoices.length - 1];
		if (latestVoice && latestVoice.nodeId === 's20' && audioCtx) {
			const stopTime = audioCtx.currentTime + RUPTURE_T2_DURATION_MS / 1000;
			latestVoice.source.stop(stopTime);
		}
	} else {
		// Tier 1 — normal playback
		enqueueVoice('s20', computeGain('s20', 0));
	}
}

function scheduleDecayTail(voice: Voice, clipDuration: number, tailMs: number): void {
	if (!audioCtx) return;
	const decayStart = audioCtx.currentTime + clipDuration;
	const decayEnd = decayStart + tailMs / 1000;
	voice.gainNode.gain.setValueAtTime(
		voice.gainNode.gain.value,
		decayStart
	);
	voice.gainNode.gain.linearRampToValueAtTime(0, decayEnd);
	voice.source.stop(decayEnd);
}

// --- Event handling ---

function handleAudioEvent(event: AudioEvent | null): void {
	if (!event || !audioCtx || !loaded) return;
	if (audioCtx.state !== 'running') return;

	// Check notification category toggle
	const category = EVENT_CATEGORY_MAP[event.event_type];
	if (!settingsSnapshot.notificationToggles[category]) return;

	// Rupture has its own handler
	if (event.event_type === 'rupture') {
		handleRupture(event);
		return;
	}

	// Resolve notifier(s)
	const notifiers = Array.isArray(event.notifier)
		? event.notifier
		: [event.notifier];

	for (const nodeId of notifiers) {
		const gain = computeGain(nodeId, notifiers.length > 1 ? notifiers.length : 0);
		enqueueVoice(nodeId, gain);
	}
}

// --- Playback store sync ---

function syncPlaybackStore(): void {
	const voices: PlayingVoice[] = activeVoices.map((v) => ({
		nodeId: v.nodeId,
		startTime: v.startTime,
		gain: v.gainNode.gain.value
	}));

	const decaying: PlayingVoice | null = decayingVoice
		? {
				nodeId: decayingVoice.nodeId,
				startTime: decayingVoice.startTime,
				gain: decayingVoice.gainNode.gain.value
			}
		: null;

	audioPlaybackStore.update((s) => ({
		...s,
		playingVoices: voices,
		decayingVoice: decaying
	}));
}

// --- Public: manual playback ---

export function playNode(nodeId: NodeId, clusterSize: number = 0): void {
	if (!audioCtx || !loaded) return;
	if (audioCtx.state !== 'running') return;
	const gain = computeGain(nodeId, clusterSize);
	enqueueVoice(nodeId, gain);
}

// --- Public: stop all ---

export function stopAll(): void {
	for (const voice of activeVoices) {
		voice.source.stop();
	}
	if (decayingVoice) {
		decayingVoice.source.stop();
	}
	activeVoices = [];
	decayingVoice = null;
	syncPlaybackStore();
}

// --- Public: field read ---

export interface FieldReadNode {
	nodeId: NodeId;
	weight: number;
}

export async function playFieldRead(activeSeeds: FieldReadNode[]): Promise<void> {
	if (!audioCtx || !loaded || audioCtx.state !== 'running') return;

	// Cancel any in-progress field read
	if (fieldReadAbort) {
		fieldReadAbort.abort();
	}
	fieldReadAbort = new AbortController();
	const signal = fieldReadAbort.signal;

	// Stop current playback
	stopAll();

	const wait = (ms: number) =>
		new Promise<void>((resolve, reject) => {
			const timer = setTimeout(resolve, ms);
			signal.addEventListener('abort', () => {
				clearTimeout(timer);
				reject(new DOMException('Aborted', 'AbortError'));
			});
		});

	try {
		// 1. Thresholds — simultaneous drone chord (~1.5s)
		const thresholdIds: NodeId[] = [
			'th01', 'th02', 'th03', 'th04', 'th05', 'th06',
			'th07', 'th08', 'th09', 'th10', 'th11', 'th12'
		];
		const droneVoices: Voice[] = [];
		for (const id of thresholdIds) {
			const buffer = clipBuffers.get(id);
			if (!buffer || !audioCtx || !masterGain) continue;
			const source = audioCtx.createBufferSource();
			source.buffer = buffer;
			const gainNode = audioCtx.createGain();
			gainNode.gain.setValueAtTime(
				settingsSnapshot.tierVolume.threshold * 0.3,
				audioCtx.currentTime
			);
			source.connect(gainNode);
			gainNode.connect(masterGain);
			// Stop after 1.5s with fade
			const fadeEnd = audioCtx.currentTime + 1.5;
			gainNode.gain.linearRampToValueAtTime(0, fadeEnd);
			source.start();
			source.stop(fadeEnd + 0.1);
			droneVoices.push({ nodeId: id, source, gainNode, startTime: audioCtx.currentTime });
		}
		await wait(1500);

		// 2. Origins — succession, 500ms spacing, with spatial panning
		const originIds: NodeId[] = ['o01', 'o02', 'o03'];
		for (const id of originIds) {
			if (signal.aborted) return;
			playNode(id);
			await wait(500);
		}

		// 3. Layers — succession, 400ms spacing
		const layerIds: NodeId[] = ['l01', 'l02', 'l03', 'l04'];
		for (const id of layerIds) {
			if (signal.aborted) return;
			playNode(id);
			await wait(400);
		}

		// 4. Pillars — succession, 400ms spacing
		const pillarIds: NodeId[] = ['p01', 'p02', 'p03'];
		for (const id of pillarIds) {
			if (signal.aborted) return;
			playNode(id);
			await wait(400);
		}

		// 5. Seeds — active only, weakest→strongest, 200ms spacing
		const sortedSeeds = [...activeSeeds].sort((a, b) => a.weight - b.weight);
		for (const seed of sortedSeeds) {
			if (signal.aborted) return;
			playNode(seed.nodeId, sortedSeeds.length);
			await wait(200);
		}
	} catch (err) {
		if (err instanceof DOMException && err.name === 'AbortError') {
			// Field read cancelled (e.g., by Rupture Tier 3)
			return;
		}
		throw err;
	} finally {
		if (fieldReadAbort?.signal === signal) {
			fieldReadAbort = null;
		}
	}
}

// --- Public: cleanup ---

export function destroyAudioEngine(): void {
	if (eventUnsub) {
		eventUnsub();
		eventUnsub = null;
	}
	if (settingsUnsub) {
		settingsUnsub();
		settingsUnsub = null;
	}
	stopAll();
	if (audioCtx) {
		audioCtx.close();
		audioCtx = null;
	}
	analyser = null;
	masterGain = null;
	clipBuffers.clear();
	loaded = false;
	velocityTracker.clear();
	getPanValue = null;
}
