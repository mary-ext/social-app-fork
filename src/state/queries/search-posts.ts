import { useCallback, useMemo, useRef } from 'react';
import type { AppBskyActorDefs, AppBskyFeedDefs, AppBskyFeedSearchPosts } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderatePost } from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';
import { parseResourceUri } from '@atcute/lexicons/syntax';
import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useClients } from '#/state/session';

import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost } from './util';

const searchPostsQueryKeyRoot = 'search-posts';
const searchPostsQueryKey = ({ query, sort }: { query: string; sort?: string }) => [
	searchPostsQueryKeyRoot,
	query,
	sort,
];

export function useSearchPostsQuery({
	query,
	sort,
	enabled,
}: {
	query: string;
	sort?: 'top' | 'latest';
	enabled?: boolean;
}) {
	const { appview } = useClients();
	const moderationOpts = useModerationOpts();
	const selectArgs = useMemo(
		() => ({
			isSearchingSpecificUser: /from:(\w+)/.test(query),
			moderationOpts,
		}),
		[query, moderationOpts],
	);
	const lastRun = useRef<{
		data: InfiniteData<AppBskyFeedSearchPosts.$output>;
		args: typeof selectArgs;
		result: InfiniteData<AppBskyFeedSearchPosts.$output>;
	} | null>(null);

	return useInfiniteQuery<
		AppBskyFeedSearchPosts.$output,
		Error,
		InfiniteData<AppBskyFeedSearchPosts.$output>,
		QueryKey,
		string | undefined
	>({
		queryKey: searchPostsQueryKey({ query, sort }),
		queryFn: ({ pageParam }) =>
			ok(
				appview.get('app.bsky.feed.searchPosts', {
					params: {
						q: query,
						limit: 25,
						cursor: pageParam,
						sort,
					},
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		enabled: enabled ?? !!moderationOpts,
		select: useCallback(
			(data: InfiniteData<AppBskyFeedSearchPosts.$output>) => {
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
				let reusedPages: AppBskyFeedSearchPosts.$output[] = [];
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
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyFeedSearchPosts.$output>>({
		queryKey: [searchPostsQueryKeyRoot],
	});
	const atUri = parseResourceUri(uri);

	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData?.pages) {
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

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<AppBskyActorDefs.ProfileViewBasic, undefined> {
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyFeedSearchPosts.$output>>({
		queryKey: [searchPostsQueryKeyRoot],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData?.pages) {
			for (const post of page.posts) {
				if (post.author.did === did) {
					yield post.author;
				}
				const quotedPost = getEmbeddedPost(post.embed);
				if (quotedPost?.author.did === did) {
					yield quotedPost.author;
				}
			}
		}
	}
}
