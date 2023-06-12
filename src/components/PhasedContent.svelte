<script lang="ts">
	import { phaseOrdering, type Phase } from '$lib/game';
	import { phase as phaseStore } from '$lib/stores';

	export let phase: Phase;
</script>

<div class="h-full w-full flex items-stretch justify-center flex-col">
	{#if $phaseStore == phase}
		<slot />
	{:else if phaseOrdering.indexOf($phaseStore ?? '') > phaseOrdering.indexOf(phase)}
		<div class="text-6xl self-center text-center space-y-2">
			<p>✔</p>
			<p class="text-2xl font-bold">Phase complete.</p>
		</div>
	{:else}
		<div class="text-6xl self-center text-center space-y-2">
			<p>⏳</p>
			<p class="text-2xl font-bold">Waiting for phase to start.</p>
		</div>
	{/if}
</div>
