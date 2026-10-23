import { useEffect, useRef } from 'react';

import type { AppBskyUnspeccedGetPopularFeedGenerators } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateFeedGenerator } from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';

import { type InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { hydrateFeedGenerator } from '#/lib/feeds/source-info';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { precacheFeed } from '#/state/queries/feed/precache';
import { usePreferencesQuery } from '#/state/queries/preferences/preferences';
import { getClients, useSession } from '#/state/session';

// the protocol does not identify personalized feeds, so exclude known
// authenticated-only recommendations for logged-out users.
const KNOWN_AUTHED_ONLY_FEEDS = new Set([
	'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/with-friends', // popular with friends, by bsky.app
	'at://did:plc:tenurhgjptubkk5zf5qhi3og/app.bsky.feed.generator/mutuals', // mutuals, by skyfeed
	'at://did:plc:tenurhgjptubkk5zf5qhi3og/app.bsky.feed.generator/only-posts', // only posts, by skyfeed
	'at://did:plc:wzsilnxf24ehtmmc3gssy5bu/app.bsky.feed.generator/mentions', // mentions, by flicknow
	'at://did:plc:q6gjnaw2blty4crticxkmujt/app.bsky.feed.generator/bangers', // my bangers, by jaz
	'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/mutuals', // mutuals, by bluesky
	'at://did:plc:q6gjnaw2blty4crticxkmujt/app.bsky.feed.generator/my-followers', // followers, by jaz
	'at://did:plc:vpkhqolt662uhesyj6nxm7ys/app.bsky.feed.generator/followpics', // the gram, by why
]);

type GetPopularFeedsOptions = { limit?: number; enabled?: boolean };

const createGetPopularFeedsQueryKey = (options?: GetPopularFeedsOptions) => {
	return ['getPopularFeeds', options?.limit];
};

export function useGetPopularFeedsQuery(options?: GetPopularFeedsOptions) {
	const { hasSession } = useSession();
	const { appview } = getClients();
	const limit = options?.limit || 10;
	const { data: preferences } = usePreferencesQuery();
	const queryClient = useQueryClient();
	const moderationOpts = useModerationOpts();

	// keep the selector stable unless one of its inputs changes.
	const selectArgs = {
		hasSession,
		savedFeeds: preferences?.savedFeeds || [],
		moderationOpts,
	};
	const lastPageCountRef = useRef(0);

	const query = useInfiniteQuery({
		queryKey: createGetPopularFeedsQueryKey(options),
		enabled: !!moderationOpts && options?.enabled !== false,
		queryFn: async ({ pageParam, signal }) => {
			const data = await ok(
				appview.get('app.bsky.unspecced.getPopularFeedGenerators', {
					signal,
					params: { limit, cursor: pageParam },
				}),
			);

			for (const feed of data.feeds) {
				const hydratedFeed = hydrateFeedGenerator(feed);
				precacheFeed(queryClient, hydratedFeed);
			}

			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		select: (data: InfiniteData<AppBskyUnspeccedGetPopularFeedGenerators.$output>) => {
			// oxlint-disable-next-line no-shadow -- shadowing is the point: it stops the callback from reading a stale closure copy instead of `selectArgs`
			const { savedFeeds, hasSession: hasSessionInner, moderationOpts } = selectArgs;
			return {
				...data,
				pages: data.pages.map((page) => {
					return {
						...page,
						feeds: page.feeds.filter((feed) => {
							if (!hasSessionInner && KNOWN_AUTHED_ONLY_FEEDS.has(feed.uri)) {
								return false;
							}
							const alreadySaved = !!savedFeeds?.find((f) => {
								return f.value === feed.uri;
							});
							const decision = moderateFeedGenerator(feed, moderationOpts!);
							return (
								!alreadySaved &&
								getDisplayRestrictions(decision, DisplayContext.ContentList).filters.length === 0
							);
						}),
					};
				}),
			};
		},
	});

	useEffect(() => {
		const { isFetching, hasNextPage, data } = query;
		if (isFetching || !hasNextPage) {
			return;
		}

		// avoid double-fires of fetchNextPage()
		if (lastPageCountRef.current !== 0 && lastPageCountRef.current === data?.pages?.length) {
			return;
		}

		// fetch next page if we haven't gotten a full page of content
		let count = 0;
		for (const page of data?.pages || []) {
			count += page.feeds.length;
		}
		if (count < limit && (data?.pages.length || 0) < 6) {
			void query.fetchNextPage();
			lastPageCountRef.current = data?.pages?.length || 0;
		}
	}, [query, limit]);

	return query;
}
