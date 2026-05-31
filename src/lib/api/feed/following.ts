import { type AppBskyFeedDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';

import { type FeedAPI, type FeedAPIResponse } from './types';

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

	async fetch({ cursor, limit }: { cursor: string | undefined; limit: number }): Promise<FeedAPIResponse> {
		const data = await ok(
			this.appview.get('app.bsky.feed.getTimeline', {
				params: { cursor, limit },
			}),
		);
		return {
			cursor: data.cursor,
			feed: data.feed,
		};
	}
}
