import { v4 as uuidv4 } from 'uuid';

export type TargetedObject<T> = { [uid: string]: { [targetUid: string]: T } };
export type EnumeratedObject<T> = { [_: string]: T };

export type JoinRequestBody = {
	gameId: string;
	user: User;
};
export type Game = {
	id: string;
	owner: string | null;
	users: { [uid: string]: User };

	publicState: PublicGameState;
	userState: { [uid: string]: UserGameState };
	privateState: PrivateGameState;
};

export type User = {
	uid: string;
	username: string;
};
export type Phase = 'lobby' | 'prompt' | 'select' | 'chat' | 'reveal' | 'results';
export const phaseOrdering = ['lobby', 'prompt', 'select', 'chat', 'reveal', 'results'];
export type PublicGameState = {
	round: number;
	phase: Phase;
	lobby?: LobbyData;
	prompt?: PromptData;
	select?: SelectData;
	chat?: ChatData;
};
export type Prompt = {
	creatorUid: string;
	content: string;
};

export type ChatSelections = {
	[uid: string]: { [targetUid: string]: boolean };
};

export type ChatTypes = 'P2P' | 'P2AI';

export type PrivateGameState = {
	prompts: TargetedObject<string>;
	chatSelection: ChatSelections;
	chatTypes: TargetedObject<ChatTypes>;
	decisions: TargetedObject<boolean>;
};

export type UserGameState = {
	chats: { [targetUid: string]: Messages };
};

export type Message = { uid: string; content: string };

export type Messages = EnumeratedObject<Message>;

export type LobbyData = {
	messages: Messages;
};

export type PromptData = {
	/**
	 * Who will be give prompts for who
	 */
	allocation: { [uid: string]: EnumeratedObject<string> };

	/**
	 * Have all the prompts for a user been submitted
	 */
	submitted: { [uid: string]: boolean };
};

export type Chat = {
	messages: Messages;
	decision?: boolean;
	active: boolean;
};

export type ChatData = {
	chats: TargetedObject<Chat>;
};

export type SelectData = {
	selected: { [uid: string]: boolean };
};

export type RevealData = { [uid: string]: UserRevealData };
export type UserRevealData = {
	[targetId: string]: UserTargetRevealData;
};
export type UserTargetRevealData = {
	messages: { messages: Messages };
	decision: boolean;
	truth: boolean;
	prompts: { [creatorId: string]: string };
};
export function createNewGame(): Game {
	let id = uuidv4();

	return {
		id,
		users: {},
		owner: null,
		publicState: {
			round: 0,
			phase: 'lobby',
			lobby: {
				messages: {}
			}
		},
		privateState: { prompts: {}, chatSelection: {}, chatTypes: {}, decisions: {} },
		userState: {}
	};
}
