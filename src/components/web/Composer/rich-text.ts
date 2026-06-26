import { type Token, tokenize } from '@atcute/bluesky-richtext-parser';

// The vocabulary here keeps three concepts distinct:
//   token      — a lexical unit from the richtext parser (the source of truth for what gets posted)
//   facet      — a token that maps to highlighted text in the overlay (mention/tag/url)
//   completion — the in-progress autocomplete target at the cursor (emoji/mention/tag), detected
//                independently of the parser

/** A token kind that the overlay highlights. URLs are highlighted but never autocompleted. */
export type FacetKind = 'mention' | 'tag' | 'url';

/** A trigger-opened autocomplete target. URLs have no trigger; emoji highlight nothing. */
export type CompletionType = 'emoji' | 'mention' | 'tag';

/** A run of the composed text, tagged with the facet kind it should be highlighted as (if any). */
export type ComposerSpan = {
	raw: string;
	/** non-null for runs the publish parser recognizes as a highlighted facet. */
	facet: FacetKind | null;
};

/** The in-progress completion at the cursor that drives the autocomplete query and popup anchor. */
export type Completion = {
	type: CompletionType;
	/** the text after the trigger sigil, e.g. `han` for `@han`. */
	query: string;
	/** the sigil-inclusive range `[start, end)` in the text, used to splice in a picked suggestion. */
	range: { end: number; start: number };
};

const WHITESPACE = /\s/;

// Trigger chars (incl. their fullwidth variants) that open a completion at the cursor.
const TRIGGERS: Record<string, CompletionType> = {
	'#': 'tag',
	':': 'emoji',
	'@': 'mention',
	'＃': 'tag',
	'＠': 'mention',
};

// The characters each completion's query may contain after the sigil. The completion ends at the first
// char outside this set, so trailing punctuation (`@alice,`, `:smile:.`, `(@a.b.c)`) closes it without
// being swept into the replacement range. Deliberately decoupled from the tokenizer's exact handle/tag
// rules — highlighting stays parser-driven (TOKEN_FACET); this only governs the in-progress query. Dots
// stay in mentions (handles contain them); a trailing dot is the one ambiguous case, left in the query
// and stripped downstream by the typeahead.
const COMPLETION_BODY: Record<CompletionType, RegExp> = {
	emoji: /^[+\-0-9_a-z]*$/i,
	mention: /^[.\-0-9a-z]*$/i,
	tag: /^\S*$/,
};

// Maps an @atcute parser token type to the facet kind it highlights. Token types absent here (text,
// cashtag, escape, markdown styles, emote, …) render as plain text. Emote is intentionally omitted:
// emoji exist only to drive completions, so a finished `:smile:` stays plain.
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
 * Splits `text` into the highlighted/plain runs the preview overlay renders.
 *
 * @param text the full composer text
 * @returns ordered spans whose `raw` values concatenate back to `text`
 */
export function buildSpans(text: string): ComposerSpan[] {
	const spans: ComposerSpan[] = [];
	let pending = '';

	const flush = () => {
		if (pending) {
			spans.push({ raw: pending, facet: null });
			pending = '';
		}
	};

	// highlight off the same parser the publish path uses, so the overlay can't drift from what posts.
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
 * Finds the completion the caret is inside — its trigger type, query, and the range to replace on accept.
 *
 * @param text the full composer text
 * @param cursor the caret offset
 * @returns the active completion, or null when the caret isn't inside one
 */
export function findCompletion(text: string, cursor: number): Completion | null {
	for (let i = cursor - 1; i >= 0; i--) {
		const ch = text[i]!;
		// triggers don't span across words.
		if (WHITESPACE.test(ch)) {
			break;
		}
		const type = TRIGGERS[ch];
		if (type && isBoundaryBefore(text, i)) {
			const query = text.slice(i + 1, cursor);
			// a char outside the completion's body means it already closed before the cursor (`@a,`,
			// `:smile:.`); the caret isn't in an in-progress completion.
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

/**
 * Builds a DOM `Range` over the `[start, end)` text offsets within `root`.
 *
 * @param root an element whose text content mirrors the offsets' coordinate space
 * @param start the start offset
 * @param end the end offset
 * @returns the range, or null when the offsets fall outside the content
 */
export function rangeFromOffsets(root: Node, start: number, end: number): Range | null {
	const from = findNodePosition(root, start);
	const to = findNodePosition(root, end);
	if (!from || !to) {
		return null;
	}
	const range = document.createRange();
	range.setStart(from.node, from.offset);
	range.setEnd(to.node, to.offset);
	return range;
}

function findNodePosition(node: Node, offset: number): { node: Node; offset: number } | null {
	if (node.nodeType === Node.TEXT_NODE) {
		return { node, offset };
	}
	for (const child of node.childNodes) {
		const len = child.textContent?.length ?? 0;
		if (offset <= len) {
			return findNodePosition(child, offset);
		}
		offset -= len;
	}
	return null;
}
