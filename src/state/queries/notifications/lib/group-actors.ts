import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';

import { difference, mapDefined, uniqueBy } from '@mary-ext/array-fns';

import type { ActorGroup } from '#/lib/notifications/types';

import { isActorHidden } from '#/state/queries/notifications/lib/moderate';

type ProfileView = AppBskyActorDefs.ProfileViewDetailed;

/** how many actors "show more" loads at once, the most `app.bsky.actor.getProfiles` accepts. */
const GROUP_ACTORS_PAGE_SIZE = 25;

/** one page of a group's actors, loaded beyond those its notification resolved. */
export interface GroupActorsPage {
	/**
	 * every DID requested, including those that didn't come back (deleted accounts), so they're never
	 * re-requested.
	 */
	dids: Did[];
	/** the profiles that came back, in the order requested. */
	profiles: ProfileView[];
}

/**
 * @param group the notification's actors
 * @returns the actors hydration couldn't resolve, newest first
 */
export const getUnresolvedActorDids = (group: ActorGroup): Did[] => {
	return difference(
		group.actorDids,
		group.actors.map((actor) => actor.did),
	);
};

/**
 * @param unresolvedDids from `getUnresolvedActorDids`
 * @param pages pages loaded so far
 * @returns the first unresolved DIDs no page has requested yet; empty once every one has been
 */
export const getNextActorDids = (unresolvedDids: Did[], pages: GroupActorsPage[]): Did[] => {
	return difference(
		unresolvedDids,
		pages.flatMap((page) => page.dids),
	).slice(0, GROUP_ACTORS_PAGE_SIZE);
};

/**
 * @param dids DIDs that were requested
 * @param profiles the `getProfiles` response
 * @returns a page with the profiles put back in the order requested
 */
export const createGroupActorsPage = (dids: Did[], profiles: ProfileView[]): GroupActorsPage => {
	const byDid = new Map(profiles.map((profile) => [profile.did, profile]));
	return {
		dids,
		profiles: mapDefined(dids, (did) => byDid.get(did)),
	};
};

/**
 * only actors still unresolved in the notification are kept, so none repeat its own actors even if it has
 * changed since they loaded.
 *
 * @param pages pages loaded so far
 * @param unresolvedDids from `getUnresolvedActorDids`
 * @param moderationOpts active moderation options
 * @returns the loaded actors to show, in order, moderated like the notification's own actors
 */
export const selectLoadedActors = (
	pages: GroupActorsPage[],
	unresolvedDids: Did[],
	moderationOpts: ModerationOptions | undefined,
): ProfileView[] => {
	const unresolved = new Set<string>(unresolvedDids);
	return uniqueBy(
		pages.flatMap((page) => page.profiles),
		(profile) => profile.did,
	).filter((profile) => unresolved.has(profile.did) && !isActorHidden(profile, moderationOpts));
};
