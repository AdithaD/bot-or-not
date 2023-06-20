import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { Reference } from 'firebase-admin/database';
import log from 'loglevel';
import { ChatCompletionRequestMessage } from 'openai';
import admin_key from '../secrets/admin_key.json';
import type { Message } from '../src/lib/game';
log.setDefaultLevel(log.levels.TRACE);
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const { MAX_TOKENS, ACTIVE_AI, OPENAI_API_KEY, PUBLIC_MAX_MESSAGES } = process.env;

var maxMessagesPerPlayerPerChat = parseInt(PUBLIC_MAX_MESSAGES ?? '4') ?? 4;
log.debug(`Max messages per player per chat: ${maxMessagesPerPlayerPerChat}`);

//
const tickRate = 1000;

var app: App | null = null;
try {
	log.info('🔥 Initializing Firebase SDK on Server');
	app = admin.initializeApp({
		credential: admin.credential.cert(admin_key as any),
		databaseURL: 'https://bot-or-not-f60ab-default-rtdb.firebaseio.com'
	});
} catch (e) {
	console.log(e);
}

const database = admin.database();
const activeGameIds = new Set<string>();
const chatGames: { [gameId: string]: ChatGame } = {};

export type ChatGame = {
	// A map of which users are talking to which robot substitution of the other user. user => fake
	chats: Chat[];

	timer?: { seconds: number; startAt: number };
};

const promptMessage = `The user and their good friends are playing a game online where they need to text each other and figure out if they are actually talking to each other or they are talking to an AI. You are the AI trying to deceive the user that you are the user's friend. The friend you are impersonating is described below in the brackets.

{ {prompt} }

You are this person. You know the user well. If they don't respond to you, act concerned and annoyed. 
`;

const DEFAULT_MAX_TOKENS = 25;

const maxTimeBetweenBotMessages = 20000;
const minimumTimeBetweenBotMessages = 10000;
const scheduledMessageReactionTime = 2000;
const minimumResponseTimeToUserMessage = 5000;

type RecordedMessage = { content: string; time: number; isUser: boolean };
export class Chat {
	gameId: string;
	uid: string;
	fakerUid: string;
	lastBotMessageTime: number;
	timeOfLastUserMessage: number;
	amountOfBotMessages: number;
	messages: RecordedMessage[];

	timer?: { seconds: number; startAt: number };

	prompts: string[];

	userChatRef: Reference;

	enabled: boolean = false;
	tickCount: number = 0;

	lastConsideredMessage = 0;

	nextMessage?: { time: number; messageRange: number };

	private constructor(gameId: string, uid: string, fakerUid: string, prompts: string[]) {
		this.gameId = gameId;
		this.uid = uid;
		this.fakerUid = fakerUid;
		this.prompts = prompts;

		this.lastBotMessageTime = Date.now();
		this.timeOfLastUserMessage = Date.now();
		this.amountOfBotMessages = 0;
		this.messages = [];

		this.userChatRef = database.ref(`games/${gameId}/userState/${uid}/chats/${fakerUid}/messages`);

		this.userChatRef.on('child_added', (snapshot) => {
			let message = snapshot.val() as Message;

			if (message.uid == this.uid) {
				this.logUserMessage(message.content);
			}
		});

		database.ref(`games/${gameId}/publicState/chat/timer`).on('value', (snapshot) => {
			let timer = snapshot.val();
			if (timer) {
				log.debug(`Setting timer for ${this.uid} to ${timer.seconds}`);
				this.timer = timer;
				this.enabled = true;
			} else {
				this.enabled = false;
			}
		});
	}

	static async createChat(gameId: string, uid: string, fakerUid: string) {
		try {
			let prompts = (
				await database.ref(`games/${gameId}/privateState/prompts/${fakerUid}`).get()
			).val() as { [uid: string]: string };
			return new Chat(gameId, uid, fakerUid, Object.values(prompts));
		} catch (e) {
			log.error("Couldn't create chat", e);

			throw e;
		}
	}

	async tick() {
		if (this.enabled && this.amountOfBotMessages < maxMessagesPerPlayerPerChat) {
			// Send scheduled message
			if (this.nextMessage) {
				if (Date.now() >= this.nextMessage.time) {
					log.debug(`${this.tickCount}: Sending scheduled message at ${Date.now()} to ${this.uid}`);
					let slice = this.messages
						.sort((a, b) => a.time - b.time)
						.slice(0, this.nextMessage.messageRange);

					console.log(slice);

					this.generateMessage(slice).then((content) => {
						this.sendMessage(content);
						this.messages.push({ content, time: Date.now(), isUser: false });
					});
					this.nextMessage = undefined;
				}
			}

			if (!this.nextMessage) {
				// Schedule a message
				let nextTime =
					Math.random() * (maxTimeBetweenBotMessages - minimumTimeBetweenBotMessages) +
					minimumTimeBetweenBotMessages +
					Date.now();

				this.nextMessage = { time: nextTime, messageRange: this.messages.length };

				log.debug(
					`${this.tickCount}: Scheduling message for ${this.uid} at ${
						this.nextMessage.time
					} which is now + ${this.nextMessage.time - Date.now()}`
				);
			}

			this.tickCount++;
		}
	}

	logUserMessage(content: string) {
		this.messages.push({ content, time: Date.now(), isUser: true });
		this.timeOfLastUserMessage = Date.now();
		log.info(`User ${this.uid} sent message ${content}`);

		// If the bot has a message scheduled, and the time of the last user message + the reaction time is after, delay the bot message
		if (this.nextMessage) {
			if (
				isTimeAfter(
					this.nextMessage.time,
					this.timeOfLastUserMessage + scheduledMessageReactionTime
				)
			) {
				log.debug('Delaying bot message');
				// Delay the bot message by either the time of the last user message + the reaction time, or the time of the next message, whichever is later
				this.nextMessage.time = Math.max(
					this.timeOfLastUserMessage + minimumResponseTimeToUserMessage,
					this.nextMessage.time
				);
				// Incorporate the latest user message into the context
				this.nextMessage.messageRange = this.messages.length;
			}
		}
	}

	sendMessage(content: string) {
		log.debug(`Sending message ${content} to ${this.uid}`);
		this.userChatRef.push({ uid: this.fakerUid, content });
		this.amountOfBotMessages++;
	}

	async generateMessage(context: RecordedMessage[]): Promise<string> {
		// Generate system message from prompts
		let systemMessage = {
			role: 'system',
			content: this.formatPromptMessage(this.prompts.join('\n'))
		} as ChatCompletionRequestMessage;

		// Transform messages into chat log
		let previousChat = context.map((message) => {
			return {
				role: message.isUser ? 'user' : 'assistant',
				content: message.content
			} as ChatCompletionRequestMessage;
		});

		// Send prompt to OpenAI 🤖
		let body = {
			model: 'gpt-3.5-turbo',
			messages: [systemMessage, ...previousChat],
			max_tokens: MAX_TOKENS ? parseInt(MAX_TOKENS) ?? DEFAULT_MAX_TOKENS : DEFAULT_MAX_TOKENS
		};
		let content: string = '';
		if (ACTIVE_AI && ACTIVE_AI == 'TRUE') {
			try {
				await fetch('https://api.openai.com/v1/chat/completions', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${OPENAI_API_KEY}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(body)
				})
					.then(async (res) => {
						let resBody = await res.json();
						content = resBody.choices[0].message.content;
						return body;
					})
					.catch((e) => {
						console.error(e);
					});

				//const content = 'I am a chatbox';
			} catch (e) {
				console.error(e);
			}
		} else {
			content = 'I am a chatbox';
		}

		// Send message 💬
		return content;
	}

	formatPromptMessage(prompt: string) {
		return promptMessage.replace('{prompt}', prompt);
	}
}

if (app) {
	log.info('🔥 Firebase SDK Initialized');
} else {
	throw new Error('Firebase SDK Failed to Initialize');
}

// Listen to active game
database.ref('active').on('child_added', (snapshot) => {
	const newGameId = snapshot.key;
	if (newGameId) {
		log.info(`New game ${newGameId} added to active games`);
		activeGameIds.add(newGameId);

		subscribeToGame(newGameId);
	}
});

database.ref('active').on('child_removed', (snapshot) => {
	const removedGameId = snapshot.key;
	if (removedGameId) {
		log.info(`Game ${removedGameId} removed from active games`);
		delete chatGames[removedGameId];
		activeGameIds.delete(removedGameId);
	}
});
/// const timeLeft = timer.seconds * 1000 - (Date.now() - timer.startAt - serverTimeOffset);
async function subscribeToGame(newGameId: string) {
	chatGames[newGameId] = {
		chats: []
	};

	database.ref(`games/${newGameId}/privateState/chatTypes`).on('value', async (snapshot) => {
		log.debug(`Chat types updated for game ${newGameId}`);
		const chatTypes = snapshot.val() as { [uid: string]: { [target: string]: 'P2P' | 'P2AI' } };
		if (chatTypes) {
			for (const [uid, targets] of Object.entries(chatTypes)) {
				for (const [target, type] of Object.entries(targets)) {
					if (type === 'P2AI') {
						log.debug(`Creating chat for ${uid} and ${target}`);
						chatGames[newGameId].chats.push(await Chat.createChat(newGameId, uid, target));
					}
				}
			}
		}
	});
}

function isTimeBetween(time: number, start: number, end: number) {
	return time >= start && time <= end;
}

function isTimeBefore(time: number, end: number) {
	return time <= end;
}

function isTimeAfter(time: number, start: number) {
	return time >= start;
}

async function tick() {
	for (const gameId in chatGames) {
		const game = chatGames[gameId];
		game.chats.forEach((chat) => chat.tick());
	}
	setTimeout(() => tick(), tickRate);
}

tick();
