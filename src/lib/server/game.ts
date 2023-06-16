import type {
	Chat,
	ChatSelections,
	ChatTypes,
	EnumeratedObject,
	Game,
	Message,
	PrivateGameState,
	RevealData,
	TargetedObject,
	User,
	UserGameState,
	UserRevealData,
	UserTargetRevealData
} from '$lib/game';

import { json } from '@sveltejs/kit';
import { ServerValue, getDatabase, type Database } from 'firebase-admin/database';
import { aiTurn } from './bot';
import log from 'loglevel';
import { env } from '$env/dynamic/private';
const chatTime = env.CHAT_TIME ?? 60;
export const amountOfPromptsPerPlayer = 2;
const chatsPerPlayer: { [playerCount: number]: number } = {
	3: 1,
	4: 2,
	5: 2,
	6: 3
};
export const maxMessagesPerPlayerPerChat = 4;
export const maxUsers = 6;

// Changes the game state to the prompt phase.
export async function moveToPrompt(game: Game, database: Database) {
	log.log(`Game ${game.id}: Moving to prompt phase`);

	if (Object.keys(game.users).length < 3)
		return json({ error: 'Not enough players' }, { status: 403 });

	if (game.publicState.phase != 'lobby') {
		return json({ error: 'Wrong origin phase' }, { status: 422 });
	}

	const updates: { [path: string]: any } = {};
	// Initial game state
	updates[`games/${game.id}/publicState/chatsPerPlayer`] =
		chatsPerPlayer[Object.keys(game.users).length];

	updates[`games/${game.id}/publicState/prompt/allocation`] = genRandAlloc(
		Object.keys(game.users),
		2
	);

	updates[`games/${game.id}/publicState/prompt/submitted`] = Object.keys(game.users).reduce(
		(acc, user) => {
			acc[user] = false;
			return acc;
		},
		{} as { [uid: string]: boolean }
	);
	updates[`games/${game.id}/publicState/phase`] = 'prompt';

	try {
		await database.ref().update(updates);
	} catch (error) {
		console.error(error);
		return json({ error: 'Failed to update database' }, { status: 500 });
	}

	return json({}, { status: 200 });
}

export async function moveToSelect(game: Game, database: Database) {
	log.log(`Game ${game.id}: Moving to select phase`);
	if (game.publicState.phase != 'prompt') {
		return json({ error: 'Wrong origin phase' }, { status: 422 });
	}

	try {
		await database.ref(`games/${game.id}/publicState/phase`).set('select');
	} catch (error) {
		return json({ error: 'Failed to update database' }, { status: 500 });
	}
	return json({}, { status: 200 });
}

export async function moveToChat(game: Game, database: Database) {
	if (game.publicState.phase != 'select') {
		return json({ error: 'Wrong origin phase' }, { status: 422 });
	}

	try {
		let prompts = (
			await database.ref(`games/${game.id}/privateState/prompts`).get()
		).val() as TargetedObject<string>;

		if (prompts) {
			// Validation
			if (Object.values(prompts).some((target) => Object.values(target).length < 1)) {
				return json({ error: 'Not enough prompts' }, { status: 403 });
			}

			let chats: TargetedObject<Chat> = {};

			let selection = (
				await database.ref(`games/${game.id}/privateState/chatSelection`).get()
			).val() as ChatSelections;

			let types: TargetedObject<ChatTypes> = {};

			const updates: { [ref: string]: any } = {};

			for (const uid in game.users) {
				// Get all the users this user has selected to talk to
				let chatTargets = Object.keys(selection[uid]).filter((target) => selection[uid][target]);

				for (const target of chatTargets) {
					if (!chats[uid]) chats[uid] = {};
					chats[uid][target] = {
						messages: {},
						active: true
					};

					if (!types[uid]) types[uid] = {};
					// Are they talking back? (P2P)
					if (selection[target][uid]) {
						createP2PChatBridge(uid, target);
						types[uid][target] = 'P2P';
					} else {
						// Are they not talking back? (H2AI)
						createP2AIChatBridge(uid, target);

						types[uid][target] = 'P2AI';
					}
				}
				updates[`games/${game.id}/userState/${uid}/chats`] = chats[uid];
			}

			updates[`games/${game.id}/privateState/chatTypes`] = types;
			// Update database
			updates[`games/${game.id}/publicState/phase`] = 'chat';

			updates[`games/${game.id}/publicState/chat/timer`] = {
				startAt: ServerValue.TIMESTAMP,
				seconds: chatTime
			};

			// Auto reveal after time expires
			database.ref(`games/${game.id}/publicState/chat/timer`).once('value', (snapshot) => {
				log.log(`Game ${game.id}: Chat timer started for ${chatTime}`);
				setTimeout(() => moveToReveal(game.id, database), snapshot.val().seconds * 1000);
			});

			await database.ref().update(updates);

			return json({}, { status: 200 });
		} else {
			return json({ error: 'No prompts' }, { status: 403 });
		}
	} catch (error) {
		return json({ error: 'Failed to update database' }, { status: 500 });
	}

	function createP2PChatBridge(from: string, to: string) {
		let u1ToU2 = getDatabase().ref(`games/${game.id}/userState/${from}/chats/${to}/messages`);
		let u2ToU1 = getDatabase().ref(`games/${game.id}/userState/${to}/chats/${from}/messages`);

		u1ToU2.on('child_added', (snapshot) => {
			let newMessage: Message = snapshot.val();
			if (newMessage && newMessage.uid != to) {
				u2ToU1.push(newMessage);
			}
		});
	}

	function createP2AIChatBridge(uid: string, aiUid: string) {
		let userChatRef = getDatabase().ref(
			`games/${game.id}/userState/${uid}/chats/${aiUid}/messages`
		);

		aiTurn(-1, userChatRef, uid, aiUid, game.id);
	}
}

export async function moveToReveal(gameId: string, database: Database) {
	let phase = (await database.ref(`games/${gameId}/publicState/phase`).get()).val();
	log.log(`Game ${gameId}: Moving to reveal phase`);

	if (phase != 'chat') {
		log.error(`Game ${gameId}: Wrong origin phase`);
		return json({ error: 'Wrong origin phase' }, { status: 422 });
	}

	try {
		let types = (await (
			await database.ref(`games/${gameId}/privateState/chatTypes`).get()
		).val()) as TargetedObject<ChatTypes>;
		// Kills all chat listeners
		for (const [uid, targets] of Object.entries(types)) {
			for (const target of Object.keys(targets)) {
				let chatRef = database.ref(`games/${gameId}/userState/${uid}/chats/${target}/messages`);
				chatRef.off();
			}
		}
	} catch (error) {
		log.error(error);
		return json({ error: 'Failed to update database' }, { status: 500 });
	}

	try {
		const privateGameState = (await (
			await database.ref(`games/${gameId}/privateState`).get()
		).val()) as PrivateGameState;

		const revealData: RevealData = {};

		const users = (await database.ref(`games/${gameId}/users`).get()).val() as {
			[uid: string]: User;
		};

		for (const user of Object.values(users)) {
			const userRevealData: UserRevealData = {};

			const userState = (await (
				await database.ref(`games/${gameId}/userState/${user.uid}`).get()
			).val()) as UserGameState;

			for (const target of Object.keys(userState.chats)) {
				const userTargetRevealData: UserTargetRevealData = {
					messages: userState.chats[target],
					decision: privateGameState.decisions?.[user.uid]?.[target] ?? false,
					truth: privateGameState.chatTypes[user.uid][target] == 'P2AI',
					prompts: privateGameState.prompts[target]
				};
				userRevealData[target] = userTargetRevealData;
			}
			revealData[user.uid] = userRevealData;
		}
		const updates: { [path: string]: any } = {};

		updates[`games/${gameId}/publicState/reveal`] = revealData;
		updates[`games/${gameId}/publicState/phase`] = 'reveal';

		await database.ref().update(updates);
	} catch (error) {
		log.error(error);
		return json({ error: 'Failed to update database' }, { status: 500 });
	}

	return json({}, { status: 200 });
}

function genRandAlloc(uids: string[], chooseAmount: number) {
	/// Randomly shift array of indexes  1 -> n-1 to ensure that no one is paired with themselves. Shifts cannot double up otherwise a user may be assigned twice to the same person.

	// Initialise allocation object.
	let allocation = {} as { [uid: string]: EnumeratedObject<string> };
	uids.forEach((uid) => {
		allocation[uid] = {};
	});

	// Will store the shifts that have been used so far.
	let shifts: { [shift: number]: boolean } = {};

	for (let c = 0; c < chooseAmount; c++) {
		// Find all shifts that have not been used yet.
		let candidates = [];
		for (let i = 1; i < uids.length; i++) {
			if (!(i in shifts)) {
				candidates.push(i);
			}
		}

		// Randomly select a shift from the candidates.
		let shift = candidates[Math.floor(Math.random() * candidates.length)];
		shifts[shift] = true;

		// Shift the indexes of the uids array [0..N-1] by shift.
		let shiftedIndexes = [];
		for (let i = 0; i < uids.length; i++) {
			shiftedIndexes.push((i + shift) % uids.length);
		}

		// Assign each uid to the shifted index.
		for (let i = 0; i < uids.length; i++) {
			let uid = uids[i];
			let target = uids[shiftedIndexes[i]];

			allocation[uid][c] = target;
		}
	}

	return allocation;
}
