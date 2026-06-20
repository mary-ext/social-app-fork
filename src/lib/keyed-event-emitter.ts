import { type CleanupFunction, type EventListener, SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

/**
 * A {@link SimpleEventEmitter} multiplexed over string keys: each key owns an independent set of listeners.
 * Backing emitters are created lazily on first subscribe and dropped once their last listener unsubscribes,
 * so an emitter that fires across an unbounded key space (post URIs, DIDs) doesn't retain a per-key entry
 * forever.
 */
export class KeyedEventEmitter<TArgs extends unknown[], TKey extends string = string> {
	#emitters = new Map<TKey, SimpleEventEmitter<TArgs>>();

	/**
	 * Subscribes a listener to a single key.
	 *
	 * @param key Key whose events the listener receives.
	 * @param listener Callback invoked on each {@link emit} for `key`.
	 * @returns A function that removes the listener.
	 */
	subscribe(key: TKey, listener: EventListener<TArgs>): CleanupFunction {
		let emitter = this.#emitters.get(key);
		if (!emitter) {
			emitter = new SimpleEventEmitter();
			this.#emitters.set(key, emitter);
		}

		const unsubscribe = emitter.subscribe(listener);
		return () => {
			unsubscribe();
			if (!emitter.hasListeners()) {
				this.#emitters.delete(key);
			}
		};
	}

	/**
	 * Emits to every listener subscribed to a key.
	 *
	 * @param key Key to emit on.
	 * @param args Arguments forwarded to the listeners.
	 * @returns `true` if any listener received the event, otherwise `false`.
	 */
	emit(key: TKey, ...args: TArgs): boolean {
		return this.#emitters.get(key)?.emit(...args) ?? false;
	}
}
