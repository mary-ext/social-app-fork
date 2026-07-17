import {
	unwrapQuoteEmbed,
	unwrapRecordEmbed,
	type AppBskyEmbedRecord,
	type AppBskyEmbedRecordWithMedia,
	type AppBskyFeedDefs,
	type AppBskyFeedPostgate,
} from '@atcute/bluesky';
import type { $type, ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

export const POSTGATE_COLLECTION = 'app.bsky.feed.postgate';

export function createPostgateRecord(
	postgate: Partial<AppBskyFeedPostgate.Main> & {
		post: AppBskyFeedPostgate.Main['post'];
	},
): AppBskyFeedPostgate.Main {
	return {
		$type: POSTGATE_COLLECTION,
		createdAt: new Date().toISOString(),
		post: postgate.post,
		detachedEmbeddingUris: postgate.detachedEmbeddingUris || [],
		embeddingRules: postgate.embeddingRules || [],
	};
}

export function mergePostgateRecords(
	prev: AppBskyFeedPostgate.Main,
	next: Partial<AppBskyFeedPostgate.Main>,
) {
	const detachedEmbeddingUris = Array.from(
		new Set([...(prev.detachedEmbeddingUris || []), ...(next.detachedEmbeddingUris || [])]),
	);
	const embeddingRules = [...(prev.embeddingRules || []), ...(next.embeddingRules || [])].filter(
		(rule, i, all) => all.findIndex((_rule) => _rule.$type === rule.$type) === i,
	);
	return createPostgateRecord({
		post: prev.post,
		detachedEmbeddingUris,
		embeddingRules,
	});
}

export function createEmbedViewDetachedRecord({
	uri,
}: {
	uri: ResourceUri;
}): $type.enforce<AppBskyEmbedRecord.View> {
	const record: $type.enforce<AppBskyEmbedRecord.ViewDetached> = {
		$type: 'app.bsky.embed.record#viewDetached',
		uri,
		detached: true,
	};
	return {
		$type: 'app.bsky.embed.record#view',
		record,
	};
}

export function createMaybeDetachedQuoteEmbed({
	post,
	quote,
	quoteUri,
	detached,
}:
	| {
			post: AppBskyFeedDefs.PostView;
			quote: AppBskyFeedDefs.PostView;
			quoteUri: undefined;
			detached: false;
	  }
	| {
			post: AppBskyFeedDefs.PostView;
			quote: undefined;
			quoteUri: ResourceUri;
			detached: true;
	  }): AppBskyEmbedRecord.View | AppBskyEmbedRecordWithMedia.View | undefined {
	if (post.embed?.$type === 'app.bsky.embed.record#view') {
		if (detached) {
			return createEmbedViewDetachedRecord({ uri: quoteUri });
		} else {
			return createEmbedRecordView({ post: quote });
		}
	} else if (post.embed?.$type === 'app.bsky.embed.recordWithMedia#view') {
		if (detached) {
			return {
				...post.embed,
				record: createEmbedViewDetachedRecord({ uri: quoteUri }),
			};
		} else {
			return createEmbedRecordWithMediaView({ post, quote });
		}
	}
}

export function createEmbedViewRecordFromPost(
	post: AppBskyFeedDefs.PostView,
): $type.enforce<AppBskyEmbedRecord.ViewRecord> {
	return {
		$type: 'app.bsky.embed.record#viewRecord',
		uri: post.uri,
		cid: post.cid,
		author: post.author,
		value: post.record,
		labels: post.labels,
		replyCount: post.replyCount,
		repostCount: post.repostCount,
		likeCount: post.likeCount,
		quoteCount: post.quoteCount,
		indexedAt: post.indexedAt,
		embeds: post.embed ? [post.embed] : [],
	};
}

export function createEmbedRecordView({ post }: { post: AppBskyFeedDefs.PostView }): AppBskyEmbedRecord.View {
	return {
		$type: 'app.bsky.embed.record#view',
		record: createEmbedViewRecordFromPost(post),
	};
}

export function createEmbedRecordWithMediaView({
	post,
	quote,
}: {
	post: AppBskyFeedDefs.PostView;
	quote: AppBskyFeedDefs.PostView;
}): AppBskyEmbedRecordWithMedia.View | undefined {
	if (!(post.embed?.$type === 'app.bsky.embed.recordWithMedia#view')) return;
	return {
		...post.embed,
		record: {
			record: createEmbedViewRecordFromPost(quote),
		},
	};
}

export function getMaybeDetachedQuoteEmbed({
	viewerDid,
	post,
}: {
	viewerDid: string;
	post: AppBskyFeedDefs.PostView;
}) {
	const record = unwrapQuoteEmbed(unwrapRecordEmbed(post.embed));
	if (!record) {
		return;
	}

	switch (record.$type) {
		case 'app.bsky.embed.record#viewDetached': {
			const uri = record.uri;
			return {
				embed: post.embed,
				uri,
				isOwnedByViewer: parseCanonicalResourceUri(uri).repo === viewerDid,
				isDetached: true,
			};
		}
		case 'app.bsky.embed.record#viewRecord': {
			const uri = record.uri;
			return {
				embed: post.embed,
				uri,
				isOwnedByViewer: parseCanonicalResourceUri(uri).repo === viewerDid,
				isDetached: false,
			};
		}
	}
}

export const embeddingRules = {
	disableRule: { $type: 'app.bsky.feed.postgate#disableRule' },
};
