import { type Token, tokenize } from '@atcute/bluesky-richtext-parser';

/** a highlighted rich-text token kind. */
export type FacetKind = 'mention' | 'tag' | 'url';

/** an autocomplete trigger kind. */
export type CompletionType = 'emoji' | 'mention' | 'tag';

/** a text run with an optional highlight. */
export type TextSpan = {
	raw: string;
	facet: FacetKind | null;
};

/** an autocomplete query and its replacement range. */
export type Completion = {
	type: CompletionType;
	/** text after the trigger, e.g. `han` for `@han`. */
	query: string;
	/** UTF-16 offsets `[start, end)`, including the trigger. */
	range: { end: number; start: number };
};

const WHITESPACE = /\s/;

const TRIGGERS: Record<string, CompletionType> = {
	'#': 'tag',
	':': 'emoji',
	'@': 'mention',
	'＃': 'tag',
	'＠': 'mention',
};

// incomplete queries need looser rules than published facets. punctuation closes mention and emoji
// completions except for characters allowed here; tag queries accept any non-whitespace character.
const COMPLETION_BODY: Record<CompletionType, RegExp> = {
	emoji: /^[+\-0-9_a-z]*$/i,
	mention: /^[.\-0-9a-z]*$/i,
	tag: /^\S*$/,
};

// emoji shortcodes are completion triggers, not published facets, so they stay unhighlighted.
const TOKEN_FACET: Partial<Record<Token['type'], FacetKind>> = {
	autolink: 'url',
	mention: 'mention',
	topic: 'tag',
};

function isBoundaryBefore(text: string, i: number) {
	if (i === 0) {
		return true;
	}
	const prev = text[i - 1]!;
	return prev === '(' || WHITESPACE.test(prev);
}

/**
 * splits input into highlighted and plain text runs.
 *
 * @param text the full input text
 * @returns ordered spans whose `raw` values concatenate back to `text`
 */
export function buildSpans(text: string): TextSpan[] {
	const spans: TextSpan[] = [];
	let pending = '';

	const flush = () => {
		if (pending) {
			spans.push({ raw: pending, facet: null });
			pending = '';
		}
	};

	// use the publish parser so highlights match published facets.
	for (const token of tokenize(text)) {
		const facet = TOKEN_FACET[token.type];
		if (facet) {
			flush();
			spans.push({ raw: token.raw, facet });
		} else {
			pending += token.raw;
		}
	}
	flush();

	return spans;
}

/**
 * finds the autocomplete query ending at the caret.
 *
 * @param text the full input text
 * @param cursor the caret's UTF-16 offset
 * @returns the active completion, or null when the caret isn't inside one
 */
export function findCompletion(text: string, cursor: number): Completion | null {
	for (let i = cursor - 1; i >= 0; i--) {
		const ch = text[i]!;
		if (WHITESPACE.test(ch)) {
			break;
		}
		const type = TRIGGERS[ch];
		if (type && isBoundaryBefore(text, i)) {
			const query = text.slice(i + 1, cursor);
			if (!COMPLETION_BODY[type].test(query)) {
				return null;
			}
			return {
				type,
				query,
				range: { start: i, end: cursor },
			};
		}
	}
	return null;
}
