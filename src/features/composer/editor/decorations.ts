import { Decoration } from 'wordgard/editor';
import { GardState } from 'wordgard/state';

import { getPostInfo } from '../model/post-info';
import { getPosts, isEmptyPost, Post } from '../model/schema';
import { createOffsetMapper, measureCached } from '../model/text-measurement';
import { LINE_PLACEHOLDER_ATTR } from '../shared/elements';
import * as post from '../shared/post.css';
import * as deco from './decorations.css';

/** empty-post placeholder by thread index. */
export const postPlaceholder = GardState.Facet.define<
	(index: number) => string,
	((index: number) => string) | null
>({
	combine: (values) => values[0] ?? null,
});

const facetDeco = Decoration.Range.wrapper('span', { attributes: { class: deco.facet } });
const overflowDeco = Decoration.Range.wrapper('span', { attributes: { class: deco.overflow } });

type ThreadDecorations = {
	ranges: Decoration.Range.Set;
	points: Decoration.Point.Set;
};

const build = (state: GardState): ThreadDecorations => {
	const getPlaceholder = state.facet(postPlaceholder);

	const ranges: [Decoration.Range, number, number][] = [];
	const points: [Decoration.Point, number][] = [];

	for (const { node, pos, index } of getPosts(state.doc)) {
		const { text, measurement } = measureCached(node);
		const { overflowAt } = getPostInfo(state, node);

		if (measurement.facets.length > 0 || overflowAt !== null) {
			const toPos = createOffsetMapper(node, pos + 1);

			for (const [from, to] of measurement.facets) {
				ranges.push([facetDeco, toPos(from), toPos(to)]);
			}

			if (overflowAt !== null) {
				ranges.push([overflowDeco, toPos(overflowAt), toPos(text.length)]);
			}
		}

		// use an attribute for empty-post placeholders; widgets interfere with click positioning.
		if (getPlaceholder && isEmptyPost(node)) {
			points.push([Decoration.Point.attributes({ [LINE_PLACEHOLDER_ATTR]: getPlaceholder(index) }), pos + 1]);
		}
	}

	// overflow may precede facets; the set builder requires start order.
	ranges.sort((a, b) => a[1] - b[1]);

	return {
		ranges: Decoration.Range.set(ranges),
		points: Decoration.Point.set(points),
	};
};

const threadDecorationSets = GardState.Field.Derived.define(build);

/** applies post layout and placeholder styles to editor elements. */
export const postClass: GardState.Extension = Decoration.Tag.attribute(Post, 'class', post.post);

/** link highlights, overflow highlights, and placeholders. */
export const threadDecorations: GardState.Extension = [
	threadDecorationSets.extension,
	Decoration.Range.source.of((state) => state.field(threadDecorationSets).ranges),
	Decoration.Point.source.of((state) => state.field(threadDecorationSets).points),
];
