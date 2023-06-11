import { json } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

export async function POST({ request }) {
	let { gameId, selectedUids } = (await request.json()) as {
		gameId: string;
		selectedUids: string[];
	};

	let database = getDatabase();

	let chatsPerPlayer = (
		await database.ref(`games/${gameId}/publicState/chatsPerPlayer`).get()
	).val();

	if (chatsPerPlayer == null) return json({ error: 'Game does not exist' }, { status: 404 });

	if (selectedUids.length != chatsPerPlayer)
		return json({ error: 'Invalid number of players' }, { status: 400 });

	let uid: string | null = null;
	try {
		console.log(request.headers.get('Authorization')?.split(' ')[1] ?? '');
		let decoded = await getAuth().verifyIdToken(
			request.headers.get('Authorization')?.split(' ')[1] ?? ''
		);
		uid = decoded.uid;
	} catch (error) {
		return json({ error: 'Invalid token' }, { status: 403 });
	}

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
	}

	return json({}, { status: 200 });
}
