import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';

import type { FeedAPI, FeedAPIResponse, FeedFetchOptions } from './types';

export class FollowingFeedAPI implements FeedAPI {
	appview: Client;

	constructor({ appview }: { appview: Client }) {
		this.appview = appview;
	}

	async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
		const data = await ok(
			this.appview.get('app.bsky.feed.getTimeline', {
				params: { limit: 1 },
			}),
		);
		return data.feed[0]!;
	}

	async fetch({ cursor, limit, signal }: FeedFetchOptions): Promise<FeedAPIResponse> {
		const data = await ok(
			this.appview.get('app.bsky.feed.getTimeline', {
				signal,
				params: { cursor, limit },
			}),
		);
		return {
			cursor: data.cursor,
			feed: data.feed,
		};
	}
}
