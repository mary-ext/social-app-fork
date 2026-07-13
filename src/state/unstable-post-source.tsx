import { useEffect, useId } from 'react';

import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { parseResourceUri } from '@atcute/lexicons/syntax';

import { useConstant } from '#/lib/hooks/use-constant';

import type { FeedSourceInfo } from '#/state/queries/feed';

import { Logger } from '#/logger';

/** Separate logger for better debugging */
const logger = Logger.create(Logger.Context.PostSource);

export type PostSource = {
	post: AppBskyFeedDefs.FeedViewPost;
	feedSourceInfo?: FeedSourceInfo;
};

/**
 * A cache of sources that will be consumed by the post thread view. This is cleaned up any time a source is
 * consumed.
 */
const transientSources = new Map<string, PostSource>();

/** cache of sources consumed by the post thread view */
const consumedSources = new Map<string, PostSource>();

/**
 * For stashing the feed that the user was browsing when they clicked on a post.
 *
 * Used for FeedFeedback and other ephemeral non-critical systems.
 */
export function setUnstablePostSource(key: string, source: PostSource) {
	assertValidDevOnly(
		key,
		`setUnstablePostSource key should be a URI containing a handle, received ${key} — use buildPostSourceKey`,
	);
	logger.debug('set', { key, source });
	transientSources.set(key, source);
}

/**
 * unstable hook for ephemeral non-critical systems where views return a reference to the same source until
 * they are dropped from memory.
 */
export function useUnstablePostSource(key: string) {
	const id = useId();
	const source = useConstant(() => {
		assertValidDevOnly(
			key,
			`consumeUnstablePostSource key should be a URI containing a handle, received ${key} — be sure to use buildPostSourceKey when setting the source`,
			true,
		);
		const existing = consumedSources.get(id) || transientSources.get(key);
		if (existing) {
			logger.debug('consume', { id, key, source: existing });
			transientSources.delete(key);
			consumedSources.set(id, existing);
		}
		return existing;
	});

	useEffect(() => {
		return () => {
			consumedSources.delete(id);
			logger.debug('cleanup', { id });
		};
	}, [id]);

	return source;
}

/** Builds a post source key. This (atm) is a URI where the `host` is the post author's handle, not DID. */
export function buildPostSourceKey(key: string, handle: string) {
	const urip = parseResourceUri(key);
	return `at://${handle}/${urip.collection}/${urip.rkey}`;
}

/** Just a lil dev helper */
function assertValidDevOnly(key: string, message: string, beChill = false) {
	if (import.meta.env.DEV) {
		const urip = parseResourceUri(key);
		if (urip.repo.startsWith('did:')) {
			if (beChill) {
				logger.warn(message);
			} else {
				throw new Error(message);
			}
		}
	}
}
