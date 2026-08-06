import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { CanonicalResourceUri } from '@atcute/lexicons/syntax';

export const prodFeedUri = (rkey: string) =>
	`at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/${rkey}`;

const stagingFeedUri = (rkey: string) =>
	`at://did:plc:yofh3kx63drvfljkibw5zuxo/app.bsky.feed.generator/${rkey}`;

export const PROD_FEEDS = [`feedgen|${prodFeedUri('whats-hot')}`, `feedgen|${prodFeedUri('thevids')}`];

export const STAGING_FEEDS = [
	`feedgen|${stagingFeedUri('whats-hot')}`,
	`feedgen|${stagingFeedUri('thevids')}`,
];

const BSKY_APP_ACCOUNT_DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';

export const BSKY_FEED_OWNER_DIDS = [
	BSKY_APP_ACCOUNT_DID,
	'did:plc:vpkhqolt662uhesyj6nxm7ys',
	'did:plc:q6gjnaw2blty4crticxkmujt',
];

// bluesky's own trending feeds. these are presented as first-party surfaces rather than as someone's custom
// feed: no author, no like or pin controls, and the feed's description shown inline above the posts.
// matched on did only — upstream also compares the handle, but a handle is reassignable and the did already
// identifies the account.
export const TRENDING_DID = 'did:plc:qrz3lhbyuxbeilrc6nekdqme';

export const DISCOVER_FEED_URI: CanonicalResourceUri =
	'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot';
export const DISCOVER_SAVED_FEED = {
	type: 'feed',
	value: DISCOVER_FEED_URI,
	pinned: true,
};
export const TIMELINE_SAVED_FEED = {
	type: 'timeline',
	value: 'following',
	pinned: true,
};

export const RECOMMENDED_SAVED_FEEDS: Pick<AppBskyActorDefs.SavedFeed, 'type' | 'value' | 'pinned'>[] = [
	DISCOVER_SAVED_FEED,
	TIMELINE_SAVED_FEED,
];

export const KNOWN_SHUTDOWN_FEEDS = [
	'at://did:plc:wqowuobffl66jv3kpsvo7ak4/app.bsky.feed.generator/the-algorithm', // for you by skygaze
];
