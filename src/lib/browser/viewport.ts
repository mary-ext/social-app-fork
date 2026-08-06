import { useSyncExternalStore } from 'react';

export interface ViewportSize {
	height: number;
	width: number;
}

function getRawViewportSize(): ViewportSize {
	return {
		height: window.innerHeight,
		width: window.innerWidth,
	};
}

let cachedSize = getRawViewportSize();

/**
 * the current size of the browser viewport, i.e. the area available to lay out content.
 *
 * @returns the viewport width and height in CSS pixels.
 */
export function getViewportSize(): ViewportSize {
	const size = getRawViewportSize();
	if (size.height !== cachedSize.height || size.width !== cachedSize.width) {
		cachedSize = size;
	}

	return cachedSize;
}

const subscribe = (onStoreChange: () => void) => {
	window.addEventListener('resize', onStoreChange);
	return () => window.removeEventListener('resize', onStoreChange);
};

/**
 * reactive viewport size.
 *
 * @returns the current viewport width and height in CSS pixels.
 */
export function useViewportSize() {
	return useSyncExternalStore(subscribe, getViewportSize);
}
