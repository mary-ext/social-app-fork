// shared with worker code; dependencies must remain worker-compatible.
import { type ChatContentPart, type ChatMessage, toImageDataUrl } from '../chat';

type OpenaiChatContentPart =
	| { type: 'image_url'; image_url: { url: string } }
	| { type: 'text'; text: string };

type OpenaiChatMessage =
	| { role: 'assistant'; content: string }
	| { role: 'system'; content: string }
	| { role: 'user'; content: OpenaiChatContentPart[] | string };

/**
 * @param messages chat messages
 * @returns Chat Completions messages
 */
export const toOpenaiChatMessages = (messages: ChatMessage[]): OpenaiChatMessage[] => {
	return messages.map(toMessage);
};

const toMessage = (message: ChatMessage): OpenaiChatMessage => {
	if (message.role !== 'user') {
		return message;
	}

	const { content } = message;
	return {
		role: 'user',
		content: typeof content === 'string' ? content : content.map(toContentPart),
	};
};

const toContentPart = (part: ChatContentPart): OpenaiChatContentPart => {
	switch (part.type) {
		case 'image': {
			return { type: 'image_url', image_url: { url: toImageDataUrl(part) } };
		}
		case 'text': {
			return { type: 'text', text: part.text };
		}
	}
};
