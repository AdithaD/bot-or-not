import { getDatabase } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { browserSessionPersistence, getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
	apiKey: 'AIzaSyC7FQm-4qWD5V5xj5CxKMU90Cm42nwetRw',
	authDomain: 'bot-or-not-f60ab.firebaseapp.com',
	databaseURL: 'https://bot-or-not-f60ab-default-rtdb.firebaseio.com',
	projectId: 'bot-or-not-f60ab',
	storageBucket: 'bot-or-not-f60ab.appspot.com',
	messagingSenderId: '94093815501',
	appId: '1:94093815501:web:c426f675b00a937fe88384'
};

export async function initialiseFirebase() {
	console.log('🔥 Initializing Firebase SDK');

	const app = initializeApp(firebaseConfig);
	const database = getDatabase(app);
	const auth = getAuth(app);
	auth.setPersistence(browserSessionPersistence);
	signInAnonymously(auth);
}
