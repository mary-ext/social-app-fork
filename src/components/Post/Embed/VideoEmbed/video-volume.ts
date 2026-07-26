import { useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

const emitter = new SimpleEventEmitter<[]>();

let volume = 1;

/** returns the page-wide video volume. */
export const getVideoVolume = () => volume;

/** sets the page-wide video volume. */
export const setVideoVolume = (value: number) => {
	volume = value;
	emitter.emit();
};

/** subscribes to page-wide video volume changes. */
export const subscribeVideoVolume = (onChange: () => void) => emitter.subscribe(onChange);

/** returns the page-wide video volume. */
export const useVideoVolume = () => useSyncExternalStore(subscribeVideoVolume, getVideoVolume);
