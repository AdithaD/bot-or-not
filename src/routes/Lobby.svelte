<script lang="ts">
	import ChatBox from '../components/ChatBox.svelte';

	import Border from '../components/Border.svelte';

	import { gameId, user, users, isOwner, phase } from '$lib/stores';
	import { getDatabase, ref, push, onValue } from 'firebase/database';
	import Button from '../components/Button.svelte';
	import { getAuth } from 'firebase/auth';
	import Section from '../components/Section.svelte';
	import type { LobbyData } from '$lib/game';
	import { onDestroy } from 'svelte';

	let lobby: LobbyData | null = null;

	let unsubscribe: Function | null = null;
	let storeUnsubscribe: Function | null = null;
	storeUnsubscribe = gameId.subscribe((gameId) => {
		if (unsubscribe != null) unsubscribe();

		unsubscribe = onValue(ref(getDatabase(), `games/${gameId}/publicState/lobby`), (snapshot) => {
			lobby = snapshot.val();
			console.log(`game: ${gameId} lobby: ${JSON.stringify(lobby)}}`);
		});
	});

	$: _users = Object.values($users || {});

	$: messages = Object.values(lobby?.messages || {});

	function sendMessage(message: string) {
		console.log(`sending message: ${message}`);
		if (message.length > 0) {
			push(ref(getDatabase(), `games/${$gameId}/publicState/lobby/messages`), {
				content: message,
				username: $user?.username
			});
		}
	}
	async function startGame() {
		fetch(`/api/game/start`, {
			method: 'POST',
			body: JSON.stringify({
				gameId: $gameId,
				phase: 'prompt'
			}),
			headers: {
				Authorization: 'Bearer ' + (await getAuth().currentUser?.getIdToken(true))
			}
		});
	}

	onDestroy(() => {
		if (unsubscribe != null) unsubscribe();
		if (storeUnsubscribe != null) storeUnsubscribe();
	});
</script>

<Section>
	<div>
		<h1 class="font-bold text-2xl mb-2">Lobby 🛋</h1>

		<h1 class="text-md mb-8 text-gray-500">#{$gameId || 'Not connected'}</h1>
	</div>

	{#if $phase === 'lobby'}
		<div>
			<h2 class="font-bold text-xl">Connected Players</h2>
			<div class="h-40">
				<Border>
					{#each _users as user}
						<div class="p-2 font-bold">{user.username}</div>
					{/each}
				</Border>
			</div>
		</div>
		<ChatBox {messages} sendMessageCb={sendMessage} />
		{#if $isOwner}
			<div><Button click={startGame}>Start Game</Button></div>
		{/if}
	{/if}
</Section>
