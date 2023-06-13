import { browser } from '$app/environment';
import { get, getDatabase, onValue, ref, type Unsubscribe } from 'firebase/database';
import { readable, writable, type Readable, get as storeGet } from 'svelte/store';
import type { Game, Phase, User } from './game';

export const gameId = writable<string | null>(null);
export const user = writable<User | null>(null);

if (browser) {
	user.set(JSON.parse(sessionStorage.getItem('user') || 'null'));
	gameId.set(JSON.parse(sessionStorage.getItem('gameId') || 'null'));

	user.subscribe((value) => {
		sessionStorage.setItem('user', JSON.stringify(value));
	});

	gameId.subscribe((value) => {
		sessionStorage.setItem('gameId', JSON.stringify(value));
	});

	users = readable<{ [uid: string]: User } | null>(null, (set) => {
		let usFunc: Unsubscribe | null = null;
		gameId.subscribe((gameId) => {
			if (gameId != null) {
				usFunc = onValue(
					ref(getDatabase(), `games/${gameId}/users`),
					(snapshot) => {
						set(snapshot.val());
					},
					(error) => {
						console.log(error);
					}
				);
			} else {
				set(null);
			}
		});
		return function stop() {
			if (usFunc != null) {
				usFunc();
			}
		};
	});

	isOwner = readable<boolean>(false, (set) => {
		let usFunc: Unsubscribe | null = null;
		let us1 = gameId.subscribe((gameId) => {
			get(ref(getDatabase(), `games/${gameId}/owner`))
				.then((snapshot) => {
					let uid = storeGet(user)?.uid;
					set(snapshot.val() == uid);
				})
				.catch((error) => {
					console.log('Could not get owner');
				});
		});
		let us2 = user.subscribe((user) => {
			get(ref(getDatabase(), `games/${storeGet(gameId)}/owner`))
				.then((snapshot) => {})
				.catch((error) => {
					console.log('Could not get owner');
				});
		});
		return function stop() {
			if (usFunc != null) {
				usFunc();
			}
			if (us1) us1();
			if (us2) us2();
		};
	});
	phase = readable<Phase | null>(null, (set) => {
		let usFunc: Unsubscribe | null = null;
		gameId.subscribe((gameId) => {
			if (gameId != null) {
				usFunc = onValue(
					ref(getDatabase(), `games/${gameId}/publicState/phase`),
					(snapshot) => {
						set(snapshot.val());
					},
					(error) => {
						console.log(error);
					}
				);
			} else {
				set(null);
			}
		});
		return function stop() {
			if (usFunc != null) {
				usFunc();
			}
		};
	});
	round = readable<number | null>(null, (set) => {
		let usFunc: Unsubscribe | null = null;
		gameId.subscribe((gameId) => {
			if (gameId != null) {
				usFunc = onValue(
					ref(getDatabase(), `games/${gameId}/publicState/round`),
					(snapshot) => {
						set(parseInt(snapshot.val()));
					},
					(error) => {
						console.log(error);
					}
				);
			} else {
				set(null);
			}
		});
		return function stop() {
			if (usFunc != null) {
				usFunc();
			}
		};
	});
}

export var users: Readable<{ [uid: string]: User } | null>,
	isOwner: Readable<boolean>,
	phase: Readable<Phase | null>,
	round: Readable<number | null>;
