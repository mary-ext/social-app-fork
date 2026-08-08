/**
 * kept apart from the client so callers can recognise and classify a failure without pulling the request code
 * into their bundle. the composer imports this statically to name a failure, and reaches the client itself
 * only through the dynamic import that runs a round.
 */

import { ClientResponseError } from '@atcute/client';

import { m } from '#/paraglide/messages';

/** a call to OpenRouter that came back as anything other than a usable completion. */
export class OpenRouterError extends Error {
	/** the HTTP status, absent when the request never got a response. */
	readonly status: number | undefined;

	constructor(message: string, options?: { cause?: unknown; status?: number }) {
		super(message, { cause: options?.cause });
		this.name = 'OpenRouterError';
		this.status = options?.status;
	}
}

const describeOpenRouterError = (error: OpenRouterError): string => {
	switch (error.status) {
		case 401:
		case 403: {
			return m['lib.ai.openRouter.error.key']();
		}
		case 402: {
			return m['lib.ai.openRouter.error.credits']();
		}
		case 429: {
			return m['lib.ai.openRouter.error.rateLimited']();
		}
		default: {
			return m['lib.ai.openRouter.error.unavailable']();
		}
	}
};

/**
 * returns a user-facing AI error.
 *
 * @param options error and fallback messages
 * @returns the error message
 */
export const describeAiFailure = ({
	error,
	rateLimited,
	unavailable,
}: {
	error: unknown;
	rateLimited: () => string;
	unavailable: () => string;
}): string => {
	if (error instanceof OpenRouterError) {
		return describeOpenRouterError(error);
	}

	if (error instanceof ClientResponseError && error.status === 429) {
		return rateLimited();
	}

	return unavailable();
};
