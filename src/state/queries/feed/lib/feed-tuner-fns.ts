import type { AppBskyActorDefs } from '@atcute/bluesky';

import type { AuthorContext, FeedViewPostsSlice } from '#/state/queries/feed/lib/feed-slice';
import type { FeedTuner, FeedTunerFn } from '#/state/queries/feed/lib/feed-tuner';

import { isPostInLanguage } from '#/locale/helpers';

export const removeReplies: FeedTunerFn = (_tuner, slices, _dryRun) => {
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
};

export const removeReposts: FeedTunerFn = (_tuner, slices, _dryRun) => {
	for (let i = 0; i < slices.length; i++) {
		if (slices[i]!.isRepost) {
			slices.splice(i, 1);
			i--;
		}
	}
	return slices;
};

export const removeQuotePosts: FeedTunerFn = (_tuner, slices, _dryRun) => {
	for (let i = 0; i < slices.length; i++) {
		if (slices[i]!.isQuotePost) {
			slices.splice(i, 1);
			i--;
		}
	}
	return slices;
};

export const removeOrphans: FeedTunerFn = (_tuner, slices, _dryRun) => {
	for (let i = 0; i < slices.length; i++) {
		if (slices[i]!.isOrphan) {
			slices.splice(i, 1);
			i--;
		}
	}
	return slices;
};

export const removeMutedThreads: FeedTunerFn = (_tuner, slices, _dryRun) => {
	for (let i = 0; i < slices.length; i++) {
		if (slices[i]!.isThreadMuted) {
			slices.splice(i, 1);
			i--;
		}
	}
	return slices;
};

export const dedupThreads: FeedTunerFn = (tuner, slices, dryRun) => {
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
};

export const followedRepliesOnly = ({ userDid }: { userDid: string }): FeedTunerFn => {
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
};

/**
 * keeps slices containing a post tagged with a preferred language or a textless post. keeps all slices if no
 * languages are preferred or none of the slices match.
 *
 * @param preferredLangsCode2 preferred language codes in ISO 639-1 or ISO 639-2 format
 * @returns a filter function for feed slices
 */
export const preferredLangOnly = (preferredLangsCode2: string[]): FeedTunerFn => {
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
};

const areSameAuthor = (authors: AuthorContext): boolean => {
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
};

const shouldDisplayReplyInFollowing = (authors: AuthorContext, userDid: string): boolean => {
	const { author, parentAuthor, grandparentAuthor, rootAuthor } = authors;
	return (
		isSelfOrFollowing(author, userDid) &&
		isSelfOrFollowing(parentAuthor, userDid) &&
		isSelfOrFollowing(grandparentAuthor, userDid) &&
		isSelfOrFollowing(rootAuthor, userDid)
	);
};

const isSelfOrFollowing = (profile: AppBskyActorDefs.ProfileViewBasic | undefined, userDid: string) => {
	return !profile || profile.did === userDid || !!profile.viewer?.following;
};
