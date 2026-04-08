<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import WaveformStrip from '$lib/components/WaveformStrip.svelte';
	import AudioPanel from '$lib/components/AudioPanel.svelte';
	import { audioPanelOpen } from '$lib/stores/audio';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
{#if $audioPanelOpen}
	<AudioPanel />
{/if}
<WaveformStrip />
