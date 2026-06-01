import type { AppBskyFeedDefs, AppBskyFeedGetAuthorFeed } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';

import type { FeedAPI, FeedAPIResponse } from './types';

export class AuthorFeedAPI implements FeedAPI {
	appview: Client;
	_params: AppBskyFeedGetAuthorFeed.$params;

	constructor({ appview, feedParams }: { appview: Client; feedParams: AppBskyFeedGetAuthorFeed.$params }) {
		this.appview = appview;
		this._params = feedParams;
	}

	get params() {
		const params = { ...this._params };
		params.includePins = params.filter === 'posts_and_author_threads';
		return params;
	}

	async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
		const data = await ok(
			this.appview.get('app.bsky.feed.getAuthorFeed', {
				params: { ...this.params, limit: 1 },
			}),
		);
		return data.feed[0]!;
	}

	async fetch({ cursor, limit }: { cursor: string | undefined; limit: number }): Promise<FeedAPIResponse> {
		const data = await ok(
			this.appview.get('app.bsky.feed.getAuthorFeed', {
				params: { ...this.params, cursor, limit },
			}),
		);
		return {
			cursor: data.cursor,
			feed: this._filter(data.feed),
		};
	}

	_filter(feed: AppBskyFeedDefs.FeedViewPost[]) {
		if (this.params.filter === 'posts_and_author_threads') {
			return feed.filter((post) => {
				const isReply = post.reply;
				const isRepost = post.reason?.$type === 'app.bsky.feed.defs#reasonRepost';
				const isPin = post.reason?.$type === 'app.bsky.feed.defs#reasonPin';
				if (!isReply) return true;
				if (isRepost || isPin) return true;
				return isReply && isAuthorReplyChain(this.params.actor, post, feed);
			});
		}

		return feed;
	}
}

function isAuthorReplyChain(
	actor: string,
	post: AppBskyFeedDefs.FeedViewPost,
	posts: AppBskyFeedDefs.FeedViewPost[],
): boolean {
	// current post is by a different user (shouldn't happen)
	if (post.post.author.did !== actor) return false;

	const replyParent = post.reply?.parent;

	if (replyParent?.$type === 'app.bsky.feed.defs#postView') {
		// reply parent is by a different user
		if (replyParent.author.did !== actor) return false;

		// A top-level post that matches the parent of the current post.
		const parentPost = posts.find((p) => p.post.uri === replyParent.uri);

		/*
		 * Either we haven't fetched the parent at the top level, or the only
		 * record we have is on feedItem.reply.parent, which we've already checked
		 * above.
		 */
		if (!parentPost) return true;

		// Walk up to parent
		return isAuthorReplyChain(actor, parentPost, posts);
	}

	// Just default to showing it
	return true;
}
