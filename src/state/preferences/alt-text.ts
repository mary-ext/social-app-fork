import { device, useStorageValue } from '#/storage';

/**
 * returns whether alt text is required before posting images.
 *
 * @returns `true` if alt text is required
 */
export function useRequireAltTextEnabled() {
	return useStorageValue(device, ['requireAltTextEnabled']) ?? false;
}

/**
 * sets whether alt text is required before posting images.
 *
 * @param value whether to require alt text
 */
export function setRequireAltTextEnabled(value: boolean) {
	device.set(['requireAltTextEnabled'], value);
}
