import { json } from '@sveltejs/kit';
import { getDatabase } from 'firebase-admin/database';
import type { RequestHandler } from './$types';
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
