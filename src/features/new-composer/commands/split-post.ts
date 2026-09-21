import type { Command } from 'wordgard/command';
import { type ChangeSet, type Node, Plot, type Pos } from 'wordgard/doc';
import type { Wordgard } from 'wordgard/editor';
import { GardSelection } from 'wordgard/state';
import { Paragraph } from 'wordgard/types';

import { MAX_POST_GRAPHEME_LENGTH } from '#/lib/constants/composer';
import { getShortenedLength } from '#/lib/rich-text';

import { ISOLATE_HISTORY } from '../editor/history';
import {
	createPosts,
	endOfLastLine,
	findPost,
	findPostById,
	getPostParam,
	getPostText,
	isEmptyLine,
	newPost,
	Post,
	setPostMediaChange,
} from '../editor/schema';
import { getCaretContext } from '../editor/selection';
import { splitText } from './auto-split';

/** blank lines required to split, including the line enter adds. */
const BLANK_LINES_TO_SPLIT = { atPostEnd: 3, insidePost: 4 };

/**
 * moves media to the lower half if it contains text; otherwise keeps it in the upper half.
 *
 * @param post the post being split
 * @param hasTextBelow whether text ends up in the lower post
 * @returns upper-post changes and the lower post's opening tag
 */
const splitMedia = (
	post: Pos.Plot,
	hasTextBelow: boolean,
): { changes: ChangeSet.Spec[]; lower: Plot.Tag } => {
	const param = getPostParam(post.node);
	if (!hasTextBelow || param.media.length === 0) {
		return { changes: [], lower: newPost() };
	}

	return { changes: [setPostMediaChange(post.before, post.node, [])], lower: newPost(param.media) };
};

/** blank-line run after enter, indexed within the post. */
type BlankRun = {
	/** index of the first line the split consumes. */
	from: number;
	/** index just past the last line it consumes. */
	to: number;
	/** blank-line count including the line enter adds. */
	count: number;
};

/**
 * finds the blank-line run that pressing enter would produce around the caret.
 *
 * @param lines the post's lines
 * @param block the caret's line
 * @param head the caret's document position
 * @returns the run, or null when enter splits a nonempty line
 */
const findBlankRun = (lines: readonly Node[], block: Pos.Plot, head: number): BlankRun | null => {
	const index = block.index;

	const runStart = () => {
		let from = index;
		while (isEmptyLine(lines[from - 1])) {
			from--;
		}
		return from;
	};

	const runEnd = () => {
		let to = index + 1;
		while (isEmptyLine(lines[to])) {
			to++;
		}
		return to;
	};

	if (block.node.contentLength === 0) {
		const from = runStart();
		const to = runEnd();
		return { from, to, count: to - from + 1 };
	}

	if (head === block.start) {
		const from = runStart();
		return { from, to: index, count: index - from + 1 };
	}

	if (head === block.end) {
		const to = runEnd();
		return { from: index + 1, to, count: to - index };
	}

	return null;
};

/** replaces a blank-line run with a post boundary when enter reaches the split threshold. */
export const splitOnBlankLines: Command = (wg) => {
	const cx = getCaretContext(wg.state);
	if (!cx) {
		return false;
	}

	const { block, head, post } = cx;
	const lines = post.node.content;

	const run = findBlankRun(lines, block, head);
	if (!run) {
		return false;
	}

	const reachesPostEnd = run.to === lines.length;
	const needed = reachesPostEnd ? BLANK_LINES_TO_SPLIT.atPostEnd : BLANK_LINES_TO_SPLIT.insidePost;
	if (run.count < needed) {
		return false;
	}

	let from = post.start;
	for (let i = 0; i < run.from; i++) {
		from += lines[i]!.length;
	}
	let to = from;
	for (let i = run.from; i < run.to; i++) {
		to += lines[i]!.length;
	}

	// each post requires at least one paragraph.
	const before = run.from === 0 ? [Paragraph.create()] : [];
	const after = reachesPostEnd ? [Paragraph.create()] : [];
	const split = splitMedia(post, !reachesPostEnd);

	return {
		changes: [...split.changes, { from, to, insert: [...before, Plot.End, split.lower, ...after] }],
		// past the placeholder, the post break, and into the first line.
		selection: { anchor: from + (before.length ? 2 : 0) + 3 },
		scrollIntoView: true,
		userEvent: 'input.split',
		annotations: ISOLATE_HISTORY,
	};
};

/**
 * splits the post at the selection, replacing any selected text. at a line boundary the split falls between
 * lines instead of leaving an empty line behind.
 */
export const splitPost: Command = (wg) => {
	const { sel } = wg.state;
	const block = sel.head.textblockParent;
	const post = findPost(sel.head);
	if (!block || !post || sel.from.textblockParent?.before !== block.before) {
		return false;
	}

	const { from, to } = sel.selection;
	const lastIndex = post.node.content.length - 1;

	let range: { from: number; to: number };
	let betweenLines = true;
	if (from === to && from === block.start && block.index > 0) {
		range = { from: block.before, to: block.before };
	} else if (from === to && from === block.end && block.index < lastIndex) {
		range = { from: block.after, to: block.after };
	} else {
		range = { from, to };
		betweenLines = false;
	}

	const below = post.node.textContent({ from: range.to - post.start, blockSeparator: '' });
	const split = splitMedia(post, below.trim() !== '');
	const spec = {
		...range,
		insert: betweenLines ? [Plot.End, split.lower] : [Plot.End, Plot.End, split.lower, Paragraph],
	};

	return {
		changes: [...split.changes, spec],
		selection: (cx, changes) => GardSelection.near(cx, changes.mapPos(spec.to, 1), 1),
		scrollIntoView: true,
		userEvent: 'input.split',
		annotations: ISOLATE_HISTORY,
	};
};

/**
 * splits an overlong post at text boundaries, keeping its media on the last post.
 *
 * @param wg the editor
 * @param postId the post's id
 */
export const autoSplitPost = (wg: Wordgard, postId: string): void => {
	const post = findPostById(wg.state.doc, postId);
	if (!post) {
		return;
	}

	const chunks = splitText(getPostText(post.node), MAX_POST_GRAPHEME_LENGTH, getShortenedLength);
	if (chunks.length < 2) {
		return;
	}

	// preserve the original post's id on the first chunk.
	const param = getPostParam(post.node);
	const posts = createPosts(chunks).map((plot, i) => {
		if (i === 0) {
			return Post.of({ id: param.id, media: [] }).create(plot.content);
		}
		return i === chunks.length - 1 ? newPost(param.media).create(plot.content) : plot;
	});

	const end = post.pos + posts.reduce((length, plot) => length + plot.length, 0);

	wg.dispatch({
		changes: { from: post.pos, to: post.pos + post.node.length, insert: posts },
		selection: { anchor: endOfLastLine(end) },
		scrollIntoView: true,
		userEvent: 'input.split',
		annotations: ISOLATE_HISTORY,
	});
};
