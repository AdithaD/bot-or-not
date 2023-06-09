// Import the functions you need from the SDKs you need
import { env } from '$env/dynamic/private';
import admin, { initializeApp } from 'firebase-admin';
import admin_key from './../../../secrets/admin_key.json';
var app = null;
try {
	app = initializeApp({
		credential: admin.credential.cert(admin_key as any),
		databaseURL: 'https://bot-or-not-f60ab-default-rtdb.firebaseio.com'
	});
} catch (e) {}

const database = admin.database();

export { database };
