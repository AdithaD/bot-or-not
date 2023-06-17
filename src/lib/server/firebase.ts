// Import the functions you need from the SDKs you need
import admin from 'firebase-admin';
import admin_key from './../../../secrets/admin_key.json';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';
import { json } from '@sveltejs/kit';
var app = null;
try {
	console.log('🔥 Initializing Firebase SDK on Server');
	app = admin.initializeApp({
		credential: admin.credential.cert(admin_key as any),
		databaseURL: 'https://bot-or-not-f60ab-default-rtdb.firebaseio.com'
	});
} catch (e) {
	console.log(e);
}

const database = getDatabase();

export type BONAuthError = {
	response: Response;
};

export async function validateGameRequestAsUser(request: Request, gameId: string): Promise<string> {
	try {
		let decoded = await getAuth().verifyIdToken(
			request.headers.get('Authorization')?.split(' ')[1] ?? ''
		);

		let uid = decoded.uid;

		let users = (await database.ref(`games/${gameId}/users`).get()).val();
		if (users == null || users[uid] == null)
			throw { response: json({ error: 'You are not a user of this game.' }, { status: 403 }) };

		return decoded.uid;
	} catch (error) {
		throw { resposne: json({ error: 'Invalid token' }, { status: 403 }) };
	}
}

export async function validateGameRequestAsOwner(
	request: Request,
	gameId: string
): Promise<string> {
	let decoded = await getAuth()
		.verifyIdToken(request.headers.get('Authorization')?.split(' ')[1] ?? '')
		.catch(() => {
			throw { response: json({ error: 'Invalid token' }, { status: 403 }) };
		});

	let uid = decoded.uid;

	let owner = (await database.ref(`games/${gameId}/owner`).get()).val();
	if (owner == null || owner != uid)
		throw { response: json({ error: 'You are not the owner of this game.' }, { status: 403 }) };

	return decoded.uid;
}
