import { useRef } from 'react';

/**
 * provides a function that can only be called once.
 *
 * @returns a function that invokes the callback it is given on the first call, and ignores it after
 */
export const useCallOnce = (): ((cb: () => void) => void) => {
	const ran = useRef(false);
	return (cb) => {
		if (ran.current) {
			return;
		}
		ran.current = true;
		cb();
	};
};
