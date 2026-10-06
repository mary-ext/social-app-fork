import { sleep } from '#/lib/utils/sleep';

/** HLS request limits by resource. */
export const MAX_ATTEMPTS = { master: 2, media: 4 };

const IDLE_TIMEOUT_MS = 5000;

/** an HTTP response error. */
export class HttpError extends Error {
	constructor(
		readonly status: number,
		url: string,
	) {
		super(`http ${status} for ${url}`);
	}
}

/** a request idle timeout. */
export class StalledError extends Error {}

/**
 * tests if an HTTP status is retryable.
 *
 * @param status HTTP status
 * @returns whether to retry
 */
export const isRetryable = (status: number) => status === 408 || status === 429 || status >= 500;

const delayFor = (failures: number) => 0.25 * 2 ** failures;

/**
 * fetches and reads a resource with bounded retries and an idle timeout.
 *
 * @param url resource URL
 * @param options retry options
 * @param read response reader; must call `received` for each body chunk
 * @returns parsed response
 * @throws {StalledError} when idle retries are exhausted
 * @throws when cancelled or a request error cannot be retried
 */
export const fetchWithRetry = async <T>(
	url: string,
	{
		attempts = MAX_ATTEMPTS.media,
		onRetry,
		signal,
	}: { attempts?: number; onRetry?: (failures: number) => void; signal: AbortSignal },
	read: (response: Response, received: () => void) => Promise<T>,
) => {
	for (let failures = 1; ; failures++) {
		const attempt = new AbortController();
		let lastReceived = performance.now();
		// avoid resetting the timer on every body chunk.
		const watch = () => {
			const quiet = performance.now() - lastReceived;
			if (quiet >= IDLE_TIMEOUT_MS) {
				attempt.abort(new StalledError(`nothing received for ${IDLE_TIMEOUT_MS / 1000}s from ${url}`));
				return;
			}
			idle = setTimeout(watch, IDLE_TIMEOUT_MS - quiet);
		};
		let idle = setTimeout(watch, IDLE_TIMEOUT_MS);

		try {
			const response = await fetch(url, { signal: AbortSignal.any([signal, attempt.signal]) });
			if (!response.ok) {
				throw new HttpError(response.status, response.url);
			}

			return await read(response, () => {
				lastReceived = performance.now();
			});
		} catch (error) {
			clearTimeout(idle);
			const fatal = error instanceof HttpError && !isRetryable(error.status);
			if (fatal || failures >= attempts || signal.aborted) {
				throw error;
			}

			onRetry?.(failures);
			await sleep(delayFor(failures) * 1000, signal);
		} finally {
			clearTimeout(idle);
		}
	}
};
