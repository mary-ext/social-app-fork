import { device, useStorageValue } from '#/storage';

/**
 * returns whether debug feed context is enabled.
 *
 * @returns `true` if debug feed context is enabled
 */
export function useDebugFeedContextEnabled() {
	return useStorageValue(device, ['debugFeedContextEnabled']) ?? false;
}

/**
 * sets whether debug feed context is enabled.
 *
 * @param value whether to enable debug feed context
 */
export function setDebugFeedContextEnabled(value: boolean) {
	device.set(['debugFeedContextEnabled'], value);
}
