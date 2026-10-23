import type { AppBskyActorDefs, AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/bluesky';
import type { ModerationDecision } from '@atcute/bluesky-moderation';

import type { PostNumbering } from '#/lib/api/post-numbering';

import type { FeedTuner } from '#/state/queries/feed/lib/feed-tuner';

// #region post feeds

export interface FeedPostSliceItem {
	_reactKey: string;
	uri: string;
	post: AppBskyFeedDefs.PostView;
	record: AppBskyFeedPost.Main;
	postNumbering?: PostNumbering;
	moderation: ModerationDecision;
	parentAuthor?: AppBskyActorDefs.ProfileViewBasic;
	isParentBlocked?: boolean;
	isParentNotFound?: boolean;
}

export interface FeedPostSlice {
	_isFeedPostSlice: boolean;
	_reactKey: string;
	items: FeedPostSliceItem[];
	isIncompleteThread: boolean;
	feedContext: string | undefined;
	reqId: string | undefined;
	feedPostUri: string;
	reason?: AppBskyFeedDefs.FeedViewPost['reason'];
}

/** a post feed page as stored in the query cache, before tuning and moderation. */
export interface FeedPageUnselected {
	cursor: string | undefined;
	feed: AppBskyFeedDefs.FeedViewPost[];
	fetchedAt: number;
}

export interface FeedPage {
	tuner: FeedTuner;
	cursor: string | undefined;
	slices: FeedPostSlice[];
	fetchedAt: number;
}

// #endregion

// #region explore feed previews

export type FeedPreviewItem =
	| {
			type: 'preview:spacer';
			key: string;
	  }
	| {
			type: 'preview:loading';
			key: string;
	  }
	| {
			type: 'preview:error';
			key: string;
			message: string;
			error: string;
	  }
	| {
			type: 'preview:loadMoreError';
			key: string;
	  }
	| {
			type: 'preview:empty';
			key: string;
	  }
	| {
			type: 'preview:header';
			key: string;
			feed: AppBskyFeedDefs.GeneratorView;
	  }
	| {
			type: 'preview:footer';
			key: string;
	  }
	// copied from PostFeed.tsx
	| {
			type: 'preview:sliceItem';
			key: string;
			slice: FeedPostSlice;
			indexInSlice: number;
			feed: AppBskyFeedDefs.GeneratorView;
			showReplyTo: boolean;
			hideTopBorder: boolean;
	  }
	| {
			type: 'preview:sliceViewFullThread';
			key: string;
			uri: string;
	  };

// #endregion
