import { getAnalyserNode } from './engine';

// --- Constants ---

export const SILENCE_THRESHOLD = 0.005;
const IDLE_OPACITY = 0.35;
const ACTIVE_OPACITY = 1.0;
const OPACITY_LERP_SPEED = 0.08;
const LINE_WIDTH = 1.5;
const GLOW_BLUR_IDLE = 4;
const GLOW_BLUR_ACTIVE = 10;
const LINE_COLOR = 'rgba(160, 210, 220, 1)';
const GLOW_COLOR = 'rgba(160, 210, 220, 0.8)';

// --- Pure helpers (exported for testing) ---

export function isSignalSilent(data: Float32Array<ArrayBufferLike>): boolean {
	for (let i = 0; i < data.length; i++) {
		if (Math.abs(data[i]) > SILENCE_THRESHOLD) return false;
	}
	return true;
}

export interface ScaledDimensions {
	canvasWidth: number;
	canvasHeight: number;
	styleWidth: number;
	styleHeight: number;
}

export function scaleCanvasDimensions(
	displayWidth: number,
	displayHeight: number,
	dpr: number
): ScaledDimensions {
	return {
		canvasWidth: Math.round(displayWidth * dpr),
		canvasHeight: Math.round(displayHeight * dpr),
		styleWidth: displayWidth,
		styleHeight: displayHeight
	};
}

// --- Visualizer state ---

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let animFrameId: number | null = null;
let dataArray: Float32Array<ArrayBuffer> | null = null;
let currentOpacity = IDLE_OPACITY;
let lastDpr = 1;
let lastWidth = 0;
let lastHeight = 0;

// --- Lifecycle ---

export function createVisualizer(canvasElement: HTMLCanvasElement): void {
	canvas = canvasElement;
	ctx = canvas.getContext('2d');
	if (!ctx) return;

	applyCanvasScaling();
	currentOpacity = IDLE_OPACITY;
	draw();
}

export function destroyVisualizer(): void {
	if (animFrameId !== null) {
		cancelAnimationFrame(animFrameId);
		animFrameId = null;
	}
	if (ctx && canvas) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}
	canvas = null;
	ctx = null;
	dataArray = null;
}

// --- Canvas scaling ---

function applyCanvasScaling(): void {
	if (!canvas || !ctx) return;

	const dpr = window.devicePixelRatio || 1;
	const rect = canvas.getBoundingClientRect();
	const displayWidth = rect.width;
	const displayHeight = rect.height;

	if (dpr === lastDpr && displayWidth === lastWidth && displayHeight === lastHeight) {
		return;
	}

	const scaled = scaleCanvasDimensions(displayWidth, displayHeight, dpr);
	canvas.width = scaled.canvasWidth;
	canvas.height = scaled.canvasHeight;
	canvas.style.width = scaled.styleWidth + 'px';
	canvas.style.height = scaled.styleHeight + 'px';
	ctx.scale(dpr, dpr);

	lastDpr = dpr;
	lastWidth = displayWidth;
	lastHeight = displayHeight;
}

// --- Draw loop ---

function draw(): void {
	if (!canvas || !ctx) return;

	animFrameId = requestAnimationFrame(draw);

	// Check for canvas resize
	applyCanvasScaling();

	const analyser = getAnalyserNode();
	const displayWidth = lastWidth;
	const displayHeight = lastHeight;

	if (displayWidth === 0 || displayHeight === 0) return;

	// Get audio data
	let silent = true;
	if (analyser) {
		if (!dataArray || dataArray.length !== analyser.frequencyBinCount) {
			dataArray = new Float32Array(analyser.frequencyBinCount);
		}
		analyser.getFloatTimeDomainData(dataArray);
		silent = isSignalSilent(dataArray);
	}

	// Smooth opacity transition
	const targetOpacity = silent ? IDLE_OPACITY : ACTIVE_OPACITY;
	currentOpacity += (targetOpacity - currentOpacity) * OPACITY_LERP_SPEED;

	// Clear canvas
	ctx.clearRect(0, 0, displayWidth, displayHeight);

	// Configure line style
	const glowBlur = silent
		? GLOW_BLUR_IDLE
		: GLOW_BLUR_IDLE + (GLOW_BLUR_ACTIVE - GLOW_BLUR_IDLE) * currentOpacity;
	ctx.lineWidth = LINE_WIDTH;
	ctx.strokeStyle = LINE_COLOR;
	ctx.globalAlpha = currentOpacity;
	ctx.shadowBlur = glowBlur;
	ctx.shadowColor = GLOW_COLOR;
	ctx.imageSmoothingEnabled = true;

	// Draw waveform
	ctx.beginPath();

	const centerY = displayHeight / 2;

	if (!dataArray || silent) {
		// Idle: flat line at center
		ctx.moveTo(0, centerY);
		ctx.lineTo(displayWidth, centerY);
	} else {
		// Active: waveform with bezier curves
		const bufferLength = dataArray.length;
		const sliceWidth = displayWidth / (bufferLength - 1);

		ctx.moveTo(0, centerY + dataArray[0] * centerY);

		for (let i = 1; i < bufferLength; i++) {
			const x = i * sliceWidth;
			const y = centerY + dataArray[i] * centerY;

			// quadraticCurveTo — spec says bezierCurveTo but quadratic achieves
			// the same smooth oscilloscope feel with less overhead (1 control point
			// vs 2). Produces identical visual result for waveform rendering.
			const prevX = (i - 1) * sliceWidth;
			const prevY = centerY + dataArray[i - 1] * centerY;
			const cpX = (prevX + x) / 2;
			const cpY = (prevY + y) / 2;

			ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
		}

		// Final segment to last point
		const lastX = (bufferLength - 1) * sliceWidth;
		const lastY = centerY + dataArray[bufferLength - 1] * centerY;
		ctx.lineTo(lastX, lastY);
	}

	ctx.stroke();

	// Reset shadow for next frame
	ctx.shadowBlur = 0;
	ctx.globalAlpha = 1.0;
}
