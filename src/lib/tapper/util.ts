import { type Token, tokenize } from '@atcute/bluesky-richtext-parser';

import { type TapperFacet, type TapperFacetType, type TapperNode } from './types';

const WHITESPACE = /\s/;

// Trigger chars that open an in-progress facet at the cursor (driving autocomplete), mapped to the
// facet type they produce. URLs have no trigger — there is no URL autocomplete.
const TRIGGERS: Record<string, TapperFacetType> = {
	'#': 'tag',
	'＃': 'tag',
	'@': 'mention',
	'＠': 'mention',
	':': 'emoji',
};

// Maps an @atcute parser token type to the tapper facet type it highlights. Token types absent here
// (text, cashtag, escape, markdown styles, …) render as plain text, matching the publish path which
// uses the same parser.
const TOKEN_FACET_TYPE: Partial<Record<Token['type'], TapperFacetType>> = {
	autolink: 'url',
	emote: 'emoji',
	mention: 'mention',
	topic: 'tag',
};

// Mirror the boundary handling so trigger detection (for chars typed before a complete facet exists)
// doesn't fire mid-word — e.g. the `@` inside `eric@blueskyweb.xyz` should not synthesize a mention
// trigger.
function isBoundaryBefore(text: string, i: number) {
	if (i === 0) return true;
	const prev = text[i - 1]!;
	return prev === '(' || WHITESPACE.test(prev);
}
let nextNodeId = 0;

/** Builds the trigger-char → facet-type map for the enabled facet types. */
export function buildTriggers(enabled: Set<TapperFacetType>): Map<string, string> {
	const triggers = new Map<string, string>();
	for (const [ch, type] of Object.entries(TRIGGERS)) {
		if (enabled.has(type)) {
			triggers.set(ch, type);
		}
	}
	return triggers;
}

/** The value a facet token carries without its sigil, used to drive autocomplete queries. */
function tokenFacetValue(token: Token): string {
	switch (token.type) {
		case 'mention':
			return token.handle;
		case 'topic':
		case 'emote':
			return token.name;
		case 'autolink':
			return token.url;
		default:
			return token.raw;
	}
}

export function parseNodesFromText(
	text: string,
	enabled: Set<TapperFacetType>,
	prevNodes?: TapperNode[],
	cursor?: number,
	triggers?: Map<string, string>,
): TapperNode[] {
	const nodes: TapperNode[] = [];
	let pos = 0;
	// Start of a pending run of non-facet tokens, coalesced into one text node when flushed.
	let textStart = -1;

	const flushText = (end: number) => {
		if (textStart !== -1) {
			const raw = text.slice(textStart, end);
			nodes.push({ id: nextNodeId++, type: 'text', raw, value: raw, start: textStart, end });
			textStart = -1;
		}
	};

	// `tokenize` yields a gap-free, ordered token stream whose `raw` values concatenate to exactly
	// `text`, so accumulating `raw.length` gives correct UTF-16 positions (matching the cursor model).
	for (const token of tokenize(text)) {
		const start = pos;
		const end = pos + token.raw.length;

		const facetType = TOKEN_FACET_TYPE[token.type];
		if (
			facetType &&
			enabled.has(facetType) &&
			// The parser boundary-gates mentions/tags/links but not emotes, so require a boundary
			// before an emote — a mid-word `foo:bar:` should stay plain text, as it did before.
			(token.type !== 'emote' || isBoundaryBefore(text, start))
		) {
			flushText(start);
			nodes.push({
				id: nextNodeId++,
				type: 'facet',
				facetType,
				raw: token.raw,
				value: tokenFacetValue(token),
				start,
				end,
			});
		} else if (textStart === -1) {
			textStart = start;
		}

		pos = end;
	}
	flushText(pos);

	// If the cursor is right after a trigger char that isn't yet a complete facet, splice a 'trigger'
	// node out of the containing text node.
	if (cursor != null && triggers) {
		for (let i = cursor - 1; i >= 0; i--) {
			const ch = text[i]!;
			if (WHITESPACE.test(ch)) break;
			const facetType = triggers.get(ch);
			if (facetType && isBoundaryBefore(text, i)) {
				// Only create a trigger node if the trigger is inside a text node
				// (i.e. it wasn't already tokenized as a complete facet)
				const textNodeIdx = nodes.findIndex((n) => n.type === 'text' && n.start <= i && n.end > i);
				if (textNodeIdx !== -1) {
					const node = nodes[textNodeIdx]!;
					const spliced: TapperNode[] = [];
					if (node.start < i) {
						const raw = text.slice(node.start, i);
						spliced.push({
							id: nextNodeId++,
							type: 'text',
							raw,
							value: raw,
							start: node.start,
							end: i,
						});
					}
					const triggerRaw = text.slice(i, cursor);
					spliced.push({
						id: nextNodeId++,
						type: 'trigger',
						facetType,
						raw: triggerRaw,
						value: text.slice(i + ch.length, cursor),
						start: i,
						end: cursor,
					});
					if (cursor < node.end) {
						const raw = text.slice(cursor, node.end);
						spliced.push({
							id: nextNodeId++,
							type: 'text',
							raw,
							value: raw,
							start: cursor,
							end: node.end,
						});
					}
					nodes.splice(textNodeIdx, 1, ...spliced);
				}
				break;
			}
		}
	}

	// Transfer committed flags and stable IDs from previous nodes
	if (prevNodes) {
		// Facet nodes: match by facetType + occurrence index
		const counts = new Map<string, number>();
		const prevFacetsByTypeIndex = new Map<string, TapperNode>();

		for (const node of prevNodes) {
			if (node.type !== 'facet') continue;
			const idx = counts.get(node.facetType) ?? 0;
			counts.set(node.facetType, idx + 1);
			prevFacetsByTypeIndex.set(`${node.facetType}:${idx}`, node);
		}

		counts.clear();
		for (const node of nodes) {
			if (node.type !== 'facet') continue;
			const idx = counts.get(node.facetType) ?? 0;
			counts.set(node.facetType, idx + 1);
			const prev = prevFacetsByTypeIndex.get(`${node.facetType}:${idx}`);
			if (prev) {
				node.id = prev.id;
				if (prev.committed) node.committed = true;
			}
		}

		// Text nodes: match by start position
		const prevTextByStart = new Map<number, TapperNode>();
		for (const node of prevNodes) {
			if (node.type === 'text') prevTextByStart.set(node.start, node);
		}
		for (const node of nodes) {
			if (node.type === 'text') {
				const prev = prevTextByStart.get(node.start);
				if (prev) node.id = prev.id;
			}
		}
	}

	return nodes;
}

export function nodeToFacet(node: TapperNode): TapperFacet {
	return {
		type: node.facetType!,
		raw: node.raw,
		value: node.value,
		range: { start: node.start, end: node.end },
	};
}

export function detectActiveFacet(
	nodes: TapperNode[],
	text: string,
	cursor: number,
	triggers: Map<string, string>,
): TapperFacet | null {
	for (const node of nodes) {
		if (node.type === 'trigger' && node.start < cursor && cursor <= node.end) {
			return {
				type: node.facetType,
				raw: node.raw,
				value: node.value,
				range: { start: node.start, end: node.end },
			};
		}
		if (node.type === 'facet' && !node.committed && node.start < cursor && cursor <= node.end) {
			return {
				type: node.facetType,
				raw: node.raw,
				value: node.value,
				range: { start: node.start, end: node.end },
			};
		}
	}

	// Scan backward from cursor for a trigger char (partial facet not yet tokenized).
	// Skip if the cursor is inside or at the end of a committed facet.
	const inCommitted = nodes.some(
		(n) => n.type === 'facet' && n.committed && n.start < cursor && cursor <= n.end,
	);
	if (!inCommitted) {
		for (let i = cursor - 1; i >= 0; i--) {
			const ch = text[i]!;
			// Stop at whitespace — triggers don't span across words
			if (WHITESPACE.test(ch)) break;
			const type = triggers.get(ch);
			if (type && isBoundaryBefore(text, i)) {
				const raw = text.slice(i, cursor);
				return {
					type,
					raw,
					value: text.slice(i + 1, cursor),
					range: { start: i, end: cursor },
				};
			}
		}
	}

	return null;
}
