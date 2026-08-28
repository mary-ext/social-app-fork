import type { AppBskyFeedDefs, AppBskyFeedGetFeed } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';

import { getContentLanguages } from '#/state/preferences/languages';

import type { FeedAPI, FeedAPIResponse, FeedFetchOptions } from './types';
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
				headers: { 'Accept-Language': contentLangs },
				params: { ...this.params, limit: 1 },
			}),
		);
		return data.feed[0]!;
	}

	async fetch({ cursor, limit, signal }: FeedFetchOptions): Promise<FeedAPIResponse> {
		const contentLangs = getContentLanguages().join(',');
		const isBlueskyOwned = isBlueskyOwnedFeed(this.params.feed);
		const data = await ok(
			this.appview.get('app.bsky.feed.getFeed', {
				signal,
				headers: {
					...(isBlueskyOwned ? createBskyTopicsHeader(this.userInterests) : {}),
					'Accept-Language': contentLangs,
				},
				params: { ...this.params, cursor, limit },
			}),
		);
		let feed = data.feed;
		// some custom feeds ignore the pagination limit.
		if (feed.length > limit) {
			feed = feed.slice(0, limit);
		}
		return {
			cursor: data.cursor,
			feed,
		};
	}
}
