export type ChatContentPart =
	| { type: 'image_url'; image_url: { url: string } }
	| { type: 'text'; text: string };

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
