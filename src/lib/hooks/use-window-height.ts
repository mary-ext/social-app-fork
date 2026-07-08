import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => {
	window.addEventListener('resize', onChange);
	return () => window.removeEventListener('resize', onChange);
};

const getSnapshot = () => window.innerHeight;

/**
 * reactively reads the viewport height, re-rendering on window resize.
 *
 * @returns the current `window.innerHeight` in pixels
 */
export const useWindowHeight = (): number => useSyncExternalStore(subscribe, getSnapshot);
