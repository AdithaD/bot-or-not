<script lang="ts">
	import { page } from '$app/stores';
	import Section from 'components/Section.svelte';
</script>

<div class="flex-grow flex items-center justify-center">
	<div class="w-1/2">
		<Section>
			{#if $page.status == 404}
				<h1 class="text-4xl font-bold">Game not found 😒</h1>
				<p class="font-semibold text-2xl">Have you tried using a link that actually exists... 🙄</p>
			{:else}
				<h1 class="text-2xl font-bold">Something went wrong. 😲</h1>
				<p>Try refreshing the page. If that doesn't work, idk.</p>
			{/if}
		</Section>
	</div>
</div>
