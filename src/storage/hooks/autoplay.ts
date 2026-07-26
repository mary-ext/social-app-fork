import { getReducedMotion } from '#/lib/reduced-motion';

import { device, useStorageValue } from '#/storage';

/** whether videos and GIFs are held still, defaulting to the OS reduced-motion preference. */
export function useAutoplayDisabled() {
	return useStorageValue(device, ['disableAutoplay']) ?? getReducedMotion();
}

export function setAutoplayDisabled(value: boolean) {
	device.set(['disableAutoplay'], value);
}
