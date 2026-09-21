import type { Plot } from 'wordgard/doc';
import { Decoration, PointSet, RangeSet } from 'wordgard/editor';
import { GardState, type Transaction } from 'wordgard/state';

import { MAX_POST_GRAPHEME_LENGTH } from '#/lib/constants/composer';

import type { SelectionError } from '#/features/composer/media/select-attachments';

import { LINE_PLACEHOLDER_ATTR } from '../elements';
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
	/** grapheme count after link shortening. */
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

/** empty-post placeholder by thread index. */
export const postPlaceholder = GardState.Facet.define<
	(index: number) => string,
	((index: number) => string) | null
>({ combine: (values) => values[0] ?? null });

const facetDeco = Decoration.Range.wrapper('span', { attributes: { class: styles.facet } });
const overflowDeco = Decoration.Range.wrapper('span', { attributes: { class: styles.overflow } });

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
