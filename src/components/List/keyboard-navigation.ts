export const ITEM_ATTRIBUTE = 'data-list-item';

/** keeps list items in the tab order so dialogs can restore focus after keyboard actions. */
export const listItemProps = {
	[ITEM_ATTRIBUTE]: '',
	tabIndex: 0,
} as const;

/**
 * focuses an adjacent rendered item, aligned below sticky headers. starts at the first visible item when
 * focus is outside the list or off-screen. does nothing if the target isn't rendered.
 *
 * @param container the list's root element
 * @param direction `1` for the next item, `-1` for the previous
 */
export const moveListFocus = (container: HTMLElement, direction: 1 | -1): void => {
	const items = Array.from(container.querySelectorAll<HTMLElement>(`[${ITEM_ATTRIBUTE}]`));
	const current = items.findIndex((item) => item.contains(document.activeElement));
	const top = getObscuredTop(container);

	const isOnScreen = (item: HTMLElement): boolean => {
		const rect = item.getBoundingClientRect();
		return rect.bottom > top && rect.top < window.innerHeight;
	};

	let target: HTMLElement | undefined;
	if (current !== -1 && isOnScreen(items[current]!)) {
		target = items[current + direction];
	} else {
		target = items.find(isOnScreen);
	}

	if (target === undefined) {
		return;
	}

	target.focus({ preventScroll: true });

	// sticky headers may change after scrolling; bound retries to avoid oscillation
	let delta = target.getBoundingClientRect().top - top;
	for (let pass = 0; pass < 3 && Math.abs(delta) >= 1; pass++) {
		window.scrollBy({ behavior: 'instant', top: delta });
		delta = target.getBoundingClientRect().top - getObscuredTop(container);
	}
};

// detect stacked headers without coupling navigation to screen layouts
const getObscuredTop = (container: HTMLElement): number => {
	const rect = container.getBoundingClientRect();
	const x = rect.left + rect.width / 2;

	let top = 0;
	while (top < window.innerHeight) {
		const hit = document.elementFromPoint(x, top);
		const sticky = hit && !container.contains(hit) ? getStickyAncestor(hit) : null;
		if (sticky === null) {
			break;
		}

		top = Math.max(top + 1, sticky.getBoundingClientRect().bottom);
	}

	return top;
};

const getStickyAncestor = (element: Element): Element | null => {
	for (let node: Element | null = element; node !== null; node = node.parentElement) {
		const position = getComputedStyle(node).position;
		if (position === 'sticky' || position === 'fixed') {
			return node;
		}
	}

	return null;
};
