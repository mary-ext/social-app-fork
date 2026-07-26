import { device, useStorageValue } from '#/storage';

/** whether image embeds draw their alt-text badge at the larger size. */
export function useLargeAltBadgeEnabled() {
	return useStorageValue(device, ['largeAltBadgeEnabled']) ?? false;
}

export function setLargeAltBadgeEnabled(value: boolean) {
	device.set(['largeAltBadgeEnabled'], value);
}
