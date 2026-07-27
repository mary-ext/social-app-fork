import type { Promisable } from 'type-fest';

type TaskFunction<TArgs extends unknown[], TReturn> = (
	...args: { [K in keyof TArgs]: Promisable<TArgs[K]> }
) => Promise<TReturn>;

/**
 * lifts a function to accept promise arguments, awaiting them before execution.
 *
 * @param fn function to lift
 * @returns lifted function
 */
export const task = <TArgs extends unknown[], TReturn>(
	fn: (...args: TArgs) => Promisable<TReturn>,
): TaskFunction<TArgs, TReturn> => {
	return async (...args) => {
		const resolved = await Promise.all(args);
		resolved satisfies TArgs;

		return await fn(...resolved);
	};
};

type Waiter = {
	next: Waiter | undefined;
	resolve: () => void;
};

/**
 * limits the concurrent executions of a function.
 *
 * @param concurrency maximum concurrent calls
 * @param fn function to wrap
 * @returns wrapped function
 */
export const limitConcurrency = <TArgs extends unknown[], TReturn>(
	concurrency: number,
	fn: (...args: TArgs) => Promisable<TReturn>,
): ((...args: TArgs) => Promise<TReturn>) => {
	let head: Waiter | undefined;
	let tail: Waiter | undefined;
	let running = 0;

	const release = () => {
		if (head) {
			const { resolve } = head;

			head = head.next;
			if (!head) {
				tail = undefined;
			}

			resolve();
		} else {
			running--;
		}
	};

	return async (...args) => {
		if (running < concurrency) {
			running++;
		} else {
			const { promise, resolve } = Promise.withResolvers<void>();
			const waiter: Waiter = { next: undefined, resolve };

			if (tail) {
				tail.next = waiter;
			} else {
				head = waiter;
			}
			tail = waiter;

			await promise;
		}

		try {
			return await fn(...args);
		} finally {
			release();
		}
	};
};
