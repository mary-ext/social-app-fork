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
			/*
			 * Read more replies, downwards in the thread.
			 */
			type: 'readMore';
			key: string;
			depth: number;
			href: string;
			moreReplies: number;
			skippedIndentIndices: Set<number>;
	  }
	| {
			/*
			 * Read more parents, upwards in the thread.
			 */
			type: 'readMoreUp';
			key: string;
			href: string;
	  }
	| {
			type: 'skeleton';
			key: string;
			item: 'anchor' | 'reply' | 'replyComposer';
	  };

/** metadata collected while traversing the raw data from the thread response. */
export type TraversalMetadata = {
	/** The depth of the post in the reply tree, where 0 is the root post. This is calculated on the server. */
	depth: number;
	/** Indicates if this item is a "read more" link preceding this post that continues the thread upwards. */
	followsReadMoreUp: boolean;
	/** Indicates if the post is the last reply beneath its parent post. */
	isLastSibling: boolean;
	/** Indicates the post is the end-of-the-line for a given branch of replies. */
	isLastChild: boolean;
	/**
	 * Indicates if the post is the left-most AND lower-most branch of the reply tree. Value corresponds to the
	 * depth at which this branch started.
	 */
	isPartOfLastBranchFromDepth?: number;
	/** The depth of the slice immediately following this one, if it exists. */
	nextItemDepth?: number;
	/**
	 * This is a live reference to the parent metadata object. Mutations to this are available for later use in
	 * children.
	 */
	parentMetadata?: TraversalMetadata;
	/**
	 * Populated during the final traversal of the thread. Denotes whether there is a "Read more" link for this
	 * item immediately following this item.
	 */
	precedesChildReadMore: boolean;
	/** The depth of the slice immediately preceding this one, if it exists. */
	prevItemDepth?: number;
	/** Any data needed to be passed along to the "read more" items. Keep this trim for better memory usage. */
	postData: {
		uri: string;
		authorHandle: string;
	};
	/** The total number of replies to this post, including those not hydrated and returned by the response. */
	repliesCount: number;
	/** The number of replies to this post not hydrated and returned by the response. */
	repliesUnhydrated: number;
	/**
	 * number of rendered replies encountered during traversal, excluding moderated or unhydrated replies.
	 * 1-based counter.
	 */
	repliesSeenCounter: number;
	/** 0-based index of this reply in the parent post's replies. */
	replyIndex: number;
	/** line indices to skip when rendering reply lines for the slice, based on its depth */
	skippedIndentIndices: Set<number>;
	/**
	 * stores parent data if that parent has additional unhydrated replies to pass down to children along the
	 * left/lower-most branch of the tree for rendering a "read more" link at the end
	 */
	upcomingParentReadMore?: TraversalMetadata;
};
