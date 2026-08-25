import * as v from 'valibot';

import { type AltTextInput, runAltTextRound } from '#/lib/ai/alt-text';
import type { CompleteChat } from '#/lib/ai/chat';
import { OpenRouterError } from '#/lib/ai/openrouter-error';
import { openRouterErrorSchema } from '#/lib/ai/openrouter-response';
import { runTranslation, type TranslationInput } from '#/lib/ai/translate';

/**
 * runs chat completions against the user's own OpenRouter account, straight from the browser — their key
 * never leaves the device, and nothing routes through our worker.
 *
 * import this lazily: it is only reachable once a key has been configured, and it drags in the prompt module
 * behind it.
 */

const COMPLETIONS_URL = 'https://openrouter.ai/api/v1/chat/completions';

const completionSchema = v.object({
	choices: v.array(
		v.object({
			message: v.object({
				content: v.optional(v.nullable(v.string())),
			}),
		}),
	),
});

export type OpenRouterConfig = {
	apiKey: string;
	/** an OpenRouter model slug, e.g. `google/gemini-2.5-flash`. */
	model: string;
};

/**
 * Drafts alt text for an image against the user's own OpenRouter account.
 *
 * @param options the account's key and model, the image and post to describe, and a signal that aborts the
 *   request
 * @returns the next draft and the questions that would sharpen it
 * @throws {OpenRouterError} if OpenRouter is unreachable, rejects the request, or fails the generation
 * @throws {UnreadableDraftError} if the model's reply can't be read as a draft
 */
export const runOpenRouterAltTextRound = ({
	input,
	signal,
	...config
}: OpenRouterConfig & { input: AltTextInput; signal: AbortSignal }) => {
	return runAltTextRound({
		complete: createOpenRouterCompletion({ ...config, signal: signal }),
		input: input,
	});
};

/**
 * translates text with the configured OpenRouter model.
 *
 * @param options request configuration and translation input
 * @returns the translation and detected source language
 * @throws {OpenRouterError} when OpenRouter fails
 * @throws {UnreadableTranslationError} when the reply is invalid
 */
export const runOpenRouterTranslation = ({
	input,
	signal,
	...config
}: OpenRouterConfig & { input: TranslationInput; signal: AbortSignal }) => {
	return runTranslation({
		complete: createOpenRouterCompletion({ ...config, signal: signal }),
		input: input,
	});
};

/**
 * Builds a chat transport bound to one OpenRouter account and model.
 *
 * @param options the account's key, the model to run, and a signal that aborts the request
 * @returns a transport that runs a single completion and returns the reply text
 */
const createOpenRouterCompletion = ({
	apiKey,
	model,
	signal,
}: OpenRouterConfig & { signal: AbortSignal }): CompleteChat => {
	return async ({ maxTokens, messages, responseSchema, temperature }) => {
		let response: Response;
		try {
			response = await fetch(COMPLETIONS_URL, {
				method: 'POST',
				signal: signal,
				headers: {
					authorization: `Bearer ${apiKey}`,
					'content-type': 'application/json',
				},
				body: JSON.stringify({
					max_tokens: maxTokens,
					messages: messages,
					model: model,
					temperature: temperature,
					// OpenRouter drops parameters the chosen model can't honour, so this is a request rather than a
					// guarantee on every model — the caller parses defensively either way
					response_format: {
						type: 'json_schema',
						json_schema: { ...responseSchema, strict: true },
					},
				}),
			});
		} catch (error: unknown) {
			// an abort is the caller's own doing and has to stay recognisable as one
			if (signal.aborted) {
				throw error;
			}
			throw new OpenRouterError('could not reach OpenRouter', { cause: error });
		}

		const body: unknown = await response.json().catch(() => undefined);

		const failure = v.safeParse(openRouterErrorSchema, body);

		if (!response.ok) {
			const detail = failure.success ? failure.output.error.message : undefined;
			throw new OpenRouterError(detail ?? `OpenRouter returned ${response.status}`, {
				status: response.status,
			});
		}

		// a 200 carrying an error envelope means the request was accepted and the generation still failed
		if (failure.success) {
			throw new OpenRouterError(failure.output.error.message ?? 'OpenRouter could not run the model');
		}

		const parsed = v.safeParse(completionSchema, body);
		if (!parsed.success) {
			throw new OpenRouterError('OpenRouter returned a reply in an unexpected shape');
		}

		return parsed.output.choices[0]?.message.content ?? '';
	};
};
