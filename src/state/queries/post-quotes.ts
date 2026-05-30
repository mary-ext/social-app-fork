import { type AppBskyFeedDefs as AppBskyFeedDefsAtcute } from '@atcute/bluesky';
import { parseResourceUri } from '@atcute/lexicons/syntax';
import {
	type AppBskyActorDefs,
	AppBskyEmbedRecord,
	type AppBskyFeedDefs,
	type AppBskyFeedGetQuotes,
} from '@atproto/api';
import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { useAgent } from '#/state/session';

import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost } from './util';

const PAGE_SIZE = 30;
type RQPageParam = string | undefined;

const RQKEY_ROOT = 'post-quotes';
export const RQKEY = (resolvedUri: string) => [RQKEY_ROOT, resolvedUri];

export function usePostQuotesQuery(resolvedUri: string | undefined) {
	const agent = useAgent();
	return useInfiniteQuery<
		AppBskyFeedGetQuotes.OutputSchema,
		Error,
		InfiniteData<AppBskyFeedGetQuotes.OutputSchema>,
		QueryKey,
		RQPageParam
	>({
		queryKey: RQKEY(resolvedUri || ''),
		async queryFn({ pageParam }: { pageParam: RQPageParam }) {
			const res = await agent.api.app.bsky.feed.getQuotes({
				uri: resolvedUri || '',
				limit: PAGE_SIZE,
				cursor: pageParam,
			});
			return res.data;
		},
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
							if (post.embed && AppBskyEmbedRecord.isView(post.embed)) {
								if (AppBskyEmbedRecord.isViewDetached(post.embed.record)) {
									return false;
								}
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
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyFeedGetQuotes.OutputSchema>>({
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
					// TODO(atcute Phase 2.5): drop cast once quotes flip to @atcute
					yield quotedPost.author as unknown as AppBskyActorDefs.ProfileViewBasic;
				}
			}
		}
	}
}

export function* findAllPostsInQueryData(
	queryClient: QueryClient,
	uri: string,
): Generator<AppBskyFeedDefs.PostView, undefined> {
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyFeedGetQuotes.OutputSchema>>({
		queryKey: [RQKEY_ROOT],
	});
	const atUri = parseResourceUri(uri);
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData?.pages) {
			for (const post of page.posts) {
				// TODO(atcute Phase 2.5): drop casts once quotes flip to @atcute
				if (didOrHandleUriMatches(atUri, post as unknown as AppBskyFeedDefsAtcute.PostView)) {
					yield post;
				}

				const quotedPost = getEmbeddedPost(post.embed);
				if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
					yield embedViewRecordToPostView(quotedPost) as unknown as AppBskyFeedDefs.PostView;
				}
			}
		}
	}
}
