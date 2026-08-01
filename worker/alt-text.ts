import { env } from 'cloudflare:workers';

import type * as v from '@atcute/lexicons/validations';
import { UpstreamFailureError } from '@atcute/xrpc-server';

import { runAltTextRound, UnreadableDraftError } from '../src/lib/ai/alt-text';
import type { CompleteChat } from '../src/lib/ai/chat';
import type { altTextDraftSchema, generateAltText } from '../src/lib/lexicons/internal-app';

type Input = v.InferOutput<(typeof generateAltText)['input']['schema']>;
type Draft = v.InferOutput<typeof altTextDraftSchema>;

const MODEL = '@cf/google/gemma-4-26b-a4b-it';

/**
 * drafts alt text, including answers from earlier rounds.
 *
 * @param input image, post context, and completed rounds
 * @returns the next draft and follow-up questions
 * @throws {UpstreamFailureError} when the model is unavailable or returns an unreadable draft
 */
export const generateAltTextDraft = async (input: Input): Promise<Draft> => {
	try {
		return await runAltTextRound({ complete: runModel, input });
	} catch (error: unknown) {
		if (error instanceof UnreadableDraftError) {
			throw new UpstreamFailureError({
				error: 'UnreadableResponse',
				message: error.message,
			});
		}
		throw error;
	}
};

const runModel: CompleteChat = async ({ maxTokens, messages, responseSchema, temperature }) => {
	let result: ChatCompletionsOutput;

	try {
		result = await env.AI.run(MODEL, {
			chat_template_kwargs: { enable_thinking: false },
			max_tokens: maxTokens,
			temperature: temperature,
			messages: messages,
			response_format: {
				type: 'json_schema',
				json_schema: { ...responseSchema, strict: true },
			},
		});
	} catch (error: unknown) {
		// keep upstream error pages out of the response body.
		console.error('alt text model call failed:', error);

		throw new UpstreamFailureError({
			error: 'ModelUnavailable',
			message: 'the description model could not be reached',
		});
	}

	return result.choices[0]?.message.content ?? '';
};
