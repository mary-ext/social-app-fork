import { type Richtext, segmentizeRichtext } from './rich-text-facets';
import { isMisleadingLink } from './url-helpers';

export function richTextToString(rt: Richtext, loose: boolean): string {
	let result = '';

	for (const segment of segmentizeRichtext(rt)) {
		let str = segment.text;

		if (segment.type === 'link') {
			const href = segment.uri;
			const requiresWarning = isMisleadingLink(href, segment.text);
			str = !requiresWarning ? href : loose ? `[${segment.text}](${href})` : segment.text;
		}

		result += str;
	}

	return result;
}
