import { useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

const emitter = new SimpleEventEmitter<[]>();

let tick = Date.now();

setInterval(() => {
	tick = Date.now();
	emitter.emit();
}, 60_000);

const subscribe = (onStoreChange: () => void) => emitter.subscribe(onStoreChange);

const getTick = () => tick;

const noopSubscribe = () => () => {};

/**
 * provides a timestamp that updates once a minute while enabled.
 *
 * @param enabled whether to subscribe to updates
 * @returns the current timestamp
 */
export const useTick = (enabled = true) => useSyncExternalStore(enabled ? subscribe : noopSubscribe, getTick);
