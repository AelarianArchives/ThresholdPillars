import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { audioSettingsStore, audioPanelOpen } from '$lib/stores/audio';

const {
	mockResumeContext,
	mockPlayNode,
	mockPlayFieldRead,
	mockCreateVisualizer,
	mockDestroyVisualizer
} = vi.hoisted(() => ({
	mockResumeContext: vi.fn().mockResolvedValue(undefined),
	mockPlayNode: vi.fn(),
	mockPlayFieldRead: vi.fn().mockResolvedValue(undefined),
	mockCreateVisualizer: vi.fn(),
	mockDestroyVisualizer: vi.fn()
}));

vi.mock('$lib/audio/engine', () => ({
	initAudioEngine: vi.fn().mockResolvedValue(undefined),
	resumeContext: mockResumeContext,
	playNode: mockPlayNode,
	playFieldRead: mockPlayFieldRead,
	getAnalyserNode: vi.fn().mockReturnValue(null)
}));

vi.mock('$lib/audio/visualizer', () => ({
	createVisualizer: mockCreateVisualizer,
	destroyVisualizer: mockDestroyVisualizer
}));

import AudioPanel from './AudioPanel.svelte';

function defaultSettings() {
	return {
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
		ambientMode: 'notification' as const,
		heartbeatIntervalMs: 60000
	};
}

describe('AudioPanel.svelte', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		audioSettingsStore.set(defaultSettings());
		audioPanelOpen.set(true);
	});

	it('renders the panel container', () => {
		const { container } = render(AudioPanel);
		const panel = container.querySelector('.audio-panel');
		expect(panel).not.toBeNull();
	});

	it('renders a canvas element for panel visualizer', () => {
		const { container } = render(AudioPanel);
		const canvas = container.querySelector('.panel-canvas');
		expect(canvas).not.toBeNull();
		expect(canvas?.tagName).toBe('CANVAS');
	});

	it('calls createVisualizer with panel mode on mount', async () => {
		render(AudioPanel);
		await vi.waitFor(() => {
			expect(mockCreateVisualizer).toHaveBeenCalledTimes(1);
		});
		const [canvasArg, modeArg] = mockCreateVisualizer.mock.calls[0];
		expect(canvasArg).toBeInstanceOf(HTMLCanvasElement);
		expect(modeArg).toBe('panel');
	});

	it('calls destroyVisualizer on unmount', async () => {
		const { unmount } = render(AudioPanel);
		await vi.waitFor(() => {
			expect(mockCreateVisualizer).toHaveBeenCalled();
		});
		unmount();
		expect(mockDestroyVisualizer).toHaveBeenCalledTimes(1);
	});

	it('renders three origin cards with correct names', () => {
		const { getByLabelText } = render(AudioPanel);
		expect(getByLabelText('Play Larimar')).toBeTruthy();
		expect(getByLabelText('Play Verith')).toBeTruthy();
		expect(getByLabelText("Play Cael'Thera")).toBeTruthy();
	});

	it('calls playNode when origin card is clicked', async () => {
		const { getByLabelText } = render(AudioPanel);
		await fireEvent.click(getByLabelText('Play Larimar'));
		expect(mockResumeContext).toHaveBeenCalled();
		expect(mockPlayNode).toHaveBeenCalledWith('o01');
	});

	it('close button sets audioPanelOpen to false', async () => {
		const { getByLabelText } = render(AudioPanel);
		expect(get(audioPanelOpen)).toBe(true);
		await fireEvent.click(getByLabelText('Close audio panel'));
		expect(get(audioPanelOpen)).toBe(false);
	});

	it('renders section headers for all control groups', () => {
		const { container } = render(AudioPanel);
		const headers = container.querySelectorAll('.section-header');
		const names = Array.from(headers).map((h) => h.textContent?.trim());
		expect(names).toContain('Node Browser');
		expect(names).toContain('Tier Controls');
		expect(names).toContain('Field Read');
		expect(names).toContain('Mix');
		expect(names).toContain('Succession Player');
		expect(names).toContain('Cluster Play');
	});

	it('sections start collapsed', () => {
		const { container } = render(AudioPanel);
		const bodies = container.querySelectorAll('.section-body');
		expect(bodies.length).toBe(0);
	});

	it('clicking section header expands the section', async () => {
		const { container } = render(AudioPanel);
		const headers = container.querySelectorAll('.section-header');
		// Click "Tier Controls"
		const tierHeader = Array.from(headers).find((h) =>
			h.textContent?.trim() === 'Tier Controls'
		)!;
		await fireEvent.click(tierHeader);
		const bodies = container.querySelectorAll('.section-body');
		expect(bodies.length).toBe(1);
	});

	it('tier mute checkbox toggles store', async () => {
		const { container } = render(AudioPanel);
		// Open tier controls
		const headers = container.querySelectorAll('.section-header');
		const tierHeader = Array.from(headers).find((h) =>
			h.textContent?.trim() === 'Tier Controls'
		)!;
		await fireEvent.click(tierHeader);

		// Find origin checkbox (first one) and uncheck it
		const checkboxes = container.querySelectorAll('.tier-label input[type="checkbox"]');
		expect(checkboxes.length).toBe(5);
		await fireEvent.click(checkboxes[0]); // origin
		expect(get(audioSettingsStore).tierMute.origin).toBe(true);
	});

	it('field read button calls playFieldRead', async () => {
		const { container } = render(AudioPanel);
		// Open field read section
		const headers = container.querySelectorAll('.section-header');
		const frHeader = Array.from(headers).find((h) =>
			h.textContent?.trim() === 'Field Read'
		)!;
		await fireEvent.click(frHeader);

		const btn = container.querySelector('.action-btn')!;
		await fireEvent.click(btn);
		expect(mockResumeContext).toHaveBeenCalled();
		expect(mockPlayFieldRead).toHaveBeenCalledWith([]);
	});

	it('ambient mode buttons update store', async () => {
		const { container, getByLabelText } = render(AudioPanel);
		// Open mix section
		const headers = container.querySelectorAll('.section-header');
		const mixHeader = Array.from(headers).find((h) =>
			h.textContent?.trim() === 'Mix'
		)!;
		await fireEvent.click(mixHeader);

		await fireEvent.click(getByLabelText('Set ambient mode to Drone'));
		expect(get(audioSettingsStore).ambientMode).toBe('drone');
	});

	it('stubbed sections show Phase 4 message', async () => {
		const { container } = render(AudioPanel);
		const headers = container.querySelectorAll('.section-header');
		const successionHeader = Array.from(headers).find((h) =>
			h.textContent?.trim() === 'Succession Player'
		)!;
		await fireEvent.click(successionHeader);
		const note = container.querySelector('.stubbed-note');
		expect(note?.textContent).toContain('Phase 4');
	});

	it('panel has role dialog and aria-label', () => {
		const { container } = render(AudioPanel);
		const panel = container.querySelector('.audio-panel');
		expect(panel?.getAttribute('role')).toBe('dialog');
		expect(panel?.getAttribute('aria-label')).toBe('Audio panel');
	});
});
