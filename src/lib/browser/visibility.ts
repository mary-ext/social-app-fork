import { useSyncExternalStore } from 'react';

/**
 * whether the document is currently visible to the user, i.e. its tab is foregrounded and the window is not
 * minimized.
 *
 * @returns `true` when the document is visible.
 */
export function isDocumentVisible() {
	return document.visibilityState === 'visible';
}

/**
 * subscribe to document visibility changes.
 *
 * @param cb invoked with the new visibility whenever the document shows or hides.
 * @returns an unsubscribe function.
 */
export function onVisibilityChange(cb: (visible: boolean) => void) {
	const handler = () => cb(isDocumentVisible());
	document.addEventListener('visibilitychange', handler);
	return () => document.removeEventListener('visibilitychange', handler);
}

const subscribe = (onStoreChange: () => void) => onVisibilityChange(() => onStoreChange());

/**
 * reactive document visibility; re-renders the component whenever the document shows or hides.
 *
 * @returns `true` when the document is visible.
 */
export function useIsDocumentVisible() {
	return useSyncExternalStore(subscribe, isDocumentVisible, () => true);
}
