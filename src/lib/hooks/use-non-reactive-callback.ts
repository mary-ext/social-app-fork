import { useCallback, useInsertionEffect, useRef } from 'react';

/**
 * returns a non-reactive version of the provided function.
 *
 * use sparingly. this erases reactivity; changes to captured state will not trigger updates down the tree.
 * avoid calling the returned function during rendering as captured values may be stale. for objects, use
 * `useNonReactiveObject` instead.
 */
type AnyFn = (...args: never[]) => unknown;

export function useNonReactiveCallback<T extends AnyFn = () => void>(fn?: T): T {
	const ref = useRef(fn);
	useInsertionEffect(() => {
		ref.current = fn;
	}, [fn]);
	const stable = useCallback(
		(...args: Parameters<T>): ReturnType<T> => {
			const latestFn = ref.current;
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `T`'s constraint returns `unknown`, erasing `ReturnType<T>`
			return latestFn?.(...args) as ReturnType<T>;
		},
		[ref],
	);
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- restores the caller's own `T`
	return stable as unknown as T;
}
