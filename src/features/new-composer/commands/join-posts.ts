import type { ChangeSet, Plot } from 'wordgard/doc';
import type { Wordgard } from 'wordgard/editor';
import { Transaction } from 'wordgard/state';
import { Paragraph } from 'wordgard/types';

import { ISOLATE_HISTORY } from '../editor/history';
import { getPostParam, getPosts, getSiblingPost, isEmptyLine, setPostMediaChange } from '../editor/schema';
import { type CaretContext, getCaretContext } from '../editor/selection';

/**
 * appends the joined post's media to the surviving post.
 *
 * @param pos the position before the surviving post
 * @param kept the surviving post
 * @param joined the post being merged into it
 * @returns changes giving the surviving post both posts' media
 */
const joinMedia = (pos: number, kept: Plot, joined: Plot): ChangeSet.Spec[] => {
	const media = getPostParam(joined).media;
	if (media.length === 0) {
		return [];
	}

	return [setPostMediaChange(pos, kept, [...getPostParam(kept).media, ...media])];
};

const joinSpec = (changes: ChangeSet.Spec[], anchor: number): Transaction.Spec => {
	return {
		changes,
		selection: { anchor },
		scrollIntoView: true,
		userEvent: 'delete.join',
		annotations: ISOLATE_HISTORY,
	};
};

const joinWithPrevious = (cx: CaretContext): Transaction.Spec | false => {
	const { block, head, post } = cx;
	if (head !== block.start || block.index !== 0 || post.index === 0) {
		return false;
	}

	const prev = getSiblingPost(post, -1);
	if (!prev) {
		return false;
	}

	// allow excess media during editing; validation flags it for the user to resolve.
	const media = joinMedia(post.before - prev.length, prev, post.node);

	// leave a blank line so backspace removes the post boundary and paragraph spacing separately.
	const seamIsBlank = isEmptyLine(prev.content[prev.content.length - 1]) || isEmptyLine(post.node.content[0]);
	const separator = seamIsBlank ? [] : [Paragraph.create()];

	return joinSpec(
		[...media, { from: post.before - 1, to: post.start, insert: separator }],
		// remove two post-boundary tokens; an inserted paragraph adds two tokens back.
		head - 2 + separator.length * 2,
	);
};

const joinWithNext = (cx: CaretContext): Transaction.Spec | false => {
	const { block, head, post } = cx;
	const next = getSiblingPost(post, 1);
	if (head !== block.end || block.index !== post.node.content.length - 1 || !next) {
		return false;
	}

	return joinSpec([...joinMedia(post.before, post.node, next), { from: post.end, to: post.after + 1 }], head);
};

/**
 * joins the caret's post with its neighbour when deleting across the post boundary.
 *
 * @param wg the editor
 * @param dir which neighbour the deletion reaches
 * @returns the join, or false when the caret isn't at the post's edge
 */
export const joinPosts = (wg: Wordgard, dir: 'backward' | 'forward'): Transaction.Spec | false => {
	const cx = getCaretContext(wg.state);
	if (!cx) {
		return false;
	}

	return dir === 'backward' ? joinWithPrevious(cx) : joinWithNext(cx);
};

/**
 * preserves the partially deleted last post's media in a local cross-post replacement.
 *
 * @param tr the transaction being extended
 * @returns changes appending that media to the first post, or null if none are needed
 */
export const preserveJoinedMedia = (tr: Transaction): Transaction.Spec | null => {
	// replacing a post's opening tag discards its media; fully deleted posts need no recovery.
	if (!tr.docChanged || tr.annotation(Transaction.remote)) {
		return null;
	}

	const doc = tr.startState.doc;
	const posts = getPosts(doc);
	const changes: ChangeSet.Spec[] = [];

	tr.changes.iterChanges((fromA, toA) => {
		const first = posts.findLast((post) => post.pos < fromA);
		const last = posts.findLast((post) => post.pos < toA);
		// replacements within a post preserve its media-bearing tag.
		if (!first || !last || first.index === last.index) {
			return;
		}

		// reaching the closing token deletes the whole post.
		const isPartial = toA < last.pos + last.node.length - 1;
		const media = isPartial ? getPostParam(last.node).media : [];
		if (media.length > 0) {
			changes.push(setPostMediaChange(first.pos, first.node, [...getPostParam(first.node).media, ...media]));
		}
	});

	return changes.length > 0 ? { changes } : null;
};
