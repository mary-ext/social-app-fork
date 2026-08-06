import { useSyncExternalStore } from 'react';

/** @returns whether the document has a fullscreen element. */
export function isFullscreen() {
	return document.fullscreenElement !== null;
}

/**
 * subscribes to fullscreen state changes.
 *
 * @param cb receives the new state
 * @returns a function that unsubscribes
 */
export function onFullscreenChange(cb: (fullscreen: boolean) => void) {
	const handler = () => cb(isFullscreen());
	document.addEventListener('fullscreenchange', handler);
	return () => document.removeEventListener('fullscreenchange', handler);
}

const subscribe = (onStoreChange: () => void) => onFullscreenChange(onStoreChange);

/** @returns the current fullscreen state. */
export function useIsFullscreen() {
	return useSyncExternalStore(subscribe, isFullscreen);
}
