import type { Wordgard } from 'wordgard/editor';

import { ISOLATE_HISTORY } from '../editor/history';
import { endOfLastLine, getPosts, startOfFirstLine } from '../editor/schema';

/**
 * deletes a post unless it is the only one. if either selection endpoint is inside it, moves the caret to the
 * previous post's end, or the next post's start for the first post.
 *
 * @param wg the editor
 * @param postId the post's id
 */
export const removePost = (wg: Wordgard, postId: string): void => {
	const posts = getPosts(wg.state.doc);
	const post = posts.find((entry) => entry.id === postId);
	if (!post || posts.length < 2) {
		return;
	}

	const from = post.pos;
	const to = from + post.node.length;

	const { anchor, head } = wg.state.sel.selection;
	const isInside = (at: number) => at > from && at < to;

	let selection: { anchor: number } | undefined;
	if (isInside(anchor) || isInside(head)) {
		// the next post moves up to where the removed one started.
		selection = { anchor: post.index > 0 ? endOfLastLine(from) : startOfFirstLine(from) };
	}

	wg.dispatch({
		changes: { from, to },
		selection,
		scrollIntoView: true,
		userEvent: 'delete.post',
		annotations: ISOLATE_HISTORY,
	});
};
