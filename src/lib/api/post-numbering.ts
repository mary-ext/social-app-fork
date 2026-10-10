import type { AppBskyFeedDefs } from '@atcute/bluesky';

/** 1-based position in an author's thread. */
export type PostNumbering = {
	index: number;
	count: number;
};

/**
 * reads thread numbering from a post view.
 *
 * @param value a feed post or embedded record view
 * @returns the numbering, or undefined if either field is absent
 */
export const readPostNumbering = (
	value: Pick<AppBskyFeedDefs.FeedViewPost, 'opThreadPostCount' | 'opThreadPostIndex'>,
): PostNumbering | undefined => {
	const { opThreadPostCount: count, opThreadPostIndex: index } = value;

	return count !== undefined && index !== undefined ? { index, count } : undefined;
};
