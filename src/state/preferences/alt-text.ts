import { device, useStorageValue } from '#/storage';

/**
 * returns whether to remind about missing alt text before posting.
 *
 * @returns the saved preference, or true if unset
 */
export function useAltTextReminderEnabled() {
	return useStorageValue(device, ['requireAltTextEnabled']) ?? true;
}

/**
 * sets whether to remind about missing alt text before posting.
 *
 * @param value whether to show the reminder
 */
export function setAltTextReminderEnabled(value: boolean) {
	device.set(['requireAltTextEnabled'], value);
}
