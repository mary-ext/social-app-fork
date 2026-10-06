/**
 * finds the nearest vertical scroll ancestor, even if it doesn't overflow yet.
 *
 * @param element the element to start from, excluded from the search
 * @returns the scroller, or null at the body or a non-scrolling fixed/sticky ancestor
 */
export const findScrollParent = (element: HTMLElement): HTMLElement | null => {
	for (let cur = element.parentElement; cur && cur !== document.body; cur = cur.parentElement) {
		const { overflowY, position } = getComputedStyle(cur);
		if (overflowY === 'auto' || overflowY === 'scroll') {
			return cur;
		}
		if (position === 'fixed' || position === 'sticky') {
			return null;
		}
	}
	return null;
};
