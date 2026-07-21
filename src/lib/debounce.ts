export type DebounceOptions = {
	/** invoke on the leading edge of the wait window. defaults to `false`. */
	leading?: boolean;
	/** upper bound on how long invocation can be deferred by repeated calls. */
	maxWait?: number;
	/** invoke on the trailing edge of the wait window. defaults to `true`. */
	trailing?: boolean;
};

export type Debounced<A extends unknown[]> = {
	(...args: A): void;
	/** discards any pending invocation. */
	cancel: () => void;
	/** invokes any pending invocation immediately. no-op if nothing is pending. */
	flush: () => void;
};

/**
 * creates a function that defers invoking `fn` until `wait` ms have elapsed since the last time it was
 * called, using the most recent arguments. the deferred call has no return value.
 *
 * @param fn the function to defer
 * @param wait milliseconds to wait after the last call
 * @param options edge and `maxWait` behavior
 * @returns the debounced function, with `cancel` and `flush` attached
 */
export const debounce = <A extends unknown[]>(
	fn: (...args: A) => unknown,
	wait: number,
	{ leading = false, maxWait, trailing = true }: DebounceOptions = {},
): Debounced<A> => {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pendingArgs: A | undefined;
	// 0 makes the first call read as long overdue, so it takes the leading edge.
	let lastCallTime = 0;
	let lastInvokeTime = 0;

	const invoke = (now: number) => {
		const args = pendingArgs;
		pendingArgs = undefined;
		lastInvokeTime = now;
		if (args !== undefined) {
			fn(...args);
		}
	};

	const shouldInvoke = (now: number) => {
		const sinceCall = now - lastCallTime;
		// `sinceCall < 0` keeps a backwards clock jump from stranding the pending invocation.
		return sinceCall >= wait || sinceCall < 0 || (maxWait !== undefined && now - lastInvokeTime >= maxWait);
	};

	const remainingWait = (now: number) => {
		const untilTrailing = wait - (now - lastCallTime);
		if (maxWait === undefined) {
			return untilTrailing;
		}
		return Math.min(untilTrailing, maxWait - (now - lastInvokeTime));
	};

	const onTimerExpired = () => {
		const now = Date.now();
		if (!shouldInvoke(now)) {
			// calls arrived after this timer was scheduled, pushing the edge out
			timer = setTimeout(onTimerExpired, remainingWait(now));
			return;
		}
		timer = undefined;
		if (trailing) {
			invoke(now);
		}
		pendingArgs = undefined;
	};

	const debounced = (...args: A) => {
		const now = Date.now();
		const isInvoking = shouldInvoke(now);

		pendingArgs = args;
		lastCallTime = now;

		if (isInvoking) {
			if (timer === undefined) {
				// leading edge. advance `lastInvokeTime` even when `leading` is false, so `maxWait` measures from
				// the start of the window rather than from an invocation that never happened.
				lastInvokeTime = now;
				timer = setTimeout(onTimerExpired, wait);
				if (leading) {
					invoke(now);
				}
				return;
			}
			if (maxWait !== undefined) {
				// `maxWait` elapsed mid-window: invoke now and open a fresh window
				clearTimeout(timer);
				timer = setTimeout(onTimerExpired, wait);
				invoke(now);
				return;
			}
		}

		if (timer === undefined) {
			timer = setTimeout(onTimerExpired, wait);
		}
	};

	debounced.cancel = () => {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
		pendingArgs = undefined;
		lastCallTime = 0;
		lastInvokeTime = 0;
	};

	debounced.flush = () => {
		if (timer === undefined) {
			return;
		}
		clearTimeout(timer);
		timer = undefined;
		if (trailing) {
			invoke(Date.now());
		}
		pendingArgs = undefined;
	};

	return debounced;
};

/**
 * creates a function that invokes `fn` at most once per `wait` ms — {@link debounce} with `maxWait` pinned to
 * `wait` and both edges enabled by default.
 *
 * @param fn the function to throttle
 * @param wait milliseconds between invocations
 * @param options edge behavior
 * @returns the throttled function, with `cancel` and `flush` attached
 */
export const throttle = <A extends unknown[]>(
	fn: (...args: A) => unknown,
	wait: number,
	{ leading = true, trailing = true }: Omit<DebounceOptions, 'maxWait'> = {},
): Debounced<A> => {
	return debounce(fn, wait, { leading, maxWait: wait, trailing });
};
