import { createNewGame } from '$lib/game';
import { json } from '@sveltejs/kit';
import { getDatabase } from 'firebase-admin/database';
import log from 'loglevel';

export async function POST() {
	let game = createNewGame();
	return await getDatabase()
		.ref('games/' + game.id)
		.set(game)
		.then(() => {
			log.info(`GAME ${game.id}: Created game.`);
			return json({ id: game.id }, { status: 200 });
		})
		.catch((e) => {
			return json({ error: e }, { status: 500 });
		});
}
