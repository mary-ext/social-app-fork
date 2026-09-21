import type { Command } from 'wordgard/command';
import type { Pos } from 'wordgard/doc';
import { Decoration, PointSet } from 'wordgard/editor';
import { GardSelection, type GardState } from 'wordgard/state';

import { POST_ACTIVE_ATTR } from '../elements';
import { findPost } from './schema';

// #region caret

/** a cursor selection resolved to its line and post. */
export type CaretContext = {
	block: Pos.Plot;
	/** the caret's document position. */
	head: number;
	post: Pos.Plot;
};

/**
 * resolves a cursor selection to its line and post.
 *
 * @param state the editor state
 * @returns the caret's line and post, or null for a range selection or a caret outside a post's text
 */
export const getCaretContext = (state: GardState): CaretContext | null => {
	const { sel } = state;
	if (!sel.selection.isCursor) {
		return null;
	}

	const block = sel.head.textblockParent;
	if (!block) {
		return null;
	}

	const post = findPost(sel.head);
	if (!post) {
		return null;
	}

	return { block, head: sel.head.pos, post };
};

/** selects the current post's text; returns false when already selected so select-all can continue. */
export const selectPost: Command = (wg) => {
	const { sel } = wg.state;
	const post = findPost(sel.from);
	if (!post || findPost(sel.to)?.before !== post.before) {
		return false;
	}

	const from = post.start + 1;
	const to = post.end - 1;
	if (sel.selection.from === from && sel.selection.to === to) {
		return false;
	}

	return { selection: GardSelection.range(from, to) };
};

// #endregion

// #region active post

const activeDeco = Decoration.Point.attributes({ [POST_ACTIVE_ATTR]: '' });

/**
 * finds the post containing the selection head.
 *
 * @param state the editor state
 * @returns the post, or null when the selection head is outside any post
 */
export const findActivePost = (state: GardState): Pos.Plot | null => {
	return findPost(state.sel.head);
};

/** marks the active post. */
export const activePost = Decoration.Point.source.of((state) => {
	const found = findActivePost(state);
	return found ? PointSet.create([[found.before, activeDeco]]) : PointSet.empty;
});

// #endregion
