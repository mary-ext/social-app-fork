import { useCallback, useMemo, useRef } from 'react';

import type { AppBskyFeedDefs, AppBskyFeedSearchPostsV2 } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderatePost } from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';
import type { ActorIdentifier } from '@atcute/lexicons';
import { parseResourceUri } from '@atcute/lexicons/syntax';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { liftSearchQuery } from '#/lib/bsky/search';

import { registerShadowFinders } from '#/state/cache/registry';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useClients, useSession } from '#/state/session';

import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost } from './util';

const searchPostsQueryKeyRoot = 'search-posts';
const searchPostsQueryKey = ({
	author,
	query,
	sort,
	viewerDid,
}: {
	author?: string;
	query: string;
	sort?: string;
	viewerDid?: string;
}) => [searchPostsQueryKeyRoot, query, sort, author, viewerDid];

export function useSearchPostsQuery({
	author,
	query,
	sort,
}: {
	author?: string;
	query: string;
	sort?: 'top' | 'latest';
}) {
	const { appview } = useClients();
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();
	const viewerDid = currentAccount?.did;

	const lifted = useMemo(() => liftSearchQuery(query, { viewerDid }), [query, viewerDid]);
	const authors = useMemo(() => {
		const base = lifted.filters.authors ?? [];
		if (!author) {
			return base.length ? base : undefined;
		}
		return [...new Set<string>([...base, author])] as ActorIdentifier[];
	}, [lifted, author]);

	const selectArgs = useMemo(
		() => ({
			isSearchingSpecificUser: (authors?.length ?? 0) > 0,
			moderationOpts,
		}),
		[authors, moderationOpts],
	);
	const lastRun = useRef<{
		data: InfiniteData<AppBskyFeedSearchPostsV2.$output>;
		args: typeof selectArgs;
		result: InfiniteData<AppBskyFeedSearchPostsV2.$output>;
	} | null>(null);

	return useInfiniteQuery<
		AppBskyFeedSearchPostsV2.$output,
		Error,
		InfiniteData<AppBskyFeedSearchPostsV2.$output>,
		QueryKey,
		string | undefined
	>({
		queryKey: searchPostsQueryKey({ author, query, sort, viewerDid }),
		queryFn: ({ pageParam }) =>
			ok(
				appview.get('app.bsky.feed.searchPostsV2', {
					params: {
						...lifted.filters,
						allTime: true,
						authors,
						cursor: pageParam,
						limit: 25,
						query: lifted.text || undefined,
						// v2 renames the v1 'latest' recency sort to 'recent'.
						sort: sort === 'latest' ? 'recent' : sort,
					},
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		enabled: !!moderationOpts,
		select: useCallback(
			(data: InfiniteData<AppBskyFeedSearchPostsV2.$output>) => {
				// oxlint-disable-next-line no-shadow -- shadowing is the point: it stops the callback from reading a stale closure copy instead of `selectArgs`
				const { moderationOpts, isSearchingSpecificUser } = selectArgs;

				/*
				 * If a user applies the `from:<user>` filter, don't apply any
				 * moderation. Note that if we add any more filtering logic below, we
				 * may need to adjust this.
				 */
				if (isSearchingSpecificUser) {
					return data;
				}

				// Keep track of the last run and whether we can reuse
				// some already selected pages from there.
				const reusedPages: AppBskyFeedSearchPostsV2.$output[] = [];
				if (lastRun.current) {
					const { data: lastData, args: lastArgs, result: lastResult } = lastRun.current;
					let canReuse = true;
					for (const key of Object.keys(selectArgs) as (keyof typeof selectArgs)[]) {
						if (selectArgs[key] !== lastArgs[key]) {
							// Can't do reuse anything if any input has changed.
							canReuse = false;
							break;
						}
					}
					if (canReuse) {
						for (let i = 0; i < data.pages.length; i++) {
							if (data.pages[i] && lastData.pages[i] === data.pages[i]) {
								reusedPages.push(lastResult.pages[i]!);
								continue;
							}
							// Stop as soon as pages stop matching up.
							break;
						}
					}
				}

				const result = {
					...data,
					pages: [
						...reusedPages,
						// oxlint-disable-next-line oxc/no-map-spread -- `Object.assign` would mutate react-query's cache
						...data.pages.slice(reusedPages.length).map((page) => {
							return {
								...page,
								posts: page.posts.filter((post) => {
									const mod = moderatePost(post, moderationOpts!);
									return getDisplayRestrictions(mod, DisplayContext.ContentList).filters.length === 0;
								}),
							};
						}),
					],
				};

				lastRun.current = { data, result, args: selectArgs };

				return result;
			},
			[selectArgs],
		),
	});
}

export function* findAllPostsInQueryData(
	queryClient: QueryClient,
	uri: string,
): Generator<AppBskyFeedDefs.PostView, undefined> {
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyFeedSearchPostsV2.$output>>({
		queryKey: [searchPostsQueryKeyRoot],
	});
	const atUri = parseResourceUri(uri);

	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const post of page.posts) {
				if (didOrHandleUriMatches(atUri, post)) {
					yield post;
				}

				const quotedPost = getEmbeddedPost(post.embed);
				if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
					yield embedViewRecordToPostView(quotedPost);
				}
			}
		}
	}
}

registerShadowFinders(searchPostsQueryKeyRoot, {
	findPosts: findAllPostsInQueryData,
});
