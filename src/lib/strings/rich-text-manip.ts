import type { AppBskyRichtextFacet } from '@atcute/bluesky';
import RichtextBuilder from '@atcute/bluesky-richtext-builder';
import { segmentize } from '@atcute/bluesky-richtext-segmenter';

import type { Richtext } from './rich-text-facets';
import { toShortUrl } from './url-helpers';

type Feature = AppBskyRichtextFacet.Main['features'][number];

/**
 * replaces each link facet's display text with its shortened form, rebuilding the facets to maintain correct
 * byte offsets.
 *
 * @param richtext the text and facets to shorten.
 * @returns the rewritten text and facets.
 */
export function shortenLinks({ text, facets }: Richtext): Richtext {
	if (!facets?.length) {
		return { text, facets };
	}

	const builder = new RichtextBuilder();
	for (const segment of segmentize<Feature>(text, facets)) {
		const feature = segment.features?.[0];
		if (feature?.$type === 'app.bsky.richtext.facet#link') {
			builder.addLink(toShortUrl(segment.text), feature.uri);
		} else if (feature) {
			builder.addDecoratedText(segment.text, feature);
		} else {
			builder.addText(segment.text);
		}
	}
	return builder.build();
}
