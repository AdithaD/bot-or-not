import { createNewGame } from '$lib/game';
import { json } from '@sveltejs/kit';
import { getDatabase } from 'firebase-admin/database';

export async function POST() {
	let game = createNewGame();
	return await getDatabase()
		.ref('games/' + game.id)
		.set(game)
		.then(() => {
			console.log('Game created!');
			return json({ id: game.id }, { status: 200 });
		})
		.catch((e) => {
			console.log;
			return json({ error: e }, { status: 500 });
		});
}
