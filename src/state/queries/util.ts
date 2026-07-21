import {
	unwrapRecordEmbed,
	type AppBskyActorDefs,
	type AppBskyEmbedRecord,
	type AppBskyFeedDefs,
} from '@atcute/bluesky';
import type { ParsedResourceUri } from '@atcute/lexicons/syntax';

import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/react-query';

export type StructuredQueryKey<T extends Record<string, unknown>> = readonly [
	string,
	T,
	{
		persistedVersion?: number;
	},
];

/** Helper method to ensure consistent query keys and key ordering */
export function createQueryKey<T extends Record<string, unknown>>(
	/** The query key root. All queries must have a root. */
	root: string,
	/** Any arguments the query depends on, and if changed, should result in the query being refetched. */
	args: T,
	options: {
		/**
		 * version of the persisted query format.
		 *
		 * set `gcTime: GCTIME.INFINITY` to prevent the persisted query from being garbage collected immediately.
		 */
		persistedVersion?: number;
	} = {},
): StructuredQueryKey<T> {
	return [root, args, options] as const;
}

export function isQueryPersisted(
	queryKey: QueryKey,
): queryKey is StructuredQueryKey<Record<string, unknown>> {
	if (!Array.isArray(queryKey) || queryKey.length !== 3) {
		return false;
	}
	if (typeof queryKey[0] !== 'string') {
		return false;
	}
	if (typeof queryKey[1] !== 'object' || queryKey[1] === null) {
		return false;
	}
	const options: unknown = queryKey[2];
	if (typeof options !== 'object' || options === null) {
		return false;
	}
	return 'persistedVersion' in options && typeof options.persistedVersion === 'number';
}

export async function truncateAndInvalidate(queryClient: QueryClient, queryKey: QueryKey) {
	queryClient.setQueriesData<InfiniteData<unknown>>({ queryKey }, (data) => {
		if (data) {
			return {
				pageParams: data.pageParams.slice(0, 1),
				pages: data.pages.slice(0, 1),
			};
		}
		return data;
	});
	return queryClient.invalidateQueries({ queryKey });
}

// Given a parsed at:// URI, this function will check if it matches a
// hit regardless of whether the URI uses a DID or handle as the repo.
//
// atUri should be the URI that is being searched for, while record.uri
// is the URI that is being checked. record.author is the author of the
// URI that is being checked.
export function didOrHandleUriMatches(
	atUri: ParsedResourceUri,
	record: { uri: string; author: AppBskyActorDefs.ProfileViewBasic },
) {
	if (atUri.rkey === undefined) {
		return false;
	}
	if (atUri.repo.startsWith('did:')) {
		return `at://${atUri.repo}/${atUri.collection}/${atUri.rkey}` === record.uri;
	}
	return atUri.repo === record.author.handle && record.uri.endsWith(atUri.rkey);
}

export function getEmbeddedPost(
	embed: AppBskyFeedDefs.PostView['embed'],
): AppBskyEmbedRecord.ViewRecord | undefined {
	const record = unwrapRecordEmbed(embed);
	if (record?.$type === 'app.bsky.embed.record#viewRecord') {
		return record;
	}
}

export function embedViewRecordToPostView(v: AppBskyEmbedRecord.ViewRecord): AppBskyFeedDefs.PostView {
	return {
		uri: v.uri,
		cid: v.cid,
		author: v.author,
		record: v.value,
		indexedAt: v.indexedAt,
		labels: v.labels,
		embed: v.embeds?.[0],
		likeCount: v.likeCount,
		quoteCount: v.quoteCount,
		replyCount: v.replyCount,
		repostCount: v.repostCount,
	};
}
