import { useEffect, useMemo } from 'react';

import { type DebounceOptions, type Debounced, debounce } from '#/lib/debounce';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';

/** what happens to a pending trailing invocation when the owning component unmounts. */
export type UnmountBehavior =
	/** discard it. */
	| 'cancel'
	/** invoke it immediately, during teardown. */
	| 'flush'
	/** leave the timer running; it fires on schedule regardless of the component's fate. */
	| 'ignore';

export type UseDebouncedCallbackOptions = DebounceOptions & {
	/** defaults to `'cancel'`. */
	onUnmount?: UnmountBehavior;
};

/**
 * a {@link debounce}d callback with an identity stable across renders. `fn` need not be memoized; the latest
 * one is always the one invoked.
 *
 * @param fn the function to defer
 * @param wait milliseconds to wait after the last call
 * @param options edge, `maxWait`, and unmount behavior
 * @returns the debounced function, with `cancel` and `flush` attached
 */
export const useDebouncedCallback = <A extends unknown[]>(
	fn: (...args: A) => unknown,
	wait: number,
	{ leading = false, maxWait, onUnmount = 'cancel', trailing = true }: UseDebouncedCallbackOptions = {},
): Debounced<A> => {
	const latest = useNonReactiveCallback(fn);

	const debounced = useMemo(() => {
		return debounce<A>(latest, wait, { leading, maxWait, trailing });
	}, [latest, leading, maxWait, trailing, wait]);

	useEffect(() => {
		if (onUnmount === 'ignore') {
			return;
		}
		// also runs when `debounced` is replaced, disposing the superseded instance's timer
		return () => {
			if (onUnmount === 'cancel') {
				debounced.cancel();
			} else {
				debounced.flush();
			}
		};
	}, [debounced, onUnmount]);

	return debounced;
};

/**
 * a throttled callback with an identity stable across renders — {@link useDebouncedCallback} with `maxWait`
 * pinned to `wait` and both edges enabled by default.
 *
 * @param fn the function to throttle
 * @param wait milliseconds between invocations
 * @param options edge and unmount behavior
 * @returns the throttled function, with `cancel` and `flush` attached
 */
export const useThrottledCallback = <A extends unknown[]>(
	fn: (...args: A) => unknown,
	wait: number,
	{
		leading = true,
		onUnmount = 'cancel',
		trailing = true,
	}: Omit<UseDebouncedCallbackOptions, 'maxWait'> = {},
): Debounced<A> => {
	return useDebouncedCallback(fn, wait, { leading, maxWait: wait, onUnmount, trailing });
};
