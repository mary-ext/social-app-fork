/**
 * finds the nearest overflowing vertical scroll ancestor without crossing fixed/sticky ancestors or the body.
 *
 * @param element the element to start from, excluded from the search
 * @returns the scroller, or null if none is found
 */
export const findScrollParent = (element: HTMLElement): HTMLElement | null => {
	for (let cur = element.parentElement; cur && cur !== document.body; cur = cur.parentElement) {
		const { overflowY, position } = getComputedStyle(cur);
		if ((overflowY === 'auto' || overflowY === 'scroll') && cur.scrollHeight > cur.clientHeight) {
			return cur;
		}
		if (position === 'fixed' || position === 'sticky') {
			return null;
		}
	}
	return null;
};
