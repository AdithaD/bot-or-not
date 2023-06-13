import { env } from '$env/dynamic/private';
import type { Messages } from '$lib/game';
import { getDatabase, type Reference } from 'firebase-admin/database';
import log from 'loglevel';
import type { ChatCompletionRequestMessage } from 'openai';
import { maxMessagesPerPlayerPerChat } from './game';

const minimumAIDelay = 11000;
const maximumAIDelay = 21000;

const promptMessage = `The user and their good friends are playing a game online where they need to text each other and figure out if they are actually talking to each other or they are talking to an AI. You are the AI trying to deceive the user that you are the user's friend. The friend you are impersonating is described below in the brackets.

{ {prompt} }

You are this person. You know the user well. 
`;

export async function aiTurn(
	messageNumber: number,
	userChatRef: Reference,
	uid: string,
	fakerId: string,
	gameId: string
) {
	log.info(
		`GAME: ${gameId}: AI talking to User ${uid} emulating ${fakerId} with message ${messageNumber}`
	);
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
		let content: string = '';
		if (env.ACTIVE_AI && env.ACTIVE_AI == 'TRUE') {
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

				content = completion.choices[0].message.content;
				//const content = 'I am a chatbox';
			} catch (e) {
				console.error(e);
			}
		} else {
			content = 'I am a chatbox';
		}

		// Send message 💬
		userChatRef.push({ uid: fakerId, content });
	}

	if (messageNumber < maxMessagesPerPlayerPerChat) {
		// Prepare next message after delay ⏱ => 💬
		let delay = Math.floor(Math.random() * (maximumAIDelay - minimumAIDelay)) + minimumAIDelay;

		setTimeout(() => aiTurn(messageNumber + 1, userChatRef, uid, fakerId, gameId), delay);
	} else {
		// Kill 💀
	}
}

function formatPromptMessage(prompt: string) {
	return promptMessage.replace('{prompt}', prompt);
}
