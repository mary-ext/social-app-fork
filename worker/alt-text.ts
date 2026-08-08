import type * as v from '@atcute/lexicons/validations';
import { UpstreamFailureError } from '@atcute/xrpc-server';

import { runAltTextRound, UnreadableDraftError } from '../src/lib/ai/alt-text';
import type { altTextDraftSchema, generateAltText } from '../src/lib/lexicons';
import { createWorkersAiCompletion } from './workers-ai';

type Input = v.InferOutput<(typeof generateAltText)['input']['schema']>;
type Draft = v.InferOutput<typeof altTextDraftSchema>;

/**
 * drafts alt text, including answers from earlier rounds.
 *
 * @param input image, post context, and completed rounds
 * @returns the next draft and follow-up questions
 * @throws {UpstreamFailureError} when the model is unavailable or returns an unreadable draft
 */
export const generateAltTextDraft = async (input: Input): Promise<Draft> => {
	try {
		return await runAltTextRound({
			complete: createWorkersAiCompletion('description'),
			input,
		});
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
