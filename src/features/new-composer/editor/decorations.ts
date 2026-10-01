import type { Plot } from 'wordgard/doc';
import { Decoration, PointSet, RangeSet } from 'wordgard/editor';
import { GardState } from 'wordgard/state';

import { LINE_PLACEHOLDER_ATTR } from '../elements';
import { getEmbedSession } from '../embeds/embed-session';
import type { EmbedSession } from '../embeds/link-embeds';
import * as styles from '../NewComposer.css';
import { getPostInfo } from './post-info';
import { footerWidget, headerWidget } from './post-slots';
import { getPosts, isEmptyPost } from './schema';
import { createOffsetMapper, measureCached } from './text-measurement';

/** empty-post placeholder by thread index. */
export const postPlaceholder = GardState.Facet.define<
	(index: number) => string,
	((index: number) => string) | null
>({ combine: (values) => values[0] ?? null });

const facetDeco = Decoration.Range.wrapper('span', { attributes: { class: styles.facet } });
const overflowDeco = Decoration.Range.wrapper('span', { attributes: { class: styles.overflow } });

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
		const toPos = createOffsetMapper(node, pos + 1);

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
		facets: RangeSet.create(facets),
		overflow: RangeSet.create(overflow),
		points: PointSet.create(points),
	};
};

// sources run on every update; cache by document and embed session to skip selection-only rebuilds.
const cache = new WeakMap<Plot.Doc, { session: EmbedSession; value: ThreadDecorations }>();

const getDecorations = (state: GardState): ThreadDecorations => {
	const session = getEmbedSession(state);

	const hit = cache.get(state.doc);
	if (hit?.session === session) {
		return hit.value;
	}

	const value = build(state);
	cache.set(state.doc, { session, value });
	return value;
};

/** link highlights, overflow highlights, placeholders, and post slot widgets. */
export const threadDecorations: GardState.Extension = [
	Decoration.Range.source.of((state) => getDecorations(state).facets),
	Decoration.Range.source.of((state) => getDecorations(state).overflow),
	Decoration.Point.source.of((state) => getDecorations(state).points),
];
