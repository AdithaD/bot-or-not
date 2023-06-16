<script lang="ts">
	import type { User, UserTargetRevealData } from '$lib/game';
	import { user, users } from '$lib/stores';
	import Border from '../components/Border.svelte';

	export let revealData: UserTargetRevealData;
	export let target: User;

	$: fooled = revealData.truth != revealData.decision;
</script>

{#if $user && $users}
	<div class="lg:flex justify-between">
		<h3 class="font-semibold text-xl mb-4">
			talked to <span class="text-3xl">{revealData.truth ? '🤖' : '🧍'}</span>
			{target.username}
		</h3>
		<div class="text-2xl font-semibold">
			{#if fooled}
				<h3>They were <br /> <b class="text-green-600">FOOLED 🥴</b></h3>
			{:else}
				<h3>They saw <br /> the <b class="text-blue-600">TRUTH 😎</b></h3>
			{/if}
		</div>
	</div>
	<div class="lg:flex justify-between lg:space-x-2 space-y-4 lg:space-y-0">
		{#each Object.values(revealData.prompts) as prompt, i}
			<div class="text-start w-full h-full">
				<p class="font-bold">
					Prompt {i + 1}
				</p>
				<Border>
					<div class="text-sm font-semibold p-2">
						{prompt}
					</div>
				</Border>
			</div>
		{/each}
	</div>
	<div class="flex-grow">
		<div class="h-full">
			{#if revealData?.messages?.messages}
				<Border>
					<div class="overflow-y-auto p-2">
						{#each Object.values(revealData.messages.messages) as message}
							<div class="p-1 font-bold">
								{$users[message.uid]?.username ?? 'Unknown user'}: {message.content}
							</div>
						{/each}
					</div>
				</Border>
			{:else}
				<div class="p-2">No messages 😴.</div>
			{/if}
		</div>
	</div>
{/if}
