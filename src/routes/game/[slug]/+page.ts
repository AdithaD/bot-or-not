import { error } from '@sveltejs/kit';
import { getAuth, signInAnonymously } from 'firebase/auth';
import type { PageLoad } from './$types';

export const prerender = false;

export const load = (async ({ params, fetch }) => {
	let { slug } = params;

	let auth = getAuth();

	if (auth.currentUser == null) {
		await signInAnonymously(getAuth());
	}
	try {
		let uid = auth.currentUser?.uid;
		let res = await fetch(`/api/game/${slug}/user/${uid}`);

		if (res.status == 200) {
			let { user } = await res.json();
			return {
				gameId: slug,
				user
			};
		} else {
			let { error, gameId } = await res.json();
			if (gameId) {
				return {
					gameId,
					user: null
				};
			} else {
				throw error(404, 'Game not found');
			}
		}
	} catch (e) {
		throw error(404, 'Game not found');
	}
}) satisfies PageLoad;
