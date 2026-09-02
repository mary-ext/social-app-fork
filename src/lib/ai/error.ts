import { ClientResponseError } from '@atcute/client';

import { m } from '#/paraglide/messages';

/** an AI provider request failure. */
export class AiProviderError extends Error {
	/** provider display name. */
	readonly providerName: string;
	/** HTTP status, if available. */
	readonly status: number | undefined;

	constructor(message: string, options: { cause?: unknown; providerName: string; status?: number }) {
		super(message, { cause: options.cause });
		this.name = 'AiProviderError';
		this.providerName = options.providerName;
		this.status = options.status;
	}
}

/**
 * creates errors for one provider.
 *
 * @param providerName provider display name
 * @returns a provider-bound error factory
 */
export const createProviderError = (providerName: string) => {
	return (message: string, options?: { cause?: unknown; status?: number }): AiProviderError => {
		return new AiProviderError(message, { ...options, providerName: providerName });
	};
};

const describeProviderError = (error: AiProviderError): string => {
	const name = { name: error.providerName };

	switch (error.status) {
		case 401:
		case 403: {
			return m['lib.ai.provider.error.key'](name);
		}
		case 402: {
			return m['lib.ai.provider.error.credits'](name);
		}
		case 429: {
			return m['lib.ai.provider.error.rateLimited'](name);
		}
		default: {
			return m['lib.ai.provider.error.unavailable'](name);
		}
	}
};

/**
 * describes an AI failure for the user.
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
	if (error instanceof AiProviderError) {
		return describeProviderError(error);
	}

	if (error instanceof ClientResponseError && error.status === 429) {
		return rateLimited();
	}

	return unavailable();
};
