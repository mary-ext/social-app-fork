import type { AppBskyFeedDefs } from '@atcute/bluesky';

export interface FeedAPIResponse {
	cursor?: string;
	feed: AppBskyFeedDefs.FeedViewPost[];
}

export interface FeedAPI {
	peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost>;
	fetch({ cursor, limit }: { cursor: string | undefined; limit: number }): Promise<FeedAPIResponse>;
}
