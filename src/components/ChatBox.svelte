<script lang="ts">
	import type { Message } from '$lib/game';
	import Border from './Border.svelte';

	import Button from './Button.svelte';
	import TextInput from './TextInput.svelte';

	export let messages: Message[] = [];
	let messageInput = '';

	export let username = '';

	export let sendMessageCb: (content: string) => void;

	function sendMessage() {
		sendMessageCb(messageInput);
		messageInput = '';
	}
</script>

<div class="space-y-4">
	<h2 class="font-bold text-xl">Chat to {username}</h2>
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
