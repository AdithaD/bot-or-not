<script lang="ts">
	import ToggleButton from '../components/ToggleButton.svelte';

	import type { ChatData } from '$lib/game';
	import { gameId, phase, user, users } from '$lib/stores';
	import { getDatabase, onValue, ref } from 'firebase/database';
	import { onDestroy } from 'svelte';
	import FirebaseChatBox from '../components/FirebaseChatBox.svelte';
	import Section from '../components/Section.svelte';
	import PhasedContent from '../components/PhasedContent.svelte';

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
	<h1 class="font-bold text-2xl mb-8">Chat 💬 🤖/🕴</h1>
	<PhasedContent phase="chat">
		<div class="space-y-6 overflow-y-auto flex-grow pb-2">
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
	</PhasedContent>
</Section>
