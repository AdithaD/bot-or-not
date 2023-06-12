import type { Game, JoinRequestBody, User } from '$lib/game.js';
import { maxUsers } from '$lib/server/game.js';
import { json } from '@sveltejs/kit';
import { getDatabase } from 'firebase-admin/database';
import log from 'loglevel';

export async function POST({ request }) {
	let { gameId, user } = (await request.json()) as JoinRequestBody;

	if (user.username == null || user.username.length < 1) {
		return json({ error: 'Username is required' }, { status: 400 });
	}

	if (gameId == null || gameId.length < 1) {
		return json({ error: 'Game ID is required' }, { status: 400 });
	}

	if (user.uid == null) {
		return json({ error: 'User ID is required' }, { status: 400 });
	}

	let database = getDatabase();
	let gameSnapshot = await database.ref(`games/${gameId}`).get();

	if (gameSnapshot.exists()) {
		let game = gameSnapshot.val() as Game;

		if (game.users == null || Object.keys(game.users).length < maxUsers) {
			let userRef = database.ref(`games/${gameId}/users/${user.uid}`);

			try {
				const dbUser = (await userRef.get()).val() as User;
				if (dbUser) {
					return json({ gameId, dbUser, error: 'User already exists' }, { status: 409 });
				} else {
					await userRef.set(user);
					log.info(`GAME ${gameId}: USER ${user.uid} - ${user.username} joined.`);

					if (!game.owner || game.owner == null) {
						let ownerRef = database.ref(`games/${gameId}/owner`);
						await ownerRef.set(user.uid);
						log.info(`GAME ${gameId}: USER ${user.uid} - ${user.username} is the owner.`);
					}
				}
			} catch (e) {
				log.error(e);
			}

			return json({ gameId, user }, { status: 201 });
		} else {
			return json({ error: 'Game is full' }, { status: 400 });
		}
	} else {
		return json({ error: 'Game does not exist' }, { status: 404 });
	}
}
