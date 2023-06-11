<script lang="ts">
	import ToggleButton from '../components/ToggleButton.svelte';

	import type { ChatData, Messages } from '$lib/game';
	import { gameId, phase, user, users } from '$lib/stores';
	import { getDatabase, onValue, ref } from 'firebase/database';
	import FirebaseChatBox from '../components/FirebaseChatBox.svelte';
	import Section from '../components/Section.svelte';
	import { onDestroy } from 'svelte';

	let chatData: ChatData | null = null;

	let targets: string[] = [];
	$: {
		targets = Object.keys(chatData?.chats[$user?.uid ?? ''] ?? {});
		console.log('targets: ', targets);
	}

	let unsubscribe: Function | null = null;
	let storeUnsubscribe: Function | null = null;

	storeUnsubscribe = gameId.subscribe((gameId) => {
		{
		}
		if (unsubscribe != null) unsubscribe();

		unsubscribe = onValue(ref(getDatabase(), `games/${gameId}/publicState/chat`), (snapshot) => {
			chatData = snapshot.val();
			console.log(`game: ${gameId} chatData: ${JSON.stringify(chatData)}}`);
		});
	});

	onDestroy(() => {
		if (unsubscribe != null) unsubscribe();
		if (storeUnsubscribe != null) storeUnsubscribe();
	});
</script>

<Section>
	<h1 class="font-bold text-2xl mb-8">Chat</h1>
	{#if $phase == 'chat' || true}
		<div class="space-y-8 overflow-y-auto flex-grow">
			{#each targets as target}
				<div class="space-y-2">
					<FirebaseChatBox
						refPath={`games/${$gameId}/publicState/chat/chats/${$user?.uid}/${target}/messages`}
						username={$users?.[target]?.username ?? ''}
					/>
					<ToggleButton>Bot?</ToggleButton>
				</div>
			{/each}
		</div>
	{/if}
</Section>
