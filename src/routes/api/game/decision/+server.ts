import { json } from '@sveltejs/kit';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';

export async function POST({ request }) {
	let { gameId, targetUid, decision } = await request.json();

	if (gameId == null || targetUid == null || decision == null)
		return json({ error: 'Invalid request' }, { status: 400 });

	let uid: string;
	try {
		let decoded = await getAuth().verifyIdToken(
			request.headers.get('Authorization')?.split(' ')[1] ?? ''
		);
		uid = decoded.uid;
	} catch (error) {
		return json({ error: 'Invalid token' }, { status: 403 });
	}

	getDatabase().ref(`games/${gameId}/privateState/decisions/${uid}/${targetUid}`).set(decision);

	return json({}, { status: 200 });
}

// Get decision

export async function GET({ request, url }) {
	let gameId = url.searchParams.get('gameId') ?? '';

	if (gameId == null) return json({ error: 'Invalid request' }, { status: 400 });

	let uid: string;
	try {
		let decoded = await getAuth().verifyIdToken(
			request.headers.get('Authorization')?.split(' ')[1] ?? ''
		);
		uid = decoded.uid;
	} catch (error) {
		return json({ error: 'Invalid token' }, { status: 403 });
	}

	let decisions = (
		await getDatabase().ref(`games/${gameId}/privateState/decisions/${uid}`).get()
	).val();

	return json({ decisions }, { status: 200 });
}
