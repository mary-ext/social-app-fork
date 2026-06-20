import { useMemo, useSyncExternalStore } from 'react';
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
		mql.onchange = () => emitter.emit();

		store = {
			subscribe(listener) {
				const unsubscribe = emitter.subscribe(listener);

				return () => {
					unsubscribe();

					if (!emitter.hasListeners()) {
						mql.onchange = null;
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
	const store = useMemo(() => getStore(query), [query]);

	return useSyncExternalStore(store.subscribe, store.getSnapshot);
};
