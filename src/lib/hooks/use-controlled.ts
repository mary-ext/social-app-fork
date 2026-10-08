import { useState } from 'react';

/**
 * uses a controlled prop or internal state, with the mode fixed on first render.
 *
 * @param options.controlled controlled value; `undefined` falls back to internal state
 * @param options.default initial internal value
 * @returns current value and a setter that is ignored in controlled mode
 */
export const useControlled = <T>({
	controlled,
	default: defaultValue,
}: {
	controlled: T | undefined;
	default: T;
}): [value: T, setUncontrolled: (next: T) => void] => {
	// state permits render-time reads without violating react/refs.
	// oxlint-disable-next-line react/hook-use-state -- value is constant
	const [isControlled] = useState(controlled !== undefined);
	const [state, setState] = useState(defaultValue);

	const setUncontrolled = (next: T) => {
		if (!isControlled) {
			setState(next);
		}
	};

	return [isControlled && controlled !== undefined ? controlled : state, setUncontrolled];
};
