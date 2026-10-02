import type { ChangeSet } from 'wordgard/doc';
import type { Wordgard } from 'wordgard/editor';
import { Paragraph } from 'wordgard/types';

import { ISOLATE_HISTORY } from '../model/history';
import { endOfLastLine, getPosts, newPost, type PostMedia } from '../model/schema';

/**
 * appends a post and moves the caret into it, in one undo step.
 *
 * @param wg the editor
 * @param options the user event, initial media, and accompanying changes (no insertions or deletions)
 */
export const appendPost = (
	wg: Wordgard,
	{
		userEvent,
		media = [],
		changes = [],
	}: { userEvent: string; media?: readonly PostMedia[]; changes?: readonly ChangeSet.Spec[] },
): void => {
	const posts = getPosts(wg.state.doc);
	const last = posts[posts.length - 1];
	if (!last) {
		return;
	}

	const end = last.pos + last.node.length;
	const post = newPost(media).create([Paragraph.create()]);

	wg.dispatch({
		changes: [...changes, { from: end, insert: [post] }],
		selection: { anchor: endOfLastLine(end + post.length) },
		scrollIntoView: true,
		userEvent,
		annotations: ISOLATE_HISTORY,
	});
};
