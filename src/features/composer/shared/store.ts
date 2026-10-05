import { useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

/** a value that components subscribe to. */
export type Store<T> = {
	get: () => T;
	/** replaces the value and notifies subscribers; no-op if unchanged. */
	set: (value: T) => void;
	subscribe: (listener: () => void) => () => void;
};

/**
 * creates a subscribable value.
 *
 * @param initial the initial value
 * @returns the store
 */
export const createStore = <T>(initial: T): Store<T> => {
	const emitter = new SimpleEventEmitter<[]>();
	let value = initial;

	return {
		get() {
			return value;
		},
		set(next) {
			if (next !== value) {
				value = next;
				emitter.emit();
			}
		},
		subscribe(listener) {
			return emitter.subscribe(listener);
		},
	};
};

/**
 * reads a store, rerendering when it changes.
 *
 * @param store the store
 * @returns the current value
 */
export const useStore = <T>(store: Store<T>): T => {
	return useSyncExternalStore(store.subscribe, store.get);
};
