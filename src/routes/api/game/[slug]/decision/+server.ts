import { json } from '@sveltejs/kit';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';
import { validateGameRequestAsUser } from '$lib/server/firebase';

export async function POST({ request, params }) {
	let { targetUid, decision } = await request.json();

	let gameId = params.slug;

	if (gameId == null || targetUid == null || decision == null)
		return json({ error: 'Invalid request' }, { status: 400 });

	let uid: string;
	try {
		uid = await validateGameRequestAsUser(request, gameId);
	} catch (error: any) {
		return error.response;
	}

	getDatabase().ref(`games/${gameId}/privateState/decisions/${uid}/${targetUid}`).set(decision);

	return json({}, { status: 200 });
}

// Get decision

export async function GET({ request, params }) {
	let gameId = params.slug;

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

	console.log(`Getting decisions for ${uid} in game ${gameId}: ${decisions}`);

	return json({ decisions }, { status: 200 });
}
