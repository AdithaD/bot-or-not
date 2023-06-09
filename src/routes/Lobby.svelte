<script lang="ts">
	import Border from '../components/Border.svelte';

	import { game, gameId, user } from '$lib/stores';
	import { getDatabase, ref, push } from 'firebase/database';
	import Button from '../components/Button.svelte';
	import TextInput from '../components/TextInput.svelte';
	import { getAuth } from 'firebase/auth';
	import type { GameStartRequestBody } from './api/game/start/+server';
	import Section from '../components/Section.svelte';

	$: users = Object.values($game?.users || {});

	$: messages = Object.values($game?.state.lobby?.messages || {});

	$: isOwner = $game?.owner === $user?.uid;

	let messageInput = '';

	function sendMessage() {
		if (messageInput && messageInput.length > 0 && $game) {
			push(ref(getDatabase(), `games/${$game.id}/state/lobby/messages`), {
				content: messageInput,
				username: $user?.username
			});
		}
	}

	async function startGame() {
		fetch(`/api/game/start`, {
			method: 'POST',
			body: JSON.stringify({
				gameId: $gameId,
				token: await getAuth().currentUser?.getIdToken(true)
			} as GameStartRequestBody)
		});
	}
</script>

<Section>
	<div>
		<h1 class="font-bold text-2xl mb-2">Lobby</h1>

		<h1 class="text-md mb-8 text-gray-500">#{$gameId || 'Not connected'}</h1>
	</div>

	{#if $game && $game.state.phase == 'lobby'}
		<div>
			<h2 class="font-bold text-xl">Connected Players</h2>
			<div class="h-40">
				<Border>
					{#if $game}
						{#each users as user}
							<div class="p-2 font-bold">{user.username}</div>
						{/each}
					{/if}
				</Border>
			</div>
		</div>
		<div class="space-y-4">
			<h2 class="font-bold text-xl">Chat</h2>
			<div class="h-40">
				<Border>
					{#each messages as message}
						<div class="p-2 font-bold">{message.username}: {message.content}</div>
					{/each}
				</Border>
			</div>
			<div class="flex space-x-2 h-16">
				<div class="flex-grow h-full">
					<TextInput bind:value={messageInput} placeholder="Enter message" />
				</div>
				<div class="h-full flex-grow">
					<Button click={sendMessage}>Send</Button>
				</div>
			</div>
		</div>
		{#if isOwner}
			<div><Button click={startGame}>Start Game</Button></div>
		{/if}
	{/if}
</Section>
