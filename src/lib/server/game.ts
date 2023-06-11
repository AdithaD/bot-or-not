import type { Chat, EnumeratedObject, Game, TargetedObject } from '$lib/game';
import { json } from '@sveltejs/kit';
import type { Database } from 'firebase-admin/database';

export const amountOfPromptsPerPlayer = 2;
const chatsPerPlayer: { [playerCount: number]: number } = {
	3: 1,
	4: 2,
	5: 2,
	6: 3
};

export async function moveToPrompt(game: Game, database: Database) {
	if (Object.keys(game.users).length < 3)
		return json({ error: 'Not enough players' }, { status: 403 });

	const updates: { [path: string]: any } = {};
	// Initial game state
	updates[`games/${game.id}/publicState/chatsPerPlayer`] =
		chatsPerPlayer[Object.keys(game.users).length];

	updates[`games/${game.id}/publicState/prompt/allocation`] = generateRandomAllocations(
		Object.keys(game.users)
	);

	updates[`games/${game.id}/publicState/prompt/submitted`] = Object.keys(game.users).reduce(
		(acc, user) => {
			acc[user] = false;
			return acc;
		},
		{} as { [uid: string]: boolean }
	);
	updates[`games/${game.id}/publicState/phase`] = 'prompt';

	await database.ref().update(updates);
}
export async function moveToChat(game: Game, database: Database) {
	let prompts = (
		await database.ref(`games/${game.id}/privateState/prompts`).get()
	).val() as TargetedObject<string>;
	if (prompts) {
		// Validation
		if (Object.values(prompts).some((target) => Object.values(target).length < 1)) {
			return json({ error: 'Not enough prompts' }, { status: 403 });
		}

		// Create one-way chats.
		let chats: TargetedObject<Chat> = {};
		console.log(JSON.stringify(game.users));
		for (let uid in game.users) {
			console.log(uid);
			Object.keys(game.users)
				.filter((user) => user != uid)
				.forEach((user) => {
					if (!chats[uid]) chats[uid] = {};
					chats[uid][user] = {
						messages: {},
						decision: false
					};
				});
		}

		// Create chat bridges...
		createP2PChatBridges();
		createP2AIChatBridges();

		// Update database
		const updates: { [ref: string]: any } = {};

		updates[`games/${game.id}/publicState/chat/chats`] = chats;
		updates[`games/${game.id}/publicState/phase`] = 'chat';

		await database.ref().update(updates);
	} else {
		return json({ error: 'No prompts' }, { status: 403 });
	}

	function createP2PChatBridges() {}

	function createP2AIChatBridges() {}
}
export function generateRandomAllocations(uids: string[]) {
	let selections: string[] = [];
	uids.forEach((uid) => {
		for (let i = 0; i < amountOfPromptsPerPlayer; i++) {
			selections.push(uid);
		}
	});

	let allocation = {} as { [uid: string]: EnumeratedObject<string> };
	let counter = 0;
	while (selections.length > 0) {
		let uid = uids[Math.floor(counter / 2)];

		if (allocation[uid] == null) allocation[uid] = {};

		let filteredSelections = selections.filter((selection) => selection != uid);
		let index = Math.floor(Math.random() * filteredSelections.length);
		let selection = filteredSelections[index];

		console.log(`uid: ${uid}, selection: ${selection}`);

		allocation[uid][(counter % 2).toString()] = selection;

		selections.splice(selections.indexOf(selection), 1);

		counter++;
	}

	return allocation;
}
