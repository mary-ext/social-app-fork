import { useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

interface MediaQueryStore {
	subscribe: (listener: () => void) => () => void;
	getSnapshot: () => boolean;
}

const cache = new Map<string, MediaQueryStore>();

const getStore = (query: string): MediaQueryStore => {
	let store = cache.get(query);
	if (store === undefined) {
		const emitter = new SimpleEventEmitter<[]>();

		const mql = window.matchMedia(query);
		const onChange = () => emitter.emit();

		store = {
			subscribe(listener) {
				if (!emitter.hasListeners()) {
					mql.addEventListener('change', onChange);
					cache.set(query, store!);
				}

				const unsubscribe = emitter.subscribe(listener);

				return () => {
					unsubscribe();

					if (!emitter.hasListeners()) {
						mql.removeEventListener('change', onChange);
						cache.delete(query);
					}
				};
			},
			getSnapshot: () => mql.matches,
		};

		cache.set(query, store);
	}

	return store;
};

/**
 * Reactive media query hook.
 *
 * @param query CSS media query string, e.g. `'(width >= 768px)'`
 * @returns whether the media query currently matches
 */
export const useMediaQuery = (query: string): boolean => {
	const store = getStore(query);

	return useSyncExternalStore(store.subscribe, store.getSnapshot);
};
