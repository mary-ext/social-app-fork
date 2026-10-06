import type { Command } from 'wordgard/command';
import type { Pos } from 'wordgard/doc';
import { GardSelection, type GardState } from 'wordgard/state';

import { endOfLastLine, findPost, getPostParam, type ThreadPost } from './schema';

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

/**
 * finds the post containing the whole selection.
 *
 * @param state the editor state
 * @returns the post, or null when the selection spans posts or lies outside any post
 */
export const findSelectedPost = (state: GardState): Pos.Plot | null => {
	const { sel } = state;
	const post = findPost(sel.from);
	return post && findPost(sel.to)?.before === post.before ? post : null;
};

/** selects the current post's text; returns false when already selected so select-all can continue. */
export const selectPost: Command = (wg) => {
	const { sel } = wg.state;
	const post = findSelectedPost(wg.state);
	if (!post) {
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

/**
 * finds the post containing the selection head.
 *
 * @param state the editor state
 * @returns the post, or null when the selection head is outside any post
 */
export const findActivePost = (state: GardState): Pos.Plot | null => {
	return findPost(state.sel.head);
};

// share the lookup across all posts' controls.
const activePostIds = new WeakMap<GardState, string | null>();

/**
 * finds the id of the post containing the selection head.
 *
 * @param state the editor state
 * @returns the post id, or null when the selection head is outside any post
 */
export const getActivePostId = (state: GardState): string | null => {
	let id = activePostIds.get(state);
	if (id === undefined) {
		const found = findActivePost(state);
		id = found && getPostParam(found.node).id;
		activePostIds.set(state, id);
	}

	return id;
};

/**
 * returns a caret selection for an inactive post.
 *
 * @param state the editor state
 * @param post a post from state.doc
 * @returns a caret at the post's text end, or undefined if already active
 */
export const getActivationSelection = (
	state: GardState,
	post: ThreadPost,
): { anchor: number } | undefined => {
	if (findActivePost(state)?.before === post.pos) {
		return undefined;
	}

	return { anchor: endOfLastLine(post.pos + post.node.length) };
};

// #endregion
