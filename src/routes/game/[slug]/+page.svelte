<script lang="ts">
	import { sendJoinRequest, validateUsername, type JoinRequestBody } from '$lib/game';
	import { gameId, user } from '$lib/stores';
	import Button from 'components/Button.svelte';
	import Section from 'components/Section.svelte';
	import TextInput from 'components/TextInput.svelte';
	import { getAuth, signInAnonymously } from 'firebase/auth';
	import Chat from './Chat.svelte';
	import Lobby from './Lobby.svelte';
	import Prompt from './Prompt.svelte';
	import Reveal from './Reveal.svelte';
	import Select from './Select.svelte';
	import { onMount } from 'svelte';
	import { addToast } from '$lib/toasts';

	export let data;

	if (data.user && data.gameId) {
		user.set(data.user);
		gameId.set(data.gameId);
	} else {
		user.set(null);
		gameId.set(null);
	}

	let desiredUsername = '';

	async function joinGame() {
		if (data.gameId) {
			let uid = await signInAnonymously(getAuth()).then((creds) => creds.user.uid);

			if (validateUsername(desiredUsername)) {
				await sendJoinRequest(
					{ user: { uid, username: desiredUsername } } as JoinRequestBody,
					data.gameId
				);
				addToast('Joined experiment 🤓!', 'success');
			}
		}
	}
</script>

<div class="flex flex-col flex-grow">
	{#if $user}
		<main class="p-8 flex-grow space-y-8">
			<div class="flex flex-grow items-stretch space-x-4">
				<div class="w-1/2">
					<Lobby />
				</div>
				<div class="w-1/2">
					<Prompt />
				</div>
			</div>
			<div class="flex flex-grow space-x-4">
				<div class="w-1/3">
					<Select />
				</div>
				<div class="w-2/3">
					<Chat />
				</div>
			</div>
			<div class=" flex-grow">
				<Reveal />
			</div>
		</main>
	{:else}
		<main class="flex flex-col flex-grow justify-center items-center p-4">
			<div class="">
				<Section>
					<div class="flex flex-col items-center justify-between space-y-8">
						<h1 class="text-2xl lg:text-4xl font-bold text-center">
							You're not part of this experiment 😱. <br />Unless.. 👉👈
						</h1>
						<div
							class="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-4 w-full"
						>
							<div class="h-fit flex-grow w-full">
								<div>
									<TextInput
										maxLength={15}
										bind:value={desiredUsername}
										placeholder="Enter username"
									/>
								</div>
							</div>
							<div class="w-full lg:w-min">
								<Button click={joinGame}>Join Experiment</Button>
							</div>
						</div>
					</div>
				</Section>
			</div>
		</main>
	{/if}
</div>
