import { sleep } from '#/lib/utils/sleep';

/** HLS request limits by resource. */
export const MAX_ATTEMPTS = { master: 2, media: 4 };

/** an HTTP response error. */
export class HttpError extends Error {
	constructor(
		readonly status: number,
		url: string,
	) {
		super(`http ${status} for ${url}`);
	}
}

/**
 * tests if an HTTP status is retryable.
 *
 * @param status HTTP status
 * @returns whether to retry
 */
export const isRetryable = (status: number) => status === 408 || status === 429 || status >= 500;

const delayFor = (failures: number) => 0.25 * 2 ** failures;

/**
 * fetches and reads a resource with bounded retries.
 *
 * @param url resource URL
 * @param options retry options
 * @param read response reader
 * @returns parsed response
 * @throws when the request cannot be retried
 */
export const fetchWithRetry = async <T>(
	url: string,
	{
		attempts = MAX_ATTEMPTS.media,
		onRetry,
		signal,
	}: { attempts?: number; onRetry?: (failures: number) => void; signal: AbortSignal },
	read: (response: Response) => Promise<T>,
) => {
	for (let failures = 1; ; failures++) {
		try {
			const response = await fetch(url, { signal });
			if (!response.ok) {
				throw new HttpError(response.status, response.url);
			}

			return await read(response);
		} catch (error) {
			const fatal = error instanceof HttpError && !isRetryable(error.status);
			if (fatal || failures >= attempts || signal.aborted) {
				throw error;
			}

			onRetry?.(failures);
			await sleep(delayFor(failures) * 1000);
		}
	}
};
