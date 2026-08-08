import type * as v from '@atcute/lexicons/validations';
import { UpstreamFailureError } from '@atcute/xrpc-server';

import { runTranslation, UnreadableTranslationError } from '../src/lib/ai/translate';
import type { translateText, translationSchema } from '../src/lib/lexicons';
import { createWorkersAiCompletion } from './workers-ai';

type Input = v.InferOutput<(typeof translateText)['input']['schema']>;
type Translation = v.InferOutput<typeof translationSchema>;

/**
 * translates post text.
 *
 * @param input text and target language
 * @returns the translation and detected source language
 * @throws {UpstreamFailureError} when the model call or reply fails
 */
export const translatePostText = async (input: Input): Promise<Translation> => {
	try {
		return await runTranslation({
			complete: createWorkersAiCompletion('translation'),
			input,
		});
	} catch (error: unknown) {
		if (error instanceof UnreadableTranslationError) {
			throw new UpstreamFailureError({
				error: 'UnreadableResponse',
				message: error.message,
			});
		}
		throw error;
	}
};
