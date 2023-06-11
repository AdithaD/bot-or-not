import {
	generateRandomAllocations,
	type Chat,
	type Game,
	type Phase,
	type TargetedObject
} from '$lib/game';
import { json } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase, type Database } from 'firebase-admin/database';

export type GameStartRequestBody = {
	gameId: string;
	phase: Phase;
};

export async function POST({ request }): Promise<Response> {
	let { gameId, phase }: GameStartRequestBody = await request.json();
	let database = getDatabase();

	let game = (await database
		.ref(`games/${gameId}`)
		.get()
		.then((snapshot) => snapshot.val())) as Game;

	if (game == null) return json({ error: 'Game does not exist' }, { status: 404 });

	let ownerId: string | null = null;
	try {
		let decoded = await getAuth().verifyIdToken(
			request.headers.get('Authorization')?.split(' ')[1] ?? ''
		);
		ownerId = decoded.uid;
	} catch (error) {
		return json({ error: 'Invalid token' }, { status: 403 });
	}
	if (ownerId && game.owner != ownerId)
		return json({ error: 'You are not the owner of this game' }, { status: 403 });

	switch (phase) {
		case 'prompt':
			await moveToPrompt(game, database);
			break;
		case 'chat':
			await moveToChat(game, database);
			break;
		default:
			return json({ error: 'Invalid phase' }, { status: 400 });
			break;
	}

	return json({}, { status: 200 });
}

async function moveToPrompt(game: Game, database: Database) {
	if (Object.keys(game.users).length < 3)
		return json({ error: 'Not enough players' }, { status: 403 });

	const updates: { [path: string]: any } = {};

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

async function moveToChat(game: Game, database: Database) {
	let prompts = (
		await database.ref(`games/${game.id}/privateState/prompts`).get()
	).val() as TargetedObject<string>;
	if (prompts) {
		// Validation
		if (Object.values(prompts).some((target) => Object.values(target).length < 1)) {
			return json({ error: 'Not enough prompts' }, { status: 403 });
		}

		let chats: TargetedObject<Chat> = {};
		for (let uid in Object.keys(game.users)) {
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

		const updates: { [ref: string]: any } = {};

		updates[`games/${game.id}/publicState/chat/chats`] = chats;
		updates[`games/${game.id}/publicState/phase`] = 'chat';

		await database.ref().update(updates);
	} else {
		return json({ error: 'No prompts' }, { status: 403 });
	}
}
