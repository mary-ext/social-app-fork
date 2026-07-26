import { device, useStorageValue } from '#/storage';

/** whether dev-only affordances are shown. */
export function useDevMode() {
	return useStorageValue(device, ['devMode']) ?? false;
}

export function setDevMode(value: boolean) {
	device.set(['devMode'], value);
}

let cachedIsDevMode: boolean | undefined;
/**
 * retrieves the dev mode state from storage and caches it in memory. reload the app to apply changes after
 * toggling.
 */
export function isDevMode() {
	if (import.meta.env.DEV) {
		return true;
	}
	if (cachedIsDevMode === undefined) {
		cachedIsDevMode = device.get(['devMode']) ?? false;
	}
	return cachedIsDevMode;
}
