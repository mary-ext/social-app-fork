import { type Insets } from 'react-native';
import { type AppBskyActorDefs, BSKY_LABELER_DID } from '@atproto/api';

import { type ProxyHeaderValue } from '#/state/session/agent';

import { BLUESKY_PROXY_DID, CHAT_PROXY_DID } from '#/env';

export const LOCAL_DEV_SERVICE = 'http://localhost:2583';
export const BSKY_SERVICE = 'https://bsky.social';
export const BSKY_SERVICE_DID = 'did:web:bsky.social';
export const PUBLIC_BSKY_SERVICE = 'https://public.api.bsky.app';
export const DEFAULT_SERVICE = BSKY_SERVICE;
export const BSKY_DOWNLOAD_URL = 'https://bsky.app/download';
export const STARTER_PACK_MAX_SIZE = 150;
export const CARD_ASPECT_RATIO = 1200 / 630;

export const MAX_DISPLAY_NAME = 64;
export const MAX_DESCRIPTION = 256;

export const MAX_GRAPHEME_LENGTH = 300;

export const MAX_DRAFT_GRAPHEME_LENGTH = 1000;

export const MAX_DM_GRAPHEME_LENGTH = 1000;

// Recommended is 100 per: https://www.w3.org/WAI/GL/WCAG20/tests/test3.html
// but increasing limit per user feedback
export const MAX_ALT_TEXT = 2000;

export const MAX_REPORT_REASON_GRAPHEME_LENGTH = 2000;

export function IS_TEST_USER(handle?: string) {
	return handle && handle?.endsWith('.test');
}

export const PROD_DEFAULT_FEED = (rkey: string) =>
	`at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/${rkey}`;

const STAGING_DEFAULT_FEED = (rkey: string) =>
	`at://did:plc:yofh3kx63drvfljkibw5zuxo/app.bsky.feed.generator/${rkey}`;

export const PROD_FEEDS = [
	`feedgen|${PROD_DEFAULT_FEED('whats-hot')}`,
	`feedgen|${PROD_DEFAULT_FEED('thevids')}`,
];

export const STAGING_FEEDS = [
	`feedgen|${STAGING_DEFAULT_FEED('whats-hot')}`,
	`feedgen|${STAGING_DEFAULT_FEED('thevids')}`,
];

export const POST_IMG_MAX = {
	width: 2000,
	height: 2000,
	size: 1000000,
};

export const LINK_META_PROXY = 'https://cardyb.bsky.app/v1/extract?url=';

// Hitslop constants
export const createHitslop = (size: number): Insets => ({
	top: size,
	left: size,
	bottom: size,
	right: size,
});
export const HITSLOP_10 = createHitslop(10);
export const HITSLOP_20 = createHitslop(20);
export const HITSLOP_30 = createHitslop(30);
export const LANG_DROPDOWN_HITSLOP = { top: 10, bottom: 10, left: 4, right: 4 };
export const BACK_HITSLOP = HITSLOP_30;
export const MAX_POST_LINES = 25;

const BSKY_APP_ACCOUNT_DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';

export const BSKY_FEED_OWNER_DIDS = [
	BSKY_APP_ACCOUNT_DID,
	'did:plc:vpkhqolt662uhesyj6nxm7ys',
	'did:plc:q6gjnaw2blty4crticxkmujt',
];

export const DISCOVER_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot';
export const VIDEO_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/thevids';
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

const GIF_SERVICE = 'https://gifs.bsky.app';

export const GIF_KLIPY_SEARCH = (params: string) => `${GIF_SERVICE}/klipy/v2/search?${params}`;
export const GIF_KLIPY_FEATURED = (params: string) => `${GIF_SERVICE}/klipy/v2/featured?${params}`;

export const MAX_LABELERS = 20;

export const VIDEO_SERVICE = 'https://video.bsky.app';
export const VIDEO_SERVICE_DID = 'did:web:video.bsky.app';

export const VIDEO_MAX_DURATION_MS = 3 * 60 * 1000; // 3 minutes in milliseconds
/** Maximum size of a video in megabytes, _not_ mebibytes. Backend uses ISO megabytes. */
export const VIDEO_MAX_SIZE = 1000 * 1000 * 300; // 300mb

export const SUPPORTED_MIME_TYPES = [
	'video/mp4',
	'video/mpeg',
	'video/webm',
	'video/quicktime',
	'image/gif',
] as const;

export type SupportedMimeTypes = (typeof SUPPORTED_MIME_TYPES)[number];

export const EMOJI_REACTION_LIMIT = 5;

export const urls = {
	website: {
		blog: {
			findFriendsAnnouncement: 'https://bsky.social/about/blog/12-16-2025-find-friends',
			initialVerificationAnnouncement: `https://bsky.social/about/blog/04-21-2025-verification`,
			searchTipsAndTricks: 'https://bsky.social/about/blog/05-31-2024-search',
		},
		support: {
			findFriendsPrivacyPolicy: 'https://bsky.social/about/support/find-friends-privacy-policy',
		},
	},
};

// temp hack for e2e - esb
export const BLUESKY_PROXY_HEADER = {
	value: `${BLUESKY_PROXY_DID}#bsky_appview`,
	get() {
		return this.value as ProxyHeaderValue;
	},
	set(value: string) {
		this.value = value;
	},
};

export const DM_SERVICE_HEADERS = {
	'atproto-proxy': `${CHAT_PROXY_DID}#bsky_chat`,
};

export const BLUESKY_MOD_SERVICE_HEADERS = {
	'atproto-proxy': `${BSKY_LABELER_DID}#atproto_labeler`,
};
