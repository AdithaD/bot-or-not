import { createNewGame } from '$lib/game';
import { database } from '$lib/server/firebase.js';
import { json } from '@sveltejs/kit';

export async function POST() {
	let game = createNewGame();
	return await database
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
