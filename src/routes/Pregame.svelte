<script lang="ts">
	import type { JoinRequestBody } from '$lib/game';
	import { gameId, user } from '$lib/stores';
	import { getAuth, signInAnonymously } from 'firebase/auth';
	import { getDatabase, ref, set } from 'firebase/database';
	import Button from '../components/Button.svelte';
	import Section from '../components/Section.svelte';
	import TextInput from '../components/TextInput.svelte';
	import log from 'loglevel';

	let gameIDInput = '';
	let desiredUsername = '';

	async function createGame() {
		if (!desiredUsername || desiredUsername.length < 1) return alert('Please enter a username');

		fetch('/api/new', { method: 'POST' }).then(async (res) => {
			let body = await res.json();
			let id = body.id;
			if (res.ok) {
				let creds = await signInAnonymously(getAuth());
				let body: JoinRequestBody = {
					gameId: id,
					user: {
						uid: creds.user.uid,
						username: desiredUsername
					}
				};
				await sendJoinRequest(body);
			}
		});
	}

	async function joinGame() {
		if (!gameIDInput) return;

		validateUsername();

		let creds = await signInAnonymously(getAuth());

		if (gameIDInput.length < 1) return alert('Please enter a game ID');
		if (gameIDInput.length != 36) return alert('Invalid game ID');

		let body: JoinRequestBody = {
			gameId: gameIDInput,
			user: {
				uid: creds.user.uid,
				username: desiredUsername
			}
		};

		await sendJoinRequest(body);
	}

	async function sendJoinRequest(body: JoinRequestBody) {
		await fetch('/api/join', { method: 'POST', body: JSON.stringify(body) }).then(() => {
			log.log(`Joined game ${body.gameId}`);
			gameId.set(body.gameId);
			user.set(body.user);
		});
	}

	function validateUsername() {
		if (!desiredUsername || desiredUsername.length < 1) return alert('Please enter a username');
		if (desiredUsername.length > 20) return alert('Username must be less than 20 characters');
	}
</script>

<Section>
	<h1 class="font-bold text-2xl mb-8">Pre-game 🎮</h1>
	<div class="space-y-16">
		<div>
			<h2 class="font-bold text-xl mb-4">Username</h2>
			<TextInput bind:value={desiredUsername} placeholder="Enter username" />
		</div>
		<div class="space-y-4">
			<Button click={createGame}>Create Game</Button>
			<div class="text-2xl font-bold text-center">or</div>
			<div class="space-y-2">
				<TextInput bind:value={gameIDInput} placeholder="Enter Game ID" />
				<Button click={joinGame}>Join Game</Button>
			</div>
		</div>
	</div>
</Section>
