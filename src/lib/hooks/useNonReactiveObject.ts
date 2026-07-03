import { useInsertionEffect, useRef } from 'react';

/**
 * returns a non-reactive version of the provided value. use sparingly, as changes to the underlying state
 * will not trigger updates in components reading this value.
 *
 * @see useNonReactiveCallback for callbacks.
 */
export function useNonReactiveObject<T extends Record<string, unknown>>(o: T): React.RefObject<T> {
	const ref = useRef(o);
	useInsertionEffect(() => {
		ref.current = o;
	}, [o]);
	return ref;
}
