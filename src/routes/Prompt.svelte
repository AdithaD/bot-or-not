<script lang="ts">
	import { game, user } from '$lib/stores';
	import Button from '../components/Button.svelte';
	import Border from '../components/Border.svelte';
	import Section from '../components/Section.svelte';
	import { getDatabase, ref, set } from 'firebase/database';

	$: usersToDescribe = Object.keys($game?.state.prompt?.prompts[$user?.uid ?? ''] ?? {});

	let descriptions: { [uid: string]: string } = {};
	let submitted = false;

	function submit() {
		let promptsRef = ref(getDatabase(), `games/${$game?.id}/state/prompt/prompts/${$user?.uid}`);
		set(promptsRef, descriptions);
		submitted = true;
	}
</script>

<Section>
	<h1 class="font-bold text-2xl mb-8">Prompt</h1>
	{#if $game && $game.state.phase == 'prompt'}
		<div class="font-bold text-xl">Describe the following players:</div>
		<div class="space-y-8 overflow-y-auto flex-grow">
			{#each usersToDescribe as user, i}
				<div>
					<h2 class="font-bold mb-2">{$game.users[user].username}:</h2>
					<div class="space-y-4">
						<Border>
							<textarea class="w-full p-4 rounded-lg" bind:value={descriptions[user]} />
						</Border>
					</div>
				</div>
			{/each}
		</div>
		<div>
			<Button click={submit} disabled={submitted}>Submit</Button>
		</div>
	{/if}
</Section>
