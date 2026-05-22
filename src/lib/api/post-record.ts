import { type AppBskyFeedDefs, type AppBskyFeedPost } from '@atcute/bluesky';

/**
 * Asserts a post view's `record` field — typed `unknown` on `@atcute`'s `PostView` — to the post record type.
 * The concrete type is always known from context wherever a `PostView` is in hand.
 *
 * @param view the post view whose record to read.
 * @returns the post record.
 */
export const asPostRecord = (view: AppBskyFeedDefs.PostView): AppBskyFeedPost.Main => {
	return view.record as AppBskyFeedPost.Main;
};
