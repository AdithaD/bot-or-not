import { createNewGame } from '$lib/game';
import { json } from '@sveltejs/kit';
import { getDatabase } from 'firebase-admin/database';
import log from 'loglevel';
import { PUBLIC_MAX_MESSAGE_LENGTH } from '$env/static/public';

export async function POST() {
	let game = createNewGame();

	try {
		let maxMessageLength = parseInt(PUBLIC_MAX_MESSAGE_LENGTH);
		game.config.maxMessageLength = maxMessageLength;
	} catch (error) {
		console.log('Couldnt parse MAX_MESSAGE_LENGTH');
	}

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
