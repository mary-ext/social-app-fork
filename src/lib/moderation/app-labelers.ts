import { Agent } from '@atproto/api';

/**
 * App-level labeler configuration, fronting `@atproto/api`'s `Agent` static labeler state. The moderation
 * engine reads `Agent.appLabelers` internally, so this stays on `@atproto/api` inside the bounded moderation
 * island until the engine migrates (see ATCUTE-ROADMAP.md Appendix A).
 */

/**
 * Returns the configured app-level labeler DIDs.
 *
 * @returns the app labeler DIDs.
 */
export const getAppLabelers = (): readonly string[] => Agent.appLabelers;

/**
 * Sets the app-level labeler DIDs the moderation engine applies.
 *
 * @param dids the app labeler DIDs.
 */
export const configureAppLabelers = (dids: string[]): void => {
	Agent.configure({ appLabelers: dids });
};
