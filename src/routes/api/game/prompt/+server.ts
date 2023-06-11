import { amountOfPromptsPerPlayer, type EnumeratedObject, type TargetedObject } from '$lib/game';
import { json } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

const maxPromptLength = 150;

export async function GET({ request, url }): Promise<Response> {
	let token = request.headers.get('Authorization')?.split(' ')[1] ?? '';
	let gameId = url.searchParams.get('gameId') ?? '';

	let uid: string;
	try {
		let decoded = await getAuth().verifyIdToken(token);
		uid = decoded.uid;
	} catch (error) {
		return json({ error: 'Invalid token' }, { status: 403 });
	}

	try {
		let prompts = (
			await getDatabase().ref(`games/${gameId}/privateState/prompts`).get()
		).val() as TargetedObject<string>;

		console.log(gameId);

		console.log(JSON.stringify(prompts));

		if (prompts == null) return json({}, { status: 200 });

		let userPrompts: { [targetUid: string]: string } = {};
		Object.entries(prompts).forEach(([targetUid, prompts]) => {
			userPrompts[targetUid] = prompts[uid];
		});

		return json({ prompts: userPrompts }, { status: 200 });
	} catch (error: any) {
		console.log(error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
export async function POST({ request }) {
	let { gameId, prompts } = (await request.json()) as {
		gameId: string;
		prompts: { [targetId: string]: string };
	};

	let token = request.headers.get('Authorization')?.split(' ')[1] ?? '';

	// Validate request
	if (gameId == null || prompts == null) return json({ error: 'Invalid request' }, { status: 400 });

	if (Object.keys(prompts).length < amountOfPromptsPerPlayer)
		return json({ error: 'Not enough prompts' }, { status: 400 });

	// Validate all prompts
	Object.values(prompts).forEach((p) => {
		if (p.length < 10 || p.length > maxPromptLength)
			return json(
				{ error: `Prompt must be between 10 and ${maxPromptLength} characters`, data: p },
				{ status: 400 }
			);
	});

	// Check if game exists
	let uid: string;
	try {
		let decoded = await getAuth().verifyIdToken(token);
		uid = decoded.uid;
	} catch (error) {
		return json({ error: 'Invalid token' }, { status: 403 });
	}

	// Check if correct allocation
	let allocation = (
		await getDatabase().ref(`games/${gameId}/publicState/prompt/allocation/${uid}`).get()
	).val() as EnumeratedObject<string>;

	Object.keys(prompts).forEach((target) => {
		if (!Object.values(allocation).includes(target))
			return json({ error: 'Invalid target' }, { status: 403 });
	});

	// Update database
	const updates: { [path: string]: any } = {};
	Object.entries(prompts).forEach(([targetUid, prompt]) => {
		updates[`games/${gameId}/privateState/prompts/${targetUid}/${uid}`] = prompt;
	});

	updates[`games/${gameId}/publicState/prompt/submitted/${uid}`] = true;

	await getDatabase().ref().update(updates);

	return json({}, { status: 200 });
}
