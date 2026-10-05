import { Command, insertText } from 'wordgard/command';
import type { Wordgard } from 'wordgard/editor';

import { endOfLastLine, findPostById } from '../model/schema';
import { findSelectedPost } from '../model/selection';

/**
 * replaces a selection contained in the post, or appends to its last line. moves the caret after the inserted
 * text. does nothing if the post no longer exists.
 *
 * @param wg the editor
 * @param options.postId the post's id
 * @param options.text the text to insert; must not contain line breaks
 */
export const insertTextInPost = (wg: Wordgard, { postId, text }: { postId: string; text: string }): void => {
	const { state } = wg;
	const post = findPostById(state.doc, postId);
	if (!post) {
		return;
	}

	let from: number;
	let to: number;
	if (findSelectedPost(state)?.before === post.pos) {
		({ from, to } = state.selection);
	} else {
		from = to = endOfLastLine(post.pos + post.node.length);
	}

	Command.dispatch(wg, insertText, { from, to, insert: text, userEvent: 'input.emoji' });
};
