import type { NodeId, OriginId } from './events';

// --- Origin pan positions ---
// Updated by ResonanceCanvas during its animation loop.
// Read by the audio engine when playing origin node clips.

const originPanValues: Map<OriginId, number> = new Map();

// --- Pure helper (exported for testing) ---

export function normalizeXToPan(x: number, canvasWidth: number): number {
	if (canvasWidth <= 0) return 0.0;
	const raw = (x / canvasWidth) * 2 - 1;
	return Math.max(-1.0, Math.min(1.0, raw));
}

// --- Position updates ---

export function updateOriginPosition(
	originId: OriginId,
	x: number,
	canvasWidth: number
): void {
	const pan = normalizeXToPan(x, canvasWidth);
	originPanValues.set(originId, pan);
}

// --- Pan value lookup ---

export function getOriginPan(nodeId: NodeId): number {
	return originPanValues.get(nodeId as OriginId) ?? 0.0;
}

// --- Engine registration ---
// Called from +layout.svelte after initAudioEngine() to wire spatial
// panning into the playback chain. Avoids circular import by accepting
// the registration function as a parameter.

export function initSpatialPanning(
	registerFn: (fn: (nodeId: NodeId) => number) => void
): void {
	registerFn(getOriginPan);
}
