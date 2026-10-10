import type { AppBskyFeedGetPosts } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';

import type { FeedAPI, FeedAPIResponse, FeedFetchOptions } from './types';

export class PostListFeedAPI implements FeedAPI {
	appview: Client;
	params: AppBskyFeedGetPosts.$params;

	constructor({ appview, feedParams }: { appview: Client; feedParams: AppBskyFeedGetPosts.$params }) {
		this.appview = appview;
		this.params = {
			uris: feedParams.uris.slice(0, 25),
		};
	}

	peekLatest(): Promise<undefined> {
		return Promise.resolve(undefined);
	}

	async fetch({ signal }: FeedFetchOptions): Promise<FeedAPIResponse> {
		const data = await ok(
			this.appview.get('app.bsky.feed.getPosts', {
				signal,
				params: { ...this.params },
			}),
		);
		return {
			feed: data.posts.map((post) => ({ post })),
		};
	}
}
