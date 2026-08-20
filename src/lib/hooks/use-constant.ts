import { useState } from 'react';

/**
 * returns a stable value created once for the component instance.
 *
 * @param init lazy initializer that produces the value
 * @returns the initialized value
 */
export const useConstant = <T>(init: () => T): T => {
	// state permits render-time reads without violating react/refs.
	// oxlint-disable-next-line react/hook-use-state -- value is constant
	const [value] = useState<T>(init);
	return value;
};
