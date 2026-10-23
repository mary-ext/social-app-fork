import type { AppBskyUnspeccedGetPopularFeedGenerators } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateFeedGenerator } from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';

import { type InfiniteData, keepPreviousData, useInfiniteQuery, useMutation } from '@tanstack/react-query';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { getClients } from '#/state/session';

export function useSearchPopularFeedsMutation() {
	const { appview } = getClients();
	const moderationOpts = useModerationOpts();

	return useMutation({
		mutationFn: async (query: string) => {
			const data = await ok(
				appview.get('app.bsky.unspecced.getPopularFeedGenerators', {
					params: { limit: 10, query: query },
				}),
			);

			if (moderationOpts) {
				return data.feeds.filter((feed) => {
					const decision = moderateFeedGenerator(feed, moderationOpts);
					return getDisplayRestrictions(decision, DisplayContext.ContentMedia).blurs.length === 0;
				});
			}

			return data.feeds;
		},
	});
}

const createPopularFeedsSearchQueryKey = (query: string) => ['popularFeedsSearch', query];

export function usePopularFeedsSearch({ query }: { query: string }) {
	const { appview } = getClients();
	const moderationOpts = useModerationOpts();

	return useInfiniteQuery({
		queryKey: createPopularFeedsSearchQueryKey(query),
		// select requires moderation options
		enabled: !!moderationOpts,
		queryFn: async ({ pageParam, signal }) => {
			return await ok(
				appview.get('app.bsky.unspecced.getPopularFeedGenerators', {
					signal,
					params: { limit: 15, cursor: pageParam, query: query },
				}),
			);
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		placeholderData: keepPreviousData,
		select: (data: InfiniteData<AppBskyUnspeccedGetPopularFeedGenerators.$output>) => {
			return {
				...data,
				pages: data.pages.map((page) => {
					return {
						...page,
						feeds: page.feeds.filter((feed) => {
							const decision = moderateFeedGenerator(feed, moderationOpts!);
							return getDisplayRestrictions(decision, DisplayContext.ContentMedia).blurs.length === 0;
						}),
					};
				}),
			};
		},
	});
}
