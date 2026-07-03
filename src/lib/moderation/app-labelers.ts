import { BSKY_LABELER_DID } from '#/lib/moderation/const';

/** app-level labeler configuration */

let appLabelers: readonly string[] = [BSKY_LABELER_DID];

/**
 * Returns the configured app-level labeler DIDs.
 *
 * @returns the app labeler DIDs.
 */
export const getAppLabelers = (): readonly string[] => appLabelers;

/**
 * Sets the app-level labeler DIDs.
 *
 * @param dids the app labeler DIDs.
 */
export const configureAppLabelers = (dids: string[]): void => {
	appLabelers = dids;
};
