import type { ChatCompletionOptions } from '../chat';

export type AiWireRequest = Omit<ChatCompletionOptions, 'temperature'> & {
	model: string;
	/** absent when the model rejects the field. */
	temperature: number | undefined;
};

export type AiWireAdapter = {
	/**
	 * @param request completion request
	 * @returns JSON request body
	 */
	buildBody: (request: AiWireRequest) => Record<string, unknown>;
	/**
	 * @param body response body
	 * @returns reply text, or `undefined` for an invalid body
	 */
	readReply: (body: unknown) => string | undefined;
};
