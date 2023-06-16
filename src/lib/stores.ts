import { browser } from '$app/environment';
import { getDatabase, onValue, ref, type Unsubscribe } from 'firebase/database';
import { readable, get as storeGet, writable, type Readable } from 'svelte/store';
import type { Phase, User } from './game';

export const gameId = writable<string | null>(null);
export const user = writable<User | null>(null);

if (browser) {
	user.set(JSON.parse(sessionStorage.getItem('user') || 'null'));
	gameId.set(JSON.parse(sessionStorage.getItem('gameId') || 'null'));

	user.subscribe((value) => {
		if (!value) sessionStorage.removeItem('user');
		else sessionStorage.setItem('user', JSON.stringify(value));
	});

	gameId.subscribe((value) => {
		if (!value) sessionStorage.removeItem('gameId');
		else sessionStorage.setItem('gameId', JSON.stringify(value));
	});

	isOwner = createFirebaseReadableStore<boolean>(`/owner`, (val) => val == storeGet(user)?.uid);
	users = createFirebaseReadableStore<{ [uid: string]: User }>(`users`);
	phase = createFirebaseReadableStore<Phase>(`publicState/phase`);
	round = createFirebaseReadableStore<number>(`publicState/round`);
}

export var users: Readable<{ [uid: string]: User } | null>,
	isOwner: Readable<boolean | null>,
	phase: Readable<Phase | null>,
	round: Readable<number | null>;

function createFirebaseReadableStore<T>(
	subGamePath: string,
	parser?: (val: any) => T
): Readable<T | null> {
	return readable<T | null>(null, (set) => {
		let usFunc: Unsubscribe | null = null;
		gameId.subscribe((id) => {
			if (id != null) {
				usFunc = onValue(
					ref(getDatabase(), `games/${id}/${subGamePath}`),
					(snapshot) =>
						set(snapshot.val() ? (parser ? parser(snapshot.val()) : snapshot.val()) : null),

					(error) => console.log(error)
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
