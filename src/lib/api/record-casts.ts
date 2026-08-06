import type {
	AnyStarterPackView,
	AppBskyFeedDefs,
	AppBskyFeedPost,
	AppBskyGraphStarterpack,
} from '@atcute/bluesky';

/**
 * reads a post view's underlying `app.bsky.feed.post` record.
 *
 * @param view the post view to read
 * @returns the post record
 */
export const getPostRecord = (view: AppBskyFeedDefs.PostView): AppBskyFeedPost.Main => {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- view defs type `record` as `unknown`; the collection is fixed by the view type
	return view.record as AppBskyFeedPost.Main;
};

/**
 * reads a starter pack view's underlying `app.bsky.graph.starterpack` record.
 *
 * @param view the starter pack view to read
 * @returns the starter pack record
 */
export const getStarterPackRecord = (view: AnyStarterPackView): AppBskyGraphStarterpack.Main => {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- view defs type `record` as `unknown`; the collection is fixed by the view type
	return view.record as AppBskyGraphStarterpack.Main;
};
