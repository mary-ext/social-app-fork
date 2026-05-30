import { type AppBskyFeedDefs, type AppBskyFeedGetActorLikes } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';

import { type FeedAPI, type FeedAPIResponse } from './types';

export class LikesFeedAPI implements FeedAPI {
	appview: Client;
	params: AppBskyFeedGetActorLikes.$params;

	constructor({ appview, feedParams }: { appview: Client; feedParams: AppBskyFeedGetActorLikes.$params }) {
		this.appview = appview;
		this.params = feedParams;
	}

	async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
		const data = await ok(
			this.appview.get('app.bsky.feed.getActorLikes', {
				params: { ...this.params, limit: 1 },
			}),
		);
		return data.feed[0]!;
	}

	async fetch({ cursor, limit }: { cursor: string | undefined; limit: number }): Promise<FeedAPIResponse> {
		const data = await ok(
			this.appview.get('app.bsky.feed.getActorLikes', {
				params: { ...this.params, cursor, limit },
			}),
		);
		// HACKFIX: the API incorrectly returns a cursor when there are no items -sfn
		const isEmptyPage = data.feed.length === 0;
		return {
			cursor: isEmptyPage ? undefined : data.cursor,
			feed: data.feed,
		};
	}
}
