import type { JoinRequestBody } from '$lib/game';
import { maxUsers } from '$lib/server/game';
import { json } from '@sveltejs/kit';
import { getDatabase } from 'firebase-admin/database';
import type { User } from '$lib/game.js';
import log from 'loglevel';
import { v4 as uuidv4, validate } from 'uuid';

export async function POST({ request, params }) {
	let { user } = (await request.json()) as JoinRequestBody;

	let { uid, username } = user;

	let gameId = params.slug;

	if (username == null || username.length < 1) {
		return json({ error: 'Username is required' }, { status: 400 });
	}

	if (gameId == null || gameId.length < 1) {
		return json({ error: 'Game ID is required' }, { status: 400 });
	} else if (!validate(gameId)) {
		return json({ error: 'Game ID is not valid' }, { status: 400 });
	}

	let database = getDatabase();
	let users = (await database.ref(`games/${gameId}/users`).get()).val() as { [uid: string]: User };

	if (users == null || Object.keys(users).length < maxUsers) {
		console.log(JSON.stringify(uid));
		let userRef = database.ref(`games/${gameId}/users/${uid}`);

		try {
			const dbUser = (await userRef.get()).val();
			if (dbUser) {
				return json({ gameId, dbUser, error: 'User already exists' }, { status: 409 });
			} else {
				await userRef.set(user);
				log.info(`GAME ${gameId}: USER ${user.uid} - ${user.username} joined.`);

				let owner = (await database.ref(`games/${gameId}/owner`).get()).val();

				if (!owner) {
					let ownerRef = database.ref(`games/${gameId}/owner`);
					await ownerRef.set(user.uid);
					log.info(`GAME ${gameId}: USER ${user.uid} - ${user.username} is the owner.`);
				}
			}
		} catch (e) {
			log.error(e);
			return json({ error: 'Error joining game' }, { status: 500 });
		}

		return json({ gameId, user }, { status: 201 });
	} else {
		return json({ error: 'Game is full' }, { status: 400 });
	}
}
