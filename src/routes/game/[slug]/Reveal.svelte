<script lang="ts">
	import RevealDataBlock from './RevealDataBlock.svelte';

	import type { RevealData } from '$lib/game';
	import { gameId, users } from '$lib/stores';
	import { getDatabase, onValue, ref } from 'firebase/database';
	import { onDestroy } from 'svelte';
	import Button from 'components/Button.svelte';
	import PhasedContent from 'components/PhasedContent.svelte';
	import Section from 'components/Section.svelte';

	let unsubscribe: Function | null = null;
	let storeUnsubscribe: Function | null = null;
	let revealData: RevealData | null = null;

	if (!storeUnsubscribe || !unsubscribe) {
		storeUnsubscribe = gameId.subscribe((gameId) => {
			if (unsubscribe != null) unsubscribe();

			unsubscribe = onValue(
				ref(getDatabase(), `games/${gameId}/publicState/reveal`),
				(snapshot) => {
					revealData = snapshot.val();
				}
			);
		});
	}

	onDestroy(() => {
		if (unsubscribe != null) unsubscribe();
		if (storeUnsubscribe != null) storeUnsubscribe();
	});

	// TODO: Implement play again functionality + rounds
	function playAgain() {}

	// TODO: Back to main menu functionality.
</script>

<Section>
	<h1 class="font-bold text-2xl">Reveal 🔍</h1>
	<PhasedContent phase="reveal">
		{#if revealData && $users}
			<div class="flex flex-col items-stretch justify-between h-full space-y-4">
				<div class="grid grid-rows-3 lg:grid-rows-none lg:grid-cols-3 gap-8 w-full h-full p-6">
					{#each Object.keys(revealData) as uid}
						<div class="w-full shadow-xl rounded-xl p-4 border-2 border-black">
							<h2 class="font-bold text-2xl mb-4">{$users[uid]?.username ?? 'Unknown User'}</h2>
							<div class="flex flex-col space-y-4">
								{#each Object.keys(revealData[uid]) as target}
									{#if revealData[uid][target] != null && $users[target]}
										<RevealDataBlock revealData={revealData[uid][target]} target={$users[target]} />
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>
				<div class="text-xl h-20">
					<Button click={playAgain}>Play again! 😝</Button>
				</div>
			</div>
		{/if}
	</PhasedContent>
</Section>
