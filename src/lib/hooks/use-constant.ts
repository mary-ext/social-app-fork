import { useState } from 'react';

/**
 * returns a value created once for the component instance, stable across renders. for component-lifetime
 * constants — imperative handles, class instances, mount-time snapshots — that are never updated after
 * creation.
 *
 * @param init lazily produces the value; may run more than once in dev StrictMode or aborted concurrent
 *   renders, matching useState's lazy initializer
 * @returns the value produced by init
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
