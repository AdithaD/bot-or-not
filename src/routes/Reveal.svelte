<script lang="ts">
	import { get, getDatabase, onValue, ref } from 'firebase/database';
	import PhasedContent from '../components/PhasedContent.svelte';
	import Section from '../components/Section.svelte';
	import { gameId } from '$lib/stores';
	import type { RevealData } from '$lib/game';
	import { onDestroy } from 'svelte';
	import { getAuth } from 'firebase/auth';

	let revealData: RevealData | null = null;
	let unsubscribe = onValue(
		ref(getDatabase(), `game/${$gameId}/publicState/reveal`),
		(snapshot) => {
			if (snapshot.exists()) {
				console.log('asdf');
				revealData = snapshot.val();
			}
		}
	);

	console.log(getAuth().currentUser?.uid);

	onDestroy(() => {
		if (unsubscribe != null) unsubscribe();
	});
</script>

<Section>
	<h1 class="font-bold text-2xl mb-8">Reveal 🔍</h1>
	<PhasedContent phase="reveal">
		<div class="flex">
			{#each Object.keys(revealData ?? {}) as uid}
				<div>
					<h1 class="font-bold text-2xl mb-8">Reveal 🔍</h1>
				</div>
			{/each}
		</div>
	</PhasedContent>
</Section>
