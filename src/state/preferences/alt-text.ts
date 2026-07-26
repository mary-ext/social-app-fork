import { device, useStorageValue } from '#/storage';

/** whether the composer blocks posting images that have no alt text. */
export function useRequireAltTextEnabled() {
	return useStorageValue(device, ['requireAltTextEnabled']) ?? false;
}

export function setRequireAltTextEnabled(value: boolean) {
	device.set(['requireAltTextEnabled'], value);
}
