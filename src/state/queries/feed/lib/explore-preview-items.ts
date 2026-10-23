import type { AppBskyFeedDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderatePost,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { FeedTuner } from '#/state/queries/feed/lib/feed-tuner';
import type { FeedPostSliceItem, FeedPreviewItem } from '#/state/queries/feed/types';

/** a fetched preview of one feed. */
export type FeedPreviewPage = {
	feed: AppBskyFeedDefs.GeneratorView;
	posts: AppBskyFeedDefs.FeedViewPost[];
};

const PINNED_POST_URIS: Record<string, boolean> = {
	// 📰 News
	'at://did:plc:kkf4naxqmweop7dv4l2iqqf5/app.bsky.feed.post/3lgh27w2ngc2b': true,
	// Gardening
	'at://did:plc:5rw2on4i56btlcajojaxwcat/app.bsky.feed.post/3kjorckgcwc27': true,
	// Web Development Trending
	'at://did:plc:m2sjv3wncvsasdapla35hzwj/app.bsky.feed.post/3lfaw445axs22': true,
	// Anime & Manga EN
	'at://did:plc:tazrmeme4dzahimsykusrwrk/app.bsky.feed.post/3knxx2gmkns2y': true,
	// 📽️ Film
	'at://did:plc:2hwwem55ce6djnk6bn62cstr/app.bsky.feed.post/3llhpzhbq7c2g': true,
	// PopSky
	'at://did:plc:lfdf4srj43iwdng7jn35tjsp/app.bsky.feed.post/3lbblgly65c2g': true,
	// Science
	'at://did:plc:hu2obebw3nhfj667522dahfg/app.bsky.feed.post/3kl33otd6ob2s': true,
	// Birds! 🦉
	'at://did:plc:ffkgesg3jsv2j7aagkzrtcvt/app.bsky.feed.post/3lbg4r57yk22d': true,
	// Astronomy
	'at://did:plc:xy2zorw2ys47poflotxthlzg/app.bsky.feed.post/3kyzye4lujs2w': true,
	// What's Cooking 🍽️
	'at://did:plc:geoqe3qls5mwezckxxsewys2/app.bsky.feed.post/3lfqhgvxbqc2q': true,
	// BookSky 💙📚 #booksky
	'at://did:plc:geoqe3qls5mwezckxxsewys2/app.bsky.feed.post/3kgrm2rw5ww2e': true,
};

/**
 * turns one feed preview into list rows: a header, moderated post slices, and a footer.
 *
 * @param page the feed preview
 * @param moderationOpts moderation options; must be defined
 * @returns the rows, or an empty array if no slices remain
 */
export const buildFeedPreviewItems = (
	page: FeedPreviewPage,
	moderationOpts: ModerationOptions | undefined,
): FeedPreviewItem[] => {
	// default feed tuner - we just want it to slice up the feed
	const tuner = new FeedTuner([]);
	const slices: FeedPreviewItem[] = [];

	let rowIndex = 0;
	for (const item of tuner.tune(page.posts)) {
		const moderations = item.items.map((child) => moderatePost(child.post, moderationOpts!));

		// apply moderation filters
		item.items = item.items.filter((_, i) => {
			const modui = moderations[i] && getDisplayRestrictions(moderations[i], DisplayContext.ContentList);
			return !modui || modui.filters.length === 0;
		});

		const slice = {
			_reactKey: page.feed.uri + item._reactKey,
			_isFeedPostSlice: true,
			isIncompleteThread: item.isIncompleteThread,
			feedContext: item.feedContext,
			reqId: item.reqId,
			reason: item.reason,
			feedPostUri: item.feedPostUri,
			items: item.items
				.slice(0, 6)
				.filter((subItem) => {
					return !PINNED_POST_URIS[subItem.post.uri];
				})
				.map((subItem, i) => {
					const feedPostSliceItem: FeedPostSliceItem = {
						_reactKey: `${item._reactKey}-${i}-${subItem.post.uri}`,
						uri: subItem.post.uri,
						post: subItem.post,
						record: subItem.record,
						postNumbering: subItem.postNumbering,
						moderation: moderations[i]!,
						parentAuthor: subItem.parentAuthor,
						isParentBlocked: subItem.isParentBlocked,
						isParentNotFound: subItem.isParentNotFound,
					};
					return feedPostSliceItem;
				}),
		};
		if (slice.isIncompleteThread && slice.items.length >= 3) {
			const beforeLast = slice.items.length - 2;
			const last = slice.items.length - 1;
			slices.push({
				type: 'preview:sliceItem',
				key: slice.items[0]!._reactKey,
				slice: slice,
				indexInSlice: 0,
				feed: page.feed,
				showReplyTo: false,
				hideTopBorder: rowIndex === 0,
			});
			slices.push({
				type: 'preview:sliceViewFullThread',
				key: slice._reactKey + '-viewFullThread',
				uri: slice.items[0]!.uri,
			});
			slices.push({
				type: 'preview:sliceItem',
				key: slice.items[beforeLast]!._reactKey,
				slice: slice,
				indexInSlice: beforeLast,
				feed: page.feed,
				showReplyTo: slice.items[beforeLast]!.parentAuthor?.did !== slice.items[beforeLast]!.post.author.did,
				hideTopBorder: false,
			});
			slices.push({
				type: 'preview:sliceItem',
				key: slice.items[last]!._reactKey,
				slice: slice,
				indexInSlice: last,
				feed: page.feed,
				showReplyTo: false,
				hideTopBorder: false,
			});
		} else {
			for (let i = 0; i < slice.items.length; i++) {
				const sliceItem = slice.items[i]!;
				slices.push({
					type: 'preview:sliceItem',
					key: sliceItem._reactKey,
					slice: slice,
					indexInSlice: i,
					feed: page.feed,
					showReplyTo: i === 0,
					hideTopBorder: i === 0 && rowIndex === 0,
				});
			}
		}

		rowIndex++;
	}

	if (slices.length === 0) {
		return [];
	}

	return [
		{
			type: 'preview:header',
			key: `header-${page.feed.uri}`,
			feed: page.feed,
		},
		...slices,
		{
			type: 'preview:footer',
			key: `footer-${page.feed.uri}`,
		},
	];
};
