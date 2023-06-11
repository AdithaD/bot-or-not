// Import the functions you need from the SDKs you need
import * as admin from 'firebase-admin';
import admin_key from './../../../secrets/admin_key.json';
var app = null;
try {
	app = admin.initializeApp({
		credential: admin.credential.cert(admin_key as any),
		databaseURL: 'https://bot-or-not-f60ab-default-rtdb.firebaseio.com'
	});
} catch (e) {}
