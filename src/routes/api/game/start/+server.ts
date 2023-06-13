import type { Game, Phase } from '$lib/game';
import { moveToChat, moveToPrompt, moveToReveal, moveToSelect } from '$lib/server/game';
import { json } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

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
			return await moveToPrompt(game, database);
		case 'select':
			return await moveToSelect(game, database);
		case 'chat':
			return await moveToChat(game, database);
		default:
			return json({ error: 'Invalid phase' }, { status: 400 });
	}

	return json({}, { status: 200 });
}
