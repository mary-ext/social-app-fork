/** post-feed error codes. */
export enum PostFeedErrorCode {
	Block = 'Block',
	FeedgenBadResponse = 'FeedgenBadResponse',
	FeedgenDoesNotExist = 'FeedgenDoesNotExist',
	FeedgenMisconfigured = 'FeedgenMisconfigured',
	FeedgenOffline = 'FeedgenOffline',
	FeedgenUnknown = 'FeedgenUnknown',
	FeedSignedInOnly = 'FeedSignedInOnly',
	FeedTooManyRequests = 'FeedTooManyRequests',
	Unknown = 'Unknown',
}
