<script lang="ts">
	import { sendJoinRequest, type JoinRequestBody, validateUsername } from '$lib/game';
	import { gameId, user } from '$lib/stores';
	import { getAuth, signInAnonymously } from 'firebase/auth';
	import Button from '../components/Button.svelte';
	import Section from '../components/Section.svelte';
	import log from 'loglevel';
	import TextInput from '../components/TextInput.svelte';
	import { redirect } from '@sveltejs/kit';
	import { goto } from '$app/navigation';
	import { addToast } from '$lib/toasts';

	let gameIDInput = '';
	let desiredUsername = '';

	async function createGame() {
		if (!desiredUsername || desiredUsername.length < 1)
			return addToast('Please enter a username', 'error');

		addToast('Starting experiment... 👨‍🔬', 'info');
		fetch('/api/new', { method: 'POST' }).then(async (res) => {
			let body = await res.json();
			let id = body.id;
			if (res.ok) {
				let creds = await signInAnonymously(getAuth());
				let body: JoinRequestBody = {
					user: {
						uid: creds.user.uid,
						username: desiredUsername
					}
				};

				addToast('Created experiment 🧪!', 'success');
				await sendJoinRequest(body, id)
					.then(() => {
						addToast('Joined experiment 🤓!', 'success');
						goto(`/game/${id}`);
					})
					.catch(log.error);
			}
		});
	}

	async function joinGame() {
		if (!gameIDInput) return;

		if (validateUsername(desiredUsername)) {
			let creds = await signInAnonymously(getAuth());

			if (gameIDInput.length < 1) return addToast('Please enter a game ID', 'error');
			if (gameIDInput.length != 36) return addToast('Invalid game ID', 'error');

			let body: JoinRequestBody = {
				user: {
					uid: creds.user.uid,
					username: desiredUsername
				}
			};
			await sendJoinRequest(body, gameIDInput)
				.then(() => {
					goto(`/game/${gameIDInput}`);

					addToast('Joined experiment 🤓!', 'success');
				})
				.catch(log.error);
		}
	}
</script>

<Section>
	<h1 class="font-bold text-2xl mb-8 h-full">Experiment Control 🧪</h1>
	<div class="space-y-8">
		<div>
			<h2 class="font-bold text-xl mb-4">Username</h2>
			<TextInput maxLength={15} bind:value={desiredUsername} placeholder="Enter username" />
		</div>
		<div class="border-2 border-green-600 rounded-xl" />
		<div class="space-y-4">
			<Button click={createGame}>Start Experiment</Button>
			<div class="text-2xl font-bold text-center">or</div>
			<div class="space-y-2">
				<TextInput maxLength={null} bind:value={gameIDInput} placeholder="Enter Game ID" />
				<Button click={joinGame}>Join Experiment</Button>
			</div>
		</div>
	</div>
</Section>
