import * as v from 'valibot';

import { type AltTextInput, runAltTextRound } from '#/lib/ai/alt-text';
import type { ChatCompletionOptions, CompleteChat } from '#/lib/ai/chat';
import type { AiRoute } from '#/lib/ai/config';
import { createProviderError } from '#/lib/ai/error';
import { aiErrorEnvelopeSchema } from '#/lib/ai/response';
import { runTranslation, type TranslationInput } from '#/lib/ai/translate';

const completionSchema = v.object({
	choices: v.array(
		v.object({
			message: v.object({
				content: v.optional(v.nullable(v.string())),
			}),
		}),
	),
});

/**
 * drafts image alt text with the configured AI route.
 *
 * @param options route, input, and abort signal
 * @returns the next draft and follow-up questions
 * @throws {AiProviderError} when the provider fails
 * @throws {UnreadableDraftError} when the reply is invalid
 */
export const runAiAltTextRound = ({
	input,
	route,
	signal,
}: {
	input: AltTextInput;
	route: AiRoute;
	signal: AbortSignal;
}) => {
	return runAltTextRound({ complete: createCompletion(route, signal), input: input });
};

/**
 * translates text with the configured AI route.
 *
 * @param options route, input, and abort signal
 * @returns the translation and detected source language
 * @throws {AiProviderError} when the provider fails
 * @throws {UnreadableTranslationError} when the reply is invalid
 */
export const runAiTranslation = ({
	input,
	route,
	signal,
}: {
	input: TranslationInput;
	route: AiRoute;
	signal: AbortSignal;
}) => {
	return runTranslation({ complete: createCompletion(route, signal), input: input });
};

const createCompletion = (route: AiRoute, signal: AbortSignal): CompleteChat => {
	const { apiKey, endpoint, model, providerName } = route;

	const fail = createProviderError(providerName);

	return async (options) => {
		const headers: Record<string, string> = { 'content-type': 'application/json' };
		if (endpoint.auth !== undefined && apiKey !== undefined) {
			headers[endpoint.auth.header] = (endpoint.auth.prefix ?? '') + apiKey;
		}

		let response: Response;
		try {
			response = await fetch(endpoint.url, {
				method: 'POST',
				signal: signal,
				headers: headers,
				body: JSON.stringify(buildRequest(route, options)),
			});
		} catch (error: unknown) {
			// preserve abort errors.
			if (signal.aborted) {
				throw error;
			}
			throw fail(`could not reach ${providerName}`, { cause: error });
		}

		const body: unknown = await response.json().catch(() => undefined);

		const envelope = v.safeParse(aiErrorEnvelopeSchema, body);

		if (!response.ok) {
			const detail = envelope.success ? envelope.output.error.message : undefined;
			throw fail(detail ?? `${providerName} returned ${response.status}`, { status: response.status });
		}

		// some providers return error envelopes with HTTP 200.
		if (envelope.success) {
			throw fail(envelope.output.error.message ?? `${providerName} could not run ${model}`);
		}

		const parsed = v.safeParse(completionSchema, body);
		if (!parsed.success) {
			throw fail(`${providerName} returned a reply in an unexpected shape`);
		}

		return parsed.output.choices[0]?.message.content ?? '';
	};
};

const buildRequest = (
	{ endpoint, model, supportsTemperature }: AiRoute,
	{ maxTokens, messages, responseSchema, temperature }: ChatCompletionOptions,
) => {
	return {
		[endpoint.tokenLimitField ?? 'max_tokens']: maxTokens,
		messages: messages,
		model: model,
		response_format: {
			type: 'json_schema',
			json_schema: { ...responseSchema, strict: true },
		},
		// some reasoning models reject the temperature field.
		temperature: supportsTemperature ? temperature : undefined,
	};
};
