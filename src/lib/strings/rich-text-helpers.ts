import type { AppBskyRichtextFacet } from '@atcute/bluesky';
import { segmentize } from '@atcute/bluesky-richtext-segmenter';

import type { Richtext } from './rich-text-facets';
import { isMisleadingLink } from './url-helpers';

type Feature = AppBskyRichtextFacet.Main['features'][number];

export function richTextToString(rt: Richtext, loose: boolean): string {
	const { text, facets } = rt;

	if (!facets?.length) {
		return text;
	}

	let result = '';

	for (const segment of segmentize<Feature>(text, facets)) {
		let str = segment.text;

		// Take the first link feature in array order; other feature kinds render as their plain text.
		features: for (const feature of segment.features ?? []) {
			switch (feature.$type) {
				case 'app.bsky.richtext.facet#link': {
					const href = feature.uri;
					const requiresWarning = isMisleadingLink(href, segment.text);
					str = !requiresWarning ? href : loose ? `[${segment.text}](${href})` : segment.text;
					break features;
				}
			}
		}

		result += str;
	}

	return result;
}
