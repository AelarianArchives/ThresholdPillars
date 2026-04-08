<!--
  AudioPanel.svelte
  Full floating audio panel — opens via audioPanelOpen store toggle.
  Left-aligned, positioned above WaveformStrip (bottom: 44px).
  Contains: waveform canvas (panel mode), origin cards, node browser,
  tier controls, field read, mix controls. Collapsible sections.
-->

<script lang="ts">
	import { browser } from '$app/environment';
	import { createVisualizer, destroyVisualizer } from '$lib/audio/visualizer';
	import { resumeContext, playNode, playFieldRead } from '$lib/audio/engine';
	import {
		audioSettingsStore,
		audioPanelOpen,
		type AmbientMode
	} from '$lib/stores/audio';
	import { ORIGIN_COLORS, rgbToString } from '$lib/audio/colors';
	import {
		ORIGIN_IDS,
		THRESHOLD_IDS,
		LAYER_IDS,
		PILLAR_IDS,
		SEED_IDS,
		type NodeId,
		type NodeTier
	} from '$lib/audio/events';

	let canvas: HTMLCanvasElement | undefined = $state();

	// Collapsible section state
	let sections = $state({
		nodeBrowser: false,
		tierControls: false,
		fieldRead: false,
		mixControls: false,
		successionPlayer: false,
		clusterPlay: false
	});

	// Node browser active tier filter
	let browserTier: NodeTier = $state('origin');

	const ORIGIN_NAMES: Record<string, string> = {
		o01: 'Larimar',
		o02: 'Verith',
		o03: "Cael'Thera"
	};

	const TIER_LABELS: Record<NodeTier, string> = {
		origin: 'Origins',
		threshold: 'Thresholds',
		layer: 'Layers',
		pillar: 'Pillars',
		seed: 'Seeds'
	};

	const TIER_NODE_IDS: Record<NodeTier, readonly NodeId[]> = {
		origin: ORIGIN_IDS,
		threshold: THRESHOLD_IDS,
		layer: LAYER_IDS,
		pillar: PILLAR_IDS,
		seed: SEED_IDS
	};

	const AMBIENT_MODE_LABELS: Record<AmbientMode, string> = {
		notification: 'Notification',
		drone: 'Drone',
		heartbeat: 'Heartbeat'
	};

	// Initialize visualizer in panel mode when canvas is available
	$effect(() => {
		if (browser && canvas) {
			createVisualizer(canvas, 'panel');
			return () => {
				destroyVisualizer();
			};
		}
	});

	function closePanel(): void {
		audioPanelOpen.set(false);
	}

	async function handlePlayNode(nodeId: NodeId): Promise<void> {
		await resumeContext();
		playNode(nodeId);
	}

	async function handleFieldRead(): Promise<void> {
		await resumeContext();
		await playFieldRead([]);
	}

	function toggleSection(key: keyof typeof sections): void {
		sections[key] = !sections[key];
	}

	function setTierMute(tier: NodeTier, muted: boolean): void {
		audioSettingsStore.update((s) => ({
			...s,
			tierMute: { ...s.tierMute, [tier]: muted }
		}));
	}

	function setTierVolume(tier: NodeTier, volume: number): void {
		audioSettingsStore.update((s) => ({
			...s,
			tierVolume: { ...s.tierVolume, [tier]: volume }
		}));
	}

	function setAmbientMode(mode: AmbientMode): void {
		audioSettingsStore.update((s) => ({ ...s, ambientMode: mode }));
	}

	function toggleMasterMute(): void {
		audioSettingsStore.update((s) => ({ ...s, masterMute: !s.masterMute }));
	}
</script>

{#if browser}
	<div class="audio-panel" role="dialog" aria-label="Audio panel">
		<!-- Header -->
		<div class="panel-header">
			<span class="panel-title">Audio</span>
			<button
				class="close-btn"
				onclick={closePanel}
				aria-label="Close audio panel"
				title="Close"
			>
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>

		<!-- Waveform canvas — dominant, top of panel -->
		<div class="waveform-section">
			<canvas bind:this={canvas} class="panel-canvas"></canvas>
		</div>

		<!-- Origin cards -->
		<div class="origin-cards">
			{#each ORIGIN_IDS as id}
				<button
					class="origin-card"
					onclick={() => handlePlayNode(id)}
					aria-label="Play {ORIGIN_NAMES[id]}"
					style="--origin-color: {rgbToString(ORIGIN_COLORS[id])}"
				>
					<span
						class="origin-dot"
						style="background: {rgbToString(ORIGIN_COLORS[id])}"
					></span>
					<span class="origin-name">{ORIGIN_NAMES[id]}</span>
				</button>
			{/each}
		</div>

		<!-- Scrollable control sections -->
		<div class="panel-sections">

			<!-- Node Browser -->
			<div class="section">
				<button class="section-header" onclick={() => toggleSection('nodeBrowser')}>
					<span>Node Browser</span>
					<span class="chevron" class:open={sections.nodeBrowser}></span>
				</button>
				{#if sections.nodeBrowser}
					<div class="section-body">
						<div class="tier-tabs">
							{#each (['origin', 'threshold', 'layer', 'pillar', 'seed'] as const) as tier}
								<button
									class="tier-tab"
									class:active={browserTier === tier}
									onclick={() => (browserTier = tier)}
								>
									{TIER_LABELS[tier]}
								</button>
							{/each}
						</div>
						<div class="node-grid">
							{#each TIER_NODE_IDS[browserTier] as nodeId}
								<button
									class="node-btn"
									onclick={() => handlePlayNode(nodeId)}
									aria-label="Play {nodeId}"
								>
									{nodeId}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Tier Controls -->
			<div class="section">
				<button class="section-header" onclick={() => toggleSection('tierControls')}>
					<span>Tier Controls</span>
					<span class="chevron" class:open={sections.tierControls}></span>
				</button>
				{#if sections.tierControls}
					<div class="section-body">
						{#each (['origin', 'threshold', 'layer', 'pillar', 'seed'] as const) as tier}
							<div class="tier-row">
								<label class="tier-label">
									<input
										type="checkbox"
										checked={!$audioSettingsStore.tierMute[tier]}
										onchange={(e) => setTierMute(tier, !e.currentTarget.checked)}
									/>
									{TIER_LABELS[tier]}
								</label>
								<input
									type="range"
									min="0"
									max="1"
									step="0.05"
									value={$audioSettingsStore.tierVolume[tier]}
									oninput={(e) => setTierVolume(tier, parseFloat(e.currentTarget.value))}
									class="tier-slider"
									aria-label="{TIER_LABELS[tier]} volume"
								/>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Field Read -->
			<div class="section">
				<button class="section-header" onclick={() => toggleSection('fieldRead')}>
					<span>Field Read</span>
					<span class="chevron" class:open={sections.fieldRead}></span>
				</button>
				{#if sections.fieldRead}
					<div class="section-body">
						<button class="action-btn" onclick={handleFieldRead}>
							Play Field Read
						</button>
						<p class="section-note">
							Plays full hierarchy: thresholds, origins, layers, pillars.
							Active seeds added when resonance engine is live.
						</p>
					</div>
				{/if}
			</div>

			<!-- Mix Controls -->
			<div class="section">
				<button class="section-header" onclick={() => toggleSection('mixControls')}>
					<span>Mix</span>
					<span class="chevron" class:open={sections.mixControls}></span>
				</button>
				{#if sections.mixControls}
					<div class="section-body">
						<div class="mix-row">
							<button
								class="action-btn"
								class:active={$audioSettingsStore.masterMute}
								onclick={toggleMasterMute}
							>
								{$audioSettingsStore.masterMute ? 'Unmute' : 'Mute'} Master
							</button>
						</div>
						<div class="mix-row">
							<span class="mix-label">Ambient Mode</span>
							<div class="mode-group">
								<button
									class="mode-btn"
									class:active={$audioSettingsStore.ambientMode === 'notification'}
									onclick={() => setAmbientMode('notification')}
									aria-label="Set ambient mode to Notification"
								>
									Notification
								</button>
								<button
									class="mode-btn disabled"
									disabled
									aria-label="Drone mode coming soon"
									title="Coming soon"
								>
									Drone
								</button>
								<button
									class="mode-btn"
									class:active={$audioSettingsStore.ambientMode === 'heartbeat'}
									onclick={() => setAmbientMode('heartbeat')}
									aria-label="Set ambient mode to Heartbeat"
								>
									Heartbeat
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Succession Player — stubbed -->
			<div class="section">
				<button class="section-header stubbed" onclick={() => toggleSection('successionPlayer')}>
					<span>Succession Player</span>
					<span class="chevron" class:open={sections.successionPlayer}></span>
				</button>
				{#if sections.successionPlayer}
					<div class="section-body">
						<p class="section-note stubbed-note">Coming in Phase 4.</p>
					</div>
				{/if}
			</div>

			<!-- Cluster Play — stubbed -->
			<div class="section">
				<button class="section-header stubbed" onclick={() => toggleSection('clusterPlay')}>
					<span>Cluster Play</span>
					<span class="chevron" class:open={sections.clusterPlay}></span>
				</button>
				{#if sections.clusterPlay}
					<div class="section-body">
						<p class="section-note stubbed-note">Coming in Phase 4.</p>
					</div>
				{/if}
			</div>

		</div>
	</div>
{/if}

<style>
	.audio-panel {
		position: fixed;
		bottom: 48px;
		left: 12px;
		width: 440px;
		max-height: calc(100vh - 100px);
		background: rgba(10, 12, 18, 0.96);
		border: 1px solid rgba(160, 210, 220, 0.2);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		z-index: 101;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		border-bottom: 1px solid rgba(160, 210, 220, 0.1);
		flex-shrink: 0;
	}

	.panel-title {
		font-size: 13px;
		font-weight: 600;
		color: rgba(160, 210, 220, 0.9);
		letter-spacing: 0.5px;
		text-transform: uppercase;
	}

	.close-btn {
		background: none;
		border: none;
		color: rgba(160, 210, 220, 0.5);
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		color: rgba(160, 210, 220, 1);
		background: rgba(160, 210, 220, 0.1);
	}

	/* Waveform */
	.waveform-section {
		padding: 8px 12px;
		flex-shrink: 0;
	}

	.panel-canvas {
		width: 100%;
		height: 100px;
		display: block;
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.3);
	}

	/* Origin cards */
	.origin-cards {
		display: flex;
		gap: 8px;
		padding: 4px 12px 8px;
		flex-shrink: 0;
	}

	.origin-card {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 10px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--origin-color, rgba(160, 210, 220, 0.15));
		border-radius: 6px;
		cursor: pointer;
		color: rgba(160, 210, 220, 0.85);
		font-size: 12px;
		transition: background 0.2s, border-color 0.2s;
	}

	.origin-card:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.origin-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.origin-name {
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Scrollable sections */
	.panel-sections {
		flex: 1;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 0 0 4px;
	}

	.section {
		border-top: 1px solid rgba(160, 210, 220, 0.08);
	}

	.section-header {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background: none;
		border: none;
		color: rgba(160, 210, 220, 0.75);
		cursor: pointer;
		font-size: 12px;
		font-weight: 500;
		text-align: left;
	}

	.section-header:hover {
		color: rgba(160, 210, 220, 1);
		background: rgba(160, 210, 220, 0.04);
	}

	.section-header.stubbed {
		color: rgba(160, 210, 220, 0.4);
	}

	.chevron {
		width: 0;
		height: 0;
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		border-top: 5px solid currentColor;
		transition: transform 0.2s;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.section-body {
		padding: 4px 12px 10px;
	}

	.section-note {
		font-size: 11px;
		color: rgba(160, 210, 220, 0.45);
		margin: 4px 0 0;
		line-height: 1.4;
	}

	.stubbed-note {
		font-style: italic;
	}

	/* Tier tabs (node browser) */
	.tier-tabs {
		display: flex;
		gap: 2px;
		margin-bottom: 8px;
	}

	.tier-tab {
		flex: 1;
		padding: 4px 0;
		background: rgba(160, 210, 220, 0.06);
		border: 1px solid rgba(160, 210, 220, 0.1);
		border-radius: 3px;
		color: rgba(160, 210, 220, 0.55);
		font-size: 10px;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.tier-tab:hover {
		color: rgba(160, 210, 220, 0.85);
	}

	.tier-tab.active {
		background: rgba(160, 210, 220, 0.12);
		color: rgba(160, 210, 220, 0.95);
		border-color: rgba(160, 210, 220, 0.25);
	}

	/* Node grid */
	.node-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
		gap: 4px;
	}

	.node-btn {
		padding: 4px 2px;
		background: rgba(160, 210, 220, 0.06);
		border: 1px solid rgba(160, 210, 220, 0.1);
		border-radius: 3px;
		color: rgba(160, 210, 220, 0.7);
		font-size: 11px;
		font-family: monospace;
		cursor: pointer;
		transition: background 0.15s;
	}

	.node-btn:hover {
		background: rgba(160, 210, 220, 0.14);
		color: rgba(160, 210, 220, 1);
	}

	/* Tier controls */
	.tier-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 3px 0;
	}

	.tier-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: rgba(160, 210, 220, 0.7);
		min-width: 90px;
		cursor: pointer;
	}

	.tier-label input[type='checkbox'] {
		accent-color: rgba(160, 210, 220, 0.7);
	}

	.tier-slider {
		flex: 1;
		height: 4px;
		accent-color: rgba(160, 210, 220, 0.7);
	}

	/* Action buttons */
	.action-btn {
		padding: 6px 14px;
		background: rgba(160, 210, 220, 0.08);
		border: 1px solid rgba(160, 210, 220, 0.15);
		border-radius: 4px;
		color: rgba(160, 210, 220, 0.8);
		font-size: 12px;
		cursor: pointer;
		transition: background 0.15s;
	}

	.action-btn:hover {
		background: rgba(160, 210, 220, 0.14);
	}

	.action-btn.active {
		background: rgba(160, 210, 220, 0.15);
		border-color: rgba(160, 210, 220, 0.3);
	}

	/* Mix controls */
	.mix-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 0;
	}

	.mix-label {
		font-size: 11px;
		color: rgba(160, 210, 220, 0.6);
		min-width: 90px;
	}

	.mode-group {
		display: flex;
		gap: 4px;
	}

	.mode-btn {
		padding: 4px 10px;
		background: rgba(160, 210, 220, 0.06);
		border: 1px solid rgba(160, 210, 220, 0.1);
		border-radius: 3px;
		color: rgba(160, 210, 220, 0.55);
		font-size: 11px;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.mode-btn:hover {
		color: rgba(160, 210, 220, 0.85);
	}

	.mode-btn.active {
		background: rgba(160, 210, 220, 0.14);
		color: rgba(160, 210, 220, 0.95);
		border-color: rgba(160, 210, 220, 0.3);
	}

	.mode-btn.disabled {
		color: rgba(160, 210, 220, 0.25);
		cursor: not-allowed;
	}

	.mode-btn.disabled:hover {
		color: rgba(160, 210, 220, 0.25);
	}
</style>
