import { type AppBskyFeedDefs } from '@atcute/bluesky';
import { type Client } from '@atcute/client';
import { type Did, type ResourceUri } from '@atcute/lexicons';

import { PROD_DEFAULT_FEED } from '#/lib/constants';

import { CustomFeedAPI } from './custom';
import { FollowingFeedAPI } from './following';
import { type FeedAPI, type FeedAPIResponse } from './types';

// HACK
// the feed API does not include any facilities for passing down
// non-post elements. adding that is a bit of a heavy lift, and we
// have just one temporary usecase for it: flagging when the home feed
// falls back to discover.
// we use this fallback marker post to drive this instead. see Feed.tsx
// for the usage.
// -prf
export const FALLBACK_MARKER_POST: AppBskyFeedDefs.FeedViewPost = {
	post: {
		uri: 'fallback-marker-post' as ResourceUri,
		cid: 'fake',
		record: {},
		author: {
			did: 'did:fake' as Did,
			handle: 'fake.com',
		},
		indexedAt: new Date().toISOString(),
	},
};

export class HomeFeedAPI implements FeedAPI {
	appview: Client;
	following: FollowingFeedAPI;
	discover: CustomFeedAPI;
	usingDiscover = false;
	itemCursor = 0;
	userInterests?: string;

	constructor({ userInterests, appview }: { userInterests?: string; appview: Client }) {
		this.appview = appview;
		this.following = new FollowingFeedAPI({ appview });
		this.discover = new CustomFeedAPI({
			appview,
			feedParams: { feed: PROD_DEFAULT_FEED('whats-hot') as ResourceUri },
		});
		this.userInterests = userInterests;
	}

	reset() {
		this.following = new FollowingFeedAPI({ appview: this.appview });
		this.discover = new CustomFeedAPI({
			appview: this.appview,
			feedParams: { feed: PROD_DEFAULT_FEED('whats-hot') as ResourceUri },
			userInterests: this.userInterests,
		});
		this.usingDiscover = false;
		this.itemCursor = 0;
	}

	async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
		if (this.usingDiscover) {
			return this.discover.peekLatest();
		}
		return this.following.peekLatest();
	}

	async fetch({ cursor, limit }: { cursor: string | undefined; limit: number }): Promise<FeedAPIResponse> {
		if (!cursor) {
			this.reset();
		}

		let returnCursor;
		let posts: AppBskyFeedDefs.FeedViewPost[] = [];

		if (!this.usingDiscover) {
			const res = await this.following.fetch({ cursor, limit });
			returnCursor = res.cursor;
			posts = posts.concat(res.feed);
			if (!returnCursor) {
				cursor = '';
				posts.push(FALLBACK_MARKER_POST);
				this.usingDiscover = true;
			}
		}

		if (this.usingDiscover && !import.meta.env.DEV) {
			const res = await this.discover.fetch({ cursor, limit });
			returnCursor = res.cursor;
			posts = posts.concat(res.feed);
		}

		return {
			cursor: returnCursor,
			feed: posts,
		};
	}
}
