import type { AppBskyActorDefs, AppBskyFeedDefs, AppBskyGraphDefs } from '@atcute/bluesky';
import {
	type Did,
	type ParsedCanonicalResourceUri,
	parseCanonicalResourceUri,
} from '@atcute/lexicons/syntax';

import { sanitizeDisplayName } from '#/lib/display-names';
import type { FeedDescriptor } from '#/lib/feeds/descriptor';
import type { Richtext, RichtextFacet } from '#/lib/rich-text';
import { feedTarget, listTarget } from '#/lib/routes/targets';

import { m } from '#/paraglide/messages';
import type { RouteTarget } from '#/router';

export type FeedSourceFeedInfo = {
	type: 'feed';
	uri: string;
	view?: AppBskyFeedDefs.GeneratorView;
	feedDescriptor: FeedDescriptor;
	target: RouteTarget;
	cid: string;
	avatar: string | undefined;
	displayName: string;
	description: Richtext | string | undefined;
	/** undefined on the pseudo-feeds (Following, the logged-out Discover stub), which have no creator. */
	creatorDid: Did | undefined;
	creatorHandle: string;
	likeCount: number | undefined;
	acceptsInteractions?: boolean;
	likeUri: string | undefined;
	contentMode: AppBskyFeedDefs.GeneratorView['contentMode'];
};

export type FeedSourceListInfo = {
	type: 'list';
	uri: string;
	view?: AppBskyGraphDefs.ListView;
	feedDescriptor: FeedDescriptor;
	target: RouteTarget;
	cid: string;
	avatar: string | undefined;
	displayName: string;
	description: Richtext | string | undefined;
	/** undefined on the pseudo-feeds (Following, the logged-out Discover stub), which have no creator. */
	creatorDid: Did | undefined;
	creatorHandle: string;
	contentMode: undefined;
};

export type FeedSourceInfo = FeedSourceFeedInfo | FeedSourceListInfo;

export type SavedFeedSourceInfo = FeedSourceInfo & {
	savedFeed: AppBskyActorDefs.SavedFeed;
};

export type SavedFeedItem =
	| {
			type: 'feed';
			config: AppBskyActorDefs.SavedFeed;
			view: AppBskyFeedDefs.GeneratorView;
	  }
	| {
			type: 'list';
			config: AppBskyActorDefs.SavedFeed;
			view: AppBskyGraphDefs.ListView;
	  }
	| {
			type: 'timeline';
			config: AppBskyActorDefs.SavedFeed;
			view: undefined;
	  };

export function isFeedSourceFeedInfo(feed: FeedSourceInfo): feed is FeedSourceFeedInfo {
	return feed.type === 'feed';
}

const feedSourceNSIDs = {
	feed: 'app.bsky.feed.generator',
	list: 'app.bsky.graph.list',
};

// both hydrators accept either kind of uri, and the collection decides which screen the source opens.
const recordTarget = (urip: ParsedCanonicalResourceUri): RouteTarget =>
	urip.collection === 'app.bsky.feed.generator'
		? feedTarget(urip.repo, urip.rkey)
		: listTarget(urip.repo, urip.rkey);

const hydrateDescription = (
	text: string | undefined,
	facets: RichtextFacet[] | undefined,
): Richtext | string | undefined => {
	if (!text) {
		return undefined;
	}

	if (facets) {
		return { text, facets };
	}

	return text;
};

export function hydrateFeedGenerator(view: AppBskyFeedDefs.GeneratorView): FeedSourceInfo {
	const urip = parseCanonicalResourceUri(view.uri);

	return {
		type: 'feed',
		uri: view.uri,
		view,
		feedDescriptor: { type: 'feedgen', uri: view.uri },
		cid: view.cid,
		target: recordTarget(urip),
		avatar: view.avatar,
		displayName: view.displayName
			? sanitizeDisplayName(view.displayName)
			: m['common.feeds.feedBy']({ handle: view.creator.handle }),
		description: hydrateDescription(view.description, view.descriptionFacets),
		creatorDid: view.creator.did,
		creatorHandle: view.creator.handle,
		likeCount: view.likeCount,
		acceptsInteractions: view.acceptsInteractions,
		likeUri: view.viewer?.like,
		contentMode: view.contentMode,
	};
}

export function hydrateList(view: AppBskyGraphDefs.ListView): FeedSourceInfo {
	const urip = parseCanonicalResourceUri(view.uri);

	return {
		type: 'list',
		uri: view.uri,
		view,
		feedDescriptor: { type: 'list', uri: view.uri },
		target: recordTarget(urip),
		cid: view.cid,
		avatar: view.avatar,
		description: hydrateDescription(view.description, view.descriptionFacets),
		creatorDid: view.creator.did,
		creatorHandle: view.creator.handle,
		displayName: view.name
			? sanitizeDisplayName(view.name)
			: m['state.list.byCreator']({ handle: view.creator.handle }),
		contentMode: undefined,
	};
}

export function getFeedTypeFromUri(uri: string) {
	const { collection } = parseCanonicalResourceUri(uri);
	return collection === feedSourceNSIDs.feed ? 'feed' : 'list';
}
