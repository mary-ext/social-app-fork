import { useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

const emitter = new SimpleEventEmitter<[]>();

/** threads whose mute state has been toggled this session, keyed by root post uri */
const mutes = new Map<string, boolean>();

const subscribe = (onStoreChange: () => void) => emitter.subscribe(onStoreChange);

/** records whether the thread rooted at `uri` is muted. */
export const setThreadMute = (uri: string, value: boolean) => {
	mutes.set(uri, value);
	emitter.emit();
};

/** whether the thread root is muted */
export const useIsThreadMuted = (uri: string, defaultValue = false) => {
	return useSyncExternalStore(subscribe, () => mutes.get(uri) ?? defaultValue);
};
