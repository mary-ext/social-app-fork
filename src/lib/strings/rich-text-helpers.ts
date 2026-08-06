import { type Richtext, segmentizeRichtext, toPlainText, unshortenLinks } from './rich-text-facets';
import { isMisleadingLink } from './url-helpers';

/**
 * converts rich text to publishable source text.
 *
 * @param rt the rich text
 * @returns source text with full link targets
 */
export function richTextToSourceText(rt: Richtext): string {
	return toPlainText(unshortenLinks(segmentizeRichtext(rt)));
}

/**
 * converts rich text to copyable text with explicit link targets.
 *
 * @param rt the rich text
 * @returns copyable text
 */
export function richTextToCopyableText(rt: Richtext): string {
	let result = '';

	for (const segment of segmentizeRichtext(rt)) {
		if (segment.type !== 'link') {
			result += segment.text;
		} else if (isMisleadingLink(segment.uri, segment.text)) {
			result += `[${segment.text}](${segment.uri})`;
		} else {
			result += segment.uri;
		}
	}

	return result;
}
