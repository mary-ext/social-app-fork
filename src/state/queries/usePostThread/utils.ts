import type {
	AppBskyFeedDefs,
	AppBskyFeedThreadgate,
	AppBskyUnspeccedGetPostThreadV2,
} from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { getPostRecord } from '#/lib/api/record-casts';

import { isDevMode } from '#/state/preferences/dev-mode';
import type { ApiThreadItem, ThreadItem, TraversalMetadata } from '#/state/queries/usePostThread/types';

export function getThreadgateRecord(
	view: AppBskyUnspeccedGetPostThreadV2.$output['threadgate'],
): AppBskyFeedThreadgate.Main | undefined {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- view defs type `record` as `unknown`; the collection is fixed by the view type
	return view?.record as AppBskyFeedThreadgate.Main | undefined;
}

export function getRootPostAtUri(post: AppBskyFeedDefs.PostView) {
	const record = getPostRecord(post);
	if (!record.reply) {
		return parseCanonicalResourceUri(post.uri);
	}
	if (record.reply?.root?.uri) {
		return parseCanonicalResourceUri(record.reply.root.uri);
	}
}

export function getTraversalMetadata({
	item,
	prevItem,
	nextItem,
	parentMetadata,
}: {
	item: ApiThreadItem;
	prevItem?: ApiThreadItem;
	nextItem?: ApiThreadItem;
	parentMetadata?: TraversalMetadata;
}): TraversalMetadata {
	if (item.value.$type !== 'app.bsky.unspecced.defs#threadItemPost') {
		throw new Error(`Expected thread item to be a post`);
	}
	const repliesCount = item.value.post.replyCount || 0;
	const repliesUnhydrated = item.value.moreReplies || 0;
	const metadata = {
		depth: item.depth,
		isLastChild: false,
		isLastSibling: false,
		isPartOfLastBranchFromDepth: item.depth === 1 ? 1 : undefined,
		nextItemDepth: nextItem?.depth,
		parentMetadata,
		prevItemDepth: prevItem?.depth,
		precedesChildReadMore: false,
		followsReadMoreUp: false,
		postData: {
			uri: item.uri,
			authorHandle: item.value.post.author.handle,
		},
		repliesCount,
		repliesUnhydrated,
		repliesSeenCounter: 0,
		replyIndex: 0,
		skippedIndentIndices: new Set<number>(),
	};

	if (isDevMode()) {
		// @ts-ignore dev only for debugging
		metadata.postData.text = getPostRecord(item.value.post).text;
	}

	return metadata;
}

export function storeTraversalMetadata(
	metadatas: Map<string, TraversalMetadata>,
	metadata: TraversalMetadata,
) {
	metadatas.set(metadata.postData.uri, metadata);

	if (isDevMode()) {
		// @ts-ignore dev only for debugging
		metadatas.set(metadata.postData.text, metadata);
		// @ts-ignore
		window.__thread = metadatas;
	}
}

export function getThreadPostUI({
	depth,
	repliesCount,
	prevItemDepth,
	isLastChild,
	skippedIndentIndices,
	repliesSeenCounter,
	repliesUnhydrated,
	precedesChildReadMore,
	followsReadMoreUp,
}: TraversalMetadata): Extract<ThreadItem, { type: 'threadPost' }>['ui'] {
	const isReplyAndHasReplies =
		depth > 0 &&
		repliesCount > 0 &&
		(repliesCount - repliesUnhydrated === repliesSeenCounter || repliesSeenCounter > 0);
	return {
		isAnchor: depth === 0,
		showParentReplyLine:
			followsReadMoreUp || (!!prevItemDepth && prevItemDepth !== 0 && prevItemDepth < depth),
		showChildReplyLine: depth < 0 || isReplyAndHasReplies,
		indent: depth,
		isLastChild,
		skippedIndentIndices,
		precedesChildReadMore: precedesChildReadMore ?? false,
	};
}

export function getThreadPostNoUnauthenticatedUI({
	depth,
	prevItemDepth,
}: {
	depth: number;
	prevItemDepth?: number;
	nextItemDepth?: number;
}): Extract<ThreadItem, { type: 'threadPostNoUnauthenticated' }>['ui'] {
	return {
		showChildReplyLine: depth < 0,
		showParentReplyLine: !!(prevItemDepth && prevItemDepth < depth),
	};
}
