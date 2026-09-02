import * as v from 'valibot';

import { type AltTextInput, runAltTextRound } from '#/lib/ai/alt-text';
import type { CompleteChat } from '#/lib/ai/chat';
import type { AiRoute } from '#/lib/ai/config';
import { createProviderError } from '#/lib/ai/error';
import { aiErrorEnvelopeSchema } from '#/lib/ai/response';
import { runTranslation, type TranslationInput } from '#/lib/ai/translate';
import { AI_FORMAT_HEADERS } from '#/lib/ai/wire/headers';
import { AI_WIRE_ADAPTERS } from '#/lib/ai/wire/registry';

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
	const { apiKey, endpoint, model, providerName, supportsTemperature } = route;

	const adapter = AI_WIRE_ADAPTERS[endpoint.format];
	const fail = createProviderError(providerName);

	return async (options) => {
		const headers: Record<string, string> = {
			'content-type': 'application/json',
			...AI_FORMAT_HEADERS[endpoint.format],
		};
		if (endpoint.auth !== undefined && apiKey !== undefined) {
			headers[endpoint.auth.header] = (endpoint.auth.prefix ?? '') + apiKey;
		}

		let response: Response;
		try {
			response = await fetch(endpoint.url, {
				method: 'POST',
				signal: signal,
				headers: headers,
				body: JSON.stringify(
					adapter.buildBody({
						...options,
						model: model,
						temperature: supportsTemperature ? options.temperature : undefined,
					}),
				),
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

		const reply = adapter.readReply(body);
		if (reply === undefined) {
			throw fail(`${providerName} returned a reply in an unexpected shape`);
		}

		return reply;
	};
};
