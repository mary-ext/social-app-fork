import type { Did } from '@atcute/lexicons';

import { BSKY_LABELER_DID } from '#/lib/moderation/const';

/** app-level labeler configuration */

let appLabelers: readonly Did[] = [BSKY_LABELER_DID];

/**
 * Returns the configured app-level labeler DIDs.
 *
 * @returns the app labeler DIDs.
 */
export const getAppLabelers = (): readonly Did[] => appLabelers;

/**
 * Sets the app-level labeler DIDs.
 *
 * @param dids the app labeler DIDs.
 */
export const configureAppLabelers = (dids: Did[]): void => {
	appLabelers = dids;
};
