import { getGraphemeLength } from '@atcute/util-text';

import type { Plot } from 'wordgard/doc';
import { Decoration, PointSet, RangeSet, Widget, type Wordgard } from 'wordgard/editor';
import { GardState, Transaction } from 'wordgard/state';

import { MAX_POST_GRAPHEME_LENGTH } from '#/lib/constants/composer';
import { getShortenedLength } from '#/lib/rich-text';
import { toShortUrl } from '#/lib/utils/url';

import type { SelectionError } from '#/features/composer/media/select-attachments';

import { buildSpans } from '#/components/Composer/rich-text';

import {
	LINE_PLACEHOLDER_ATTR,
	POST_DROP_AFTER_ATTR,
	POST_DROP_BEFORE_ATTR,
	POST_DROP_TARGET_ATTR,
} from './elements';
import { getMediaProblem } from './media';
import {
	getChildPlots,
	getPostParam,
	getPosts,
	getPostText,
	isEmptyPost,
	type PostMedia,
	type ThreadPost,
} from './schema';
import * as styles from './ThreadEditor.css';

/** summary of one post, derived from the document. */
export type PostSummary = {
	id: string;
	/** the post's position in the thread. */
	index: number;
	/** grapheme length after link shortening, as counted against the post limit. */
	length: number;
	isOverLimit: boolean;
	media: readonly PostMedia[];
	/** media type or count violation, or null. */
	mediaProblem: SelectionError | null;
};

type ThreadAnalysis = {
	posts: PostSummary[];
	facets: RangeSet<Decoration.Range>;
	// kept apart from facets, since a range set can't hold overlapping ranges.
	overflow: RangeSet<Decoration.Range>;
	points: PointSet<Decoration.Point>;
};

/** per-post React portal slot. */
export type PostSlotKind = 'rail' | 'footer';

/** connects slot widgets to the hosting component. */
export type SlotHost = {
	mount: (kind: PostSlotKind, postId: string, element: HTMLElement) => void;
	unmount: (kind: PostSlotKind, postId: string, element: HTMLElement) => void;
};

/** facet providing the slot host to the widgets. */
export const slotHost = GardState.Facet.define<SlotHost, SlotHost | null>({
	combine: (values) => values[0] ?? null,
});

/** facet providing the placeholder text shown in an empty post, given the post's index. */
export const postPlaceholder = GardState.Facet.define<
	(index: number) => string,
	((index: number) => string) | null
>({ combine: (values) => values[0] ?? null });

const segmenter = new Intl.Segmenter();

const facetDeco = Decoration.Range.wrapper('span', { attributes: { class: styles.facet } });
const overflowDeco = Decoration.Range.wrapper('span', { attributes: { class: styles.overflow } });

// only `render` receives the editor; retain the host for `connect` and `disconnect`.
const hosts = new WeakMap<Element | Text, SlotHost>();

/**
 * creates a portal host widget keyed by post id to preserve React state during reordering.
 *
 * @param kind which slot the widget stands for
 * @param options the slot element's class, and whether it takes part in the post's layout
 * @returns the widget type
 */
const defineSlotWidget = (
	kind: PostSlotKind,
	{ className, inFlow }: { className: string; inFlow: boolean },
) => {
	return Widget.define<string>({
		render(_postId, wg) {
			const element = document.createElement('div');
			element.className = className;

			const host = wg.state.facet(slotHost);
			if (host) {
				hosts.set(element, host);
			}
			return element;
		},
		connect(postId, dom) {
			if (dom instanceof HTMLElement) {
				hosts.get(dom)?.mount(kind, postId, dom);
			}
		},
		disconnect(postId, dom) {
			if (dom instanceof HTMLElement) {
				hosts.get(dom)?.unmount(kind, postId, dom);
			}
		},
		// prevent control clicks from changing the editor selection.
		propagateEvent: false,
		inFlow,
	});
};

const railWidget = defineSlotWidget('rail', {
	className: styles.railSlot,
	inFlow: false,
});
const footerWidget = defineSlotWidget('footer', {
	className: styles.footerSlot,
	inFlow: true,
});

/**
 * maps text offsets of a post (lines joined with newlines) to document positions.
 *
 * @param post the post plot
 * @param start document position of the post's content start
 * @returns the mapping function
 */
const createOffsetMapper = (post: Plot, start: number) => {
	const lineStarts: number[] = [];
	const lineDocStarts: number[] = [];

	let offset = 0;
	let pos = start;
	for (const line of getChildPlots(post)) {
		lineStarts.push(offset);
		lineDocStarts.push(pos + 1);
		offset += line.contentLength + 1;
		pos += line.length;
	}

	// callers walk the post's spans in order, so the previous line is nearly always the right one.
	let i = 0;
	return (textOffset: number) => {
		while (i > 0 && lineStarts[i]! > textOffset) {
			i--;
		}
		while (i + 1 < lineStarts.length && lineStarts[i + 1]! <= textOffset) {
			i++;
		}
		return lineDocStarts[i]! + (textOffset - lineStarts[i]!);
	};
};

type PostText = {
	/** grapheme length after link shortening, shared with auto-split. */
	length: number;
	/** raw offset of the first grapheme past the limit, or null when within it. */
	overflowAt: number | null;
	/** UTF-16 ranges of highlighted facets. */
	facets: [number, number][];
};

/**
 * measures text with shortened links and locates facet and overflow ranges.
 *
 * @param text the post's text
 * @returns the measurement
 */
const measurePost = (text: string): PostText => {
	const facets: [number, number][] = [];
	let raw = 0;
	let shown = 0;
	let overflowAt: number | null = null;

	for (const span of buildSpans(text)) {
		const isLink = span.facet === 'url';
		const shownLength = isLink ? getGraphemeLength(toShortUrl(span.raw)) : getGraphemeLength(span.raw);

		if (overflowAt === null && shown + shownLength > MAX_POST_GRAPHEME_LENGTH) {
			if (isLink) {
				// a shortened link counts as a unit, so the overflow starts at the whole link.
				overflowAt = raw;
			} else {
				let count = shown;
				for (const { index } of segmenter.segment(span.raw)) {
					if (count === MAX_POST_GRAPHEME_LENGTH) {
						overflowAt = raw + index;
						break;
					}

					count++;
				}
			}
		}

		if (span.facet) {
			facets.push([raw, raw + span.raw.length]);
		}

		raw += span.raw.length;
		shown += shownLength;
	}

	// per-span counts can split grapheme clusters at facet boundaries. use the shared whole-text
	// measure for the reported length; the overflow offset remains span-based.
	return { length: getShortenedLength(text), overflowAt, facets };
};

// unchanged posts retain node identity, so their measurements can be reused.
const measured = new WeakMap<Plot, { text: string; measurement: PostText }>();

const measureCached = (post: Plot): { text: string; measurement: PostText } => {
	const hit = measured.get(post);
	if (hit) {
		return hit;
	}

	const text = getPostText(post);
	const entry = { text, measurement: measurePost(text) };
	measured.set(post, entry);

	return entry;
};

// stable summary props let React skip unchanged post controls; reordering invalidates the index.
const summarized = new WeakMap<Plot, PostSummary>();

const summarize = ({ node, index, id }: ThreadPost, length: number): PostSummary => {
	const hit = summarized.get(node);
	if (hit && hit.index === index && hit.id === id) {
		return hit;
	}

	const { media } = getPostParam(node);
	const summary: PostSummary = {
		id,
		index,
		length,
		isOverLimit: length > MAX_POST_GRAPHEME_LENGTH,
		media,
		mediaProblem: getMediaProblem(media),
	};

	summarized.set(node, summary);
	return summary;
};

const analyze = (getPlaceholder: ((index: number) => string) | null, doc: Plot.Doc): ThreadAnalysis => {
	const posts: PostSummary[] = [];
	const facets: [number, number, Decoration.Range][] = [];
	const overflow: [number, number, Decoration.Range][] = [];
	const points: [number, Decoration.Point][] = [];

	for (const post of getPosts(doc)) {
		const { node, pos, index, id } = post;
		const { text, measurement } = measureCached(node);
		const toPos = createOffsetMapper(node, pos + 1);

		posts.push(summarize(post, measurement.length));

		for (const [from, to] of measurement.facets) {
			facets.push([toPos(from), toPos(to), facetDeco]);
		}

		if (measurement.overflowAt !== null) {
			overflow.push([toPos(measurement.overflowAt), toPos(text.length), overflowDeco]);
		}

		// use an attribute for empty-post placeholders; widgets interfere with click positioning.
		if (getPlaceholder && isEmptyPost(node)) {
			points.push([pos + 1, Decoration.Point.attributes({ [LINE_PLACEHOLDER_ATTR]: getPlaceholder(index) })]);
		}

		// just inside the post's opening token; the rail is positioned over the whole post.
		points.push([pos + 1, Decoration.Point.widget(railWidget.of(id), { side: -1 })]);

		// just inside the post's closing token, after its last line.
		points.push([pos + node.length - 1, Decoration.Point.widget(footerWidget.of(id), { side: 1 })]);
	}

	return {
		posts,
		facets: RangeSet.create(facets),
		overflow: RangeSet.create(overflow),
		points: PointSet.create(points),
	};
};

const samePosts = (a: readonly PostSummary[], b: readonly PostSummary[]) => {
	return a.length === b.length && a.every((post, i) => post === b[i]);
};

const reanalyze = (value: ThreadAnalysis, tr: Transaction): ThreadAnalysis => {
	const next = analyze(tr.startState.facet(postPlaceholder), tr.newDoc);
	// reuse the array when summaries are unchanged to avoid a React state update.
	return samePosts(value.posts, next.posts) ? { ...next, posts: value.posts } : next;
};

/** per-post summaries and decorations, recomputed when the document changes. */
export const threadAnalysis = GardState.Field.define<ThreadAnalysis>({
	create(state) {
		return analyze(state.facet(postPlaceholder), state.doc);
	},
	update(value, tr) {
		return tr.docChanged ? reanalyze(value, tr) : value;
	},
	provide(field) {
		return [
			Decoration.Range.source.of((state) => state.field(field).facets),
			Decoration.Range.source.of((state) => state.field(field).overflow),
			Decoration.Point.source.of((state) => state.field(field).points),
		];
	},
});

// #region drop target

const dropDeco = Decoration.Point.attributes({ [POST_DROP_TARGET_ATTR]: '' });

/** position before the media drop target, or null to clear it. */
const setDropTarget = Transaction.Effect.define<number | null>({
	map: (pos, mapping) => (pos === null ? null : mapping.mapPos(pos)),
});

/**
 * highlights the media drop target.
 *
 * @param wg the editor
 * @param pos the position before the post, or null to clear the highlight
 */
export const markDropTarget = (wg: Wordgard, pos: number | null): void => {
	if (wg.state.field(dropTarget) !== pos) {
		wg.dispatch({ effects: setDropTarget.of(pos) });
	}
};

/** media drop target position, retained across editor redraws. */
export const dropTarget = GardState.Field.define<number | null>({
	create() {
		return null;
	},
	update(value, tr) {
		let next = tr.docChanged && value !== null ? tr.changes.mapPos(value) : value;
		for (const effect of tr.effects) {
			if (effect.is(setDropTarget)) {
				next = effect.value;
			}
		}

		return next;
	},
	provide(field) {
		return Decoration.Point.source.of((state) => {
			const pos = state.field(field);
			return pos === null ? PointSet.empty : PointSet.create([[pos, dropDeco]]);
		});
	},
});

// #endregion

// #region post drop slot

const dropBeforeDeco = Decoration.Point.attributes({ [POST_DROP_BEFORE_ATTR]: '' });
const dropAfterDeco = Decoration.Point.attributes({ [POST_DROP_AFTER_ATTR]: '' });

const setPostDropSlot = Transaction.Effect.define<number | null>();

/** insertion index for a dragged post, or null. */
export const postDropSlot = GardState.Field.define<number | null>({
	create() {
		return null;
	},
	update(value, tr) {
		let next = value;
		for (const effect of tr.effects) {
			if (effect.is(setPostDropSlot)) {
				next = effect.value;
			}
		}

		return next;
	},
	provide(field) {
		return Decoration.Point.source.of((state) => {
			const slot = state.field(field);
			if (slot === null) {
				return PointSet.empty;
			}

			// append slots use the last post's trailing edge.
			const posts = getPosts(state.doc);
			const at = posts[slot];
			if (at) {
				return PointSet.create([[at.pos, dropBeforeDeco]]);
			}

			const last = posts[posts.length - 1];
			return last ? PointSet.create([[last.pos, dropAfterDeco]]) : PointSet.empty;
		});
	},
});

/**
 * highlights the insertion slot for a dragged post.
 *
 * @param wg the editor
 * @param slot the index the post would be inserted before, or null to clear the line
 */
export const markPostDropSlot = (wg: Wordgard, slot: number | null): void => {
	if (wg.state.field(postDropSlot) !== slot) {
		wg.dispatch({ effects: setPostDropSlot.of(slot) });
	}
};

// #endregion
