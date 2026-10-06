import { device, useStorageValue } from '#/storage';

/**
 * reads the device's keyboard-shortcut preference.
 *
 * @returns whether shortcuts are disabled; defaults to false
 */
export function useKeybindsDisabled() {
	return useStorageValue(device, ['disableKeybinds']) ?? false;
}

/**
 * saves the device's keyboard-shortcut preference.
 *
 * @param value whether to disable keyboard shortcuts
 */
export function setKeybindsDisabled(value: boolean) {
	device.set(['disableKeybinds'], value);
}
