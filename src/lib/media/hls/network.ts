import { UrlSource } from 'mediabunny';

import { createRetryPolicy, HttpError, isRetryable } from './fetch-policy';
import type { PlayerError } from './protocol';

/**
 * creates an HLS input source with bounded retries.
 *
 * @param playlistUrl master playlist url
 * @param hooks retry and progress listeners
 * @returns mediabunny URL source
 */
export const createSource = (
	playlistUrl: string,
	hooks: { onRetry: (failures: number, url: string) => void; onBytes: (bytes: number) => void },
) =>
	new UrlSource(playlistUrl, {
		...createRetryPolicy({ master: playlistUrl, ...hooks }),
		// limit the default 64 MiB cache for each video in the feed.
		maxCacheSize: 16 * 1024 * 1024,
	});

/**
 * converts a source error to a player error.
 *
 * @param error source error
 * @returns classified player error
 */
export const describeError = (error: unknown): PlayerError => {
	const message = error instanceof Error ? error.message : String(error);
	if (error instanceof HttpError) {
		switch (error.status) {
			case 404:
			case 410: {
				return { code: 'not_found', message, fatal: true };
			}
			default: {
				return { code: 'network', message, fatal: !isRetryable(error.status) };
			}
		}
	}
	if (error instanceof TypeError) {
		return { code: 'network', message, fatal: false };
	}
	return { code: 'demux', message, fatal: true };
};
