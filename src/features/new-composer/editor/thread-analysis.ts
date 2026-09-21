import type { Plot } from 'wordgard/doc';
import { Decoration, PointSet, RangeSet } from 'wordgard/editor';
import { GardState, type Transaction } from 'wordgard/state';

import { MAX_POST_GRAPHEME_LENGTH } from '#/lib/constants/composer';

import type { SelectionError } from '#/features/composer/media/select-attachments';

import { LINE_PLACEHOLDER_ATTR } from '../elements';
import {
	dismissLinkEmbedEffect,
	type EmbedSession,
	emptyEmbedSession,
	type PostEmbeds,
	selectPostEmbeds,
} from '../embeds/link-embeds';
import { getMediaProblem } from '../media/attachments';
import * as styles from '../NewComposer.css';
import { footerWidget, headerWidget } from './post-slots';
import { getPostParam, getPosts, isEmptyPost, type PostMedia, type ThreadPost } from './schema';
import { createOffsetMapper, measureCached } from './text-measurement';

/** summary of one post, derived from the document. */
export type PostSummary = {
	id: string;
	/** zero-based thread index. */
	index: number;
	/** grapheme count after link shortening, excluding a trailing link shown as an embed. */
	length: number;
	isOverLimit: boolean;
	media: readonly PostMedia[];
	/** media type or count violation, or null. */
	mediaProblem: SelectionError | null;
	embeds: PostEmbeds;
};

type Span = { from: number; to: number };

type ThreadAnalysis = {
	posts: PostSummary[];
	facets: RangeSet<Decoration.Range>;
	// kept apart from facets, since a range set can't hold overlapping ranges.
	overflow: RangeSet<Decoration.Range>;
	points: PointSet<Decoration.Point>;
	session: EmbedSession;
	/** the unsettled link at the caret, or null. moving the caret out of it settles it. */
	editing: Span | null;
};

/** empty-post placeholder by thread index. */
export const postPlaceholder = GardState.Facet.define<
	(index: number) => string,
	((index: number) => string) | null
>({ combine: (values) => values[0] ?? null });

const facetDeco = Decoration.Range.wrapper('span', { attributes: { class: styles.facet } });
const overflowDeco = Decoration.Range.wrapper('span', { attributes: { class: styles.overflow } });

const isWithin = (pos: number, span: Span) => {
	return pos >= span.from && pos <= span.to;
};

// stable summary props let React skip unchanged post controls; reordering invalidates the index.
const summarized = new WeakMap<Plot, PostSummary>();

const summarize = ({ node, index, id }: ThreadPost, length: number, embeds: PostEmbeds): PostSummary => {
	const hit = summarized.get(node);
	if (
		hit &&
		hit.index === index &&
		hit.id === id &&
		hit.length === length &&
		hit.embeds.external === embeds.external &&
		hit.embeds.record === embeds.record
	) {
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
		embeds,
	};

	summarized.set(node, summary);
	return summary;
};

const analyze = (
	getPlaceholder: ((index: number) => string) | null,
	doc: Plot.Doc,
	head: number,
	prevSession: EmbedSession,
): ThreadAnalysis => {
	const posts: PostSummary[] = [];
	const facets: [number, number, Decoration.Range][] = [];
	const overflow: [number, number, Decoration.Range][] = [];
	const points: [number, Decoration.Point][] = [];

	const measured = getPosts(doc).map((post) => {
		const { text, measurement } = measureCached(post.node);
		return { post, text, measurement, toPos: createOffsetMapper(post.node, post.pos + 1) };
	});

	// settle every link the caret isn't in before picking embeds, since settling is per URL.
	let settled: Set<string> | null = null;
	let editing: Span | null = null;
	for (const { measurement, toPos } of measured) {
		for (const link of measurement.links) {
			if ((settled ?? prevSession.settled).has(link.url)) {
				continue;
			}

			const span = { from: toPos(link.from), to: toPos(link.to) };
			if (isWithin(head, span)) {
				editing = span;
			} else {
				settled ??= new Set(prevSession.settled);
				settled.add(link.url);
			}
		}
	}

	const session = settled ? { ...prevSession, settled } : prevSession;

	for (const { post, text, measurement, toPos } of measured) {
		const { node, pos, index, id } = post;
		const { embeds, stripped } = selectPostEmbeds(measurement, getPostParam(node).media, session);

		// exclude the trailing link expected to be removed when publishing.
		let length = measurement.length;
		let overflowAt = measurement.overflowAt;
		if (stripped) {
			length = stripped.length;
			if (overflowAt !== null && overflowAt >= stripped.textEnd) {
				overflowAt = null;
			}
		}

		posts.push(summarize(post, length, embeds));

		for (const [from, to] of measurement.facets) {
			facets.push([toPos(from), toPos(to), facetDeco]);
		}

		if (overflowAt !== null) {
			overflow.push([toPos(overflowAt), toPos(text.length), overflowDeco]);
		}

		// use an attribute for empty-post placeholders; widgets interfere with click positioning.
		if (getPlaceholder && isEmptyPost(node)) {
			points.push([pos + 1, Decoration.Point.attributes({ [LINE_PLACEHOLDER_ATTR]: getPlaceholder(index) })]);
		}

		// just inside the post's opening token, before its first line.
		points.push([pos + 1, Decoration.Point.widget(headerWidget.of(id), { side: -1 })]);

		// just inside the post's closing token, after its last line.
		points.push([pos + node.length - 1, Decoration.Point.widget(footerWidget.of(id), { side: 1 })]);
	}

	return {
		posts,
		facets: RangeSet.create(facets),
		overflow: RangeSet.create(overflow),
		points: PointSet.create(points),
		session,
		editing,
	};
};

const samePosts = (a: readonly PostSummary[], b: readonly PostSummary[]) => {
	return a.length === b.length && a.every((post, i) => post === b[i]);
};

const reanalyze = (value: ThreadAnalysis, tr: Transaction, session: EmbedSession): ThreadAnalysis => {
	const next = analyze(tr.startState.facet(postPlaceholder), tr.newDoc, tr.newSelection.head, session);
	// reuse the array when summaries are unchanged to avoid a React state update.
	return samePosts(value.posts, next.posts) ? { ...next, posts: value.posts } : next;
};

const applyDismissals = (session: EmbedSession, tr: Transaction): EmbedSession => {
	for (const effect of tr.effects) {
		if (effect.is(dismissLinkEmbedEffect) && !session.dismissed.has(effect.value)) {
			session = { ...session, dismissed: new Set(session.dismissed).add(effect.value) };
		}
	}

	return session;
};

/** per-post summaries and decorations, recomputed when the document or link embed state changes. */
export const threadAnalysis = GardState.Field.define<ThreadAnalysis>({
	create(state) {
		return analyze(state.facet(postPlaceholder), state.doc, state.selection.head, emptyEmbedSession);
	},
	update(value, tr) {
		const session = applyDismissals(value.session, tr);
		const leftLink = value.editing !== null && !isWithin(tr.newSelection.head, value.editing);

		if (tr.docChanged || leftLink || session !== value.session) {
			return reanalyze(value, tr, session);
		}

		return value;
	},
	provide(field) {
		return [
			Decoration.Range.source.of((state) => state.field(field).facets),
			Decoration.Range.source.of((state) => state.field(field).overflow),
			Decoration.Point.source.of((state) => state.field(field).points),
		];
	},
});
