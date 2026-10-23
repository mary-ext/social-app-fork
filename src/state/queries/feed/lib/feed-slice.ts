import {
	unwrapQuoteEmbed,
	unwrapRecordEmbed,
	type AppBskyActorDefs,
	type AppBskyFeedDefs,
	type AppBskyFeedPost,
} from '@atcute/bluesky';

import type { PostNumbering } from '#/lib/api/post-numbering';
import { getPostRecord } from '#/lib/api/record-casts';

type FeedSliceItem = {
	post: AppBskyFeedDefs.PostView;
	record: AppBskyFeedPost.Main;
	postNumbering: PostNumbering | undefined;
	parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
	isParentBlocked: boolean;
	isParentNotFound: boolean;
};

// ancestors omit numbering; infer contiguous OP-thread positions from the selected post.
const inferParentNumbering = (leaf: PostNumbering | undefined): PostNumbering | undefined => {
	return leaf !== undefined && leaf.index > 1 ? { index: leaf.index - 1, count: leaf.count } : undefined;
};

const inferRootNumbering = (leaf: PostNumbering | undefined): PostNumbering | undefined => {
	return leaf !== undefined ? { index: 1, count: leaf.count } : undefined;
};

/** authors of a feed post and its reply ancestors. */
export type AuthorContext = {
	author: AppBskyActorDefs.ProfileViewBasic;
	parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
	grandparentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
	rootAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
};

/** a feed post expanded with its reply root and parent, as rendered in a feed. */
export class FeedViewPostsSlice {
	_reactKey: string;
	_feedPost: AppBskyFeedDefs.FeedViewPost;
	items: FeedSliceItem[];
	isIncompleteThread: boolean;
	isOrphan: boolean;
	isThreadMuted: boolean;
	rootUri: string;
	feedPostUri: string;

	constructor(
		feedPost: AppBskyFeedDefs.FeedViewPost,
		numbering: PostNumbering | undefined,
		postNumberingByUri: Map<string, PostNumbering>,
	) {
		const { post, reply, reason } = feedPost;
		this.items = [];
		this.isIncompleteThread = false;
		this.isOrphan = false;
		this.isThreadMuted = post.viewer?.threadMuted ?? false;
		this.feedPostUri = post.uri;
		if (reply?.root?.$type === 'app.bsky.feed.defs#postView') {
			this.rootUri = reply.root.uri;
		} else {
			this.rootUri = post.uri;
		}
		this._feedPost = feedPost;
		this._reactKey = `slice-${post.uri}-${
			feedPost.reason && 'indexedAt' in feedPost.reason ? feedPost.reason.indexedAt : post.indexedAt
		}`;
		const record = getPostRecord(post);
		const parent = reply?.parent;
		const isParentBlocked = parent?.$type === 'app.bsky.feed.defs#blockedPost';
		const isParentNotFound = parent?.$type === 'app.bsky.feed.defs#notFoundPost';
		let parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
		if (parent?.$type === 'app.bsky.feed.defs#postView') {
			parentAuthor = parent.author;
		}
		this.items.push({
			post,
			record,
			postNumbering: numbering,
			parentAuthor,
			isParentBlocked,
			isParentNotFound,
		});
		if (!reply) {
			if (record.reply) {
				// the AppView returned an incomplete reply.
				this.isOrphan = true;
				this.items[0]!.isParentNotFound = true;
			}
			return;
		}
		if (reason) {
			return;
		}
		if (parent?.$type !== 'app.bsky.feed.defs#postView') {
			this.isOrphan = true;
			return;
		}
		const parentRecord = getPostRecord(parent);
		const root = reply.root;
		const rootIsView =
			root?.$type === 'app.bsky.feed.defs#postView' ||
			root?.$type === 'app.bsky.feed.defs#blockedPost' ||
			root?.$type === 'app.bsky.feed.defs#notFoundPost';
		// when parent and root match, the root contains the grandparent state.
		const grandparent = rootIsView && parentRecord.reply?.parent.uri === root.uri ? root : undefined;
		const grandparentAuthor = reply.grandparentAuthor;
		const isGrandparentBlocked = !!(grandparent && grandparent.$type === 'app.bsky.feed.defs#blockedPost');
		const isGrandparentNotFound = !!(grandparent && grandparent.$type === 'app.bsky.feed.defs#notFoundPost');
		this.items.unshift({
			post: parent,
			record: parentRecord,
			postNumbering: postNumberingByUri.get(parent.uri) ?? inferParentNumbering(numbering),
			parentAuthor: grandparentAuthor,
			isParentBlocked: isGrandparentBlocked,
			isParentNotFound: isGrandparentNotFound,
		});
		if (isGrandparentBlocked) {
			this.isOrphan = true;
			// retain the slice for thread deduplication.
		}
		if (root?.$type !== 'app.bsky.feed.defs#postView') {
			this.isOrphan = true;
			return;
		}
		if (root.uri === parent.uri) {
			return;
		}
		this.items.unshift({
			post: root,
			record: getPostRecord(root),
			postNumbering: postNumberingByUri.get(root.uri) ?? inferRootNumbering(numbering),
			isParentBlocked: false,
			isParentNotFound: false,
			parentAuthor: undefined,
		});
		if (parentRecord.reply?.parent.uri !== root.uri) {
			this.isIncompleteThread = true;
		}
	}

	get isQuotePost() {
		return !!unwrapQuoteEmbed(unwrapRecordEmbed(this._feedPost.post.embed));
	}

	get isReply() {
		return !!getPostRecord(this._feedPost.post).reply;
	}

	get reason() {
		return this._feedPost.reason;
	}

	get feedContext() {
		return this._feedPost.feedContext;
	}

	get reqId() {
		return this._feedPost.reqId;
	}

	get isRepost() {
		const reason = this._feedPost.reason;
		return reason?.$type === 'app.bsky.feed.defs#reasonRepost';
	}

	getAuthors(): AuthorContext {
		const feedPost = this._feedPost;
		const author: AppBskyActorDefs.ProfileViewBasic = feedPost.post.author;
		let parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
		let grandparentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
		let rootAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
		if (feedPost.reply) {
			if (feedPost.reply.parent?.$type === 'app.bsky.feed.defs#postView') {
				parentAuthor = feedPost.reply.parent.author;
			}
			if (feedPost.reply.grandparentAuthor) {
				grandparentAuthor = feedPost.reply.grandparentAuthor;
			}
			if (feedPost.reply.root?.$type === 'app.bsky.feed.defs#postView') {
				rootAuthor = feedPost.reply.root.author;
			}
		}
		return {
			author,
			parentAuthor,
			grandparentAuthor,
			rootAuthor,
		};
	}
}
