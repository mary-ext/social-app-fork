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
 * Drafts alt text for an image, folding in the answers from any earlier rounds.
 *
 * @param input the image, the post it belongs to, and every completed round so far
 * @returns the next draft and the questions that would sharpen it
 * @throws {UpstreamFailureError} if the model call fails or its reply can't be read as a draft
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
		// the binding reports an upstream failure as whatever the edge sent back, which for a gateway timeout is
		// an entire html error page — that belongs in the log, not in our response body
		console.error('alt text model call failed:', error);

		throw new UpstreamFailureError({
			error: 'ModelUnavailable',
			message: 'the description model could not be reached',
		});
	}

	return result.choices[0]?.message.content ?? '';
};
