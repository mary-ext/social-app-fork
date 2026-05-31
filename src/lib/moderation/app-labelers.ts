import { BSKY_LABELER_DID } from '#/lib/moderation/const';

/**
 * App-level labeler configuration. The moderation engine no longer owns this state (it did via
 * `@atproto/api`'s `Agent.appLabelers`), so the fork holds it as module-level state seeded with the Bluesky
 * labeler.
 */

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
