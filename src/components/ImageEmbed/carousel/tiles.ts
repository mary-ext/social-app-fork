import { getReducedMotion } from '#/lib/browser/reduced-motion';

/**
 * gets a carousel's direct element children.
 *
 * @param el carousel container
 * @returns carousel tiles
 */
export function getTiles(el: HTMLElement) {
	return [...el.children].filter((node) => node instanceof HTMLElement);
}

/**
 * scrolls a carousel tile to the leading edge.
 *
 * @param options scroll target
 */
export function scrollToTile({
	el,
	scrollPaddingLeft,
	tile,
}: {
	el: HTMLElement;
	scrollPaddingLeft: number;
	tile: HTMLElement;
}) {
	el.scrollTo({
		behavior: getReducedMotion() ? 'instant' : 'smooth',
		left: getTileOffset(tile, scrollPaddingLeft),
	});
}

/**
 * gets a tile's leading-edge scroll offset.
 *
 * @param tile tile to measure
 * @param scrollPaddingLeft carousel padding
 * @returns scroll offset
 */
export function getTileOffset(tile: HTMLElement, scrollPaddingLeft: number) {
	return tile.offsetLeft - scrollPaddingLeft;
}
