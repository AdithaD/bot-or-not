<script lang="ts">
	import type { Message, Messages } from '$lib/game';
	import { user } from '$lib/stores';
	import { getDatabase, onValue, push, ref } from 'firebase/database';
	import ChatBox from './ChatBox.svelte';

	export let refPath: string;
	export let username: string = '';

	let chatRef = ref(getDatabase(), refPath);

	let messages: Message[] = [];

	try {
		onValue(chatRef, (snapshot) => {
			let data = snapshot.val() as Messages;
			messages = Object.values(data ?? {});
		});
	} catch (error) {
		console.error(error);
	}

	async function sendMessage(content: string) {
		console.log(`pushing to ${refPath}`);
		await push(chatRef, { uid: $user?.uid, username: $user?.username, content } as Message);
	}
</script>

<ChatBox messages={messages ?? []} sendMessageCb={sendMessage} {username} />
