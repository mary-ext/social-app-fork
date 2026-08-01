import { InvalidRequestError, UpstreamFailureError, UpstreamTimeoutError } from '@atcute/xrpc-server';

const USER_AGENT =
	'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; social-app-fork link-card generator; +https://bsky.kelinci.net) Chrome/140.0.0.0 Safari/537.36';

/**
 * parses a URL, keeping only plain HTTP(S) requests.
 *
 * @param raw the URL to parse, absolute or relative to `base`
 * @param base the URL `raw` resolves against when it is relative
 * @returns the parsed URL, or undefined when it is malformed or uses an unsupported scheme
 */
export const parseHttpUrl = (raw: string, base?: URL): URL | undefined => {
	const url = URL.parse(raw, base?.href);
	return url?.protocol === 'http:' || url?.protocol === 'https:' ? url : undefined;
};

/**
 * validates an HTTP(S) URL. Cloudflare's public-fetch proxy handles host-level SSRF filtering.
 *
 * @param raw the URL to validate
 * @returns the parsed URL
 * @throws {InvalidRequestError} when the URL is malformed or uses an unsupported scheme
 */
export const assertHttpUrl = (raw: string): URL => {
	const url = parseHttpUrl(raw);
	if (!url) {
		// re-parsing costs nothing on a path that already failed, and keeps the two messages distinct
		throw new InvalidRequestError({
			message: URL.parse(raw) ? 'unsupported url scheme' : 'invalid url',
		});
	}
	return url;
};

/** extracts the bare MIME type from a response's `content-type`, lowercased and without parameters. */
export const contentTypeOf = (response: Response): string => {
	const header = response.headers.get('content-type') ?? '';
	const semi = header.indexOf(';');
	return (semi === -1 ? header : header.slice(0, semi)).trim().toLowerCase();
};

export interface SafeFetchOptions {
	accept: string;
	/** how many redirects to follow. defaults to {@link MAX_REDIRECTS}; pass 0 to take the first response. */
	maxRedirects?: number;
	signal: AbortSignal;
	timeoutMs: number;
}

/** how many redirects {@link safeFetch} follows before it stops and returns the last hop it reached. */
const MAX_REDIRECTS = 5;

export interface SafeFetchResult {
	/** every URL visited, starting with the requested one and ending with {@link url}. */
	chain: URL[];
	response: Response;
	/** the final URL after following redirects. */
	url: URL;
}

/**
 * fetches a public URL with a timeout and tracks redirects manually.
 *
 * @throws {UpstreamTimeoutError} when the request exceeds `timeoutMs`
 * @throws {UpstreamFailureError} when the upstream is unreachable
 */
export const safeFetch = async (url: URL, options: SafeFetchOptions): Promise<SafeFetchResult> => {
	const signal = AbortSignal.any([options.signal, AbortSignal.timeout(options.timeoutMs)]);
	const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
	let current = url;
	const chain: URL[] = [current];

	// retain intermediate hops for short links that pass through bot interstitials.
	for (;;) {
		let response: Response;
		try {
			response = await fetch(current, {
				headers: {
					accept: options.accept,
					'accept-language': 'en;q=0.9',
					'user-agent': USER_AGENT,
				},
				method: 'GET',
				redirect: 'manual',
				signal,
			});
		} catch {
			if (signal.aborted) {
				throw new UpstreamTimeoutError({ message: 'upstream timed out' });
			}
			throw new UpstreamFailureError({ message: 'failed to reach upstream' });
		}

		const location =
			response.status >= 300 && response.status < 400 ? response.headers.get('location') : null;
		if (!location || chain.length > maxRedirects) {
			return { chain, response, url: current };
		}

		const next = parseHttpUrl(location, current);
		if (!next) {
			// return an unresolvable redirect rather than failing the whole fetch.
			return { chain, response, url: current };
		}

		await response.body?.cancel().catch(() => {});
		current = next;
		chain.push(current);
	}
};

export interface ReadCappedOptions {
	maxBytes: number;
	/** when true, stop reading at the cap and return what was read; otherwise reject oversized bodies. */
	truncate: boolean;
}

/**
 * reads a response body into memory under a byte cap.
 *
 * @throws {InvalidRequestError} when `truncate` is false and the body exceeds `maxBytes`
 */
export const readCapped = async (response: Response, options: ReadCappedOptions): Promise<Uint8Array> => {
	const { maxBytes, truncate } = options;

	const declared = Number(response.headers.get('content-length'));
	if (!truncate && Number.isFinite(declared) && declared > maxBytes) {
		throw new InvalidRequestError({ message: 'upstream resource too large' });
	}

	// pin the stream element type for the reader.
	const body: ReadableStream<Uint8Array> | null = response.body;
	if (!body) {
		return new Uint8Array(0);
	}

	const reader = body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			if (!value) {
				continue;
			}

			total += value.byteLength;
			if (total > maxBytes) {
				if (!truncate) {
					throw new InvalidRequestError({ message: 'upstream resource too large' });
				}
				chunks.push(value.subarray(0, value.byteLength - (total - maxBytes)));
				total = maxBytes;
				break;
			}
			chunks.push(value);
		}
	} finally {
		await reader.cancel().catch(() => {});
	}

	const result = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return result;
};
