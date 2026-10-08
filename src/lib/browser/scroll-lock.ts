// lock the element supplying viewport overflow: <html> if it establishes a scroll container, else <body>.
const getViewportScroller = (): HTMLElement => {
	const html = document.documentElement;
	const { overflow, overflowX, overflowY, display } = getComputedStyle(html);
	const isScroller =
		/auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && display !== 'contents';
	return isScroller ? html : document.body;
};

const isPageLocked = (): boolean => {
	return /hidden|clip/.test(getComputedStyle(getViewportScroller()).overflowY);
};

const lockPage = (): (() => void) => {
	const html = document.documentElement;
	const scroller = getViewportScroller();
	// overlay scrollbars need no gutter compensation.
	const insetScrollbars = window.innerWidth - html.clientWidth > 0;

	const original = {
		gutter: html.style.scrollbarGutter,
		overflowX: scroller.style.overflowX,
		overflowY: scroller.style.overflowY,
	};

	if (insetScrollbars) {
		const bothEdges = getComputedStyle(html).scrollbarGutter.includes('both-edges');
		html.style.scrollbarGutter = bothEdges ? 'stable both-edges' : 'stable';
	}
	scroller.style.overflowX = 'hidden';
	scroller.style.overflowY = 'hidden';

	return () => {
		html.style.scrollbarGutter = original.gutter;
		scroller.style.overflowX = original.overflowX;
		scroller.style.overflowY = original.overflowY;
	};
};

let count = 0;
let release: (() => void) | null = null;
// defer changes so replacing one popup with another doesn't briefly unlock the page.
let pending: ReturnType<typeof setTimeout> | undefined;

const sync = (): void => {
	pending = undefined;
	if (count === 0) {
		release?.();
		release = null;
		return;
	}
	if (release !== null) {
		return;
	}

	// don't capture another owner's lock as the style to restore.
	if (isPageLocked()) {
		const observer = new MutationObserver(() => {
			if (!isPageLocked()) {
				observer.disconnect();
				release = null;
				sync();
			}
		});
		observer.observe(document.documentElement, { attributes: true });
		observer.observe(document.body, { attributes: true });
		release = () => observer.disconnect();
		return;
	}

	release = lockPage();
};

/**
 * locks page scrolling until all callers release their locks.
 *
 * @returns a release function; call exactly once
 */
export const lockScroll = (): (() => void) => {
	count++;
	pending ??= setTimeout(sync, 0);
	return () => {
		count--;
		pending ??= setTimeout(sync, 0);
	};
};
