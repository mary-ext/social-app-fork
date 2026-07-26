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

/** a coarse timestamp that advances on its own */
export const useTick = () => useSyncExternalStore(subscribe, getTick);
