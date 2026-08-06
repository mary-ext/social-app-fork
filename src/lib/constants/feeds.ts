import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { CanonicalResourceUri } from '@atcute/lexicons/syntax';

const BSKY_APP_ACCOUNT_DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';

export const bskyFeedUri = (rkey: string) => `at://${BSKY_APP_ACCOUNT_DID}/app.bsky.feed.generator/${rkey}`;

export const FIRST_PARTY_FEEDS = [`feedgen|${bskyFeedUri('whats-hot')}`, `feedgen|${bskyFeedUri('thevids')}`];

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
