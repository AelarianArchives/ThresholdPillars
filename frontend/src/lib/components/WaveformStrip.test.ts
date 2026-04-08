import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { audioSettingsStore, audioPanelOpen } from '$lib/stores/audio';

// vi.hoisted runs before hoisted vi.mock calls — safe to reference in factories
const {
	mockInitAudioEngine,
	mockResumeContext,
	mockCreateVisualizer,
	mockDestroyVisualizer
} = vi.hoisted(() => ({
	mockInitAudioEngine: vi.fn().mockResolvedValue(undefined),
	mockResumeContext: vi.fn().mockResolvedValue(undefined),
	mockCreateVisualizer: vi.fn(),
	mockDestroyVisualizer: vi.fn()
}));

vi.mock('$lib/audio/engine', () => ({
	initAudioEngine: mockInitAudioEngine,
	resumeContext: mockResumeContext,
	getAnalyserNode: vi.fn().mockReturnValue(null)
}));

vi.mock('$lib/audio/visualizer', () => ({
	createVisualizer: mockCreateVisualizer,
	destroyVisualizer: mockDestroyVisualizer
}));

import WaveformStrip from './WaveformStrip.svelte';

describe('WaveformStrip.svelte', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		// Reset stores to defaults
		audioSettingsStore.set({
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
			ambientMode: 'notification'
		});
		audioPanelOpen.set(false);
	});

	it('renders the strip container', () => {
		const { container } = render(WaveformStrip);
		const strip = container.querySelector('.waveform-strip');
		expect(strip).not.toBeNull();
	});

	it('renders a canvas element', () => {
		const { container } = render(WaveformStrip);
		const canvas = container.querySelector('.waveform-canvas');
		expect(canvas).not.toBeNull();
		expect(canvas?.tagName).toBe('CANVAS');
	});

	it('renders mute and panel toggle buttons', () => {
		const { getByLabelText } = render(WaveformStrip);
		expect(getByLabelText('Mute audio')).toBeTruthy();
		expect(getByLabelText('Open audio panel')).toBeTruthy();
	});

	it('calls createVisualizer on mount with strip mode', async () => {
		render(WaveformStrip);
		await vi.waitFor(() => {
			expect(mockCreateVisualizer).toHaveBeenCalledTimes(1);
		});
		const [canvasArg, modeArg] = mockCreateVisualizer.mock.calls[0];
		expect(canvasArg).toBeInstanceOf(HTMLCanvasElement);
		expect(modeArg).toBe('strip');
	});

	it('calls destroyVisualizer on unmount', async () => {
		const { unmount } = render(WaveformStrip);
		await vi.waitFor(() => {
			expect(mockCreateVisualizer).toHaveBeenCalled();
		});
		unmount();
		expect(mockDestroyVisualizer).toHaveBeenCalledTimes(1);
	});

	it('initializes audio engine on first strip click', async () => {
		const { container } = render(WaveformStrip);
		const strip = container.querySelector('.waveform-strip')!;
		await fireEvent.click(strip);
		expect(mockInitAudioEngine).toHaveBeenCalledTimes(1);
		expect(mockResumeContext).toHaveBeenCalledTimes(1);
	});

	it('does not re-initialize engine on subsequent clicks', async () => {
		const { container } = render(WaveformStrip);
		const strip = container.querySelector('.waveform-strip')!;
		await fireEvent.click(strip);
		await fireEvent.click(strip);
		expect(mockInitAudioEngine).toHaveBeenCalledTimes(1);
		expect(mockResumeContext).toHaveBeenCalledTimes(2);
	});

	it('toggles masterMute in store when mute button clicked', async () => {
		const { getByLabelText } = render(WaveformStrip);
		expect(get(audioSettingsStore).masterMute).toBe(false);

		const muteBtn = getByLabelText('Mute audio');
		await fireEvent.click(muteBtn);
		expect(get(audioSettingsStore).masterMute).toBe(true);
	});

	it('updates mute button label when muted', async () => {
		const { getByLabelText } = render(WaveformStrip);
		const muteBtn = getByLabelText('Mute audio');
		await fireEvent.click(muteBtn);
		expect(getByLabelText('Unmute audio')).toBeTruthy();
	});

	it('toggles audioPanelOpen store when panel button clicked', async () => {
		const { getByLabelText } = render(WaveformStrip);
		expect(get(audioPanelOpen)).toBe(false);

		const panelBtn = getByLabelText('Open audio panel');
		await fireEvent.click(panelBtn);
		expect(get(audioPanelOpen)).toBe(true);
	});

	it('updates panel button label when panel is open', async () => {
		const { getByLabelText } = render(WaveformStrip);
		const panelBtn = getByLabelText('Open audio panel');
		await fireEvent.click(panelBtn);
		expect(getByLabelText('Close audio panel')).toBeTruthy();
	});

	it('mute button click does not trigger engine init', async () => {
		const { getByLabelText } = render(WaveformStrip);
		const muteBtn = getByLabelText('Mute audio');
		await fireEvent.click(muteBtn);
		// stopPropagation prevents strip click handler from firing
		expect(mockInitAudioEngine).not.toHaveBeenCalled();
	});
});
