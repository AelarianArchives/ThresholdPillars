import { describe, it, expect } from 'vitest';
import { isSignalSilent, scaleCanvasDimensions, SILENCE_THRESHOLD } from './visualizer';

describe('visualizer.ts — silence detection', () => {
	it('detects silence when all samples are zero', () => {
		const data = new Float32Array(1024).fill(0);
		expect(isSignalSilent(data)).toBe(true);
	});

	it('detects silence when all samples are below threshold', () => {
		const data = new Float32Array(1024).fill(SILENCE_THRESHOLD * 0.5);
		expect(isSignalSilent(data)).toBe(true);
	});

	it('detects active signal when any sample exceeds threshold', () => {
		const data = new Float32Array(1024).fill(0);
		data[512] = SILENCE_THRESHOLD * 2;
		expect(isSignalSilent(data)).toBe(false);
	});

	it('detects active signal with negative values', () => {
		const data = new Float32Array(1024).fill(0);
		data[100] = -SILENCE_THRESHOLD * 2;
		expect(isSignalSilent(data)).toBe(false);
	});

	it('handles empty array as silent', () => {
		const data = new Float32Array(0);
		expect(isSignalSilent(data)).toBe(true);
	});
});

describe('visualizer.ts — canvas scaling', () => {
	it('returns 1:1 dimensions for DPR 1', () => {
		const result = scaleCanvasDimensions(800, 200, 1);
		expect(result.canvasWidth).toBe(800);
		expect(result.canvasHeight).toBe(200);
		expect(result.styleWidth).toBe(800);
		expect(result.styleHeight).toBe(200);
	});

	it('doubles canvas dimensions for DPR 2 (retina)', () => {
		const result = scaleCanvasDimensions(800, 200, 2);
		expect(result.canvasWidth).toBe(1600);
		expect(result.canvasHeight).toBe(400);
		expect(result.styleWidth).toBe(800);
		expect(result.styleHeight).toBe(200);
	});

	it('handles fractional DPR', () => {
		const result = scaleCanvasDimensions(800, 200, 1.5);
		expect(result.canvasWidth).toBe(1200);
		expect(result.canvasHeight).toBe(300);
		expect(result.styleWidth).toBe(800);
		expect(result.styleHeight).toBe(200);
	});

	it('handles zero dimensions safely', () => {
		const result = scaleCanvasDimensions(0, 0, 2);
		expect(result.canvasWidth).toBe(0);
		expect(result.canvasHeight).toBe(0);
	});
});

// --- Documented test specs for browser-only tests ---

// TEST SPEC: createVisualizer
// - Accepts a canvas element and starts the draw loop
// - Calls getAnalyserNode() to get the AnalyserNode
// - If AnalyserNode is null, renders idle state (flat line)
// - Sets up retina scaling on the canvas
// - Runs requestAnimationFrame loop

// TEST SPEC: draw loop — idle state
// - Flat horizontal line at vertical center
// - Line opacity 0.3-0.4
// - shadowBlur glow active but dim

// TEST SPEC: draw loop — active state
// - Waveform follows audio data from getFloatTimeDomainData
// - Line opacity 1.0
// - shadowBlur glow at full intensity (8-12px)
// - Smooth bezierCurveTo curves between sample points

// TEST SPEC: draw loop — transition
// - Smooth opacity fade between idle and active (not a hard switch)
// - Transition driven by silence detection threshold crossing

// TEST SPEC: destroyVisualizer
// - Cancels requestAnimationFrame
// - Clears canvas
// - Releases references
