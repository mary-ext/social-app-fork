import type { PlayerError } from '../shared/protocol';
import { HttpError, isRetryable, StalledError } from './fetch-policy';
import { UnsupportedPlaylistError } from './playlist';

/**
 * classifies an error thrown while loading or remuxing.
 *
 * @param error thrown value
 * @returns the error to report to the player
 */
export const toPlayerError = (error: unknown): PlayerError => {
	const message = error instanceof Error ? error.message : String(error);

	if (error instanceof UnsupportedPlaylistError) {
		return { code: 'unsupported', message, fatal: true };
	}

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

	// don't repeat exhausted idle retries through client recovery.
	if (error instanceof StalledError) {
		return { code: 'network', message, fatal: true };
	}

	if (error instanceof TypeError) {
		return { code: 'network', message, fatal: false };
	}

	return { code: 'demux', message, fatal: true };
};
