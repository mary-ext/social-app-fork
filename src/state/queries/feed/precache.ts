import type { AppBskyFeedDefs, AppBskyGraphDefs } from '@atcute/bluesky';

import type { QueryClient } from '@tanstack/react-query';

import { type FeedSourceInfo, hydrateFeedGenerator } from '#/lib/feeds/source-info';

import { feedSourceInfoQueryKey } from '#/state/queries/feed/keys';
import { precacheResolvedUri } from '#/state/queries/identity/resolve-uri';
import { RQKEY as listQueryKey } from '#/state/queries/list/keys';

/**
 * seeds the feed source info and handle caches from a hydrated feed source.
 *
 * @param queryClient the query client
 * @param hydratedFeed the hydrated feed source
 */
export function precacheFeed(queryClient: QueryClient, hydratedFeed: FeedSourceInfo) {
	// a pseudo-feed has no creator to seed the handle/did cache with
	if (hydratedFeed.creatorDid) {
		precacheResolvedUri(queryClient, hydratedFeed.creatorHandle, hydratedFeed.creatorDid);
	}
	queryClient.setQueryData<FeedSourceInfo>(feedSourceInfoQueryKey({ uri: hydratedFeed.uri }), hydratedFeed);
}

export function precacheList(queryClient: QueryClient, list: AppBskyGraphDefs.ListView) {
	precacheResolvedUri(queryClient, list.creator.handle, list.creator.did);
	queryClient.setQueryData<AppBskyGraphDefs.ListView>(listQueryKey(list.uri), list);
}

export function precacheFeedFromGeneratorView(queryClient: QueryClient, view: AppBskyFeedDefs.GeneratorView) {
	const hydratedFeed = hydrateFeedGenerator(view);
	precacheFeed(queryClient, hydratedFeed);
}
