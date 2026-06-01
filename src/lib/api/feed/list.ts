import type { AppBskyFeedDefs, AppBskyFeedGetListFeed } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';

import type { FeedAPI, FeedAPIResponse } from './types';

export class ListFeedAPI implements FeedAPI {
	appview: Client;
	params: AppBskyFeedGetListFeed.$params;

	constructor({ appview, feedParams }: { appview: Client; feedParams: AppBskyFeedGetListFeed.$params }) {
		this.appview = appview;
		this.params = feedParams;
	}

	async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
		const data = await ok(
			this.appview.get('app.bsky.feed.getListFeed', {
				params: { ...this.params, limit: 1 },
			}),
		);
		return data.feed[0]!;
	}

	async fetch({ cursor, limit }: { cursor: string | undefined; limit: number }): Promise<FeedAPIResponse> {
		const data = await ok(
			this.appview.get('app.bsky.feed.getListFeed', {
				params: { ...this.params, cursor, limit },
			}),
		);
		return {
			cursor: data.cursor,
			feed: data.feed,
		};
	}
}
