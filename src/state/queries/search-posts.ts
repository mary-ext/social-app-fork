import { useRef } from 'react';

import type { AppBskyFeedDefs, AppBskyFeedSearchPostsV2 } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderatePost } from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';
import type { ActorIdentifier } from '@atcute/lexicons';
import { parseResourceUri } from '@atcute/lexicons/syntax';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { liftSearchQuery } from '#/lib/search-query';
import { typedKeys } from '#/lib/utils/objects';

import { registerShadowFinders } from '#/state/cache/registry';
import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { getClients, useSession } from '#/state/session';

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
	author?: ActorIdentifier;
	query: string;
	sort?: 'top' | 'latest';
}) {
	const { appview } = getClients();
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();
	const viewerDid = currentAccount?.did;

	const lifted = liftSearchQuery(query, { viewerDid });
	const baseAuthors = lifted.filters.authors ?? [];
	let authors: ActorIdentifier[] | undefined = baseAuthors.length ? baseAuthors : undefined;
	if (author) {
		authors = [...new Set<ActorIdentifier>([...baseAuthors, author])];
	}

	const selectArgs = {
		isSearchingSpecificUser: (authors?.length ?? 0) > 0,
		moderationOpts,
	};
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
		enabled: !!moderationOpts,
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
		select: (data: InfiniteData<AppBskyFeedSearchPostsV2.$output>) => {
			// oxlint-disable-next-line no-shadow -- shadowing is the point: it stops the callback from reading a stale closure copy instead of `selectArgs`
			const { moderationOpts, isSearchingSpecificUser } = selectArgs;

			// profile searches already scope results to the requested account.
			if (isSearchingSpecificUser) {
				return data;
			}

			const reusedPages: AppBskyFeedSearchPostsV2.$output[] = [];
			if (lastRun.current) {
				const { data: lastData, args: lastArgs, result: lastResult } = lastRun.current;
				let canReuse = true;
				for (const key of typedKeys(selectArgs)) {
					if (selectArgs[key] !== lastArgs[key]) {
						// reuse is only safe when every selector input is unchanged.
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
