import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';

import { type DebounceOptions, type Debounced, debounce } from '#/lib/debounce';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

/** what happens to a pending trailing invocation when the owning component unmounts. */
type UnmountBehavior =
	/** discard it. */
	| 'cancel'
	/** invoke it immediately, during teardown. */
	| 'flush'
	/** leave the timer running; it fires on schedule regardless of the component's fate. */
	| 'ignore';

type UseDebouncedCallbackOptions = DebounceOptions & {
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

/**
 * a value that follows `value` only once it has stopped changing for `wait` ms.
 *
 * @param value the value to defer
 * @param wait milliseconds of quiet required before the value is adopted
 * @returns the most recent settled value
 */
export const useDebouncedValue = <T>(value: T, wait: number): T => {
	const [settled, setSettled] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setSettled(value), wait);
		return () => clearTimeout(timer);
	}, [value, wait]);

	return settled;
};

/**
 * a value that follows `value` at most once every `wait` ms.
 *
 * @param value the value to sample
 * @param wait milliseconds between samples
 * @returns the most recently sampled value
 */
export const useThrottledValue = <T>(value: T, wait: number): T => {
	const pending = useRef(value);
	const [sampled, setSampled] = useState(value);

	useEffect(() => {
		pending.current = value;
	}, [value]);

	const sample = useEffectEvent(() => {
		if (pending.current !== sampled) {
			setSampled(pending.current);
		}
	});

	useEffect(() => {
		const timer = setInterval(sample, wait);
		return () => clearInterval(timer);
	}, [wait]);

	return sampled;
};
