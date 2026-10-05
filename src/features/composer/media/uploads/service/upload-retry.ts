import { ClientResponseError } from '@atcute/client';

import { shouldRetryError } from '#/lib/errors';
import { sleep } from '#/lib/utils/sleep';

// do not use isNetworkError because it includes abort errors.
function isRetryableUploadError(err: unknown): boolean {
	if (err instanceof TypeError) {
		return true;
	}
	return shouldRetryError(err) || (err instanceof ClientResponseError && err.error === 'ServiceOverloaded');
}

/**
 * checks whether an upload needs a new auth token.
 *
 * @param err thrown value
 * @returns whether authentication failed
 */
export function isAuthUploadError(err: unknown): boolean {
	return err instanceof ClientResponseError && (err.status === 401 || err.error === 'AuthRequired');
}

/**
 * calculates exponential backoff with jitter.
 *
 * @param attempt 1-based failed attempt
 * @returns delay in milliseconds
 */
export function retryDelayMs(attempt: number): number {
	const ceiling = Math.min(500 * 2 ** (attempt - 1), 8_000);
	return ceiling * (0.5 + Math.random() * 0.5);
}

/**
 * retries an upload action with backoff.
 *
 * @param options retry options
 * @returns the action result
 * @throws the signal's abort reason if `signal` aborts
 */
export async function withUploadRetry<T>({
	attempts,
	action,
	shouldRetry = isRetryableUploadError,
	signal,
	onRetry,
}: {
	attempts: number;
	action: () => Promise<T>;
	shouldRetry?: (err: unknown) => boolean;
	signal?: AbortSignal;
	onRetry?: () => void;
}): Promise<T> {
	for (let attempt = 1; ; attempt++) {
		signal?.throwIfAborted();
		try {
			return await action();
		} catch (err) {
			signal?.throwIfAborted();
			if (attempt >= attempts || !shouldRetry(err)) {
				throw err;
			}
			onRetry?.();
			await sleep(retryDelayMs(attempt), signal);
		}
	}
}
