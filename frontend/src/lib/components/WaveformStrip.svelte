<!--
  WaveformStrip.svelte
  Persistent ambient audio bar — bottom of every page via +layout.svelte.
  Full width, 40-50px tall.
  Contains: waveform canvas (strip render mode), mute toggle, panel toggle.
  Initializes AudioContext on first user click (browser gesture requirement).
-->

<script lang="ts">
	import { browser } from '$app/environment';
	import { createVisualizer, destroyVisualizer } from '$lib/audio/visualizer';
	import { initAudioEngine, resumeContext } from '$lib/audio/engine';
	import { audioSettingsStore, audioPanelOpen } from '$lib/stores/audio';

	let canvas: HTMLCanvasElement | undefined = $state();
	let engineInitialized = $state(false);

	// Initialize visualizer when canvas is available and panel is not open.
	// Visualizer is a singleton — only one canvas can drive it at a time.
	// When panel opens, strip yields. When panel closes, strip reclaims.
	$effect(() => {
		if (browser && canvas && !$audioPanelOpen) {
			createVisualizer(canvas, 'strip');
			return () => {
				destroyVisualizer();
			};
		}
	});

	async function handleStripClick(): Promise<void> {
		if (!browser) return;
		if (!engineInitialized) {
			engineInitialized = true;
			await initAudioEngine();
		}
		await resumeContext();
	}

	function toggleMute(): void {
		audioSettingsStore.update((s) => ({ ...s, masterMute: !s.masterMute }));
	}

	function togglePanel(): void {
		audioPanelOpen.update((v) => !v);
	}
</script>

{#if browser}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="waveform-strip" onclick={handleStripClick}>
		<canvas bind:this={canvas} class="waveform-canvas"></canvas>

		<div class="strip-controls">
			<button
				class="strip-btn mute-btn"
				onclick={(e) => {
					e.stopPropagation();
					toggleMute();
				}}
				aria-label={$audioSettingsStore.masterMute ? 'Unmute audio' : 'Mute audio'}
				title={$audioSettingsStore.masterMute ? 'Unmute' : 'Mute'}
			>
				{#if $audioSettingsStore.masterMute}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M11 5L6 9H2v6h4l5 4V5z" />
						<line x1="23" y1="9" x2="17" y2="15" />
						<line x1="17" y1="9" x2="23" y2="15" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M11 5L6 9H2v6h4l5 4V5z" />
						<path d="M19.07 4.93a10 10 0 010 14.14" />
						<path d="M15.54 8.46a5 5 0 010 7.07" />
					</svg>
				{/if}
			</button>

			<button
				class="strip-btn panel-btn"
				onclick={(e) => {
					e.stopPropagation();
					togglePanel();
				}}
				aria-label={$audioPanelOpen ? 'Close audio panel' : 'Open audio panel'}
				title={$audioPanelOpen ? 'Close panel' : 'Open panel'}
			>
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
					<path d="M8 12s1.5-3 4-3 4 3 4 3-1.5 3-4 3-4-3-4-3z" />
				</svg>
			</button>
		</div>
	</div>
{/if}

<style>
	.waveform-strip {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 44px;
		background: rgba(10, 12, 18, 0.92);
		border-top: 1px solid rgba(160, 210, 220, 0.15);
		display: flex;
		align-items: center;
		z-index: 100;
		cursor: pointer;
		user-select: none;
	}

	.waveform-canvas {
		flex: 1;
		height: 100%;
		display: block;
	}

	.strip-controls {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 0 8px;
		flex-shrink: 0;
	}

	.strip-btn {
		background: none;
		border: none;
		color: rgba(160, 210, 220, 0.7);
		cursor: pointer;
		padding: 6px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s, background 0.2s;
	}

	.strip-btn:hover {
		color: rgba(160, 210, 220, 1);
		background: rgba(160, 210, 220, 0.1);
	}

	.strip-btn:focus-visible {
		outline: 1px solid rgba(160, 210, 220, 0.5);
		outline-offset: 1px;
	}
</style>
