import { useEffect } from 'react';

import { useConstant } from './use-constant';

/** a single cancellable timeout. */
export class Timeout {
	#handle: ReturnType<typeof setTimeout> | undefined;

	/**
	 * schedules a call, replacing any pending call.
	 *
	 * @param delay delay in ms
	 * @param fn function to call
	 */
	start(delay: number, fn: () => void): void {
		this.clear();
		this.#handle = setTimeout(() => {
			this.#handle = undefined;
			fn();
		}, delay);
	}

	/** @returns whether a call is pending */
	isStarted(): boolean {
		return this.#handle !== undefined;
	}

	/** cancels the pending call. */
	clear = (): void => {
		clearTimeout(this.#handle);
		this.#handle = undefined;
	};
}

/** @returns a timeout owned by the component, cleared on unmount */
export const useTimeout = (): Timeout => {
	const timeout = useConstant(() => new Timeout());
	useEffect(() => timeout.clear, [timeout]);
	return timeout;
};
