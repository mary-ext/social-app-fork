import {
	unwrapQuoteEmbed,
	unwrapRecordEmbed,
	type AppBskyActorDefs,
	type AppBskyFeedDefs,
	type AppBskyFeedPost,
	type AppBskyUnspeccedDefs,
} from '@atcute/bluesky';

import { getPostRecord } from '#/lib/api/record-casts';

import { isPostInLanguage } from '#/locale/helpers';

/** 1-based position in an author's thread. */
export type PostNumbering = {
	index: number;
	count: number;
};

// not sure why these aren't in #feedViewPost at the moment.
type RawPostNumbering = Pick<AppBskyUnspeccedDefs.ThreadItemPost, 'opThreadPostCount' | 'opThreadPostIndex'>;
type FeedViewPost = AppBskyFeedDefs.FeedViewPost & RawPostNumbering;

type FeedTunerFn = (tuner: FeedTuner, slices: FeedViewPostsSlice[], dryRun: boolean) => FeedViewPostsSlice[];

type FeedSliceItem = {
	post: AppBskyFeedDefs.PostView;
	record: AppBskyFeedPost.Main;
	postNumbering: PostNumbering | undefined;
	parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
	isParentBlocked: boolean;
	isParentNotFound: boolean;
};

const readPostNumbering = (value: RawPostNumbering): PostNumbering | undefined => {
	const { opThreadPostCount: count, opThreadPostIndex: index } = value;

	if (count === undefined || index === undefined || index < 1 || count < 1 || index > count) {
		return undefined;
	}

	return { index, count };
};

// ancestors omit numbering; infer contiguous OP-thread positions from the selected post.
const inferParentNumbering = (leaf: PostNumbering | undefined): PostNumbering | undefined => {
	return leaf !== undefined && leaf.index > 1 ? { index: leaf.index - 1, count: leaf.count } : undefined;
};

const inferRootNumbering = (leaf: PostNumbering | undefined): PostNumbering | undefined => {
	return leaf !== undefined ? { index: 1, count: leaf.count } : undefined;
};

type AuthorContext = {
	author: AppBskyActorDefs.ProfileViewBasic;
	parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
	grandparentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
	rootAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
};

class FeedViewPostsSlice {
	_reactKey: string;
	_feedPost: FeedViewPost;
	items: FeedSliceItem[];
	isIncompleteThread: boolean;
	isOrphan: boolean;
	isThreadMuted: boolean;
	rootUri: string;
	feedPostUri: string;

	constructor(
		feedPost: FeedViewPost,
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

export class FeedTuner {
	seenKeys: Set<string> = new Set();
	seenUris: Set<string> = new Set();
	seenRootUris: Set<string> = new Set();

	constructor(public tunerFns: FeedTunerFn[]) {}

	tune(
		feed: FeedViewPost[],
		{ dryRun }: { dryRun: boolean } = {
			dryRun: false,
		},
	): FeedViewPostsSlice[] {
		// reuse reported numbering when a post appears as an ancestor
		const numberings = feed.map((item) => readPostNumbering(item));
		const postNumberingByUri = new Map<string, PostNumbering>();
		feed.forEach((item, i) => {
			const numbering = numberings[i];
			if (numbering !== undefined) {
				postNumberingByUri.set(item.post.uri, numbering);
			}
		});

		let slices = feed.map((item, i) => new FeedViewPostsSlice(item, numberings[i], postNumberingByUri));

		for (const tunerFn of this.tunerFns) {
			slices = tunerFn(this, slices.slice(), dryRun);
		}

		slices = slices.filter((slice) => {
			if (this.seenKeys.has(slice._reactKey)) {
				return false;
			}
			// dedupe context posts without removing the only visible reply.
			for (let i = 0; i < slice.items.length; i++) {
				const item = slice.items[i]!;
				if (this.seenUris.has(item.post.uri)) {
					if (i === 0) {
						// remove already-seen leading context.
						slice.items.splice(0, 1);
						i--;
					}
					if (i === slice.items.length - 1) {
						// omit a slice whose final item was already shown.
						return false;
					}
				} else {
					if (!dryRun) {
						// keep reposted replies eligible for later context.
						const disableDedupe = slice.isReply && slice.isRepost;
						if (!disableDedupe) {
							this.seenUris.add(item.post.uri);
						}
					}
				}
			}
			if (!dryRun) {
				this.seenKeys.add(slice._reactKey);
			}
			return true;
		});

		return slices;
	}

	static removeReplies(_tuner: FeedTuner, slices: FeedViewPostsSlice[], _dryRun: boolean) {
		for (let i = 0; i < slices.length; i++) {
			const slice = slices[i]!;
			if (
				slice.isReply &&
				!slice.isRepost &&
				// avoid removing probable self-threads without peeking ahead.
				!areSameAuthor(slice.getAuthors())
			) {
				slices.splice(i, 1);
				i--;
			}
		}
		return slices;
	}

	static removeReposts(_tuner: FeedTuner, slices: FeedViewPostsSlice[], _dryRun: boolean) {
		for (let i = 0; i < slices.length; i++) {
			if (slices[i]!.isRepost) {
				slices.splice(i, 1);
				i--;
			}
		}
		return slices;
	}

	static removeQuotePosts(_tuner: FeedTuner, slices: FeedViewPostsSlice[], _dryRun: boolean) {
		for (let i = 0; i < slices.length; i++) {
			if (slices[i]!.isQuotePost) {
				slices.splice(i, 1);
				i--;
			}
		}
		return slices;
	}

	static removeOrphans(_tuner: FeedTuner, slices: FeedViewPostsSlice[], _dryRun: boolean) {
		for (let i = 0; i < slices.length; i++) {
			if (slices[i]!.isOrphan) {
				slices.splice(i, 1);
				i--;
			}
		}
		return slices;
	}

	static removeMutedThreads(_tuner: FeedTuner, slices: FeedViewPostsSlice[], _dryRun: boolean) {
		for (let i = 0; i < slices.length; i++) {
			if (slices[i]!.isThreadMuted) {
				slices.splice(i, 1);
				i--;
			}
		}
		return slices;
	}

	static dedupThreads(tuner: FeedTuner, slices: FeedViewPostsSlice[], dryRun: boolean): FeedViewPostsSlice[] {
		for (let i = 0; i < slices.length; i++) {
			const slice = slices[i]!;
			const rootUri = slice.rootUri;
			if (!slice.isRepost && tuner.seenRootUris.has(rootUri)) {
				slices.splice(i, 1);
				i--;
			} else {
				if (!dryRun) {
					tuner.seenRootUris.add(rootUri);
				}
			}
		}
		return slices;
	}

	static followedRepliesOnly({ userDid }: { userDid: string }) {
		return (_tuner: FeedTuner, slices: FeedViewPostsSlice[], _dryRun: boolean): FeedViewPostsSlice[] => {
			for (let i = 0; i < slices.length; i++) {
				const slice = slices[i]!;
				if (slice.isReply && !slice.isRepost && !shouldDisplayReplyInFollowing(slice.getAuthors(), userDid)) {
					slices.splice(i, 1);
					i--;
				}
			}
			return slices;
		};
	}

	/**
	 * filters feed slices based on whether they contain text in a preferred language.
	 *
	 * @param preferredLangsCode2 preferred language codes in ISO 639-1 or ISO 639-2 format
	 * @returns a filter function for feed slices
	 */
	static preferredLangOnly(preferredLangsCode2: string[]) {
		return (_tuner: FeedTuner, slices: FeedViewPostsSlice[], _dryRun: boolean): FeedViewPostsSlice[] => {
			if (!preferredLangsCode2.length || preferredLangsCode2.length === 0) {
				return slices;
			}

			const candidateSlices = slices.filter((slice) => {
				for (const item of slice.items) {
					if (isPostInLanguage(item.post, preferredLangsCode2)) {
						return true;
					}
				}
				return false;
			});

			// keep the page visible if every item was filtered.
			if (candidateSlices.length === 0) {
				return slices;
			}

			return candidateSlices;
		};
	}
}

function areSameAuthor(authors: AuthorContext): boolean {
	const { author, parentAuthor, grandparentAuthor, rootAuthor } = authors;
	const authorDid = author.did;
	if (parentAuthor && parentAuthor.did !== authorDid) {
		return false;
	}
	if (grandparentAuthor && grandparentAuthor.did !== authorDid) {
		return false;
	}
	if (rootAuthor && rootAuthor.did !== authorDid) {
		return false;
	}
	return true;
}

function shouldDisplayReplyInFollowing(authors: AuthorContext, userDid: string): boolean {
	const { author, parentAuthor, grandparentAuthor, rootAuthor } = authors;
	return (
		isSelfOrFollowing(author, userDid) &&
		isSelfOrFollowing(parentAuthor, userDid) &&
		isSelfOrFollowing(grandparentAuthor, userDid) &&
		isSelfOrFollowing(rootAuthor, userDid)
	);
}

function isSelfOrFollowing(profile: AppBskyActorDefs.ProfileViewBasic | undefined, userDid: string) {
	return !profile || profile.did === userDid || !!profile.viewer?.following;
}
