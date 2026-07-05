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

import { useClients } from '#/state/session';

import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost } from './util';

const PAGE_SIZE = 30;
type RQPageParam = string | undefined;

const RQKEY_ROOT = 'post-quotes';
export const RQKEY = (resolvedUri: string) => [RQKEY_ROOT, resolvedUri];

export function usePostQuotesQuery(resolvedUri: string | undefined) {
	const { appview } = useClients();
	return useInfiniteQuery<
		AppBskyFeedGetQuotes.$output,
		Error,
		InfiniteData<AppBskyFeedGetQuotes.$output>,
		QueryKey,
		RQPageParam
	>({
		queryKey: RQKEY(resolvedUri || ''),
		queryFn: ({ pageParam }: { pageParam: RQPageParam }) =>
			ok(
				appview.get('app.bsky.feed.getQuotes', {
					params: {
						uri: (resolvedUri || '') as ResourceUri,
						limit: PAGE_SIZE,
						cursor: pageParam,
					},
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		enabled: !!resolvedUri,
		select: (data) => {
			return {
				...data,
				pages: data.pages.map((page) => {
					return {
						...page,
						posts: page.posts.filter((post) => {
							const record = unwrapRecordEmbed(post.embed);
							if (record?.$type === 'app.bsky.embed.record#viewDetached') {
								return false;
							}
							return true;
						}),
					};
				}),
			};
		},
	});
}

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
		for (const page of queryData?.pages) {
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
