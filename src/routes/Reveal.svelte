<script lang="ts">
	import { get, getDatabase, onValue, ref } from 'firebase/database';
	import PhasedContent from '../components/PhasedContent.svelte';
	import Section from '../components/Section.svelte';
	import { gameId, users } from '$lib/stores';
	import type { RevealData } from '$lib/game';
	import { onDestroy } from 'svelte';
	import Border from '../components/Border.svelte';
	import Button from '../components/Button.svelte';

	let unsubscribe: Function;
	let storeUnsubscribe: Function | null = null;
	let revealData: RevealData | null = null;

	storeUnsubscribe = gameId.subscribe((gameId) => {
		if (unsubscribe != null) unsubscribe();

		unsubscribe = onValue(ref(getDatabase(), `games/${gameId}/publicState/reveal`), (snapshot) => {
			revealData = snapshot.val();
			console.log(`game: ${gameId} reveal: ${JSON.stringify(revealData)}}`);
		});
	});

	onDestroy(() => {
		if (unsubscribe != null) unsubscribe();
		if (storeUnsubscribe != null) storeUnsubscribe();
	});

	function getTruth(uid: string, target: string) {
		return revealData?.[uid]?.[target]?.truth ?? false;
	}
	function getFooled(uid: string, target: string) {
		return revealData?.[uid]?.[target]?.truth != revealData?.[uid]?.[target].decision;
	}
</script>

<Section>
	<h1 class="font-bold text-2xl mb-8">Reveal 🔍</h1>
	<PhasedContent phase="reveal">
		{#if revealData}
			<div class="flex flex-col items-stretch justify-between h-full space-y-4">
				<div
					class="grid grid-rows-3 lg:grid-rows-none lg:grid-cols-3 gap-4 w-full h-full justify-between items-stretch"
				>
					{#each Object.keys(revealData ?? {}) as uid}
						<div class="w-full h- shadow-lg rounded-xl p-4">
							<h2 class="font-bold text-2xl mb-4">{$users?.[uid]?.username}</h2>
							<div class="flex flex-col space-y-4">
								{#each Object.keys(revealData[uid] ?? {}) as target}
									<div class="flex justify-between">
										<h3 class="font-semibold text-xl mb-4">
											talked to <span class="text-3xl"
												>{revealData[uid]?.[target].truth ? '🤖' : '🧍'}</span
											>
											{$users?.[target]?.username}
										</h3>
										<div class="text-2xl font-semibold">
											{#if getFooled(uid, target)}
												<h3>They were <b class="text-green-600">FOOLED 🥴</b></h3>
											{:else}
												<h3>They saw the <b class="text-blue-600">TRUTH 😎</b></h3>
											{/if}
										</div>
									</div>
									<div class="flex justify-between">
										{#each Object.values(revealData[uid]?.[target]?.prompts) as prompt, i}
											<div class="text-start w-full h-fit">
												<p class="font-bold">
													Prompt {i + 1}
												</p>
												<Border>
													<div class="text-sm font-semibold p-2">
														{prompt}
													</div>
												</Border>
											</div>
										{/each}
									</div>
									<div class="flex-grow">
										<div class="h-full">
											<Border>
												<div class="overflow-y-auto p-2">
													{#each Object.values(revealData[uid]?.[target]?.messages.messages) as message}
														<div class="p-1 font-bold">
															{$users?.[message.uid]?.username ?? 'Unknown user'}: {message.content}
														</div>
													{/each}
												</div>
											</Border>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
				<div class="">
					<Button>Play again!</Button>
				</div>
			</div>
		{/if}
	</PhasedContent>
</Section>
