<script lang="ts">
	import type { PromptData } from '$lib/game';
	import { gameId, isOwner, user, users } from '$lib/stores';
	import { getAuth } from 'firebase/auth';
	import { getDatabase, onValue, ref } from 'firebase/database';
	import { onDestroy } from 'svelte';
	import Border from '../components/Border.svelte';
	import Button from '../components/Button.svelte';
	import PhasedContent from '../components/PhasedContent.svelte';
	import Section from '../components/Section.svelte';

	let unsubscribe: Function | null = null;
	let storeUnsubscribe: Function | null = null;
	let prompt: PromptData | null = null;

	storeUnsubscribe = gameId.subscribe((gameId) => {
		if (unsubscribe != null) unsubscribe();

		unsubscribe = onValue(ref(getDatabase(), `games/${gameId}/publicState/prompt`), (snapshot) => {
			prompt = snapshot.val();
			console.log(`game: ${gameId} prompt: ${JSON.stringify(prompt)}}`);
			loadDescriptions();
		});
	});

	$: allSubmitted = prompt
		? Object.values(prompt.submitted ?? {}).every((submitted) => submitted)
		: false;
	$: submitted = prompt && $user ? prompt.submitted[$user.uid] ?? false : false;

	let descriptions: { [uid: string]: string } = {};

	loadDescriptions();

	onDestroy(() => {
		if (unsubscribe != null) unsubscribe();
		if (storeUnsubscribe != null) storeUnsubscribe();
	});
	async function submit() {
		fetch(`/api/game/prompt`, {
			method: 'POST',
			body: JSON.stringify({ gameId: $gameId, prompts: descriptions }),
			headers: {
				Authorization: 'Bearer ' + (await (getAuth().currentUser?.getIdToken(true) ?? ''))
			}
		});
	}

	async function nextPhase() {
		await fetch('/api/game/start', {
			method: 'POST',
			body: JSON.stringify({
				gameId: $gameId,
				phase: 'select'
			}),
			headers: {
				Authorization: 'Bearer ' + (await getAuth().currentUser?.getIdToken(true))
			}
		})
			.then(async (response) => {
				if (response.ok) {
					console.log('moving to chat phase');
				} else {
					alert((await response.json()).error ?? 'Unknown Error');
				}
			})
			.catch((e) => {
				console.error(e);
				alert('Network Error');
			});
	}

	async function loadDescriptions() {
		let token = await getAuth().currentUser?.getIdToken(true);

		await fetch(`/api/game/prompt?gameId=${$gameId}`, {
			headers: {
				Authorization: 'Bearer ' + token
			}
		})
			.then(async (res) => {
				if (res.ok) {
					let data = await res.json();
					console.log(`set ${JSON.stringify(data)}`);
					if (data.prompts) {
						Object.entries(data.prompts).forEach(([uid, description]) => {
							if (description != null) descriptions[uid] = description as string;
						});
					}
				}
				if (Object.keys(descriptions).length == 0) {
					Object.values(prompt?.allocation[$user?.uid ?? ''] ?? {}).forEach((uid) => {
						if (descriptions[uid] == null) descriptions[uid] = '';
					});
				}
			})

			.catch((e) => {
				console.log('not set. err');
				descriptions = {};
			});
		console.log(Object.keys(descriptions));
	}
</script>

<Section>
	<h1 class="font-bold text-2xl mb-8">Prompt 💭</h1>
	<PhasedContent phase="prompt">
		<div class="space-y-4">
			{#if $user}
				<div class="font-bold text-xl">Describe the following players:</div>
				<div class="space-y-8 overflow-y-auto flex-grow">
					{#each Object.keys(descriptions) as target}
						<div>
							<h2 class="font-bold mb-2">{$users?.[target]?.username || 'User'}:</h2>
							<div class="space-y-4">
								<Border>
									<textarea class="w-full p-4 rounded-lg" bind:value={descriptions[target]} />
								</Border>
							</div>
						</div>
					{/each}
				</div>
				<div>
					<Button click={submit} disabled={submitted}>Submit</Button>
				</div>
				<div>
					{#if $isOwner}
						<Button click={nextPhase} disabled={!allSubmitted}>Next Phase</Button>
					{/if}
				</div>
			{/if}
		</div>
	</PhasedContent>
</Section>
