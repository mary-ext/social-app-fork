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

/**
 * creates an HLS resource fetcher.
 *
 * @param hooks retry and progress hooks
 * @returns resource fetcher
 */
export const createFetcher = (hooks: FetchHooks): Fetch => {
	return async (kind, url, signal) => {
		const policy = POLICY[kind];

		return await fetchWithRetry(
			policy.cdn ? toVideoCdnUrl(url) : url,
			{
				attempts: policy.attempts,
				onRetry: policy.reports ? hooks.onRetry : undefined,
				signal,
			},
			async (response) => {
				if (!response.body) {
					const bytes = await response.bytes();

					if (policy.reports) {
						hooks.onBytes(bytes.byteLength);
					}

					return { bytes, url: response.url };
				}
				const chunks: Uint8Array[] = [];

				for await (const chunk of response.body) {
					chunks.push(chunk);
					if (policy.reports && !signal.aborted) {
						hooks.onBytes(chunk.byteLength);
					}
				}

				return { bytes: concat(chunks), url: response.url };
			},
		);
	};
};
