import type { Game, JoinRequestBody, User } from '$lib/game.js';
import { json } from '@sveltejs/kit';
import { getDatabase } from 'firebase-admin/database';

export async function POST({ request }) {
	let { gameId, user } = (await request.json()) as JoinRequestBody;

	if (user.username == null || user.username.length < 1) {
		return json({ error: 'Username is required' }, { status: 400 });
	}

	if (gameId == null || gameId.length < 1) {
		return json({ error: 'Game ID is required' }, { status: 400 });
	}

	let database = getDatabase();
	console.log('getting game');
	let gameSnapshot = await database.ref(`games/${gameId}`).get();

	if (gameSnapshot.exists()) {
		let game = gameSnapshot.val() as Game;

		if (game.users == null || Object.keys(game.users).length < 10) {
			let userRef = database.ref(`games/${gameId}/users/${user.uid}`);
			if (!game.owner || game.owner == null) {
				console.log('setting owner');
				let ownerRef = database.ref(`games/${gameId}/owner`);
				ownerRef.set(user.uid);
				console.log('owner set as ' + user.uid);
			}
			userRef.set(user);
			console.log('user set as ' + user.uid);
			return json({ gameId, user }, { status: 200 });
		} else {
			return json({ error: 'Game is full' }, { status: 400 });
		}
	}
}
