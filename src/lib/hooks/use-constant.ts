import { useState } from 'react';

/**
 * returns a stable value created once for the component instance.
 *
 * @param init lazy initializer that produces the value
 * @returns the initialized value
 */
export const useConstant = <T>(init: () => T): T => {
	// useState-backed rather than useRef: these values are often read during render (returned,
	// or consumed by a memo), and this repo enables react-hooks/refs, which flags ref.current
	// reads in the render path. the lint suppression is local because the missing setter is the
	// whole point of this hook.
	// eslint-disable-next-line react/hook-use-state -- intentionally a single-value constant, no setter
	const [value] = useState<T>(init);
	return value;
};
