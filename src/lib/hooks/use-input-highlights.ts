'use no memo'; // React Compiler rejects the conditional hook call

import { type RefObject, useLayoutEffect } from 'react';

const isSupported = typeof HTMLInputElement.prototype.createValueRange === 'function' && 'highlights' in CSS;

export interface InputHighlight {
	/** highlight name, as returned by `highlightStyle()` */
	name: string;
	/** inclusive UTF-16 offset in the input value */
	start: number;
	/** exclusive UTF-16 offset in the input value */
	end: number;
}

/**
 * highlights input text with the CSS Custom Highlight API; no-op when unsupported.
 *
 * @param ref the input to highlight
 * @param highlights ranges in the current input value; a new array recreates the ranges
 */
export const useInputHighlights = (
	ref: RefObject<HTMLInputElement | null>,
	highlights: readonly InputHighlight[],
): void => {
	if (!isSupported) {
		return;
	}

	// oxlint-disable-next-line react/rules-of-hooks -- `isSupported` is constant, so the call order is stable
	useLayoutEffect(() => {
		const input = ref.current;
		if (!input) {
			return;
		}

		const owned: [highlight: Highlight, range: OpaqueRange][] = [];

		for (const { name, start, end } of highlights) {
			let highlight = CSS.highlights.get(name);
			if (highlight === undefined) {
				highlight = new Highlight();
				CSS.highlights.set(name, highlight);
			}

			const range = input.createValueRange(start, end);
			highlight.add(range);

			owned.push([highlight, range]);
		}

		return () => {
			for (const [highlight, range] of owned) {
				highlight.delete(range);
				range.disconnect();
			}
		};
	}, [ref, highlights]);
};
