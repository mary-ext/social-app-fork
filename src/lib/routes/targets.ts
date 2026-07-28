import {
	type ActorIdentifier,
	parseCanonicalResourceUri,
	parseResourceUri,
	type RecordKey,
	type Tid,
} from '@atcute/lexicons/syntax';

import type { RouteTarget } from '#/routes';

// #region record targets

/**
 * the destination for a conversation.
 *
 * @param conversation the conversation's id
 * @returns the conversation route target
 */
export const conversationTarget = (conversation: Tid): RouteTarget => {
	return { name: 'MessagesConversation', conversation };
};

/**
 * the destination for a feed.
 *
 * @param actor the feed creator's did or handle
 * @param rkey the feed generator's record key
 * @returns the feed route target
 */
export const feedTarget = (actor: ActorIdentifier, rkey: RecordKey): RouteTarget => {
	return { name: 'ProfileFeed', actor, rkey };
};

/**
 * the destination for the labels a labeler account publishes.
 *
 * @param actor the labeler's did or handle
 * @returns the labels route target
 */
export const labelsTarget = (actor: ActorIdentifier): RouteTarget => {
	return { name: 'ProfileLabels', actor };
};

/**
 * the destination for a list.
 *
 * @param actor the list owner's did or handle
 * @param rkey the list's record key
 * @returns the list route target
 */
export const listTarget = (actor: ActorIdentifier, rkey: RecordKey): RouteTarget => {
	return { name: 'ProfileList', actor, rkey };
};

/**
 * the destination for a post's thread.
 *
 * @param actor the author's did or handle
 * @param rkey the post's record key
 * @returns the thread route target
 */
export const postTarget = (actor: ActorIdentifier, rkey: RecordKey): RouteTarget => {
	return { name: 'PostThread', actor, rkey };
};

/**
 * the destination for an actor's profile.
 *
 * @param actor the actor's did or handle
 * @returns the profile route target
 */
export const profileTarget = (actor: ActorIdentifier): RouteTarget => {
	return { name: 'Profile', actor };
};

/**
 * the destination for a starter pack.
 *
 * @param actor the pack creator's did or handle
 * @param rkey the starter pack's record key
 * @returns the starter pack route target
 */
export const starterPackTarget = (actor: ActorIdentifier, rkey: RecordKey): RouteTarget => {
	return { name: 'StarterPack', actor, rkey };
};

// #endregion

// #region at-uri targets

/**
 * the destination for a post, from its at-uri.
 *
 * @param uri the post's canonical at-uri
 * @returns the thread route target
 * @throws when the uri is not a canonical record uri
 */
export const postUriToTarget = (uri: string): RouteTarget => {
	const { repo, rkey } = parseCanonicalResourceUri(uri);
	return postTarget(repo, rkey);
};

/**
 * the destination that renders the record an at-uri names: the repo alone resolves to its profile, and each
 * supported collection to that record's screen.
 *
 * the uri is unparsed, so a malformed one has to resolve to _something_; this returns undefined rather than a
 * broken target, leaving the caller to decide what an unlinkable record renders as.
 *
 * @param uri the record's at-uri
 * @returns the route target, or undefined if the uri is malformed or names an unsupported collection
 */
export const recordUriToTarget = (uri: string): RouteTarget | undefined => {
	let parsed;
	try {
		parsed = parseResourceUri(uri);
	} catch {
		return undefined;
	}

	const { repo, collection, rkey } = parsed;
	if (!collection) {
		return profileTarget(repo);
	}
	if (!rkey) {
		return undefined;
	}

	switch (collection) {
		case 'app.bsky.feed.generator':
			return feedTarget(repo, rkey);
		case 'app.bsky.feed.post':
			return postTarget(repo, rkey);
		case 'app.bsky.graph.list':
			return listTarget(repo, rkey);
		case 'app.bsky.graph.starterpack':
			return starterPackTarget(repo, rkey);
		default:
			return undefined;
	}
};

// #endregion
