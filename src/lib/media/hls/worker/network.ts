import { concat } from '@atcute/uint8array';

import { toVideoCdnUrl } from '#/lib/bsky-cdn';

import { fetchWithRetry, MAX_ATTEMPTS } from './fetch-policy';

type FetchHooks = {
	onRetry: (failures: number) => void;
	onBytes: (bytes: number) => void;
};

export type Resource = { bytes: Uint8Array; url: string };

export type ResourceKind = 'master' | 'media' | 'subtitle';

const POLICY = {
	master: { attempts: MAX_ATTEMPTS.master, cdn: false, reports: true },
	media: { attempts: MAX_ATTEMPTS.media, cdn: true, reports: true },
	subtitle: { attempts: MAX_ATTEMPTS.media, cdn: false, reports: false },
} as const;

export type Fetch = (kind: ResourceKind, url: string, signal: AbortSignal) => Promise<Resource>;

export type Stream = (url: string, signal: AbortSignal) => ReadableStream<Uint8Array>;

const fetchChunks = <T>(
	kind: ResourceKind,
	url: string,
	{ hooks, signal }: { hooks: FetchHooks; signal: AbortSignal },
	read: () => { onChunk: (chunk: Uint8Array) => void; done: (response: Response) => T },
) => {
	const policy = POLICY[kind];

	return fetchWithRetry(
		policy.cdn ? toVideoCdnUrl(url) : url,
		{ attempts: policy.attempts, onRetry: policy.reports ? hooks.onRetry : undefined, signal },
		async (response, received) => {
			const { onChunk, done } = read();

			for await (const chunk of response.body ?? [await response.bytes()]) {
				received();
				if (policy.reports && !signal.aborted) {
					hooks.onBytes(chunk.byteLength);
				}
				onChunk(chunk);
			}

			return done(response);
		},
	);
};

/**
 * creates an HLS resource fetcher.
 *
 * @param hooks retry and progress hooks
 * @returns resource fetcher
 */
export const createFetcher = (hooks: FetchHooks): Fetch => {
	return (kind, url, signal) => {
		return fetchChunks(kind, url, { hooks, signal }, () => {
			const chunks: Uint8Array[] = [];

			return {
				onChunk: (chunk) => chunks.push(chunk),
				done: (response): Resource => ({ bytes: concat(chunks), url: response.url }),
			};
		});
	};
};

/**
 * creates a media segment streamer that starts requests immediately and buffers until read. retries resume
 * without repeating delivered bytes.
 *
 * @param hooks retry and progress hooks
 * @returns segment streamer
 */
export const createStreamer = (hooks: FetchHooks): Stream => {
	return (url, signal) => {
		const cancel = new AbortController();
		const combined = AbortSignal.any([signal, cancel.signal]);
		let delivered = 0;

		return new ReadableStream<Uint8Array>({
			start: (controller) => {
				fetchChunks('media', url, { hooks, signal: combined }, () => {
					let skip = delivered;

					return {
						onChunk: (chunk) => {
							if (skip >= chunk.byteLength) {
								skip -= chunk.byteLength;
								return;
							}

							const fresh = chunk.subarray(skip);

							skip = 0;
							delivered += fresh.byteLength;
							controller.enqueue(fresh);
						},
						done: () => {},
					};
				}).then(
					() => {
						if (!cancel.signal.aborted) {
							controller.close();
						}
					},
					(error: unknown) => controller.error(error),
				);
			},
			cancel: () => cancel.abort(),
		});
	};
};
