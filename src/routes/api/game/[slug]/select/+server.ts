import { validateGameRequestAsUser } from '$lib/server/firebase.js';
import { moveToChat } from '$lib/server/game.js';
import { json } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

export async function POST({ request, params }) {
	let { selectedUids } = (await request.json()) as {
		selectedUids: string[];
	};

	let gameId = params.slug;

	let database = getDatabase();

	let uid: string;
	try {
		uid = await validateGameRequestAsUser(request, gameId);
	} catch (error: any) {
		return error.response;
	}

	let chatsPerPlayer = (
		await database.ref(`games/${gameId}/publicState/chatsPerPlayer`).get()
	).val();

	if (chatsPerPlayer == null) return json({ error: 'Game does not exist' }, { status: 404 });

	if (selectedUids.length != chatsPerPlayer)
		return json({ error: 'Invalid number of players' }, { status: 400 });

	let enumerated = selectedUids.reduce<{ [uid: string]: boolean }>((acc, uid) => {
		acc[uid] = true;
		return acc;
	}, {});
	const updates: { [path: string]: any } = {};
	updates[`games/${gameId}/privateState/chatSelection/${uid}`] = enumerated;
	updates[`games/${gameId}/publicState/select/selected/${uid}`] = true;
	database.ref().update(updates);

	let selected = (await database.ref(`games/${gameId}/publicState/select/selected`).get()).val();
	let users = (await database.ref(`games/${gameId}/users`).get()).val();

	if (selected != null && Object.keys(selected).length == Object.keys(users).length) {
		var game = (await database.ref(`games/${gameId}`).get()).val();
		moveToChat(game, database);
	}

	return json({}, { status: 200 });
}
