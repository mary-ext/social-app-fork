import {
	unwrapRecordEmbed,
	type AppBskyActorDefs,
	type AppBskyFeedDefs,
	type AppBskyFeedGetQuotes,
} from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';
import { parseResourceUri } from '@atcute/lexicons/syntax';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { registerShadowFinders } from '#/state/cache/registry';
import { getClients } from '#/state/session';

import { useAutoPagination } from './use-auto-pagination';
import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost } from './util';

const PAGE_SIZE = 30;
type RQPageParam = string | undefined;

/** latest: newest first; top: most liked. */
export type QuotesSort = 'latest' | 'top';

const RQKEY_ROOT = 'post-quotes';
const RQKEY = (resolvedUri: string, sort: QuotesSort) => [RQKEY_ROOT, resolvedUri, sort];

/**
 * paginates a post's quotes.
 *
 * @param resolvedUri the quoted post's DID-based URI; undefined disables the query
 * @param sort ordering of the results
 * @returns an infinite query excluding detached and duplicate quotes
 */
export function usePostQuotesQuery(resolvedUri: ResourceUri | undefined, sort: QuotesSort) {
	const { appview } = getClients();
	const query = useInfiniteQuery<
		AppBskyFeedGetQuotes.$output,
		Error,
		InfiniteData<AppBskyFeedGetQuotes.$output>,
		QueryKey,
		RQPageParam
	>({
		queryKey: RQKEY(resolvedUri || '', sort),
		enabled: !!resolvedUri,
		queryFn: ({ pageParam, signal }: { pageParam: RQPageParam; signal: AbortSignal }) =>
			ok(
				appview.get('app.bsky.feed.getQuotes', {
					signal,
					params: {
						uri: resolvedUri!,
						limit: PAGE_SIZE,
						cursor: pageParam,
						sort,
					},
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		select: selectPostQuotes,
	});

	// filtering can leave too few items to trigger scroll-based pagination.
	let itemCount = 0;
	for (const page of query.data?.pages ?? []) {
		itemCount += page.posts.length;
	}
	useAutoPagination({ query, itemCount, pageSize: PAGE_SIZE });

	return query;
}

// a stable selector lets React Query reuse results between renders.
const selectPostQuotes = (
	data: InfiniteData<AppBskyFeedGetQuotes.$output>,
): InfiniteData<AppBskyFeedGetQuotes.$output> => {
	// ranking changes can repeat quotes across pages.
	const seen = new Set<string>();
	return {
		...data,
		pages: data.pages.map((page) => {
			return {
				...page,
				posts: page.posts.filter((post) => {
					if (seen.has(post.uri)) {
						return false;
					}
					seen.add(post.uri);

					const record = unwrapRecordEmbed(post.embed);
					return record?.$type !== 'app.bsky.embed.record#viewDetached';
				}),
			};
		}),
	};
};

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<AppBskyActorDefs.ProfileViewBasic, void> {
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyFeedGetQuotes.$output>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const item of page.posts) {
				if (item.author.did === did) {
					yield item.author;
				}
				const quotedPost = getEmbeddedPost(item.embed);
				if (quotedPost?.author.did === did) {
					yield quotedPost.author;
				}
			}
		}
	}
}

export function* findAllPostsInQueryData(
	queryClient: QueryClient,
	uri: string,
): Generator<AppBskyFeedDefs.PostView, undefined> {
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyFeedGetQuotes.$output>>({
		queryKey: [RQKEY_ROOT],
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

registerShadowFinders(RQKEY_ROOT, {
	findPosts: findAllPostsInQueryData,
	findProfiles: findAllProfilesInQueryData,
});
