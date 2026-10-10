import type { AppBskyFeedDefs } from '@atcute/bluesky';

/** 1-based position in an author's thread. */
export type PostNumbering = {
	index: number;
	count: number;
};

/**
 * reads a post's position in its author's thread from the view carrying it.
 *
 * @param value a feed post or embedded record view
 * @returns the position, or undefined when absent or inconsistent
 */
export const readPostNumbering = (
	value: Pick<AppBskyFeedDefs.FeedViewPost, 'opThreadPostCount' | 'opThreadPostIndex'>,
): PostNumbering | undefined => {
	const { opThreadPostCount: count, opThreadPostIndex: index } = value;

	if (count === undefined || index === undefined || index < 1 || count < 1 || index > count) {
		return undefined;
	}

	return { index, count };
};
