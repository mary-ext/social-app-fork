import { device, useStorageValue } from '#/storage';

/**
 * returns whether large alt-text badges are enabled.
 *
 * @returns `true` if large alt-text badges are enabled
 */
export function useLargeAltBadgeEnabled() {
	return useStorageValue(device, ['largeAltBadgeEnabled']) ?? false;
}

/**
 * sets whether large alt-text badges are enabled.
 *
 * @param value whether to enable large alt-text badges
 */
export function setLargeAltBadgeEnabled(value: boolean) {
	device.set(['largeAltBadgeEnabled'], value);
}
