import { useRef } from 'react';

export function useDedupe(timeout = 250) {
	const canDo = useRef(true);

	return (cb: () => unknown) => {
		if (canDo.current) {
			canDo.current = false;
			setTimeout(() => {
				canDo.current = true;
			}, timeout);
			cb();
			return true;
		}
		return false;
	};
}
