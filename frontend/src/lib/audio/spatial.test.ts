import { describe, it, expect } from 'vitest';
import { normalizeXToPan, updateOriginPosition, getOriginPan } from './spatial';

describe('spatial.ts — normalizeXToPan', () => {
	it('returns 0.0 for center of canvas', () => {
		expect(normalizeXToPan(500, 1000)).toBeCloseTo(0.0);
	});

	it('returns -1.0 for left edge', () => {
		expect(normalizeXToPan(0, 1000)).toBeCloseTo(-1.0);
	});

	it('returns 1.0 for right edge', () => {
		expect(normalizeXToPan(1000, 1000)).toBeCloseTo(1.0);
	});

	it('returns -0.5 for quarter-left', () => {
		expect(normalizeXToPan(250, 1000)).toBeCloseTo(-0.5);
	});

	it('returns 0.5 for quarter-right', () => {
		expect(normalizeXToPan(750, 1000)).toBeCloseTo(0.5);
	});

	it('clamps values below -1.0', () => {
		expect(normalizeXToPan(-100, 1000)).toBeCloseTo(-1.0);
	});

	it('clamps values above 1.0', () => {
		expect(normalizeXToPan(1200, 1000)).toBeCloseTo(1.0);
	});

	it('returns 0.0 for zero canvas width (fallback)', () => {
		expect(normalizeXToPan(50, 0)).toBeCloseTo(0.0);
	});
});

describe('spatial.ts — origin position tracking', () => {
	it('returns 0.0 for an origin with no position set', () => {
		expect(getOriginPan('o01')).toBeCloseTo(0.0);
	});

	it('returns stored pan value after updateOriginPosition', () => {
		updateOriginPosition('o02', 750, 1000);
		expect(getOriginPan('o02')).toBeCloseTo(0.5);
	});

	it('updates pan value on position change', () => {
		updateOriginPosition('o03', 0, 1000);
		expect(getOriginPan('o03')).toBeCloseTo(-1.0);
		updateOriginPosition('o03', 1000, 1000);
		expect(getOriginPan('o03')).toBeCloseTo(1.0);
	});
});
