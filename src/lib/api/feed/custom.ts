import type { AppBskyFeedDefs, AppBskyFeedGetFeed } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';

import { getContentLanguages } from '#/state/preferences/languages';

import type { FeedAPI, FeedAPIResponse } from './types';
import { createBskyTopicsHeader, isBlueskyOwnedFeed } from './utils';

export class CustomFeedAPI implements FeedAPI {
	appview: Client;
	params: AppBskyFeedGetFeed.$params;
	userInterests?: string;

	constructor({
		appview,
		feedParams,
		userInterests,
	}: {
		appview: Client;
		feedParams: AppBskyFeedGetFeed.$params;
		userInterests?: string;
	}) {
		this.appview = appview;
		this.params = feedParams;
		this.userInterests = userInterests;
	}

	async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
		const contentLangs = getContentLanguages().join(',');
		const data = await ok(
			this.appview.get('app.bsky.feed.getFeed', {
				params: { ...this.params, limit: 1 },
				headers: { 'Accept-Language': contentLangs },
			}),
		);
		return data.feed[0]!;
	}

	async fetch({ cursor, limit }: { cursor: string | undefined; limit: number }): Promise<FeedAPIResponse> {
		const contentLangs = getContentLanguages().join(',');
		const isBlueskyOwned = isBlueskyOwnedFeed(this.params.feed);
		const data = await ok(
			this.appview.get('app.bsky.feed.getFeed', {
				params: { ...this.params, cursor, limit },
				headers: {
					...(isBlueskyOwned ? createBskyTopicsHeader(this.userInterests) : {}),
					'Accept-Language': contentLangs,
				},
			}),
		);
		let feed = data.feed;
		// NOTE
		// some custom feeds fail to enforce the pagination limit
		// so we manually truncate here
		// -prf
		if (feed.length > limit) {
			feed = feed.slice(0, limit);
		}
		return {
			cursor: feed.length ? data.cursor : undefined,
			feed,
		};
	}
}
