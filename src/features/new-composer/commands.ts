import { Command, deleteUnit, deleteWord, enter, selectAll } from 'wordgard/command';
import { type ChangeSet, Leaf, type Node, Plot, type Pos, type Slice, Token } from 'wordgard/doc';
import { KeyBinding, Wordgard } from 'wordgard/editor';
import { GardSelection, type GardState, Transaction } from 'wordgard/state';
import { Paragraph } from 'wordgard/types';

import { MAX_POST_GRAPHEME_LENGTH } from '#/lib/constants/composer';
import { getShortenedLength } from '#/lib/rich-text';

import { splitText } from './auto-split';
import { attachFiles, setPostMediaChange } from './media';
import {
	createPosts,
	endOfLastLine,
	findPost,
	findPostById,
	getPostParam,
	getPosts,
	getPostText,
	getSiblingPost,
	isEmptyLine,
	newPost,
	Post,
} from './schema';
import { ISOLATE_HISTORY } from './transactions';

const PARAGRAPH_BREAK: Token[] = [Plot.End, Paragraph];

/**
 * blank-line thresholds for splitting, including the line enter would add. matches Typefully: fewer blank
 * lines are needed at the end of a post.
 */
const BLANK_LINES_TO_SPLIT = { atPostEnd: 3, insidePost: 4 };

// three blank lines separate posts in plain text, the same run the third enter consumes.
const POST_SEPARATOR = '\n\n\n\n';
const POST_SEPARATOR_PATTERN = /\n{4,}/;

// #region media

/**
 * moves media to the lower half if it contains text; otherwise keeps it in the upper half.
 *
 * @param post the post being split
 * @param hasTextBelow whether text ends up in the lower post
 * @returns changes for the upper post, and the tag to open the lower post with
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

/**
 * moves the media of a post being joined into the post it joins.
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

// cross-post replacements discard merged posts' opening tags, which hold their media.
// retain media from the partially deleted last post; fully deleted posts lose their media.
const preserveJoinedMedia = (tr: Transaction): Transaction.Spec | null => {
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

// #endregion

// #region splitting

/** a cursor selection resolved to its line and post. */
type CaretContext = {
	block: Pos.Plot;
	/** the caret's document position. */
	head: number;
	post: Pos.Plot;
};

const getCaretContext = (state: GardState): CaretContext | null => {
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

/** the run of blank lines an enter would leave behind, as line indices within the post. */
type BlankRun = {
	/** index of the first line the split consumes. */
	from: number;
	/** index just past the last line it consumes. */
	to: number;
	/** how many blank lines the run holds once the enter adds one. */
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
const splitOnBlankLines: Command = (wg) => {
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
const splitPost: Command = (wg) => {
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

// #endregion

// #region joining

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
		// the two removed tokens shift the caret back, the separator's own two push it forward again.
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

const joinPosts = (wg: Wordgard, dir: 'backward' | 'forward'): Transaction.Spec | false => {
	const cx = getCaretContext(wg.state);
	if (!cx) {
		return false;
	}

	return dir === 'backward' ? joinWithPrevious(cx) : joinWithNext(cx);
};

// #endregion

// #region selection and reordering

/** selects the current post's text on the first press, and the whole thread on the next. */
const selectPost: Command = (wg) => {
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

/**
 * moves a post to an insertion slot, preserving the selection.
 *
 * @param wg the editor
 * @param postId the post's id
 * @param target the index the post ends up at, counted after removing it from its current place
 */
export const movePostToSlot = (wg: Wordgard, postId: string, target: number): void => {
	const { sel } = wg.state;
	const posts = getPosts(wg.state.doc);
	const post = posts.find((entry) => entry.id === postId);
	if (!post || target === post.index) {
		return;
	}

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

	const { anchor, head } = sel.selection;

	wg.dispatch({
		changes: { from, to, insert: nodes },
		// an explicit selection prevents the next flush from importing the drag's DOM selection.
		selection: GardSelection.range(rebase(anchor), rebase(head)),
		scrollIntoView: true,
		userEvent: 'move.post',
		annotations: ISOLATE_HISTORY,
	});
};

/** swaps adjacent posts, keeping the selection in the moved post. */
const movePost = (wg: Wordgard, dir: -1 | 1): Transaction.Spec | false => {
	const { sel } = wg.state;
	const post = findPost(sel.head);
	if (!post || findPost(sel.anchor)?.before !== post.before) {
		return false;
	}

	const other = getSiblingPost(post, dir);
	if (!other) {
		return false;
	}

	const from = dir < 0 ? post.before - other.length : post.before;
	const movedBefore = dir < 0 ? from : from + other.length;
	const { anchor, head } = sel.selection;

	return {
		changes: {
			from,
			to: from + post.node.length + other.length,
			insert: dir < 0 ? [post.node, other] : [other, post.node],
		},
		selection: GardSelection.range(movedBefore + anchor - post.before, movedBefore + head - post.before),
		scrollIntoView: true,
		userEvent: 'move.post',
		annotations: ISOLATE_HISTORY,
	};
};

// #endregion

// #region clipboard

/**
 * converts plain text to tokens for insertion inside a paragraph. three or more blank lines separate posts.
 *
 * @param text the pasted plain text
 * @returns the tokens to insert
 */
const tokenizePastedText = (text: string): Token[] => {
	const tokens: Token[] = [];
	// preserve leading/trailing newlines and empty chunks: pasting a bare separator splits the post.
	const chunks = text.replace(/\r\n?/g, '\n').split(POST_SEPARATOR_PATTERN);

	chunks.forEach((chunk, i) => {
		if (i > 0) {
			tokens.push(Plot.End, Plot.End, newPost(), Paragraph);
		}

		chunk.split('\n').forEach((line, j) => {
			if (j > 0) {
				tokens.push(...PARAGRAPH_BREAK);
			}
			if (line) {
				tokens.push(Leaf.text(line));
			}
		});
	});

	return tokens;
};

/** pastes as plain text so blank-line runs split posts the same way typing them does. */
const pastePlainText = Wordgard.pasteHandler.of((wg, event) => {
	const files = event.clipboardData?.files;
	if (files?.length) {
		const post = findPost(wg.state.sel.head);
		if (post) {
			// copy files before the clipboard event expires.
			void attachFiles(wg, getPostParam(post.node).id, [...files]);
		}

		return true;
	}

	const text = event.clipboardData?.getData('text/plain');
	if (!text) {
		return false;
	}

	const { from, to } = wg.state.selection.replacementRange;

	wg.dispatch({
		changes: { from, to, insert: tokenizePastedText(text), fit: true },
		selection: (cx, changes) => GardSelection.near(cx, changes.mapPos(to, 1), -1),
		scrollIntoView: true,
		userEvent: 'input.paste',
	});

	return true;
});

/** separates copied posts with blank lines so pasting restores the post boundaries. */
const copyPlainText = Wordgard.clipboardTextSerializer.of((slice: Slice) => {
	let text = '';
	let separator = '';

	const write = (str: string) => {
		text += separator + str;
		separator = '';
	};

	const breakBefore = (type: Plot.Type) => {
		if (text) {
			separator = type === Post ? POST_SEPARATOR : separator || '\n';
		}
	};

	for (const token of slice.content) {
		switch (token.tokenType) {
			case Token.Type.Close: {
				break;
			}

			case Token.Type.Open: {
				breakBefore(token.type);
				break;
			}

			case Token.Type.Node: {
				if (token.isPlot) {
					breakBefore(token.type);
					write(token.textContent({ blockSeparator: '\n' }));
				} else if (token.is(Leaf.Text)) {
					write(token.param);
				}
				break;
			}
		}
	}

	return text;
});

// #endregion

/** extension with the thread's editing behavior. */
export const threadCommands: GardState.Extension = [
	Command.handler(enter, splitOnBlankLines),
	Command.handler(deleteUnit, joinPosts),
	Command.handler(deleteWord, joinPosts),
	Command.handler(selectAll, selectPost),
	KeyBinding.of({ key: 'Mod-Enter', run: splitPost }),
	KeyBinding.of({ key: 'Alt-ArrowUp', run: (wg) => movePost(wg, -1) }),
	KeyBinding.of({ key: 'Alt-ArrowDown', run: (wg) => movePost(wg, 1) }),
	pastePlainText,
	copyPlainText,
	Transaction.extender.of(preserveJoinedMedia),
];
