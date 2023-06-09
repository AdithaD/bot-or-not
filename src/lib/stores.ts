import { readable, writable, type Readable } from 'svelte/store';
import type { Game, User } from './game';
import { browser } from '$app/environment';
import { getDatabase, onValue, ref, type Unsubscribe } from 'firebase/database';

export const gameId = writable<string | null>(null);
export const user = writable<User | null>(null);

if (browser) {
	user.set(JSON.parse(localStorage.getItem('user') || 'null'));
	gameId.set(JSON.parse(localStorage.getItem('gameId') || 'null'));

	user.subscribe((value) => {
		localStorage.setItem('user', JSON.stringify(value));
	});

	gameId.subscribe((value) => {
		localStorage.setItem('gameId', JSON.stringify(value));
	});

	game = readable<Game | null>(null, (set) => {
		let usFunc: Unsubscribe | null = null;
		gameId.subscribe((gameId) => {
			console.log('gameId changed ' + gameId);
			if (gameId != null) {
				console.log('subscribing to game ' + gameId);
				usFunc = onValue(ref(getDatabase(), `games/${gameId}`), (snapshot) => {
					set(snapshot.val());
					console.log('game updated ' + JSON.stringify(snapshot.val()));
				});
			} else {
				set(null);
			}
		});
		return function stop() {
			console.log('unsubscribing from game');
			if (usFunc != null) {
				usFunc();
			}
		};
	});
}

export var game: Readable<Game | null>;
