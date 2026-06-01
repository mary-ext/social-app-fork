import { tokenize } from '@atcute/bluesky-richtext-parser';

export type LinkFacetMatch = {
	uri: string;
	/** The source text that follows the link, used to decide when the user has finished typing it. */
	textAfter: string;
};

/**
 * Detects scheme-prefixed link URLs in `text`, mapping each URL to the text that follows it. Works in plain
 * JS-string space — no facets or byte offsets, since detection is a purely visual concern.
 *
 * @param text the compose-input text.
 * @returns a map of detected URL to its match metadata.
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
			// Don't suggest already added or already dismissed link cards.
			continue;
		}
		if (suggestLinkImmediately) {
			// Immediately add the pasted or intent-prefilled link without waiting to type more.
			suggestedUris.add(uri);
			continue;
		}
		const prevMatch = prevDetectedUris.get(uri);
		if (!prevMatch) {
			// If the same exact link wasn't already detected during the last keystroke,
			// it means you're probably still typing it. Disregard until it stabilizes.
			continue;
		}
		const prevTextAfterUri = prevMatch.textAfter;
		const nextTextAfterUri = nextMatch.textAfter;
		if (prevTextAfterUri === nextTextAfterUri) {
			// The text you're editing is before the link, e.g.
			// "abc google.com" -> "abcd google.com".
			// This is a good time to add the link.
			suggestedUris.add(uri);
			continue;
		}
		if (/^\s/m.test(nextTextAfterUri)) {
			// The link is followed by a space, e.g.
			// "google.com" -> "google.com " or
			// "google.com." -> "google.com ".
			// This is a clear indicator we can linkify it.
			suggestedUris.add(uri);
			continue;
		}
		if (/^[)]?[.,:;!?)](\s|$)/m.test(prevTextAfterUri) && /^[)]?[.,:;!?)]\s/m.test(nextTextAfterUri)) {
			// The link was *already* being followed by punctuation,
			// and now it's followed both by punctuation and a space.
			// This means you're typing after punctuation, e.g.
			// "google.com." -> "google.com. " or
			// "google.com.foo" -> "google.com. foo".
			// This means you're not typing the link anymore, so we can linkify it.
			suggestedUris.add(uri);
			continue;
		}
	}
	for (const uri of pastSuggestedUris) {
		if (!nextDetectedUris.has(uri)) {
			// If a link is no longer detected, it's eligible for suggestions next time.
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
