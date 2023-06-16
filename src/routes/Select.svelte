<script lang="ts">
	import { users, user, gameId, phase } from '$lib/stores';
	import { get, getDatabase, ref } from 'firebase/database';
	import Section from '../components/Section.svelte';
	import ToggleButton from '../components/ToggleButton.svelte';
	import Button from '../components/Button.svelte';
	import { getAuth } from 'firebase/auth';
	import PhasedContent from '../components/PhasedContent.svelte';

	let amountOfPlayers = 0;
	let selected = true;
	let buttons: { [uid: string]: boolean } = {};

	$: {
		if ($phase == 'select') {
			get(ref(getDatabase(), `games/${$gameId}/publicState/chatsPerPlayer`)).then((snapshot) => {
				amountOfPlayers = snapshot.val() ?? 0;
			});
			get(ref(getDatabase(), `games/${$gameId}/publicState/select/selected/${$user?.uid}`)).then(
				(snapshot) => (selected = snapshot.val() ?? false)
			);
		}
	}

	$: amountOfCheckedButtons = Object.values(buttons).filter((button) => button).length;

	$: otherUsers = $user ? Object.keys(buttons).filter((uid) => uid != $user?.uid) : [];

	async function sendSelections() {
		const selectedUids = Object.keys(buttons).filter((uid) => buttons[uid]);
		await fetch(`/api/game/select`, {
			method: 'POST',
			body: JSON.stringify({
				gameId: $gameId,
				selectedUids
			}),
			headers: {
				Authorization: 'Bearer ' + (await getAuth().currentUser?.getIdToken(true))
			}
		}).then((res) => {
			if (res.ok) {
				selected = true;
			}
		});
	}
</script>

<Section>
	<h1 class="font-bold text-2xl mb-8">Select 🤔</h1>
	<PhasedContent phase="select">
		<div class="space-y-16">
			<div class="font-bold text-xl">Select {amountOfPlayers} players 😉 to chat to:</div>
			<div class=" space-y-4">
				{#if $users && $user != null}
					{#each otherUsers as target}
						<ToggleButton
							toggledColour="bg-green-700"
							bind:checked={buttons[target]}
							disabled={amountOfCheckedButtons >= amountOfPlayers && !buttons[target]}
							confirmed={selected}
						>
							{$users[target].username}
						</ToggleButton>
					{/each}
				{/if}
			</div>
		</div>
		<div class="flex-grow" />
		<div>
			<Button
				click={sendSelections}
				disabled={amountOfCheckedButtons != amountOfPlayers || selected}>Send</Button
			>
		</div>
	</PhasedContent>
</Section>
