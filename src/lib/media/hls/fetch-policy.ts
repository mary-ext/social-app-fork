import { timeout } from '#/lib/async/timeout';
import { toVideoCdnUrl } from '#/lib/bsky/video';

/** request attempt limits by resource type. */
export const MAX_ATTEMPTS = { master: 2, media: 4 };

const FAILURE_MEMORY_MS = 15_000;

/** an unsuccessful HTTP response. */
export class HttpError extends Error {
	constructor(
		readonly status: number,
		url: string,
	) {
		super(`http ${status} for ${url}`);
	}
}

/**
 * checks whether an HTTP status can succeed on retry.
 *
 * @param status HTTP status
 * @returns whether the request can be retried
 */
export const isRetryable = (status: number) => status === 408 || status === 429 || status >= 500;

// UrlSource retries rejected fetches, not unsuccessful responses.
const fetchOrThrow: typeof fetch = async (input, init) => {
	const response = await fetch(input, init);
	if (!response.ok) {
		throw new HttpError(response.status, response.url);
	}
	return response;
};

const urlOf = (url: string | URL | Request) => {
	if (typeof url === 'string') {
		return url;
	}
	return url instanceof URL ? url.href : url.url;
};

const retargetingFetch =
	(fetchFn: typeof fetch, retarget: (url: string) => string): typeof fetch =>
	(input, init) =>
		fetchFn(retarget(urlOf(input)), init);

const countingFetch =
	(onBytes: (bytes: number) => void): typeof fetch =>
	async (input, init) => {
		const response = await fetchOrThrow(input, init);
		if (!response.body) {
			return response;
		}
		const counted = response.body.pipeThrough(
			new TransformStream<Uint8Array, Uint8Array>({
				transform(chunk, controller) {
					onBytes(chunk.byteLength);
					controller.enqueue(chunk);
				},
			}),
		);
		// preserve URL metadata used to resolve relative playlist paths.
		return new Proxy(response, {
			get: (target, property) => {
				if (property === 'body') {
					return counted;
				}
				const value = Reflect.get(target, property) as unknown;
				return typeof value === 'function' ? value.bind(target) : value;
			},
		});
	};

const delayFor = (failures: number) => 0.25 * 2 ** failures;

export type RetryPolicy = {
	fetchFn: typeof fetch;
	getRetryDelay: (previousAttempts: number, error: unknown, url: string | URL | Request) => number | null;
};

/**
 * creates bounded retry hooks for a mediabunny URL source.
 *
 * @param master master playlist url
 * @param onRetry retry listener
 * @param onBytes response progress listener
 * @returns fetch and retry hooks
 */
export const createRetryPolicy = ({
	master,
	onRetry,
	onBytes,
}: {
	master: string;
	onRetry: (failures: number, url: string) => void;
	onBytes: (bytes: number) => void;
}): RetryPolicy => {
	// UrlSource resets `previousAttempts` when a partial response resumes.
	const failures = new Map<string, { count: number; at: number }>();

	const countFailure = (url: string) => {
		const now = Date.now();
		for (const [key, entry] of failures) {
			if (now - entry.at > FAILURE_MEMORY_MS) {
				failures.delete(key);
			}
		}
		const previous = failures.get(url);
		const count = previous ? previous.count + 1 : 1;
		failures.set(url, { count, at: now });
		return count;
	};

	// keep the master on the video service because the CDN copy omits subtitles.
	return {
		fetchFn: retargetingFetch(countingFetch(onBytes), (url) => (url === master ? url : toVideoCdnUrl(url))),
		getRetryDelay: (_previousAttempts, error, url) => {
			const href = urlOf(url);
			if (error instanceof HttpError && !isRetryable(error.status)) {
				return null;
			}
			const count = countFailure(href);
			if (count >= (href === master ? MAX_ATTEMPTS.master : MAX_ATTEMPTS.media)) {
				return null;
			}
			onRetry(count, href);
			return delayFor(count);
		},
	};
};

/**
 * fetches text with bounded retries.
 *
 * @param url resource url
 * @param attempts maximum attempts
 * @param signal abort signal
 * @returns response text
 * @throws after the attempt limit or when aborted
 */
export const fetchTextWithRetry = async (
	url: string,
	{ attempts = MAX_ATTEMPTS.media, signal }: { attempts?: number; signal: AbortSignal },
) => {
	for (let failures = 1; ; failures++) {
		try {
			return await (await fetchOrThrow(url, { signal })).text();
		} catch (error) {
			const fatal = error instanceof HttpError && !isRetryable(error.status);
			if (fatal || failures >= attempts || signal.aborted) {
				throw error;
			}
			await timeout(delayFor(failures) * 1000);
		}
	}
};
