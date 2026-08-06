import type { ReactNode } from 'react';

import { clsx } from 'clsx';

import { isOnlyEmoji } from '#/lib/strings/emoji';
import { parseRichtext, toPlainText } from '#/lib/strings/rich-text-facets';
import { parseLinkableUrl, toShortUrl } from '#/lib/strings/url-helpers';

import { Text } from '#/components/Text';

import * as styles from './DraftRichText.css';

/**
 * render a read-only rich-text preview by segmenting text into facet-colored spans.
 *
 * @param value draft post text where facets are detected client-side
 * @param numberOfLines number of lines to clamp the preview to
 */
export function DraftRichText({ value, numberOfLines }: { value: string; numberOfLines?: number }) {
	const segments = parseRichtext(value);

	const els: ReactNode[] = [];
	let key = 0;
	for (const segment of segments) {
		let el: ReactNode = segment.text;

		switch (segment.type) {
			case 'link': {
				el =
					parseLinkableUrl(segment.uri) != null ? (
						<span key={key} className={styles.facet}>
							{toShortUrl(segment.text)}
						</span>
					) : (
						toShortUrl(segment.text)
					);
				break;
			}
			case 'tag':
			case 'unresolvedMention': {
				el = (
					<span key={key} className={styles.facet}>
						{segment.text}
					</span>
				);
				break;
			}
		}

		els.push(el);
		key++;
	}

	return (
		<Text
			size="md"
			numberOfLines={numberOfLines}
			className={clsx(styles.root, isOnlyEmoji(toPlainText(segments)) && styles.emoji)}
		>
			{els}
		</Text>
	);
}
