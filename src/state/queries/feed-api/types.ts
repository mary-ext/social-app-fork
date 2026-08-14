import type { AppBskyFeedDefs } from '@atcute/bluesky';

export interface FeedAPIResponse {
	cursor?: string;
	feed: AppBskyFeedDefs.FeedViewPost[];
}

/** inputs for fetching one page from a feed source. */
export interface FeedFetchOptions {
	cursor: string | undefined;
	limit: number;
	signal: AbortSignal;
}

export interface FeedAPI {
	peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost>;
	fetch(options: FeedFetchOptions): Promise<FeedAPIResponse>;
}
