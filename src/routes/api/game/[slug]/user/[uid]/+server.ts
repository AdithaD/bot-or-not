import { json } from '@sveltejs/kit';
import { getDatabase } from 'firebase-admin/database';
import type { RequestHandler } from './$types';
import { validateGameRequestAsOwner } from '$lib/server/firebase';
export const GET: RequestHandler = async ({ url, params }) => {
	let gameId = params.slug;
	let uid = params.uid;

	// Check if user is playing this game.
	let users = (await getDatabase().ref(`games/${gameId}/users`).get()).val();
	console.log(`games/${gameId}/users/${uid}`);

	if (users == null) return json({ error: 'Game not found' }, { status: 404 });

	let isPlaying = users[uid] != null;

	if (!isPlaying) return json({ error: 'User is not playing this game', gameId }, { status: 404 });
	else {
		return json({ user: users[uid] }, { status: 200 });
	}
};

export const DELETE: RequestHandler = async ({ request, url, params }) => {
	let gameId = params.slug;
	let uid = params.uid;

	try {
		let owner = await validateGameRequestAsOwner(request, gameId);
		if (owner == uid)
			return json({ error: 'You cannot remove yourself from the game.' }, { status: 422 });
	} catch (error: any) {
		return error.response;
	}

	// Check if user is playing this game.
	let users = (await getDatabase().ref(`games/${gameId}/users`).get()).val();
	console.log(`games/${gameId}/users/${uid}`);

	if (users == null) return json({ error: 'Game not found' }, { status: 404 });

	let isPlaying = users[uid] != null;

	if (!isPlaying) return json({ error: 'User is not playing this game', gameId }, { status: 404 });
	else {
		if ((await getDatabase().ref(`games/${gameId}/publicState/phase`).get()).val() == 'lobby') {
			await getDatabase().ref(`games/${gameId}/users/${uid}`).remove();
			return json({ success: true }, { status: 200 });
		} else {
			return json({ error: 'Game is not in lobby phase' }, { status: 422 });
		}
	}
};
