import { env } from 'cloudflare:workers';

import { UpstreamFailureError } from '@atcute/xrpc-server';

import type { CompleteChat } from '../src/lib/ai/chat';
import { toOpenaiChatMessages } from '../src/lib/ai/wire/openai-messages';

const MODEL = '@cf/zai-org/glm-5.3-flash';

/**
 * creates a Workers AI chat transport.
 *
 * @param feature feature name for errors
 * @returns the chat transport
 */
export const createWorkersAiCompletion = (feature: 'description' | 'translation'): CompleteChat => {
	return async ({ maxTokens, messages, responseSchema, temperature }) => {
		let result: ChatCompletionsOutput;

		try {
			result = await env.AI.run(MODEL, {
				// thinking can produce unparseable output.
				chat_template_kwargs: { enable_thinking: false },
				max_tokens: maxTokens,
				temperature: temperature,
				messages: toOpenaiChatMessages(messages),
				response_format: {
					type: 'json_schema',
					json_schema: { ...responseSchema, strict: true },
				},
			});
		} catch (error: unknown) {
			// keep upstream error pages out of the response body.
			console.error(`${feature} model call failed:`, error);

			throw new UpstreamFailureError({
				error: 'ModelUnavailable',
				message: `the ${feature} model could not be reached`,
			});
		}

		return result.choices[0]?.message.content ?? '';
	};
};
