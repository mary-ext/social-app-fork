import { Decoration, PointSet, RangeSet } from 'wordgard/editor';
import { GardState } from 'wordgard/state';

import { getEmbedSession } from '../embeds/embed-session';
import { getPostInfo } from '../model/post-info';
import { getPosts, isEmptyPost } from '../model/schema';
import { findActivePost } from '../model/selection';
import { createOffsetMapper, measureCached } from '../model/text-measurement';
import { LINE_PLACEHOLDER_ATTR, POST_ACTIVE_ATTR } from '../shared/elements';
import * as css from './decorations.css';
import { footerWidget, headerWidget } from './post-slots';

/** empty-post placeholder by thread index. */
export const postPlaceholder = GardState.Facet.define<
	(index: number) => string,
	((index: number) => string) | null
>({
	combine: (values) => values[0] ?? null,
});

const facetDeco = Decoration.Range.wrapper('span', { attributes: { class: css.facet } });
const overflowDeco = Decoration.Range.wrapper('span', { attributes: { class: css.overflow } });
const activeDeco = Decoration.Point.attributes({ [POST_ACTIVE_ATTR]: '' });

type ThreadDecorations = {
	facets: RangeSet<Decoration.Range>;
	// separate from facets because RangeSet can't hold overlapping ranges.
	overflow: RangeSet<Decoration.Range>;
	points: PointSet<Decoration.Point>;
};

const build = (state: GardState): ThreadDecorations => {
	const getPlaceholder = state.facet(postPlaceholder);

	const facets: [number, number, Decoration.Range][] = [];
	const overflow: [number, number, Decoration.Range][] = [];
	const points: [number, Decoration.Point][] = [];

	for (const { node, pos, index, id } of getPosts(state.doc)) {
		const { text, measurement } = measureCached(node);
		const { overflowAt } = getPostInfo(state, node);

		if (measurement.facets.length > 0 || overflowAt !== null) {
			const toPos = createOffsetMapper(node, pos + 1);

			for (const [from, to] of measurement.facets) {
				facets.push([toPos(from), toPos(to), facetDeco]);
			}

			if (overflowAt !== null) {
				overflow.push([toPos(overflowAt), toPos(text.length), overflowDeco]);
			}
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
		facets: RangeSet.create(facets),
		overflow: RangeSet.create(overflow),
		points: PointSet.create(points),
	};
};

/** link highlights, overflow highlights, placeholders, and post slot widgets. */
export const threadDecorations = GardState.Field.define<ThreadDecorations>({
	create: build,
	update(value, tr) {
		// overflow depends on the embed session, which decides whether a trailing link counts.
		if (tr.docChanged || getEmbedSession(tr.state) !== getEmbedSession(tr.startState)) {
			return build(tr.state);
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

/** marks the post containing the selection head. */
export const activePost = Decoration.Point.source.of((state) => {
	const found = findActivePost(state);
	return found ? PointSet.create([[found.before, activeDeco]]) : PointSet.empty;
});
