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

/** stateless pagination: any instance can fetch any cursor for the same feed. */
export interface FeedAPI {
	/** @returns the newest post, or undefined for empty feeds and fixed post lists */
	peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost | undefined>;
	fetch(options: FeedFetchOptions): Promise<FeedAPIResponse>;
}
