import type { AppBskyActorDefs, AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/bluesky';

import { isPostInLanguage } from '../../locale/helpers';

type FeedViewPost = AppBskyFeedDefs.FeedViewPost;

export type FeedTunerFn = (
	tuner: FeedTuner,
	slices: FeedViewPostsSlice[],
	dryRun: boolean,
) => FeedViewPostsSlice[];

type FeedSliceItem = {
	post: AppBskyFeedDefs.PostView;
	record: AppBskyFeedPost.Main;
	parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
	isParentBlocked: boolean;
	isParentNotFound: boolean;
};

type AuthorContext = {
	author: AppBskyActorDefs.ProfileViewBasic;
	parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
	grandparentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
	rootAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
};

export class FeedViewPostsSlice {
	_reactKey: string;
	_feedPost: FeedViewPost;
	items: FeedSliceItem[];
	isIncompleteThread: boolean;
	isOrphan: boolean;
	isThreadMuted: boolean;
	rootUri: string;
	feedPostUri: string;

	constructor(feedPost: FeedViewPost) {
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
		const record = post.record as AppBskyFeedPost.Main;
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
			parentAuthor,
			isParentBlocked,
			isParentNotFound,
		});
		if (!reply) {
			if (record.reply) {
				// This reply wasn't properly hydrated by the AppView.
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
		const parentRecord = parent.record as AppBskyFeedPost.Main;
		const root = reply.root;
		const rootIsView =
			root?.$type === 'app.bsky.feed.defs#postView' ||
			root?.$type === 'app.bsky.feed.defs#blockedPost' ||
			root?.$type === 'app.bsky.feed.defs#notFoundPost';
		/*
		 * If the parent is also the root, we just so happen to have the data we
		 * need to compute if the parent's parent (grandparent) is blocked. This
		 * doesn't always happen, of course, but we can take advantage of it when
		 * it does.
		 */
		const grandparent = rootIsView && parentRecord.reply?.parent.uri === root.uri ? root : undefined;
		const grandparentAuthor = reply.grandparentAuthor;
		const isGrandparentBlocked = Boolean(
			grandparent && grandparent.$type === 'app.bsky.feed.defs#blockedPost',
		);
		const isGrandparentNotFound = Boolean(
			grandparent && grandparent.$type === 'app.bsky.feed.defs#notFoundPost',
		);
		this.items.unshift({
			post: parent,
			record: parentRecord,
			parentAuthor: grandparentAuthor,
			isParentBlocked: isGrandparentBlocked,
			isParentNotFound: isGrandparentNotFound,
		});
		if (isGrandparentBlocked) {
			this.isOrphan = true;
			// Keep going, it might still have a root, and we need this for thread
			// de-deduping
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
			record: root.record as AppBskyFeedPost.Main,
			isParentBlocked: false,
			isParentNotFound: false,
			parentAuthor: undefined,
		});
		if (parentRecord.reply?.parent.uri !== root.uri) {
			this.isIncompleteThread = true;
		}
	}

	get isQuotePost() {
		const embed = this._feedPost.post.embed;
		return (
			embed?.$type === 'app.bsky.embed.record#view' || embed?.$type === 'app.bsky.embed.recordWithMedia#view'
		);
	}

	get isReply() {
		return !!(this._feedPost.post.record as AppBskyFeedPost.Main).reply;
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

	get likeCount() {
		return this._feedPost.post.likeCount ?? 0;
	}

	containsUri(uri: string) {
		return !!this.items.find((item) => item.post.uri === uri);
	}

	getAuthors(): AuthorContext {
		const feedPost = this._feedPost;
		let author: AppBskyActorDefs.ProfileViewBasic = feedPost.post.author;
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
		let slices: FeedViewPostsSlice[] = feed
			.map((item) => new FeedViewPostsSlice(item))
			.filter((s) => s.items.length > 0);

		// run the custom tuners
		for (const tunerFn of this.tunerFns) {
			slices = tunerFn(this, slices.slice(), dryRun);
		}

		slices = slices.filter((slice) => {
			if (this.seenKeys.has(slice._reactKey)) {
				return false;
			}
			// Some feeds, like Following, dedupe by thread, so you only see the most recent reply.
			// However, we don't want per-thread dedupe for author feeds (where we need to show every post)
			// or for feedgens (where we want to let the feed serve multiple replies if it chooses to).
			// To avoid showing the same context (root and/or parent) more than once, we do last resort
			// per-post deduplication. It hides already seen posts as long as this doesn't break the thread.
			for (let i = 0; i < slice.items.length; i++) {
				const item = slice.items[i]!;
				if (this.seenUris.has(item.post.uri)) {
					if (i === 0) {
						// Omit contiguous seen leading items.
						// For example, [A -> B -> C], [A -> D -> E], [A -> D -> F]
						// would turn into [A -> B -> C], [D -> E], [F].
						slice.items.splice(0, 1);
						i--;
					}
					if (i === slice.items.length - 1) {
						// If the last item in the slice was already seen, omit the whole slice.
						// This means we'd miss its parents, but the user can "show more" to see them.
						// For example, [A ... E -> F], [A ... D -> E], [A ... C -> D], [A -> B -> C]
						// would get collapsed into [A ... E -> F], with B/C/D considered seen.
						return false;
					}
				} else {
					if (!dryRun) {
						// Reposting a reply elevates it to top-level, so its parent/root won't be displayed.
						// Disable in-thread dedupe for this case since we don't want to miss them later.
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
				// This is not perfect but it's close as we can get to
				// detecting threads without having to peek ahead.
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
	 * This function filters a list of FeedViewPostsSlice items based on whether they contain text in a
	 * preferred language.
	 *
	 * @param {string[]} preferredLangsCode2 - An array of preferred language codes in ISO 639-1 or ISO 639-2
	 *   format.
	 * @returns A function that takes in a `FeedTuner` and an array of `FeedViewPostsSlice` objects and returns
	 *   an array of `FeedViewPostsSlice` objects.
	 */
	static preferredLangOnly(preferredLangsCode2: string[]) {
		return (_tuner: FeedTuner, slices: FeedViewPostsSlice[], _dryRun: boolean): FeedViewPostsSlice[] => {
			// early return if no languages have been specified
			if (!preferredLangsCode2.length || preferredLangsCode2.length === 0) {
				return slices;
			}

			const candidateSlices = slices.filter((slice) => {
				for (const item of slice.items) {
					if (isPostInLanguage(item.post, preferredLangsCode2)) {
						return true;
					}
				}
				// if item does not fit preferred language, remove it
				return false;
			});

			// if the language filter cleared out the entire page, return the original set
			// so that something always shows
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
	if (!isSelfOrFollowing(author, userDid)) {
		// Only show replies from self or people you follow.
		return false;
	}
	if (
		(!parentAuthor || parentAuthor.did === author.did) &&
		(!rootAuthor || rootAuthor.did === author.did) &&
		(!grandparentAuthor || grandparentAuthor.did === author.did)
	) {
		// Always show self-threads.
		return true;
	}
	// From this point on we need at least one more reason to show it.
	if (parentAuthor && parentAuthor.did !== author.did && isSelfOrFollowing(parentAuthor, userDid)) {
		return true;
	}
	if (
		grandparentAuthor &&
		grandparentAuthor.did !== author.did &&
		isSelfOrFollowing(grandparentAuthor, userDid)
	) {
		return true;
	}
	if (rootAuthor && rootAuthor.did !== author.did && isSelfOrFollowing(rootAuthor, userDid)) {
		return true;
	}
	return false;
}

function isSelfOrFollowing(profile: AppBskyActorDefs.ProfileViewBasic, userDid: string) {
	return Boolean(profile.did === userDid || profile.viewer?.following);
}
