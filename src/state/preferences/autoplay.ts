import { getReducedMotion } from '#/lib/reduced-motion';

import { device, useStorageValue } from '#/storage';

/**
 * returns whether video and GIF autoplay is disabled.
 *
 * @returns `true` if autoplay is disabled
 */
export function useAutoplayDisabled() {
	return useStorageValue(device, ['disableAutoplay']) ?? getReducedMotion();
}

/**
 * sets whether video and GIF autoplay is disabled.
 *
 * @param value whether to disable autoplay
 */
export function setAutoplayDisabled(value: boolean) {
	device.set(['disableAutoplay'], value);
}
