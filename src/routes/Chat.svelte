<script lang="ts">
	import ToggleButton from '../components/ToggleButton.svelte';

	import type { ChatData } from '$lib/game';
	import { gameId, phase, user, users } from '$lib/stores';
	import { get, getDatabase, onValue, ref, set, update } from 'firebase/database';
	import { onDestroy } from 'svelte';
	import FirebaseChatBox from '../components/FirebaseChatBox.svelte';
	import PhasedContent from '../components/PhasedContent.svelte';
	import Section from '../components/Section.svelte';
	import Button from '../components/Button.svelte';
	import { getAuth } from 'firebase/auth';

	let userChats: ChatData | null = null;

	let targets: string[] = [];
	$: {
		targets = Object.keys(userChats ?? {});
	}

	let decisions: { [target: string]: boolean } = {};
	let disabled: { [target: string]: boolean } = {};

	$: {
		if ($phase == 'chat') {
			getDecisionsState();
		}
	}

	let timeRemaining = 60;
	let serverTimeOffset = 0;

	onValue(ref(getDatabase(), '.info/serverTimeOffset'), (snapshot) => {
		serverTimeOffset = snapshot.val();
	});

	onValue(ref(getDatabase(), `games/${$gameId}/publicState/chat/timer`), (snapshot) => {
		let timer = snapshot.val();

		let interval: NodeJS.Timer | null = null;
		if (timer) {
			if (interval != null) clearInterval(interval);
			interval = setInterval(() => {
				const timeLeft = timer.seconds * 1000 - (Date.now() - timer.startAt - serverTimeOffset);
				if (timeLeft < 0) {
					clearInterval(interval!);
				} else {
					timeRemaining = Math.floor(timeLeft / 1000);
				}
			}, 100);
		}
	});

	onValue(ref(getDatabase(), `games/${$gameId}/userState/${$user?.uid}/chats`), (snapshot) => {
		userChats = snapshot.val();
	});

	async function sendDecision(targetUid: string) {
		if (decisions[targetUid] == null) decisions[targetUid] = false;

		fetch(`/api/game/decision`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${await getAuth().currentUser?.getIdToken(true)}`
			},
			body: JSON.stringify({
				gameId: $gameId,
				targetUid,
				decision: decisions[targetUid]
			})
		}).then(async (response) => {
			if (response.ok) {
				getDecisionsState();
			}
		});
	}

	async function getDecisionsState() {
		fetch(`/api/game/decision?gameId=${$gameId}`, {
			headers: {
				Authorization: `Bearer ${await getAuth().currentUser?.getIdToken(true)}`
			}
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.decisions) {
					Object.keys(res.decisions).forEach((target) => {
						decisions[target] = res.decisions[target];
						disabled[target] = true;
					});
				}
			});
	}
</script>

<Section>
	<div class="flex w-full justify-between">
		<h1 class="font-bold text-2xl mb-8">Chat 💬 🤖/🕴</h1>
		<h1 class="font-bold text-2xl mb-8">{timeRemaining}</h1>
	</div>
	<PhasedContent phase="chat">
		<div class="lg:grid lg:grid-cols-2 space-y-6 overflow-y-auto flex-grow pb-2">
			{#each targets as target}
				<div class="space-y-2 flex flex-col h-full">
					<FirebaseChatBox
						refPath={`games/${$gameId}/userState/${$user?.uid}/chats/${target}/messages`}
						username={$users?.[target]?.username ?? ''}
					/>
					<div class="flex space-x-2">
						<div class="w-full flex-grow">
							<ToggleButton bind:checked={decisions[target]} disabled={disabled?.[target] ?? false}
								>Bot?</ToggleButton
							>
						</div>
						<div>
							<Button click={() => sendDecision(target)} disabled={disabled?.[target] ?? false}
								>✅</Button
							>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</PhasedContent>
</Section>
