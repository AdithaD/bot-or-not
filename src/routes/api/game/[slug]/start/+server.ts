import type { Game, Phase } from '$lib/game';
import { validateGameRequestAsOwner as validateGameRequestAsOwner } from '$lib/server/firebase.js';
import { moveToChat, moveToPrompt, moveToReveal, moveToSelect } from '$lib/server/game';
import { json } from '@sveltejs/kit';
import { getDatabase } from 'firebase-admin/database';

export type GameStartRequestBody = {
	phase: Phase;
};

export async function POST({ request, params }): Promise<Response> {
	let { phase }: GameStartRequestBody = await request.json();
	let database = getDatabase();

	let gameId = params.slug;

	try {
		await validateGameRequestAsOwner(request, gameId);
	} catch (error: any) {
		return error.response;
	}

	let game = (await database
		.ref(`games/${gameId}`)
		.get()
		.then((snapshot) => snapshot.val())) as Game;

	if (game == null) return json({ error: 'Game does not exist' }, { status: 404 });

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
}
