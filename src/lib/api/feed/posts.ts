import type { AppBskyFeedDefs, AppBskyFeedGetPosts } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';

import { logger } from '#/logger';

import type { FeedAPI, FeedAPIResponse } from './types';

export class PostListFeedAPI implements FeedAPI {
	appview: Client;
	params: AppBskyFeedGetPosts.$params;
	peek: AppBskyFeedDefs.FeedViewPost | null = null;

	constructor({ appview, feedParams }: { appview: Client; feedParams: AppBskyFeedGetPosts.$params }) {
		this.appview = appview;
		if (feedParams.uris.length > 25) {
			logger.warn(`Too many URIs provided - expected 25, got ${feedParams.uris.length}`);
		}
		this.params = {
			uris: feedParams.uris.slice(0, 25),
		};
	}

	// async kept for FeedAPI conformance (peekLatest(): Promise<...>); this impl returns the cached
	// peek set during fetch() rather than making a network call, so it has no await.
	// eslint-disable-next-line @typescript-eslint/require-await -- see comment above
	async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
		if (this.peek) return this.peek;
		throw new Error('Has not fetched yet');
	}

	async fetch({}: {}): Promise<FeedAPIResponse> {
		const data = await ok(
			this.appview.get('app.bsky.feed.getPosts', {
				params: { ...this.params },
			}),
		);
		this.peek = { post: data.posts[0]! };
		return {
			feed: data.posts.map((post) => ({ post })),
		};
	}
}
