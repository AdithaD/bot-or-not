<script lang="ts">
	import type { Message } from '$lib/game';
	import { users } from '$lib/stores';
	import { addToast } from '$lib/toasts';
	import Border from './Border.svelte';
	import Button from './Button.svelte';
	import TextInput from './TextInput.svelte';

	// TODO: Add a way to send messages with the enter key
	// TODO: Make chat timeout duration visible to the user
	export let chatTimeout = 2000;
	export let maxMessages = 1000;
	export let maxMessageLength = 400;

	export let messages: Message[] = [];
	export let username: String | null = null;
	export let sendMessageCb: (content: string) => void;
	export let canSend = true;

	let amountOfMessagesSent = 0;

	let messageInput = '';

	$: disabled =
		messageInput.length === 0 ||
		messageInput.length > maxMessageLength ||
		amountOfMessagesSent >= maxMessages;

	function sendMessage() {
		if (messageInput.length === 0) return;
		if (messageInput.length > maxMessageLength) {
			addToast(`Message too long 😅, max length is ${maxMessageLength} ❗`, 'error');
			return;
		}

		console.log(`Amount of messages sent: ${amountOfMessagesSent}, max: ${maxMessages}`);
		if (amountOfMessagesSent < maxMessages) {
			sendMessageCb(messageInput);
			canSend = false;
			setTimeout(() => {
				canSend = true;
			}, chatTimeout);
			messageInput = '';
			amountOfMessagesSent += 1;
		} else {
			addToast('No more messages for you 🤐', 'error');
		}
	}
</script>

<div class="space-y-4">
	<h2 class="font-bold text-xl">{username ? `Chat to ${username}` : 'Chat'}</h2>
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
	{#if canSend}
		<div class="flex space-x-2 h-16">
			<div class="flex-grow h-full">
				<TextInput bind:value={messageInput} placeholder="Enter message" />
			</div>
			<div class="h-full flex-grow">
				<Button {disabled} click={sendMessage}>Send</Button>
			</div>
		</div>
	{/if}
</div>
