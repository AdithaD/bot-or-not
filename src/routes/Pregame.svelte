<script lang="ts">
	import type { JoinRequestBody } from '$lib/game';
	import { gameId, user } from '$lib/stores';
	import { getAuth, signInAnonymously } from 'firebase/auth';
	import { getDatabase, ref, set } from 'firebase/database';
	import Button from '../components/Button.svelte';
	import Section from '../components/Section.svelte';
	import TextInput from '../components/TextInput.svelte';

	let gameIDInput = '';
	let desiredUsername = '';

	async function createGame() {
		if (!desiredUsername || desiredUsername.length < 1) return alert('Please enter a username');

		fetch('/api/new', { method: 'POST' }).then(async (res) => {
			let body = await res.json();
			let id = body.id;
			if (res.ok) {
				let creds = await signInAnonymously(getAuth());
				let userRef = ref(getDatabase(), `games/${id}/users/${creds.user.uid}`);
				set(userRef, { uid: creds.user.uid, username: desiredUsername });
				let body: JoinRequestBody = {
					gameId: id,
					user: {
						uid: creds.user.uid,
						username: desiredUsername
					}
				};

				fetch('/api/join', { method: 'POST', body: JSON.stringify(body) }).then(() => {
					console.log('joined game');
					gameId.set(body.gameId);
					user.set(body.user);
				});
			}
		});
	}

	async function joinGame() {
		if (!gameIDInput) return;

		if (!desiredUsername || desiredUsername.length < 1) return alert('Please enter a username');

		let creds = await signInAnonymously(getAuth());

		let body: JoinRequestBody = {
			gameId: gameIDInput,
			user: {
				uid: creds.user.uid,
				username: desiredUsername
			}
		};

		fetch('/api/join', { method: 'POST', body: JSON.stringify(body) }).then(() => {
			console.log('joined game');
			gameId.set(body.gameId);
			user.set(body.user);
		});
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
