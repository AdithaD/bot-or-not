import { env } from '$env/dynamic/private';
import type {
	Chat,
	ChatSelections,
	ChatTypes,
	EnumeratedObject,
	Game,
	Message,
	Messages,
	PrivateGameState,
	RevealData,
	TargetedObject,
	User,
	UserGameState,
	UserRevealData,
	UserTargetRevealData
} from '$lib/game';
import { json } from '@sveltejs/kit';
import { getDatabase, type Database, type Reference, ServerValue } from 'firebase-admin/database';
import { onValue } from 'firebase/database';
import type { ChatCompletionRequestMessage } from 'openai';

const chatTime = 120;

export const amountOfPromptsPerPlayer = 2;
const chatsPerPlayer: { [playerCount: number]: number } = {
	3: 1,
	4: 2,
	5: 2,
	6: 3
};

const maxMessagesPerPlayerPerChat = 4;

const promptMessage = `The user and their good friends are playing a game online where they need to text each other and figure out if they are actually talking to each other or they are talking to an AI. You are the AI trying to deceive the user that you are the user's friend. The friend you are impersonating is described below in the brackets.

{ {prompt} }

You are this person. You know the user well. 
`;

function formatPromptMessage(prompt: string) {
	return promptMessage.replace('{prompt}', prompt);
}

export async function moveToPrompt(game: Game, database: Database) {
	if (Object.keys(game.users).length < 3)
		return json({ error: 'Not enough players' }, { status: 403 });

	const updates: { [path: string]: any } = {};
	// Initial game state
	updates[`games/${game.id}/publicState/chatsPerPlayer`] =
		chatsPerPlayer[Object.keys(game.users).length];

	updates[`games/${game.id}/publicState/prompt/allocation`] = generateRandomAllocations(
		Object.keys(game.users)
	);

	updates[`games/${game.id}/publicState/prompt/submitted`] = Object.keys(game.users).reduce(
		(acc, user) => {
			acc[user] = false;
			return acc;
		},
		{} as { [uid: string]: boolean }
	);
	updates[`games/${game.id}/publicState/phase`] = 'prompt';

	await database.ref().update(updates);
}

export async function moveToChat(game: Game, database: Database) {
	let prompts = (
		await database.ref(`games/${game.id}/privateState/prompts`).get()
	).val() as TargetedObject<string>;
	if (prompts) {
		// Validation
		if (Object.values(prompts).some((target) => Object.values(target).length < 1)) {
			return json({ error: 'Not enough prompts' }, { status: 403 });
		}

		// Create one-way chats.
		// let chats: TargetedObject<Chat> = {};
		// console.log(JSON.stringify(game.users));
		// for (let uid in game.users) {
		// console.log(uid);
		// Object.keys(game.users)
		// .filter((user) => user != uid)
		// .forEach((user) => {
		// if (!chats[uid]) chats[uid] = {};
		// chats[uid][user] = {
		// messages: {},
		// decision: false
		// };
		// });
		// }

		let chats: TargetedObject<Chat> = {};

		let selection = (
			await database.ref(`games/${game.id}/privateState/chatSelection`).get()
		).val() as ChatSelections;

		let types: TargetedObject<ChatTypes> = {};

		const updates: { [ref: string]: any } = {};

		for (const uid in game.users) {
			// Get all the users this user has selected to talk to
			let chatTargets = Object.keys(selection[uid]).filter((target) => selection[uid][target]);

			for (const target of chatTargets) {
				if (!chats[uid]) chats[uid] = {};
				chats[uid][target] = {
					messages: {},
					active: true
				};

				if (!types[uid]) types[uid] = {};
				// Are they talking back? (P2P)
				if (selection[target][uid]) {
					createP2PChatBridge(uid, target);
					types[uid][target] = 'P2P';
				} else {
					// Are they not talking back? (H2AI)
					createP2AIChatBridge(uid, target);

					types[uid][target] = 'P2AI';
				}
			}
			updates[`games/${game.id}/userState/${uid}/chats`] = chats[uid];
		}

		updates[`games/${game.id}/privateState/chatTypes`] = types;
		// Update database
		updates[`games/${game.id}/publicState/phase`] = 'chat';

		updates[`games/${game.id}/publicState/chat/timer`] = {
			startAt: ServerValue.TIMESTAMP,
			seconds: chatTime
		};

		// Auto reveal after time expires
		database.ref(`games/${game.id}/publicState/chat/timer`).once('value', (snapshot) => {
			setTimeout(() => moveToReveal(game, database), snapshot.val().seconds * 1000);
		});

		await database.ref().update(updates);
	} else {
		return json({ error: 'No prompts' }, { status: 403 });
	}

	function createP2PChatBridge(from: string, to: string) {
		let u1ToU2 = getDatabase().ref(`games/${game.id}/userState/${from}/chats/${to}/messages`);
		let u2ToU1 = getDatabase().ref(`games/${game.id}/userState/${to}/chats/${from}/messages`);

		u1ToU2.on('child_added', (snapshot) => {
			let newMessage: Message = snapshot.val();
			console.log(`from: ${from} to: ${to} `);
			if (newMessage && newMessage.uid != to) {
				u2ToU1.push(newMessage);
			}
		});
	}

	function createP2AIChatBridge(uid: string, aiUid: string) {
		let userChatRef = getDatabase().ref(
			`games/${game.id}/userState/${uid}/chats/${aiUid}/messages`
		);

		aiTurn(-1, userChatRef, uid, aiUid, game.id);
	}
}

const minimumAIDelay = 5000;
const maximumAIDelay = 12000;

async function aiTurn(
	messageNumber: number,
	userChatRef: Reference,
	uid: string,
	fakerId: string,
	gameId: string
) {
	console.log(`AI turn for User ${uid} emulating ${fakerId} with message ${messageNumber}`);
	// Delay message on first.
	if (messageNumber >= 0) {
		// Get message data from database 💾
		let messages = (await userChatRef.get()).val() as Messages;

		let descriptions = (
			await getDatabase().ref(`games/${gameId}/privateState/prompts/${fakerId}`).get()
		).val() as { [uid: string]: string };

		// Generate system message from prompts
		let prompts: string = Object.values(descriptions).join('\n');
		let systemMessage = {
			role: 'system',
			content: formatPromptMessage(prompts)
		} as ChatCompletionRequestMessage;

		// Transform messages into chat log
		let previousChat = Object.values(messages ?? {}).map((message) => {
			return {
				role: message.uid == uid ? 'user' : 'assistant',
				content: message.content
			} as ChatCompletionRequestMessage;
		});

		// Send prompt to OpenAI 🤖
		let body = {
			model: 'gpt-3.5-turbo',
			messages: [systemMessage, ...previousChat],
			max_tokens: 20
		};

		try {
			const completion = await (
				await fetch('https://api.openai.com/v1/chat/completions', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${env.OPENAI_API_KEY}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(body)
				})
			).json();

			let content = completion.choices[0].message.content;
			//const content = 'I am a chatbox';

			// Send message 💬
			userChatRef.push({ uid: fakerId, content });
		} catch (e) {
			console.error(e);
		}
	}

	if (messageNumber < maxMessagesPerPlayerPerChat) {
		// Prepare next message after delay ⏱ => 💬
		let delay = Math.floor(Math.random() * (maximumAIDelay - minimumAIDelay)) + minimumAIDelay;

		setTimeout(() => aiTurn(messageNumber + 1, userChatRef, uid, fakerId, gameId), delay);
	} else {
		// Kill 💀
	}
}

export async function moveToReveal(game: Game, database: Database) {
	let types = (await (
		await database.ref(`games/${game.id}/privateState/chatTypes`).get()
	).val()) as TargetedObject<ChatTypes>;

	// Kills all chat listeners
	for (const [uid, targets] of Object.entries(types)) {
		for (const target of Object.keys(targets)) {
			let chatRef = database.ref(`games/${game.id}/userState/${uid}/chats/${target}/messages`);
			chatRef.off();
		}
	}

	const privateGameState = (await (
		await database.ref(`games/${game.id}/privateState`).get()
	).val()) as PrivateGameState;
	const revealData: RevealData = {};

	for (const user of Object.values(game.users)) {
		const userRevealData: UserRevealData = {};

		const userState = (await (
			await database.ref(`games/${game.id}/userState/${user.uid}`).get()
		).val()) as UserGameState;

		for (const target of Object.keys(userState.chats)) {
			const userTargetRevealData: UserTargetRevealData = {
				messages: userState.chats[target],
				decision: privateGameState.decisions[user.uid][target],
				truth: privateGameState.chatTypes[user.uid][target] == 'P2AI',
				prompts: privateGameState.prompts[target]
			};

			userRevealData[target] = userTargetRevealData;
		}

		revealData[user.uid] = userRevealData;
	}
	const updates: { [path: string]: any } = {};

	updates[`games/${game.id}/publicState/reveal`] = revealData;
	updates[`games/${game.id}/publicState/phase`] = 'reveal';

	await database.ref().update(updates);
}

export function generateRandomAllocations(uids: string[]) {
	let selections: string[] = [];
	uids.forEach((uid) => {
		for (let i = 0; i < amountOfPromptsPerPlayer; i++) {
			selections.push(uid);
		}
	});

	let allocation = {} as { [uid: string]: EnumeratedObject<string> };
	let counter = 0;
	while (selections.length > 0) {
		let uid = uids[Math.floor(counter / 2)];

		if (allocation[uid] == null) allocation[uid] = {};

		let filteredSelections = selections.filter(
			(selection) =>
				selection != uid && !Object.values(allocation[uid]).some((value) => value == selection)
		);
		let index = Math.floor(Math.random() * filteredSelections.length);
		let selection = filteredSelections[index];

		allocation[uid][(counter % 2).toString()] = selection;

		selections.splice(selections.indexOf(selection), 1);

		counter++;
	}

	console.log(JSON.stringify(allocation));

	return allocation;
}
