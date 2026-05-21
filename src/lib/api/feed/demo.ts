import { type AppBskyFeedDefs } from '@atproto/api';

import { DEMO_FEED } from '#/lib/demo';

import { type BskyAppAgent } from '#/state/session/agent';

import { type FeedAPI, type FeedAPIResponse } from './types';

export class DemoFeedAPI implements FeedAPI {
	agent: BskyAppAgent;

	constructor({ agent }: { agent: BskyAppAgent }) {
		this.agent = agent;
	}

	async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
		return DEMO_FEED.feed[0]!;
	}

	async fetch(): Promise<FeedAPIResponse> {
		return DEMO_FEED;
	}
}
