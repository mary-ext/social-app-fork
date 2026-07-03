import type { ReactNode } from 'react';

import type { AppBskyRichtextFacet } from '@atcute/bluesky';
import { segmentize } from '@atcute/bluesky-richtext-segmenter';

import { clsx } from 'clsx';

import { detectFacetsWithoutResolution } from '#/lib/strings/rich-text-facets';
import { toShortUrl } from '#/lib/strings/url-helpers';

import { isOnlyEmoji } from '#/alf/typography';

import { Text } from '#/components/Text';

import * as styles from './DraftRichText.css';

// lifted from RichText: validates a link facet before coloring it (without the `gm` flags).
const URL_REGEX = /(^|\s|\()((https?:\/\/[\S]+)|((?<domain>[a-z][a-z0-9]*(\.[a-z0-9]+)+)[\S]*))/i;

type Feature = AppBskyRichtextFacet.Main['features'][number];

/**
 * render a read-only rich-text preview by segmenting text into facet-colored spans.
 *
 * @param value draft post text where facets are detected client-side
 * @param numberOfLines number of lines to clamp the preview to
 */
export function DraftRichText({ value, numberOfLines }: { value: string; numberOfLines?: number }) {
	const { text, facets } = detectFacetsWithoutResolution(value);

	if (!facets?.length) {
		return (
			<Text
				size="md"
				numberOfLines={numberOfLines}
				className={clsx(styles.root, isOnlyEmoji(text) && styles.emoji)}
			>
				{text}
			</Text>
		);
	}

	const els: ReactNode[] = [];
	let key = 0;
	for (const segment of segmentize<Feature>(text, facets)) {
		let el: ReactNode = segment.text;

		// render the first feature we support, in array order — a facet can carry more than one.
		features: for (const feature of segment.features ?? []) {
			switch (feature.$type) {
				case 'app.bsky.richtext.facet#link': {
					el = URL_REGEX.test(feature.uri) ? (
						<span key={key} className={styles.facet}>
							{toShortUrl(segment.text)}
						</span>
					) : (
						toShortUrl(segment.text)
					);
					break features;
				}
				case 'app.bsky.richtext.facet#mention':
				case 'app.bsky.richtext.facet#tag': {
					el = (
						<span key={key} className={styles.facet}>
							{segment.text}
						</span>
					);
					break features;
				}
			}
		}

		els.push(el);
		key++;
	}

	return (
		<Text size="md" numberOfLines={numberOfLines} className={styles.root}>
			{els}
		</Text>
	);
}
