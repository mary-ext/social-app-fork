export type ChatImagePart = { type: 'image'; data: string; mimeType: string };

export type ChatContentPart = ChatImagePart | { type: 'text'; text: string };

/**
 * @param part image data
 * @returns a base64 data URL
 */
export const toImageDataUrl = ({ data, mimeType }: ChatImagePart): string => {
	return `data:${mimeType};base64,${data}`;
};

export type ChatMessage =
	| { role: 'assistant'; content: string }
	| { role: 'system'; content: string }
	| { role: 'user'; content: ChatContentPart[] | string };

export type ChatResponseSchema = {
	name: string;
	schema: Record<string, unknown>;
};

export type ChatCompletionOptions = {
	maxTokens: number;
	messages: ChatMessage[];
	responseSchema: ChatResponseSchema;
	temperature: number;
};

export type CompleteChat = (options: ChatCompletionOptions) => Promise<string>;
