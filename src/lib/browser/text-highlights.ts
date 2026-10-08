export const isHighlightSupported = 'highlights' in CSS;

export interface TextHighlight {
	/** highlight name, as returned by `highlightStyle()` */
	name: string;
	/** inclusive UTF-16 offset in the highlighted text */
	start: number;
	/** exclusive UTF-16 offset in the highlighted text */
	end: number;
}

/**
 * adds ranges to `CSS.highlights`. requires {@link isHighlightSupported}.
 *
 * @param entries highlight names paired with the ranges to add
 * @returns cleanup function that removes only the added ranges
 */
export const addHighlightRanges = (
	entries: readonly [name: string, range: AbstractRange][],
): (() => void) => {
	const owned: [highlight: Highlight, range: AbstractRange][] = [];

	for (const [name, range] of entries) {
		let highlight = CSS.highlights.get(name);
		if (highlight === undefined) {
			highlight = new Highlight();
			CSS.highlights.set(name, highlight);
		}

		highlight.add(range);
		owned.push([highlight, range]);
	}

	return () => {
		for (const [highlight, range] of owned) {
			highlight.delete(range);
		}
	};
};

/**
 * highlights an element's first child if it's text; no-op when unsupported.
 *
 * @param el element whose first child is the text node to highlight
 * @param highlights ranges in that text node
 * @returns cleanup function, suitable for a ref callback
 */
export const highlightText = (el: Element, highlights: readonly TextHighlight[]): (() => void) => {
	const text = el.firstChild;
	if (!isHighlightSupported || !(text instanceof Text)) {
		return () => {};
	}

	return addHighlightRanges(
		highlights.map(({ name, start, end }) => [
			name,
			new StaticRange({ startContainer: text, startOffset: start, endContainer: text, endOffset: end }),
		]),
	);
};
