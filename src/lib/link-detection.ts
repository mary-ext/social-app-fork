import { tokenize } from '@atcute/bluesky-richtext-parser';

export type LinkFacetMatch = {
	uri: string;
	/** text after the link, used to detect when typing is complete. */
	textAfter: string;
};

/**
 * detects scheme-prefixed link URLs in a text, mapping each URL to its match metadata.
 *
 * @param text compose-input text
 * @returns map of detected URLs to match metadata
 */
export function detectLinks(text: string): Map<string, LinkFacetMatch> {
	const matches = new Map<string, LinkFacetMatch>();
	let cursor = 0;
	for (const token of tokenize(text)) {
		if (token.type === 'autolink') {
			matches.set(token.url, { uri: token.url, textAfter: text.slice(cursor + token.raw.length) });
		}
		cursor += token.raw.length;
	}
	return matches;
}

export function suggestLinkCardUri(
	suggestLinkImmediately: boolean,
	nextDetectedUris: Map<string, LinkFacetMatch>,
	prevDetectedUris: Map<string, LinkFacetMatch>,
	pastSuggestedUris: Set<string>,
): string | undefined {
	const suggestedUris = new Set<string>();
	for (const [uri, nextMatch] of nextDetectedUris) {
		if (pastSuggestedUris.has(uri)) {
			continue;
		}
		if (suggestLinkImmediately) {
			suggestedUris.add(uri);
			continue;
		}
		const prevMatch = prevDetectedUris.get(uri);
		if (!prevMatch) {
			continue;
		}
		const prevTextAfterUri = prevMatch.textAfter;
		const nextTextAfterUri = nextMatch.textAfter;
		if (prevTextAfterUri === nextTextAfterUri) {
			suggestedUris.add(uri);
			continue;
		}
		if (/^\s/m.test(nextTextAfterUri)) {
			suggestedUris.add(uri);
			continue;
		}
		if (/^[)]?[.,:;!?)](\s|$)/m.test(prevTextAfterUri) && /^[)]?[.,:;!?)]\s/m.test(nextTextAfterUri)) {
			suggestedUris.add(uri);
			continue;
		}
	}
	for (const uri of pastSuggestedUris) {
		if (!nextDetectedUris.has(uri)) {
			pastSuggestedUris.delete(uri);
		}
	}

	let suggestedUri: string | undefined;
	if (suggestedUris.size > 0) {
		suggestedUri = Array.from(suggestedUris)[0]!;
		pastSuggestedUris.add(suggestedUri);
	}

	return suggestedUri;
}
