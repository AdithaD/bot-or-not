<script lang="ts">
	import type { Message } from '$lib/game';
	import { users } from '$lib/stores';
	import Border from './Border.svelte';
	import Button from './Button.svelte';
	import TextInput from './TextInput.svelte';

	export const chatTimeout = 2000;

	export let messages: Message[] = [];
	export let username = '';
	export let sendMessageCb: (content: string) => void;
	export let canSend = true;

	let messageInput = '';

	function sendMessage() {
		sendMessageCb(messageInput);
		canSend = false;
		setTimeout(() => {
			canSend = true;
		}, chatTimeout);
		messageInput = '';
	}
</script>

<div class="space-y-4">
	<h2 class="font-bold text-xl">Chat to {username}</h2>
	<div class="h-40">
		<Border>
			<div class="overflow-y-auto h-full flex flex-col-reverse">
				{#each [...messages].reverse() as message}
					<div class="p-2 font-bold">
						{$users?.[message.uid]?.username ?? 'Unknown user'}: {message.content}
					</div>
				{/each}
			</div>
		</Border>
	</div>
	<div class="flex space-x-2 h-16">
		<div class="flex-grow h-full">
			<TextInput bind:value={messageInput} placeholder="Enter message" />
		</div>
		<div class="h-full flex-grow">
			<Button disabled={!canSend} click={sendMessage}>Send</Button>
		</div>
	</div>
</div>
