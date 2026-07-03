import { useCallback, useInsertionEffect, useRef } from 'react';

const noop = () => {};

/**
 * returns a non-reactive version of the provided function.
 *
 * use sparingly. this erases reactivity; changes to captured state will not trigger updates down the tree.
 * avoid calling the returned function during rendering as captured values may be stale. for objects, use
 * `useNonReactiveObject` instead.
 */
type AnyFn = (...args: never[]) => unknown;

export function useNonReactiveCallback<T extends AnyFn = () => void>(fn?: T): T {
	const ref = useRef<T>((fn ?? noop) as T);
	useInsertionEffect(() => {
		ref.current = (fn ?? noop) as T;
	}, [fn]);
	return useCallback(
		(...args: Parameters<T>): ReturnType<T> => {
			const latestFn = ref.current;
			return latestFn(...args) as ReturnType<T>;
		},
		[ref],
	) as unknown as T;
}
