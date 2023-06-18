<script lang="ts">
	import type { PromptData } from '$lib/game';
	import { gameId, isOwner, phase, user, users } from '$lib/stores';
	import { getAuth } from 'firebase/auth';
	import { getDatabase, onValue, ref } from 'firebase/database';
	import { onDestroy } from 'svelte';
	import Border from 'components/Border.svelte';
	import Button from 'components/Button.svelte';
	import PhasedContent from 'components/PhasedContent.svelte';
	import Section from 'components/Section.svelte';
	import { addToast } from '$lib/toasts';
	import TextAreaInput from 'components/TextAreaInput.svelte';
	import { PUBLIC_MAX_PROMPT_LENGTH } from '$env/static/public';

	let unsubscribe: Function | null = null;
	let storeUnsubscribe: Function | null = null;
	let prompt: PromptData | null = null;

	$: allSubmitted =
		prompt && prompt.submitted
			? Object.values(prompt.submitted).every((submitted) => submitted)
			: false;

	$: submitted = prompt && $user ? prompt.submitted[$user.uid] ?? false : false;

	let descriptions: { [uid: string]: string } = {};

	$: {
		if ($phase == 'prompt') {
			storeUnsubscribe = gameId.subscribe((gameId) => {
				if (unsubscribe != null) unsubscribe();

				unsubscribe = onValue(
					ref(getDatabase(), `games/${gameId}/publicState/prompt`),
					(snapshot) => {
						prompt = snapshot.val();
						loadDescriptions();
					}
				);
			});
		}
	}

	let maxPromptLength = 1000;
	try {
		maxPromptLength = parseInt(PUBLIC_MAX_PROMPT_LENGTH);
	} catch (error) {}

	onDestroy(() => {
		if (unsubscribe != null) unsubscribe();
		if (storeUnsubscribe != null) storeUnsubscribe();
	});

	// TODO: Disable chatboxes on submit.
	async function submit() {
		await fetch(`/api/game/${$gameId}/prompt`, {
			method: 'POST',
			body: JSON.stringify({ prompts: descriptions }),
			headers: {
				Authorization: 'Bearer ' + (await (getAuth().currentUser?.getIdToken(true) ?? ''))
			}
		})
			.then(() => addToast('Submitted Prompt', 'success'))
			.catch(() => addToast('Failed to submit prompt 😭', 'error'));
	}

	// TODO: Show who has submitted their descriptions.

	async function nextPhase() {
		await fetch(`/api/game/${$gameId}/start`, {
			method: 'POST',
			body: JSON.stringify({
				phase: 'select'
			}),
			headers: {
				Authorization: 'Bearer ' + (await getAuth().currentUser?.getIdToken(true))
			}
		})
			.then(async (response) => {
				if (response.ok) {
					addToast('Moved to Chat Phase', 'success');
				} else {
					addToast('Unknown Error 😫🤯', 'error');
				}
			})
			.catch((e) => {
				console.error(e);
				addToast('Network Error 🤯', 'error');
			});
	}

	async function loadDescriptions() {
		let token = await getAuth().currentUser?.getIdToken(true);

		await fetch(`/api/game/${$gameId}/prompt`, {
			headers: {
				Authorization: 'Bearer ' + token
			}
		})
			.then(async (res) => {
				if (res.ok) {
					let data = await res.json();
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
				descriptions = {};
			});
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
									<TextAreaInput maxLength={maxPromptLength} bind:value={descriptions[target]} />
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
