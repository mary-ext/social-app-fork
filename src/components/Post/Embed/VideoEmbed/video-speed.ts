import { useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

const emitter = new SimpleEventEmitter<[]>();

let speed = 1;

/**
 * gets the shared video playback rate.
 *
 * @returns playback rate
 */
export const getVideoSpeed = () => speed;

/**
 * sets the shared video playback rate.
 *
 * @param value playback rate
 */
export const setVideoSpeed = (value: number) => {
	if (value === speed) {
		return;
	}

	speed = value;
	emitter.emit();
};

/**
 * subscribes to shared playback-rate changes.
 *
 * @param onChange change callback
 * @returns unsubscribe callback
 */
export const subscribeVideoSpeed = (onChange: () => void) => emitter.subscribe(onChange);

/**
 * reads the shared video playback rate.
 *
 * @returns playback rate
 */
export const useVideoSpeed = () => useSyncExternalStore(subscribeVideoSpeed, getVideoSpeed);
