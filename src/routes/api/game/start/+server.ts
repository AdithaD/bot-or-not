import { generateRandomAllocations, type Game } from '$lib/game';
import { json } from '@sveltejs/kit';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';

export type GameStartRequestBody = {
	gameId: string;
	token: string;
};

export async function POST({ request }): Promise<Response> {
	let { gameId, token }: GameStartRequestBody = await request.json();
	let database = getDatabase();

	let game = (await database
		.ref(`games/${gameId}`)
		.get()
		.then((snapshot) => snapshot.val())) as Game;

	if (game == null) return json({ error: 'Game does not exist' }, { status: 404 });

	let ownerId: string | null = null;
	try {
		let decoded = await getAuth().verifyIdToken(token);
		ownerId = decoded.uid;
	} catch (error) {
		return json({ error: 'Invalid token' }, { status: 403 });
	}
	if (ownerId && game.owner != ownerId)
		return json({ error: 'You are not the owner of this game' }, { status: 403 });

	if (Object.keys(game.users).length < 3)
		return json({ error: 'Not enough players' }, { status: 403 });

	await database.ref(`games/${gameId}/state/phase`).set('prompt');

	await database
		.ref(`games/${gameId}/state/prompt/prompts`)
		.set(generateRandomAllocations(Object.keys(game.users)));

	return json({}, { status: 200 });
}
