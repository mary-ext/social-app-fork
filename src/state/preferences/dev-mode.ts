import { device, useStorageValue } from '#/storage';

/**
 * returns whether developer mode is enabled.
 *
 * @returns `true` if developer mode is enabled
 */
export function useDevMode() {
	return useStorageValue(device, ['devMode']) ?? false;
}

/**
 * sets developer mode state.
 *
 * @param value whether to enable developer mode
 */
export function setDevMode(value: boolean) {
	device.set(['devMode'], value);
}

/**
 * returns whether developer mode is currently active outside React.
 *
 * @returns `true` if developer mode is active
 */
export function isDevMode() {
	if (import.meta.env.DEV) {
		return true;
	}
	return device.get(['devMode']) ?? false;
}
