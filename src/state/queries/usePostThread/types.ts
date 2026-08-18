import type {
	AppBskyFeedDefs,
	AppBskyFeedPost,
	AppBskyFeedThreadgate,
	AppBskyUnspeccedDefs,
	AppBskyUnspeccedGetPostThreadOtherV2,
	AppBskyUnspeccedGetPostThreadV2,
} from '@atcute/bluesky';
import type { ModerationDecision } from '@atcute/bluesky-moderation';
import type { ResourceUri } from '@atcute/lexicons';

import type { RouteTarget } from '#/router';

export type ApiThreadItem =
	| AppBskyUnspeccedGetPostThreadV2.ThreadItem
	| AppBskyUnspeccedGetPostThreadOtherV2.ThreadItem;

export const postThreadQueryKeyRoot = 'post-thread-v2' as const;

export const createPostThreadQueryKey = (props: PostThreadParams) => [postThreadQueryKeyRoot, props] as const;

export const createPostThreadOtherQueryKey = (
	props: Omit<AppBskyUnspeccedGetPostThreadOtherV2.$params, 'anchor'> & {
		anchor?: string;
	},
) => [postThreadQueryKeyRoot, 'other', props] as const;

export type PostThreadParams = Pick<AppBskyUnspeccedGetPostThreadV2.$params, 'sort'> & {
	anchor?: string;
	view: 'tree' | 'linear';
};

export type UsePostThreadQueryResult = {
	hasOtherReplies: boolean;
	thread: AppBskyUnspeccedGetPostThreadV2.ThreadItem[];
	threadgate?: Omit<AppBskyFeedDefs.ThreadgateView, 'record'> & {
		record: AppBskyFeedThreadgate.Main;
	};
};

export type ThreadItem =
	| {
			type: 'threadPost';
			key: string;
			uri: ResourceUri;
			depth: number;
			value: Omit<AppBskyUnspeccedDefs.ThreadItemPost, 'post'> & {
				post: Omit<AppBskyFeedDefs.PostView, 'record'> & {
					record: AppBskyFeedPost.Main;
				};
			};
			isBlurred: boolean;
			moderation: ModerationDecision;
			ui: {
				isAnchor: boolean;
				showParentReplyLine: boolean;
				showChildReplyLine: boolean;
				indent: number;
				isLastChild: boolean;
				skippedIndentIndices: Set<number>;
				precedesChildReadMore: boolean;
			};
	  }
	| {
			type: 'threadPostNoUnauthenticated';
			key: string;
			uri: ResourceUri;
			depth: number;
			value: AppBskyUnspeccedDefs.ThreadItemNoUnauthenticated;
			ui: {
				showParentReplyLine: boolean;
				showChildReplyLine: boolean;
			};
	  }
	| {
			type: 'threadPostNotFound';
			key: string;
			uri: ResourceUri;
			depth: number;
			value: AppBskyUnspeccedDefs.ThreadItemNotFound;
	  }
	| {
			type: 'threadPostBlocked';
			key: string;
			uri: ResourceUri;
			depth: number;
			value: AppBskyUnspeccedDefs.ThreadItemBlocked;
	  }
	| {
			type: 'replyComposer';
			key: string;
	  }
	| {
			type: 'showOtherReplies';
			key: string;
			onPress: () => void;
	  }
	| {
			type: 'readMore';
			key: string;
			depth: number;
			target: RouteTarget;
			moreReplies: number;
			skippedIndentIndices: Set<number>;
	  }
	| {
			type: 'readMoreUp';
			key: string;
			target: RouteTarget;
	  }
	| {
			type: 'skeleton';
			key: string;
			item: 'anchor' | 'reply' | 'replyComposer';
	  };

/** metadata collected while traversing the raw data from the thread response. */
export type TraversalMetadata = {
	/** post depth; 0 is the root. */
	depth: number;
	/** true when an upward read-more link precedes this post. */
	followsReadMoreUp: boolean;
	/** true when this is the last reply beneath its parent. */
	isLastSibling: boolean;
	/** true when this is the last child in its branch. */
	isLastChild: boolean;
	/** starting depth when this is the last branch. */
	isPartOfLastBranchFromDepth?: number;
	/** depth of the next slice. */
	nextItemDepth?: number;
	/** live parent metadata reference. */
	parentMetadata?: TraversalMetadata;
	/** true when a child read-more link follows this item. */
	precedesChildReadMore: boolean;
	/** depth of the previous slice. */
	prevItemDepth?: number;
	/** data passed to read-more items. */
	postData: {
		uri: string;
		authorHandle: string;
	};
	/** total replies, including unhydrated replies. */
	repliesCount: number;
	/** replies not hydrated in the response. */
	repliesUnhydrated: number;
	/** 1-based count of rendered replies. */
	repliesSeenCounter: number;
	/** 0-based index in the parent post's replies. */
	replyIndex: number;
	/** reply-line indices to skip. */
	skippedIndentIndices: Set<number>;
	/** parent data for a later read-more link. */
	upcomingParentReadMore?: TraversalMetadata;
};
