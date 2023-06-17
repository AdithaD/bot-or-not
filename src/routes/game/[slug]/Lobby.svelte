<script lang="ts">
	import Border from 'components/Border.svelte';

	import { gameId, isOwner, user as userStore, users } from '$lib/stores';
	import { getAuth } from 'firebase/auth';
	import Button from 'components/Button.svelte';
	import FirebaseChatBox from 'components/FirebaseChatBox.svelte';
	import PhasedContent from 'components/PhasedContent.svelte';
	import Section from 'components/Section.svelte';

	$: _users = Object.values($users || {});

	async function startGame() {
		fetch(`/api/game/${$gameId}/start`, {
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

	async function removeUser(uid: string) {
		if (uid == null) return;
		if ($userStore?.uid == uid) alert('You cannot remove yourself from the game. 🤦‍♀️');

		await fetch(`/api/game/${$gameId}/user/${uid}`, {
			method: 'DELETE',
			headers: {
				Authorization: 'Bearer ' + ((await getAuth().currentUser?.getIdToken(true)) ?? '')
			}
		});
	}
</script>

<Section>
	<div>
		<h1 class="font-bold text-2xl mb-2">Lobby 🛋</h1>
		<div class="flex">
			<h1 class="text-md mb-8 text-gray-500 flex-grow">#{$gameId || 'Not connected'}</h1>
			<div class="w-10 h-10">
				<Button click={() => navigator.clipboard.writeText($gameId ?? '')}>📋</Button>
			</div>
		</div>
	</div>
	<PhasedContent phase="lobby">
		<div class="flex flex-col w-full space-y-4">
			<div>
				<h2 class="font-bold text-xl">Connected Players</h2>
				<div class="h-40">
					<Border>
						<div
							class="grid grid-cols-2 p-2 grid-row-3 xl:grid-cols-3 gap-x-8 gap-y-2 grid-flow-col"
						>
							{#each _users as user}
								<div class="w-full flex justify-between align-center">
									<div class=" font-bold">{user.username}</div>
									{#if $isOwner && user.uid != $userStore?.uid}
										<div>
											<Button click={() => removeUser(user.uid)}>⛔</Button>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</Border>
				</div>
			</div>
			<FirebaseChatBox refPath={`games/${$gameId}/publicState/lobby/messages`} />
			{#if $isOwner}
				<div><Button click={startGame}>Start Game</Button></div>
			{/if}
		</div>
	</PhasedContent>
</Section>
