import { InvalidRequestError, UpstreamFailureError, UpstreamTimeoutError } from '@atcute/xrpc-server';

const USER_AGENT = 'Mozilla/5.0 (compatible; social-app-fork link-card generator)';

/**
 * parses a url and rejects anything that isn't a plain http(s) request.
 *
 * host-level ssrf filtering deliberately lives in the platform rather than here: the workers runtime mediates
 * every outbound fetch through a proxy that only reaches public internet services — never private ips,
 * loopback, or internal hosts. the `global_fetch_strictly_public` flag (see wrangler.jsonc) extends that to
 * own-zone requests by routing them back out through the public front door.
 *
 * @param raw the url to validate
 * @returns the parsed url
 * @throws {InvalidRequestError} when the url is malformed or uses an unsupported scheme
 */
export const assertHttpUrl = (raw: string): URL => {
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		throw new InvalidRequestError({ message: 'invalid url' });
	}

	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new InvalidRequestError({ message: 'unsupported url scheme' });
	}

	return url;
};

/** extracts the bare mime type from a response's `content-type`, lowercased and without parameters. */
export const contentTypeOf = (response: Response): string => {
	const header = response.headers.get('content-type') ?? '';
	const semi = header.indexOf(';');
	return (semi === -1 ? header : header.slice(0, semi)).trim().toLowerCase();
};

export interface SafeFetchOptions {
	accept: string;
	signal: AbortSignal;
	timeoutMs: number;
}

export interface SafeFetchResult {
	response: Response;
	/** the final url after following redirects. */
	url: URL;
}

/**
 * fetches a url as a public client under a timeout, following redirects. the workers proxy keeps every hop —
 * original and redirected — pointed at the public internet (see {@link assertHttpUrl}), so no per-hop host
 * vetting is needed here.
 *
 * @throws {UpstreamTimeoutError} when the request exceeds `timeoutMs`
 * @throws {UpstreamFailureError} when the upstream is unreachable
 */
export const safeFetch = async (url: URL, options: SafeFetchOptions): Promise<SafeFetchResult> => {
	const signal = AbortSignal.any([options.signal, AbortSignal.timeout(options.timeoutMs)]);

	let response: Response;
	try {
		response = await fetch(url, {
			headers: {
				accept: options.accept,
				'accept-language': 'en;q=0.9',
				'user-agent': USER_AGENT,
			},
			method: 'GET',
			redirect: 'follow',
			signal,
		});
	} catch {
		if (signal.aborted) {
			throw new UpstreamTimeoutError({ message: 'upstream timed out' });
		}
		throw new UpstreamFailureError({ message: 'failed to reach upstream' });
	}

	return { response, url: new URL(response.url || url.href) };
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

	const body = response.body;
	if (!body) {
		return new Uint8Array(0);
	}

	// Response.body is typed as ReadableStream<any>; assert the byte-stream element type
	const reader = body.getReader() as ReadableStreamDefaultReader<Uint8Array>;
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
