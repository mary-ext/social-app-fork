'use no memo'; // React Compiler rejects the conditional hook call

import { type RefObject, useLayoutEffect } from 'react';

import { addHighlightRanges, isHighlightSupported, type TextHighlight } from '#/lib/browser/text-highlights';

const isSupported = isHighlightSupported && typeof HTMLInputElement.prototype.createValueRange === 'function';

/**
 * highlights input text with the CSS Custom Highlight API; no-op when unsupported.
 *
 * @param ref the input to highlight
 * @param highlights ranges in the current input value; a new array recreates the ranges
 */
export const useInputHighlights = (
	ref: RefObject<HTMLInputElement | null>,
	highlights: readonly TextHighlight[],
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

		const ranges = highlights.map(({ start, end }) => input.createValueRange(start, end));
		const remove = addHighlightRanges(highlights.map(({ name }, i) => [name, ranges[i]!]));

		return () => {
			remove();
			for (const range of ranges) {
				range.disconnect();
			}
		};
	}, [ref, highlights]);
};
