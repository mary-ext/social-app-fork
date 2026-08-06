import { isGraphemeLengthInRange } from '@atcute/util-text';

export function enforceLen(
	str: string,
	len: number,
	ellipsis = false,
	mode: 'end' | 'middle' = 'end',
): string {
	str = str || '';
	if (str.length > len) {
		if (ellipsis) {
			if (mode === 'end') {
				return str.slice(0, len) + '…';
			} else if (mode === 'middle') {
				const half = Math.floor(len / 2);
				return str.slice(0, half) + '…' + str.slice(-half);
			} else {
				// fallback
				return str.slice(0, len);
			}
		} else {
			return str.slice(0, len);
		}
	}
	return str;
}

export function isOverMaxGraphemeCount({ text, maxCount }: { text: string; maxCount: number }) {
	return !isGraphemeLengthInRange(text, 0, maxCount);
}

const BLANK_LINE_PADDING = '[ \\u00AD\\u2060\\u200D\\u200C\\u200B]';

const TRIM_RE = new RegExp(
	`^\\s+|\\s+$|${BLANK_LINE_PADDING}+(?=\\n)|\\n(?=(?:${BLANK_LINE_PADDING}*\\n){2})${BLANK_LINE_PADDING}*`,
	'g',
);

/**
 * trims multiline text and collapses excess blank lines.
 *
 * @param text text to trim
 * @returns trimmed text
 */
export function trimText(text: string): string {
	return text.replace(TRIM_RE, '');
}

export function countLines(str: string | undefined): number {
	if (!str) {
		return 0;
	}
	return str.match(/\n/g)?.length ?? 0;
}

/**
 * Normalizes a search query for the search endpoint.
 *
 * @param query the raw query as typed by the user
 * @returns the query with “smart quotes” replaced by normal ones
 */
