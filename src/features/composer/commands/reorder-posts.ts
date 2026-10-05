import type { Plot } from 'wordgard/doc';
import type { Wordgard } from 'wordgard/editor';
import { GardSelection, type GardState, type Transaction } from 'wordgard/state';

import { ISOLATE_HISTORY } from '../model/history';
import { findPostById, getPosts, type ThreadPost } from '../model/schema';
import { findSelectedPost } from '../model/selection';

const movePostSpec = (state: GardState, post: ThreadPost, target: number): Transaction.Spec => {
	const posts = getPosts(state.doc);

	// replace the affected range in one change to simplify selection mapping.
	const first = Math.min(post.index, target);
	const last = Math.max(post.index, target);
	const run = posts.slice(first, last + 1);
	const from = run[0]!.pos;
	const to = run[run.length - 1]!.pos + run[run.length - 1]!.node.length;

	const nodes = run.map((entry) => entry.node);
	nodes.splice(post.index - first, 1);
	nodes.splice(target - first, 0, post.node);

	// track new post positions; default mapping would collapse selections to the replaced range's edge.
	const landed = new Map<Plot, number>();
	let pos = from;
	for (const node of nodes) {
		landed.set(node, pos);
		pos += node.length;
	}

	// exclude the gaps between posts.
	const postAt = (at: number) => run.find((entry) => at > entry.pos && at < entry.pos + entry.node.length);

	// rebase each selection endpoint independently; positions outside the range don't move.
	const rebase = (at: number) => {
		const entry = postAt(at);
		return entry ? landed.get(entry.node)! + at - entry.pos : at;
	};

	const { anchor, head } = state.selection;

	return {
		changes: { from, to, insert: nodes },
		// an explicit selection prevents the next flush from importing the drag's DOM selection.
		selection: GardSelection.range(rebase(anchor), rebase(head)),
		scrollIntoView: true,
		userEvent: 'move.post',
		annotations: ISOLATE_HISTORY,
	};
};

/**
 * moves a post to an insertion slot, preserving the selection.
 *
 * @param wg the editor
 * @param postId the post's id
 * @param target the insertion index after removing the post
 */
export const movePostToSlot = (wg: Wordgard, postId: string, target: number): void => {
	const post = findPostById(wg.state.doc, postId);
	if (post && target !== post.index) {
		wg.dispatch(movePostSpec(wg.state, post, target));
	}
};

/**
 * swaps the selected post with an adjacent one, keeping the selection in the moved post.
 *
 * @param wg the editor
 * @param dir -1 to move it earlier, 1 to move it later
 * @returns the swap, or false when the selection spans posts or the post is at the thread's edge
 */
export const movePost = (wg: Wordgard, dir: -1 | 1): Transaction.Spec | false => {
	const { state } = wg;
	const selected = findSelectedPost(state);
	const posts = getPosts(state.doc);
	const post = selected && posts[selected.index];
	if (!post || !posts[post.index + dir]) {
		return false;
	}

	return movePostSpec(state, post, post.index + dir);
};
